package kr.codeit.onboarding.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * Track entity representing an instructional track in the onboarding system.
 *
 * <p>Tracks categorize instructors by their specialization area
 * (e.g., Frontend, Backend, Design, Mobile).
 *
 * <p>Key features:
 * <ul>
 *   <li>Unique English and Korean names</li>
 *   <li>Short code for easy reference</li>
 *   <li>Enable/disable functionality</li>
 *   <li>Optional description</li>
 * </ul>
 *
 * @author Sprint Tutor Team
 */
@Entity
@Table(name = "tracks", indexes = {
    @Index(name = "idx_track_code", columnList = "code", unique = true),
    @Index(name = "idx_track_enabled", columnList = "enabled"),
    @Index(name = "idx_track_name", columnList = "name", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Track extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * English name of the track (e.g., "FRONTEND", "BACKEND").
     * Must be unique across all tracks.
     */
    @NotBlank(message = "Track name is required")
    @Column(nullable = false, unique = true, length = 100)
    private String name;

    /**
     * Korean name of the track (e.g., "프론트엔드", "백엔드").
     * Displayed in the Korean UI.
     */
    @NotBlank(message = "Korean name is required")
    @Column(name = "korean_name", nullable = false, length = 100)
    private String koreanName;

    /**
     * Short code for the track (e.g., "FE", "BE", "DESIGN").
     * Must be unique and is used for concise references.
     */
    @NotBlank(message = "Track code is required")
    @Column(nullable = false, unique = true, length = 20)
    private String code;

    /**
     * Whether this track is currently enabled.
     * Disabled tracks are hidden from instructor registration.
     */
    @NotNull(message = "Enabled status is required")
    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    /**
     * Optional description of the track.
     * Provides additional context about the track's focus and requirements.
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Checks if this track is active and available for use.
     *
     * @return true if the track is enabled
     */
    public boolean isActive() {
        return Boolean.TRUE.equals(enabled);
    }

    /**
     * Enables this track.
     */
    public void enable() {
        this.enabled = true;
    }

    /**
     * Disables this track.
     */
    public void disable() {
        this.enabled = false;
    }

    /**
     * Gets a display name combining code and Korean name.
     *
     * @return formatted display name (e.g., "[FE] 프론트엔드")
     */
    public String getDisplayName() {
        return String.format("[%s] %s", code, koreanName);
    }
}
