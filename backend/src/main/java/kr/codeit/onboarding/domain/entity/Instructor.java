package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import kr.codeit.onboarding.domain.enums.InstructorType;
import kr.codeit.onboarding.domain.enums.OnboardingModule;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Instructor entity representing an instructor participating in the onboarding program.
 *
 * <p>Each instructor is associated with a user account and assigned to a specific track
 * and cohort. The instructor progresses through a series of onboarding steps, with their
 * progress tracked automatically.
 *
 * <p>Key features:
 * <ul>
 *   <li>Unique access code for secure login</li>
 *   <li>Progress tracking across multiple onboarding steps</li>
 *   <li>Support for different instructor types (new, experienced, renewal)</li>
 *   <li>Modular onboarding paths (Module A-F)</li>
 * </ul>
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "instructors", indexes = {
    @Index(name = "idx_instructor_access_code", columnList = "access_code"),
    @Index(name = "idx_instructor_user_id", columnList = "user_id"),
    @Index(name = "idx_instructor_track_cohort", columnList = "track_id, cohort"),
    @Index(name = "idx_instructor_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Instructor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Associated user account.
     * One-to-one relationship ensures each instructor has exactly one user account.
     */
    @NotNull(message = "User is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * Instructor's contact phone number.
     */
    @NotBlank(message = "Phone number is required")
    @Column(nullable = false, length = 20)
    private String phone;

    /**
     * Assigned track (e.g., Frontend, Backend, Design).
     */
    @NotNull(message = "Track is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id", nullable = false)
    private Track track;

    /**
     * Cohort identifier (e.g., "2024-Q1", "Spring 2024").
     */
    @NotBlank(message = "Cohort is required")
    @Column(nullable = false, length = 50)
    private String cohort;

    /**
     * Unique access code for instructor login.
     * Generated during registration and used for secure access.
     */
    @NotBlank(message = "Access code is required")
    @Column(name = "access_code", nullable = false, unique = true, length = 50)
    private String accessCode;

    /**
     * Onboarding start date.
     */
    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /**
     * Current step number in the onboarding process.
     * Defaults to 1 (first step).
     */
    @PositiveOrZero(message = "Current step must be zero or positive")
    @Column(name = "current_step")
    @Builder.Default
    private Integer currentStep = 1;

    /**
     * Overall progress percentage (0-100).
     */
    @PositiveOrZero(message = "Overall progress must be zero or positive")
    @Column(name = "overall_progress")
    @Builder.Default
    private Integer overallProgress = 0;

    /**
     * Type of instructor (new, experienced, renewal).
     * Determines the onboarding path and requirements.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "instructor_type", length = 20)
    private InstructorType instructorType;

    /**
     * Assigned onboarding module (Module A-F).
     * Different modules provide different onboarding content.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "onboarding_module", length = 20)
    private OnboardingModule onboardingModule;

    /**
     * Reference to the step template used during registration.
     * Stored for audit purposes only, not a foreign key constraint.
     */
    @Column(name = "selected_step_template_id")
    private Long selectedStepTemplateId;

    /**
     * List of onboarding steps assigned to this instructor.
     * Managed bidirectionally with cascade operations.
     */
    @OneToMany(mappedBy = "instructor", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OnboardingStep> steps = new ArrayList<>();

    /**
     * Adds a step to this instructor's onboarding process.
     * Maintains bidirectional relationship consistency.
     *
     * @param step the step to add
     */
    public void addStep(OnboardingStep step) {
        if (step != null) {
            steps.add(step);
            step.setInstructor(this);
        }
    }

    /**
     * Removes a step from this instructor's onboarding process.
     * Maintains bidirectional relationship consistency.
     *
     * @param step the step to remove
     */
    public void removeStep(OnboardingStep step) {
        if (step != null) {
            steps.remove(step);
            step.setInstructor(null);
        }
    }

    /**
     * Calculates and updates the overall progress based on completed steps.
     * Progress is the percentage of completed steps out of total steps.
     */
    public void updateOverallProgress() {
        if (steps.isEmpty()) {
            this.overallProgress = 0;
            return;
        }

        long completedSteps = steps.stream()
                .filter(step -> step.getStatus() != null &&
                        step.getStatus().name().equals("COMPLETED"))
                .count();

        this.overallProgress = (int) ((completedSteps * 100) / steps.size());
    }

    /**
     * Gets the total number of steps in the onboarding process.
     *
     * @return total number of steps
     */
    public int getTotalSteps() {
        return steps.size();
    }

    /**
     * Checks if the instructor has completed all onboarding steps.
     *
     * @return true if all steps are completed
     */
    public boolean hasCompletedOnboarding() {
        return overallProgress == 100;
    }
}
