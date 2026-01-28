package kr.codeit.onboarding.security;

import kr.codeit.onboarding.domain.entity.User;
import kr.codeit.onboarding.domain.enums.UserRole;
import kr.codeit.onboarding.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityContext {

    /**
     * Get the currently authenticated user from Spring Security context
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new UnauthorizedException("User not authenticated");
        }
        return (User) authentication.getPrincipal();
    }

    /**
     * Get the current user's ID
     */
    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    /**
     * Get the current user's role
     */
    public UserRole getCurrentUserRole() {
        return getCurrentUser().getRole();
    }

    /**
     * Check if the current user is a PM
     */
    public boolean isPm() {
        return getCurrentUserRole() == UserRole.PM;
    }

    /**
     * Check if the current user is an instructor
     */
    public boolean isInstructor() {
        return getCurrentUserRole() == UserRole.INSTRUCTOR;
    }

    /**
     * Verify that the current user is a PM, throw exception if not
     */
    public void requirePm() {
        if (!isPm()) {
            throw new UnauthorizedException("This action requires PM role");
        }
    }

    /**
     * Verify that the current user is an instructor, throw exception if not
     */
    public void requireInstructor() {
        if (!isInstructor()) {
            throw new UnauthorizedException("This action requires Instructor role");
        }
    }
}
