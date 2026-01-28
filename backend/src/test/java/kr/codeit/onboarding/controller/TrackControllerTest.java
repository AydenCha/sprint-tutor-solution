package kr.codeit.onboarding.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.codeit.onboarding.domain.entity.Track;
import kr.codeit.onboarding.domain.entity.User;
import kr.codeit.onboarding.domain.enums.UserRole;
import kr.codeit.onboarding.dto.TrackRequest;
import kr.codeit.onboarding.repository.TrackRepository;
import kr.codeit.onboarding.repository.UserRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TrackControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TrackRepository trackRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private String pmToken;
    private Track track1;

    @BeforeEach
    void setUp() {
        // Create PM user
        User pmUser = User.builder()
                .email("pm@track-test.com")
                .name("PM User")
                .role(UserRole.PM)
                .build();
        pmUser = userRepository.save(pmUser);
        pmToken = jwtUtil.generateToken(pmUser);

        // Create test track
        track1 = Track.builder()
                .name("FRONTEND")
                .koreanName("프론트엔드")
                .code("FE")
                .enabled(true)
                .build();
        track1 = trackRepository.save(track1);
    }

    @Test
    @DisplayName("GET /tracks - 모든 트랙 조회 성공")
    void getAllTracks_Success() throws Exception {
        // When & Then
        mockMvc.perform(get("/tracks")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("FRONTEND"))
                .andExpect(jsonPath("$[0].koreanName").value("프론트엔드"))
                .andExpect(jsonPath("$[0].code").value("FE"));
    }

    @Test
    @DisplayName("GET /tracks/{id} - 트랙 조회 성공")
    void getTrackById_Success() throws Exception {
        // When & Then
        mockMvc.perform(get("/tracks/" + track1.getId())
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(track1.getId()))
                .andExpect(jsonPath("$.name").value("FRONTEND"))
                .andExpect(jsonPath("$.code").value("FE"));
    }

    @Test
    @DisplayName("GET /tracks/{id} - 존재하지 않는 트랙 조회 실패")
    void getTrackById_NotFound() throws Exception {
        // When & Then
        mockMvc.perform(get("/tracks/99999")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /tracks - 트랙 생성 성공")
    void createTrack_Success() throws Exception {
        // Given
        TrackRequest request = new TrackRequest();
        request.setName("BACKEND");
        request.setKoreanName("백엔드");
        request.setCode("BE");
        request.setEnabled(true);

        // When & Then
        mockMvc.perform(post("/tracks")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("BACKEND"))
                .andExpect(jsonPath("$.koreanName").value("백엔드"))
                .andExpect(jsonPath("$.code").value("BE"))
                .andExpect(jsonPath("$.enabled").value(true));
    }

    @Test
    @DisplayName("POST /tracks - 유효성 검증 실패 (빈 이름)")
    void createTrack_ValidationFailed_EmptyName() throws Exception {
        // Given
        TrackRequest request = new TrackRequest();
        request.setName("");  // Empty name
        request.setKoreanName("백엔드");
        request.setCode("BE");
        request.setEnabled(true);

        // When & Then
        mockMvc.perform(post("/tracks")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /tracks - 중복 코드로 생성 실패")
    void createTrack_DuplicateCode() throws Exception {
        // Given
        TrackRequest request = new TrackRequest();
        request.setName("FRONTEND2");
        request.setKoreanName("프론트엔드2");
        request.setCode("FE");  // Duplicate code
        request.setEnabled(true);

        // When & Then
        mockMvc.perform(post("/tracks")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PUT /tracks/{id} - 트랙 업데이트 성공")
    void updateTrack_Success() throws Exception {
        // Given
        TrackRequest request = new TrackRequest();
        request.setName("FRONTEND_UPDATED");
        request.setKoreanName("프론트엔드 업데이트");
        request.setCode("FE");
        request.setEnabled(false);

        // When & Then
        mockMvc.perform(put("/tracks/" + track1.getId())
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("FRONTEND_UPDATED"))
                .andExpect(jsonPath("$.koreanName").value("프론트엔드 업데이트"))
                .andExpect(jsonPath("$.enabled").value(false));
    }

    @Test
    @DisplayName("PUT /tracks/{id} - 존재하지 않는 트랙 업데이트 실패")
    void updateTrack_NotFound() throws Exception {
        // Given
        TrackRequest request = new TrackRequest();
        request.setName("UPDATED");
        request.setKoreanName("업데이트");
        request.setCode("UP");
        request.setEnabled(true);

        // When & Then
        mockMvc.perform(put("/tracks/99999")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /tracks/{id} - 트랙 삭제 성공")
    void deleteTrack_Success() throws Exception {
        // When & Then
        mockMvc.perform(delete("/tracks/" + track1.getId())
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /tracks/{id} - 존재하지 않는 트랙 삭제 실패")
    void deleteTrack_NotFound() throws Exception {
        // When & Then
        mockMvc.perform(delete("/tracks/99999")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("인증 없이 트랙 생성 시도 - 실패")
    void createTrack_NoAuthentication() throws Exception {
        // Given
        TrackRequest request = new TrackRequest();
        request.setName("BACKEND");
        request.setKoreanName("백엔드");
        request.setCode("BE");
        request.setEnabled(true);

        // When & Then
        mockMvc.perform(post("/tracks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());  // Spring Security returns 403 for missing auth
    }
}
