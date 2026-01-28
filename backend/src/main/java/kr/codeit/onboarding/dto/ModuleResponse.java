package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.codeit.onboarding.domain.enums.ContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for a module with all content details.
 * <p>
 * Contains complete module information including type-specific content fields,
 * associated step definition, and audit metadata.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Module details with content and metadata")
public class ModuleResponse {

    @Schema(description = "Module ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long id;

    @Schema(description = "Module name", example = "Slack 사용법 가이드", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "Module description", example = "Slack 기본 기능과 채널 사용법을 학습합니다", nullable = true)
    private String description;

    @Schema(description = "Content type", example = "TYPE_A", requiredMode = Schema.RequiredMode.REQUIRED)
    private ContentType contentType;

    // === Type A: Document + Quiz ===

    @Schema(description = "External document URL (Type A)", example = "https://docs.example.com/guide", nullable = true)
    private String documentUrl;

    @Schema(description = "Markdown document content (Type A)", nullable = true)
    private String documentContent;

    // === Type B: Video + Quiz ===

    @Schema(description = "Video URL - external link or access path (Type B)", example = "https://www.youtube.com/watch?v=xyz", nullable = true)
    private String videoUrl;

    @Schema(description = "Stored filename for uploaded videos (Type B)", example = "video_20240115_abc123.mp4", nullable = true)
    private String videoStoredFileName;

    @Schema(description = "Video duration in seconds (Type B)", example = "420", nullable = true)
    private Integer videoDuration;

    // === Type C: File Upload ===

    @Schema(description = "File upload requirements (Type C)", nullable = true)
    private List<FileRequirement> requiredFiles;

    // === Quiz and Checklist ===

    @Schema(description = "Quiz questions (Type A, B)", nullable = true)
    private List<QuizQuestionResponse> quizQuestions;

    @Schema(description = "Checklist items (Type D)", nullable = true)
    private List<ChecklistItemResponse> checklistItems;

    // === Metadata ===

    @Schema(description = "Tags", example = "[\"communication\", \"tools\"]", nullable = true)
    private List<String> tags;

    @Schema(description = "Associated step definition ID", example = "1", nullable = true)
    private Long stepDefinitionId;

    @Schema(description = "Associated step definition title", example = "계정 준비하기", nullable = true)
    private String stepDefinitionTitle;

    @Schema(description = "Creator's name", example = "PM User", nullable = true)
    private String createdBy;

    @Schema(description = "Creation timestamp", example = "2024-01-15T10:30:00", nullable = true)
    private String createdAt;
}


