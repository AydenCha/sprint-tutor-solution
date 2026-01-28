package kr.codeit.onboarding.controller;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import kr.codeit.onboarding.domain.entity.AuditLog;
import kr.codeit.onboarding.dto.AuditLogResponse;
import kr.codeit.onboarding.service.AuditLogService;
import kr.codeit.onboarding.security.SecurityContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller for Audit Log Management and Reporting.
 *
 * <p>This controller provides comprehensive audit logging capabilities including:</p>
 * <ul>
 *   <li>Recent log retrieval with pagination</li>
 *   <li>Log filtering by PM, entity type, action type, and date range</li>
 *   <li>Entity change history tracking</li>
 *   <li>Statistical analysis and reporting</li>
 *   <li>CSV export for external analysis</li>
 * </ul>
 *
 * <p>Audit logs automatically track all system changes including:</p>
 * <ul>
 *   <li>CREATE: New entity creation</li>
 *   <li>UPDATE: Entity modifications</li>
 *   <li>DELETE: Entity deletions</li>
 *   <li>LOGIN: User authentication events</li>
 *   <li>LOGOUT: User session terminations</li>
 * </ul>
 *
 * <p>All endpoints are PM-only for security and compliance purposes.</p>
 *
 * @author Sprint Tutor Flow Team
 * @since 1.0
 */
