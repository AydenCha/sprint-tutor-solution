package kr.codeit.onboarding.controller;

import jakarta.validation.Valid;
import kr.codeit.onboarding.dto.TrackRequest;
import kr.codeit.onboarding.dto.TrackResponse;
import kr.codeit.onboarding.service.TrackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Track Management.
 *
 * <p>This controller manages onboarding tracks which define instructor career paths:</p>
 * <ul>
 *   <li>Track creation and configuration</li>
 *   <li>Track updates and deletion</li>
 *   <li>Track retrieval and listing</li>
 *   <li>Track enable/disable state management</li>
 * </ul>
 *
 * <p>Tracks represent different instructor roles or specializations (e.g., "Frontend Developer",
 * "Backend Developer", "Full Stack Developer"). Each track is associated with a step template
 * that defines the onboarding workflow for instructors in that track.</p>
 *
 * <p>Access Control:</p>
 * <ul>
 *   <li>PM: Full access to all tracks and management operations</li>
 *   <li>Others: Can only view enabled tracks</li>
 * </ul>
 *
 * @author Sprint Tutor Flow Team
 * @since 1.0
 */
@RestController
@RequestMapping("/tracks")
@RequiredArgsConstructor
@Validated
public class TrackController {

    private final TrackService trackService;

    /**
     * Retrieve all tracks.
     *
     * <p>Returns a list of tracks based on user role. PMs can see all tracks including
     * disabled ones, while other users only see enabled tracks available for assignment.</p>
     *
     * @return ResponseEntity containing list of tracks
     */
    @GetMapping
    public ResponseEntity<List<TrackResponse>> getAllTracks() {
        List<TrackResponse> tracks = trackService.getAllTracks();
        return ResponseEntity.ok(tracks);
    }

    /**
     * Retrieve a specific track by ID.
     *
     * <p>Returns detailed information about a track including name, description, associated
     * step template, and enabled status.</p>
     *
     * @param id the track ID
     * @return ResponseEntity containing track details
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if track not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<TrackResponse> getTrackById(
            @PathVariable Long id) {
        TrackResponse track = trackService.getTrackById(id);
        return ResponseEntity.ok(track);
    }

    /**
     * Create a new track.
     *
     * <p>Creates a new onboarding track with specified name, description, and associated
     * step template. The track will be available for instructor assignment.</p>
     *
     * <p>PM access only.</p>
     *
     * @param request the track creation request containing name, description, and template
     * @return ResponseEntity containing the created track
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if referenced step template not found
     * @throws kr.codeit.onboarding.exception.DuplicateResourceException if track name already exists
     */
    @PostMapping
    public ResponseEntity<TrackResponse> createTrack(
            @Valid @RequestBody TrackRequest request) {
        TrackResponse track = trackService.createTrack(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(track);
    }

    /**
     * Update an existing track.
     *
     * <p>Updates track name, description, associated template, or enabled status. Changing
     * the step template will affect new instructor assignments but not existing ones.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the track ID to update
     * @param request the update request with modified track details
     * @return ResponseEntity containing updated track information
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if track or template not found
     * @throws kr.codeit.onboarding.exception.DuplicateResourceException if new track name already exists
     */
    @PutMapping("/{id}")
    public ResponseEntity<TrackResponse> updateTrack(
            @PathVariable Long id,
            @Valid @RequestBody TrackRequest request) {
        TrackResponse track = trackService.updateTrack(id, request);
        return ResponseEntity.ok(track);
    }

    /**
     * Delete a track.
     *
     * <p>Permanently removes a track from the system. Cannot delete tracks that are currently
     * assigned to active instructors. All instructors must be reassigned to other tracks first.</p>
     *
     * <p>PM access only.</p>
     *
     * @param id the track ID to delete
     * @return ResponseEntity with no content (204)
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if track not found
     * @throws kr.codeit.onboarding.exception.DuplicateResourceException if track has active instructors
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrack(
            @PathVariable Long id) {
        trackService.deleteTrack(id);
        return ResponseEntity.noContent().build();
    }
}

