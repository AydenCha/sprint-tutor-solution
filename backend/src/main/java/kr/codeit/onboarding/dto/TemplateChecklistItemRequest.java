package kr.codeit.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TemplateChecklistItemRequest {

    @NotBlank(message = "Checklist item label is required")
    private String label;
}
