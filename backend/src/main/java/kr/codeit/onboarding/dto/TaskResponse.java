package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.codeit.onboarding.domain.enums.ContentType;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for a task with type-specific content.
 * <p>
 * Tasks can be one of four content types:
 * <ul>
 *   <li>Type A: Document + Quiz (documentUrl, documentContent, quizQuestions)</li>
 *   <li>Type B: Video + Quiz (videoUrl, videoDuration, quizQuestions)</li>
 *   <li>Type C: File Upload (requiredFiles, uploadedFiles)</li>
 *   <li>Type D: Checklist (checklistItems)</li>
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
@Schema(description = "Task with type-specific content and progress")
public class TaskResponse {

    @Schema(description = "Task ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long id;

    @Schema(description = "Task title", example = "Slack 가입하기", requiredMode = Schema.RequiredMode.REQUIRED)
    private String title;

    @Schema(description = "Task description", example = "팀 커뮤니케이션을 위한 Slack 계정을 생성합니다", nullable = true)
    private String description;

    @Schema(description = "Content type", example = "TYPE_A", requiredMode = Schema.RequiredMode.REQUIRED)
    private ContentType contentType;

    @Schema(description = "Task status", example = "IN_PROGRESS", requiredMode = Schema.RequiredMode.REQUIRED)
    private TaskStatus status;

    @Schema(description = "Whether this task is enabled for the instructor", example = "true", requiredMode = Schema.RequiredMode.REQUIRED)
    private Boolean isEnabled;

    // === Type A: Document + Quiz ===

    @Schema(description = "Document URL (Type A)", example = "https://docs.example.com/guide", nullable = true)
    private String documentUrl;

    @Schema(description = "Document markdown content (Type A)", example = "# Guide\n\nWelcome...", nullable = true)
    private String documentContent;

    @Schema(description = "Quiz questions (Type A, B)", nullable = true)
    private List<QuizQuestionResponse> quizQuestions;

    // === Type B: Video + Quiz ===

    @Schema(description = "Video URL (Type B)", example = "https://video.example.com/intro.mp4", nullable = true)
    private String videoUrl;

    @Schema(description = "Video duration in seconds (Type B)", example = "300", nullable = true)
    private Integer videoDuration;

    // === Type C: File Upload ===

    @Schema(description = "Required file specifications (Type C)", nullable = true)
    private List<FileRequirement> requiredFiles;

    @Schema(description = "Files uploaded by instructor (Type C)", nullable = true)
    private List<FileUploadResponse> uploadedFiles;

    // === Type D: Checklist ===

    @Schema(description = "Checklist items (Type D)", nullable = true)
    private List<ChecklistItemResponse> checklistItems;
}
