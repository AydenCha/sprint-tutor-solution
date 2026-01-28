package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

/**
 * PasswordResetToken entity for password reset functionality.
 *
 * <p>Manages password reset tokens sent via email when users request to reset
 * their forgotten passwords. Tokens have a mandatory expiration time for security.
 *
 * <p>Key features:
 * <ul>
 *   <li>UUID-based secure tokens</li>
 *   <li>Mandatory expiration (typically 1 hour)</li>
 *   <li>One-time use tracking</li>
 *   <li>Multiple tokens per user allowed (many-to-one relationship)</li>
 * </ul>
 *
 * <p><strong>Security notes:</strong>
 * <ul>
 *   <li>Tokens should expire after short period (e.g., 1 hour)</li>
 *   <li>Tokens can only be used once</li>
 *   <li>Old tokens should be invalidated when new ones are issued</li>
 * </ul>
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "password_reset_tokens", indexes = {
    @Index(name = "idx_password_reset_token", columnList = "token"),
    @Index(name = "idx_password_reset_user", columnList = "user_id"),
    @Index(name = "idx_password_reset_expires_at", columnList = "expires_at"),
    @Index(name = "idx_password_reset_used_at", columnList = "used_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique password reset token (UUID-based).
     * Sent to user's email and used to authorize password reset.
     */
    @NotBlank(message = "Token is required")
    @Column(nullable = false, unique = true, length = 64)
    private String token;

    /**
     * User associated with this password reset token.
     * Many-to-one relationship allows multiple tokens per user
     * (e.g., if user requests reset multiple times).
     */
    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Token expiration timestamp (mandatory).
     * Typically set to 1 hour from creation for security.
     * After this time, the token cannot be used.
     */
    @NotNull(message = "Expiration time is required")
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Timestamp when the token was used to reset password.
     * Null if not yet used.
     * Once set, the token cannot be used again.
     */
    @Column(name = "used_at")
    private LocalDateTime usedAt;

    /**
     * Checks if this token has expired.
     *
     * @return true if the current time is after the expiration time
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Checks if this token has already been used.
     *
     * @return true if usedAt is not null
     */
    public boolean isUsed() {
        return usedAt != null;
    }

    /**
     * Checks if this token is valid for password reset.
     * A token is valid if it hasn't expired and hasn't been used yet.
     *
     * @return true if the token can be used for password reset
     */
    public boolean isValid() {
        return !isExpired() && !isUsed();
    }

    /**
     * Marks this token as used by setting the usage timestamp.
     * After this, the token cannot be used again.
     */
    public void markAsUsed() {
        this.usedAt = LocalDateTime.now();
    }

    /**
     * Gets the time remaining until expiration.
     *
     * @return duration in seconds, or 0 if already expired
     */
    public long getSecondsUntilExpiration() {
        if (isExpired()) {
            return 0;
        }
        return java.time.Duration.between(LocalDateTime.now(), expiresAt).getSeconds();
    }

    /**
     * Gets a human-readable time remaining string.
     *
     * @return formatted time remaining (e.g., "45 minutes", "Expired")
     */
    public String getFormattedTimeRemaining() {
        if (isExpired()) {
            return "Expired";
        }

        long seconds = getSecondsUntilExpiration();
        long minutes = seconds / 60;
        long hours = minutes / 60;

        if (hours > 0) {
            return hours + " hour" + (hours > 1 ? "s" : "");
        } else if (minutes > 0) {
            return minutes + " minute" + (minutes > 1 ? "s" : "");
        } else {
            return seconds + " second" + (seconds != 1 ? "s" : "");
        }
    }

    /**
     * Invalidates this token by marking it as used.
     * Useful when issuing a new token to the same user.
     */
    public void invalidate() {
        markAsUsed();
    }
}
