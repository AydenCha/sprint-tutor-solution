package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import kr.codeit.onboarding.domain.enums.ContentType;
import kr.codeit.onboarding.dto.FileRequirement;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;

/**
 * ContentModule entity representing a reusable onboarding content module.
 *
 * <p>Content modules are the building blocks of the onboarding system, designed to be
 * composable like LEGO blocks. PMs create these minimal unit modules and combine them
 * to construct complete onboarding paths.
 *
 * <p>Each module can contain:
 * <ul>
 *   <li>Type A: Document + Quiz</li>
 *   <li>Type B: Video + Quiz</li>
 *   <li>Type C: File Upload Requirements</li>
 * </ul>
 *
 * <p>Modules support:
 * <ul>
 *   <li>Tagging for search and categorization</li>
 *   <li>Quiz questions and checklist items</li>
 *   <li>Reusability across multiple step templates</li>
 * </ul>
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "content_modules", indexes = {
    @Index(name = "idx_module_created_by", columnList = "created_by_pm_id"),
    @Index(name = "idx_module_content_type", columnList = "content_type"),
    @Index(name = "idx_module_step_definition", columnList = "step_definition_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentModule extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Module name for identification.
     */
    @NotBlank(message = "Module name is required")
    @Column(nullable = false, length = 255)
    private String name;

    /**
     * Detailed description of the module's purpose and content.
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Type of content in this module (DOCUMENT_QUIZ, VIDEO_QUIZ, FILE_UPLOAD).
     */
    @NotNull(message = "Content type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 30)
    private ContentType contentType;

    /**
     * PM user who created this module.
     */
    @NotNull(message = "Creator is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_pm_id", nullable = false)
    private User createdBy;

    /**
     * Step definition this module belongs to (REQUIRED).
     * Modules are strictly owned by a step definition.
     * When a step definition is deleted, all associated modules are also deleted (CASCADE).
     * This creates a strong coupling relationship.
     */
    @NotNull(message = "Step definition is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_definition_id", nullable = false)
    private StepDefinition stepDefinition;

    // Type A: Document + Quiz
    /**
     * URL to external document resource.
     * Used for document-based learning modules.
     */
    @Column(name = "document_url", length = 500)
    private String documentUrl;

    /**
     * Embedded document content.
     * Stored directly in the database for self-contained modules.
     */
    @Column(name = "document_content", columnDefinition = "TEXT")
    private String documentContent;

    // Type B: Video + Quiz
    /**
     * URL to video content.
     * Can be external link (YouTube, Vimeo) or internal path.
     * For local uploads, format: /api/files/videos/{videoStoredFileName}
     */
    @Column(name = "video_url", length = 500)
    private String videoUrl;

    /**
     * Stored filename of uploaded video.
     * References file in server filesystem or cloud storage (e.g., S3).
     * Example: "uuid-generated-name.mp4"
     */
    @Column(name = "video_stored_filename", length = 255)
    private String videoStoredFileName;

    /**
     * Video duration in seconds.
     * Used for progress tracking and time estimation.
     */
    @Column(name = "video_duration")
    private Integer videoDuration;

    // Type C: File Upload
    /**
     * File upload requirements for file upload modules.
     * Defines conditions for files instructors must submit
     * (e.g., placeholders, file extensions, size limits).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "required_files", columnDefinition = "json")
    private List<FileRequirement> requiredFiles;

    /**
     * Quiz questions attached to this module.
     */
    @OneToMany(mappedBy = "contentModule", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ModuleQuizQuestion> quizQuestions = new ArrayList<>();

    /**
     * Checklist items attached to this module.
     */
    @OneToMany(mappedBy = "contentModule", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ModuleChecklistItem> checklistItems = new ArrayList<>();

    /**
     * Tags for search and categorization.
     * Helps PMs find and organize modules efficiently.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "json")
    private List<String> tags;

    /**
     * Adds a quiz question to this module.
     * Maintains bidirectional relationship consistency.
     *
     * @param question the quiz question to add
     */
    public void addQuizQuestion(ModuleQuizQuestion question) {
        if (question != null) {
            quizQuestions.add(question);
            question.setContentModule(this);
        }
    }

    /**
     * Removes a quiz question from this module.
     * Maintains bidirectional relationship consistency.
     *
     * @param question the quiz question to remove
     */
    public void removeQuizQuestion(ModuleQuizQuestion question) {
        if (question != null) {
            quizQuestions.remove(question);
            question.setContentModule(null);
        }
    }

    /**
     * Adds a checklist item to this module.
     * Maintains bidirectional relationship consistency.
     *
     * @param item the checklist item to add
     */
    public void addChecklistItem(ModuleChecklistItem item) {
        if (item != null) {
            checklistItems.add(item);
            item.setContentModule(this);
        }
    }

    /**
     * Removes a checklist item from this module.
     * Maintains bidirectional relationship consistency.
     *
     * @param item the checklist item to remove
     */
    public void removeChecklistItem(ModuleChecklistItem item) {
        if (item != null) {
            checklistItems.remove(item);
            item.setContentModule(null);
        }
    }

    /**
     * Checks if this module is a document-based module.
     *
     * @return true if the content type is DOCUMENT_QUIZ
     */
    public boolean isDocumentModule() {
        return contentType == ContentType.A;
    }

    /**
     * Checks if this module is a video-based module.
     *
     * @return true if the content type is VIDEO_QUIZ
     */
    public boolean isVideoModule() {
        return contentType == ContentType.B;
    }

    /**
     * Checks if this module is a file upload module.
     *
     * @return true if the content type is FILE_UPLOAD
     */
    public boolean isFileUploadModule() {
        return contentType == ContentType.C;
    }

    /**
     * Checks if this module has quiz questions.
     *
     * @return true if the module has at least one quiz question
     */
    public boolean hasQuizQuestions() {
        return !quizQuestions.isEmpty();
    }

    /**
     * Checks if this module has checklist items.
     *
     * @return true if the module has at least one checklist item
     */
    public boolean hasChecklistItems() {
        return !checklistItems.isEmpty();
    }

    /**
     * Checks if this module has a specific tag.
     *
     * @param tag the tag to check
     * @return true if the module is tagged with the specified tag
     */
    public boolean hasTag(String tag) {
        return tags != null && tags.contains(tag);
    }

    /**
     * Adds a tag to this module if not already present.
     *
     * @param tag the tag to add
     */
    public void addTag(String tag) {
        if (tag != null && !tag.isBlank()) {
            if (this.tags == null) {
                this.tags = new ArrayList<>();
            }
            if (!this.tags.contains(tag)) {
                this.tags.add(tag);
            }
        }
    }

    /**
     * Removes a tag from this module.
     *
     * @param tag the tag to remove
     */
    public void removeTag(String tag) {
        if (this.tags != null) {
            this.tags.remove(tag);
        }
    }
}
