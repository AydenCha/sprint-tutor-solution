package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.FileUpload;
import kr.codeit.onboarding.domain.entity.Instructor;
import kr.codeit.onboarding.domain.entity.OnboardingStep;
import kr.codeit.onboarding.domain.entity.Task;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import kr.codeit.onboarding.dto.FileUploadResponse;
import kr.codeit.onboarding.exception.ResourceNotFoundException;
import kr.codeit.onboarding.repository.FileUploadRepository;
import kr.codeit.onboarding.repository.InstructorRepository;
import kr.codeit.onboarding.repository.OnboardingStepRepository;
import kr.codeit.onboarding.repository.TaskRepository;
import kr.codeit.onboarding.security.SecurityContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class FileUploadService {

    private final FileUploadRepository fileUploadRepository;
    private final TaskRepository taskRepository;
    private final InstructorRepository instructorRepository;
    private final OnboardingStepRepository stepRepository;
    private final InstructorService instructorService;
    private final kr.codeit.onboarding.security.SecurityContext securityContext;
    private final S3Service s3Service;

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    @Value("${app.s3.enabled:false}")
    private boolean s3Enabled;

    // Allowed file extensions for security
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            // Documents
            ".pdf", ".doc", ".docx", ".txt", ".md",
            // Images
            ".jpg", ".jpeg", ".png", ".gif", ".svg",
            // Videos
            ".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv", ".flv", ".wmv",
            // Archives
            ".zip", ".tar", ".gz",
            // Spreadsheets
            ".xls", ".xlsx", ".csv",
            // Presentations
            ".ppt", ".pptx",
            // Code files (for coding assignments)
            ".js", ".jsx", ".ts", ".tsx",
            ".java", ".py", ".rb", ".go",
            ".c", ".cpp", ".h", ".hpp",
            ".php", ".swift", ".kt", ".rs",
            ".html", ".css", ".scss", ".sass",
            ".json", ".xml", ".yml", ".yaml",
            ".sh", ".bat", ".sql"
    );

    // Maximum file size (200MB for videos, 50MB for others)
    private static final long MAX_FILE_SIZE = 200 * 1024 * 1024;
    private static final Set<String> VIDEO_EXTENSIONS = Set.of(
            ".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv", ".flv", ".wmv"
    );

    @Transactional
    public FileUploadResponse uploadFile(Long taskId, MultipartFile file) throws IOException {
        // Get instructor ID from authenticated user (prevents IDOR vulnerability)
        Long instructorId = instructorService.getCurrentInstructorId();

        // Validate file is not null or empty
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일을 선택해주세요.");
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            long fileSizeMB = file.getSize() / (1024 * 1024);
            throw new IllegalArgumentException(String.format("파일 크기가 너무 큽니다. (현재: %dMB, 최대: 50MB)", fileSizeMB));
        }

        // Validate file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("파일명이 유효하지 않습니다.");
        }

        String fileExtension = "";
        if (originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(fileExtension)) {
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다. (" + fileExtension + ") 허용된 형식: " + ALLOWED_EXTENSIONS);
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Instructor instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        // Generate unique filename with secure random UUID
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
        String storagePath;

        // Save file based on storage configuration
        if (s3Enabled) {
            // Upload to S3
            String s3Key = "uploads/" + uniqueFilename;
            storagePath = s3Service.uploadFile(file, s3Key);
            log.info("File uploaded to S3: {} -> {}, size: {}KB, instructorId: {}", 
                originalFilename, storagePath, file.getSize() / 1024, instructorId);
        } else {
            // Upload to local/Railway volume storage
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("Created upload directory: {}", uploadPath);
            }

            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            storagePath = filePath.toString();
            log.info("File uploaded to local storage: {} -> {}, size: {}KB, instructorId: {}, taskId: {}", 
                originalFilename, storagePath, file.getSize() / 1024, instructorId, taskId);
        }

        // Create file upload record
        FileUpload fileUpload = FileUpload.builder()
                .task(task)
                .instructor(instructor)
                .fileName(originalFilename)
                .filePath(storagePath)
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .uploadedAt(LocalDateTime.now())
                .build();

        fileUpload = fileUploadRepository.save(fileUpload);

        // Check if all required files are uploaded
        List<FileUpload> uploads = fileUploadRepository.findByTaskIdAndInstructorId(taskId, instructorId);
        if (task.getRequiredFiles() != null && uploads.size() >= task.getRequiredFiles().size()) {
            task.setStatus(TaskStatus.COMPLETED);
            taskRepository.save(task);

            // Update step progress
            OnboardingStep step = task.getStep();
            step.updateProgress();
            stepRepository.save(step);
        }

        return toFileUploadResponse(fileUpload);
    }

    @Transactional
    public void deleteFile(Long fileId) throws IOException {
        // Get instructor ID from authenticated user (prevents IDOR vulnerability)
        Long instructorId = instructorService.getCurrentInstructorId();

        FileUpload fileUpload = fileUploadRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));

        // Verify ownership
        if (!fileUpload.getInstructor().getId().equals(instructorId)) {
            throw new kr.codeit.onboarding.exception.UnauthorizedException("You can only delete your own files");
        }

        // Delete physical file based on storage configuration
        if (s3Enabled && fileUpload.getFilePath().startsWith("http")) {
            // S3 file: extract key from URL
            String s3Key = fileUpload.getFilePath().substring(fileUpload.getFilePath().lastIndexOf("/uploads/") + 1);
            s3Service.deleteFile(s3Key);
        } else {
            // Local/Railway volume file
            Path filePath = Paths.get(fileUpload.getFilePath());
            Files.deleteIfExists(filePath);
        }

        // Delete database record
        fileUploadRepository.delete(fileUpload);
    }

    public byte[] getFileContent(Long fileId) throws IOException {
        FileUpload fileUpload = fileUploadRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));

        // Authorization: Only the file owner (instructor) or PM can download
        String downloadedBy = "Unknown";
        if (securityContext.isInstructor()) {
            Long currentInstructorId = instructorService.getCurrentInstructorId();
            if (!fileUpload.getInstructor().getId().equals(currentInstructorId)) {
                throw new kr.codeit.onboarding.exception.UnauthorizedException("You can only access your own files");
            }
            downloadedBy = "Instructor-" + currentInstructorId;
        } else if (securityContext.isPm()) {
            downloadedBy = "PM";
        }

        // Download file based on storage configuration
        byte[] fileContent;
        if (s3Enabled && fileUpload.getFilePath().startsWith("http")) {
            // S3 file: extract key from URL
            String s3Key = fileUpload.getFilePath().substring(fileUpload.getFilePath().lastIndexOf("/uploads/") + 1);
            fileContent = s3Service.downloadFile(s3Key);
            log.info("File downloaded from S3: fileId={}, fileName={}, size={}KB, downloadedBy={}", 
                fileId, fileUpload.getFileName(), fileContent.length / 1024, downloadedBy);
        } else {
            // Local/Railway volume file
            Path filePath = Paths.get(fileUpload.getFilePath());
            if (!Files.exists(filePath)) {
                log.error("File not found on disk: fileId={}, filePath={}", fileId, filePath);
                throw new ResourceNotFoundException("파일이 저장소에 존재하지 않습니다: " + filePath + ". 파일이 삭제되었거나 이동되었을 수 있습니다.");
            }
            fileContent = Files.readAllBytes(filePath);
            log.info("File downloaded from local storage: fileId={}, fileName={}, filePath={}, size={}KB, downloadedBy={}", 
                fileId, fileUpload.getFileName(), filePath, fileContent.length / 1024, downloadedBy);
        }
        
        return fileContent;
    }

    public FileUpload getFileMetadata(Long fileId) {
        FileUpload fileUpload = fileUploadRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));

        // Authorization: Only the file owner (instructor) or PM can view metadata
        if (securityContext.isInstructor()) {
            Long currentInstructorId = instructorService.getCurrentInstructorId();
            if (!fileUpload.getInstructor().getId().equals(currentInstructorId)) {
                throw new kr.codeit.onboarding.exception.UnauthorizedException("You can only access your own files");
            }
        }
        // PM can access any file metadata

        return fileUpload;
    }

    /**
     * Get all files uploaded by instructors for a specific task (PM only)
     */
    @Transactional(readOnly = true)
    public List<FileUploadResponse> getFilesByTask(Long taskId) {
        securityContext.requirePm(); // Only PM can view all files for a task
        
        // Verify task exists
        taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        List<FileUpload> uploads = fileUploadRepository.findByTaskId(taskId);
        return uploads.stream()
                .map(this::toFileUploadResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Check if file actually exists on storage (Railway volume or S3)
     */
    public boolean fileExists(Long fileId) {
        try {
            FileUpload fileUpload = fileUploadRepository.findById(fileId)
                    .orElseThrow(() -> new ResourceNotFoundException("File not found"));
            
            if (s3Enabled && fileUpload.getFilePath().startsWith("http")) {
                // S3 file: assume exists if metadata exists (S3 check would require additional API call)
                return true;
            } else {
                // Local/Railway volume file
                Path filePath = Paths.get(fileUpload.getFilePath());
                return Files.exists(filePath) && Files.isRegularFile(filePath);
            }
        } catch (Exception e) {
            log.error("Error checking file existence: fileId={}, error={}", fileId, e.getMessage());
            return false;
        }
    }

    private FileUploadResponse toFileUploadResponse(FileUpload upload) {
        return FileUploadResponse.builder()
                .id(upload.getId())
                .fileName(upload.getFileName())
                .url("/api/files/" + upload.getId())
                .fileSize(upload.getFileSize())
                .uploadedAt(upload.getUploadedAt())
                .build();
    }
}
