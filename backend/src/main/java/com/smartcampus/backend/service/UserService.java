package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.auth.CreateRoleRequest;
import com.smartcampus.backend.dto.auth.CreateUserRequest;
import com.smartcampus.backend.dto.auth.RoleResponse;
import com.smartcampus.backend.dto.auth.UpdateRoleRequest;
import com.smartcampus.backend.dto.auth.UpdateRolesRequest;
import com.smartcampus.backend.dto.auth.UserResponse;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.model.UserRole;
import com.smartcampus.backend.repository.RoleRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository     userRepository;
    private final RoleRepository     roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder    passwordEncoder;

    // ─── Create (admin) ─────────────────────────────────────────────────────

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("A user with this email already exists");
        }

        User user = User.builder()
                .email(request.email())
                .fullName(request.fullName())
                .passwordHash(passwordEncoder.encode(request.password()))
                .isActive(true)
                .build();

        User saved = userRepository.save(user);

        if (request.roleId() != null) {
            Role role = roleRepository.findById(request.roleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Role", request.roleId()));
            UserRole userRole = UserRole.builder()
                    .userId(saved.getUserId())
                    .roleId(role.getRoleId())
                    .role(role)
                    .assignedAt(OffsetDateTime.now())
                    .build();
            saved.getUserRoles().add(userRole);
            saved = userRepository.save(saved);
        }

        return toUserResponse(userRepository.findByIdWithRoles(saved.getUserId()).orElseThrow());
    }

    // ─── Read ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<UserResponse> listUsers(String search, String role, Boolean isActive, Pageable pageable) {
        if (role != null && !role.isBlank()) {
            return userRepository.findAllByRoleName(role, pageable)
                    .map(this::toUserResponse);
        }
        return userRepository.findAllWithFilters(search, isActive, pageable)
                .map(this::toUserResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID userId) {
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return toUserResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UUID userId) {
        return getUserById(userId);
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> listAllRoles() {
        return roleRepository.findAll().stream()
                .map(r -> new RoleResponse(r.getRoleId(), r.getRoleName(), r.getPermissions()))
                .toList();
    }

    // ─── Write ───────────────────────────────────────────────────────────────

    @Transactional
    public UserResponse updateUserRoles(UUID userId, UpdateRolesRequest request) {
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        List<Role> roles = roleRepository.findByRoleNameIn(request.roleNames());
        if (roles.size() != request.roleNames().size()) {
            List<String> found = roles.stream().map(Role::getRoleName).toList();
            List<String> missing = request.roleNames().stream()
                    .filter(rn -> !found.contains(rn))
                    .toList();
            throw new ResourceNotFoundException("Roles not found: " + missing);
        }

        // Replace all current roles
        userRoleRepository.deleteAllByUserId(userId);
        user.getUserRoles().clear();

        roles.forEach(role -> {
            UserRole userRole = UserRole.builder()
                    .userId(userId)
                    .roleId(role.getRoleId())
                    .role(role)
                    .assignedAt(OffsetDateTime.now())
                    .build();
            user.getUserRoles().add(userRole);
        });

        User saved = userRepository.save(user);
        log.info("Updated roles for user {} to: {}", userId, request.roleNames());
        return toUserResponse(saved);
    }

    @Transactional
    public void deactivateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (!user.isActive()) {
            throw new ConflictException("User is already deactivated");
        }
        user.setActive(false);
        userRepository.save(user);
        log.info("Deactivated user: {}", userId);
    }

    // ─── Role CRUD ───────────────────────────────────────────────────────────

    @Transactional
    public RoleResponse createRole(CreateRoleRequest request) {
        String normalizedName = request.roleName().toUpperCase().strip();
        if (roleRepository.findByRoleName(normalizedName).isPresent()) {
            throw new ConflictException("Role '" + normalizedName + "' already exists");
        }
        Role role = Role.builder()
                .roleName(normalizedName)
                .permissions(request.permissions())
                .build();
        Role saved = roleRepository.save(role);
        log.info("Created role: {}", normalizedName);
        return toRoleResponse(saved);
    }

    @Transactional
    public RoleResponse updateRole(UUID roleId, UpdateRoleRequest request) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", roleId));
        role.setPermissions(request.permissions());
        Role saved = roleRepository.save(role);
        log.info("Updated permissions for role: {}", role.getRoleName());
        return toRoleResponse(saved);
    }

    @Transactional
    public void deleteRole(UUID roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", roleId));
        roleRepository.delete(role);
        log.info("Deleted role: {}", role.getRoleName());
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    public RoleResponse toRoleResponse(Role role) {
        return new RoleResponse(role.getRoleId(), role.getRoleName(), role.getPermissions());
    }

    public UserResponse toUserResponse(User user) {
        List<String> roleNames = user.getUserRoles().stream()
                .filter(ur -> ur.getRole() != null)
                .map(ur -> ur.getRole().getRoleName())
                .distinct()
                .toList();

        List<String> permissions = user.getUserRoles().stream()
                .filter(ur -> ur.getRole() != null)
                .flatMap(ur -> ur.getRole().getPermissions().stream())
                .distinct()
                .toList();

        return new UserResponse(
                user.getUserId(),
                user.getEmail(),
                user.getFullName(),
                user.getProfilePictureUrl(),
                user.isActive(),
                roleNames,
                permissions,
                user.getCreatedAt()
        );
    }
}
