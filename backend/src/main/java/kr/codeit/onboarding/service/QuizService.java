package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.*;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import kr.codeit.onboarding.dto.QuizQuestionRequest;
import kr.codeit.onboarding.dto.QuizSubmissionRequest;
import kr.codeit.onboarding.dto.QuizSubmissionResponse;
import kr.codeit.onboarding.exception.ResourceNotFoundException;
import kr.codeit.onboarding.security.SecurityContext;
import kr.codeit.onboarding.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizService {

    private final TaskRepository taskRepository;
    private final InstructorRepository instructorRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizAnswerRepository answerRepository;
    private final OnboardingStepRepository stepRepository;
    private final InstructorService instructorService;
    private final SecurityContext securityContext;

    @Transactional
    public QuizSubmissionResponse submitQuiz(Long taskId, QuizSubmissionRequest request) {
        // Get instructor ID from authenticated user (prevents IDOR vulnerability)
        Long instructorId = instructorService.getCurrentInstructorId();

        Task task = taskRepository.findByIdWithQuizQuestions(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Instructor instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        Map<Long, Boolean> results = new HashMap<>();
        int correctCount = 0;
        int totalQuestions = 0;

        // Process objective answers
        if (request.getObjectiveAnswers() != null) {
            for (Map.Entry<Long, Integer> entry : request.getObjectiveAnswers().entrySet()) {
                Long questionId = entry.getKey();
                Integer selectedAnswerIndex = entry.getValue();

                QuizQuestion question = questionRepository.findById(questionId)
                        .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

                if (question.getQuestionType() != kr.codeit.onboarding.domain.enums.QuestionType.OBJECTIVE) {
                    throw new IllegalArgumentException("Question " + questionId + " is not an objective question");
                }

                boolean isCorrect = question.getCorrectAnswerIndex() != null 
                        && question.getCorrectAnswerIndex().equals(selectedAnswerIndex);
                results.put(questionId, isCorrect);
                totalQuestions++;

                if (isCorrect) {
                    correctCount++;
                }

                // Save or update answer
                QuizAnswer answer = answerRepository.findByInstructorIdAndQuestionId(instructorId, questionId)
                        .orElse(QuizAnswer.builder()
                                .question(question)
                                .instructor(instructor)
                                .build());

                answer.setSelectedAnswerIndex(selectedAnswerIndex);
                answer.setIsCorrect(isCorrect);
                answer.setSubmittedAt(LocalDateTime.now());
                answerRepository.save(answer);
            }
        }

        // Process subjective answers
        if (request.getSubjectiveAnswers() != null) {
            for (Map.Entry<Long, String> entry : request.getSubjectiveAnswers().entrySet()) {
                Long questionId = entry.getKey();
                String answerText = entry.getValue();

                QuizQuestion question = questionRepository.findById(questionId)
                        .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

                if (question.getQuestionType() != kr.codeit.onboarding.domain.enums.QuestionType.SUBJECTIVE) {
                    throw new IllegalArgumentException("Question " + questionId + " is not a subjective question");
                }

                // 주관식 키워드 기반 자동 채점
                boolean isCorrect = checkSubjectiveAnswer(answerText, question.getCorrectAnswerText());
                results.put(questionId, isCorrect);
                totalQuestions++;
                if (isCorrect) {
                    correctCount++;
                }

                // Save or update answer
                QuizAnswer answer = answerRepository.findByInstructorIdAndQuestionId(instructorId, questionId)
                        .orElse(QuizAnswer.builder()
                                .question(question)
                                .instructor(instructor)
                                .build());

                answer.setSelectedAnswerText(answerText);
                answer.setIsCorrect(isCorrect);
                answer.setSubmittedAt(LocalDateTime.now());
                answerRepository.save(answer);
            }
        }

        // 모든 문제가 정답이면 Task 완료
        boolean allCorrect = totalQuestions > 0 && correctCount == totalQuestions;

        // Update task status if all questions are correct
        if (allCorrect) {
            task.setStatus(TaskStatus.COMPLETED);
            taskRepository.save(task);

            // Update step progress
            OnboardingStep step = task.getStep();
            step.updateProgress();
            stepRepository.save(step);
        }

        return QuizSubmissionResponse.builder()
                .allCorrect(allCorrect)
                .correctCount(correctCount)
                .totalQuestions(totalQuestions)
                .results(results)
                .build();
    }

    /**
     * Create a new quiz question for a task (PM only)
     */
    @Transactional
    public QuizQuestion createQuizQuestion(Long taskId, QuizQuestionRequest request) {
        securityContext.requirePm(); // Only PM can create quiz questions
        
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        // Validate based on question type
        if (request.getQuestionType() == kr.codeit.onboarding.domain.enums.QuestionType.OBJECTIVE) {
            if (request.getOptions() == null || request.getOptions().size() < 2) {
                throw new IllegalArgumentException("Objective questions require at least 2 options");
            }
            if (request.getCorrectAnswerIndex() == null) {
                throw new IllegalArgumentException("Correct answer index is required for objective questions");
            }
            if (request.getCorrectAnswerIndex() < 0 || request.getCorrectAnswerIndex() >= request.getOptions().size()) {
                throw new IllegalArgumentException("Correct answer index is out of range");
            }
        } else if (request.getQuestionType() == kr.codeit.onboarding.domain.enums.QuestionType.SUBJECTIVE) {
            if (request.getCorrectAnswerText() == null || request.getCorrectAnswerText().trim().isEmpty()) {
                throw new IllegalArgumentException("Correct answer text is required for subjective questions");
            }
        }

        QuizQuestion question = QuizQuestion.builder()
                .task(task)
                .question(request.getQuestion())
                .questionType(request.getQuestionType())
                .options(request.getOptions())
                .correctAnswerIndex(request.getCorrectAnswerIndex())
                .correctAnswerText(request.getCorrectAnswerText())
                .answerGuide(request.getAnswerGuide())
                .build();

        return questionRepository.save(question);
    }

    /**
     * Update an existing quiz question (PM only)
     */
    @Transactional
    public QuizQuestion updateQuizQuestion(Long questionId, QuizQuestionRequest request) {
        securityContext.requirePm(); // Only PM can update quiz questions
        
        QuizQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz question not found"));

        // Validate based on question type
        if (request.getQuestionType() == kr.codeit.onboarding.domain.enums.QuestionType.OBJECTIVE) {
            if (request.getOptions() == null || request.getOptions().size() < 2) {
                throw new IllegalArgumentException("Objective questions require at least 2 options");
            }
            if (request.getCorrectAnswerIndex() == null) {
                throw new IllegalArgumentException("Correct answer index is required for objective questions");
            }
            if (request.getCorrectAnswerIndex() < 0 || request.getCorrectAnswerIndex() >= request.getOptions().size()) {
                throw new IllegalArgumentException("Correct answer index is out of range");
            }
        } else if (request.getQuestionType() == kr.codeit.onboarding.domain.enums.QuestionType.SUBJECTIVE) {
            if (request.getCorrectAnswerText() == null || request.getCorrectAnswerText().trim().isEmpty()) {
                throw new IllegalArgumentException("Correct answer text is required for subjective questions");
            }
        }

        question.setQuestion(request.getQuestion());
        question.setQuestionType(request.getQuestionType());
        question.setOptions(request.getOptions());
        question.setCorrectAnswerIndex(request.getCorrectAnswerIndex());
        question.setCorrectAnswerText(request.getCorrectAnswerText());
        question.setAnswerGuide(request.getAnswerGuide());

        return questionRepository.save(question);
    }

    /**
     * Delete a quiz question (PM only)
     */
    @Transactional
    public void deleteQuizQuestion(Long questionId) {
        securityContext.requirePm(); // Only PM can delete quiz questions

        QuizQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz question not found"));

        questionRepository.delete(question);
    }

    /**
     * Check subjective answer using keyword matching.
     *
     * Compares the instructor's answer text against comma-separated keywords.
     * Returns true if the answer contains at least one of the keywords (case-insensitive).
     *
     * @param answerText the instructor's answer text
     * @param correctAnswerText comma-separated keywords from PM
     * @return true if the answer contains at least one keyword, false otherwise
     */
    private boolean checkSubjectiveAnswer(String answerText, String correctAnswerText) {
        if (correctAnswerText == null || correctAnswerText.trim().isEmpty()) {
            // No correct answer set, cannot grade automatically
            return false;
        }

        if (answerText == null || answerText.trim().isEmpty()) {
            // Empty answer is incorrect
            return false;
        }

        // Split keywords by comma and check if any keyword exists in the answer
        String[] keywords = correctAnswerText.split(",");
        String normalizedAnswer = answerText.toLowerCase().trim();

        for (String keyword : keywords) {
            String normalizedKeyword = keyword.toLowerCase().trim();
            if (!normalizedKeyword.isEmpty() && normalizedAnswer.contains(normalizedKeyword)) {
                return true; // Found at least one matching keyword
            }
        }

        return false; // No matching keywords found
    }
}
