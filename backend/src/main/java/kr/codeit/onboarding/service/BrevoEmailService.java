package kr.codeit.onboarding.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

/**
 * Brevo REST API를 사용한 이메일 발송 서비스
 * SMTP 연결 문제를 해결하기 위해 REST API 사용
 */
@Service
@Slf4j
public class BrevoEmailService {

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String fromEmail;
    private final String fromName;
    private final String verificationBaseUrl;
    private final String passwordResetBaseUrl;
    private final String brevoApiUrl;

    public BrevoEmailService(
            @Value("${app.email.brevo-api-key:}") String apiKey,
            @Value("${app.email.from:noreply@codeit.com}") String fromEmail,
            @Value("${app.email.from-name:코드잇}") String fromName,
            @org.springframework.beans.factory.annotation.Qualifier("verificationBaseUrl") String verificationBaseUrl,
            @org.springframework.beans.factory.annotation.Qualifier("passwordResetBaseUrl") String passwordResetBaseUrl,
            @Value("${app.email.brevo-api-url:https://api.brevo.com/v3/smtp/email}") String brevoApiUrl) {
        this.restTemplate = new RestTemplate();
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.verificationBaseUrl = verificationBaseUrl;
        this.passwordResetBaseUrl = passwordResetBaseUrl;
        this.brevoApiUrl = brevoApiUrl;
    }

