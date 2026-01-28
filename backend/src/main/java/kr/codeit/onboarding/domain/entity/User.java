package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import kr.codeit.onboarding.domain.enums.UserRole;
import lombok.*;

import java.time.LocalDateTime;

/**
 * User entity representing a user account in the onboarding system.
 *
 * <p>Users can have different roles (PM or INSTRUCTOR) and must verify their email
 * before gaining full access. The entity supports soft deletion to maintain data integrity
 * and audit trails.
 *
 * <p>Security features:
 * <ul>
 *   <li>Password stored as hash only (never plaintext)</li>
 *   <li>Email verification required before account activation</li>
 *   <li>Soft delete mechanism for user removal</li>
 * </ul>
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_role", columnList = "role"),
    @Index(name = "idx_user_deleted_at", columnList = "deleted_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User's email address (used as login identifier).
     * Must be unique across all users (including soft-deleted).
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Column(nullable = false, unique = true, columnDefinition = "VARCHAR(255)")
    private String email;

    /**
     * Hashed password for authentication.
     * Null for OAuth users or accounts pending setup.
     */
    @Column(name = "password_hash")
    private String passwordHash;

    /**
     * User's display name.
     */
    @NotBlank(message = "Name is required")
    @Column(nullable = false, columnDefinition = "VARCHAR(255)")
    private String name;

    /**
     * User's role in the system (PM or INSTRUCTOR).
     */
    @NotNull(message = "User role is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    /**
     * Email verification status.
     * True if the user has verified their email address.
     */
    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private Boolean emailVerified = false;

    /**
     * Account enabled status.
     * Typically enabled after email verification is complete.
     * Disabled accounts cannot login.
     */
    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private Boolean enabled = false;

    /**
     * Soft delete timestamp.
     * When not null, indicates the user account has been deleted.
     * Soft-deleted accounts are retained for audit purposes.
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * Checks if the user account has been soft-deleted.
     *
     * @return true if the account is deleted, false otherwise
     */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * Checks if the user account is active and can login.
     *
     * @return true if the account is enabled, email is verified, and not deleted
     */
    public boolean isActive() {
        return enabled && emailVerified && !isDeleted();
    }

    /**
     * Marks the user as verified and enables the account.
     * This is typically called after successful email verification.
     */
    public void verifyEmail() {
        this.emailVerified = true;
        this.enabled = true;
    }

    /**
     * Soft deletes the user account by setting the deletion timestamp.
     */
    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
        this.enabled = false;
    }

    /**
     * Checks if the user has a specific role.
     *
     * @param role the role to check
     * @return true if the user has the specified role
     */
    public boolean hasRole(UserRole role) {
        return this.role == role;
    }
}
