package kr.codeit.onboarding.repository;

import kr.codeit.onboarding.domain.entity.Instructor;
import kr.codeit.onboarding.domain.entity.Track;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstructorRepository extends JpaRepository<Instructor, Long> {

    Optional<Instructor> findByAccessCode(String accessCode);

    boolean existsByAccessCode(String accessCode);

    Optional<Instructor> findByUserId(Long userId);

    List<Instructor> findByTrack(Track track);

    List<Instructor> findByCohort(String cohort);

    boolean existsBySelectedStepTemplateId(Long selectedStepTemplateId);

    /**
     * 모든 Instructor를 User와 Track과 함께 조회 (D-day 정렬은 Service 레이어에서 처리)
     * 삭제되지 않은 User와 연관된 Instructor만 조회
     * 
     * Note: steps는 별도로 조회하므로 여기서는 fetch하지 않음
     */
    @Query("SELECT DISTINCT i FROM Instructor i " +
           "INNER JOIN FETCH i.user u " +
           "INNER JOIN FETCH i.track " +
           "WHERE u.deletedAt IS NULL")
    List<Instructor> findAllWithUserAndFirstStep();
    
    /**
     * 모든 Instructor를 User와 Track과 함께 페이징 조회
     * 삭제되지 않은 User와 연관된 Instructor만 조회
     * 기본 정렬(createdAt 등)을 사용할 때 사용
     */
    @Query("SELECT DISTINCT i FROM Instructor i " +
           "INNER JOIN FETCH i.user u " +
           "INNER JOIN FETCH i.track " +
           "WHERE u.deletedAt IS NULL")
    List<Instructor> findAllWithUserAndTrack();
}
