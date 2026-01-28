package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Request DTO for submitting quiz answers.
 * <p>
 * Instructors submit their answers using this DTO. Supports both objective
 * (multiple choice) and subjective (free text) question types.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Quiz submission with answers")
public class QuizSubmissionRequest {

    /**
     * Objective question answers: questionId -> selected option index (0-based).
     */
    @Schema(
        description = "Objective question answers (questionId -> selected option index)",
        example = "{\"1\": 0, \"2\": 2}",
        nullable = true
    )
    private Map<Long, Integer> objectiveAnswers;

    /**
     * Subjective question answers: questionId -> answer text.
     */
    @Schema(
        description = "Subjective question answers (questionId -> answer text)",
        example = "{\"3\": \"Slack is used for team communication...\"}",
        nullable = true
    )
    private Map<Long, String> subjectiveAnswers;
}
