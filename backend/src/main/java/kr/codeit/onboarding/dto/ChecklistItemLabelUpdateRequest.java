package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for PM to update checklist item label.
 * <p>
 * Only PM users can modify the text of checklist items.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update checklist item label (PM only)")
public class ChecklistItemLabelUpdateRequest {

    public static final int MAX_LABEL_LENGTH = 500;

    @Schema(
        description = "New label text",
        example = "Setup Slack desktop app notifications",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Label is required")
    @Size(max = MAX_LABEL_LENGTH, message = "Label must not exceed " + MAX_LABEL_LENGTH + " characters")
    private String label;
}
