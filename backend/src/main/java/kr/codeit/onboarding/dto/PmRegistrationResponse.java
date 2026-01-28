package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.codeit.onboarding.domain.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO returned after PM registration.
 * <p>
 * The registration process requires email verification. The JWT token will be null
 * until the user verifies their email address through the verification link sent
 * to their registered email.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "PM registration response with user details and verification status")
public class PmRegistrationResponse {

    /**
     * JWT authentication token.
     * <p>
     * Will be null until email verification is completed.
     * After email verification, user should login to obtain a valid token.
     */
    @Schema(
        description = "JWT token - null until email verification is completed",
        example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        nullable = true
    )
    private String token;

    /**
     * Created user's ID.
     */
    @Schema(
        description = "User ID",
        example = "1",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private Long userId;

    /**
     * PM's full name.
     */
    @Schema(
        description = "PM's full name",
        example = "Jane Smith",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String name;

    /**
     * PM's email address.
     */
    @Schema(
        description = "PM's email address",
        example = "jane.smith@codeit.com",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String email;

    /**
     * User role.
     * <p>
     * Always set to PM for this registration type.
     */
    @Schema(
        description = "User role - always PM",
        example = "PM",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private UserRole role;

    /**
     * Email verification status.
     * <p>
     * Indicates whether the user has verified their email address.
     * User must verify email before they can fully access the system.
     */
    @Schema(
        description = "Email verification status",
        example = "false",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private Boolean emailVerified;
}
