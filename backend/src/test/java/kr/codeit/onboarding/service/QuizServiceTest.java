package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.*;
import kr.codeit.onboarding.domain.enums.ContentType;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import kr.codeit.onboarding.domain.entity.Track;
import kr.codeit.onboarding.repository.TrackRepository;
import kr.codeit.onboarding.domain.enums.UserRole;
import kr.codeit.onboarding.dto.QuizSubmissionRequest;
import kr.codeit.onboarding.dto.QuizSubmissionResponse;
import kr.codeit.onboarding.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class QuizServiceTest {

    @Autowired
    private QuizService quizService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InstructorRepository instructorRepository;

    @Autowired
    private OnboardingStepRepository stepRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private QuizQuestionRepository questionRepository;

    @Autowired
    private QuizAnswerRepository answerRepository;

    @Autowired
    private TrackRepository trackRepository;

    private Instructor instructor;
    private Task quizTask;
    private QuizQuestion question1;
    private QuizQuestion question2;
    private QuizQuestion question3;

    @BeforeEach
    void setUp() {
        // Create instructor
        User user = User.builder()
                .email("student@test.com")
                .name("Test Student")
                .role(UserRole.INSTRUCTOR)
                .build();
        userRepository.save(user);

        // Find or create Track entity
        Track track = trackRepository.findByName("FRONTEND")
                .orElseGet(() -> {
                    Track newTrack = Track.builder()
                            .name("FRONTEND")
                            .koreanName("프론트엔드")
                            .code("FE")
                            .enabled(true)
                            .build();
                    return trackRepository.save(newTrack);
                });

        instructor = Instructor.builder()
                .user(user)
                .phone("010-1234-5678")
                .track(track)
                .cohort("4기")
                .accessCode("FE4-TEST1")
                .startDate(LocalDate.now())
                .build();
        instructorRepository.save(instructor);

        // Create onboarding step
        OnboardingStep step = OnboardingStep.builder()
                .instructor(instructor)
                .stepNumber(1)
                .title("Test Step")
                .emoji("📚")
                .dDay(-14)
                .description("Test description")
                .build();
        stepRepository.save(step);

        // Create quiz task
        quizTask = Task.builder()
                .step(step)
                .title("Quiz Task")
                .description("Test quiz")
                .contentType(ContentType.A)
                .status(TaskStatus.PENDING)
                .documentUrl("https://example.com/doc.pdf")
                .build();
        taskRepository.save(quizTask);

        // Create quiz questions
        question1 = QuizQuestion.builder()
                .task(quizTask)
                .question("What is 1 + 1?")
                .options(Arrays.asList("1", "2", "3", "4"))
                .correctAnswerIndex(1) // "2"
                .questionType(kr.codeit.onboarding.domain.enums.QuestionType.OBJECTIVE)
                .build();
        questionRepository.save(question1);

        question2 = QuizQuestion.builder()
                .task(quizTask)
                .question("What is the capital of Korea?")
                .options(Arrays.asList("Tokyo", "Seoul", "Beijing", "Bangkok"))
                .correctAnswerIndex(1) // "Seoul"
                .questionType(kr.codeit.onboarding.domain.enums.QuestionType.OBJECTIVE)
                .build();
        questionRepository.save(question2);

        question3 = QuizQuestion.builder()
                .task(quizTask)
                .question("What is 2 * 2?")
                .options(Arrays.asList("2", "3", "4", "5"))
                .correctAnswerIndex(2) // "4"
                .questionType(kr.codeit.onboarding.domain.enums.QuestionType.OBJECTIVE)
                .build();
        questionRepository.save(question3);

        step.addTask(quizTask);
        step.setTotalTasks(1);

        // Set up Spring Security context with authenticated user
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_INSTRUCTOR"))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    @DisplayName("퀴즈 제출 성공 - 모든 답이 정답일 때 태스크가 완료된다")
    void submitQuiz_AllCorrect() {
        // Given
        Map<Long, Integer> objectiveAnswers = new HashMap<>();
        objectiveAnswers.put(question1.getId(), 1); // Correct
        objectiveAnswers.put(question2.getId(), 1); // Correct
        objectiveAnswers.put(question3.getId(), 2); // Correct

        QuizSubmissionRequest request = new QuizSubmissionRequest();
        request.setObjectiveAnswers(objectiveAnswers);
        request.setSubjectiveAnswers(new HashMap<>());

        // When
        QuizSubmissionResponse response = quizService.submitQuiz(
                quizTask.getId(),
                request
        );

        // Then
        assertThat(response.getAllCorrect()).isTrue();
        assertThat(response.getCorrectCount()).isEqualTo(3);
        assertThat(response.getTotalQuestions()).isEqualTo(3);
        assertThat(response.getResults()).hasSize(3);
        assertThat(response.getResults().values()).containsOnly(true);

        // Task should be marked as completed
        Task updatedTask = taskRepository.findById(quizTask.getId()).get();
        assertThat(updatedTask.getStatus()).isEqualTo(TaskStatus.COMPLETED);
    }

    @Test
    @DisplayName("퀴즈 제출 - 일부 오답이 있으면 태스크가 완료되지 않는다")
    void submitQuiz_SomeWrong() {
        // Given
        Map<Long, Integer> objectiveAnswers = new HashMap<>();
        objectiveAnswers.put(question1.getId(), 1); // Correct
        objectiveAnswers.put(question2.getId(), 0); // Wrong (Tokyo instead of Seoul)
        objectiveAnswers.put(question3.getId(), 2); // Correct

        QuizSubmissionRequest request = new QuizSubmissionRequest();
        request.setObjectiveAnswers(objectiveAnswers);
        request.setSubjectiveAnswers(new HashMap<>());

        // When
        QuizSubmissionResponse response = quizService.submitQuiz(
                quizTask.getId(),
                request
        );

        // Then
        assertThat(response.getAllCorrect()).isFalse();
        assertThat(response.getCorrectCount()).isEqualTo(2);
        assertThat(response.getTotalQuestions()).isEqualTo(3);

        assertThat(response.getResults().get(question1.getId())).isTrue();
        assertThat(response.getResults().get(question2.getId())).isFalse();
        assertThat(response.getResults().get(question3.getId())).isTrue();

        // Task should NOT be completed
        Task updatedTask = taskRepository.findById(quizTask.getId()).get();
        assertThat(updatedTask.getStatus()).isEqualTo(TaskStatus.PENDING);
    }

    @Test
    @DisplayName("퀴즈 재제출 - 이전 답안을 덮어쓴다")
    void submitQuiz_Resubmit() {
        // Given - First submission (all wrong)
        Map<Long, Integer> firstObjectiveAnswers = new HashMap<>();
        firstObjectiveAnswers.put(question1.getId(), 0);
        firstObjectiveAnswers.put(question2.getId(), 0);
        firstObjectiveAnswers.put(question3.getId(), 0);

        QuizSubmissionRequest firstRequest = new QuizSubmissionRequest();
        firstRequest.setObjectiveAnswers(firstObjectiveAnswers);
        firstRequest.setSubjectiveAnswers(new HashMap<>());

        quizService.submitQuiz(quizTask.getId(), firstRequest);

        // When - Second submission (all correct)
        Map<Long, Integer> secondObjectiveAnswers = new HashMap<>();
        secondObjectiveAnswers.put(question1.getId(), 1);
        secondObjectiveAnswers.put(question2.getId(), 1);
        secondObjectiveAnswers.put(question3.getId(), 2);

        QuizSubmissionRequest secondRequest = new QuizSubmissionRequest();
        secondRequest.setObjectiveAnswers(secondObjectiveAnswers);
        secondRequest.setSubjectiveAnswers(new HashMap<>());

        QuizSubmissionResponse response = quizService.submitQuiz(
                quizTask.getId(),
                secondRequest
        );

        // Then
        assertThat(response.getAllCorrect()).isTrue();

        // Check that answers were updated, not duplicated
        long answerCount = answerRepository.findByInstructorId(instructor.getId()).size();
        assertThat(answerCount).isEqualTo(3); // Should have exactly 3 answers, not 6
    }

    @Test
    @DisplayName("퀴즈 답안 저장 - 정답 여부가 올바르게 저장된다")
    void submitQuiz_SavesCorrectness() {
        // Given
        Map<Long, Integer> objectiveAnswers = new HashMap<>();
        objectiveAnswers.put(question1.getId(), 1); // Correct
        objectiveAnswers.put(question2.getId(), 0); // Wrong

        QuizSubmissionRequest request = new QuizSubmissionRequest();
        request.setObjectiveAnswers(objectiveAnswers);
        request.setSubjectiveAnswers(new HashMap<>());

        // When
        quizService.submitQuiz(quizTask.getId(), request);

        // Then
        QuizAnswer answer1 = answerRepository
                .findByInstructorIdAndQuestionId(instructor.getId(), question1.getId())
                .get();
        QuizAnswer answer2 = answerRepository
                .findByInstructorIdAndQuestionId(instructor.getId(), question2.getId())
                .get();

        assertThat(answer1.getIsCorrect()).isTrue();
        assertThat(answer1.getSelectedAnswerIndex()).isEqualTo(1);

        assertThat(answer2.getIsCorrect()).isFalse();
        assertThat(answer2.getSelectedAnswerIndex()).isEqualTo(0);
    }
}
