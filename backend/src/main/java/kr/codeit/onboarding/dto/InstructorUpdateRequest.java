package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for updating instructor information.
 * <p>
 * Only PM users can update instructor details. All fields are required
 * except instructorType which can be null.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update instructor information (PM only)")
public class InstructorUpdateRequest {

    public static final int MAX_FIELD_LENGTH = 255;
    public static final int MAX_PHONE_LENGTH = 20;

    @Schema(description = "Instructor's full name", example = "김철수", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Name is required")
    @Size(max = MAX_FIELD_LENGTH, message = "Name must not exceed " + MAX_FIELD_LENGTH + " characters")
    private String name;

    @Schema(description = "Email address", example = "chulsoo.kim@example.com", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = MAX_FIELD_LENGTH, message = "Email must not exceed " + MAX_FIELD_LENGTH + " characters")
    private String email;

    @Schema(description = "Phone number", example = "010-1234-5678", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Phone is required")
    @Size(max = MAX_PHONE_LENGTH, message = "Phone must not exceed " + MAX_PHONE_LENGTH + " characters")
    private String phone;

    @Schema(description = "Track name", example = "프론트엔드", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Track is required")
    @Size(max = MAX_FIELD_LENGTH, message = "Track must not exceed " + MAX_FIELD_LENGTH + " characters")
    private String track;

    @Schema(description = "Cohort identifier", example = "5기", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Cohort is required")
    @Size(max = MAX_FIELD_LENGTH, message = "Cohort must not exceed " + MAX_FIELD_LENGTH + " characters")
    private String cohort;

    @Schema(description = "Start date", example = "2024-03-01", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @Schema(description = "Instructor type", example = "신입", nullable = true)
    @Size(max = 50, message = "Instructor type must not exceed 50 characters")
    private String instructorType;
}

