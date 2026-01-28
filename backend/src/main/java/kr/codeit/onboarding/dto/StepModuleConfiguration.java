package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Configuration for a step's modules during instructor registration.
 * Specifies which step and which modules are enabled for the instructor.
 *
 * <p>This DTO is used when registering instructors to specify:
 * <ul>
 *   <li>Which step (by ID)</li>
 *   <li>Which modules within that step should be enabled (subset of step's default modules)</li>
 * </ul>
 *
 * <p>PM selects steps for the instructor, then toggles individual modules on/off per step.
 * Only enabled modules will create tasks for the instructor.
 *
 * @author Sprint Tutor Team
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Step module configuration for instructor registration")
public class StepModuleConfiguration {

    /**
     * Step definition ID.
     */
    @Schema(
        description = "Step definition ID",
        example = "1",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotNull(message = "Step ID is required")
    private Long stepId;

    /**
     * List of enabled module IDs for this step.
     * Must be a subset of the step's defaultModuleIds.
     * Modules not in this list will be disabled (is_enabled = false) for the instructor.
     */
    @Schema(
        description = "List of enabled module IDs for this step (subset of step's default modules)",
        example = "[1, 3, 5]",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotNull(message = "Enabled module IDs are required")
    private List<Long> enabledModuleIds;
}
