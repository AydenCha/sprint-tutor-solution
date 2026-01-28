package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * ModuleChecklistItem entity representing a checklist item within a content module.
 *
 * <p>Similar to ChecklistItem but belongs to a reusable ContentModule instead
 * of a specific task. When a module is assigned to a task, these items are
 * typically copied to the task level.
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "module_checklist_items", indexes = {
    @Index(name = "idx_module_checklist_item_module", columnList = "module_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModuleChecklistItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The content module this checklist item belongs to.
     */
    @NotNull(message = "Content module is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private ContentModule contentModule;

    /**
     * Label or description of the checklist item.
     */
    @NotBlank(message = "Label is required")
    @Column(nullable = false, length = 500)
    private String label;
}
