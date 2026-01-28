package kr.codeit.onboarding.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * Video Upload Service
 * Supports both local file storage and AWS S3 storage
 * Automatically uses S3 if enabled, otherwise falls back to local storage
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VideoUploadService {

    private final S3Service s3Service;

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    // Allowed video extensions
    private static final Set<String> ALLOWED_VIDEO_EXTENSIONS = Set.of(
            ".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv"
    );

    // Maximum video file size (500MB)
    private static final long MAX_VIDEO_SIZE = 500L * 1024 * 1024;

    /**
     * Upload video file and return stored filename or S3 URL
     * 
     * @param file Video file to upload
     * @return Stored filename (UUID-based) for local storage, or S3 URL for S3 storage
     * @throws IOException if upload fails
     */
    public String uploadVideo(MultipartFile file) throws IOException {
        // Validate file
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("동영상 파일을 선택해주세요.");
        }

        // Validate file size
        if (file.getSize() > MAX_VIDEO_SIZE) {
            long fileSizeMB = file.getSize() / (1024 * 1024);
            long maxSizeMB = MAX_VIDEO_SIZE / (1024 * 1024);
            throw new IllegalArgumentException(
                String.format("동영상 파일 크기가 너무 큽니다. (현재: %dMB, 최대: %dMB)", fileSizeMB, maxSizeMB)
            );
        }

        // Validate file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("동영상 파일명이 유효하지 않습니다.");
        }

        String fileExtension = "";
        if (originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        if (!ALLOWED_VIDEO_EXTENSIONS.contains(fileExtension)) {
            throw new IllegalArgumentException(
                "지원하지 않는 동영상 형식입니다. (" + fileExtension + ") 허용된 형식: " + ALLOWED_VIDEO_EXTENSIONS
            );
        }

        // Generate unique filename
        String storedFileName = UUID.randomUUID().toString() + fileExtension;

        // Use S3 if enabled, otherwise use local storage
        if (s3Service.isEnabled()) {
            try {
                String s3Key = "videos/" + storedFileName;
                String s3Url = s3Service.uploadFile(file, s3Key);
                log.info("Video uploaded to S3: {} -> {}", storedFileName, s3Url);
                // Return S3 URL instead of filename
                return s3Url;
            } catch (Exception e) {
                log.error("Failed to upload to S3, falling back to local storage", e);
                // Fall through to local storage
            }
        }

        // Local storage fallback
        Path videosDir = Paths.get(uploadDir, "videos");
        if (!Files.exists(videosDir)) {
            Files.createDirectories(videosDir);
        }

        Path filePath = videosDir.resolve(storedFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Video uploaded to local storage: {}", storedFileName);

        return storedFileName;
    }

    /**
     * Delete video file from storage (S3 or local)
     * 
     * @param storedFileNameOrUrl Stored filename (for local) or S3 URL (for S3)
     */
    public void deleteVideo(String storedFileNameOrUrl) {
        if (storedFileNameOrUrl == null || storedFileNameOrUrl.isBlank()) {
            return;
        }

        // Check if it's an S3 URL
        if (s3Service.isEnabled() && storedFileNameOrUrl.startsWith("http")) {
            try {
                // Extract S3 key from URL
                // URL format: https://bucket.s3.region.amazonaws.com/videos/filename
                String s3Key = storedFileNameOrUrl.substring(storedFileNameOrUrl.indexOf("/videos/"));
                s3Service.deleteFile(s3Key);
                log.info("Video deleted from S3: {}", s3Key);
            } catch (Exception e) {
                log.error("Failed to delete video from S3: {}", storedFileNameOrUrl, e);
            }
        } else {
            // Local storage
            try {
                Path filePath = Paths.get(uploadDir, "videos", storedFileNameOrUrl);
                Files.deleteIfExists(filePath);
                log.info("Video deleted from local storage: {}", storedFileNameOrUrl);
            } catch (IOException e) {
                log.error("Failed to delete video from local storage: {}", storedFileNameOrUrl, e);
            }
        }
    }

    /**
     * Get video path (for local storage) or URL (for S3)
     * 
     * @param storedFileNameOrUrl Stored filename (for local) or S3 URL (for S3)
     * @return File path for local storage, or null for S3 (use URL directly)
     */
    public Path getVideoPath(String storedFileNameOrUrl) {
        // If it's an S3 URL, return null (video should be accessed via URL)
        if (s3Service.isEnabled() && storedFileNameOrUrl != null && storedFileNameOrUrl.startsWith("http")) {
            return null;
        }
        return Paths.get(uploadDir, "videos", storedFileNameOrUrl);
    }

    /**
     * Check if the stored value is an S3 URL
     * 
     * @param storedFileNameOrUrl Stored filename or S3 URL
     * @return true if it's an S3 URL
     */
    public boolean isS3Url(String storedFileNameOrUrl) {
        return storedFileNameOrUrl != null && storedFileNameOrUrl.startsWith("http");
    }
}
