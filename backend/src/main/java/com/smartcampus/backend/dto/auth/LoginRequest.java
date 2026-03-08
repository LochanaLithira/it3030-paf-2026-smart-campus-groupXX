package com.smartcampus.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Authorization code is required")
        String code,

        @NotBlank(message = "Redirect URI is required")
        String redirectUri
) {}
