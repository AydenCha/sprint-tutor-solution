package kr.codeit.onboarding.controller;

import jakarta.validation.Valid;
import kr.codeit.onboarding.dto.ModuleResponse;
import kr.codeit.onboarding.dto.StepDefinitionRequest;
import kr.codeit.onboarding.dto.StepDefinitionResponse;
import kr.codeit.onboarding.service.ModuleService;
import kr.codeit.onboarding.service.StepDefinitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Step Definition Management.
 *
 * <p>This controller manages step definitions which are the building blocks of onboarding workflows:</p>
 * <ul>
 *   <li>Step definition creation and configuration</li>
 *   <li>Step definition updates and deletion</li>
 *   <li>Step definition ordering and sequencing</li>
 *   <li>Step definition retrieval and listing</li>
 * </ul>
 *
 * <p>Step definitions represent types of onboarding activities (e.g., "Complete Documentation",
 * "Watch Training Videos", "Submit Assignment"). They can be reused across multiple templates
 * and tracks to create consistent onboarding experiences.</p>
 *
 * <p>Each step definition can contain:</p>
 * <ul>
 *   <li>Name and description</li>
 *   <li>Associated learning modules</li>
 *   <li>Tasks and checklists</li>
 *   <li>Completion criteria</li>
 * </ul>
 *
 * <p>PM access only for all operations.</p>
 *
 * @author Sprint Tutor Flow Team
 * @since 1.0
 */
@RestController
@RequestMapping("/steps/definitions")
@RequiredArgsConstructor
@Validated
public class StepDefinitionController {

    private final StepDefinitionService stepDefinitionService;
    private final ModuleService moduleService;

    /**
     * Retrieve all step definitions.
     *
     * <p>Returns a list of all step definitions available in the system. These definitions
     * can be used to build step templates and onboarding workflows.</p>
     *
     * <p>PM access only.</p>
     *
     * @return ResponseEntity containing list of all step definitions
     */
    @GetMapping
    public ResponseEntity<List<StepDefinitionResponse>> getAllDefinitions() {
        List<StepDefinitionResponse> definitions = stepDefinitionService.getAllDefinitions();
        return ResponseEntity.ok(definitions);
    }

    /**
     * Retrieve a specific step definition by ID.
     *
     * <p>Returns detailed information about a step definition including name, description,
     * associated modules, and configuration settings.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the step definition ID
     * @return ResponseEntity containing step definition details
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if step definition not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<StepDefinitionResponse> getDefinition(
            @PathVariable Long id) {
        StepDefinitionResponse definition = stepDefinitionService.getDefinition(id);
        return ResponseEntity.ok(definition);
    }

    /**
     * Create a new step definition.
     *
     * <p>Creates a new step definition that can be used in step templates and onboarding
     * workflows. The definition specifies the type of activity instructors will perform.</p>
     *
     * <p>PM access only.</p>
     *
     * @param request the step definition creation request with name and description
     * @return ResponseEntity containing the created step definition
     */
    @PostMapping
    public ResponseEntity<StepDefinitionResponse> createDefinition(
            @Valid @RequestBody StepDefinitionRequest request) {
        StepDefinitionResponse response = stepDefinitionService.createDefinition(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update an existing step definition.
     *
     * <p>Updates step definition name, description, or configuration. Changes will affect
     * all templates and instructors using this step definition.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the step definition ID to update
     * @param request the update request with modified step definition details
     * @return ResponseEntity containing updated step definition information
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if step definition not found
     */
    @PutMapping("/{id}")
    public ResponseEntity<StepDefinitionResponse> updateDefinition(
            @PathVariable Long id,
            @Valid @RequestBody StepDefinitionRequest request) {
        StepDefinitionResponse response = stepDefinitionService.updateDefinition(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a step definition.
     *
     * <p>Permanently removes a step definition. Cannot delete definitions that are currently
     * used in templates or assigned to active instructors.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the step definition ID to delete
     * @return ResponseEntity with no content (204)
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if step definition not found
     * @throws kr.codeit.onboarding.exception.DuplicateResourceException if definition is in use
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDefinition(
            @PathVariable Long id) {
        stepDefinitionService.deleteDefinition(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Update the order of step definitions.
     *
     * <p>Reorders step definitions for organizational and display purposes. This affects
     * the order in which step definitions appear in template building interfaces.</p>
     *
     * <p>PM access only.</p>
     *
     * @param stepDefinitionIdsInOrder the list of step definition IDs in desired order
     * @return ResponseEntity containing list of step definitions in new order
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if any step definition not found
     */
    @PutMapping("/order")
    public ResponseEntity<List<StepDefinitionResponse>> updateStepDefinitionOrder(
            @RequestBody List<Long> stepDefinitionIdsInOrder) {
        List<StepDefinitionResponse> response = stepDefinitionService.updateStepDefinitionOrder(stepDefinitionIdsInOrder);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all modules that belong to a step definition.
     *
     * <p>Returns a list of all content modules whose default step is this step definition.
     * This is useful for the instructor registration UI to show which modules should be
     * enabled by default when this step is selected.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the step definition ID
     * @return ResponseEntity containing list of modules belonging to this step
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if step definition not found
     */
    @GetMapping("/{id}/modules")
    public ResponseEntity<List<ModuleResponse>> getModulesByStepDefinition(
            @PathVariable Long id) {
        List<ModuleResponse> modules = moduleService.getModulesByStepDefinition(id);
        return ResponseEntity.ok(modules);
    }

    /**
     * Assign modules to a step definition.
     *
     * <p>Associates content modules with a step definition. When instructors are registered
     * using this step, these modules become available tasks that can be individually enabled
     * or disabled per instructor.</p>
     *
     * <p>The module order in the list determines the display order in the UI.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the step definition ID
     * @param moduleIds the list of content module IDs to assign (in display order)
     * @return ResponseEntity containing updated step definition with assigned modules
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if step definition or any module not found
     */
    @PutMapping("/{id}/modules")
    public ResponseEntity<StepDefinitionResponse> assignModules(
            @PathVariable Long id,
            @RequestBody List<Long> moduleIds) {
        StepDefinitionResponse response = stepDefinitionService.assignModules(id, moduleIds);
        return ResponseEntity.ok(response);
    }
}

