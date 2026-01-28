package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import kr.codeit.onboarding.domain.enums.QuestionType;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;

/**
 * ModuleQuizQuestion entity representing a quiz question within a content module.
 *
 * <p>Similar to QuizQuestion but belongs to a reusable ContentModule instead
 * of a specific task. When a module is assigned to a task, these questions are
 * typically copied to the task level.
 *
 * <p>Supports two question types:
 * <ul>
 *   <li>OBJECTIVE: Multiple choice questions with predefined options</li>
 *   <li>SUBJECTIVE: Free-form text answers with optional guidelines</li>
 * </ul>
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "module_quiz_questions", indexes = {
    @Index(name = "idx_module_quiz_question_module", columnList = "module_id"),
    @Index(name = "idx_module_quiz_question_type", columnList = "question_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModuleQuizQuestion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The content module this question belongs to.
     */
    @NotNull(message = "Content module is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private ContentModule contentModule;

    /**
     * The question text.
     */
    @NotBlank(message = "Question is required")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    /**
     * Type of question (OBJECTIVE or SUBJECTIVE).
     */
    @NotNull(message = "Question type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 20)
    @Builder.Default
    private QuestionType questionType = QuestionType.OBJECTIVE;

    /**
     * Available options for objective questions.
     * Stored as JSON array of strings.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options", columnDefinition = "json")
    private List<String> options;

    /**
     * Index of the correct answer for objective questions (0-based).
     * Must be within the bounds of the options list.
     */
    @Column(name = "correct_answer_index")
    private Integer correctAnswerIndex;

    /**
     * Correct answer text for subjective questions.
     * Can be keywords or exact answer text for validation.
     */
    @Column(name = "correct_answer_text", columnDefinition = "TEXT")
    private String correctAnswerText;

    /**
     * Answer guide or sample answer for subjective questions.
     * Provides instructors with guidelines on expected answers.
     */
    @Column(name = "answer_guide", columnDefinition = "TEXT")
    private String answerGuide;

    /**
     * Checks if this is an objective (multiple choice) question.
     *
     * @return true if the question type is OBJECTIVE
     */
    public boolean isObjectiveQuestion() {
        return this.questionType == QuestionType.OBJECTIVE;
    }

    /**
     * Checks if this is a subjective (text answer) question.
     *
     * @return true if the question type is SUBJECTIVE
     */
    public boolean isSubjectiveQuestion() {
        return this.questionType == QuestionType.SUBJECTIVE;
    }

    /**
     * Validates if a given option index is correct for objective questions.
     *
     * @param answerIndex the index to validate
     * @return true if the index matches the correct answer
     */
    public boolean isCorrectAnswer(Integer answerIndex) {
        if (!isObjectiveQuestion() || correctAnswerIndex == null) {
            return false;
        }
        return correctAnswerIndex.equals(answerIndex);
    }

    /**
     * Gets the number of options for objective questions.
     *
     * @return number of options, or 0 if not an objective question
     */
    public int getOptionsCount() {
        return options != null ? options.size() : 0;
    }
}
