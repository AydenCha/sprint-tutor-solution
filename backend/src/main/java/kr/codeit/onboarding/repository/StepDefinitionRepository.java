package kr.codeit.onboarding.repository;

import kr.codeit.onboarding.domain.entity.StepDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StepDefinitionRepository extends JpaRepository<StepDefinition, Long> {
    
    List<StepDefinition> findByCreatedBy_Id(Long pmId);
    
    @Query("SELECT sd FROM StepDefinition sd ORDER BY sd.displayOrder ASC")
    List<StepDefinition> findAllOrderByDisplayOrder();
    
    @Query("SELECT MAX(sd.displayOrder) FROM StepDefinition sd")
    Optional<Integer> findMaxDisplayOrder();

    /**
     * Find StepDefinition by ID with content modules eagerly loaded.
     * This prevents N+1 query issues when accessing modules.
     *
     * @param id the step definition ID
     * @return optional containing the step definition with modules, or empty if not found
     */
    @Query("SELECT DISTINCT sd FROM StepDefinition sd LEFT JOIN FETCH sd.contentModules WHERE sd.id = :id")
    Optional<StepDefinition> findByIdWithModules(@Param("id") Long id);

    /**
     * Find all StepDefinitions with content modules eagerly loaded.
     * This prevents N+1 query issues when accessing modules for multiple steps.
     *
     * @return list of all step definitions with modules, ordered by display order
     */
    @Query("SELECT DISTINCT sd FROM StepDefinition sd LEFT JOIN FETCH sd.contentModules ORDER BY sd.displayOrder ASC")
    List<StepDefinition> findAllWithModules();
}

