package kr.codeit.onboarding.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 이메일 URL 설정을 위한 Configuration
 * 우선순위:
 * 1. EMAIL_VERIFICATION_URL / EMAIL_PASSWORD_RESET_URL 환경 변수 (명시적 설정)
 * 2. FRONTEND_URL 환경 변수 + 경로
 * 3. CORS_ALLOWED_ORIGINS의 첫 번째 값 + 경로
 */
@Configuration
@Slf4j
public class EmailUrlConfig {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${FRONTEND_URL:}")
    private String frontendUrl;

    @Value("${EMAIL_VERIFICATION_URL:}")
    private String explicitVerificationUrl;

    @Value("${EMAIL_PASSWORD_RESET_URL:}")
    private String explicitPasswordResetUrl;

    /**
     * 프론트엔드 기본 URL을 반환
     * 우선순위: FRONTEND_URL > CORS_ALLOWED_ORIGINS의 첫 번째 값
     */
    private String getFrontendBaseUrl() {
        if (frontendUrl != null && !frontendUrl.isEmpty()) {
            log.info("Using FRONTEND_URL environment variable: {}", frontendUrl);
            return frontendUrl;
        } else {
            // CORS_ALLOWED_ORIGINS에서 첫 번째 origin 추출
            String[] origins = allowedOrigins.split(",");
            String url = origins[0].trim();
            log.info("Using first origin from CORS_ALLOWED_ORIGINS: {}", url);
            return url;
        }
    }

    /**
     * 이메일 인증 URL Bean
     */
    @Bean("verificationBaseUrl")
    public String verificationBaseUrl() {
        if (explicitVerificationUrl != null && !explicitVerificationUrl.isEmpty()) {
            log.info("Using EMAIL_VERIFICATION_URL environment variable: {}", explicitVerificationUrl);
            return explicitVerificationUrl;
        }
        String url = getFrontendBaseUrl() + "/auth/verify-email";
        log.info("Constructed verification URL: {}", url);
        return url;
    }

    /**
     * 비밀번호 재설정 URL Bean
     */
    @Bean("passwordResetBaseUrl")
    public String passwordResetBaseUrl() {
        if (explicitPasswordResetUrl != null && !explicitPasswordResetUrl.isEmpty()) {
            log.info("Using EMAIL_PASSWORD_RESET_URL environment variable: {}", explicitPasswordResetUrl);
            return explicitPasswordResetUrl;
        }
        String url = getFrontendBaseUrl() + "/auth/reset-password";
        log.info("Constructed password reset URL: {}", url);
        return url;
    }
}
