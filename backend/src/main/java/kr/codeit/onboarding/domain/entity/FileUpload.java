package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDateTime;

/**
 * FileUpload entity representing a file uploaded by an instructor for a task.
 *
 * <p>Tracks metadata about uploaded files including:
 * <ul>
 *   <li>File name and storage path</li>
 *   <li>File size and MIME type</li>
 *   <li>Upload timestamp</li>
 *   <li>Associated task and instructor</li>
 * </ul>
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "file_uploads", indexes = {
    @Index(name = "idx_file_upload_task_instructor", columnList = "task_id, instructor_id"),
    @Index(name = "idx_file_upload_instructor", columnList = "instructor_id"),
    @Index(name = "idx_file_upload_task", columnList = "task_id"),
    @Index(name = "idx_file_upload_uploaded_at", columnList = "uploaded_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileUpload extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The task this file upload is associated with.
     */
    @NotNull(message = "Task is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    /**
     * The instructor who uploaded this file.
     */
    @NotNull(message = "Instructor is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private Instructor instructor;

    /**
     * Original filename as provided by the user.
     */
    @NotBlank(message = "File name is required")
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /**
     * Storage path or identifier for the file.
     * Could be filesystem path, S3 key, or other storage identifier.
     */
    @NotBlank(message = "File path is required")
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    /**
     * File size in bytes.
     */
    @NotNull(message = "File size is required")
    @Positive(message = "File size must be positive")
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * MIME type of the uploaded file (e.g., "application/pdf", "image/png").
     */
    @Column(name = "mime_type", length = 100)
    private String mimeType;

    /**
     * Timestamp when the file was uploaded.
     */
    @NotNull(message = "Upload timestamp is required")
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    /**
     * Gets a human-readable file size string.
     *
     * @return formatted file size (e.g., "1.5 MB", "342 KB")
     */
    public String getFormattedFileSize() {
        if (fileSize == null) {
            return "0 B";
        }

        final long KB = 1024;
        final long MB = KB * 1024;
        final long GB = MB * 1024;

        if (fileSize >= GB) {
            return String.format("%.2f GB", fileSize / (double) GB);
        } else if (fileSize >= MB) {
            return String.format("%.2f MB", fileSize / (double) MB);
        } else if (fileSize >= KB) {
            return String.format("%.2f KB", fileSize / (double) KB);
        } else {
            return fileSize + " B";
        }
    }

    /**
     * Checks if the file is an image based on MIME type.
     *
     * @return true if the file is an image
     */
    public boolean isImage() {
        return mimeType != null && mimeType.startsWith("image/");
    }

    /**
     * Checks if the file is a PDF document.
     *
     * @return true if the file is a PDF
     */
    public boolean isPdf() {
        return "application/pdf".equals(mimeType);
    }

    /**
     * Checks if the file is a video.
     *
     * @return true if the file is a video
     */
    public boolean isVideo() {
        return mimeType != null && mimeType.startsWith("video/");
    }

    /**
     * Gets the file extension from the filename.
     *
     * @return file extension (without dot), or empty string if none
     */
    public String getFileExtension() {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }

    /**
     * Pre-persist hook to set upload time if not already set.
     */
    @PrePersist
    protected void onCreate() {
        if (uploadedAt == null) {
            uploadedAt = LocalDateTime.now();
        }
    }
}
