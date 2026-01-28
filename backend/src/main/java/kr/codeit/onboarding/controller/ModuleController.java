package kr.codeit.onboarding.controller;

import jakarta.validation.Valid;
import kr.codeit.onboarding.dto.ModuleRequest;
import kr.codeit.onboarding.dto.ModuleResponse;
import kr.codeit.onboarding.service.ModuleImportService;
import kr.codeit.onboarding.service.ModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * REST Controller for Learning Module Management.
 *
 * <p>This controller manages learning modules that are used in onboarding steps including:</p>
 * <ul>
 *   <li>Module creation and configuration (documents, videos, quizzes, etc.)</li>
 *   <li>Module content updates and deletion</li>
 *   <li>Video file upload for video-based modules</li>
 *   <li>Bulk module import from CSV/Excel files</li>
 *   <li>Module retrieval by step definition</li>
 * </ul>
 *
 * <p>Module Types:</p>
 * <ul>
 *   <li>Type A: Document-based learning with quizzes</li>
 *   <li>Type B: Video-based learning with visual content</li>
 *   <li>Type C: Mixed content with documents, videos, and assessments</li>
 * </ul>
 *
 * <p>PM access only for all operations.</p>
 *
 * @author Sprint Tutor Flow Team
 * @since 1.0
 */
@RestController
@RequestMapping("/modules")
@RequiredArgsConstructor
@Validated
public class ModuleController {

    private final ModuleService moduleService;
    private final ModuleImportService moduleImportService;

    /**
     * Create a new learning module.
     *
     * <p>Creates a new module with specified type, content, and configuration. The module
     * can be later assigned to step definitions and used in instructor onboarding.</p>
     *
     * <p>PM access only.</p>
     *
     * @param request the module creation request containing title, type, content, and configuration
     * @return ResponseEntity containing the created module details
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if referenced step definition not found
     */
    @PostMapping
    public ResponseEntity<ModuleResponse> createModule(
            @Valid @RequestBody ModuleRequest request) {
        ModuleResponse response = moduleService.createModule(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieve all modules or filter by step definition.
     *
     * <p>Returns a list of all modules in the system. Can be filtered by step definition ID
     * to retrieve only modules assigned to a specific step.</p>
     *
     * <p>PM access only.</p>
     *
     * @param stepDefinitionId optional step definition ID to filter modules
     * @return ResponseEntity containing list of modules
     */
    @GetMapping
    public ResponseEntity<List<ModuleResponse>> getAllModules(
            @RequestParam(required = false) Long stepDefinitionId) {
        List<ModuleResponse> modules;
        if (stepDefinitionId != null) {
            modules = moduleService.getModulesByStepDefinition(stepDefinitionId);
        } else {
            modules = moduleService.getAllModules();
        }
        return ResponseEntity.ok(modules);
    }

    /**
     * Retrieve a specific module by ID.
     *
     * <p>Returns detailed information about a single module including all content,
     * quiz questions, and configuration settings.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the module ID
     * @return ResponseEntity containing module details
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if module not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<ModuleResponse> getModule(
            @PathVariable Long id) {
        ModuleResponse response = moduleService.getModule(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Update an existing module.
     *
     * <p>Updates module content, title, type, or configuration. Changes will affect all
     * instructors who have this module assigned in their onboarding steps.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the module ID to update
     * @param request the update request with modified module details
     * @return ResponseEntity containing updated module information
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if module not found
     */
    @PutMapping("/{id}")
    public ResponseEntity<ModuleResponse> updateModule(
            @PathVariable Long id,
            @Valid @RequestBody ModuleRequest request) {
        ModuleResponse response = moduleService.updateModule(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a module.
     *
     * <p>Permanently removes a module from the system. Cannot delete modules that are
     * currently assigned to active instructor onboarding steps.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the module ID to delete
     * @return ResponseEntity with no content (204)
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if module not found
     * @throws kr.codeit.onboarding.exception.DuplicateResourceException if module is in use
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteModule(
            @PathVariable Long id) {
        moduleService.deleteModule(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Move a module to a different step definition.
     *
     * <p>Reassigns a module from its current step definition to a different step.
     * This is useful when reorganizing modules across steps or fixing incorrect assignments.</p>
     *
     * <p>PM access only.</p>
     *
     * @param moduleId the module ID to move
     * @param stepDefinitionId the target step definition ID
     * @return ResponseEntity containing updated module information
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if module or step definition not found
     */
    @PutMapping("/{moduleId}/move-to-step/{stepDefinitionId}")
    public ResponseEntity<ModuleResponse> moveModuleToStep(
            @PathVariable Long moduleId,
            @PathVariable Long stepDefinitionId) {
        ModuleResponse response = moduleService.moveModuleToStep(moduleId, stepDefinitionId);
        return ResponseEntity.ok(response);
    }

    /**
     * Import multiple modules from CSV or Excel file.
     *
     * <p>Performs bulk import of modules from a CSV or Excel file. The file must follow
     * the required format with columns for title, type, content, URLs, and other module
     * properties. Invalid rows will be skipped with error reporting.</p>
     *
     * <p>PM access only.</p>
     *
     * @param file the CSV or Excel file containing module data
     * @return ResponseEntity containing list of successfully imported modules
     * @throws IOException if file cannot be read or parsed
     * @throws kr.codeit.onboarding.exception.InvalidCredentialsException if file format is invalid
     */
    @PostMapping("/import")
    public ResponseEntity<List<ModuleResponse>> importModules(
            @RequestParam("file") MultipartFile file) throws IOException {
        List<ModuleResponse> modules = moduleImportService.importModulesFromFile(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(modules);
    }

    /**
     * Upload video file to a module.
     *
     * <p>Uploads a video file for Type B (video-based) modules. The video will be stored
     * either locally or in cloud storage (S3) based on configuration. Supports MP4, WebM,
     * MOV, and other common video formats.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the module ID to upload video to
     * @param file the video file to upload
     * @return ResponseEntity containing updated module information with video URL
     * @throws IOException if file upload fails
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if module not found
     * @throws kr.codeit.onboarding.exception.InvalidCredentialsException if file type is not supported
     */
    @PostMapping("/{id}/upload-video")
    public ResponseEntity<ModuleResponse> uploadVideo(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        ModuleResponse response = moduleService.uploadVideoToModule(id, file);
        return ResponseEntity.ok(response);
    }
}


