package com.smartcampus.backend.security;

import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.model.UserRole;
import com.smartcampus.backend.repository.RoleRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Spring Security hook that upserts a user from Google's profile on each OAuth2 login.
 * Used when the backend handles the OAuth2 redirect flow itself.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final String DEFAULT_ROLE = "USER";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String provider   = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        String providerId = (String) attributes.get("sub");
        String email      = (String) attributes.get("email");
        String name       = (String) attributes.get("name");
        String picture    = (String) attributes.get("picture");

        User user = userRepository
                .findByOauthProviderAndOauthProviderId(provider, providerId)
                .orElseGet(() -> userRepository
                        .findByEmail(email)
                        .orElseGet(() -> createNewUser(email, name, picture, provider, providerId)));

        // Keep profile in sync with latest data from Google
        user.setFullName(name);
        user.setProfilePictureUrl(picture);
        if (user.getOauthProvider() == null) {
            user.setOauthProvider(provider);
            user.setOauthProviderId(providerId);
        }
        userRepository.save(user);

        UserPrincipal principal = UserPrincipal.from(userRepository.findByIdWithRoles(user.getUserId())
                .orElseThrow(() -> new OAuth2AuthenticationException("User not found after upsert")));
        return principal.withOAuthAttributes(attributes);
    }

    private User createNewUser(String email, String name, String picture,
                               String provider, String providerId) {
        Role defaultRole = roleRepository.findByRoleName(DEFAULT_ROLE)
                .orElseThrow(() -> new IllegalStateException("Default role USER not found in database"));

        User user = User.builder()
                .email(email)
                .fullName(name)
                .profilePictureUrl(picture)
                .oauthProvider(provider)
                .oauthProviderId(providerId)
                .isActive(true)
                .build();

        UserRole userRole = UserRole.builder()
                .userId(null) // set after persist
                .roleId(defaultRole.getRoleId())
                .role(defaultRole)
                .assignedAt(OffsetDateTime.now())
                .build();
        user.getUserRoles().add(userRole);

        User saved = userRepository.save(user);
        // Fix the composite key now that we have the generated userId
        saved.getUserRoles().forEach(ur -> ur.setUserId(saved.getUserId()));
        log.info("New user registered via OAuth2: {}", email);
        return saved;
    }
}
