package kr.codeit.onboarding.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Validation tests for DTOs using Jakarta Bean Validation.
 * Tests ensure that validation constraints are properly enforced.
 */
class DTOValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("TrackRequest - 유효한 요청")
    void trackRequest_Valid() {
        // Given
        TrackRequest request = new TrackRequest();
        request.setName("FRONTEND");
        request.setKoreanName("프론트엔드");
        request.setCode("FE");
        request.setEnabled(true);

        // When
        Set<ConstraintViolation<TrackRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("TrackRequest - 빈 이름 유효성 검증 실패")
    void trackRequest_EmptyName() {
        // Given
        TrackRequest request = new TrackRequest();
        request.setName("");
        request.setKoreanName("프론트엔드");
        request.setCode("FE");
        request.setEnabled(true);

        // When
        Set<ConstraintViolation<TrackRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isNotEmpty();
    }

    @Test
    @DisplayName("TrackRequest - null 값 유효성 검증 실패")
    void trackRequest_NullValues() {
        // Given
        TrackRequest request = new TrackRequest();
        request.setEnabled(true);

        // When
        Set<ConstraintViolation<TrackRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).hasSizeGreaterThan(0);
    }

    @Test
    @DisplayName("ChecklistUpdateRequest - 유효한 요청")
    void checklistUpdateRequest_Valid() {
        // Given
        ChecklistUpdateRequest request = new ChecklistUpdateRequest();
        request.setChecked(true);

        // When
        Set<ConstraintViolation<ChecklistUpdateRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("ChecklistUpdateRequest - null 값 유효성 검증 실패")
    void checklistUpdateRequest_NullChecked() {
        // Given
        ChecklistUpdateRequest request = new ChecklistUpdateRequest();
        // checked is null

        // When
        Set<ConstraintViolation<ChecklistUpdateRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isNotEmpty();
    }

    @Test
    @DisplayName("ChecklistItemLabelUpdateRequest - 유효한 요청")
    void checklistItemLabelUpdateRequest_Valid() {
        // Given
        ChecklistItemLabelUpdateRequest request = new ChecklistItemLabelUpdateRequest();
        request.setLabel("Test Label");

        // When
        Set<ConstraintViolation<ChecklistItemLabelUpdateRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("ChecklistItemLabelUpdateRequest - 빈 레이블 유효성 검증 실패")
    void checklistItemLabelUpdateRequest_EmptyLabel() {
        // Given
        ChecklistItemLabelUpdateRequest request = new ChecklistItemLabelUpdateRequest();
        request.setLabel("");

        // When
        Set<ConstraintViolation<ChecklistItemLabelUpdateRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isNotEmpty();
    }

    @Test
    @DisplayName("TaskUpdateRequest - 유효한 요청")
    void taskUpdateRequest_Valid() {
        // Given
        TaskUpdateRequest request = new TaskUpdateRequest();
        request.setStatus(TaskStatus.COMPLETED);

        // When
        Set<ConstraintViolation<TaskUpdateRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("TaskUpdateRequest - null 상태 유효성 검증 실패")
    void taskUpdateRequest_NullStatus() {
        // Given
        TaskUpdateRequest request = new TaskUpdateRequest();
        // status is null

        // When
        Set<ConstraintViolation<TaskUpdateRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isNotEmpty();
    }

    @Test
    @DisplayName("PmRegistrationRequest - 유효한 요청")
    void pmRegistrationRequest_Valid() {
        // Given
        PmRegistrationRequest request = new PmRegistrationRequest();
        request.setName("Test PM");
        request.setEmail("test@codeit.com");
        request.setPassword("password123!");

        // When
        Set<ConstraintViolation<PmRegistrationRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("PmRegistrationRequest - 잘못된 이메일 도메인")
    void pmRegistrationRequest_InvalidEmailDomain() {
        // Given
        PmRegistrationRequest request = new PmRegistrationRequest();
        request.setName("Test PM");
        request.setEmail("test@gmail.com");  // Not @codeit.com
        request.setPassword("password123!");

        // When
        Set<ConstraintViolation<PmRegistrationRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isNotEmpty();
    }

    @Test
    @DisplayName("PmRegistrationRequest - 짧은 비밀번호")
    void pmRegistrationRequest_ShortPassword() {
        // Given
        PmRegistrationRequest request = new PmRegistrationRequest();
        request.setName("Test PM");
        request.setEmail("test@codeit.com");
        request.setPassword("123");  // Too short

        // When
        Set<ConstraintViolation<PmRegistrationRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isNotEmpty();
    }

    @Test
    @DisplayName("PmRegistrationRequest - 특수문자 없는 비밀번호")
    void pmRegistrationRequest_NoSpecialCharPassword() {
        // Given
        PmRegistrationRequest request = new PmRegistrationRequest();
        request.setName("Test PM");
        request.setEmail("test@codeit.com");
        request.setPassword("password123");  // No special character

        // When
        Set<ConstraintViolation<PmRegistrationRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isNotEmpty();
    }

    @Test
    @DisplayName("LoginRequest - 유효한 요청")
    void loginRequest_Valid() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .identifier("test@codeit.com")
                .password("password123")
                .build();

        // When
        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("LoginRequest - 빈 식별자")
    void loginRequest_EmptyIdentifier() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .identifier("")
                .password("password123")
                .build();

        // When
        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isNotEmpty();
    }

    @Test
    @DisplayName("PasswordResetRequest - 유효한 요청")
    void passwordResetRequest_Valid() {
        // Given
        PasswordResetRequest request = new PasswordResetRequest();
        request.setToken("valid-token");
        request.setNewPassword("newPassword123!");

        // When
        Set<ConstraintViolation<PasswordResetRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("PasswordResetRequest - 짧은 비밀번호")
    void passwordResetRequest_ShortPassword() {
        // Given
        PasswordResetRequest request = new PasswordResetRequest();
        request.setToken("valid-token");
        request.setNewPassword("123");

        // When
        Set<ConstraintViolation<PasswordResetRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isNotEmpty();
    }

    @Test
    @DisplayName("PasswordResetRequest - 빈 토큰")
    void passwordResetRequest_EmptyToken() {
        // Given
        PasswordResetRequest request = new PasswordResetRequest();
        request.setToken("");
        request.setNewPassword("newPassword123!");

        // When
        Set<ConstraintViolation<PasswordResetRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isNotEmpty();
    }
}
