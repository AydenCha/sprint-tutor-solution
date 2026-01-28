package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.codeit.onboarding.domain.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for a quiz question with answer information.
 * <p>
 * Contains question details and user's answer (if submitted).
 * Correct answers are included for PM users but hidden from instructors until answered.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Quiz question with answer details")
public class QuizQuestionResponse {

    @Schema(description = "Question ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long id;

    @Schema(description = "Question text", example = "What is the main purpose of Slack?", requiredMode = Schema.RequiredMode.REQUIRED)
    private String question;

    @Schema(description = "Question type", example = "OBJECTIVE", requiredMode = Schema.RequiredMode.REQUIRED)
    private QuestionType questionType;

    // === For OBJECTIVE Questions ===

    @Schema(description = "Answer options (objective questions)", nullable = true)
    private List<String> options;

    @Schema(description = "Correct answer index (PM only, objective questions)", example = "0", nullable = true)
    private Integer correctAnswerIndex;

    @Schema(description = "User's selected answer index (objective questions)", example = "1", nullable = true)
    private Integer userAnswer;

    // === For SUBJECTIVE Questions ===

    @Schema(description = "Correct answer text (PM only, subjective questions)", nullable = true)
    private String correctAnswerText;

    @Schema(description = "Answer guide (subjective questions)", nullable = true)
    private String answerGuide;

    @Schema(description = "User's answer text (subjective questions)", nullable = true)
    private String userAnswerText;
}
