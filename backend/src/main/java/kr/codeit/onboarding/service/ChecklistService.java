package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.*;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import kr.codeit.onboarding.dto.ChecklistItemLabelUpdateRequest;
import kr.codeit.onboarding.dto.ChecklistItemResponse;
import kr.codeit.onboarding.dto.ChecklistUpdateRequest;
import kr.codeit.onboarding.exception.ResourceNotFoundException;
import kr.codeit.onboarding.repository.*;
import kr.codeit.onboarding.security.SecurityContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChecklistService {

    private final ChecklistItemRepository checklistItemRepository;
    private final InstructorChecklistItemRepository instructorChecklistItemRepository;
    private final InstructorRepository instructorRepository;
    private final TaskRepository taskRepository;
    private final OnboardingStepRepository stepRepository;
    private final InstructorService instructorService;
    private final SecurityContext securityContext;

    @Transactional
    public ChecklistItemResponse updateChecklistItem(Long checklistItemId, ChecklistUpdateRequest request) {
        // Get instructor ID from authenticated user (prevents IDOR vulnerability)
        Long instructorId = instructorService.getCurrentInstructorId();

        ChecklistItem checklistItem = checklistItemRepository.findById(checklistItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found"));

        Instructor instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        // Find or create instructor checklist item
        InstructorChecklistItem instructorItem = instructorChecklistItemRepository
                .findByInstructorIdAndChecklistItemId(instructorId, checklistItemId)
                .orElse(InstructorChecklistItem.builder()
                        .instructor(instructor)
                        .checklistItem(checklistItem)
                        .isChecked(false)
                        .build());

        instructorItem.setIsChecked(request.getChecked());
        instructorItem.setCheckedAt(request.getChecked() ? LocalDateTime.now() : null);
        instructorChecklistItemRepository.save(instructorItem);

        // Check if all items in the task are checked
        Task task = checklistItem.getTask();
        long totalItems = task.getChecklistItems().size();
        long checkedItems = task.getChecklistItems().stream()
                .filter(item -> {
                    return instructorChecklistItemRepository
                            .findByInstructorIdAndChecklistItemId(instructorId, item.getId())
                            .map(InstructorChecklistItem::getIsChecked)
                            .orElse(false);
                })
                .count();

        if (checkedItems == totalItems && totalItems > 0) {
            task.setStatus(TaskStatus.COMPLETED);
            taskRepository.save(task);

            // Update step progress
            OnboardingStep step = task.getStep();
            step.updateProgress();
            stepRepository.save(step);
        }

        return ChecklistItemResponse.builder()
                .id(checklistItem.getId())
                .label(checklistItem.getLabel())
                .checked(instructorItem.getIsChecked())
                .build();
    }

    /**
     * Update checklist item label (PM only)
     * Allows PM to update the label of a checklist item even if instructor is in progress
     */
    @Transactional
    public ChecklistItemResponse updateChecklistItemLabel(Long checklistItemId, ChecklistItemLabelUpdateRequest request) {
        securityContext.requirePm(); // Only PM can update label
        
        ChecklistItem checklistItem = checklistItemRepository.findById(checklistItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found"));

        checklistItem.setLabel(request.getLabel());
        checklistItem = checklistItemRepository.save(checklistItem);

        return ChecklistItemResponse.builder()
                .id(checklistItem.getId())
                .label(checklistItem.getLabel())
                .checked(false) // This is for PM update, checked status is not relevant
                .build();
    }
}
