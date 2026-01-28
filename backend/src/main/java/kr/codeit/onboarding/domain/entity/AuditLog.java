package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * AuditLog entity for tracking all PM actions in the onboarding system.
 *
 * <p>Provides comprehensive audit trail functionality by recording:
 * <ul>
 *   <li>What action was performed (CREATE, UPDATE, DELETE, etc.)</li>
 *   <li>Who performed the action (PM user)</li>
 *   <li>When the action was performed</li>
 *   <li>What entity was affected</li>
 *   <li>Old and new values (for updates)</li>
 * </ul>
 *
 * <p><strong>Important:</strong> Only logs data-changing operations, not read operations.
 * User-initiated actions are logged, automatic system operations (polling, refresh) are not.
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_log_performed_by", columnList = "performed_by_pm_id"),
    @Index(name = "idx_audit_log_entity", columnList = "entity_type, entity_id"),
    @Index(name = "idx_audit_log_action", columnList = "action_type"),
    @Index(name = "idx_audit_log_created_at", columnList = "created_at"),
    @Index(name = "idx_audit_log_action_time", columnList = "action_time")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Type of action performed on the entity.
     */
    @NotNull(message = "Action type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 20)
    private ActionType actionType;

    /**
     * Type of entity that was affected.
     * Examples: "StepDefinition", "ContentModule", "StepTemplate"
     */
    @NotBlank(message = "Entity type is required")
    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    /**
     * ID of the entity that was affected.
     * May be null for bulk operations or failed creations.
     */
    @Column(name = "entity_id")
    private Long entityId;

    /**
     * PM user who performed the action.
     * Null for system-initiated actions or sample data operations.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_pm_id")
    private User performedBy;

    /**
     * Previous state of the entity before the action (JSON format).
     * Null for CREATE operations.
     * Note: columnDefinition is omitted to allow H2 (TEXT) and PostgreSQL (JSONB) compatibility.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "old_value")
    private String oldValue;

    /**
     * New state of the entity after the action (JSON format).
     * Null for DELETE operations.
     * Note: columnDefinition is omitted to allow H2 (TEXT) and PostgreSQL (JSONB) compatibility.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_value")
    private String newValue;

    /**
     * Human-readable description of the action.
     * Example: "Created new content module 'Introduction to Frontend'"
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Additional metadata in JSON format.
     * Can store context-specific information like IP address, session ID, etc.
     * Note: columnDefinition is omitted to allow H2 (TEXT) and PostgreSQL (JSONB) compatibility.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata")
    private String metadata;

    /**
     * Timestamp when the action was performed.
     * Stored separately from BaseEntity's createdAt for clarity.
     */
    @NotNull(message = "Action time is required")
    @Column(name = "action_time", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime actionTime = LocalDateTime.now();

    /**
     * Action types that can be audited.
     *
     * <p><strong>Important:</strong> Only data-changing operations are logged.
     * Read operations (GET) are not tracked to avoid log bloat.
     */
    public enum ActionType {
        /**
         * Entity creation.
         */
        CREATE,

        /**
         * Entity modification.
         */
        UPDATE,

        /**
         * Entity deletion (soft or hard).
         */
        DELETE,

        /**
         * Assignment operation (e.g., assigning module to step).
         */
        ASSIGN,

        /**
         * Data export operation.
         */
        EXPORT,

        /**
         * Data import operation.
         */
        IMPORT
    }

    /**
     * Checks if this log entry represents a creation action.
     *
     * @return true if action type is CREATE
     */
    public boolean isCreateAction() {
        return actionType == ActionType.CREATE;
    }

    /**
     * Checks if this log entry represents an update action.
     *
     * @return true if action type is UPDATE
     */
    public boolean isUpdateAction() {
        return actionType == ActionType.UPDATE;
    }

    /**
     * Checks if this log entry represents a deletion action.
     *
     * @return true if action type is DELETE
     */
    public boolean isDeleteAction() {
        return actionType == ActionType.DELETE;
    }

    /**
     * Checks if this audit log has an associated user.
     *
     * @return true if performedBy is not null
     */
    public boolean hasPerformer() {
        return performedBy != null;
    }

    /**
     * Checks if this audit log has old value data.
     *
     * @return true if oldValue is not null
     */
    public boolean hasOldValue() {
        return oldValue != null && !oldValue.isBlank();
    }

    /**
     * Checks if this audit log has new value data.
     *
     * @return true if newValue is not null
     */
    public boolean hasNewValue() {
        return newValue != null && !newValue.isBlank();
    }

    /**
     * Pre-persist hook to ensure action time is set.
     */
    @PrePersist
    protected void onCreate() {
        if (actionTime == null) {
            actionTime = LocalDateTime.now();
        }
    }
}
