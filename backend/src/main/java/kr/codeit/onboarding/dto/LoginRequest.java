package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for user authentication.
 * <p>
 * This DTO supports two types of login:
 * <ul>
 *   <li>PM Login: Uses email and password</li>
 *   <li>Instructor Login: Uses access code only</li>
 * </ul>
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Login request containing authentication credentials")
public class LoginRequest {

    /**
     * User identifier for authentication.
     * <p>
     * For PM users: Email address (e.g., "pm@codeit.com")
     * For Instructors: Access code (e.g., "ABC123")
     */
    @Schema(
        description = "User identifier - email for PM, access code for Instructor",
        example = "pm@codeit.com",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Email or access code is required")
    @Size(max = 255, message = "Identifier must not exceed 255 characters")
    private String identifier;

    /**
     * Password for authentication.
     * <p>
     * Required only for PM users.
     * Instructors authenticate using access code only, so this field should be null.
     */
    @Schema(
        description = "Password - required only for PM users",
        example = "SecurePass123!",
        nullable = true
    )
    @Size(max = 255, message = "Password must not exceed 255 characters")
    private String password;
}
