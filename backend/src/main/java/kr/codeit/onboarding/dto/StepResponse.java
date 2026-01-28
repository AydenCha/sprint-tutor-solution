package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for an onboarding step with progress information.
 * <p>
 * Represents a single step in the instructor's onboarding workflow.
 * Contains step metadata, progress tracking, and associated tasks.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Onboarding step with tasks and progress")
public class StepResponse {

    @Schema(description = "Step ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long id;

    @Schema(description = "Step definition ID (template)", example = "1", nullable = true)
    private Long stepDefinitionId;

    @Schema(description = "Step number in workflow (1-based)", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer stepNumber;

    @Schema(description = "Step title", example = "계정 준비하기", requiredMode = Schema.RequiredMode.REQUIRED)
    private String title;

    @Schema(description = "Step emoji icon", example = "📝", nullable = true)
    private String emoji;

    @Schema(
        description = "Days relative to start date - negative means days before, positive means days after",
        example = "-14",
        nullable = true
    )
    private Integer dDay;

    @Schema(description = "Step description", example = "필수 계정들을 생성하고 준비합니다", nullable = true)
    private String description;

    @Schema(description = "Current step status", example = "IN_PROGRESS", requiredMode = Schema.RequiredMode.REQUIRED)
    private TaskStatus status;

    @Schema(
        description = "Step type classification",
        example = "PM 주도",
        allowableValues = {"PM 주도", "자가 점검", "생략", "지연"},
        nullable = true
    )
    private String stepType;

    @Schema(description = "Total number of tasks in this step", example = "5", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer totalTasks;

    @Schema(description = "Number of completed tasks", example = "3", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer completedTasks;

    @Schema(description = "List of tasks in this step", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<TaskResponse> tasks;
}
