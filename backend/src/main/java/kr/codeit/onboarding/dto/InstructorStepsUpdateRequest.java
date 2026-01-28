package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for updating instructor's onboarding step configuration.
 * <p>
 * PM users can modify an instructor's onboarding workflow by either:
 * <ul>
 *   <li>Using step configurations with module toggles (recommended)</li>
 *   <li>Applying a predefined step template (deprecated)</li>
 *   <li>Selecting custom step definitions in a specific order (deprecated)</li>
 *   <li>Resetting to default module-based steps (all fields null)</li>
 * </ul>
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update instructor's onboarding steps (PM only)")
public class InstructorStepsUpdateRequest {

    /**
     * Step configurations with module toggles.
     * <p>
     * Each configuration specifies a step and which modules are enabled.
     * Takes precedence over all other fields if provided.
     */
    @Schema(
        description = "Step configurations with module toggles - takes precedence over other fields",
        nullable = true
    )
    private List<StepModuleConfiguration> stepConfigurations;

    /**
     * Step template ID to apply (DEPRECATED).
     * <p>
     * If provided, replaces the instructor's current steps with those from the template.
     * Ignored if stepConfigurations is provided.
     */
    @Schema(
        description = "Step template ID to apply (deprecated, use stepConfigurations)",
        example = "1",
        nullable = true,
        deprecated = true
    )
    @Deprecated
    private Long selectedStepTemplateId;

    /**
     * Custom step definition IDs in order (DEPRECATED).
     * <p>
     * Ignored if stepConfigurations or selectedStepTemplateId is provided.
     * If all fields are null, system will use default module-based steps.
     */
    @Schema(
        description = "Custom step definition IDs in order (deprecated, use stepConfigurations)",
        example = "[1, 3, 5, 7]",
        nullable = true,
        deprecated = true
    )
    @Deprecated
    private List<Long> selectedStepDefinitionIds;
}
