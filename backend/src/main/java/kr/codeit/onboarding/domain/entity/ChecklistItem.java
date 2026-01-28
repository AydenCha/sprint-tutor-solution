package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * ChecklistItem entity representing a checklist item within a task.
 *
 * <p>Checklist items provide a way for instructors to track completion of
 * specific sub-tasks or requirements within a larger task.
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "checklist_items", indexes = {
    @Index(name = "idx_checklist_item_task", columnList = "task_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The task this checklist item belongs to.
     */
    @NotNull(message = "Task is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    /**
     * Label or description of the checklist item.
     */
    @NotBlank(message = "Label is required")
    @Column(nullable = false, length = 500)
    private String label;

    /**
     * Instructor-specific completion records for this checklist item.
     */
    @OneToMany(mappedBy = "checklistItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InstructorChecklistItem> instructorItems = new ArrayList<>();

    /**
     * Checks if this checklist item has been completed by a specific instructor.
     *
     * @param instructorId the instructor's ID
     * @return true if the instructor has checked this item
     */
    public boolean isCompletedByInstructor(Long instructorId) {
        return instructorItems.stream()
                .anyMatch(item -> item.getInstructor().getId().equals(instructorId)
                        && Boolean.TRUE.equals(item.getIsChecked()));
    }

    /**
     * Gets the completion count across all instructors.
     *
     * @return number of instructors who have checked this item
     */
    public long getCompletionCount() {
        return instructorItems.stream()
                .filter(item -> Boolean.TRUE.equals(item.getIsChecked()))
                .count();
    }
}