    /**
     * 이메일 인증 링크 발송 (Brevo Transactional Email API 사용)
     */
    public void sendVerificationEmail(String toEmail, String name, String token) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Brevo API Key가 설정되지 않았습니다. 이메일 발송을 건너뜁니다.");
            log.info("인증 토큰: {} (개발용 - 직접 사용 가능)", token);
            return;
        }

        try {
            String verificationUrl = verificationBaseUrl + "?token=" + token;
            String emailContent = buildVerificationEmailContent(name, verificationUrl);

            BrevoEmailRequest request = BrevoEmailRequest.builder()
                    .sender(BrevoSender.builder()
                            .name(fromName)
                            .email(fromEmail)
                            .build())
                    .to(Collections.singletonList(BrevoRecipient.builder()
                            .email(toEmail)
                            .name(name)
                            .build()))
                    .subject("[코드잇] 이메일 인증을 완료해주세요")
                    .htmlContent(emailContent)
                    .textContent(buildVerificationEmailTextContent(name, verificationUrl))
                    .build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            HttpEntity<BrevoEmailRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<BrevoEmailResponse> response = restTemplate.exchange(
                    brevoApiUrl,
                    HttpMethod.POST,
                    entity,
                    BrevoEmailResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("이메일 인증 링크 발송 완료: {} (Message ID: {})", toEmail, response.getBody().getMessageId());
            } else {
                log.warn("이메일 발송 응답이 예상과 다릅니다: {}", response.getStatusCode());
            }
        } catch (HttpClientErrorException e) {
            // 4xx 클라이언트 에러 (잘못된 요청, 인증 실패 등)
            log.error("이메일 인증 링크 발송 실패 (클라이언트 에러 {}): {} - 응답 본문: {}", 
                    e.getStatusCode(), toEmail, e.getResponseBodyAsString(), e);
            log.info("인증 토큰 (개발용): {} - 직접 사용 가능", token);
        } catch (HttpServerErrorException e) {
            // 5xx 서버 에러 (Brevo 서버 문제)
            log.error("이메일 인증 링크 발송 실패 (서버 에러 {}): {} - 응답 본문: {}", 
                    e.getStatusCode(), toEmail, e.getResponseBodyAsString(), e);
            log.info("인증 토큰 (개발용): {} - 직접 사용 가능", token);
        } catch (RestClientException e) {
            // 네트워크 에러 등
            log.error("이메일 인증 링크 발송 실패 (네트워크/기타 에러): {} - {}", toEmail, e.getMessage(), e);
            log.info("인증 토큰 (개발용): {} - 직접 사용 가능", token);
        } catch (Exception e) {
            log.error("이메일 인증 링크 발송 실패 (예상치 못한 에러): {} - {}", toEmail, e.getMessage(), e);
            log.info("인증 토큰 (개발용): {} - 직접 사용 가능", token);
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

    /**
     * 비밀번호 재설정 링크 발송 (Brevo Transactional Email API 사용)
     */
    public void sendPasswordResetEmail(String toEmail, String name, String token) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Brevo API Key가 설정되지 않았습니다. 이메일 발송을 건너뜁니다.");
            log.info("비밀번호 재설정 토큰: {} (개발용 - 직접 사용 가능)", token);
            return;
        }

        try {
            String resetUrl = passwordResetBaseUrl + "?token=" + token;
            String emailContent = buildPasswordResetEmailContent(name, resetUrl);

            BrevoEmailRequest request = BrevoEmailRequest.builder()
                    .sender(BrevoSender.builder()
                            .name(fromName)
                            .email(fromEmail)
                            .build())
                    .to(Collections.singletonList(BrevoRecipient.builder()
                            .email(toEmail)
                            .name(name)
                            .build()))
                    .subject("[코드잇] 비밀번호 재설정")
                    .htmlContent(emailContent)
                    .textContent(buildPasswordResetEmailTextContent(name, resetUrl))
                    .build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            HttpEntity<BrevoEmailRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<BrevoEmailResponse> response = restTemplate.exchange(
                    brevoApiUrl,
                    HttpMethod.POST,
                    entity,
                    BrevoEmailResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("비밀번호 재설정 링크 발송 완료: {} (Message ID: {})", toEmail, response.getBody().getMessageId());
            } else {
                log.warn("이메일 발송 응답이 예상과 다릅니다: {}", response.getStatusCode());
            }
        } catch (HttpClientErrorException e) {
            // 4xx 클라이언트 에러 (잘못된 요청, 인증 실패 등)
            log.error("비밀번호 재설정 이메일 발송 실패 (클라이언트 에러 {}): {} - 응답 본문: {}", 
                    e.getStatusCode(), toEmail, e.getResponseBodyAsString(), e);
            log.info("비밀번호 재설정 토큰 (개발용): {} - 직접 사용 가능", token);
        } catch (HttpServerErrorException e) {
            // 5xx 서버 에러 (Brevo 서버 문제)
            log.error("비밀번호 재설정 이메일 발송 실패 (서버 에러 {}): {} - 응답 본문: {}", 
                    e.getStatusCode(), toEmail, e.getResponseBodyAsString(), e);
            log.info("비밀번호 재설정 토큰 (개발용): {} - 직접 사용 가능", token);
        } catch (RestClientException e) {
            // 네트워크 에러 등
            log.error("비밀번호 재설정 이메일 발송 실패 (네트워크/기타 에러): {} - {}", toEmail, e.getMessage(), e);
            log.info("비밀번호 재설정 토큰 (개발용): {} - 직접 사용 가능", token);
        } catch (Exception e) {
            log.error("비밀번호 재설정 이메일 발송 실패 (예상치 못한 에러): {} - {}", toEmail, e.getMessage(), e);
            log.info("비밀번호 재설정 토큰 (개발용): {} - 직접 사용 가능", token);
        }
    }

    private String buildVerificationEmailTextContent(String name, String verificationUrl) {
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

    private String buildPasswordResetEmailTextContent(String name, String resetUrl) {
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

    // Brevo API Request DTOs
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    static class BrevoEmailRequest {
        private BrevoSender sender;
        private List<BrevoRecipient> to;
        private String subject;
        @JsonProperty("htmlContent")
        private String htmlContent;
        @JsonProperty("textContent")
        private String textContent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    static class BrevoSender {
        private String name;
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    static class BrevoRecipient {
        private String email;
        private String name;
    }

    @Data
    static class BrevoEmailResponse {
        @JsonProperty("messageId")
        private String messageId;
    }
}
