package kr.codeit.onboarding.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * 이메일 발송 서비스
 * PM 회원가입 시 이메일 인증 링크 발송
 * 
 * Brevo API Key가 설정되어 있으면 BrevoEmailService 사용
 * 그렇지 않으면 기존 SMTP 방식 사용
 */
@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final BrevoEmailService brevoEmailService;
    private final boolean useBrevoApi;

    // JavaMailSender가 없을 수 있으므로 required = false로 설정
    @Autowired(required = false)
    public EmailService(JavaMailSender mailSender, BrevoEmailService brevoEmailService,
                       @Value("${app.email.brevo-api-key:}") String brevoApiKey,
                       @org.springframework.beans.factory.annotation.Qualifier("verificationBaseUrl") String verificationBaseUrl,
                       @org.springframework.beans.factory.annotation.Qualifier("passwordResetBaseUrl") String passwordResetBaseUrl) {
        this.mailSender = mailSender;
        this.brevoEmailService = brevoEmailService;
        this.useBrevoApi = brevoApiKey != null && !brevoApiKey.isEmpty();
        this.verificationBaseUrl = verificationBaseUrl;
        this.passwordResetBaseUrl = passwordResetBaseUrl;
    }

    private final String verificationBaseUrl;
    private final String passwordResetBaseUrl;

    @Value("${app.email.from:noreply@codeit.com}")
    private String fromEmail;

    /**
     * 이메일 인증 링크 발송
     * Brevo API Key가 설정되어 있으면 REST API 사용, 그렇지 않으면 SMTP 사용
     * 개발 환경에서는 이메일 발송 실패 시에도 예외를 던지지 않음
     */
    public void sendVerificationEmail(String toEmail, String name, String token) {
        // Brevo API Key가 설정되어 있으면 REST API 사용 (더 안정적)
        if (useBrevoApi) {
            log.debug("Brevo REST API를 사용하여 이메일 발송: {}", toEmail);
            brevoEmailService.sendVerificationEmail(toEmail, name, token);
            return;
        }

        // 기존 SMTP 방식 (fallback)
        if (mailSender == null) {
            log.warn("JavaMailSender가 설정되지 않았습니다. 이메일 발송을 건너뜁니다. (개발 환경)");
            log.info("인증 토큰: {} (개발용 - 직접 사용 가능)", token);
            return;
        }

        try {
            String verificationUrl = verificationBaseUrl + "?token=" + token;

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("[코드잇] 이메일 인증을 완료해주세요");
            message.setText(buildVerificationEmailContent(name, verificationUrl));

            mailSender.send(message);
            log.info("이메일 인증 링크 발송 완료 (SMTP): {}", toEmail);
        } catch (Exception e) {
            log.error("이메일 발송 실패 (SMTP): {} - 개발 환경에서는 계속 진행합니다.", toEmail, e);
            log.info("인증 토큰 (개발용): {} - 직접 사용 가능", token);
            // 개발 환경에서는 예외를 던지지 않고 로그만 남김
            // 프로덕션에서는 예외를 던져야 하지만, 현재는 개발 환경을 고려
        }
    }

    /**
     * 비밀번호 재설정 링크 발송
     */
    public void sendPasswordResetEmail(String toEmail, String name, String token) {
        log.info("비밀번호 재설정 이메일 발송 시도: {} (useBrevoApi: {}, mailSender: {})", 
                toEmail, useBrevoApi, mailSender != null ? "설정됨" : "null");
        
        // Brevo API Key가 설정되어 있으면 REST API 사용
        if (useBrevoApi) {
            log.info("Brevo REST API를 사용하여 비밀번호 재설정 이메일 발송: {}", toEmail);
            brevoEmailService.sendPasswordResetEmail(toEmail, name, token);
            return;
        }

        // 기존 SMTP 방식 (fallback)
        if (mailSender == null) {
            log.warn("JavaMailSender가 설정되지 않았습니다. 이메일 발송을 건너뜁니다. (개발 환경)");
            log.warn("로컬 개발 환경에서는 MailHog를 실행해야 합니다: docker-compose up -d mailhog");
            log.info("비밀번호 재설정 토큰: {} (개발용 - 직접 사용 가능)", token);
            log.info("비밀번호 재설정 URL: {}?token={}", passwordResetBaseUrl, token);
            return;
        }

        try {
            String resetUrl = passwordResetBaseUrl + "?token=" + token;
            log.debug("비밀번호 재설정 URL 생성: {}", resetUrl);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("[코드잇] 비밀번호 재설정");
            message.setText(buildPasswordResetEmailContent(name, resetUrl));

            log.debug("SMTP를 통해 이메일 발송 시도: {} -> {}", fromEmail, toEmail);
            mailSender.send(message);
            log.info("비밀번호 재설정 링크 발송 완료 (SMTP): {} - MailHog Web UI에서 확인: http://localhost:8025", toEmail);
        } catch (Exception e) {
            log.error("이메일 발송 실패 (SMTP): {} - 에러: {}", toEmail, e.getMessage(), e);
            log.warn("MailHog가 실행 중인지 확인하세요: docker ps | grep mailhog");
            log.warn("MailHog를 시작하려면: docker-compose up -d mailhog");
            log.info("비밀번호 재설정 토큰 (개발용): {} - 직접 사용 가능", token);
            log.info("비밀번호 재설정 URL: {}?token={}", passwordResetBaseUrl, token);
        }
    }

    private String buildVerificationEmailContent(String name, String verificationUrl) {
        return String.format(
            "안녕하세요, %s님!\n\n" +
            "코드잇 강사 온보딩 시스템에 가입해주셔서 감사합니다.\n\n" +
            "이메일 인증을 완료하시려면 아래 링크를 클릭해주세요:\n\n" +
            "%s\n\n" +
            "만약 이 이메일을 요청하지 않으셨다면, 이 메시지를 무시하셔도 됩니다.\n\n" +
            "감사합니다.\n" +
            "코드잇 팀",
            name, verificationUrl
        );
    }

    private String buildPasswordResetEmailContent(String name, String resetUrl) {
        return String.format(
            "안녕하세요, %s님!\n\n" +
            "비밀번호 재설정을 요청하셨습니다.\n\n" +
            "아래 링크를 클릭하여 새 비밀번호를 설정해주세요:\n\n" +
            "%s\n\n" +
            "이 링크는 1시간 동안 유효합니다.\n\n" +
            "만약 비밀번호 재설정을 요청하지 않으셨다면, 이 메시지를 무시하셔도 됩니다.\n\n" +
            "감사합니다.\n" +
            "코드잇 팀",
            name, resetUrl
        );
    }
}

