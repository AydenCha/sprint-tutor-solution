package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.Instructor;
import kr.codeit.onboarding.domain.entity.Track;
import kr.codeit.onboarding.domain.entity.User;
import kr.codeit.onboarding.repository.TrackRepository;
import kr.codeit.onboarding.domain.enums.UserRole;
import kr.codeit.onboarding.dto.LoginRequest;
import kr.codeit.onboarding.dto.LoginResponse;
import kr.codeit.onboarding.exception.InvalidCredentialsException;
import kr.codeit.onboarding.repository.InstructorRepository;
import kr.codeit.onboarding.repository.UserRepository;
import kr.codeit.onboarding.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InstructorRepository instructorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TrackRepository trackRepository;

    @Autowired
    private kr.codeit.onboarding.repository.EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private kr.codeit.onboarding.repository.PasswordResetTokenRepository passwordResetTokenRepository;

    private User pmUser;
    private User instructorUser;
    private Instructor instructor;

    @BeforeEach
    void setUp() {
        // Create PM user
        pmUser = User.builder()
                .email("pm@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .name("Test PM")
                .role(UserRole.PM)
                .emailVerified(true)   // 테스트용: 인증 완료
                .enabled(true)         // 테스트용: 활성화
                .build();
        userRepository.save(pmUser);

        // Create Instructor user
        instructorUser = User.builder()
                .email("instructor@test.com")
                .name("Test Instructor")
                .role(UserRole.INSTRUCTOR)
                .emailVerified(true)   // 테스트용: 인증 완료
                .enabled(true)         // 테스트용: 활성화
                .build();
        userRepository.save(instructorUser);

        // Find or create Track entity
        Track track = trackRepository.findByName("FRONTEND")
                .orElseGet(() -> {
                    Track newTrack = Track.builder()
                            .name("FRONTEND")
                            .koreanName("프론트엔드")
                            .code("FE")
                            .enabled(true)
                            .build();
                    return trackRepository.save(newTrack);
                });

        // Create Instructor
        instructor = Instructor.builder()
                .user(instructorUser)
                .phone("010-1234-5678")
                .track(track)
                .cohort("4기")
                .accessCode("FE4-TEST1")
                .startDate(LocalDate.now().plusDays(7))
                .build();
        instructorRepository.save(instructor);
    }

    @Test
    @DisplayName("PM 로그인 성공 - 이메일과 비밀번호가 일치하면 토큰을 반환한다")
    void loginAsPm_Success() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setIdentifier("pm@test.com");
        request.setPassword("password123");

        // When
        LoginResponse response = authService.login(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isNotNull();
        assertThat(response.getEmail()).isEqualTo("pm@test.com");
        assertThat(response.getRole()).isEqualTo(UserRole.PM);
        assertThat(response.getInstructorId()).isNull();

        // Token validation
        assertThat(jwtUtil.validateToken(response.getToken())).isTrue();
    }

    @Test
    @DisplayName("PM 로그인 실패 - 잘못된 비밀번호")
    void loginAsPm_WrongPassword() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setIdentifier("pm@test.com");
        request.setPassword("wrongpassword");

        // When & Then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("PM 로그인 실패 - 존재하지 않는 이메일")
    void loginAsPm_EmailNotFound() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setIdentifier("notexist@test.com");
        request.setPassword("password123");

        // When & Then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    @DisplayName("강사 로그인 성공 - 액세스 코드로 로그인하면 토큰을 반환한다")
    void loginAsInstructor_Success() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setIdentifier("FE4-TEST1");

        // When
        LoginResponse response = authService.login(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isNotNull();
        assertThat(response.getEmail()).isEqualTo("instructor@test.com");
        assertThat(response.getRole()).isEqualTo(UserRole.INSTRUCTOR);
        assertThat(response.getInstructorId()).isEqualTo(instructor.getId());

        // Token validation
        assertThat(jwtUtil.validateToken(response.getToken())).isTrue();
    }

    @Test
    @DisplayName("강사 로그인 실패 - 잘못된 액세스 코드")
    void loginAsInstructor_WrongAccessCode() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setIdentifier("WRONG-CODE");

        // When & Then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("Invalid access code");
    }

    @Test
    @DisplayName("JWT 토큰에서 사용자 ID를 추출할 수 있다")
    void extractUserIdFromToken() {
        // Given
        String token = jwtUtil.generateToken(pmUser);

        // When
        Long userId = jwtUtil.getUserIdFromToken(token);

        // Then
        assertThat(userId).isEqualTo(pmUser.getId());
    }

    @Test
    @DisplayName("회원 탈퇴 - soft delete로 처리되며 deletedAt이 설정된다")
    void deleteAccount_Success() {
        // When
        authService.deleteAccount(pmUser.getId());

        // Then
        User deletedUser = userRepository.findById(pmUser.getId()).orElseThrow();
        assertThat(deletedUser.isDeleted()).isTrue();
        assertThat(deletedUser.getDeletedAt()).isNotNull();
        assertThat(deletedUser.getEnabled()).isFalse();
    }

    @Test
    @DisplayName("회원 탈퇴 후 로그인 시도 시 실패한다")
    void loginAfterDelete_Fails() {
        // Given
        authService.deleteAccount(pmUser.getId());

        // When & Then
        LoginRequest request = new LoginRequest();
        request.setIdentifier("pm@test.com");
        request.setPassword("password123");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("Account has been deleted");
    }

    @Test
    @DisplayName("비밀번호 재설정 요청 - 이메일이 발송된다")
    void requestPasswordReset_Success() {
        // When & Then (예외가 발생하지 않으면 성공)
        authService.requestPasswordReset(pmUser.getEmail());
        
        // 토큰이 생성되었는지 확인
        var tokenOptional = passwordResetTokenRepository.findByUser_Id(pmUser.getId());
        assertThat(tokenOptional).isPresent();
    }

    @Test
    @DisplayName("비밀번호 재설정 - 토큰으로 비밀번호를 변경할 수 있다")
    void resetPassword_Success() {
        // Given
        authService.requestPasswordReset(pmUser.getEmail());
        var tokenEntity = passwordResetTokenRepository.findByUser_Id(pmUser.getId()).orElseThrow();
        String newPassword = "NewPassword123!";

        // When
        authService.resetPassword(tokenEntity.getToken(), newPassword);

        // Then
        User updatedUser = userRepository.findById(pmUser.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(newPassword, updatedUser.getPasswordHash())).isTrue();
        
        // 토큰이 사용 처리되었는지 확인
        var usedToken = passwordResetTokenRepository.findByToken(tokenEntity.getToken()).orElseThrow();
        assertThat(usedToken.isUsed()).isTrue();
    }

    @Test
    @DisplayName("이메일 인증 토큰 - 만료 시간이 없어도 인증 가능하다")
    void verifyEmail_NoExpiration() {
        // Given - 만료 시간이 null인 토큰 생성
        var tokenEntity = kr.codeit.onboarding.domain.entity.EmailVerificationToken.builder()
                .token("test-token-no-expiry")
                .user(pmUser)
                .expiresAt(null) // 만료 시간 없음
                .build();
        emailVerificationTokenRepository.save(tokenEntity);

        // When & Then - 만료 체크 없이 인증 가능해야 함
        // (실제로는 이미 인증된 사용자이므로 토큰 재발급만 됨)
        LoginResponse response = authService.verifyEmail("test-token-no-expiry");
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isNotNull();
    }
}
