package kr.codeit.onboarding.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateStepResponse {

    private Long id;
    private Integer stepNumber;
    private String title;
    private String emoji;

    @JsonProperty("dDay")
    private Integer dDay;

    private String description;
    private List<TemplateTaskResponse> tasks;
}