@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
@Validated
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final SecurityContext securityContext;

    /**
     * Retrieve recent audit logs with pagination.
     *
     * <p>Returns the most recent audit logs ordered by timestamp in descending order.
     * Useful for monitoring recent system activity.</p>
     *
     * <p>PM access only.</p>
     *
     * @param page the page number (0-indexed, default: 0)
     * @param size the page size (default: 20, max: 100)
     * @return ResponseEntity containing paginated audit log entries
     */
    @GetMapping
    public ResponseEntity<Page<AuditLogResponse>> getRecentLogs(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        securityContext.requirePm();
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logs = auditLogService.getRecentLogs(pageable);
        Page<AuditLogResponse> response = logs.map(AuditLogResponse::from);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve audit logs for a specific PM.
     *
     * <p>Returns all audit logs for actions performed by a specific PM. Useful for
     * tracking individual PM activity and accountability.</p>
     *
     * <p>PM access only.</p>
     *
     * @param pmId the PM user ID
     * @param page the page number (0-indexed, default: 0)
     * @param size the page size (default: 20, max: 100)
     * @return ResponseEntity containing paginated audit logs for the PM
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if PM not found
     */
    @GetMapping("/pm/{pmId}")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByPm(
            @PathVariable Long pmId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        securityContext.requirePm();
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logs = auditLogService.getLogsByPm(pmId, pageable);
        Page<AuditLogResponse> response = logs.map(AuditLogResponse::from);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve audit logs for a specific entity type.
     *
     * <p>Returns all audit logs for a particular entity type (e.g., "Instructor", "Task", "Module").
     * Useful for tracking changes to specific types of data.</p>
     *
     * <p>PM access only.</p>
     *
     * @param entityType the entity type name (e.g., "Instructor", "Task")
     * @param page the page number (0-indexed, default: 0)
     * @param size the page size (default: 20, max: 100)
     * @return ResponseEntity containing paginated audit logs for the entity type
     */
    @GetMapping("/entity/{entityType}")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByEntityType(
            @PathVariable String entityType,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        securityContext.requirePm();
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logs = auditLogService.getLogsByEntityType(entityType, pageable);
        Page<AuditLogResponse> response = logs.map(AuditLogResponse::from);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve audit logs within a date range.
     *
     * <p>Returns all audit logs that occurred between the specified start and end dates.
     * Useful for generating periodic audit reports.</p>
     *
     * <p>PM access only.</p>
     *
     * @param startDate the start date-time (ISO 8601 format)
     * @param endDate the end date-time (ISO 8601 format)
     * @param page the page number (0-indexed, default: 0)
     * @param size the page size (default: 20, max: 100)
     * @return ResponseEntity containing paginated audit logs within date range
     */
    @GetMapping("/date-range")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        securityContext.requirePm();
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logs = auditLogService.getLogsByDateRange(startDate, endDate, pageable);
        Page<AuditLogResponse> response = logs.map(AuditLogResponse::from);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve complete change history for a specific entity.
     *
     * <p>Returns all audit logs for a specific entity instance, providing a complete
     * audit trail of all changes made to that entity over time.</p>
     *
     * <p>PM access only.</p>
     *
     * @param entityType the entity type name (e.g., "Instructor", "Task")
     * @param entityId the entity instance ID
     * @return ResponseEntity containing all audit logs for the entity
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if entity not found
     */
    @GetMapping("/entity/{entityType}/{entityId}/history")
    public ResponseEntity<List<AuditLogResponse>> getEntityHistory(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        securityContext.requirePm();
        List<AuditLog> logs = auditLogService.getEntityHistory(entityType, entityId);
        List<AuditLogResponse> response = logs.stream()
                .map(AuditLogResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * Search and filter audit logs with multiple criteria.
     *
     * <p>Provides flexible filtering of audit logs by action type, entity type, and date range.
     * All filter parameters are optional and can be combined for precise queries.</p>
     *
     * <p>PM access only.</p>
     *
     * @param actionType optional action type filter (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
     * @param entityType optional entity type filter (e.g., "Instructor", "Task")
     * @param startDate optional start date-time filter (ISO 8601 format)
     * @param endDate optional end date-time filter (ISO 8601 format)
     * @param page the page number (0-indexed, default: 0)
     * @param size the page size (default: 100, max: 100)
     * @return ResponseEntity containing filtered and paginated audit logs
     */
    @GetMapping("/search")
    public ResponseEntity<Page<AuditLogResponse>> searchLogs(
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "100") @Min(1) @Max(100) int size) {
        securityContext.requirePm();
        Pageable pageable = PageRequest.of(page, size);
        AuditLog.ActionType actionTypeEnum = actionType != null ? AuditLog.ActionType.valueOf(actionType) : null;
        Page<AuditLog> logs = auditLogService.searchLogs(actionTypeEnum, entityType, startDate, endDate, pageable);
        Page<AuditLogResponse> response = logs.map(AuditLogResponse::from);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve statistics by action type.
     *
     * <p>Returns aggregated counts of audit log entries grouped by action type.
     * Useful for understanding the distribution of activities in the system.</p>
     *
     * <p>PM access only.</p>
     *
     * @return ResponseEntity containing map of action types to counts
     */
    @GetMapping("/stats/action-types")
    public ResponseEntity<Map<String, Long>> getStatsByActionType() {
        securityContext.requirePm();
        Map<String, Long> stats = auditLogService.getStatsByActionType();
        return ResponseEntity.ok(stats);
    }

    /**
     * Retrieve statistics by entity type.
     *
     * <p>Returns aggregated counts of audit log entries grouped by entity type.
     * Useful for identifying which entities are most frequently modified.</p>
     *
     * <p>PM access only.</p>
     *
     * @return ResponseEntity containing map of entity types to counts
     */
    @GetMapping("/stats/entity-types")
    public ResponseEntity<Map<String, Long>> getStatsByEntityType() {
        securityContext.requirePm();
        Map<String, Long> stats = auditLogService.getStatsByEntityType();
        return ResponseEntity.ok(stats);
    }

    /**
     * Export audit logs to CSV format.
     *
     * <p>Exports filtered audit logs to a CSV file for external analysis, archival, or compliance
     * reporting. Supports the same filters as the search endpoint. The CSV includes UTF-8 BOM
     * for Excel compatibility.</p>
     *
     * <p>PM access only.</p>
     *
     * @param actionType optional action type filter (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
     * @param entityType optional entity type filter
     * @param startDate optional start date-time filter (ISO 8601 format)
     * @param endDate optional end date-time filter (ISO 8601 format)
     * @return ResponseEntity containing CSV file as byte array
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportToCsv(
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        securityContext.requirePm();
        try {
            // Get all matching logs (no pagination for export)
            AuditLog.ActionType actionTypeEnum = actionType != null ? AuditLog.ActionType.valueOf(actionType) : null;
            Page<AuditLog> logs = auditLogService.searchLogs(
                    actionTypeEnum,
                    entityType,
                    startDate,
                    endDate,
                    PageRequest.of(0, Integer.MAX_VALUE)
            );

            // Create CSV
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            PrintWriter writer = new PrintWriter(outputStream, true, StandardCharsets.UTF_8);

            // BOM for Excel UTF-8 support
            outputStream.write(0xEF);
            outputStream.write(0xBB);
            outputStream.write(0xBF);

            // CSV Header
            writer.println("작업시간,작업타입,엔티티타입,엔티티ID,수행자,설명");

            // CSV Data
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            for (AuditLog log : logs.getContent()) {
                writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"%n",
                        log.getActionTime().format(formatter),
                        log.getActionType().name(),
                        log.getEntityType(),
                        log.getEntityId() != null ? log.getEntityId() : "",
                        log.getPerformedBy() != null ? log.getPerformedBy().getName() : "SYSTEM",
                        escapeCsv(log.getDescription())
                );
            }

            writer.flush();
            byte[] data = outputStream.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
            headers.setContentDispositionFormData("attachment", "audit-log-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".csv");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(data);

        } catch (Exception e) {
            throw new RuntimeException("Failed to export audit logs", e);
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }
}
