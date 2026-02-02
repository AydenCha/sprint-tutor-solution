package kr.codeit.onboarding.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.SendEmailRequest;
import com.resend.services.emails.model.SendEmailResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Resend API를 사용한 이메일 발송 서비스
 * Resend API Key가 설정되어 있으면 이 서비스를 통해 발송
 */
@Service
@Slf4j
public class ResendEmailService {

    private final Resend resend;
    private final String fromEmail;
    private final String fromName;
    private final String verificationBaseUrl;
    private final String passwordResetBaseUrl;
    private final boolean apiKeyConfigured;

    public ResendEmailService(
            @Value("${app.email.resend-api-key:}") String apiKey,
            @Value("${app.email.from:noreply@codeit.com}") String fromEmail,
            @Value("${app.email.from-name:코드잇}") String fromName,
            @org.springframework.beans.factory.annotation.Qualifier("verificationBaseUrl") String verificationBaseUrl,
            @org.springframework.beans.factory.annotation.Qualifier("passwordResetBaseUrl") String passwordResetBaseUrl) {
        this.apiKeyConfigured = apiKey != null && !apiKey.isEmpty();
        this.resend = this.apiKeyConfigured ? new Resend(apiKey) : null;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.verificationBaseUrl = verificationBaseUrl;
        this.passwordResetBaseUrl = passwordResetBaseUrl;
    }

    public boolean isApiKeyConfigured() {
        return apiKeyConfigured;
    }

    /**
     * 이메일 인증 링크 발송 (Resend API 사용)
     */
    public void sendVerificationEmail(String toEmail, String name, String token) {
        if (!apiKeyConfigured || resend == null) {
            log.warn("Resend API Key가 설정되지 않았습니다. 이메일 발송을 건너뜁니다.");
            log.info("인증 토큰: {} (개발용 - 직접 사용 가능)", token);
            return;
        }

        try {
            String verificationUrl = verificationBaseUrl + "?token=" + token;
            String htmlContent = buildVerificationEmailContent(name, verificationUrl);

            String from = fromName != null && !fromName.isEmpty()
                    ? fromName + " <" + fromEmail + ">"
                    : fromEmail;

            SendEmailRequest request = SendEmailRequest.builder()
                    .from(from)
                    .to(toEmail)
                    .subject("[코드잇] 이메일 인증을 완료해주세요")
                    .html(htmlContent)
                    .build();

            SendEmailResponse response = resend.emails().send(request);
            if (response != null && response.getId() != null) {
                log.info("이메일 인증 링크 발송 완료 (Resend): {} (Message ID: {})", toEmail, response.getId());
            } else {
                log.info("이메일 인증 링크 발송 완료 (Resend): {}", toEmail);
            }
        } catch (ResendException e) {
            log.error("이메일 인증 링크 발송 실패 (Resend): {} - {}", toEmail, e.getMessage(), e);
            log.info("인증 토큰 (개발용): {} - 직접 사용 가능", token);
        } catch (Exception e) {
            log.error("이메일 인증 링크 발송 실패 (Resend, 예상치 못한 에러): {} - {}", toEmail, e.getMessage(), e);
            log.info("인증 토큰 (개발용): {} - 직접 사용 가능", token);
        }
    }

