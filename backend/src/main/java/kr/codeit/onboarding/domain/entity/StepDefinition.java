package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * StepDefinition entity representing a reusable step template.
 *
 * <p>Step definitions are the building blocks that PMs use to create
 * onboarding workflows. They define the basic properties of a step that
 * can be reused across multiple step templates.
 *
 * <p>Key features:
 * <ul>
 *   <li>Reusable across multiple StepTemplates</li>
 *   <li>Default D-Day value (can be overridden per template)</li>
 *   <li>Step type classification (PM-led, self-check, delayed, skipped)</li>
 *   <li>Display ordering for presentation</li>
 * </ul>
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "step_definitions", indexes = {
    @Index(name = "idx_step_definition_created_by", columnList = "created_by_pm_id"),
    @Index(name = "idx_step_definition_display_order", columnList = "display_order"),
    @Index(name = "idx_step_definition_step_type", columnList = "step_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StepDefinition extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Title of the step definition.
     */
    @NotBlank(message = "Title is required")
    @Column(nullable = false, length = 255)
    private String title;

    /**
     * Optional emoji icon for visual identification.
     */
    @Column(length = 10)
    private String emoji;

    /**
     * Detailed description of the step's purpose and requirements.
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * PM user who created this step definition.
     */
    @NotNull(message = "Creator is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_pm_id", nullable = false)
    private User createdBy;

    /**
     * Default D-Day value for this step.
     * Can be overridden in StepTemplateStep for specific templates.
     */
    @Column(name = "default_d_day")
    private Integer defaultDDay;

    /**
     * Step type keyword (PM-led, self-check, delayed, skipped).
     * Helps categorize and filter step definitions.
     */
    @Column(name = "step_type", length = 50)
    private String stepType;

    /**
     * Display order for step definitions.
     * Used when presenting available step definitions to PMs.
     */
    @NotNull(message = "Display order is required")
    @PositiveOrZero(message = "Display order must be zero or positive")
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    /**
     * Modules belonging to this step definition.
     * Bidirectional relationship for efficient querying.
     * This is the preferred way to access modules associated with this step.
     * When this step definition is deleted, all associated modules are also deleted (CASCADE).
     */
    @OneToMany(mappedBy = "stepDefinition", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<ContentModule> contentModules = new ArrayList<>();

    /**
     * DEPRECATED: Use contentModules relationship instead.
     * List of default module IDs assigned to this step definition.
     * Stored as JSON array in database.
     * PMs can assign content modules to steps, which will be used
     * when creating onboarding tasks for instructors.
     * This field is kept for backward compatibility during migration period.
     */
    @Deprecated
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "default_module_ids", columnDefinition = "json")
    @Builder.Default
    private List<Long> defaultModuleIds = new ArrayList<>();

    /**
     * Get modules for this step in creation order.
     * Preferred method over defaultModuleIds.
     *
     * @return list of content modules (defensive copy)
     */
    public List<ContentModule> getModules() {
        return new ArrayList<>(contentModules);
    }

    /**
     * Get module IDs for this step.
     * Convenience method for API responses and backward compatibility.
     *
     * @return list of module IDs
     */
    public List<Long> getModuleIds() {
        return contentModules.stream()
                .map(ContentModule::getId)
                .collect(Collectors.toList());
    }

    /**
     * Checks if this step has a default D-Day value set.
     *
     * @return true if defaultDDay is not null
     */
    public boolean hasDefaultDDay() {
        return defaultDDay != null;
    }

    /**
     * Checks if this step has a type classification.
     *
     * @return true if stepType is not null or blank
     */
    public boolean hasStepType() {
        return stepType != null && !stepType.isBlank();
    }

    /**
     * Checks if this step has an emoji icon.
     *
     * @return true if emoji is not null or blank
     */
    public boolean hasEmoji() {
        return emoji != null && !emoji.isBlank();
    }

    /**
     * Checks if this step has any default modules assigned.
     *
     * @return true if defaultModuleIds is not null and not empty
     */
    public boolean hasDefaultModules() {
        return defaultModuleIds != null && !defaultModuleIds.isEmpty();
    }
}
