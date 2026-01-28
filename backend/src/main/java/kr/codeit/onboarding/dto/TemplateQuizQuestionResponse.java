package kr.codeit.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateQuizQuestionResponse {

    private Long id;
    private String question;
    private List<String> options;
    private Integer correctAnswer;
}
