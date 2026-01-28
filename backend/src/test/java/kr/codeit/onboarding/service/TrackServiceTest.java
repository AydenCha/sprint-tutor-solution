package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.Instructor;
import kr.codeit.onboarding.domain.entity.Track;
import kr.codeit.onboarding.domain.entity.User;
import kr.codeit.onboarding.domain.enums.UserRole;
import kr.codeit.onboarding.dto.TrackRequest;
import kr.codeit.onboarding.dto.TrackResponse;
import kr.codeit.onboarding.exception.DuplicateResourceException;
import kr.codeit.onboarding.exception.ResourceNotFoundException;
import kr.codeit.onboarding.repository.InstructorRepository;
import kr.codeit.onboarding.repository.TrackRepository;
import kr.codeit.onboarding.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TrackServiceTest {

    @Autowired
    private TrackService trackService;

    @Autowired
    private TrackRepository trackRepository;

    @Autowired
    private InstructorRepository instructorRepository;

    @Autowired
    private UserRepository userRepository;

    private User pmUser;
    private Track frontendTrack;

    @BeforeEach
    void setUp() {
        // Create PM user
        pmUser = User.builder()
                .email("pm@track.com")
                .name("PM User")
                .role(UserRole.PM)
                .build();
        pmUser = userRepository.save(pmUser);

        // Create Frontend track
        frontendTrack = Track.builder()
                .name("FRONTEND")
                .koreanName("프론트엔드")
                .code("FE")
                .enabled(true)
                .build();
        frontendTrack = trackRepository.save(frontendTrack);

        // Set up PM authentication
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                pmUser,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_PM"))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    @DisplayName("모든 트랙 조회 - PM 사용자")
    void getAllTracks_AsPm() {
        // Given - Create disabled track
        Track disabledTrack = Track.builder()
                .name("BACKEND")
                .koreanName("백엔드")
                .code("BE")
                .enabled(false)
                .build();
        trackRepository.save(disabledTrack);

        // When
        List<TrackResponse> tracks = trackService.getAllTracks();

        // Then - PM sees all tracks (enabled and disabled)
        assertThat(tracks).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("트랙 생성 성공")
    void createTrack_Success() {
        // Given
        TrackRequest request = new TrackRequest();
        request.setName("BACKEND");
        request.setKoreanName("백엔드");
        request.setCode("BE");
        request.setDescription("Backend Development Track");
        request.setEnabled(true);

        // When
        TrackResponse response = trackService.createTrack(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("BACKEND");
        assertThat(response.getKoreanName()).isEqualTo("백엔드");
        assertThat(response.getCode()).isEqualTo("BE");
        assertThat(response.getEnabled()).isTrue();

        // Verify in database
        Track saved = trackRepository.findByCode("BE").orElseThrow();
        assertThat(saved.getName()).isEqualTo("BACKEND");
    }

    @Test
    @DisplayName("트랙 생성 실패 - 중복된 코드")
    void createTrack_DuplicateCode() {
        // Given
        TrackRequest request = new TrackRequest();
        request.setName("FRONTEND2");
        request.setKoreanName("프론트엔드2");
        request.setCode("FE"); // Duplicate code
        request.setEnabled(true);

        // When & Then
        assertThatThrownBy(() -> trackService.createTrack(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("트랙 코드가 이미 존재합니다");
    }

    @Test
    @DisplayName("트랙 생성 실패 - 중복된 한글 이름")
    void createTrack_DuplicateKoreanName() {
        // Given
        TrackRequest request = new TrackRequest();
        request.setName("FRONTEND2");
        request.setKoreanName("프론트엔드"); // Duplicate Korean name
        request.setCode("FE2");
        request.setEnabled(true);

        // When & Then
        assertThatThrownBy(() -> trackService.createTrack(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("트랙 이름(한글)이 이미 존재합니다");
    }

    @Test
    @DisplayName("트랙 업데이트 성공")
    void updateTrack_Success() {
        // Given
        TrackRequest request = new TrackRequest();
        request.setName("FRONTEND");
        request.setKoreanName("프론트엔드 개발");
        request.setCode("FE");
        request.setDescription("Updated description");
        request.setEnabled(true);

        // When
        TrackResponse response = trackService.updateTrack(frontendTrack.getId(), request);

        // Then
        assertThat(response.getKoreanName()).isEqualTo("프론트엔드 개발");
        assertThat(response.getDescription()).isEqualTo("Updated description");

        // Verify in database
        Track updated = trackRepository.findById(frontendTrack.getId()).orElseThrow();
        assertThat(updated.getKoreanName()).isEqualTo("프론트엔드 개발");
    }

    @Test
    @DisplayName("트랙 업데이트 실패 - 다른 트랙과 코드 중복")
    void updateTrack_DuplicateCode() {
        // Given - Create another track
        Track backendTrack = Track.builder()
                .name("BACKEND")
                .koreanName("백엔드")
                .code("BE")
                .enabled(true)
                .build();
        backendTrack = trackRepository.save(backendTrack);

        // Try to update frontend track with backend code
        TrackRequest request = new TrackRequest();
        request.setName("FRONTEND");
        request.setKoreanName("프론트엔드");
        request.setCode("BE"); // Duplicate with backend
        request.setEnabled(true);

        // When & Then
        assertThatThrownBy(() -> trackService.updateTrack(frontendTrack.getId(), request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("트랙 코드가 이미 존재합니다");
    }

    @Test
    @DisplayName("트랙 삭제 성공")
    void deleteTrack_Success() {
        // When
        trackService.deleteTrack(frontendTrack.getId());

        // Then
        assertThat(trackRepository.findById(frontendTrack.getId())).isEmpty();
    }

    @Test
    @DisplayName("트랙 삭제 실패 - 사용 중인 트랙")
    void deleteTrack_TrackInUse() {
        // Given - Create instructor using this track
        User instructorUser = User.builder()
                .email("instructor@track.com")
                .name("Instructor")
                .role(UserRole.INSTRUCTOR)
                .build();
        instructorUser = userRepository.save(instructorUser);

        Instructor instructor = Instructor.builder()
                .user(instructorUser)
                .phone("010-1234-5678")
                .track(frontendTrack)
                .cohort("4기")
                .accessCode("FE4-TEST")
                .startDate(LocalDate.now())
                .build();
        instructorRepository.save(instructor);

        // When & Then
        assertThatThrownBy(() -> trackService.deleteTrack(frontendTrack.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("해당 트랙에 등록된 강사가");
    }

    @Test
    @DisplayName("트랙 ID로 조회 성공")
    void getTrackById_Success() {
        // When
        TrackResponse response = trackService.getTrackById(frontendTrack.getId());

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("FRONTEND");
        assertThat(response.getCode()).isEqualTo("FE");
    }

    @Test
    @DisplayName("트랙 ID로 조회 실패 - 존재하지 않는 트랙")
    void getTrackById_NotFound() {
        // When & Then
        assertThatThrownBy(() -> trackService.getTrackById(99999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Track not found");
    }

    @Test
    @DisplayName("트랙 코드로 조회 성공")
    void getTrackByCode_Success() {
        // When
        TrackResponse response = trackService.getTrackByCode("FE");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("FRONTEND");
    }

    @Test
    @DisplayName("트랙 코드로 조회 성공 - 대소문자 무관")
    void getTrackByCode_CaseInsensitive() {
        // When
        TrackResponse response = trackService.getTrackByCode("fe");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getCode()).isEqualTo("FE");
    }
}
