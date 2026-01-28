package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for a step definition.
 * <p>
 * Contains complete information about a reusable step definition template
 * including metadata, ordering, and audit information.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Step definition details")
public class StepDefinitionResponse {

    @Schema(description = "Step definition ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long id;

    @Schema(description = "Step title", example = "계정 준비하기", requiredMode = Schema.RequiredMode.REQUIRED)
    private String title;

    @Schema(description = "Step emoji icon", example = "📝", nullable = true)
    private String emoji;

    @Schema(description = "Step description", example = "필수 계정들을 생성하고 준비합니다", nullable = true)
    private String description;

    @Schema(description = "Default D-Day value", example = "-14", nullable = true)
    private Integer defaultDDay;

    @Schema(description = "Step type", example = "PM 주도", nullable = true)
    private String stepType;

    @Schema(description = "Display order", example = "1", nullable = true)
    private Integer displayOrder;

    @Schema(description = "Default module IDs assigned to this step", example = "[1, 2, 3]", nullable = true)
    private List<Long> defaultModuleIds;

    @Schema(description = "Creator's name", example = "PM User", nullable = true)
    private String createdBy;

    @Schema(description = "Creation timestamp", example = "2024-01-15T10:30:00", nullable = true)
    private String createdAt;

    @Schema(description = "Last update timestamp", example = "2024-01-20T14:45:00", nullable = true)
    private String updatedAt;
}
