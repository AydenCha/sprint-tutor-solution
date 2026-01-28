package kr.codeit.onboarding.repository;

import kr.codeit.onboarding.domain.entity.InstructorChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstructorChecklistItemRepository extends JpaRepository<InstructorChecklistItem, Long> {

    List<InstructorChecklistItem> findByInstructorId(Long instructorId);

    List<InstructorChecklistItem> findByChecklistItemId(Long checklistItemId);

    Optional<InstructorChecklistItem> findByInstructorIdAndChecklistItemId(Long instructorId, Long checklistItemId);
}
