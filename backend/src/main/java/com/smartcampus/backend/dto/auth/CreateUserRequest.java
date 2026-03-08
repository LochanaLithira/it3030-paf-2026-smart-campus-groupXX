package com.smartcampus.backend.dto.auth;

import jakarta.validation.constraints.*;
import java.util.UUID;

public record CreateUserRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100)
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        String password,

        /** Optional — assign a role at creation time. If null, user has no role. */
        UUID roleId
) {}
