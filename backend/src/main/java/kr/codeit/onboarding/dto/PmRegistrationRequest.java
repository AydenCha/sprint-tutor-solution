package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for PM (Project Manager) user registration.
 * <p>
 * PM users must have a @codeit.com email address and a strong password
 * meeting security requirements. After registration, email verification
 * is required before the account becomes fully active.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "PM registration request with email and password")
public class PmRegistrationRequest {

    /**
     * Minimum password length requirement.
     */
    public static final int MIN_PASSWORD_LENGTH = 8;

    /**
     * Maximum field length for security.
     */
    public static final int MAX_FIELD_LENGTH = 255;

    /**
     * Email domain restriction pattern for Codeit employees.
     */
    public static final String CODEIT_EMAIL_PATTERN = "^[a-zA-Z0-9._%+-]+@codeit\\.com$";

    /**
     * Password must contain at least one special character.
     */
    public static final String SPECIAL_CHAR_PATTERN = ".*[!@#$%^&*(),.?\":{}|<>].*";

    /**
     * PM user's full name.
     */
    @Schema(
        description = "PM's full name",
        example = "Jane Smith",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Name is required")
    @Size(max = MAX_FIELD_LENGTH, message = "Name must not exceed " + MAX_FIELD_LENGTH + " characters")
    private String name;

    /**
     * PM user's email address.
     * <p>
     * Must be a valid @codeit.com email address.
     * This email will be used for:
     * <ul>
     *   <li>Email verification</li>
     *   <li>Login authentication</li>
     *   <li>System notifications</li>
     * </ul>
     */
    @Schema(
        description = "PM's email address - must be @codeit.com",
        example = "jane.smith@codeit.com",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Pattern(regexp = CODEIT_EMAIL_PATTERN, message = "Only @codeit.com email addresses are allowed")
    @Size(max = MAX_FIELD_LENGTH, message = "Email must not exceed " + MAX_FIELD_LENGTH + " characters")
    private String email;

    /**
     * PM user's password.
     * <p>
     * Password requirements:
     * <ul>
     *   <li>Minimum 8 characters</li>
     *   <li>At least one special character (!@#$%^&*(),.?\":{}|<>)</li>
     * </ul>
     */
    @Schema(
        description = "Password - minimum 8 characters with at least one special character",
        example = "SecurePass123!",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Password is required")
    @Size(min = MIN_PASSWORD_LENGTH, max = MAX_FIELD_LENGTH,
          message = "Password must be between " + MIN_PASSWORD_LENGTH + " and " + MAX_FIELD_LENGTH + " characters")
    @Pattern(regexp = SPECIAL_CHAR_PATTERN, message = "Password must contain at least one special character")
    private String password;
}
