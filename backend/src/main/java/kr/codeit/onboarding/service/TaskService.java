package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.Instructor;
import kr.codeit.onboarding.domain.entity.OnboardingStep;
import kr.codeit.onboarding.domain.entity.Task;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import kr.codeit.onboarding.dto.TaskContentUpdateRequest;
import kr.codeit.onboarding.dto.TaskResponse;
import kr.codeit.onboarding.dto.TaskUpdateRequest;
import kr.codeit.onboarding.exception.ResourceNotFoundException;
import kr.codeit.onboarding.repository.InstructorRepository;
import kr.codeit.onboarding.repository.OnboardingStepRepository;
import kr.codeit.onboarding.repository.TaskRepository;
import kr.codeit.onboarding.security.SecurityContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;
    private final OnboardingStepRepository stepRepository;
    private final InstructorRepository instructorRepository;
    private final SecurityContext securityContext;

    @Transactional
    public TaskResponse updateTaskStatus(Long taskId, TaskUpdateRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        task.setStatus(request.getStatus());
        task = taskRepository.save(task);

        // Update step progress
        OnboardingStep step = task.getStep();
        step.updateProgress();
        stepRepository.save(step);

        // Update instructor overall progress
        updateInstructorProgress(step.getInstructor().getId());

        return toTaskResponse(task);
    }

    @Transactional
    public void updateInstructorProgress(Long instructorId) {
        Instructor instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        // Get all steps for this instructor
        List<OnboardingStep> steps = stepRepository.findByInstructorIdWithTasks(instructorId);
        
        if (steps.isEmpty()) {
            instructor.setOverallProgress(0);
            instructor.setCurrentStep(1);
            instructorRepository.save(instructor);
            return;
        }

        // Calculate total tasks and completed tasks across all steps
        int totalTasks = 0;
        int completedTasks = 0;
        int currentStepNumber = 1;
        boolean foundCurrentStep = false;

        for (OnboardingStep step : steps) {
            int stepTotalTasks = step.getTasks() != null ? step.getTasks().size() : 0;
            int stepCompletedTasks = step.getTasks() != null 
                    ? (int) step.getTasks().stream()
                            .filter(task -> task.getStatus() == TaskStatus.COMPLETED)
                            .count()
                    : 0;

            totalTasks += stepTotalTasks;
            completedTasks += stepCompletedTasks;

            // Find the current step (first step that is not completed)
            if (!foundCurrentStep && step.getStatus() != TaskStatus.COMPLETED) {
                currentStepNumber = step.getStepNumber();
                foundCurrentStep = true;
            }
        }

        // If all steps are completed, set current step to the last step
        if (!foundCurrentStep && !steps.isEmpty()) {
            currentStepNumber = steps.stream()
                    .mapToInt(OnboardingStep::getStepNumber)
                    .max()
                    .orElse(1);
        }

        // Calculate overall progress percentage
        int overallProgress = totalTasks > 0 
                ? (int) Math.round((double) completedTasks / totalTasks * 100)
                : 0;

        // Update instructor
        instructor.setOverallProgress(overallProgress);
        instructor.setCurrentStep(currentStepNumber);
        instructorRepository.save(instructor);
    }

    /**
     * Update task content (PM only)
     * Allows PM to update title, description, URLs, and file requirements
     * 
     * Note: Optimistic locking prevents concurrent modifications
     * If instructor is working on this task, they should refresh the page
     */
    @Transactional
    public TaskResponse updateTaskContent(Long taskId, TaskContentUpdateRequest request) {
        securityContext.requirePm(); // Only PM can update content
        
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        
        // Note: @Version field in BaseEntity will automatically handle optimistic locking
        // If another PM is editing simultaneously, OptimisticLockException will be thrown

        // Update basic fields
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());

        // Update content-specific fields based on content type
        if (task.getContentType().name().equals("A")) {
            // Document + Quiz
            task.setDocumentUrl(request.getDocumentUrl());
            task.setDocumentContent(request.getDocumentContent());
        } else if (task.getContentType().name().equals("B")) {
            // Video + Quiz
            task.setVideoUrl(request.getVideoUrl());
            task.setVideoDuration(request.getVideoDuration());
        } else if (task.getContentType().name().equals("C")) {
            // File Upload
            task.setRequiredFiles(request.getRequiredFiles());
        }

        task = taskRepository.save(task);
        // Reload with quiz questions for PM content management
        task = taskRepository.findByIdWithQuizQuestions(task.getId())
                .orElse(task);
        return toTaskResponseWithDetails(task);
    }

    private TaskResponse toTaskResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .contentType(task.getContentType())
                .status(task.getStatus())
                .documentUrl(task.getDocumentUrl())
                .documentContent(task.getDocumentContent())
                .videoUrl(task.getVideoUrl())
                .videoDuration(task.getVideoDuration())
                .requiredFiles(task.getRequiredFiles())
                .build();
    }

    /**
     * Convert Task to TaskResponse with all details (quiz questions, etc.)
     * Used for PM content management
     */
    private TaskResponse toTaskResponseWithDetails(Task task) {
        TaskResponse.TaskResponseBuilder builder = TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .contentType(task.getContentType())
                .status(task.getStatus());

        switch (task.getContentType()) {
            case A -> {
                builder.documentUrl(task.getDocumentUrl());
                // Include quiz questions for PM to manage
                if (task.getQuizQuestions() != null && !task.getQuizQuestions().isEmpty()) {
                    builder.quizQuestions(task.getQuizQuestions().stream()
                            .map(q -> kr.codeit.onboarding.dto.QuizQuestionResponse.builder()
                                    .id(q.getId())
                                    .question(q.getQuestion())
                                    .questionType(q.getQuestionType())
                                    .options(q.getOptions())
                                    .correctAnswerIndex(q.getCorrectAnswerIndex())
                                    .correctAnswerText(q.getCorrectAnswerText())
                                    .answerGuide(q.getAnswerGuide())
                                    .build())
                            .collect(java.util.stream.Collectors.toList()));
                }
            }
            case B -> {
                builder.videoUrl(task.getVideoUrl());
                builder.videoDuration(task.getVideoDuration());
                // Include quiz questions for PM to manage
                if (task.getQuizQuestions() != null && !task.getQuizQuestions().isEmpty()) {
                    builder.quizQuestions(task.getQuizQuestions().stream()
                            .map(q -> kr.codeit.onboarding.dto.QuizQuestionResponse.builder()
                                    .id(q.getId())
                                    .question(q.getQuestion())
                                    .questionType(q.getQuestionType())
                                    .options(q.getOptions())
                                    .correctAnswerIndex(q.getCorrectAnswerIndex())
                                    .correctAnswerText(q.getCorrectAnswerText())
                                    .answerGuide(q.getAnswerGuide())
                                    .build())
                            .collect(java.util.stream.Collectors.toList()));
                }
            }
            case C -> {
                builder.requiredFiles(task.getRequiredFiles());
            }
            case D -> {
                builder.checklistItems(task.getChecklistItems().stream()
                        .map(item -> kr.codeit.onboarding.dto.ChecklistItemResponse.builder()
                                .id(item.getId())
                                .label(item.getLabel())
                                .checked(false) // PM editing doesn't need instructor-specific status
                                .build())
                        .collect(java.util.stream.Collectors.toList()));
            }
        }

        return builder.build();
    }
}
