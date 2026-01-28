package kr.codeit.onboarding.dto;

import kr.codeit.onboarding.domain.enums.ContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateTaskResponse {

    private Long id;
    private String title;
    private String description;
    private ContentType contentType;

    // Type A: Document + Quiz
    private String documentUrl;
    private List<TemplateQuizQuestionResponse> quizQuestions;

    // Type B: Video + Quiz
    private String videoUrl;
    private Integer videoDuration;

    // Type C: File Upload
    private List<FileRequirement> requiredFiles;

    // Type D: Checklist
    private List<TemplateChecklistItemResponse> checklistItems;
}
