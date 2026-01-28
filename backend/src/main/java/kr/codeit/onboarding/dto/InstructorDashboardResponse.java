package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for instructor dashboard view.
 * <p>
 * Provides comprehensive instructor information including:
 * <ul>
 *   <li>Personal and contact details</li>
 *   <li>Onboarding configuration (type, module, timing)</li>
 *   <li>Progress tracking (current step, overall progress)</li>
 *   <li>Detailed step and task information</li>
 *   <li>D-Day calculation relative to start date</li>
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
@Schema(description = "Instructor dashboard with complete onboarding information")
public class InstructorDashboardResponse {

    // === Basic Information ===

    @Schema(description = "Instructor ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long id;

    @Schema(description = "Instructor's full name", example = "김철수", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "Email address", example = "chulsoo.kim@example.com", requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;

    @Schema(description = "Phone number", example = "010-1234-5678", requiredMode = Schema.RequiredMode.REQUIRED)
    private String phone;

    @Schema(description = "Track name", example = "프론트엔드", requiredMode = Schema.RequiredMode.REQUIRED)
    private String track;

    @Schema(description = "Cohort identifier", example = "5기", requiredMode = Schema.RequiredMode.REQUIRED)
    private String cohort;

    @Schema(description = "Access code for login", example = "ABC123", requiredMode = Schema.RequiredMode.REQUIRED)
    private String accessCode;

    @Schema(description = "Start date", example = "2024-03-01", requiredMode = Schema.RequiredMode.REQUIRED)
    private String startDate;

    // === Onboarding Configuration ===

    @Schema(description = "Instructor type classification", example = "신입", requiredMode = Schema.RequiredMode.REQUIRED)
    private String instructorType;

    @Schema(description = "Assigned onboarding module (A-F)", example = "모듈 A", nullable = true)
    private String onboardingModule;

    @Schema(description = "Timing urgency classification", example = "여유", nullable = true)
    private String timingVariable;

    // === Progress Tracking ===

    @Schema(description = "Current step number (1-based)", example = "3", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer currentStep;

    @Schema(description = "Overall progress percentage (0-100)", example = "65", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer overallProgress;

    @Schema(
        description = "Days until/since start date (negative if started, positive if future)",
        example = "-5",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private Integer dDay;

    // === Detailed Steps ===

    @Schema(description = "List of onboarding steps with tasks", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<StepResponse> steps;
}
