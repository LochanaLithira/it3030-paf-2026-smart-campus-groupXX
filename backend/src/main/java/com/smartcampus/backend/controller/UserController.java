package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.auth.RoleResponse;
import com.smartcampus.backend.dto.auth.UpdateRolesRequest;
import com.smartcampus.backend.dto.auth.UserResponse;
import com.smartcampus.backend.dto.common.PageResponse;
import com.smartcampus.backend.security.SecurityUtils;
import com.smartcampus.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Users & Roles", description = "User profile management, role assignment, and listing")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "List all users (ADMIN only)")
    @GetMapping
    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    public ResponseEntity<PageResponse<UserResponse>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {

        return ResponseEntity.ok(
                PageResponse.from(userService.listUsers(search, role, isActive, pageable)));
    }

    @Operation(summary = "Get the current authenticated user's profile")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.getCurrentUser(userId));
    }

    @Operation(summary = "Get a specific user by ID (ADMIN only)")
    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @Operation(summary = "Assign roles to a user (ADMIN only)")
    @PatchMapping("/{userId}/roles")
    @PreAuthorize("hasAuthority('MANAGE_ROLES')")
    public ResponseEntity<UserResponse> updateRoles(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateRolesRequest request) {

        return ResponseEntity.ok(userService.updateUserRoles(userId, request));
    }

    @Operation(summary = "Deactivate a user (ADMIN only)")
    @PatchMapping("/{userId}/deactivate")
    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    public ResponseEntity<Void> deactivateUser(@PathVariable UUID userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.noContent().build();
    }

    // ─── Roles ───

    @Operation(summary = "List all roles with their permissions")
    @GetMapping("/roles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RoleResponse>> listRoles() {
        return ResponseEntity.ok(userService.listAllRoles());
    }
}
