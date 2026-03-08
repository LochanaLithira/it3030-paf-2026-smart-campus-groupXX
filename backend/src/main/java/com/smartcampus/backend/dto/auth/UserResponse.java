package com.smartcampus.backend.dto.auth;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record UserResponse(
        UUID userId,
        String email,
        String fullName,
        String profilePictureUrl,
        boolean isActive,
        List<String> roles,
        List<String> permissions,
        OffsetDateTime createdAt
) {}
