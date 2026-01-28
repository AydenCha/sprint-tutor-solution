package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for password reset.
 * <p>
 * This DTO is used when a user resets their password using a reset token
 * received via email. The token is validated and the password is updated.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Password reset request with token and new password")
public class PasswordResetRequest {

    /**
     * Minimum password length requirement.
     */
    public static final int MIN_PASSWORD_LENGTH = 8;

    /**
     * Maximum field length for security.
     */
    public static final int MAX_FIELD_LENGTH = 255;

    /**
     * Password reset token from email.
     */
    @Schema(
        description = "Password reset token received via email",
        example = "a0de50ce-2477-489d-a779-1dcd999361d9",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Reset token is required")
    @Size(max = MAX_FIELD_LENGTH, message = "Token must not exceed " + MAX_FIELD_LENGTH + " characters")
    private String token;

    /**
     * New password for the user account.
     * <p>
     * Password requirements:
     * <ul>
     *   <li>Minimum 8 characters</li>
     * </ul>
     */
    @Schema(
        description = "New password - minimum 8 characters",
        example = "NewSecurePass123!",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "New password is required")
    @Size(min = MIN_PASSWORD_LENGTH, max = MAX_FIELD_LENGTH,
          message = "Password must be between " + MIN_PASSWORD_LENGTH + " and " + MAX_FIELD_LENGTH + " characters")
    private String newPassword;
}
