package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

/**
 * QuizAnswer entity representing an instructor's answer to a quiz question.
 *
 * <p>Stores both objective (selected index) and subjective (text) answers,
 * along with correctness validation and submission timestamp.
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "quiz_answers", indexes = {
    @Index(name = "idx_quiz_answer_instructor_question", columnList = "instructor_id, question_id"),
    @Index(name = "idx_quiz_answer_instructor", columnList = "instructor_id"),
    @Index(name = "idx_quiz_answer_question", columnList = "question_id"),
    @Index(name = "idx_quiz_answer_submitted_at", columnList = "submitted_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAnswer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The quiz question this answer belongs to.
     */
    @NotNull(message = "Question is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question;

    /**
     * The instructor who submitted this answer.
     */
    @NotNull(message = "Instructor is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private Instructor instructor;

    /**
     * Selected answer index for objective questions (0-based).
     * Null for subjective questions.
     */
    @Column(name = "selected_answer_index")
    private Integer selectedAnswerIndex;

    /**
     * Text answer for subjective questions.
     * Null for objective questions.
     */
    @Column(name = "selected_answer_text", columnDefinition = "TEXT")
    private String selectedAnswerText;

    /**
     * Whether the answer is correct.
     * For objective questions: automatically validated against correct answer.
     * For subjective questions: may require manual review.
     */
    @NotNull(message = "Correctness flag is required")
    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    /**
     * Timestamp when the answer was submitted.
     */
    @NotNull(message = "Submission time is required")
    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    /**
     * Checks if this answer is for an objective question.
     *
     * @return true if selectedAnswerIndex is not null
     */
    public boolean isObjectiveAnswer() {
        return selectedAnswerIndex != null;
    }

    /**
     * Checks if this answer is for a subjective question.
     *
     * @return true if selectedAnswerText is not null and not empty
     */
    public boolean isSubjectiveAnswer() {
        return selectedAnswerText != null && !selectedAnswerText.isBlank();
    }

    /**
     * Marks this answer as correct.
     */
    public void markAsCorrect() {
        this.isCorrect = true;
    }

    /**
     * Marks this answer as incorrect.
     */
    public void markAsIncorrect() {
        this.isCorrect = false;
    }

    /**
     * Pre-persist hook to set submission time if not already set.
     */
    @PrePersist
    protected void onCreate() {
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
    }
}
