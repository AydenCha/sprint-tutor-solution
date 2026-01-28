package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

/**
 * EmailVerificationToken entity for email verification during PM registration.
 *
 * <p>Manages email verification tokens that are sent to users during registration.
 * Tokens can optionally expire after a certain period for security.
 *
 * <p>Key features:
 * <ul>
 *   <li>UUID-based secure tokens</li>
 *   <li>Optional expiration (can be null for no expiration)</li>
 *   <li>Verification timestamp tracking</li>
 *   <li>One token per user (one-to-one relationship)</li>
 * </ul>
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "email_verification_tokens", indexes = {
    @Index(name = "idx_verification_token", columnList = "token"),
    @Index(name = "idx_verification_user", columnList = "user_id"),
    @Index(name = "idx_verification_expires_at", columnList = "expires_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerificationToken extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique verification token (UUID-based).
     * Sent to user's email and used to verify email ownership.
     */
    @NotBlank(message = "Token is required")
    @Column(nullable = false, unique = true, length = 64)
    private String token;

    /**
     * User associated with this verification token.
     * One-to-one relationship ensures one token per user.
     */
    @NotNull(message = "User is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * Token expiration timestamp.
     * If null, the token never expires.
     * If set, the token becomes invalid after this time.
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * Timestamp when the email was verified.
     * Null if not yet verified.
     */
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    /**
     * Checks if this token has expired.
     *
     * @return true if the token has expired, false otherwise
     */
    public boolean isExpired() {
        // If expiresAt is null, token never expires
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Checks if this token has been used for verification.
     *
     * @return true if verifiedAt is not null
     */
    public boolean isVerified() {
        return verifiedAt != null;
    }

    /**
     * Checks if this token is valid for verification.
     * A token is valid if it hasn't expired and hasn't been used yet.
     *
     * @return true if the token can be used for verification
     */
    public boolean isValid() {
        return !isExpired() && !isVerified();
    }

    /**
     * Marks this token as verified by setting the verification timestamp.
     */
    public void markAsVerified() {
        this.verifiedAt = LocalDateTime.now();
    }

    /**
     * Checks if this token has an expiration time set.
     *
     * @return true if expiresAt is not null
     */
    public boolean hasExpiration() {
        return expiresAt != null;
    }

    /**
     * Gets the time remaining until expiration.
     *
     * @return duration in seconds, or null if no expiration or already expired
     */
    public Long getSecondsUntilExpiration() {
        if (expiresAt == null || isExpired()) {
            return null;
        }
        return java.time.Duration.between(LocalDateTime.now(), expiresAt).getSeconds();
    }
}
