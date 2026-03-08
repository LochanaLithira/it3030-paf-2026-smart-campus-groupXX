package com.smartcampus.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.stream.Collectors;

/**
 * Enables {@code @PreAuthorize("hasPermission(null, 'PERMISSION_NAME')")} expressions.
 * The permission name must exactly match one of the entries in the user's roles.permissions array.
 */
@Component
@RequiredArgsConstructor
public class CustomPermissionEvaluator implements PermissionEvaluator {

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || permission == null) return false;
        String requiredPermission = permission.toString();
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals(requiredPermission));
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId,
                                 String targetType, Object permission) {
        return hasPermission(authentication, null, permission);
    }
}
