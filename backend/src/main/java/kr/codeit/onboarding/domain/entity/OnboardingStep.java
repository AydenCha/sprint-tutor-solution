package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import kr.codeit.onboarding.domain.enums.StepType;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * OnboardingStep entity representing a single step in an instructor's onboarding journey.
 *
 * <p>Each step contains multiple tasks that the instructor must complete. The step's progress
 * is automatically calculated based on the completion status of its tasks.
 *
 * <p>Key features:
 * <ul>
 *   <li>Automatic progress tracking based on task completion</li>
 *   <li>Support for different step types (PM-led, self-check, skipped, delayed)</li>
 *   <li>D-Day countdown for time-sensitive steps</li>
 *   <li>Bidirectional relationship management with tasks</li>
 * </ul>
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "onboarding_steps", indexes = {
    @Index(name = "idx_onboarding_step_instructor", columnList = "instructor_id"),
    @Index(name = "idx_onboarding_step_instructor_step_number", columnList = "instructor_id, step_number"),
    @Index(name = "idx_onboarding_step_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingStep extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The instructor assigned to this onboarding step.
     */
    @NotNull(message = "Instructor is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private Instructor instructor;

    /**
     * The step definition template from which this step was created.
     * Optional field to track the original template.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_definition_id")
    private StepDefinition stepDefinition;

    /**
     * Sequential step number in the onboarding process.
     * Used for ordering and navigation.
     */
    @NotNull(message = "Step number is required")
    @PositiveOrZero(message = "Step number must be zero or positive")
    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    /**
     * Step title displayed to the user.
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
     * D-Day value for time-sensitive steps.
     * Indicates days until/after the step deadline.
     */
    @NotNull(message = "D-Day is required")
    @Column(name = "d_day", nullable = false)
    private Integer dDay;

    /**
     * Detailed description of the step's purpose and requirements.
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Current status of the step (PENDING, IN_PROGRESS, COMPLETED, SKIPPED).
     * Automatically updated based on task completion.
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TaskStatus status = TaskStatus.PENDING;

    /**
     * Type of step determining how it should be handled.
     * Options: PM-led, self-check, skipped, delayed.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "step_type", length = 20)
    private StepType stepType;

    /**
     * Total number of tasks in this step.
     * Updated automatically when tasks are added or removed.
     */
    @PositiveOrZero(message = "Total tasks must be zero or positive")
    @Column(name = "total_tasks")
    @Builder.Default
    private Integer totalTasks = 0;

    /**
     * Number of completed tasks in this step.
     * Updated by calling updateProgress().
     */
    @PositiveOrZero(message = "Completed tasks must be zero or positive")
    @Column(name = "completed_tasks")
    @Builder.Default
    private Integer completedTasks = 0;

    /**
     * List of tasks belonging to this step.
     * Managed bidirectionally with cascade operations.
     */
    @OneToMany(mappedBy = "step", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Task> tasks = new ArrayList<>();

    /**
     * Adds a task to this step and updates the total task count.
     * Maintains bidirectional relationship consistency.
     *
     * @param task the task to add
     */
    public void addTask(Task task) {
        if (task != null) {
            tasks.add(task);
            task.setStep(this);
            this.totalTasks = tasks.size();
        }
    }

    /**
     * Removes a task from this step and updates the total task count.
     * Maintains bidirectional relationship consistency.
     *
     * @param task the task to remove
     */
    public void removeTask(Task task) {
        if (task != null) {
            tasks.remove(task);
            task.setStep(null);
            this.totalTasks = tasks.size();
        }
    }

    /**
     * Updates the progress and status of this step based on task completion.
     *
     * <p>Progress calculation rules:
     * <ul>
     *   <li>Counts only ENABLED tasks (is_enabled = true)</li>
     *   <li>Counts tasks with COMPLETED status</li>
     *   <li>Considers both COMPLETED and SKIPPED tasks for overall completion</li>
     *   <li>Step is COMPLETED when all enabled tasks are COMPLETED or SKIPPED</li>
     *   <li>Step is IN_PROGRESS when at least one enabled task is completed or skipped</li>
     *   <li>Step is PENDING when no enabled tasks are completed or skipped</li>
     * </ul>
     */
    public void updateProgress() {
        if (tasks.isEmpty()) {
            this.completedTasks = 0;
            this.totalTasks = 0;
            this.status = TaskStatus.PENDING;
            return;
        }

        // Filter to only enabled tasks
        List<Task> enabledTasks = tasks.stream()
                .filter(Task::isEnabled)
                .collect(Collectors.toList());

        this.totalTasks = enabledTasks.size();

        if (enabledTasks.isEmpty()) {
            this.completedTasks = 0;
            this.status = TaskStatus.PENDING;
            return;
        }

        // Count strictly completed enabled tasks
        this.completedTasks = (int) enabledTasks.stream()
                .filter(task -> task.getStatus() == TaskStatus.COMPLETED)
                .count();

        // Count enabled tasks that are completed or skipped for status determination
        long completedOrSkippedTasks = enabledTasks.stream()
                .filter(task -> task.getStatus() == TaskStatus.COMPLETED
                        || task.getStatus() == TaskStatus.SKIPPED)
                .count();

        // Update status based on completion
        if (completedOrSkippedTasks == totalTasks && totalTasks > 0) {
            this.status = TaskStatus.COMPLETED;
        } else if (completedOrSkippedTasks > 0) {
            this.status = TaskStatus.IN_PROGRESS;
        } else {
            this.status = TaskStatus.PENDING;
        }
    }

    /**
     * Calculates the progress percentage of this step.
     *
     * @return progress percentage (0-100)
     */
    public int getProgressPercentage() {
        if (totalTasks == 0) {
            return 0;
        }
        return (completedTasks * 100) / totalTasks;
    }

    /**
     * Checks if this step is completed.
     *
     * @return true if the step status is COMPLETED
     */
    public boolean isCompleted() {
        return this.status == TaskStatus.COMPLETED;
    }

    /**
     * Checks if this step is in progress.
     *
     * @return true if the step status is IN_PROGRESS
     */
    public boolean isInProgress() {
        return this.status == TaskStatus.IN_PROGRESS;
    }
}
