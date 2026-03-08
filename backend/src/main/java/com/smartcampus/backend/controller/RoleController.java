package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.auth.RoleResponse;
import com.smartcampus.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Roles", description = "System roles and permissions catalogue")
@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

    private final UserService userService;

    @Operation(summary = "List all roles with their permissions")
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RoleResponse>> listRoles() {
        return ResponseEntity.ok(userService.listAllRoles());
    }
}
