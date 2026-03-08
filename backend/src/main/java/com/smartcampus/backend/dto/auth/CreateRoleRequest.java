package com.smartcampus.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateRoleRequest(
        @NotBlank(message = "Role name is required")
        @Size(min = 2, max = 50, message = "Role name must be 2–50 characters")
        String roleName,

        @NotNull(message = "Permissions list is required")
        List<String> permissions
) {}
