package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a checklist item.
 * <p>
 * Used in Type D modules/tasks to define checklist items that instructors
 * need to complete.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create a checklist item")
public class ChecklistItemRequest {

    public static final int MAX_LABEL_LENGTH = 500;

    @Schema(
        description = "Checklist item label/description",
        example = "Setup Slack notifications",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Label is required")
    @Size(max = MAX_LABEL_LENGTH, message = "Label must not exceed " + MAX_LABEL_LENGTH + " characters")
    private String label;
}
