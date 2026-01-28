package kr.codeit.onboarding.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import kr.codeit.onboarding.dto.InstructorDashboardResponse;
import kr.codeit.onboarding.dto.InstructorRegistrationRequest;
import kr.codeit.onboarding.dto.InstructorResponse;
import kr.codeit.onboarding.dto.InstructorUpdateRequest;
import kr.codeit.onboarding.dto.InstructorStepsUpdateRequest;
import kr.codeit.onboarding.service.InstructorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Instructor Management.
 *
 * <p>This controller handles all instructor-related operations including:</p>
 * <ul>
 *   <li>Instructor registration and onboarding</li>
 *   <li>Instructor profile management</li>
 *   <li>Instructor dashboard with onboarding progress</li>
 *   <li>Instructor step assignments and updates</li>
 *   <li>Instructor listing with pagination and sorting</li>
 * </ul>
 *
 * <p>Access Control:</p>
 * <ul>
 *   <li>PM: Full access to all operations</li>
 *   <li>Instructor: Limited access to own dashboard</li>
 * </ul>
 *
 * @author Sprint Tutor Flow Team
 * @since 1.0
 */
@RestController
@RequestMapping("/instructors")
@RequiredArgsConstructor
@Validated
public class InstructorController {

    private final InstructorService instructorService;

    /**
     * Register a new instructor in the system.
     *
     * <p>Creates a new instructor account and assigns initial onboarding steps based on the
     * selected track. The instructor will be notified via email with login credentials.</p>
     *
     * <p>PM access only.</p>
     *
     * @param request the instructor registration request containing name, email, track, and other details
     * @return ResponseEntity containing the created instructor details
     * @throws kr.codeit.onboarding.exception.DuplicateResourceException if instructor email already exists
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if specified track not found
     */
    @PostMapping
    public ResponseEntity<InstructorResponse> registerInstructor(
            @Valid @RequestBody InstructorRegistrationRequest request) {
        InstructorResponse response = instructorService.registerInstructor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieve paginated list of all instructors.
     *
     * <p>Returns a paginated list of instructors with sorting capabilities. Default sorting is by D-day
     * (days until completion deadline) in ascending order.</p>
     *
     * <p>PM access only.</p>
     *
     * @param page the page number (0-indexed, default: 0)
     * @param size the page size (default: 20, max: 100)
     * @param sortBy the field to sort by (default: "dday", options: dday, name, startDate, createdAt)
     * @param direction the sort direction (default: ASC)
     * @return ResponseEntity containing paginated instructor list
     */
    @GetMapping
    public ResponseEntity<Page<InstructorResponse>> getAllInstructors(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "dday") String sortBy,
            @RequestParam(defaultValue = "ASC") Sort.Direction direction) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<InstructorResponse> instructors = instructorService.getAllInstructors(pageable);
        return ResponseEntity.ok(instructors);
    }

    /**
     * Retrieve detailed information for a specific instructor.
     *
     * <p>Returns comprehensive instructor details including all assigned onboarding steps,
     * tasks, and completion status.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the instructor ID
     * @return ResponseEntity containing instructor details with steps
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if instructor not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<InstructorResponse> getInstructor(
            @PathVariable Long id) {
        InstructorResponse instructor = instructorService.getInstructorWithSteps(id);
        return ResponseEntity.ok(instructor);
    }

    /**
     * Retrieve dashboard for the currently authenticated instructor.
     *
     * <p>Returns personalized dashboard with instructor's profile, assigned onboarding steps,
     * tasks, checklist items, and overall progress tracking.</p>
     *
     * <p>Instructor access - automatically uses authenticated user's context.</p>
     *
     * @return ResponseEntity containing instructor dashboard with all onboarding information
     * @throws kr.codeit.onboarding.exception.UnauthorizedException if user is not authenticated
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if instructor not found
     */
    @GetMapping("/dashboard")
    public ResponseEntity<InstructorDashboardResponse> getInstructorDashboard() {
        InstructorDashboardResponse dashboard = instructorService.getInstructorDashboard();
        return ResponseEntity.ok(dashboard);
    }

    /**
     * Update instructor information.
     *
     * <p>Allows updating instructor profile information such as name, email, start date,
     * and track assignment. Changing the track will reassign onboarding steps.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the instructor ID to update
     * @param request the update request containing modified fields
     * @return ResponseEntity containing updated instructor information
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if instructor not found
     * @throws kr.codeit.onboarding.exception.DuplicateResourceException if new email already exists
     */
    @PutMapping("/{id}")
    public ResponseEntity<InstructorResponse> updateInstructor(
            @PathVariable Long id,
            @Valid @RequestBody InstructorUpdateRequest request) {
        InstructorResponse response = instructorService.updateInstructor(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete an instructor from the system.
     *
     * <p>Permanently removes an instructor and all associated onboarding data. This action
     * cannot be undone. All progress and uploaded files will be deleted.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the instructor ID to delete
     * @return ResponseEntity with no content (204)
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if instructor not found
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInstructor(
            @PathVariable Long id) {
        instructorService.deleteInstructor(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Update an instructor's onboarding step assignments.
     *
     * <p>Allows manual adjustment of an instructor's onboarding steps, including adding,
     * removing, or reordering steps. Useful for customizing onboarding paths.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the instructor ID
     * @param request the step update request containing new step configuration
     * @return ResponseEntity containing updated instructor information with new steps
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if instructor or steps not found
     */
    @PutMapping("/{id}/steps")
    public ResponseEntity<InstructorResponse> updateInstructorSteps(
            @PathVariable Long id,
            @Valid @RequestBody InstructorStepsUpdateRequest request) {
        InstructorResponse response = instructorService.updateInstructorSteps(id, request);
        return ResponseEntity.ok(response);
    }
}
