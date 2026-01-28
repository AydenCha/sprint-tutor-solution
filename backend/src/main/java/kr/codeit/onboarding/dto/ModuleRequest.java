package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import kr.codeit.onboarding.domain.enums.ContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for creating or updating a module.
 * <p>
 * Modules are reusable content units that can be assigned to tasks.
 * Each module has a specific content type (A, B, C, or D) with corresponding fields:
 * <ul>
 *   <li>Type A: Document + Quiz</li>
 *   <li>Type B: Video + Quiz</li>
 *   <li>Type C: File Upload Requirements</li>
 *   <li>Type D: Checklist</li>
 * </ul>
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create or update a module")
public class ModuleRequest {

    public static final int MAX_NAME_LENGTH = 255;
    public static final int MAX_DESCRIPTION_LENGTH = 2000;
    public static final int MIN_VIDEO_DURATION = 1;
    public static final int MAX_TAG_LENGTH = 50;

    @Schema(description = "Module name", example = "Slack 사용법 가이드", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Module name is required")
    @Size(max = MAX_NAME_LENGTH, message = "Name must not exceed " + MAX_NAME_LENGTH + " characters")
    private String name;

    @Schema(description = "Module description", example = "Slack 기본 기능과 채널 사용법을 학습합니다", nullable = true)
    @Size(max = MAX_DESCRIPTION_LENGTH, message = "Description must not exceed " + MAX_DESCRIPTION_LENGTH + " characters")
    private String description;

    @Schema(description = "Content type", example = "TYPE_A", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Content type is required")
    private ContentType contentType;

    // === Type A: Document + Quiz ===

    /**
     * Document URL for external resources (Type A).
     */
    @Schema(description = "External document URL (Type A)", example = "https://docs.example.com/guide", nullable = true)
    private String documentUrl;

    /**
     * Markdown content for inline documents (Type A).
     */
    @Schema(description = "Markdown document content (Type A)", nullable = true)
    private String documentContent;

    // === Type B: Video + Quiz ===

    /**
     * Video URL - external link (YouTube, Vimeo, etc.) or uploaded file path.
     * <p>
     * For file uploads, use separate API: /api/modules/{id}/upload-video
     */
    @Schema(description = "Video URL - external or uploaded (Type B)", example = "https://www.youtube.com/watch?v=xyz", nullable = true)
    private String videoUrl;

    /**
     * Video duration in seconds (Type B).
     */
    @Schema(description = "Video duration in seconds (Type B)", example = "420", nullable = true)
    @Min(value = MIN_VIDEO_DURATION, message = "Video duration must be at least " + MIN_VIDEO_DURATION + " second")
    private Integer videoDuration;

    // === Type C: File Upload ===

    /**
     * File upload requirements list (Type C).
     * <p>
     * Defines what files PM requires from the instructor.
     */
    @Schema(description = "File upload requirements (Type C)", nullable = true)
    @Valid
    private List<FileRequirement> requiredFiles;

    // === Quiz Questions (Type A, B) ===

    /**
     * Quiz questions for Types A and B.
     */
    @Schema(description = "Quiz questions (Type A, B)", nullable = true)
    @Valid
    private List<QuizQuestionRequest> quizQuestions;

    // === Checklist Items (Type D) ===

    /**
     * Checklist items for Type D.
     */
    @Schema(description = "Checklist items (Type D)", nullable = true)
    @Valid
    private List<ChecklistItemRequest> checklistItems;

    // === Additional Metadata ===

    /**
     * Tags for categorization and search.
     */
    @Schema(description = "Tags for categorization", example = "[\"communication\", \"tools\"]", nullable = true)
    private List<@Size(max = MAX_TAG_LENGTH) String> tags;

    /**
     * Step Definition ID - associates module with a specific step (OPTIONAL).
     * Modules can have a default step for grouping, but it's not required.
     * This allows modules to exist independently of step definitions.
     */
    @Schema(description = "Step definition ID (optional)", example = "1", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private Long stepDefinitionId;
}


