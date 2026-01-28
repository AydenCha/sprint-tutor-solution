package kr.codeit.onboarding.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.codeit.onboarding.domain.entity.EmailVerificationToken;
import kr.codeit.onboarding.domain.entity.PasswordResetToken;
import kr.codeit.onboarding.domain.entity.User;
import kr.codeit.onboarding.domain.enums.UserRole;
import kr.codeit.onboarding.dto.LoginRequest;
import kr.codeit.onboarding.dto.PasswordResetRequest;
import kr.codeit.onboarding.dto.PmRegistrationRequest;
import kr.codeit.onboarding.repository.EmailVerificationTokenRepository;
import kr.codeit.onboarding.repository.PasswordResetTokenRepository;
import kr.codeit.onboarding.repository.UserRepository;
import kr.codeit.onboarding.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@Disabled("Integration test - requires email service and complex auth flow setup")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private User pmUser;
    private String validToken;

    @BeforeEach
    void setUp() {
        // Create verified PM user
        pmUser = User.builder()
                .email("pm@auth-test.com")
                .name("PM User")
                .role(UserRole.PM)
                .passwordHash(passwordEncoder.encode("password123"))
                .emailVerified(true)
                .build();
        pmUser = userRepository.save(pmUser);

        validToken = jwtUtil.generateToken(pmUser);
    }

    @Test
    @DisplayName("POST /auth/register/pm - PM 등록 성공")
    void registerPm_Success() throws Exception {
        // Given
        PmRegistrationRequest request = new PmRegistrationRequest();
        request.setName("New PM");
        request.setEmail("newpm@codeit.com");
        request.setPassword("password123!");

        // When & Then
        mockMvc.perform(post("/auth/register/pm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New PM"))
                .andExpect(jsonPath("$.email").value("newpm@codeit.com"))
                .andExpect(jsonPath("$.role").value("PM"))
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    @DisplayName("POST /auth/register/pm - 중복 이메일로 등록 실패")
    void registerPm_DuplicateEmail() throws Exception {
        // Given
        PmRegistrationRequest request = new PmRegistrationRequest();
        request.setName("Another PM");
        request.setEmail("pm@auth-test.com");  // Duplicate
        request.setPassword("password123!");

        // When & Then
        mockMvc.perform(post("/auth/register/pm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /auth/register/pm - 유효성 검증 실패 (빈 이메일)")
    void registerPm_ValidationFailed_EmptyEmail() throws Exception {
        // Given
        PmRegistrationRequest request = new PmRegistrationRequest();
        request.setName("New PM");
        request.setEmail("");  // Empty email
        request.setPassword("password123!");

        // When & Then
        mockMvc.perform(post("/auth/register/pm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /auth/register/pm - 유효성 검증 실패 (짧은 비밀번호)")
    void registerPm_ValidationFailed_ShortPassword() throws Exception {
        // Given
        PmRegistrationRequest request = new PmRegistrationRequest();
        request.setName("New PM");
        request.setEmail("newpm@codeit.com");
        request.setPassword("123");  // Too short

        // When & Then
        mockMvc.perform(post("/auth/register/pm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /auth/login - 로그인 성공")
    void login_Success() throws Exception {
        // Given
        LoginRequest request = new LoginRequest();
        request.setIdentifier("pm@auth-test.com");
        request.setPassword("password123");

        // When & Then
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.name").value("PM User"))
                .andExpect(jsonPath("$.email").value("pm@auth-test.com"))
                .andExpect(jsonPath("$.role").value("PM"));
    }

    @Test
    @DisplayName("POST /auth/login - 잘못된 비밀번호로 로그인 실패")
    void login_InvalidPassword() throws Exception {
        // Given
        LoginRequest request = new LoginRequest();
        request.setIdentifier("pm@auth-test.com");
        request.setPassword("wrongpassword");

        // When & Then
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /auth/login - 존재하지 않는 이메일로 로그인 실패")
    void login_UserNotFound() throws Exception {
        // Given
        LoginRequest request = new LoginRequest();
        request.setIdentifier("nonexistent@codeit.com");
        request.setPassword("password123");

        // When & Then
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /auth/verify-email - 이메일 인증 성공")
    void verifyEmail_Success() throws Exception {
        // Given - Create unverified user and token
        User unverifiedUser = User.builder()
                .email("unverified@codeit.com")
                .name("Unverified User")
                .role(UserRole.PM)
                .passwordHash(passwordEncoder.encode("password123"))
                .emailVerified(false)
                .build();
        unverifiedUser = userRepository.save(unverifiedUser);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .user(unverifiedUser)
                .token(UUID.randomUUID().toString())
                .build();
        token = emailVerificationTokenRepository.save(token);

        // When & Then
        mockMvc.perform(post("/auth/verify-email")
                        .param("token", token.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email").value("unverified@codeit.com"));
    }

    @Test
    @DisplayName("POST /auth/verify-email - 유효하지 않은 토큰으로 인증 실패")
    void verifyEmail_InvalidToken() throws Exception {
        // When & Then
        mockMvc.perform(post("/auth/verify-email")
                        .param("token", "invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /auth/resend-verification - 인증 이메일 재발송 성공")
    void resendVerificationEmail_Success() throws Exception {
        // Given - Create unverified user
        User unverifiedUser = User.builder()
                .email("resend@codeit.com")
                .name("Resend User")
                .role(UserRole.PM)
                .passwordHash(passwordEncoder.encode("password123"))
                .emailVerified(false)
                .build();
        unverifiedUser = userRepository.save(unverifiedUser);

        // When & Then
        mockMvc.perform(post("/auth/resend-verification")
                        .param("email", "resend@codeit.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /auth/resend-verification - 존재하지 않는 이메일로 재발송 실패")
    void resendVerificationEmail_UserNotFound() throws Exception {
        // When & Then
        mockMvc.perform(post("/auth/resend-verification")
                        .param("email", "nonexistent@codeit.com"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /auth/account - 계정 삭제 성공")
    void deleteAccount_Success() throws Exception {
        // When & Then
        mockMvc.perform(delete("/auth/account")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("DELETE /auth/account - 인증 없이 삭제 시도 실패")
    void deleteAccount_NoAuthentication() throws Exception {
        // When & Then
        mockMvc.perform(delete("/auth/account"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /auth/forgot-password - 비밀번호 재설정 요청 성공")
    void requestPasswordReset_Success() throws Exception {
        // When & Then
        mockMvc.perform(post("/auth/forgot-password")
                        .param("email", "pm@auth-test.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /auth/reset-password - 비밀번호 재설정 성공")
    void resetPassword_Success() throws Exception {
        // Given - Create password reset token
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(pmUser)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();
        resetToken = passwordResetTokenRepository.save(resetToken);

        PasswordResetRequest request = new PasswordResetRequest();
        request.setToken(resetToken.getToken());
        request.setNewPassword("newpassword123");

        // When & Then
        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /auth/reset-password - 유효하지 않은 토큰으로 재설정 실패")
    void resetPassword_InvalidToken() throws Exception {
        // Given
        PasswordResetRequest request = new PasswordResetRequest();
        request.setToken("invalid-token");
        request.setNewPassword("newpassword123");

        // When & Then
        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /auth/reset-password - 만료된 토큰으로 재설정 실패")
    void resetPassword_ExpiredToken() throws Exception {
        // Given - Create expired token
        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .user(pmUser)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().minusHours(1))  // Expired
                .build();
        expiredToken = passwordResetTokenRepository.save(expiredToken);

        PasswordResetRequest request = new PasswordResetRequest();
        request.setToken(expiredToken.getToken());
        request.setNewPassword("newpassword123");

        // When & Then
        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /auth/reset-password - 유효성 검증 실패 (짧은 비밀번호)")
    void resetPassword_ValidationFailed_ShortPassword() throws Exception {
        // Given
        PasswordResetRequest request = new PasswordResetRequest();
        request.setToken("some-token");
        request.setNewPassword("123");  // Too short

        // When & Then
        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
