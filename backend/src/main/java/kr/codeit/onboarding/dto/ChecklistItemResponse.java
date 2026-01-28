package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for a checklist item with completion status.
 * <p>
 * Represents a single item in a Type D checklist task.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Checklist item with completion status")
public class ChecklistItemResponse {

    @Schema(description = "Checklist item ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long id;

    @Schema(description = "Item label", example = "Setup Slack notifications", requiredMode = Schema.RequiredMode.REQUIRED)
    private String label;

    @Schema(description = "Completion status", example = "true", requiredMode = Schema.RequiredMode.REQUIRED)
    private Boolean checked;
}
