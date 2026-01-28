package kr.codeit.onboarding.controller;

import jakarta.validation.Valid;
import kr.codeit.onboarding.domain.entity.QuizQuestion;
import kr.codeit.onboarding.dto.*;
import kr.codeit.onboarding.service.QuizService;
import kr.codeit.onboarding.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Task and Quiz Management.
 *
 * <p>This controller handles task-related operations within the onboarding workflow including:</p>
 * <ul>
 *   <li>Task status updates by instructors</li>
 *   <li>Quiz submissions and grading</li>
 *   <li>Task content management (PM only)</li>
 *   <li>Quiz question CRUD operations (PM only)</li>
 * </ul>
 *
 * <p>Access Control:</p>
 * <ul>
 *   <li>Instructors: Can update task status and submit quiz answers</li>
 *   <li>PM: Full access including content management and quiz question creation</li>
 * </ul>
 *
 * @author Sprint Tutor Flow Team
 * @since 1.0
 */
@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
@Validated
public class TaskController {

    private final TaskService taskService;
    private final QuizService quizService;

    /**
     * Update task status and completion state.
     *
     * <p>Allows instructors to mark tasks as started, in progress, or completed. Automatically
     * tracks completion timestamps and updates overall onboarding progress.</p>
     *
     * <p>Instructor access - operates on authenticated user's tasks only.</p>
     *
     * @param taskId the task ID to update
     * @param request the update request containing new status and optional notes
     * @return ResponseEntity containing updated task details
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if task not found
     * @throws kr.codeit.onboarding.exception.UnauthorizedException if task doesn't belong to current instructor
     */
    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskUpdateRequest request) {
        TaskResponse response = taskService.updateTaskStatus(taskId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Submit quiz answers for evaluation.
     *
     * <p>Allows instructors to submit answers to quiz questions associated with a task.
     * The system automatically evaluates answers and calculates the score. Tasks may require
     * a minimum score to be marked as completed.</p>
     *
     * <p>Instructor access - operates on authenticated user's tasks only.</p>
     *
     * @param taskId the task ID containing the quiz
     * @param request the quiz submission request with answers to all questions
     * @return ResponseEntity containing evaluation results with score and feedback
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if task or quiz not found
     * @throws kr.codeit.onboarding.exception.UnauthorizedException if task doesn't belong to current instructor
     */
    @PostMapping("/{taskId}/quiz-submit")
    public ResponseEntity<QuizSubmissionResponse> submitQuiz(
            @PathVariable Long taskId,
            @Valid @RequestBody QuizSubmissionRequest request) {
        QuizSubmissionResponse response = quizService.submitQuiz(taskId, request);
        return ResponseEntity.ok(response);
    }

    // ========== PM Content Management Endpoints ==========

    /**
     * Update task content and requirements.
     *
     * <p>Allows PMs to modify task details including title, description, reference URLs,
     * and file upload requirements. Changes affect all instructors assigned to this task.</p>
     *
     * <p>PM access only.</p>
     *
     * @param taskId the task ID to update
     * @param request the content update request with new task details
     * @return ResponseEntity containing updated task information
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if task not found
     */
    @PutMapping("/{taskId}/content")
    public ResponseEntity<TaskResponse> updateTaskContent(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskContentUpdateRequest request) {
        TaskResponse response = taskService.updateTaskContent(taskId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Create a new quiz question for a task.
     *
     * <p>Adds a new quiz question to the specified task. Supports multiple choice and
     * text-based questions with automatic or manual grading.</p>
     *
     * <p>PM access only.</p>
     *
     * @param taskId the task ID to add the question to
     * @param request the quiz question request containing question text, type, and correct answer
     * @return ResponseEntity containing the created quiz question
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if task not found
     */
    @PostMapping("/{taskId}/quiz-questions")
    public ResponseEntity<QuizQuestion> createQuizQuestion(
            @PathVariable Long taskId,
            @Valid @RequestBody QuizQuestionRequest request) {
        QuizQuestion question = quizService.createQuizQuestion(taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(question);
    }

    /**
     * Update an existing quiz question.
     *
     * <p>Modifies quiz question content, correct answer, or question type. Updates apply
     * to all instructors who haven't yet submitted answers for this question.</p>
     *
     * <p>PM access only.</p>
     *
     * @param questionId the quiz question ID to update
     * @param request the update request with modified question details
     * @return ResponseEntity containing updated quiz question
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if question not found
     */
    @PutMapping("/quiz-questions/{questionId}")
    public ResponseEntity<QuizQuestion> updateQuizQuestion(
            @PathVariable Long questionId,
            @Valid @RequestBody QuizQuestionRequest request) {
        QuizQuestion question = quizService.updateQuizQuestion(questionId, request);
        return ResponseEntity.ok(question);
    }

    /**
     * Delete a quiz question.
     *
     * <p>Permanently removes a quiz question from the task. This will affect quiz scores
     * for instructors who have already submitted answers.</p>
     *
     * <p>PM access only.</p>
     *
     * @param questionId the quiz question ID to delete
     * @return ResponseEntity with no content (204)
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if question not found
     */
    @DeleteMapping("/quiz-questions/{questionId}")
    public ResponseEntity<Void> deleteQuizQuestion(
            @PathVariable Long questionId) {
        quizService.deleteQuizQuestion(questionId);
        return ResponseEntity.noContent().build();
    }
}
