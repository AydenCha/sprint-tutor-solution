package kr.codeit.onboarding.repository;

import kr.codeit.onboarding.domain.entity.QuizAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Long> {

    List<QuizAnswer> findByInstructorId(Long instructorId);

    List<QuizAnswer> findByQuestionId(Long questionId);

    Optional<QuizAnswer> findByInstructorIdAndQuestionId(Long instructorId, Long questionId);
}
