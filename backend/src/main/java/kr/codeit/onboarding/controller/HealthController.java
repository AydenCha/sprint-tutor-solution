package kr.codeit.onboarding.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * REST Controller for Application Health Monitoring.
 *
 * <p>This controller provides health check endpoints for monitoring and deployment platforms:</p>
 * <ul>
 *   <li>Basic health status endpoint</li>
 *   <li>Deployment verification</li>
 *   <li>Load balancer health checks</li>
 *   <li>Container orchestration readiness probes</li>
 * </ul>
 *
 * <p>The health endpoint is publicly accessible without authentication to allow infrastructure
 * monitoring tools to verify application availability.</p>
 *
 * <p>Note: With context-path configured as /api, this endpoint is accessible at /api/health</p>
 *
 * @author Sprint Tutor Flow Team
 * @since 1.0
 */
@RestController
public class HealthController {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Health check endpoint for application monitoring.
     *
     * <p>Returns the application health status. This endpoint is used by:</p>
     * <ul>
     *   <li>Railway deployment platform for health monitoring</li>
     *   <li>Load balancers for traffic routing decisions</li>
     *   <li>Container orchestrators (Kubernetes, Docker Swarm) for readiness checks</li>
     *   <li>Monitoring tools for uptime verification</li>
     * </ul>
     *
     * <p>The endpoint returns HTTP 200 with status "UP" when the application is healthy
     * and ready to accept requests. Additional metadata includes server timestamp.</p>
     *
     * <p>Public access - no authentication required.</p>
     *
     * @return ResponseEntity containing health status and metadata
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> healthStatus = new LinkedHashMap<>();
        healthStatus.put("status", "UP");
        healthStatus.put("timestamp", LocalDateTime.now().format(ISO_FORMATTER));
        healthStatus.put("service", "Sprint Tutor Flow API");

        return ResponseEntity.ok(healthStatus);
    }
}
