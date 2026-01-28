package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.User;
import kr.codeit.onboarding.domain.enums.UserRole;
import kr.codeit.onboarding.dto.InstructorRegistrationRequest;
import kr.codeit.onboarding.dto.InstructorResponse;
import kr.codeit.onboarding.exception.DuplicateResourceException;
import kr.codeit.onboarding.repository.InstructorRepository;
import kr.codeit.onboarding.repository.UserRepository;
import kr.codeit.onboarding.repository.TrackRepository;
import kr.codeit.onboarding.domain.entity.Track;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class InstructorServiceTest {

    @Autowired
    private InstructorService instructorService;

    @Autowired
    private InstructorRepository instructorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrackRepository trackRepository;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        // 기존 데이터 정리
        instructorRepository.deleteAll();
        userRepository.deleteAll();
        trackRepository.deleteAll();

        // Track 데이터 생성
        Track frontend = Track.builder()
                .name("FRONTEND")
                .koreanName("프론트엔드")
                .code("FE")
                .enabled(true)
                .build();
        trackRepository.save(frontend);

        Track backend = Track.builder()
                .name("BACKEND")
                .koreanName("백엔드")
                .code("BE")
                .enabled(true)
                .build();
        trackRepository.save(backend);

        Track fullstack = Track.builder()
                .name("FULLSTACK")
                .koreanName("풀스택")
                .code("FS")
                .enabled(true)
                .build();
        trackRepository.save(fullstack);
    }

    @Test
    @DisplayName("강사 등록 성공 - 올바른 정보로 강사를 등록하면 액세스 코드가 생성된다")
    void registerInstructor_Success() {
        // Given
        InstructorRegistrationRequest request = new InstructorRegistrationRequest();
        request.setName("John Doe");
        request.setEmail("john@test.com");
        request.setPhone("010-1234-5678");
        request.setTrack("프론트엔드");
        request.setCohort("4기");
        request.setStartDate(LocalDate.now().plusDays(7));

        // When
        InstructorResponse response = instructorService.registerInstructor(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isNotNull();
        assertThat(response.getName()).isEqualTo("John Doe");
        assertThat(response.getEmail()).isEqualTo("john@test.com");
        assertThat(response.getAccessCode()).isNotNull();
        assertThat(response.getAccessCode()).startsWith("FE4-"); // Frontend 4기
        assertThat(response.getCurrentStep()).isEqualTo(1);
        assertThat(response.getOverallProgress()).isEqualTo(0);
    }

    @Test
    @DisplayName("액세스 코드 생성 규칙 - Track과 Cohort에 따라 올바른 형식으로 생성된다")
    void accessCodeGeneration_CorrectFormat() {
        // Given - Backend Track
        InstructorRegistrationRequest request = new InstructorRegistrationRequest();
        request.setName("Jane Smith");
        request.setEmail("jane@test.com");
        request.setPhone("010-9876-5432");
        request.setTrack("백엔드");
        request.setCohort("5기");
        request.setStartDate(LocalDate.now().plusDays(7));

        // When
        InstructorResponse response = instructorService.registerInstructor(request);

        // Then - Access code format: {trackCode}{cohort}-{fullName}{number}
        assertThat(response.getAccessCode()).matches("BE5-[A-Za-z]+\\d+");
        // BE5-JaneSmith1 형태 (Backend 5기, 전체 이름, 일련번호)
    }

    @Test
    @DisplayName("강사 등록 실패 - 이미 등록된 이메일")
    void registerInstructor_DuplicateEmail() {
        // Given
        InstructorRegistrationRequest firstRequest = new InstructorRegistrationRequest();
        firstRequest.setName("First User");
        firstRequest.setEmail("duplicate@test.com");
        firstRequest.setPhone("010-1111-1111");
        firstRequest.setTrack("프론트엔드");
        firstRequest.setCohort("4기");
        firstRequest.setStartDate(LocalDate.now().plusDays(7));

        instructorService.registerInstructor(firstRequest);

        // When - 같은 이메일로 다시 등록 시도
        InstructorRegistrationRequest duplicateRequest = new InstructorRegistrationRequest();
        duplicateRequest.setName("Second User");
        duplicateRequest.setEmail("duplicate@test.com");
        duplicateRequest.setPhone("010-2222-2222");
        duplicateRequest.setTrack("백엔드");
        duplicateRequest.setCohort("5기");
        duplicateRequest.setStartDate(LocalDate.now().plusDays(7));

        // Then
        assertThatThrownBy(() -> instructorService.registerInstructor(duplicateRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("이미 등록된 이메일입니다");
    }

    @Test
    @DisplayName("강사 조회 - ID로 강사 정보를 조회할 수 있다")
    void getInstructor_Success() {
        // Given
        InstructorRegistrationRequest request = new InstructorRegistrationRequest();
        request.setName("Test User");
        request.setEmail("test@test.com");
        request.setPhone("010-0000-0000");
        request.setTrack("풀스택");
        request.setCohort("3기");
        request.setStartDate(LocalDate.now().plusDays(7));

        InstructorResponse created = instructorService.registerInstructor(request);

        // Set up PM authentication for authorization check
        User pmUser = User.builder()
                .id(999L)
                .email("pm@test.com")
                .name("PM User")
                .role(UserRole.PM)
                .build();
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                pmUser,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_PM"))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // When
        InstructorResponse retrieved = instructorService.getInstructor(created.getId());

        // Then
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getId()).isEqualTo(created.getId());
        assertThat(retrieved.getName()).isEqualTo("Test User");
        assertThat(retrieved.getAccessCode()).isEqualTo(created.getAccessCode());
    }

    @Test
    @DisplayName("전체 강사 목록 조회 (페이지네이션)")
    void getAllInstructors() {
        // Given - 3명의 강사 등록
        for (int i = 1; i <= 3; i++) {
            InstructorRegistrationRequest request = new InstructorRegistrationRequest();
            request.setName("Instructor " + i);
            request.setEmail("instructor" + i + "@test.com");
            request.setPhone("010-0000-000" + i);
            request.setTrack("프론트엔드");
            request.setCohort("4기");
            request.setStartDate(LocalDate.now().plusDays(7));
            instructorService.registerInstructor(request);
        }

        // Set up PM authentication (only PM can access all instructors)
        User pmUser = User.builder()
                .id(999L)
                .email("pm@test.com")
                .name("PM User")
                .role(UserRole.PM)
                .build();
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                pmUser,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_PM"))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // When - Request first page with page size 20
        PageRequest pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<InstructorResponse> instructorPage = instructorService.getAllInstructors(pageable);

        // Then
        assertThat(instructorPage.getContent()).hasSize(3);
        assertThat(instructorPage.getTotalElements()).isEqualTo(3);
        assertThat(instructorPage.getTotalPages()).isEqualTo(1);
        assertThat(instructorPage.getContent()).extracting("name")
                .contains("Instructor 1", "Instructor 2", "Instructor 3");
    }
}
