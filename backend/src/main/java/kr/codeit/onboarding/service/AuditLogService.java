package kr.codeit.onboarding.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.codeit.onboarding.domain.entity.AuditLog;
import kr.codeit.onboarding.domain.entity.User;
import kr.codeit.onboarding.repository.AuditLogRepository;
import kr.codeit.onboarding.security.SecurityContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Audit Log Service
 * Records all PM actions to enable tracking
 *
 * ============================================
 * Audit Log Usage Guidelines
 * ============================================
 *
 * Actions that SHOULD be logged:
 * - CREATE: Creating new entities (StepDefinition, Module, Template, etc.)
 * - UPDATE: Modifying existing entities
 * - DELETE: Deleting entities
 * - ASSIGN: Assigning resources (e.g., assigning template to instructor)
 * - EXPORT/IMPORT: Data export/import
 *
 * Actions that SHOULD NOT be logged:
 * - GET requests (queries, lists, details)
 * - Repeated calls from polling/auto-refresh
 * - Simple query API calls
 *
 * Core Principles:
 * - Only log actions where users directly click to change data
 * - performedBy field automatically records which PM performed the action
 * - Query operations only add unnecessary load to audit log
 *
 * Examples:
 * - auditLogService.logAction(CREATE, "StepTemplate", id, "Template created")
 * - auditLogService.logAction(DELETE, "Module", id, "Module deleted")
 * - Do NOT call logAction in getStepTemplate() method
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final kr.codeit.onboarding.repository.UserRepository userRepository;
    private final SecurityContext securityContext;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 작업 로그 기록 (일반)
     */
    @Transactional
    public void logAction(
            AuditLog.ActionType actionType,
            String entityType,
            Long entityId,
            String description
    ) {
        logAction(actionType, entityType, entityId, description, null, null, null);
    }

    /**
     * 작업 로그 기록 (변경 전/후 값 포함)
     */
    @Transactional
    public void logAction(
            AuditLog.ActionType actionType,
            String entityType,
            Long entityId,
            String description,
            Object oldValue,
            Object newValue
    ) {
        logAction(actionType, entityType, entityId, description, oldValue, newValue, null);
    }

    /**
     * 작업 로그 기록 (전체)
     */
    @Transactional
    public void logAction(
            AuditLog.ActionType actionType,
            String entityType,
            Long entityId,
            String description,
            Object oldValue,
            Object newValue,
            Map<String, Object> metadata
    ) {
        try {
            // 현재 사용자 정보 가져오기 (PM인 경우에만)
            User performedBy = null;
            try {
                User currentUser = securityContext.getCurrentUser();
                if (currentUser != null && currentUser.getRole() == kr.codeit.onboarding.domain.enums.UserRole.PM) {
                    // JPA managed entity를 얻기 위해 다시 조회
                    performedBy = userRepository.findById(currentUser.getId()).orElse(null);
                    log.info("Audit log will be recorded by PM: {} ({})", currentUser.getName(), currentUser.getEmail());
                }
            } catch (Exception e) {
                // 인증되지 않은 경우 또는 PM이 아닌 경우 NULL로 처리
                // (시스템 작업, 샘플 데이터 등)
                log.warn("No authenticated PM user for audit log: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            }

            // JSON 변환
            String oldValueJson = toJson(oldValue);
            String newValueJson = toJson(newValue);
            String metadataJson = toJson(metadata);

            // 로그 생성
            AuditLog auditLog = new AuditLog();
            auditLog.setActionType(actionType);
            auditLog.setEntityType(entityType);
            auditLog.setEntityId(entityId);
            auditLog.setPerformedBy(performedBy);
            auditLog.setOldValue(oldValueJson);
            auditLog.setNewValue(newValueJson);
            auditLog.setDescription(description);
            auditLog.setMetadata(metadataJson);
            auditLog.setActionTime(LocalDateTime.now());

            if (performedBy != null) {
                log.info("Setting performedBy: ID={}, email={}", performedBy.getId(), performedBy.getEmail());
            } else {
                log.info("performedBy is NULL");
            }

            AuditLog savedLog = auditLogRepository.save(auditLog);
            auditLogRepository.flush(); // Immediate flush
            
            // Verify after save
            if (savedLog.getPerformedBy() != null) {
                log.info("AFTER SAVE: performedBy still set: ID={}", savedLog.getPerformedBy().getId());
            } else {
                log.error("AFTER SAVE: performedBy became NULL!");
            }
            
            log.debug("Audit log created: {} {} {} by {}", actionType, entityType, entityId, 
                    performedBy != null ? performedBy.getEmail() : "SYSTEM");

        } catch (Exception e) {
            // 로그 기록 실패가 전체 작업을 막지 않도록 예외를 잡아서 로그만 남김
            log.error("Failed to create audit log: {}", e.getMessage(), e);
        }
    }

    /**
     * 객체를 JSON 문자열로 변환
     */
    private String toJson(Object obj) {
        if (obj == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize object to JSON: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 특정 PM 사용자의 로그 조회
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getLogsByPm(Long pmId, Pageable pageable) {
        return auditLogRepository.findByPerformedBy_IdOrderByActionTimeDesc(pmId, pageable);
    }

    /**
     * 특정 엔티티 타입의 로그 조회
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getLogsByEntityType(String entityType, Pageable pageable) {
        return auditLogRepository.findByEntityTypeOrderByActionTimeDesc(entityType, Pageable.unpaged());
    }

    /**
     * 특정 엔티티의 변경 이력 조회
     */
    @Transactional(readOnly = true)
    public java.util.List<AuditLog> getEntityHistory(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByActionTimeDesc(entityType, entityId);
    }

    /**
     * 최근 로그 조회 (대시보드용)
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getRecentLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByActionTimeDesc(pageable);
    }

    /**
     * 특정 기간의 로그 조회
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getLogsByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return auditLogRepository.findByActionTimeBetween(startDate, endDate, pageable);
    }

    /**
     * 특정 PM 사용자의 특정 기간 로그 조회
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getLogsByPmAndDateRange(Long pmId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return auditLogRepository.findByPerformedByAndActionTimeBetween(pmId, startDate, endDate, pageable);
    }

    /**
     * 필터링 (단순화: NULL 날짜를 기본값으로 대체)
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> searchLogs(
            AuditLog.ActionType actionType,
            String entityType,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    ) {
        // NULL 날짜를 기본값으로 대체 (PostgreSQL 타입 추론 문제 해결)
        LocalDateTime effectiveStartDate = startDate != null ? startDate : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime effectiveEndDate = endDate != null ? endDate : LocalDateTime.of(2099, 12, 31, 23, 59);
        
        return auditLogRepository.searchLogs(
                actionType,
                entityType,
                effectiveStartDate,
                effectiveEndDate,
                pageable
        );
    }

    /**
     * 작업 타입별 통계
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getStatsByActionType() {
        java.util.List<Object[]> results = auditLogRepository.countByActionType();
        Map<String, Long> stats = new java.util.HashMap<>();
        for (Object[] row : results) {
            AuditLog.ActionType actionType = (AuditLog.ActionType) row[0];
            Long count = (Long) row[1];
            stats.put(actionType.name(), count);
        }
        return stats;
    }

    /**
     * 엔티티 타입별 통계
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getStatsByEntityType() {
        java.util.List<Object[]> results = auditLogRepository.countByEntityType();
        Map<String, Long> stats = new java.util.HashMap<>();
        for (Object[] row : results) {
            String entityType = (String) row[0];
            Long count = (Long) row[1];
            stats.put(entityType, count);
        }
        return stats;
    }
}

