package kr.codeit.onboarding.repository;

import kr.codeit.onboarding.domain.entity.OnboardingStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OnboardingStepRepository extends JpaRepository<OnboardingStep, Long> {

    List<OnboardingStep> findByInstructorIdOrderByStepNumber(Long instructorId);

    Optional<OnboardingStep> findByInstructorIdAndStepNumber(Long instructorId, Integer stepNumber);

    @Query("SELECT s FROM OnboardingStep s LEFT JOIN FETCH s.tasks WHERE s.instructor.id = :instructorId ORDER BY s.stepNumber")
    List<OnboardingStep> findByInstructorIdWithTasks(@Param("instructorId") Long instructorId);

    /**
     * 여러 Instructor의 첫 번째 Step 조회 (D-day 정렬용)
     */
    List<OnboardingStep> findByInstructorIdInAndStepNumber(List<Long> instructorIds, Integer stepNumber);
}
