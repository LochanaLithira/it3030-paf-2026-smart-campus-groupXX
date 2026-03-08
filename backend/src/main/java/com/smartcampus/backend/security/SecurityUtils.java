package com.smartcampus.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/**
 * Utility methods for accessing the authenticated principal in service/controller code.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    /**
     * Returns the {@link UserPrincipal} from the current SecurityContext.
     *
     * @throws IllegalStateException if no authentication is present
     */
    public static UserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new IllegalStateException("No authenticated user in context");
        }
        return principal;
    }

    public static UUID getCurrentUserId() {
        return getCurrentPrincipal().getUserId();
    }
}
