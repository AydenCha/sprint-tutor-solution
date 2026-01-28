package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.EmailVerificationToken;
import kr.codeit.onboarding.domain.entity.Instructor;
import kr.codeit.onboarding.domain.entity.PasswordResetToken;
import kr.codeit.onboarding.domain.entity.User;
import kr.codeit.onboarding.domain.enums.UserRole;
import kr.codeit.onboarding.dto.LoginRequest;
import kr.codeit.onboarding.dto.LoginResponse;
import kr.codeit.onboarding.dto.PmRegistrationRequest;
import kr.codeit.onboarding.dto.PmRegistrationResponse;
import kr.codeit.onboarding.exception.DuplicateResourceException;
import kr.codeit.onboarding.exception.InvalidCredentialsException;
import kr.codeit.onboarding.repository.EmailVerificationTokenRepository;
import kr.codeit.onboarding.repository.InstructorRepository;
import kr.codeit.onboarding.repository.PasswordResetTokenRepository;
import kr.codeit.onboarding.repository.UserRepository;
import kr.codeit.onboarding.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Authentication service handling user registration, login, email verification, and password management.
 *
 * <p>This service provides comprehensive authentication functionality including:
 * <ul>
 *   <li>PM registration with email domain validation</li>
 *   <li>Email verification with token generation and validation</li>
 *   <li>Login for both PM (email/password) and Instructor (access code)</li>
 *   <li>Password reset functionality</li>
 *   <li>Account deletion (soft delete)</li>
 * </ul>
 *
 * <p>Key features:
 * <ul>
 *   <li>Email verification is required for PM accounts</li>
 *   <li>Verification tokens never expire</li>
 *   <li>Re-registration is allowed for deleted accounts</li>
 *   <li>Automatic verification email resend on login attempts</li>
 * </ul>
 *
 * @author Sprint Tutor Team
 * @since 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final InstructorRepository instructorRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.email.domain:@codeit.com}")
    private String allowedEmailDomain;

    // Constants
    private static final String EMAIL_ALREADY_REGISTERED = "Email already registered";
    private static final String USER_NOT_FOUND = "User not found";
    private static final String INVALID_EMAIL_OR_PASSWORD = "Invalid email or password";
    private static final String INVALID_VERIFICATION_TOKEN = "Invalid verification token";
    private static final String PASSWORD_RESET_EXPIRY_HOURS = "1";

    // Self-reference for transaction proxy calls
    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private AuthService self;

    /**
     * Register a new PM user with email verification.
     *
     * <p>This method handles PM registration with the following steps:
     * <ol>
     *   <li>Validates email domain (only allowed domain is accepted)</li>
     *   <li>Checks for duplicate email (excluding deleted accounts)</li>
     *   <li>Reactivates account if user previously deleted their account</li>
     *   <li>Creates new user account if email is new</li>
     *   <li>Generates email verification token (never expires)</li>
     *   <li>Sends verification email</li>
     * </ol>
     *
     * @param request the registration request containing email, password, and name
     * @return PmRegistrationResponse with user information (no token until email verified)
     * @throws IllegalArgumentException if email domain is not allowed
     * @throws DuplicateResourceException if email is already registered
     */
    @Transactional
    public PmRegistrationResponse registerPm(PmRegistrationRequest request) {
        String normalizedEmail = validateAndNormalizeEmail(request.getEmail());
        request.setEmail(normalizedEmail);

        checkEmailUniqueness(normalizedEmail);

        User user = findOrReactivateUser(request);

        createAndSendVerificationToken(user);

        log.info("PM registration completed for email: {}", user.getEmail());
        return buildRegistrationResponse(user);
    }

    /**
     * Verifies user email using verification token and issues JWT token.
     *
     * <p>This method handles email verification with the following behavior:
     * <ul>
     *   <li>If token is valid and not yet verified, marks email as verified</li>
     *   <li>If email is already verified, still issues JWT token (idempotent)</li>
     *   <li>Verification tokens never expire</li>
     *   <li>User account is enabled after verification</li>
     * </ul>
     *
     * @param token the verification token from email link
     * @return LoginResponse with JWT token for immediate login
     * @throws IllegalArgumentException if token is invalid
     */
    @Transactional
    public LoginResponse verifyEmail(String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException(INVALID_VERIFICATION_TOKEN));

        User user = verificationToken.getUser();

        if (verificationToken.isVerified() || user.getEmailVerified()) {
            log.info("Already verified user attempting verification: {} - issuing new token", user.getEmail());
            return buildLoginResponse(user, null);
        }

        markEmailAsVerified(user, verificationToken);

        log.info("Email verification completed for user: {}", user.getEmail());
        return buildLoginResponse(user, null);
    }

    /**
     * Resends verification email to user.
     *
     * <p>This method runs in a separate transaction (REQUIRES_NEW) to prevent
     * rollback in case the caller's transaction fails.
     *
     * @param email the user's email address
     * @throws IllegalArgumentException if user not found or already verified
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getEmailVerified()) {
            throw new IllegalArgumentException("이미 이메일 인증이 완료되었습니다.");
        }

        // 기존 토큰 삭제 (unique constraint 위반 방지를 위해 flush 필요)
        emailVerificationTokenRepository.findByUser_Id(user.getId())
                .ifPresent(token -> {
                    emailVerificationTokenRepository.delete(token);
                    emailVerificationTokenRepository.flush(); // 즉시 DB에 반영
                });

        // 새 토큰 생성 및 발송 (만료 시간 없음)
        String verificationToken = UUID.randomUUID().toString();
        EmailVerificationToken tokenEntity = EmailVerificationToken.builder()
                .token(verificationToken)
                .user(user)
                .expiresAt(null) // 만료 시간 없음 (무제한)
                .build();
        emailVerificationTokenRepository.save(tokenEntity);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken);
    }

    /**
     * Resends verification email for internal calls (separate transaction).
     *
     * <p>Must be public to ensure transaction proxy is applied.
     * Runs in REQUIRES_NEW transaction to ensure token is saved even if caller fails.
     *
     * @param user the user to send verification email
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resendVerificationEmailInternal(User user) {
        // 기존 토큰 삭제 (unique constraint 위반 방지를 위해 flush 필요)
        emailVerificationTokenRepository.findByUser_Id(user.getId())
                .ifPresent(token -> {
                    emailVerificationTokenRepository.delete(token);
                    emailVerificationTokenRepository.flush(); // 즉시 DB에 반영하여 unique constraint 위반 방지
                });

        // 새 토큰 생성 및 저장 (만료 시간 없음)
        String verificationToken = UUID.randomUUID().toString();
        EmailVerificationToken tokenEntity = EmailVerificationToken.builder()
                .token(verificationToken)
                .user(user)
                .expiresAt(null) // 만료 시간 없음 (무제한)
                .build();
        emailVerificationTokenRepository.save(tokenEntity);
        log.info("Verification token saved: {} for user: {}", verificationToken, user.getEmail());

        // 이메일 발송
        emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken);
    }

    /**
     * Authenticates user and returns JWT token.
     *
     * <p>Handles two types of login:
     * <ul>
     *   <li>PM login: identifier is email, password required</li>
     *   <li>Instructor login: identifier is access code, no password</li>
     * </ul>
     *
     * <p>For PM login with unverified email:
     * <ul>
     *   <li>If password is correct, resends verification email</li>
     *   <li>If password is incorrect, returns generic error</li>
     * </ul>
     *
     * @param request the login request containing identifier and password
     * @return LoginResponse with JWT token and user information
     * @throws InvalidCredentialsException if credentials are invalid
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        String identifier = request.getIdentifier();
        String password = request.getPassword();

        if (identifier.contains("@")) {
            return loginAsPm(identifier, password);
        }

        return loginAsInstructor(identifier);
    }

    // 재발송 시 DB 저장을 위해 login()의 @Transactional이 적용됨
    private LoginResponse loginAsPm(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (user.getRole() != UserRole.PM) {
            throw new InvalidCredentialsException("Invalid credentials");
        }

        // 탈퇴한 사용자 체크
        if (user.isDeleted()) {
            throw new InvalidCredentialsException("Account has been deleted");
        }

        // 비밀번호 검증 (인증 상태 확인 전에 먼저 검증)
        boolean passwordMatches = password != null && passwordEncoder.matches(password, user.getPasswordHash());
        
        // 이메일 인증 확인
        if (!user.getEmailVerified() || !user.getEnabled()) {
            log.warn("Login attempt for unverified/disabled user: {} (verified: {}, enabled: {})", 
                    email, user.getEmailVerified(), user.getEnabled());
            
            // 비밀번호가 맞는 경우에만 인증 메일 재발송 (보안: 잘못된 이메일로는 재발송 안 함)
            if (passwordMatches) {
                log.info("Password correct but email not verified. Resending verification email to: {}", email);
                
                // 별도 트랜잭션으로 재발송 (예외 발생 시에도 토큰 저장 보장)
                // self를 통해 호출하여 프록시를 통한 트랜잭션 적용 보장
                try {
                    // resendVerificationEmail()은 이미 REQUIRES_NEW로 설정되어 있음
                    self.resendVerificationEmail(user.getEmail());
                    log.info("Verification email resent to: {}", email);
                } catch (Exception e) {
                    log.error("Failed to resend verification email to: {}", email, e);
                    // 재발송 실패해도 로그인은 거부 (보안)
                }
                
                throw new InvalidCredentialsException("이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요. 인증 메일을 재발송했습니다.");
            } else {
                // 비밀번호가 틀린 경우 - 일반적인 로그인 실패 메시지
                throw new InvalidCredentialsException("Invalid email or password");
            }
        }
        
        // 비밀번호 검증 (인증된 사용자만)
        if (!passwordMatches) {
            log.warn("Password mismatch for user: {}", email);
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user);

        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .instructorId(null)
                .name(user.getName())
                .email(user.getEmail())
                .role(UserRole.PM)
                .build();
    }

    private LoginResponse loginAsInstructor(String accessCode) {
        Instructor instructor = instructorRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid access code"));

        User user = instructor.getUser();
        
        // 계정 활성화 확인
        if (!user.getEnabled()) {
            throw new InvalidCredentialsException("계정이 비활성화되었습니다. 관리자에게 문의하세요.");
        }

        String token = jwtUtil.generateToken(user);

        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .instructorId(instructor.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(UserRole.INSTRUCTOR)
                .build();
    }

    /**
     * Deletes user account (soft delete).
     *
     * <p>Performs soft delete by setting deletedAt timestamp.
     * <ul>
     *   <li>User record is marked as deleted but not removed from database</li>
     *   <li>Related data (audit logs, etc.) is preserved</li>
     *   <li>Verification and reset tokens are removed</li>
     *   <li>Account is disabled</li>
     *   <li>Email can be reused for re-registration</li>
     * </ul>
     *
     * @param userId the ID of the user to delete
     * @throws IllegalArgumentException if user not found or already deleted
     */
    @Transactional
    public void deleteAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.isDeleted()) {
            throw new IllegalArgumentException("이미 탈퇴한 계정입니다.");
        }

        // Soft delete: deletedAt 설정
        user.setDeletedAt(LocalDateTime.now());
        user.setEnabled(false);
        userRepository.save(user);

        // 이메일 인증 토큰 삭제
        emailVerificationTokenRepository.findByUser_Id(userId)
                .ifPresent(emailVerificationTokenRepository::delete);

        // 비밀번호 재설정 토큰 삭제
        passwordResetTokenRepository.findByUser_Id(userId)
                .ifPresent(passwordResetTokenRepository::delete);

        log.info("User account deleted (soft): {} ({})", user.getEmail(), user.getName());
    }

    /**
     * Requests password reset by sending reset token via email.
     *
     * <p>Process:
     * <ol>
     *   <li>Validates user exists and email is verified</li>
     *   <li>Deletes any existing reset tokens</li>
     *   <li>Generates new reset token (valid for 1 hour)</li>
     *   <li>Sends reset email with token</li>
     * </ol>
     *
     * @param email the user's email address
     * @throws IllegalArgumentException if user not found, deleted, or email not verified
     */
    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.isDeleted()) {
            throw new IllegalArgumentException("탈퇴한 계정입니다. 비밀번호를 재설정할 수 없습니다.");
        }

        if (!user.getEmailVerified()) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다. 먼저 이메일 인증을 완료해주세요.");
        }

        // 기존 토큰 삭제
        passwordResetTokenRepository.findByUser_Id(user.getId())
                .ifPresent(token -> {
                    passwordResetTokenRepository.delete(token);
                    passwordResetTokenRepository.flush();
                });

        // 새 토큰 생성
        String resetToken = UUID.randomUUID().toString();
        PasswordResetToken tokenEntity = PasswordResetToken.builder()
                .token(resetToken)
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();
        passwordResetTokenRepository.save(tokenEntity);
        passwordResetTokenRepository.flush(); // 즉시 DB에 반영하여 토큰 사용 가능하도록
        
        log.info("Password reset token created: {} (length: {}) for user: {}", 
                resetToken.substring(0, Math.min(8, resetToken.length())) + "...", 
                resetToken.length(), email);

        // 이메일 발송
        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetToken);
        log.info("Password reset email sent to: {}", email);
    }

    /**
     * Resets user password using reset token.
     *
     * <p>Process:
     * <ol>
     *   <li>Validates reset token exists and is not expired/used</li>
     *   <li>Validates user account is not deleted</li>
     *   <li>Updates user password (hashed)</li>
     *   <li>Marks token as used</li>
     * </ol>
     *
     * @param token the password reset token
     * @param newPassword the new password (will be hashed)
     * @throws IllegalArgumentException if token is invalid, expired, used, or user is deleted
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        log.info("Attempting to reset password with token: {} (length: {})", 
                token != null ? token.substring(0, Math.min(8, token.length())) + "..." : "null", 
                token != null ? token.length() : 0);
        
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> {
                    log.warn("Password reset token not found: {} (length: {})", 
                            token != null ? token.substring(0, Math.min(8, token.length())) + "..." : "null",
                            token != null ? token.length() : 0);
                    return new IllegalArgumentException("Invalid reset token");
                });

        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("비밀번호 재설정 토큰이 만료되었습니다. 재설정을 다시 요청해주세요.");
        }

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("이미 사용된 비밀번호 재설정 토큰입니다. 재설정을 다시 요청해주세요.");
        }

        User user = resetToken.getUser();

        if (user.isDeleted()) {
            throw new IllegalArgumentException("탈퇴한 계정입니다. 비밀번호를 재설정할 수 없습니다.");
        }

        // 비밀번호 변경
        // User 엔티티의 version 필드가 null인 경우 초기화 (기존 레코드의 version이 null일 수 있음)
        if (user.getVersion() == null) {
            user.setVersion(0L);
        }
        String passwordHash = passwordEncoder.encode(newPassword);
        user.setPasswordHash(passwordHash);
        userRepository.save(user);
        userRepository.flush(); // 즉시 DB에 반영

        // 토큰 사용 처리
        resetToken.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);
        passwordResetTokenRepository.flush(); // 즉시 DB에 반영

        log.info("Password reset completed for user: {}", user.getEmail());
    }

    // ==================== Private Helper Methods ====================

    /**
     * Validates and normalizes email address.
     *
     * @param email the email address to validate
     * @return normalized email (lowercase and trimmed)
     * @throws IllegalArgumentException if email domain is not allowed
     */
    private String validateAndNormalizeEmail(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        String domainPattern = "^[a-zA-Z0-9._%+-]+" + allowedEmailDomain.replace(".", "\\.") + "$";

        if (!normalizedEmail.endsWith(allowedEmailDomain) || !normalizedEmail.matches(domainPattern)) {
            log.warn("Invalid email domain attempt: {}", email);
            throw new IllegalArgumentException(
                allowedEmailDomain + " 도메인 이메일만 사용 가능합니다. 입력한 이메일: " + email
            );
        }

        return normalizedEmail;
    }

    /**
     * Checks if email is already registered (excluding deleted accounts).
     *
     * @param email the email to check
     * @throws DuplicateResourceException if email is already registered
     */
    private void checkEmailUniqueness(String email) {
        if (userRepository.existsByEmailAndNotDeleted(email)) {
            log.warn("Registration attempt with duplicate email: {}", email);
            throw new DuplicateResourceException(EMAIL_ALREADY_REGISTERED);
        }
    }

    /**
     * Finds and reactivates deleted user, or creates new user.
     *
     * @param request the registration request
     * @return the user (either reactivated or newly created)
     */
    private User findOrReactivateUser(PmRegistrationRequest request) {
        User existingUser = userRepository.findByEmailIncludingDeleted(request.getEmail()).orElse(null);

        if (existingUser != null && existingUser.isDeleted()) {
            return reactivateDeletedUser(existingUser, request);
        }

        return createNewPmUser(request);
    }

    /**
     * Reactivates a previously deleted user account.
     *
     * @param user the deleted user to reactivate
     * @param request the registration request
     * @return the reactivated user
     */
    private User reactivateDeletedUser(User user, PmRegistrationRequest request) {
        log.info("Re-activating previously deleted user account for re-registration: {}", request.getEmail());

        cleanupUserTokens(user.getId());

        user.setDeletedAt(null);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setEmailVerified(false);
        user.setEnabled(false);

        return userRepository.save(user);
    }

    /**
     * Creates a new PM user account.
     *
     * @param request the registration request
     * @return the newly created user
     */
    private User createNewPmUser(PmRegistrationRequest request) {
        String passwordHash = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordHash)
                .name(request.getName())
                .role(UserRole.PM)
                .emailVerified(false)
                .enabled(false)
                .build();

        return userRepository.save(user);
    }

    /**
     * Cleans up all tokens (verification and reset) for a user.
     *
     * @param userId the user ID
     */
    private void cleanupUserTokens(Long userId) {
        emailVerificationTokenRepository.findByUser_Id(userId)
                .ifPresent(emailVerificationTokenRepository::delete);
        passwordResetTokenRepository.findByUser_Id(userId)
                .ifPresent(passwordResetTokenRepository::delete);
    }

    /**
     * Creates and sends email verification token.
     *
     * @param user the user to send verification email
     */
    private void createAndSendVerificationToken(User user) {
        String verificationToken = UUID.randomUUID().toString();

        EmailVerificationToken tokenEntity = EmailVerificationToken.builder()
                .token(verificationToken)
                .user(user)
                .expiresAt(null) // Never expires
                .build();

        emailVerificationTokenRepository.save(tokenEntity);
        emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken);

        log.info("Verification email sent to: {}", user.getEmail());
    }

    /**
     * Builds PmRegistrationResponse from user.
     *
     * @param user the user
     * @return the registration response
     */
    private PmRegistrationResponse buildRegistrationResponse(User user) {
        return PmRegistrationResponse.builder()
                .token(null) // Token issued after email verification
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(UserRole.PM)
                .emailVerified(false)
                .build();
    }

    /**
     * Builds LoginResponse from user and optional instructor.
     *
     * @param user the user
     * @param instructorId the instructor ID (null for PM)
     * @return the login response
     */
    private LoginResponse buildLoginResponse(User user, Long instructorId) {
        String token = jwtUtil.generateToken(user);

        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .instructorId(instructorId)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    /**
     * Marks user email as verified and enables account.
     *
     * @param user the user to verify
     * @param verificationToken the verification token
     */
    private void markEmailAsVerified(User user, EmailVerificationToken verificationToken) {
        user.setEmailVerified(true);
        user.setEnabled(true);
        userRepository.save(user);

        verificationToken.setVerifiedAt(LocalDateTime.now());
        emailVerificationTokenRepository.save(verificationToken);
    }
}
