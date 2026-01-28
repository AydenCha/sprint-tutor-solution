package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.StepDefinition;
import kr.codeit.onboarding.domain.entity.User;
import kr.codeit.onboarding.domain.enums.UserRole;
import kr.codeit.onboarding.dto.StepDefinitionRequest;
import kr.codeit.onboarding.dto.StepDefinitionResponse;
import kr.codeit.onboarding.exception.ResourceNotFoundException;
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

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StepDefinitionServiceTest {

    @Autowired
    private StepDefinitionService stepDefinitionService;

    @Autowired
    private StepDefinitionRepository stepDefinitionRepository;

    @Autowired
    private UserRepository userRepository;

    private User pmUser;
    private StepDefinition stepDef1;

    @BeforeEach
    void setUp() {
        // Create PM user
        pmUser = User.builder()
                .email("pm@stepdef.com")
                .name("PM User")
                .role(UserRole.PM)
                .build();
        pmUser = userRepository.save(pmUser);

        // Create step definition
        stepDef1 = StepDefinition.builder()
                .title("Step 1")
                .description("First step")
                .displayOrder(1)
                .createdBy(pmUser)
                .build();
        stepDef1 = stepDefinitionRepository.save(stepDef1);

        // Set up PM authentication
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                pmUser,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_PM"))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    @DisplayName("모든 Step 정의 조회 성공")
    void getAllDefinitions_Success() {
        // When
        List<StepDefinitionResponse> definitions = stepDefinitionService.getAllDefinitions();

        // Then
        assertThat(definitions).isNotEmpty();
        assertThat(definitions).extracting("title").contains("Step 1");
    }

    @Test
    @DisplayName("Step 정의 ID로 조회 성공")
    void getDefinition_Success() {
        // When
        StepDefinitionResponse response = stepDefinitionService.getDefinition(stepDef1.getId());

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Step 1");
        assertThat(response.getDescription()).isEqualTo("First step");
    }

    @Test
    @DisplayName("Step 정의 조회 실패 - 존재하지 않는 ID")
    void getDefinition_NotFound() {
        // When & Then
        assertThatThrownBy(() -> stepDefinitionService.getDefinition(99999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Step definition not found");
    }

    @Test
    @DisplayName("Step 정의 생성 성공")
    void createDefinition_Success() {
        // Given
        StepDefinitionRequest request = new StepDefinitionRequest();
        request.setTitle("New Step");
        request.setDescription("New step description");

        // When
        StepDefinitionResponse response = stepDefinitionService.createDefinition(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("New Step");
        assertThat(response.getDescription()).isEqualTo("New step description");

        // Verify in database
        StepDefinition saved = stepDefinitionRepository.findById(response.getId()).orElseThrow();
        assertThat(saved.getTitle()).isEqualTo("New Step");
        assertThat(saved.getDisplayOrder()).isEqualTo(2); // Should be next after existing one
    }

    @Test
    @org.junit.jupiter.api.Disabled("Integration test - AuditLog flush issue")
    @DisplayName("Step 정의 생성 - displayOrder 자동 증가")
    void createDefinition_AutoIncrementDisplayOrder() {
        // Given
        StepDefinitionRequest request1 = new StepDefinitionRequest();
        request1.setTitle("Step 2");
        request1.setDescription("Second step");

        StepDefinitionRequest request2 = new StepDefinitionRequest();
        request2.setTitle("Step 3");
        request2.setDescription("Third step");

        // When
        StepDefinitionResponse response1 = stepDefinitionService.createDefinition(request1);
        StepDefinitionResponse response2 = stepDefinitionService.createDefinition(request2);

        // Then
        assertThat(response1.getDisplayOrder()).isEqualTo(2);
        assertThat(response2.getDisplayOrder()).isEqualTo(3);
    }
}
