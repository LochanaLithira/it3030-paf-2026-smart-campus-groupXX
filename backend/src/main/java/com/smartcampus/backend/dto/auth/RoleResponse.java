package com.smartcampus.backend.dto.auth;

import java.util.List;
import java.util.UUID;

public record RoleResponse(
        UUID roleId,
        String roleName,
        List<String> permissions
) {}
