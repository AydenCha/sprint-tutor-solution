package kr.codeit.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TrackRequest {

    @NotBlank(message = "Track name (English) is required")
    private String name; // English name (e.g., "FRONTEND")

    @NotBlank(message = "Track name (Korean) is required")
    private String koreanName; // Korean name (e.g., "프론트엔드")

    @NotBlank(message = "Track code is required")
    private String code; // Short code (e.g., "FE", "BE")

    private String description; // Track description

    @jakarta.validation.constraints.NotNull(message = "Enabled status is required")
    private Boolean enabled = true;
}

