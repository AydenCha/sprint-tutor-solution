package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.ContentModule;
import kr.codeit.onboarding.domain.entity.StepDefinition;
import kr.codeit.onboarding.domain.entity.User;
import kr.codeit.onboarding.domain.enums.ContentType;
import kr.codeit.onboarding.domain.enums.QuestionType;
import kr.codeit.onboarding.domain.enums.UserRole;
import kr.codeit.onboarding.dto.*;
import kr.codeit.onboarding.exception.ResourceNotFoundException;
import kr.codeit.onboarding.repository.ContentModuleRepository;
import kr.codeit.onboarding.repository.StepDefinitionRepository;
import kr.codeit.onboarding.repository.UserRepository;
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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ModuleServiceTest {

    @Autowired
    private ModuleService moduleService;

    @Autowired
    private ContentModuleRepository moduleRepository;

    @Autowired
    private StepDefinitionRepository stepDefinitionRepository;

    @Autowired
    private UserRepository userRepository;

    private User pmUser;
    private StepDefinition stepDef;

    @BeforeEach
    void setUp() {
        // Create PM user
        pmUser = User.builder()
                .email("pm@module-test.com")
                .name("PM User")
                .role(UserRole.PM)
                .build();
        pmUser = userRepository.save(pmUser);

        // Create Step Definition
        stepDef = StepDefinition.builder()
                .title("Test Step")
                .description("Test step definition")
                .displayOrder(1)
                .createdBy(pmUser)
                .build();
        stepDef = stepDefinitionRepository.save(stepDef);

        // Set up PM authentication
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                pmUser,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_PM"))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    @DisplayName("모듈 생성 성공 - Document & Quiz 타입")
    void createModule_DocumentQuiz_Success() {
        // Given
        ModuleRequest request = new ModuleRequest();
        request.setName("Test Module");
        request.setDescription("Test Description");
        request.setContentType(ContentType.A);
        request.setStepDefinitionId(stepDef.getId());
        request.setDocumentContent("# Test Document");

        List<QuizQuestionRequest> quizQuestions = new ArrayList<>();
        QuizQuestionRequest quiz = new QuizQuestionRequest();
        quiz.setQuestion("Test Question?");
        quiz.setQuestionType(QuestionType.OBJECTIVE);
        quiz.setOptions(List.of("Option 1", "Option 2"));
        quiz.setCorrectAnswerIndex(0);
        quizQuestions.add(quiz);
        request.setQuizQuestions(quizQuestions);

        // When
        ModuleResponse response = moduleService.createModule(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Test Module");
        assertThat(response.getContentType()).isEqualTo(ContentType.A);
        assertThat(response.getQuizQuestions()).hasSize(1);
        assertThat(response.getQuizQuestions().get(0).getQuestion()).isEqualTo("Test Question?");

        // Verify in database
        ContentModule saved = moduleRepository.findById(response.getId()).orElseThrow();
        assertThat(saved.getName()).isEqualTo("Test Module");
        assertThat(saved.getQuizQuestions()).hasSize(1);
    }

    @Test
    @DisplayName("모듈 생성 성공 - Video & Quiz 타입")
    void createModule_VideoQuiz_Success() {
        // Given
        ModuleRequest request = new ModuleRequest();
        request.setName("Video Module");
        request.setDescription("Video module with quiz");
        request.setContentType(ContentType.B);
        request.setStepDefinitionId(stepDef.getId());
        request.setVideoUrl("https://example.com/video.mp4");
        request.setVideoDuration(300);

        // When
        ModuleResponse response = moduleService.createModule(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getVideoUrl()).isEqualTo("https://example.com/video.mp4");
        assertThat(response.getVideoDuration()).isEqualTo(300);
    }

    @Test
    @DisplayName("모듈 생성 성공 - Checklist 타입")
    void createModule_Checklist_Success() {
        // Given
        ModuleRequest request = new ModuleRequest();
        request.setName("Checklist Module");
        request.setDescription("Module with checklist");
        request.setContentType(ContentType.D);
        request.setStepDefinitionId(stepDef.getId());

        List<ChecklistItemRequest> items = new ArrayList<>();
        ChecklistItemRequest item1 = new ChecklistItemRequest();
        item1.setLabel("Item 1");
        items.add(item1);
        request.setChecklistItems(items);

        // When
        ModuleResponse response = moduleService.createModule(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getChecklistItems()).hasSize(1);
        assertThat(response.getChecklistItems().get(0).getLabel()).isEqualTo("Item 1");
    }

    @Test
    @DisplayName("모듈 조회 성공")
    void getModule_Success() {
        // Given
        ContentModule module = ContentModule.builder()
                .name("Test Module")
                .description("Description")
                .contentType(ContentType.A)
                .createdBy(pmUser)
                .stepDefinition(stepDef)
                .build();
        module = moduleRepository.save(module);

        // When
        ModuleResponse response = moduleService.getModule(module.getId());

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(module.getId());
        assertThat(response.getName()).isEqualTo("Test Module");
    }

    @Test
    @DisplayName("모듈 조회 실패 - 존재하지 않는 ID")
    void getModule_NotFound() {
        // When & Then
        assertThatThrownBy(() -> moduleService.getModule(99999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Module not found");
    }

    @Test
    @DisplayName("모든 모듈 조회 성공")
    void getAllModules_Success() {
        // Given
        ContentModule module1 = ContentModule.builder()
                .name("Module 1")
                .description("Description 1")
                .contentType(ContentType.A)
                .createdBy(pmUser)
                .stepDefinition(stepDef)
                .build();
        moduleRepository.save(module1);

        ContentModule module2 = ContentModule.builder()
                .name("Module 2")
                .description("Description 2")
                .contentType(ContentType.B)
                .createdBy(pmUser)
                .stepDefinition(stepDef)
                .build();
        moduleRepository.save(module2);

        // When
        List<ModuleResponse> modules = moduleService.getAllModules();

        // Then
        assertThat(modules).hasSizeGreaterThanOrEqualTo(2);
        assertThat(modules).extracting("name").contains("Module 1", "Module 2");
    }

    @Test
    @DisplayName("모듈 업데이트 성공")
    void updateModule_Success() {
        // Given
        ContentModule module = ContentModule.builder()
                .name("Original Name")
                .description("Original Description")
                .contentType(ContentType.A)
                .createdBy(pmUser)
                .stepDefinition(stepDef)
                .build();
        module = moduleRepository.save(module);

        ModuleRequest request = new ModuleRequest();
        request.setName("Updated Name");
        request.setDescription("Updated Description");
        request.setContentType(ContentType.A);
        request.setStepDefinitionId(stepDef.getId());

        // When
        ModuleResponse response = moduleService.updateModule(module.getId(), request);

        // Then
        assertThat(response.getName()).isEqualTo("Updated Name");
        assertThat(response.getDescription()).isEqualTo("Updated Description");

        // Verify in database
        ContentModule updated = moduleRepository.findById(module.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Updated Name");
    }

    @Test
    @DisplayName("모듈 업데이트 실패 - 존재하지 않는 모듈")
    void updateModule_NotFound() {
        // Given
        ModuleRequest request = new ModuleRequest();
        request.setName("Updated Name");
        request.setDescription("Updated Description");
        request.setContentType(ContentType.A);
        request.setStepDefinitionId(stepDef.getId());

        // When & Then
        assertThatThrownBy(() -> moduleService.updateModule(99999L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Step Definition으로 모듈 조회")
    void getModulesByStepDefinition_Success() {
        // Given
        ContentModule module = ContentModule.builder()
                .name("Step Module")
                .description("Module with step def")
                .contentType(ContentType.A)
                .createdBy(pmUser)
                .stepDefinition(stepDef)
                .build();
        moduleRepository.save(module);

        // When
        List<ModuleResponse> modules = moduleService.getModulesByStepDefinition(stepDef.getId());

        // Then
        assertThat(modules).isNotEmpty();
        assertThat(modules).extracting("name").contains("Step Module");
    }
}
