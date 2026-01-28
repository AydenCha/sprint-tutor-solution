package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import kr.codeit.onboarding.domain.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for creating or updating quiz questions.
 * <p>
 * Supports two question types:
 * <ul>
 *   <li>OBJECTIVE: Multiple choice with options and correctAnswerIndex</li>
 *   <li>SUBJECTIVE: Free text answer with correctAnswerText and optional guide</li>
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
@Schema(description = "Request to create or update a quiz question")
public class QuizQuestionRequest {

    public static final int MAX_QUESTION_LENGTH = 1000;
    public static final int MIN_OPTIONS = 2;
    public static final int MAX_OPTIONS = 6;
    public static final int MAX_ANSWER_LENGTH = 2000;

    /**
     * The question text.
     */
    @Schema(
        description = "Question text",
        example = "What is the main purpose of Slack?",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Question is required")
    @Size(max = MAX_QUESTION_LENGTH, message = "Question must not exceed " + MAX_QUESTION_LENGTH + " characters")
    private String question;

    /**
     * Question type: OBJECTIVE or SUBJECTIVE.
     */
    @Schema(
        description = "Question type",
        example = "OBJECTIVE",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    // === For OBJECTIVE Questions ===

    /**
     * List of answer options (for objective questions).
     * <p>
     * Must have 2-6 options.
     */
    @Schema(
        description = "Answer options for objective questions (2-6 options)",
        example = "[\"Team communication\", \"File storage\", \"Email replacement\", \"Project management\"]",
        nullable = true
    )
    @Size(min = MIN_OPTIONS, message = "At least " + MIN_OPTIONS + " options are required for objective questions")
    private List<String> options;

    /**
     * Index of the correct answer (0-based) for objective questions.
     */
    @Schema(
        description = "Correct answer index (0-based) for objective questions",
        example = "0",
        nullable = true
    )
    private Integer correctAnswerIndex;

    // === For SUBJECTIVE Questions ===

    /**
     * Expected answer text for subjective questions.
     */
    @Schema(
        description = "Correct answer text for subjective questions",
        example = "Slack is used for real-time team communication and collaboration",
        nullable = true
    )
    @Size(max = MAX_ANSWER_LENGTH, message = "Answer text must not exceed " + MAX_ANSWER_LENGTH + " characters")
    private String correctAnswerText;

    /**
     * Answer guidelines for instructors (subjective questions).
     */
    @Schema(
        description = "Answer guide for subjective questions",
        example = "Answer should mention communication, collaboration, and real-time messaging",
        nullable = true
    )
    @Size(max = MAX_ANSWER_LENGTH, message = "Answer guide must not exceed " + MAX_ANSWER_LENGTH + " characters")
    private String answerGuide;
}
