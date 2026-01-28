package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

/**
 * InstructorChecklistItem entity representing an instructor's completion status
 * for a specific checklist item.
 *
 * <p>This is a junction entity that tracks which instructors have completed
 * which checklist items, along with completion timestamps.
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "instructor_checklist_items", indexes = {
    @Index(name = "idx_instructor_checklist_instructor_item", columnList = "instructor_id, checklist_item_id"),
    @Index(name = "idx_instructor_checklist_instructor", columnList = "instructor_id"),
    @Index(name = "idx_instructor_checklist_item", columnList = "checklist_item_id"),
    @Index(name = "idx_instructor_checklist_checked", columnList = "is_checked")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstructorChecklistItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The instructor who owns this checklist item record.
     */
    @NotNull(message = "Instructor is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private Instructor instructor;

    /**
     * The checklist item being tracked.
     */
    @NotNull(message = "Checklist item is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checklist_item_id", nullable = false)
    private ChecklistItem checklistItem;

    /**
     * Whether the instructor has checked this item.
     */
    @NotNull(message = "Checked status is required")
    @Column(name = "is_checked", nullable = false)
    @Builder.Default
    private Boolean isChecked = false;

    /**
     * Timestamp when the item was checked.
     * Null if not yet checked.
     */
    @Column(name = "checked_at")
    private LocalDateTime checkedAt;

    /**
     * Marks this item as checked and records the timestamp.
     */
    public void check() {
        this.isChecked = true;
        this.checkedAt = LocalDateTime.now();
    }

    /**
     * Marks this item as unchecked and clears the timestamp.
     */
    public void uncheck() {
        this.isChecked = false;
        this.checkedAt = null;
    }

    /**
     * Toggles the checked status.
     */
    public void toggle() {
        if (Boolean.TRUE.equals(isChecked)) {
            uncheck();
        } else {
            check();
        }
    }
}
