package kr.codeit.onboarding.controller;

import jakarta.validation.Valid;
import kr.codeit.onboarding.dto.ChecklistItemLabelUpdateRequest;
import kr.codeit.onboarding.dto.ChecklistItemResponse;
import kr.codeit.onboarding.dto.ChecklistUpdateRequest;
import kr.codeit.onboarding.service.ChecklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Checklist Item Management.
 *
 * <p>This controller manages checklist items within tasks, providing functionality for:</p>
 * <ul>
 *   <li>Checklist item completion status updates by instructors</li>
 *   <li>Checklist item label modifications (PM only)</li>
 *   <li>Progress tracking for task checklists</li>
 * </ul>
 *
 * <p>Checklist items are sub-tasks within a main task that instructors must complete
 * to fulfill task requirements. They provide granular progress tracking.</p>
 *
 * <p>Access Control:</p>
 * <ul>
 *   <li>Instructors: Can update completion status of their own checklist items</li>
 *   <li>PM: Can update checklist labels and content</li>
 * </ul>
 *
 * @author Sprint Tutor Flow Team
 * @since 1.0
 */
@RestController
@RequestMapping("/checklist")
@RequiredArgsConstructor
@Validated
public class ChecklistController {

    private final ChecklistService checklistService;

    /**
     * Update checklist item completion status.
     *
     * <p>Allows instructors to mark checklist items as completed or incomplete. Updates
     * are automatically tracked with timestamps. Completing all checklist items may be
     * required for task completion.</p>
     *
     * <p>Instructor access - operates on authenticated user's checklist items only.</p>
     *
     * @param checklistItemId the checklist item ID to update
     * @param request the update request containing completion status
     * @return ResponseEntity containing updated checklist item details
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if checklist item not found
     * @throws kr.codeit.onboarding.exception.UnauthorizedException if item doesn't belong to current instructor
     */
    @PutMapping("/{checklistItemId}")
    public ResponseEntity<ChecklistItemResponse> updateChecklistItem(
            @PathVariable Long checklistItemId,
            @Valid @RequestBody ChecklistUpdateRequest request) {
        ChecklistItemResponse response = checklistService.updateChecklistItem(checklistItemId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Update checklist item label and content.
     *
     * <p>Allows PMs to modify checklist item text, descriptions, or requirements. Changes
     * affect all instructors assigned to the parent task. Useful for clarifying requirements
     * or correcting checklist content.</p>
     *
     * <p>PM access only.</p>
     *
     * @param checklistItemId the checklist item ID to update
     * @param request the label update request with new text
     * @return ResponseEntity containing updated checklist item details
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if checklist item not found
     */
    @PutMapping("/{checklistItemId}/label")
    public ResponseEntity<ChecklistItemResponse> updateChecklistItemLabel(
            @PathVariable Long checklistItemId,
            @Valid @RequestBody ChecklistItemLabelUpdateRequest request) {
        ChecklistItemResponse response = checklistService.updateChecklistItemLabel(checklistItemId, request);
        return ResponseEntity.ok(response);
    }
}
