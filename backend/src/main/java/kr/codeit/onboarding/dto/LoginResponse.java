package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.codeit.onboarding.domain.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO returned after successful authentication.
 * <p>
 * Contains JWT token and user information needed for client-side session management.
 * The response structure differs slightly between PM and Instructor users:
 * <ul>
 *   <li>PM users: instructorId will be null</li>
 *   <li>Instructors: instructorId contains the instructor entity ID</li>
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
@Schema(description = "Login response containing JWT token and user information")
public class LoginResponse {

    /**
     * JWT authentication token.
     * <p>
     * This token should be included in the Authorization header for subsequent requests.
     */
    @Schema(
        description = "JWT authentication token",
        example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String token;

    /**
     * User entity ID.
     * <p>
     * Primary key of the User entity in the database.
     */
    @Schema(
        description = "User ID",
        example = "1",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private Long userId;

    /**
     * Instructor entity ID.
     * <p>
     * Only populated for Instructor users. Null for PM users.
     */
    @Schema(
        description = "Instructor ID - null for PM users",
        example = "5",
        nullable = true
    )
    private Long instructorId;

    /**
     * User's full name.
     */
    @Schema(
        description = "User's full name",
        example = "John Doe",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String name;

    /**
     * User's email address.
     */
    @Schema(
        description = "User's email address",
        example = "john.doe@codeit.com",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String email;

    /**
     * User's role in the system.
     * <p>
     * Determines access permissions and available features.
     */
    @Schema(
        description = "User role",
        example = "PM",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private UserRole role;
}
