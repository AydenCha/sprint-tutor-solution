package kr.codeit.onboarding.dto;

import kr.codeit.onboarding.domain.entity.AuditLog;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Audit Log 응답 DTO
 */
@Data
@Builder
public class AuditLogResponse {

    private Long id;
    private String actionType;
    private String entityType;
    private Long entityId;
    private String performedByName;
    private String performedByEmail;
    private Long performedById;
    private String oldValue;
    private String newValue;
    private String description;
    private String metadata;
    private LocalDateTime actionTime;
    private LocalDateTime createdAt;

    public static AuditLogResponse from(AuditLog auditLog) {
        String performedByName = "SYSTEM";
        if (auditLog.getPerformedBy() != null) {
            performedByName = auditLog.getPerformedBy().getName();
            // 탈퇴한 사용자인 경우 "(탈퇴)" 표시 추가
            if (auditLog.getPerformedBy().isDeleted()) {
                performedByName = performedByName + " (탈퇴)";
            }
        }

        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .actionType(auditLog.getActionType().name())
                .entityType(auditLog.getEntityType())
                .entityId(auditLog.getEntityId())
                .performedByName(performedByName)
                .performedByEmail(auditLog.getPerformedBy() != null ? auditLog.getPerformedBy().getEmail() : null)
                .performedById(auditLog.getPerformedBy() != null ? auditLog.getPerformedBy().getId() : null)
                .oldValue(auditLog.getOldValue())
                .newValue(auditLog.getNewValue())
                .description(auditLog.getDescription())
                .metadata(auditLog.getMetadata())
                .actionTime(auditLog.getActionTime())
                .createdAt(auditLog.getCreatedAt())
                .build();
    }
}
