package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.auth.AuthResponse;
import com.smartcampus.backend.dto.auth.LoginRequest;
import com.smartcampus.backend.dto.auth.RefreshTokenRequest;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.exception.UnauthorizedException;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.model.UserRole;
import com.smartcampus.backend.repository.RoleRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.security.JwtTokenProvider;
import com.smartcampus.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Handles the SPA OAuth2 code-exchange flow:
 * Frontend → sends code → we exchange with Google → upsert user → return JWT pair.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String GOOGLE_TOKEN_URL   = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_USERINFO_URL = "https://www.googleapis.com/userinfo/v2/me";
    private static final String DEFAULT_ROLE        = "USER";

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String googleClientSecret;

    private final UserRepository     userRepository;
    private final RoleRepository     roleRepository;
    private final JwtTokenProvider   jwtTokenProvider;
    private final RestTemplate       restTemplate;

    /** In-memory blacklist of invalidated refresh-token JTIs. Replace with Redis in production. */
    private final Set<String> invalidatedTokens = ConcurrentHashMap.newKeySet();

    // ─── Login via Google Code ───────────────────────────────────────────────

    @Transactional
    public AuthResponse loginWithGoogleCode(LoginRequest request) {
        Map<String, Object> googleTokens = exchangeCodeWithGoogle(
                request.code(), request.redirectUri());
        String googleAccessToken = (String) googleTokens.get("access_token");

        Map<String, Object> userInfo = fetchGoogleUserInfo(googleAccessToken);

        String email      = (String) userInfo.get("email");
        String name       = (String) userInfo.get("name");
        String picture    = (String) userInfo.getOrDefault("picture", null);
        String providerId = (String) userInfo.get("id");

        User user = upsertUser(email, name, picture, "GOOGLE", providerId);
        return buildAuthResponse(user);
    }

    // ─── Refresh Token ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse refresh(RefreshTokenRequest request) {
        String token = request.refreshToken();

        if (!jwtTokenProvider.validateToken(token) || !jwtTokenProvider.isRefreshToken(token)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String jti = jwtTokenProvider.getJti(token);
        if (jti != null && invalidatedTokens.contains(jti)) {
            throw new UnauthorizedException("Refresh token has been revoked");
        }

        UUID userId = jwtTokenProvider.getUserId(token);
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!user.isActive()) {
            throw new UnauthorizedException("User account is deactivated");
        }

        return buildAuthResponse(user);
    }

    // ─── Logout ──────────────────────────────────────────────────────────────

    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            String jti = jwtTokenProvider.getJti(refreshToken);
            if (jti != null) {
                invalidatedTokens.add(jti);
            }
        }
    }

    // ─── Internals ───────────────────────────────────────────────────────────

    private Map<String, Object> exchangeCodeWithGoogle(String code, String redirectUri) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code",          code);
        params.add("client_id",     googleClientId);
        params.add("client_secret", googleClientSecret);
        params.add("redirect_uri",  redirectUri);
        params.add("grant_type",    "authorization_code");

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                GOOGLE_TOKEN_URL,
                HttpMethod.POST,
                new HttpEntity<>(params, headers),
                new ParameterizedTypeReference<>() {}
        );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new UnauthorizedException("Failed to exchange authorization code with Google");
        }
        return response.getBody();
    }

    private Map<String, Object> fetchGoogleUserInfo(String googleAccessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(googleAccessToken);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                GOOGLE_USERINFO_URL,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {}
        );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new UnauthorizedException("Failed to fetch user info from Google");
        }
        return response.getBody();
    }

    private User upsertUser(String email, String name, String picture,
                            String provider, String providerId) {
        Optional<User> existing = userRepository.findByOauthProviderAndOauthProviderId(provider, providerId)
                .or(() -> userRepository.findByEmail(email));

        if (existing.isPresent()) {
            User user = existing.get();
            user.setFullName(name);
            user.setProfilePictureUrl(picture);
            if (user.getOauthProviderId() == null) {
                user.setOauthProvider(provider);
                user.setOauthProviderId(providerId);
            }
            return userRepository.save(user);
        }

        // New user — assign default USER role
        Role defaultRole = roleRepository.findByRoleName(DEFAULT_ROLE)
                .orElseThrow(() -> new IllegalStateException("Default role USER not seeded"));

        User newUser = User.builder()
                .email(email)
                .fullName(name)
                .profilePictureUrl(picture)
                .oauthProvider(provider)
                .oauthProviderId(providerId)
                .isActive(true)
                .build();

        User saved = userRepository.save(newUser);

        UserRole userRole = UserRole.builder()
                .userId(saved.getUserId())
                .roleId(defaultRole.getRoleId())
                .role(defaultRole)
                .assignedAt(OffsetDateTime.now())
                .build();
        saved.getUserRoles().add(userRole);
        userRepository.save(saved);

        log.info("New user created: {}", email);
        return userRepository.findByIdWithRoles(saved.getUserId()).orElseThrow();
    }

    private AuthResponse buildAuthResponse(User user) {
        UserPrincipal principal = UserPrincipal.from(user);

        String accessToken  = jwtTokenProvider.generateAccessToken(principal);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUserId());
        long   expiresIn    = jwtTokenProvider.getAccessTokenExpirySeconds();

        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                user.getUserId(),
                user.getEmail(),
                user.getFullName(),
                user.getProfilePictureUrl(),
                principal.getRoles(),
                principal.getPermissions()
        );

        return new AuthResponse(accessToken, refreshToken, expiresIn, userInfo);
    }
}
