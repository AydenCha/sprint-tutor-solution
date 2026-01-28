package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.Track;
import kr.codeit.onboarding.dto.TrackRequest;
import kr.codeit.onboarding.dto.TrackResponse;
import kr.codeit.onboarding.exception.DuplicateResourceException;
import kr.codeit.onboarding.exception.ResourceNotFoundException;
import kr.codeit.onboarding.repository.InstructorRepository;
import kr.codeit.onboarding.repository.TrackRepository;
import kr.codeit.onboarding.security.SecurityContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TrackService {

    private final TrackRepository trackRepository;
    private final InstructorRepository instructorRepository;
    private final SecurityContext securityContext;

    /**
     * Get all tracks (only enabled tracks for non-PM users)
     */
    public List<TrackResponse> getAllTracks() {
        if (securityContext.isPm()) {
            // PM can see all tracks (enabled and disabled)
            return trackRepository.findAll().stream()
                    .map(this::toTrackResponse)
                    .collect(Collectors.toList());
        } else {
            // Non-PM users only see enabled tracks
            return trackRepository.findByEnabledTrueOrderByNameAsc().stream()
                    .map(this::toTrackResponse)
                    .collect(Collectors.toList());
        }
    }

    /**
     * Get track by ID
     */
    public TrackResponse getTrackById(Long id) {
        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + id));
        return toTrackResponse(track);
    }

    /**
     * Create new track (PM only)
     */
    @Transactional
    public TrackResponse createTrack(TrackRequest request) {
        securityContext.requirePm();

        // Check for duplicates
        if (trackRepository.existsByCode(request.getCode().toUpperCase())) {
            throw new DuplicateResourceException("트랙 코드가 이미 존재합니다: " + request.getCode());
        }
        if (trackRepository.existsByName(request.getName().toUpperCase())) {
            throw new DuplicateResourceException("트랙 이름(영문)이 이미 존재합니다: " + request.getName());
        }
        if (trackRepository.existsByKoreanName(request.getKoreanName())) {
            throw new DuplicateResourceException("트랙 이름(한글)이 이미 존재합니다: " + request.getKoreanName());
        }

        Track track = Track.builder()
                .name(request.getName().toUpperCase().trim())
                .koreanName(request.getKoreanName().trim())
                .code(request.getCode().toUpperCase().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .enabled(request.getEnabled() != null ? request.getEnabled() : true)
                .build();

        track = trackRepository.save(track);
        return toTrackResponse(track);
    }

    /**
     * Update track (PM only)
     */
    @Transactional
    public TrackResponse updateTrack(Long id, TrackRequest request) {
        securityContext.requirePm();

        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + id));

        // Check for duplicates (excluding current track)
        Track existingByCode = trackRepository.findByCode(request.getCode().toUpperCase()).orElse(null);
        if (existingByCode != null && !existingByCode.getId().equals(id)) {
            throw new DuplicateResourceException("트랙 코드가 이미 존재합니다: " + request.getCode());
        }
        Track existingByName = trackRepository.findByName(request.getName().toUpperCase()).orElse(null);
        if (existingByName != null && !existingByName.getId().equals(id)) {
            throw new DuplicateResourceException("트랙 이름(영문)이 이미 존재합니다: " + request.getName());
        }
        Track existingByKoreanName = trackRepository.findByKoreanName(request.getKoreanName()).orElse(null);
        if (existingByKoreanName != null && !existingByKoreanName.getId().equals(id)) {
            throw new DuplicateResourceException("트랙 이름(한글)이 이미 존재합니다: " + request.getKoreanName());
        }

        track.setName(request.getName().toUpperCase().trim());
        track.setKoreanName(request.getKoreanName().trim());
        track.setCode(request.getCode().toUpperCase().trim());
        track.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        if (request.getEnabled() != null) {
            track.setEnabled(request.getEnabled());
        }

        track = trackRepository.save(track);
        return toTrackResponse(track);
    }

    /**
     * Delete track (PM only)
     * Cannot delete if there are instructors using this track
     */
    @Transactional
    public void deleteTrack(Long id) {
        securityContext.requirePm();

        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + id));

        // Check if any instructors are using this track
        long instructorCount = instructorRepository.findByTrack(track).size();

        if (instructorCount > 0) {
            throw new IllegalStateException(
                    String.format("해당 트랙에 등록된 강사가 %d명 있어 삭제할 수 없습니다. " +
                    "먼저 해당 트랙의 강사를 다른 트랙으로 변경하거나 삭제해주세요.", instructorCount)
            );
        }

        trackRepository.delete(track);
    }

    /**
     * Get track by code
     */
    public TrackResponse getTrackByCode(String code) {
        Track track = trackRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Track not found with code: " + code));
        return toTrackResponse(track);
    }

    /**
     * Get track entity by code (internal use)
     */
    public Track getTrackEntityByCode(String code) {
        return trackRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Track not found with code: " + code));
    }

    /**
     * Get track entity by name (internal use)
     */
    public Track getTrackEntityByName(String name) {
        return trackRepository.findByName(name.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Track not found with name: " + name));
    }

    /**
     * Get track entity by Korean name (internal use)
     */
    public Track getTrackEntityByKoreanName(String koreanName) {
        return trackRepository.findByKoreanName(koreanName)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found with Korean name: " + koreanName));
    }

    private TrackResponse toTrackResponse(Track track) {
        return TrackResponse.builder()
                .id(track.getId())
                .name(track.getName())
                .koreanName(track.getKoreanName())
                .code(track.getCode())
                .enabled(track.getEnabled())
                .description(track.getDescription())
                .createdAt(track.getCreatedAt() != null ? track.getCreatedAt().toString() : null)
                .updatedAt(track.getUpdatedAt() != null ? track.getUpdatedAt().toString() : null)
                .build();
    }
}

