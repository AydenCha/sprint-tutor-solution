package kr.codeit.onboarding.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import kr.codeit.onboarding.domain.enums.ContentType;
import lombok.Data;

import java.util.List;

@Data
public class TemplateTaskRequest {

    @NotBlank(message = "Task title is required")
    private String title;

    private String description;

    @NotNull(message = "Content type is required")
    private ContentType contentType;

    // Type A: Document + Quiz
    private String documentUrl;

    // Type B: Video + Quiz
    private String videoUrl;
    private Integer videoDuration;

    // Type C: File Upload
    private List<FileRequirement> requiredFiles;

    // Quiz questions (for types A, B)
    @Valid
    private List<TemplateQuizQuestionRequest> quizQuestions;

    // Checklist items (for type D)
    @Valid
    private List<TemplateChecklistItemRequest> checklistItems;
}
