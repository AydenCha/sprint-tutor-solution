package kr.codeit.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackResponse {

    private Long id;
    private String name; // English name
    private String koreanName; // Korean name
    private String code; // Short code
    private Boolean enabled;
    private String description;
    private String createdAt;
    private String updatedAt;
}

