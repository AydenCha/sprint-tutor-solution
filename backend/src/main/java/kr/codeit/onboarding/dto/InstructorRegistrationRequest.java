package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for Instructor registration.
 * <p>
 * PM users create instructor accounts through this request. The system will:
 * <ul>
 *   <li>Generate a unique access code for the instructor</li>
 *   <li>Set up the onboarding workflow based on track and instructor type</li>
 *   <li>Apply step template or custom step definitions if provided</li>
 *   <li>Send welcome email with access code to the instructor</li>
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
@Schema(description = "Instructor registration request with onboarding configuration")
public class InstructorRegistrationRequest {

    /**
     * Maximum field length for text fields.
     */
    public static final int MAX_FIELD_LENGTH = 255;

    /**
     * Maximum length for phone numbers.
     */
    public static final int MAX_PHONE_LENGTH = 20;

    /**
     * Instructor's full name.
     */
    @Schema(
        description = "Instructor's full name",
        example = "김철수",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Name is required")
    @Size(max = MAX_FIELD_LENGTH, message = "Name must not exceed " + MAX_FIELD_LENGTH + " characters")
    private String name;

    /**
     * Instructor's email address.
     * <p>
     * Used for notifications and communication. Does not need to be @codeit.com.
     */
    @Schema(
        description = "Instructor's email address",
        example = "chulsoo.kim@example.com",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = MAX_FIELD_LENGTH, message = "Email must not exceed " + MAX_FIELD_LENGTH + " characters")
    private String email;

    /**
     * Instructor's phone number.
     */
    @Schema(
        description = "Instructor's phone number",
        example = "010-1234-5678",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Phone is required")
    @Size(max = MAX_PHONE_LENGTH, message = "Phone must not exceed " + MAX_PHONE_LENGTH + " characters")
    private String phone;

    /**
     * Track name (Korean or English).
     * <p>
     * Examples: "프론트엔드", "FRONTEND", "백엔드", "BACKEND"
     */
    @Schema(
        description = "Track name - Korean or English",
        example = "프론트엔드",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Track is required")
    @Size(max = MAX_FIELD_LENGTH, message = "Track must not exceed " + MAX_FIELD_LENGTH + " characters")
    private String track;

    /**
     * Cohort identifier.
     * <p>
     * Examples: "5기", "6기", "Sprint 10"
     */
    @Schema(
        description = "Cohort identifier",
        example = "5기",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Cohort is required")
    @Size(max = MAX_FIELD_LENGTH, message = "Cohort must not exceed " + MAX_FIELD_LENGTH + " characters")
    private String cohort;

    /**
     * Instructor's start date.
     * <p>
     * Must be in the future. Used for D-Day calculations in onboarding workflow.
     */
    @Schema(
        description = "Start date - must be in the future",
        example = "2024-03-01",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotNull(message = "Start date is required")
    @Future(message = "Start date must be in the future")
    private LocalDate startDate;

    /**
     * Instructor type classification.
     * <p>
     * Valid values: "신입" (Newbie), "경력" (Experienced), "재계약" (Renewal)
     * If null, system will default to "신입" or determine automatically.
     */
    @Schema(
        description = "Instructor type - 신입/경력/재계약",
        example = "신입",
        nullable = true
    )
    @Size(max = 50, message = "Instructor type must not exceed 50 characters")
    private String instructorType;

    /**
     * List of step configurations with module toggles.
     * Each configuration specifies a step and which modules are enabled.
     * Order of configurations determines step sequence.
     * <p>
     * Takes precedence over selectedStepDefinitionIds if both are provided.
     */
    @Schema(
        description = "Step configurations with module toggles in order",
        nullable = true
    )
    private List<StepModuleConfiguration> stepConfigurations;

    /**
     * Optional list of step definition IDs for basic custom workflow.
     * <p>
     * DEPRECATED: Use stepConfigurations instead for module-level control.
     * If stepConfigurations is provided, this field is ignored.
     * If both are null, system uses default steps for the track.
     * Order of IDs determines the step sequence.
     */
    @Schema(
        description = "Optional basic step definition IDs (deprecated, use stepConfigurations)",
        example = "[1, 3, 5, 7]",
        nullable = true,
        deprecated = true
    )
    @Deprecated
    private List<Long> selectedStepDefinitionIds;
}
