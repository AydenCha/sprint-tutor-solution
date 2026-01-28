package kr.codeit.onboarding.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class TemplateQuizQuestionRequest {

    @NotBlank(message = "Question is required")
    private String question;

    @NotEmpty(message = "At least one option is required")
    @Size(min = 2, max = 6, message = "Must have between 2 and 6 options")
    private List<String> options;

    @NotNull(message = "Correct answer is required")
    @Min(value = 0, message = "Correct answer must be a valid option index")
    private Integer correctAnswer;
}
