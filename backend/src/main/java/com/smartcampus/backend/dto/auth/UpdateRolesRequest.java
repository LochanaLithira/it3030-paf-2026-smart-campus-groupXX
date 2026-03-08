package com.smartcampus.backend.dto.auth;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpdateRolesRequest(
        @NotEmpty(message = "Role names list must not be empty")
        List<String> roleNames
) {}
