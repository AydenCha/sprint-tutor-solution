package kr.codeit.onboarding.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.s3.enabled=false",
        "app.file.upload-dir=./test-uploads"
})
@Transactional
class VideoUploadServiceTest {

    @Autowired
    private VideoUploadService videoUploadService;

    @BeforeEach
    void setUp() throws IOException {
        // Clean up test uploads directory
        Path testUploadDir = Paths.get("./test-uploads/videos");
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
    }

    @AfterEach
    void tearDown() throws IOException {
        // Clean up test uploads directory after each test
        Path testUploadDir = Paths.get("./test-uploads/videos");
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
    }

    @Test
    @DisplayName("비디오 업로드 성공 - 유효한 비디오 파일을 업로드하면 성공한다")
    void uploadVideo_Success() throws IOException {
        // Given
        MockMultipartFile videoFile = new MockMultipartFile(
                "file",
                "test-video.mp4",
                "video/mp4",
                "Test video content".getBytes()
        );

        // When
        String storedFileName = videoUploadService.uploadVideo(videoFile);

        // Then
        assertThat(storedFileName).isNotNull();
        assertThat(storedFileName).endsWith(".mp4");
        
        // Verify file was saved
        Path videoPath = videoUploadService.getVideoPath(storedFileName);
        assertThat(videoPath).isNotNull();
        assertThat(Files.exists(videoPath)).isTrue();
    }

    @Test
    @DisplayName("비디오 업로드 실패 - 파일이 null인 경우")
    void uploadVideo_NullFile() {
        // When & Then
        assertThatThrownBy(() -> videoUploadService.uploadVideo(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("동영상 파일을 선택해주세요");
    }

    @Test
    @DisplayName("비디오 업로드 실패 - 빈 파일인 경우")
    void uploadVideo_EmptyFile() {
        // Given
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.mp4",
                "video/mp4",
                new byte[0]
        );

        // When & Then
        assertThatThrownBy(() -> videoUploadService.uploadVideo(emptyFile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("동영상 파일을 선택해주세요");
    }

    @Test
    @DisplayName("비디오 업로드 실패 - 허용되지 않은 비디오 형식")
    void uploadVideo_InvalidFormat() {
        // Given
        MockMultipartFile invalidFile = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                "not a video".getBytes()
        );

        // When & Then
        assertThatThrownBy(() -> videoUploadService.uploadVideo(invalidFile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("지원하지 않는 동영상 형식입니다");
    }

    @Test
    @DisplayName("비디오 업로드 실패 - 파일 크기 초과")
    void uploadVideo_FileSizeExceeded() {
        // Given - 501MB file (exceeds 500MB limit)
        byte[] largeContent = new byte[501 * 1024 * 1024];
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "large.mp4",
                "video/mp4",
                largeContent
        );

        // When & Then
        assertThatThrownBy(() -> videoUploadService.uploadVideo(largeFile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("동영상 파일 크기가 너무 큽니다");
    }

    @Test
    @DisplayName("다양한 비디오 형식 업로드 테스트")
    void uploadVideo_VariousFormats() throws IOException {
        // Test MP4
        MockMultipartFile mp4File = new MockMultipartFile(
                "file", "test.mp4", "video/mp4", "mp4 content".getBytes()
        );
        String mp4FileName = videoUploadService.uploadVideo(mp4File);
        assertThat(mp4FileName).endsWith(".mp4");

        // Test WebM
        MockMultipartFile webmFile = new MockMultipartFile(
                "file", "test.webm", "video/webm", "webm content".getBytes()
        );
        String webmFileName = videoUploadService.uploadVideo(webmFile);
        assertThat(webmFileName).endsWith(".webm");

        // Test MOV
        MockMultipartFile movFile = new MockMultipartFile(
                "file", "test.mov", "video/quicktime", "mov content".getBytes()
        );
        String movFileName = videoUploadService.uploadVideo(movFile);
        assertThat(movFileName).endsWith(".mov");
    }

    @Test
    @DisplayName("비디오 삭제 성공 - 업로드한 비디오를 삭제할 수 있다")
    void deleteVideo_Success() throws IOException {
        // Given - Upload a video first
        MockMultipartFile videoFile = new MockMultipartFile(
                "file",
                "test-video.mp4",
                "video/mp4",
                "Test video content".getBytes()
        );
        String storedFileName = videoUploadService.uploadVideo(videoFile);
        Path videoPath = videoUploadService.getVideoPath(storedFileName);

        // Verify file exists
        assertThat(Files.exists(videoPath)).isTrue();

        // When
        videoUploadService.deleteVideo(storedFileName);

        // Then
        assertThat(Files.exists(videoPath)).isFalse();
    }

    @Test
    @DisplayName("비디오 경로 조회 성공 - 저장된 비디오의 경로를 조회할 수 있다")
    void getVideoPath_Success() throws IOException {
        // Given - Upload a video first
        MockMultipartFile videoFile = new MockMultipartFile(
                "file",
                "test-video.mp4",
                "video/mp4",
                "Test video content".getBytes()
        );
        String storedFileName = videoUploadService.uploadVideo(videoFile);

        // When
        Path videoPath = videoUploadService.getVideoPath(storedFileName);

        // Then
        assertThat(videoPath).isNotNull();
        assertThat(Files.exists(videoPath)).isTrue();
        assertThat(videoPath.toString()).contains("videos");
        assertThat(videoPath.toString()).contains(storedFileName);
    }

    @Test
    @DisplayName("비디오 삭제 - null 파일명은 무시된다")
    void deleteVideo_NullFileName() {
        // When & Then - Should not throw exception
        videoUploadService.deleteVideo(null);
    }

    @Test
    @DisplayName("비디오 삭제 - 빈 파일명은 무시된다")
    void deleteVideo_EmptyFileName() {
        // When & Then - Should not throw exception
        videoUploadService.deleteVideo("");
    }
}
