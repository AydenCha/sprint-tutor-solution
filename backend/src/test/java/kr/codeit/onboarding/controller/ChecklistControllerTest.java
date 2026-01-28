package kr.codeit.onboarding.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.codeit.onboarding.domain.entity.*;
import kr.codeit.onboarding.domain.enums.ContentType;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import kr.codeit.onboarding.domain.enums.UserRole;
import kr.codeit.onboarding.dto.ChecklistItemLabelUpdateRequest;
import kr.codeit.onboarding.dto.ChecklistUpdateRequest;
import kr.codeit.onboarding.repository.*;
import kr.codeit.onboarding.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ChecklistControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ChecklistItemRepository checklistItemRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private OnboardingStepRepository stepRepository;

    @Autowired
    private InstructorRepository instructorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrackRepository trackRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private String instructorToken;
    private String pmToken;
    private ChecklistItem checklistItem;

    @BeforeEach
    void setUp() {
        // Create Track
        Track track = Track.builder()
                .name("FRONTEND")
                .koreanName("프론트엔드")
                .code("FE")
                .enabled(true)
                .build();
        track = trackRepository.save(track);

        // Create Instructor User
        User instructorUser = User.builder()
                .email("instructor@checklist-test.com")
                .name("Test Instructor")
                .role(UserRole.INSTRUCTOR)
                .build();
        instructorUser = userRepository.save(instructorUser);
        instructorToken = jwtUtil.generateToken(instructorUser);

        // Create PM User
        User pmUser = User.builder()
                .email("pm@checklist-test.com")
                .name("PM User")
                .role(UserRole.PM)
                .build();
        pmUser = userRepository.save(pmUser);
        pmToken = jwtUtil.generateToken(pmUser);

        // Create Instructor
        Instructor instructor = Instructor.builder()
                .user(instructorUser)
                .phone("010-1234-5678")
                .track(track)
                .cohort("4기")
                .accessCode("FE4-CHECK")
                .startDate(LocalDate.now())
                .build();
        instructor = instructorRepository.save(instructor);

        // Create Step
        OnboardingStep step = OnboardingStep.builder()
                .instructor(instructor)
                .stepNumber(1)
                .title("Test Step")
                .dDay(0)
                .status(TaskStatus.PENDING)
                .build();
        step = stepRepository.save(step);

        // Create Task
        Task task = Task.builder()
                .step(step)
                .title("Test Task")
                .description("Test task with checklist")
                .contentType(ContentType.D)
                .status(TaskStatus.PENDING)
                .isEnabled(true)
                .build();
        task = taskRepository.save(task);

        // Create Checklist Item
        checklistItem = ChecklistItem.builder()
                .task(task)
                .label("Test Checklist Item")
                .build();
        checklistItem = checklistItemRepository.save(checklistItem);
    }

    @Test
    @DisplayName("PUT /checklist/{id} - 체크리스트 아이템 체크 성공")
    void updateChecklistItem_Success() throws Exception {
        // Given
        ChecklistUpdateRequest request = new ChecklistUpdateRequest();
        request.setChecked(true);

        // When & Then
        mockMvc.perform(put("/checklist/" + checklistItem.getId())
                        .header("Authorization", "Bearer " + instructorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("Test Checklist Item"))
                .andExpect(jsonPath("$.checked").value(true));
    }

    @Test
    @DisplayName("PUT /checklist/{id} - 존재하지 않는 아이템 업데이트 실패")
    void updateChecklistItem_NotFound() throws Exception {
        // Given
        ChecklistUpdateRequest request = new ChecklistUpdateRequest();
        request.setChecked(true);

        // When & Then
        mockMvc.perform(put("/checklist/99999")
                        .header("Authorization", "Bearer " + instructorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /checklist/{id}/label - PM이 레이블 업데이트 성공")
    void updateChecklistItemLabel_Success() throws Exception {
        // Given
        ChecklistItemLabelUpdateRequest request = new ChecklistItemLabelUpdateRequest();
        request.setLabel("Updated Label");

        // When & Then
        mockMvc.perform(put("/checklist/" + checklistItem.getId() + "/label")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("Updated Label"));
    }

    @Test
    @DisplayName("PUT /checklist/{id}/label - 존재하지 않는 아이템 레이블 업데이트 실패")
    void updateChecklistItemLabel_NotFound() throws Exception {
        // Given
        ChecklistItemLabelUpdateRequest request = new ChecklistItemLabelUpdateRequest();
        request.setLabel("Updated Label");

        // When & Then
        mockMvc.perform(put("/checklist/99999/label")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /checklist/{id} - 유효성 검증 실패 (빈 요청)")
    void updateChecklistItem_ValidationFailed() throws Exception {
        // Given - Empty request body would fail, but let's test null checked field
        String invalidJson = "{}";

        // When & Then
        mockMvc.perform(put("/checklist/" + checklistItem.getId())
                        .header("Authorization", "Bearer " + instructorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }
}
