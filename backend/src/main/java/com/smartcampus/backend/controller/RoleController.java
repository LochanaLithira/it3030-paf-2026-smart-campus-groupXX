package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.auth.CreateRoleRequest;
import com.smartcampus.backend.dto.auth.RoleResponse;
import com.smartcampus.backend.dto.auth.UpdateRoleRequest;
import com.smartcampus.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Roles", description = "System roles and permissions management")
@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

    private final UserService userService;

    @Operation(summary = "List all roles with their permissions")
    @GetMapping
    @PreAuthorize("hasAuthority('roles.read')")
    public ResponseEntity<List<RoleResponse>> listRoles() {
        return ResponseEntity.ok(userService.listAllRoles());
    }

    @Operation(summary = "Create a new role with permissions (ADMIN only)")
    @PostMapping
    @PreAuthorize("hasAuthority('roles.create')")
    public ResponseEntity<RoleResponse> createRole(@Valid @RequestBody CreateRoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createRole(request));
    }

    @Operation(summary = "Update a role's permissions (ADMIN only)")
    @PutMapping("/{roleId}")
    @PreAuthorize("hasAuthority('roles.update')")
    public ResponseEntity<RoleResponse> updateRole(
            @PathVariable UUID roleId,
            @Valid @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(userService.updateRole(roleId, request));
    }

    @Operation(summary = "Delete a role (ADMIN only)")
    @DeleteMapping("/{roleId}")
    @PreAuthorize("hasAuthority('roles.delete')")
    public ResponseEntity<Void> deleteRole(@PathVariable UUID roleId) {
        userService.deleteRole(roleId);
        return ResponseEntity.noContent().build();
    }
}

