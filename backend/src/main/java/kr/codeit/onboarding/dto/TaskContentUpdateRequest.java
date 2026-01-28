package kr.codeit.onboarding.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for updating task content.
 * <p>
 * PM users can modify task details including title, description, and
 * type-specific content fields. This does not change the task's content type.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update task content (PM only)")
public class TaskContentUpdateRequest {

    public static final int MAX_TITLE_LENGTH = 255;
    public static final int MAX_DESCRIPTION_LENGTH = 2000;
    public static final int MIN_VIDEO_DURATION = 1;
    public static final int MAX_VIDEO_DURATION = 86400; // 24 hours in seconds

    @Schema(description = "Task title", example = "Slack 가입하기", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Title is required")
    @Size(max = MAX_TITLE_LENGTH, message = "Title must not exceed " + MAX_TITLE_LENGTH + " characters")
    private String title;

    @Schema(description = "Task description", example = "팀 커뮤니케이션을 위한 Slack 계정을 생성합니다", nullable = true)
    @Size(max = MAX_DESCRIPTION_LENGTH, message = "Description must not exceed " + MAX_DESCRIPTION_LENGTH + " characters")
    private String description;

    // === Type A: Document + Quiz ===

    @Schema(description = "Document URL (Type A)", example = "https://docs.example.com/guide", nullable = true)
    private String documentUrl;

    @Schema(description = "Document markdown content (Type A)", nullable = true)
    private String documentContent;

    // === Type B: Video + Quiz ===

    @Schema(description = "Video URL (Type B)", example = "https://video.example.com/intro.mp4", nullable = true)
    private String videoUrl;

    @Schema(description = "Video duration in seconds (Type B)", example = "300", nullable = true)
    @Min(value = MIN_VIDEO_DURATION, message = "Video duration must be at least " + MIN_VIDEO_DURATION + " second")
    private Integer videoDuration;

    // === Type C: File Upload ===

    @Schema(description = "Required file specifications (Type C)", nullable = true)
    @Valid
    private List<FileRequirement> requiredFiles;
}