    /**
     * 비밀번호 재설정 링크 발송 (Resend API 사용)
     */
    public void sendPasswordResetEmail(String toEmail, String name, String token) {
        if (!apiKeyConfigured || resend == null) {
            log.warn("Resend API Key가 설정되지 않았습니다. 이메일 발송을 건너뜁니다.");
            log.info("비밀번호 재설정 토큰: {} (개발용 - 직접 사용 가능)", token);
            return;
        }

        try {
            String resetUrl = passwordResetBaseUrl + "?token=" + token;
            String htmlContent = buildPasswordResetEmailContent(name, resetUrl);

            String from = fromName != null && !fromName.isEmpty()
                    ? fromName + " <" + fromEmail + ">"
                    : fromEmail;

            SendEmailRequest request = SendEmailRequest.builder()
                    .from(from)
                    .to(toEmail)
                    .subject("[코드잇] 비밀번호 재설정")
                    .html(htmlContent)
                    .build();

            SendEmailResponse response = resend.emails().send(request);
            if (response != null && response.getId() != null) {
                log.info("비밀번호 재설정 링크 발송 완료 (Resend): {} (Message ID: {})", toEmail, response.getId());
            } else {
                log.info("비밀번호 재설정 링크 발송 완료 (Resend): {}", toEmail);
            }
        } catch (ResendException e) {
            log.error("비밀번호 재설정 이메일 발송 실패 (Resend): {} - {}", toEmail, e.getMessage(), e);
            log.info("비밀번호 재설정 토큰 (개발용): {} - 직접 사용 가능", token);
        } catch (Exception e) {
            log.error("비밀번호 재설정 이메일 발송 실패 (Resend, 예상치 못한 에러): {} - {}", toEmail, e.getMessage(), e);
            log.info("비밀번호 재설정 토큰 (개발용): {} - 직접 사용 가능", token);
        }
    }

    private String buildVerificationEmailContent(String name, String verificationUrl) {
        return String.format(
            "<!DOCTYPE html>" +
            "<html>" +
            "<head><meta charset='UTF-8'></head>" +
            "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
            "<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>" +
            "<h2 style='color: #4CAF50;'>안녕하세요, %s님!</h2>" +
            "<p>코드잇 강사 온보딩 시스템에 가입해주셔서 감사합니다.</p>" +
            "<p>이메일 인증을 완료하시려면 아래 버튼을 클릭해주세요:</p>" +
            "<div style='text-align: center; margin: 30px 0;'>" +
            "<a href='%s' style='background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;'>이메일 인증하기</a>" +
            "</div>" +
            "<p style='font-size: 12px; color: #666;'>또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>" +
            "<p style='font-size: 12px; color: #666; word-break: break-all;'>%s</p>" +
            "<p style='font-size: 12px; color: #999;'>만약 이 이메일을 요청하지 않으셨다면, 이 메시지를 무시하셔도 됩니다.</p>" +
            "<hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>" +
            "<p style='font-size: 12px; color: #999;'>감사합니다.<br>코드잇 팀</p>" +
            "</div>" +
            "</body>" +
            "</html>",
            name, verificationUrl, verificationUrl
        );
    }

    private String buildPasswordResetEmailContent(String name, String resetUrl) {
        return String.format(
            "<!DOCTYPE html>" +
            "<html>" +
            "<head><meta charset='UTF-8'></head>" +
            "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
            "<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>" +
            "<h2 style='color: #2196F3;'>안녕하세요, %s님!</h2>" +
            "<p>비밀번호 재설정을 요청하셨습니다.</p>" +
            "<p>아래 버튼을 클릭하여 새 비밀번호를 설정해주세요:</p>" +
            "<div style='text-align: center; margin: 30px 0;'>" +
            "<a href='%s' style='background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;'>비밀번호 재설정하기</a>" +
            "</div>" +
            "<p style='font-size: 12px; color: #666;'>또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>" +
            "<p style='font-size: 12px; color: #666; word-break: break-all;'>%s</p>" +
            "<p style='font-size: 12px; color: #999;'>이 링크는 1시간 동안 유효합니다.</p>" +
            "<p style='font-size: 12px; color: #999;'>만약 비밀번호 재설정을 요청하지 않으셨다면, 이 메시지를 무시하셔도 됩니다.</p>" +
            "<hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>" +
            "<p style='font-size: 12px; color: #999;'>감사합니다.<br>코드잇 팀</p>" +
            "</div>" +
            "</body>" +
            "</html>",
            name, resetUrl, resetUrl
        );
    }
}
