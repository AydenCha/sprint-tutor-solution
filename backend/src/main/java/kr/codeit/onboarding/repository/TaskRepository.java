package kr.codeit.onboarding.repository;

import kr.codeit.onboarding.domain.entity.Task;
import kr.codeit.onboarding.domain.enums.ContentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStepId(Long stepId);

    List<Task> findByContentType(ContentType contentType);

    @Query("SELECT t FROM Task t JOIN FETCH t.quizQuestions WHERE t.id = :taskId")
    Optional<Task> findByIdWithQuizQuestions(@Param("taskId") Long taskId);

    @Query("SELECT t FROM Task t JOIN FETCH t.checklistItems WHERE t.id = :taskId")
    Optional<Task> findByIdWithChecklistItems(@Param("taskId") Long taskId);

    @Query("SELECT t FROM Task t JOIN FETCH t.fileUploads WHERE t.id = :taskId")
    Optional<Task> findByIdWithFileUploads(@Param("taskId") Long taskId);
}
