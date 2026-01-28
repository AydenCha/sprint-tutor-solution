package kr.codeit.onboarding.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import kr.codeit.onboarding.dto.LoginRequest;
import kr.codeit.onboarding.dto.LoginResponse;
import kr.codeit.onboarding.dto.PasswordResetRequest;
import kr.codeit.onboarding.dto.PmRegistrationRequest;
import kr.codeit.onboarding.dto.PmRegistrationResponse;
import kr.codeit.onboarding.security.SecurityContext;
import kr.codeit.onboarding.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for Authentication and User Management.
 *
 * <p>This controller handles all authentication-related operations including:</p>
 * <ul>
 *   <li>User registration (PM accounts)</li>
 *   <li>User login and JWT token generation</li>
 *   <li>Email verification</li>
 *   <li>Password reset functionality</li>
 *   <li>Account deletion</li>
 * </ul>
 *
 * <p>All endpoints except authentication operations require valid JWT token in the Authorization header.</p>
 *
 * @author Sprint Tutor Flow Team
 * @since 1.0
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;
    private final SecurityContext securityContext;

    /**
     * Register a new Program Manager (PM) account.
     *
     * <p>Creates a new PM account with the provided credentials. The email must be a valid @codeit.com address.
     * After registration, a verification email will be sent to complete the account setup.</p>
     *
     * @param request the registration request containing name, email, and password
     * @return ResponseEntity containing the registration response with user details and JWT token
     * @throws kr.codeit.onboarding.exception.DuplicateResourceException if email already exists
     */
    @PostMapping("/register/pm")
    public ResponseEntity<PmRegistrationResponse> registerPm(
            @Valid @RequestBody PmRegistrationRequest request) {
        PmRegistrationResponse response = authService.registerPm(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Authenticate user and generate JWT token.
     *
     * <p>Validates user credentials and returns a JWT token for subsequent API calls.
     * The email must be verified before login is allowed.</p>
     *
     * @param request the login request containing email and password
     * @return ResponseEntity containing the login response with JWT token and user details
     * @throws kr.codeit.onboarding.exception.InvalidCredentialsException if credentials are invalid
     * @throws kr.codeit.onboarding.exception.UnauthorizedException if email is not verified
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Verify user email address with token.
     *
     * <p>Completes the email verification process using the token sent to the user's email.
     * Upon successful verification, returns a JWT token for immediate login.</p>
     *
     * @param token the email verification token sent to user's email
     * @return ResponseEntity containing login response with JWT token
     * @throws kr.codeit.onboarding.exception.InvalidCredentialsException if token is invalid or expired
     */
    @PostMapping("/verify-email")
    public ResponseEntity<LoginResponse> verifyEmail(
            @RequestParam @NotBlank String token) {
        LoginResponse response = authService.verifyEmail(token);
        return ResponseEntity.ok(response);
    }

    /**
     * Resend email verification token.
     *
     * <p>Sends a new verification email to the specified address if the previous token expired
     * or was not received. Can only be used for accounts that are not yet verified.</p>
     *
     * @param email the email address to resend verification token to
     * @return ResponseEntity containing success status and message
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if email not found
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, Object>> resendVerificationEmail(
            @RequestParam @Email @NotBlank String email) {
        authService.resendVerificationEmail(email);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "인증 이메일을 재발송했습니다. 이메일을 확인해주세요."
        ));
    }

    /**
     * Delete the currently authenticated user's account.
     *
     * <p>Permanently deletes the user's account and all associated data. This action cannot be undone.
     * The user must be authenticated to perform this operation.</p>
     *
     * @return ResponseEntity containing success status and message
     * @throws kr.codeit.onboarding.exception.UnauthorizedException if user is not authenticated
     */
    @DeleteMapping("/account")
    public ResponseEntity<Map<String, Object>> deleteAccount() {
        Long userId = securityContext.getCurrentUserId();
        authService.deleteAccount(userId);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "회원 탈퇴가 완료되었습니다."
        ));
    }

    /**
     * Request password reset token.
     *
     * <p>Sends a password reset link to the specified email address if it exists in the system.
     * The link contains a one-time token that expires after a certain period.</p>
     *
     * @param email the email address to send password reset link to
     * @return ResponseEntity containing success status and message
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> requestPasswordReset(
            @RequestParam @Email @NotBlank String email) {
        authService.requestPasswordReset(email);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "비밀번호 재설정 링크를 이메일로 발송했습니다. 이메일을 확인해주세요."
        ));
    }

    /**
     * Reset password using reset token.
     *
     * <p>Validates the reset token and updates the user's password to the new value.
     * The token can only be used once and expires after a certain period.</p>
     *
     * <p><strong>Security Note:</strong> Password is sent in request body, not URL parameters,
     * to prevent exposure in browser history, server logs, or Referer headers.</p>
     *
     * @param request the password reset request containing token and new password
     * @return ResponseEntity containing success status and message
     * @throws kr.codeit.onboarding.exception.InvalidCredentialsException if token is invalid or expired
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(
            @Valid @RequestBody PasswordResetRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "비밀번호가 성공적으로 변경되었습니다."
        ));
    }
}
