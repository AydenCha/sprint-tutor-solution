package kr.codeit.onboarding.repository;

import kr.codeit.onboarding.domain.entity.ContentModule;
import kr.codeit.onboarding.domain.enums.ContentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContentModuleRepository extends JpaRepository<ContentModule, Long> {

    List<ContentModule> findByCreatedBy_Id(Long pmId);

    List<ContentModule> findByContentType(ContentType contentType);

    // MultipleBagFetchException 방지를 위해 별도 쿼리로 분리
    @Query("SELECT m FROM ContentModule m LEFT JOIN FETCH m.quizQuestions WHERE m.id = :id")
    Optional<ContentModule> findByIdWithQuizQuestions(@Param("id") Long id);
    
    @Query("SELECT m FROM ContentModule m LEFT JOIN FETCH m.checklistItems WHERE m.id = :id")
    Optional<ContentModule> findByIdWithChecklistItems(@Param("id") Long id);
    
    // 두 관계를 모두 로드하는 헬퍼 메서드 (Service에서 사용)
    default Optional<ContentModule> findByIdWithDetails(Long id) {
        Optional<ContentModule> moduleWithQuiz = findByIdWithQuizQuestions(id);
        if (moduleWithQuiz.isPresent()) {
            ContentModule module = moduleWithQuiz.get();
            // Checklist items를 별도로 로드
            findByIdWithChecklistItems(id).ifPresent(m -> {
                module.setChecklistItems(m.getChecklistItems());
            });
            return Optional.of(module);
        }
        return Optional.empty();
    }
    
    // DISTINCT 제거: JSON 컬럼이 포함된 JOIN에서 PostgreSQL 에러 방지
    @Query("SELECT m FROM ContentModule m LEFT JOIN FETCH m.quizQuestions WHERE m.id IN :ids")
    List<ContentModule> findByIdsWithQuizQuestions(@Param("ids") List<Long> ids);

    @Query("SELECT m FROM ContentModule m LEFT JOIN FETCH m.checklistItems WHERE m.id IN :ids")
    List<ContentModule> findByIdsWithChecklistItems(@Param("ids") List<Long> ids);
    
    // 두 관계를 모두 로드하는 헬퍼 메서드 (Service에서 사용)
    default List<ContentModule> findByIdsWithDetails(List<Long> ids) {
        List<ContentModule> modulesWithQuiz = findByIdsWithQuizQuestions(ids);
        if (modulesWithQuiz.isEmpty()) {
            return modulesWithQuiz;
        }

        // DISTINCT 제거로 인한 중복 제거
        java.util.Map<Long, ContentModule> uniqueModules = new java.util.LinkedHashMap<>();
        for (ContentModule module : modulesWithQuiz) {
            uniqueModules.putIfAbsent(module.getId(), module);
        }

        List<ContentModule> modulesWithChecklist = findByIdsWithChecklistItems(ids);
        java.util.Map<Long, ContentModule> checklistMap = new java.util.HashMap<>();
        for (ContentModule module : modulesWithChecklist) {
            checklistMap.putIfAbsent(module.getId(), module);
        }

        // 각 모듈에 checklist items 설정
        uniqueModules.values().forEach(module -> {
            ContentModule withChecklist = checklistMap.get(module.getId());
            if (withChecklist != null) {
                module.setChecklistItems(withChecklist.getChecklistItems());
            }
        });

        return new java.util.ArrayList<>(uniqueModules.values());
    }

    @Query("SELECT m FROM ContentModule m WHERE m.createdBy.id = :pmId ORDER BY m.createdAt DESC")
    List<ContentModule> findAllByPmId(@Param("pmId") Long pmId);

    // Step Definition별 모듈 조회
    @Query("SELECT m FROM ContentModule m WHERE m.stepDefinition.id = :stepDefinitionId ORDER BY m.createdAt DESC")
    List<ContentModule> findByStepDefinitionId(@Param("stepDefinitionId") Long stepDefinitionId);
}

