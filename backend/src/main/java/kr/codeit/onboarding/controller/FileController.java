package kr.codeit.onboarding.controller;

import kr.codeit.onboarding.domain.entity.FileUpload;
import kr.codeit.onboarding.dto.FileUploadResponse;
import kr.codeit.onboarding.dto.VideoUploadResponse;
import kr.codeit.onboarding.security.SecurityContext;
import kr.codeit.onboarding.service.FileUploadService;
import kr.codeit.onboarding.service.VideoUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * REST Controller for File and Video Management.
 *
 * <p>This controller handles file operations for the onboarding system including:</p>
 * <ul>
 *   <li>File uploads by instructors for task completion</li>
 *   <li>File downloads and deletions</li>
 *   <li>Video uploads for learning modules (PM only)</li>
 *   <li>Video streaming for module playback</li>
 *   <li>File listing by task</li>
 * </ul>
 *
 * <p>Storage Configuration:</p>
 * <ul>
 *   <li>Task files: Local storage or cloud (S3)</li>
 *   <li>Videos: Local storage or cloud (S3) based on configuration</li>
 * </ul>
 *
 * <p>Access Control:</p>
 * <ul>
 *   <li>Instructors: Upload/delete own files, download accessible files</li>
 *   <li>PM: Full access including video management</li>
 * </ul>
 *
 * @author Sprint Tutor Flow Team
 * @since 1.0
 */
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@Validated
public class FileController {

    private final FileUploadService fileUploadService;
    private final VideoUploadService videoUploadService;
    private final SecurityContext securityContext;

