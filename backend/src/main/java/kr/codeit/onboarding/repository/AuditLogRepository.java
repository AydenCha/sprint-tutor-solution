package kr.codeit.onboarding.repository;

import kr.codeit.onboarding.domain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 감사 로그 리포지토리
 */
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * 특정 PM 사용자의 작업 로그 조회
     */
    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.performedBy WHERE a.performedBy.id = :pmId ORDER BY a.actionTime DESC")
    Page<AuditLog> findByPerformedBy_IdOrderByActionTimeDesc(@Param("pmId") Long pmId, Pageable pageable);

    /**
     * 특정 엔티티 타입의 로그 조회
     */
    Page<AuditLog> findByEntityTypeOrderByActionTimeDesc(String entityType, Pageable pageable);

    /**
     * 특정 엔티티의 변경 이력 조회
     */
    List<AuditLog> findByEntityTypeAndEntityIdOrderByActionTimeDesc(String entityType, Long entityId);

    /**
     * 특정 기간의 로그 조회
     */
    @Query("SELECT a FROM AuditLog a WHERE a.actionTime BETWEEN :startDate AND :endDate ORDER BY a.actionTime DESC")
    Page<AuditLog> findByActionTimeBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * 특정 PM 사용자의 특정 기간 로그 조회
     */
    @Query("SELECT a FROM AuditLog a WHERE a.performedBy.id = :pmId AND a.actionTime BETWEEN :startDate AND :endDate ORDER BY a.actionTime DESC")
    Page<AuditLog> findByPerformedByAndActionTimeBetween(
            @Param("pmId") Long pmId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * 최근 로그 조회 (대시보드용)
     */
    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.performedBy ORDER BY a.actionTime DESC")
    Page<AuditLog> findAllByOrderByActionTimeDesc(Pageable pageable);

    /**
     * 필터링 (단순화: NULL 체크 제거, Service에서 기본값 제공)
     */
    @Query("SELECT DISTINCT a FROM AuditLog a LEFT JOIN FETCH a.performedBy WHERE " +
            "(:actionType IS NULL OR a.actionType = :actionType) AND " +
            "(:entityType IS NULL OR a.entityType = :entityType) AND " +
            "(a.actionTime >= :startDate) AND " +
            "(a.actionTime <= :endDate) " +
            "ORDER BY a.actionTime DESC")
    Page<AuditLog> searchLogs(
            @Param("actionType") AuditLog.ActionType actionType,
            @Param("entityType") String entityType,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * 작업 타입별 카운트
     */
    @Query("SELECT a.actionType, COUNT(a) FROM AuditLog a GROUP BY a.actionType")
    List<Object[]> countByActionType();

    /**
     * 엔티티 타입별 카운트
     */
    @Query("SELECT a.entityType, COUNT(a) FROM AuditLog a GROUP BY a.entityType ORDER BY COUNT(a) DESC")
    List<Object[]> countByEntityType();
}

