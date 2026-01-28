package kr.codeit.onboarding.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class TemplateStepRequest {

    @NotNull(message = "Step number is required")
    private Integer stepNumber;

    @NotBlank(message = "Step title is required")
    private String title;

    private String emoji;

    @JsonProperty("dDay")
    @NotNull(message = "D-day is required")
    private Integer dDay;

    private String description;

    @NotEmpty(message = "At least one task is required")
    @Valid
    private List<TemplateTaskRequest> tasks;
}
