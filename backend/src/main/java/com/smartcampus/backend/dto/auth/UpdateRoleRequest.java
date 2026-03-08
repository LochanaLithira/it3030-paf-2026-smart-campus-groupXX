package com.smartcampus.backend.dto.auth;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdateRoleRequest(
        @NotNull(message = "Permissions list is required")
        List<String> permissions
) {}
