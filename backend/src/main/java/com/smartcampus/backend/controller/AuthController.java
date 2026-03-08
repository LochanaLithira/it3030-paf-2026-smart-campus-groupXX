package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.auth.AuthResponse;
import com.smartcampus.backend.dto.auth.LoginRequest;
import com.smartcampus.backend.dto.auth.RefreshTokenRequest;
import com.smartcampus.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication", description = "Google OAuth2 login, token refresh, and logout")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Exchange Google authorization code for JWT tokens")
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.loginWithGoogleCode(request);

        // Store refresh token in HttpOnly cookie for the browser
        Cookie refreshCookie = new Cookie("refreshToken", authResponse.refreshToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false); // set true in production (HTTPS)
        refreshCookie.setPath("/auth/refresh");
        refreshCookie.setMaxAge((int) (7 * 24 * 3600));
        response.addCookie(refreshCookie);

        return ResponseEntity.ok(authResponse);
    }

    @Operation(summary = "Refresh access token using a valid refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestBody(required = false) RefreshTokenRequest body,
            @CookieValue(name = "refreshToken", required = false) String cookieToken) {

        // Prefer cookie, fall back to request body
        String token = StringUtils.hasText(cookieToken) ? cookieToken
                : (body != null ? body.refreshToken() : null);

        if (!StringUtils.hasText(token)) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(authService.refresh(new RefreshTokenRequest(token)));
    }

    @Operation(summary = "Invalidate the refresh token (logout)")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "refreshToken", required = false) String cookieToken,
            @RequestBody(required = false) RefreshTokenRequest body,
            HttpServletResponse response) {

        String token = StringUtils.hasText(cookieToken) ? cookieToken
                : (body != null ? body.refreshToken() : null);

        authService.logout(token);

        // Expire the cookie
        Cookie expiredCookie = new Cookie("refreshToken", "");
        expiredCookie.setHttpOnly(true);
        expiredCookie.setPath("/auth/refresh");
        expiredCookie.setMaxAge(0);
        response.addCookie(expiredCookie);

        return ResponseEntity.noContent().build();
    }
}
