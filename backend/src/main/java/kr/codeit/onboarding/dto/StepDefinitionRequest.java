package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for creating or updating a step definition.
 * <p>
 * Step definitions are reusable templates that define the structure and
 * metadata for onboarding steps. They can be used across multiple instructors
 * and combined into step templates.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create or update a step definition")
public class StepDefinitionRequest {

    public static final int MAX_TITLE_LENGTH = 255;
    public static final int MAX_EMOJI_LENGTH = 10;
    public static final int MAX_DESCRIPTION_LENGTH = 1000;
    public static final int MAX_STEP_TYPE_LENGTH = 50;

    @Schema(description = "Step title", example = "계정 준비하기", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Title is required")
    @Size(max = MAX_TITLE_LENGTH, message = "Title must not exceed " + MAX_TITLE_LENGTH + " characters")
    private String title;

    @Schema(description = "Step emoji icon", example = "📝", nullable = true)
    @Size(max = MAX_EMOJI_LENGTH, message = "Emoji must not exceed " + MAX_EMOJI_LENGTH + " characters")
    private String emoji;

    @Schema(description = "Step description", example = "필수 계정들을 생성하고 준비합니다", nullable = true)
    @Size(max = MAX_DESCRIPTION_LENGTH, message = "Description must not exceed " + MAX_DESCRIPTION_LENGTH + " characters")
    private String description;

    @Schema(
        description = "Default D-Day relative to start date (negative = before start, positive = after)",
        example = "-14",
        nullable = true
    )
    private Integer defaultDDay;

    @Schema(
        description = "Step type classification",
        example = "PM 주도",
        allowableValues = {"PM 주도", "자가 점검", "지연", "생략"},
        nullable = true
    )
    @Size(max = MAX_STEP_TYPE_LENGTH, message = "Step type must not exceed " + MAX_STEP_TYPE_LENGTH + " characters")
    private String stepType;

    @Schema(
        description = "List of ContentModule IDs to assign to this step",
        example = "[1, 2, 3]",
        nullable = true
    )
    private List<Long> moduleIds;
}
