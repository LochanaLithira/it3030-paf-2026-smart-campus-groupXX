package com.smartcampus.backend.security;

import com.smartcampus.backend.model.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Adapter that bridges our {@link User} JPA entity with Spring Security's
 * {@link UserDetails} and {@link OAuth2User} interfaces.
 */
public class UserPrincipal implements UserDetails, OAuth2User {

    @Getter
    private final UUID userId;
    @Getter
    private final String email;
    private final String password;
    @Getter
    private final String fullName;
    private final boolean active;
    @Getter
    private final List<String> roles;
    @Getter
    private final List<String> permissions;
    private final Collection<GrantedAuthority> authorities;
    private Map<String, Object> oauthAttributes = Map.of();

    private UserPrincipal(UUID userId, String email, String password, String fullName,
                          boolean active, List<String> roles, List<String> permissions) {
        this.userId = userId;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.active = active;
        this.roles = roles;
        this.permissions = permissions;
        this.authorities = permissions.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toUnmodifiableList());
    }

    public static UserPrincipal from(User user) {
        List<String> roles = user.getUserRoles().stream()
                .filter(ur -> ur.getRole() != null)
                .map(ur -> ur.getRole().getRoleName())
                .distinct()
                .toList();

        List<String> permissions = user.getUserRoles().stream()
                .filter(ur -> ur.getRole() != null)
                .flatMap(ur -> ur.getRole().getPermissions().stream())
                .distinct()
                .toList();

        return new UserPrincipal(
                user.getUserId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getFullName(),
                user.isActive(),
                roles,
                permissions
        );
    }

    public UserPrincipal withOAuthAttributes(Map<String, Object> attributes) {
        this.oauthAttributes = attributes;
        return this;
    }

    // ===== UserDetails =====

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return active; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return active; }

    // ===== OAuth2User =====

    @Override public Map<String, Object> getAttributes() { return oauthAttributes; }
    @Override public String getName() { return userId.toString(); }
}
