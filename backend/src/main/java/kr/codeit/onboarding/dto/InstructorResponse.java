package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Response DTO containing instructor information and onboarding progress.
 * <p>
 * Provides a comprehensive view of an instructor's profile, onboarding status,
 * and workflow configuration. Used by both PM and Instructor views.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Instructor details with onboarding progress")
public class InstructorResponse {

    /**
     * Instructor entity ID.
     */
    @Schema(description = "Instructor ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long id;

    /**
     * Instructor's full name.
     */
    @Schema(description = "Instructor's full name", example = "김철수", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    /**
     * Instructor's email address.
     */
    @Schema(description = "Email address", example = "chulsoo.kim@example.com", requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;

    /**
     * Instructor's phone number.
     */
    @Schema(description = "Phone number", example = "010-1234-5678", requiredMode = Schema.RequiredMode.REQUIRED)
    private String phone;

    /**
     * Track name (typically in Korean).
     */
    @Schema(description = "Track name", example = "프론트엔드", requiredMode = Schema.RequiredMode.REQUIRED)
    private String track;

    /**
     * Cohort identifier.
     */
    @Schema(description = "Cohort identifier", example = "5기", requiredMode = Schema.RequiredMode.REQUIRED)
    private String cohort;

    /**
     * Unique access code for instructor login.
     */
    @Schema(description = "Access code for login", example = "ABC123", requiredMode = Schema.RequiredMode.REQUIRED)
    private String accessCode;

    /**
     * Instructor's official start date.
     */
    @Schema(description = "Start date", example = "2024-03-01", requiredMode = Schema.RequiredMode.REQUIRED)
    private LocalDate startDate;

    /**
     * Current step number in the onboarding workflow.
     */
    @Schema(description = "Current step number", example = "3", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer currentStep;

    /**
     * Overall onboarding progress percentage (0-100).
     */
    @Schema(description = "Overall progress percentage", example = "65", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer overallProgress;

    /**
     * Instructor type classification.
     */
    @Schema(description = "Instructor type", example = "신입", requiredMode = Schema.RequiredMode.REQUIRED)
    private String instructorType;

    /**
     * Assigned onboarding module (A-F).
     */
    @Schema(description = "Onboarding module", example = "모듈 A", nullable = true)
    private String onboardingModule;

    /**
     * Timing urgency classification.
     */
    @Schema(description = "Timing variable", example = "여유", nullable = true)
    private String timingVariable;

    /**
     * List of onboarding steps with tasks.
     */
    @Schema(description = "Onboarding steps", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<StepResponse> steps;
}