    /**
     * Upload a file for task completion.
     *
     * <p>Allows instructors to upload files as part of their task submissions. Files are
     * associated with a specific task and instructor. Supported file types and size limits
     * are configured in the application settings.</p>
     *
     * <p>Instructor access - files are associated with authenticated user.</p>
     *
     * @param taskId the task ID this file is for
     * @param file the file to upload
     * @return ResponseEntity containing file upload metadata including ID and URL
     * @throws IOException if file upload fails
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if task not found
     * @throws kr.codeit.onboarding.exception.UnauthorizedException if task doesn't belong to current instructor
     */
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam Long taskId,
            @RequestParam("file") MultipartFile file) throws IOException {
        FileUploadResponse response = fileUploadService.uploadFile(taskId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Download a previously uploaded file.
     *
     * <p>Retrieves file content for download. Instructors can only download their own files
     * unless they have PM privileges. File is returned with appropriate content type and
     * disposition headers for browser download.</p>
     *
     * @param fileId the file ID to download
     * @return ResponseEntity containing file content as binary resource
     * @throws IOException if file retrieval fails
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if file not found
     * @throws kr.codeit.onboarding.exception.UnauthorizedException if user cannot access this file
     */
    @GetMapping("/{fileId}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long fileId) throws IOException {
        FileUpload fileMetadata = fileUploadService.getFileMetadata(fileId);
        byte[] fileContent = fileUploadService.getFileContent(fileId);

        if (fileContent == null || fileContent.length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        ByteArrayResource resource = new ByteArrayResource(fileContent);

        String contentType = fileMetadata.getMimeType() != null
            ? fileMetadata.getMimeType()
            : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + fileMetadata.getFileName() + "\"")
                .contentLength(fileContent.length)
                .body(resource);
    }

    /**
     * Verify file exists and return metadata (PM only).
     * Useful for checking if file is actually stored on Railway volume.
     *
     * @param fileId the file ID to verify
     * @return ResponseEntity containing file verification information
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if file not found
     */
    @GetMapping("/{fileId}/verify")
    public ResponseEntity<java.util.Map<String, Object>> verifyFile(
            @PathVariable Long fileId) throws IOException {
        securityContext.requirePm(); // Only PM can verify files
        
        FileUpload fileMetadata = fileUploadService.getFileMetadata(fileId);
        boolean exists = fileUploadService.fileExists(fileId);
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("fileId", fileId);
        response.put("fileName", fileMetadata.getFileName());
        response.put("filePath", fileMetadata.getFilePath());
        response.put("exists", exists);
        response.put("fileSize", fileMetadata.getFileSize());
        response.put("uploadedAt", fileMetadata.getUploadedAt());
        response.put("mimeType", fileMetadata.getMimeType());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Delete an uploaded file.
     *
     * <p>Removes a file from storage. Instructors can only delete their own files.
     * Deleting a file will affect task completion status if the file was required.</p>
     *
     * <p>Instructor access - can only delete own files.</p>
     *
     * @param fileId the file ID to delete
     * @return ResponseEntity with no content (204)
     * @throws IOException if file deletion fails
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if file not found
     * @throws kr.codeit.onboarding.exception.UnauthorizedException if user cannot delete this file
     */
    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long fileId) throws IOException {
        fileUploadService.deleteFile(fileId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Retrieve all files uploaded for a specific task.
     *
     * <p>Returns a list of all files uploaded by instructors for the specified task.
     * Useful for PMs to review submitted files across all instructors.</p>
     *
     * <p>PM access only.</p>
     *
     * @param taskId the task ID to retrieve files for
     * @return ResponseEntity containing list of file metadata
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if task not found
     */
    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<FileUploadResponse>> getFilesByTask(
            @PathVariable Long taskId) {
        List<FileUploadResponse> files = fileUploadService.getFilesByTask(taskId);
        return ResponseEntity.ok(files);
    }

    /**
     * Upload video file for learning module.
     *
     * <p>Uploads a video file that will be used in Type B (video-based) learning modules.
     * Videos are stored in configured storage (local or S3). Supports common video formats
     * including MP4, WebM, MOV, AVI, and MKV.</p>
     *
     * <p>PM access only.</p>
     *
     * @param file the video file to upload
     * @return ResponseEntity containing video upload metadata with access URL
     * @throws IOException if video upload fails
     * @throws kr.codeit.onboarding.exception.InvalidCredentialsException if file type not supported
     */
    @PostMapping("/videos/upload")
    public ResponseEntity<VideoUploadResponse> uploadVideo(
            @RequestParam("file") MultipartFile file) throws IOException {
        securityContext.requirePm();

        String videoUrl = videoUploadService.uploadVideo(file);

        VideoUploadResponse response = VideoUploadResponse.builder()
                .url(videoUrl)
                .originalFilename(file.getOriginalFilename())
                .fileSize(file.getSize())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Stream video file for module playback.
     *
     * <p>Provides video streaming capability for learning modules. For S3-hosted videos,
     * redirects to the S3 URL. For local videos, streams the content with proper headers
     * for browser playback. Content type is automatically detected based on file extension.</p>
     *
     * @param filename the video filename (UUID-based for local storage)
     * @return ResponseEntity containing video content or redirect to S3
     * @throws IOException if video retrieval fails
     * @throws kr.codeit.onboarding.exception.ResourceNotFoundException if video not found
     */
    @GetMapping("/videos/{filename}")
    public ResponseEntity<?> streamVideo(
            @PathVariable String filename) throws IOException {
        // Handle S3 URLs - redirect to cloud storage
        if (filename.startsWith("http")) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header(HttpHeaders.LOCATION, filename)
                    .build();
        }

        // Handle local storage
        Path videoPath = videoUploadService.getVideoPath(filename);

        if (videoPath == null || !Files.exists(videoPath)) {
            throw new kr.codeit.onboarding.exception.ResourceNotFoundException("Video file not found");
        }

        byte[] videoContent = Files.readAllBytes(videoPath);
        ByteArrayResource resource = new ByteArrayResource(videoContent);

        // Determine content type based on file extension
        String contentType = determineVideoContentType(filename);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .body(resource);
    }

    /**
     * Determines the MIME type for video files based on file extension.
     *
     * @param filename the video filename
     * @return the MIME type string
     */
    private String determineVideoContentType(String filename) {
        String filenameLower = filename.toLowerCase();

        if (filenameLower.endsWith(".mp4")) {
            return "video/mp4";
        } else if (filenameLower.endsWith(".webm")) {
            return "video/webm";
        } else if (filenameLower.endsWith(".mov")) {
            return "video/quicktime";
        } else if (filenameLower.endsWith(".avi")) {
            return "video/x-msvideo";
        } else if (filenameLower.endsWith(".mkv")) {
            return "video/x-matroska";
        }

        return MediaType.APPLICATION_OCTET_STREAM_VALUE;
    }
}
