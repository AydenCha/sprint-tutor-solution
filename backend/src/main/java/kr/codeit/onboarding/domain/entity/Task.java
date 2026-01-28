package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import kr.codeit.onboarding.domain.enums.ContentType;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import kr.codeit.onboarding.dto.FileRequirement;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;

/**
 * Task entity representing a single task within an onboarding step.
 *
 * <p>Tasks can have different content types:
 * <ul>
 *   <li>Type A: Document + Quiz</li>
 *   <li>Type B: Video + Quiz</li>
 *   <li>Type C: File Upload</li>
 * </ul>
 *
 * <p>Each task may include quiz questions, checklist items, and file uploads
 * depending on its content type.
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "tasks", indexes = {
    @Index(name = "idx_task_step", columnList = "step_id"),
    @Index(name = "idx_task_status", columnList = "status"),
    @Index(name = "idx_task_content_type", columnList = "content_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The onboarding step this task belongs to.
     */
    @NotNull(message = "Step is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_id", nullable = false)
    private OnboardingStep step;

    /**
     * Task title displayed to the instructor.
     */
    @NotBlank(message = "Title is required")
    @Column(nullable = false, length = 255)
    private String title;

    /**
     * Detailed description of the task.
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Type of content for this task (DOCUMENT_QUIZ, VIDEO_QUIZ, FILE_UPLOAD).
     */
    @NotNull(message = "Content type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 30)
    private ContentType contentType;

    /**
     * Current status of the task (PENDING, IN_PROGRESS, COMPLETED, SKIPPED).
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TaskStatus status = TaskStatus.PENDING;

    // Type A: Document + Quiz
    /**
     * URL to external document (for document-based tasks).
     */
    @Column(name = "document_url", length = 500)
    private String documentUrl;

    /**
     * Embedded document content (for document-based tasks).
     */
    @Column(name = "document_content", columnDefinition = "TEXT")
    private String documentContent;

    // Type B: Video + Quiz
    /**
     * URL to video content (external link or internal path).
     */
    @Column(name = "video_url", length = 500)
    private String videoUrl;

    /**
     * Video duration in seconds.
     */
    @Column(name = "video_duration")
    private Integer videoDuration;

    // Type C: File Upload
    /**
     * List of file upload requirements for file upload tasks.
     * Defines what files the instructor needs to submit.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "required_files", columnDefinition = "json")
    private List<FileRequirement> requiredFiles;

    /**
     * Quiz questions associated with this task.
     */
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuizQuestion> quizQuestions = new ArrayList<>();

    /**
     * Checklist items associated with this task.
     */
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChecklistItem> checklistItems = new ArrayList<>();

    /**
     * File uploads submitted for this task.
     */
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FileUpload> fileUploads = new ArrayList<>();

    /**
     * Whether this task is enabled for the instructor.
     * Disabled tasks are not counted in progress calculations and
     * are not visible to the instructor.
     * Default value is true (enabled).
     */
    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private Boolean isEnabled = true;

    /**
     * Adds a quiz question to this task.
     * Maintains bidirectional relationship consistency.
     *
     * @param question the quiz question to add
     */
    public void addQuizQuestion(QuizQuestion question) {
        if (question != null) {
            quizQuestions.add(question);
            question.setTask(this);
        }
    }

    /**
     * Adds a checklist item to this task.
     * Maintains bidirectional relationship consistency.
     *
     * @param item the checklist item to add
     */
    public void addChecklistItem(ChecklistItem item) {
        if (item != null) {
            checklistItems.add(item);
            item.setTask(this);
        }
    }

    /**
     * Adds a file upload to this task.
     * Maintains bidirectional relationship consistency.
     *
     * @param upload the file upload to add
     */
    public void addFileUpload(FileUpload upload) {
        if (upload != null) {
            fileUploads.add(upload);
            upload.setTask(this);
        }
    }

    /**
     * Checks if this task is a document-based task.
     *
     * @return true if the content type is DOCUMENT_QUIZ
     */
    public boolean isDocumentTask() {
        return contentType == ContentType.A;
    }

    /**
     * Checks if this task is a video-based task.
     *
     * @return true if the content type is VIDEO_QUIZ
     */
    public boolean isVideoTask() {
        return contentType == ContentType.B;
    }

    /**
     * Checks if this task is a file upload task.
     *
     * @return true if the content type is FILE_UPLOAD
     */
    public boolean isFileUploadTask() {
        return contentType == ContentType.C;
    }

    /**
     * Checks if this task is completed.
     *
     * @return true if the status is COMPLETED
     */
    public boolean isCompleted() {
        return this.status == TaskStatus.COMPLETED;
    }

    /**
     * Checks if this task has quiz questions.
     *
     * @return true if the task has at least one quiz question
     */
    public boolean hasQuizQuestions() {
        return !quizQuestions.isEmpty();
    }

    /**
     * Checks if this task has checklist items.
     *
     * @return true if the task has at least one checklist item
     */
    public boolean hasChecklistItems() {
        return !checklistItems.isEmpty();
    }

    /**
     * Checks if this task is enabled.
     *
     * @return true if the task is enabled
     */
    public boolean isEnabled() {
        return this.isEnabled != null && this.isEnabled;
    }
}
