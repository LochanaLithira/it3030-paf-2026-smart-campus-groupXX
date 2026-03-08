package com.smartcampus.backend.dto.auth;

import java.util.List;
import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        UserInfo user
) {
    public record UserInfo(
            UUID userId,
            String email,
            String fullName,
            String profilePictureUrl,
            List<String> roles,
            List<String> permissions
    ) {}
}
