package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Response DTO for quiz submission results.
 * <p>
 * Provides feedback on quiz performance including:
 * <ul>
 *   <li>Whether all answers are correct</li>
 *   <li>Number of correct answers</li>
 *   <li>Per-question correctness results</li>
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
@Schema(description = "Quiz submission results")
public class QuizSubmissionResponse {

    /**
     * Whether all answers are correct.
     */
    @Schema(
        description = "Whether all answers are correct",
        example = "false",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private Boolean allCorrect;

    /**
     * Number of correct answers.
     */
    @Schema(
        description = "Number of correct answers",
        example = "3",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private Integer correctCount;

    /**
     * Total number of questions.
     */
    @Schema(
        description = "Total number of questions",
        example = "5",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private Integer totalQuestions;

    /**
     * Per-question results: questionId -> isCorrect.
     */
    @Schema(
        description = "Per-question correctness (questionId -> isCorrect)",
        example = "{\"1\": true, \"2\": false, \"3\": true}",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private Map<Long, Boolean> results;
}
