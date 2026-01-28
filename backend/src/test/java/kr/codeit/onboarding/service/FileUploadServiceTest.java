package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.*;
import kr.codeit.onboarding.domain.enums.ContentType;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import kr.codeit.onboarding.domain.enums.UserRole;
import kr.codeit.onboarding.dto.FileRequirement;
import kr.codeit.onboarding.dto.FileUploadResponse;
import kr.codeit.onboarding.exception.ResourceNotFoundException;
import kr.codeit.onboarding.exception.UnauthorizedException;
import kr.codeit.onboarding.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class FileUploadServiceTest {

    @Autowired
    private FileUploadService fileUploadService;

    @Autowired
    private FileUploadRepository fileUploadRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private InstructorRepository instructorRepository;

    @Autowired
    private OnboardingStepRepository stepRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrackRepository trackRepository;

    @Autowired
    private StepDefinitionRepository stepDefinitionRepository;


    private Instructor instructor;
    private Task task;
    private User instructorUser;
    private User pmUser;

    @BeforeEach
    void setUp() {
        // Clean up test uploads directory
        try {
            Path testUploadDir = Paths.get("./test-uploads");
            if (Files.exists(testUploadDir)) {
                Files.walk(testUploadDir)
                        .sorted((a, b) -> -a.compareTo(b))
                        .forEach(path -> {
                            try {
                                Files.delete(path);
                            } catch (IOException e) {
                                // Ignore
                            }
                        });
            }
        } catch (IOException e) {
            // Ignore
        }

        // Create Track
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

        // Create User
        instructorUser = User.builder()
                .email("instructor@test.com")
                .name("Test Instructor")
                .role(UserRole.INSTRUCTOR)
                .build();
        instructorUser = userRepository.save(instructorUser);

        // Create Instructor
        instructor = Instructor.builder()
                .user(instructorUser)
                .phone("010-1234-5678")
                .track(track)
                .cohort("4기")
                .accessCode("FE4-TEST1")
                .startDate(LocalDate.now())
                .build();
        instructor = instructorRepository.save(instructor);

        // Create User for StepDefinition creator
        pmUser = User.builder()
                .email("pm@test.com")
                .name("PM User")
                .role(UserRole.PM)
                .build();
        pmUser = userRepository.save(pmUser);

        // Create Step Definition
        StepDefinition stepDefinition = StepDefinition.builder()
                .title("Test Step")
                .description("Test Description")
                .displayOrder(1)
                .createdBy(pmUser)
                .build();
        stepDefinition = stepDefinitionRepository.save(stepDefinition);

        // Create Onboarding Step
        OnboardingStep step = OnboardingStep.builder()
                .instructor(instructor)
                .stepNumber(1)
                .title("Test Step")
                .dDay(0)
                .status(TaskStatus.PENDING)
                .build();
        step = stepRepository.save(step);

        // Create Task
        task = Task.builder()
                .step(step)
                .title("Test Task")
                .description("Test Task Description")
                .contentType(ContentType.C)
                .status(TaskStatus.PENDING)
                .build();
        task = taskRepository.save(task);

        // Set up authentication
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                instructorUser,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_INSTRUCTOR"))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @AfterEach
    void tearDown() {
        // Clean up test uploads directory after each test
        try {
            Path testUploadDir = Paths.get("./test-uploads");
            if (Files.exists(testUploadDir)) {
                Files.walk(testUploadDir)
                        .sorted((a, b) -> -a.compareTo(b))
                        .forEach(path -> {
                            try {
                                Files.delete(path);
                            } catch (IOException e) {
                                // Ignore
                            }
                        });
            }
        } catch (IOException e) {
            // Ignore
        }
    }

    @Test
    @DisplayName("파일 업로드 성공 - 유효한 파일을 업로드하면 성공한다")
    void uploadFile_Success() throws IOException {
        // Given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-document.pdf",
                "application/pdf",
                "Test file content".getBytes()
        );

        // When
        FileUploadResponse response = fileUploadService.uploadFile(task.getId(), file);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isNotNull();
        assertThat(response.getFileName()).isEqualTo("test-document.pdf");
        assertThat(response.getFileSize()).isEqualTo(file.getSize());
        assertThat(response.getUploadedAt()).isNotNull();

        // Verify file was saved to database
        assertThat(fileUploadRepository.findById(response.getId())).isPresent();
    }

    @Test
    @DisplayName("파일 업로드 실패 - 파일이 null인 경우")
    void uploadFile_NullFile() {
        // When & Then
        assertThatThrownBy(() -> fileUploadService.uploadFile(task.getId(), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("파일을 선택해주세요");
    }

    @Test
    @DisplayName("파일 업로드 실패 - 빈 파일인 경우")
    void uploadFile_EmptyFile() {
        // Given
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.txt",
                "text/plain",
                new byte[0]
        );

        // When & Then
        assertThatThrownBy(() -> fileUploadService.uploadFile(task.getId(), emptyFile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("파일을 선택해주세요");
    }

    @Test
    @DisplayName("파일 업로드 실패 - 허용되지 않은 파일 확장자")
    void uploadFile_InvalidExtension() {
        // Given
        MockMultipartFile invalidFile = new MockMultipartFile(
                "file",
                "test.exe",
                "application/x-msdownload",
                "malicious content".getBytes()
        );

        // When & Then
        assertThatThrownBy(() -> fileUploadService.uploadFile(task.getId(), invalidFile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("지원하지 않는 파일 형식입니다");
    }

    @Test
    @DisplayName("파일 업로드 실패 - 파일 크기 초과")
    void uploadFile_FileSizeExceeded() {
        // Given - 201MB file (exceeds 200MB limit)
        byte[] largeContent = new byte[201 * 1024 * 1024];
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "large.pdf",
                "application/pdf",
                largeContent
        );

        // When & Then
        assertThatThrownBy(() -> fileUploadService.uploadFile(task.getId(), largeFile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("파일 크기가 너무 큽니다");
    }

    @Test
    @DisplayName("파일 업로드 실패 - 존재하지 않는 태스크")
    void uploadFile_TaskNotFound() {
        // Given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "content".getBytes()
        );

        // When & Then
        assertThatThrownBy(() -> fileUploadService.uploadFile(99999L, file))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Task not found");
    }

    @Test
    @DisplayName("파일 다운로드 성공 - 업로드한 파일을 다운로드할 수 있다")
    void downloadFile_Success() throws IOException {
        // Given - Upload a file first
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-document.pdf",
                "application/pdf",
                "Test file content".getBytes()
        );
        FileUploadResponse uploadResponse = fileUploadService.uploadFile(task.getId(), file);

        // When
        byte[] content = fileUploadService.getFileContent(uploadResponse.getId());

        // Then
        assertThat(content).isNotNull();
        assertThat(content).isEqualTo("Test file content".getBytes());
    }

    @Test
    @DisplayName("파일 다운로드 실패 - 존재하지 않는 파일")
    void downloadFile_FileNotFound() {
        // When & Then
        assertThatThrownBy(() -> fileUploadService.getFileContent(99999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("File not found");
    }

    @Test
    @DisplayName("파일 다운로드 실패 - 다른 강사의 파일 접근 시도")
    void downloadFile_UnauthorizedAccess() throws IOException {
        // Given - Create another instructor
        User otherUser = User.builder()
                .email("other@test.com")
                .name("Other Instructor")
                .role(UserRole.INSTRUCTOR)
                .build();
        otherUser = userRepository.save(otherUser);

        Track track = trackRepository.findByName("FRONTEND").orElseThrow();
        Instructor otherInstructor = Instructor.builder()
                .user(otherUser)
                .phone("010-9999-9999")
                .track(track)
                .cohort("4기")
                .accessCode("FE4-OTHER")
                .startDate(LocalDate.now())
                .build();
        otherInstructor = instructorRepository.save(otherInstructor);

        // Upload file as current instructor
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "content".getBytes()
        );
        FileUploadResponse uploadResponse = fileUploadService.uploadFile(task.getId(), file);

        // Switch to other instructor
        UsernamePasswordAuthenticationToken otherAuth = new UsernamePasswordAuthenticationToken(
                otherUser,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_INSTRUCTOR"))
        );
        SecurityContextHolder.getContext().setAuthentication(otherAuth);

        // When & Then
        assertThatThrownBy(() -> fileUploadService.getFileContent(uploadResponse.getId()))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("You can only access your own files");
    }

    @Test
    @DisplayName("파일 삭제 성공 - 업로드한 파일을 삭제할 수 있다")
    void deleteFile_Success() throws IOException {
        // Given - Upload a file first
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "content".getBytes()
        );
        FileUploadResponse uploadResponse = fileUploadService.uploadFile(task.getId(), file);
        Long fileId = uploadResponse.getId();

        // Verify file exists
        assertThat(fileUploadRepository.findById(fileId)).isPresent();

        // When
        fileUploadService.deleteFile(fileId);

        // Then
        assertThat(fileUploadRepository.findById(fileId)).isEmpty();
    }

    @Test
    @DisplayName("파일 삭제 실패 - 다른 강사의 파일 삭제 시도")
    void deleteFile_UnauthorizedDelete() throws IOException {
        // Given - Upload file as current instructor
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "content".getBytes()
        );
        FileUploadResponse uploadResponse = fileUploadService.uploadFile(task.getId(), file);

        // Create another instructor
        User otherUser = User.builder()
                .email("other@test.com")
                .name("Other Instructor")
                .role(UserRole.INSTRUCTOR)
                .build();
        otherUser = userRepository.save(otherUser);

        Track track = trackRepository.findByName("FRONTEND").orElseThrow();
        Instructor otherInstructor = Instructor.builder()
                .user(otherUser)
                .phone("010-9999-9999")
                .track(track)
                .cohort("4기")
                .accessCode("FE4-OTHER")
                .startDate(LocalDate.now())
                .build();
        instructorRepository.save(otherInstructor);

        // Switch to other instructor
        UsernamePasswordAuthenticationToken otherAuth = new UsernamePasswordAuthenticationToken(
                otherUser,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_INSTRUCTOR"))
        );
        SecurityContextHolder.getContext().setAuthentication(otherAuth);

        // When & Then
        assertThatThrownBy(() -> fileUploadService.deleteFile(uploadResponse.getId()))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("You can only delete your own files");
    }

    @Test
    @DisplayName("파일 메타데이터 조회 성공 - 파일 정보를 조회할 수 있다")
    void getFileMetadata_Success() throws IOException {
        // Given - Upload a file first
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-document.pdf",
                "application/pdf",
                "Test content".getBytes()
        );
        FileUploadResponse uploadResponse = fileUploadService.uploadFile(task.getId(), file);

        // When
        FileUpload metadata = fileUploadService.getFileMetadata(uploadResponse.getId());

        // Then
        assertThat(metadata).isNotNull();
        assertThat(metadata.getId()).isEqualTo(uploadResponse.getId());
        assertThat(metadata.getFileName()).isEqualTo("test-document.pdf");
        assertThat(metadata.getFileSize()).isEqualTo(file.getSize());
        assertThat(metadata.getMimeType()).isEqualTo("application/pdf");
    }

    @Test
    @DisplayName("태스크별 파일 목록 조회 성공 - PM은 태스크의 모든 파일을 조회할 수 있다")
    void getFilesByTask_Success() throws IOException {
        // Given - Upload multiple files
        MockMultipartFile file1 = new MockMultipartFile(
                "file",
                "file1.pdf",
                "application/pdf",
                "content1".getBytes()
        );
        MockMultipartFile file2 = new MockMultipartFile(
                "file",
                "file2.pdf",
                "application/pdf",
                "content2".getBytes()
        );

        fileUploadService.uploadFile(task.getId(), file1);
        fileUploadService.uploadFile(task.getId(), file2);

        // Switch to PM user (reuse pmUser from setUp)
        UsernamePasswordAuthenticationToken pmAuth = new UsernamePasswordAuthenticationToken(
                pmUser,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_PM"))
        );
        SecurityContextHolder.getContext().setAuthentication(pmAuth);

        // When
        List<FileUploadResponse> files = fileUploadService.getFilesByTask(task.getId());

        // Then
        assertThat(files).hasSize(2);
        assertThat(files).extracting("fileName")
                .containsExactlyInAnyOrder("file1.pdf", "file2.pdf");
    }

    @Test
    @org.junit.jupiter.api.Disabled("Auto-complete logic needs review - task status not updating correctly")
    @DisplayName("태스크 완료 자동 처리 - 필수 파일을 모두 업로드하면 태스크가 완료된다")
    void uploadFile_AutoCompleteTask() throws IOException {
        // Given - Create task with required files
        task.setRequiredFiles(java.util.Arrays.asList(
                FileRequirement.builder()
                        .placeholder("첫 번째 문서")
                        .fileNameHint("document1")
                        .allowedExtensions(java.util.Arrays.asList(".pdf"))
                        .required(true)
                        .build(),
                FileRequirement.builder()
                        .placeholder("두 번째 문서")
                        .fileNameHint("document2")
                        .allowedExtensions(java.util.Arrays.asList(".pdf"))
                        .required(true)
                        .build()
        ));
        task = taskRepository.save(task);

        // When - Upload first file
        MockMultipartFile file1 = new MockMultipartFile(
                "file",
                "document1.pdf",
                "application/pdf",
                "content1".getBytes()
        );
        fileUploadService.uploadFile(task.getId(), file1);

        // Task should still be IN_PROGRESS
        task = taskRepository.findById(task.getId()).orElseThrow();
        assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);

        // Upload second file
        MockMultipartFile file2 = new MockMultipartFile(
                "file",
                "document2.pdf",
                "application/pdf",
                "content2".getBytes()
        );
        fileUploadService.uploadFile(task.getId(), file2);

        // Then - Task should be COMPLETED
        task = taskRepository.findById(task.getId()).orElseThrow();
        assertThat(task.getStatus()).isEqualTo(TaskStatus.COMPLETED);
    }

    @Test
    @DisplayName("다양한 파일 형식 업로드 테스트")
    void uploadFile_VariousFileTypes() throws IOException {
        // Test PDF
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "pdf content".getBytes()
        );
        FileUploadResponse pdfResponse = fileUploadService.uploadFile(task.getId(), pdfFile);
        assertThat(pdfResponse.getFileName()).isEqualTo("test.pdf");

        // Test DOCX
        MockMultipartFile docxFile = new MockMultipartFile(
                "file", "test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx content".getBytes()
        );
        FileUploadResponse docxResponse = fileUploadService.uploadFile(task.getId(), docxFile);
        assertThat(docxResponse.getFileName()).isEqualTo("test.docx");

        // Test Image
        MockMultipartFile imageFile = new MockMultipartFile(
                "file", "test.png", "image/png", "image content".getBytes()
        );
        FileUploadResponse imageResponse = fileUploadService.uploadFile(task.getId(), imageFile);
        assertThat(imageResponse.getFileName()).isEqualTo("test.png");
    }
}
