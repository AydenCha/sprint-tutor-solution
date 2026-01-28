package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Base entity class for all domain entities in the onboarding system.
 * Provides common auditing fields and optimistic locking support.
 *
 * <p>This abstract class automatically manages:
 * <ul>
 *   <li>Creation timestamp (immutable after first save)</li>
 *   <li>Last modification timestamp (updated on each save)</li>
 *   <li>Version field for optimistic locking</li>
 * </ul>
 *
 * @author Sprint Tutor Team
 * @see org.springframework.data.jpa.domain.support.AuditingEntityListener
 */
@Getter
@Setter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    /**
     * Timestamp when the entity was first created.
     * This field is automatically populated by Spring Data JPA auditing
     * and cannot be modified after initial creation.
     */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the entity was last modified.
     * This field is automatically updated by Spring Data JPA auditing
     * whenever the entity is saved.
     */
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Optimistic locking version field.
     *
     * <p>Prevents lost updates when multiple users edit the same entity concurrently.
     * The version is automatically incremented by JPA on each update operation.
     * If a concurrent modification is detected, an OptimisticLockException is thrown.
     *
     * @see jakarta.persistence.OptimisticLockException
     */
    @Version
    @Column(name = "version")
    private Long version;

    /**
     * Checks if this entity has been persisted to the database.
     *
     * @return true if the entity is new (not yet persisted), false otherwise
     */
    public boolean isNew() {
        return this.createdAt == null;
    }
}
