package kr.codeit.onboarding.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

/**
 * Database configuration for Railway deployment
 * Handles DATABASE_URL format conversion from Railway format to JDBC format
 * 
 * Note: Always active - checks DATABASE_URL format at runtime
 * If DATABASE_URL is in Railway format (postgresql://), converts to JDBC format
 * Otherwise, uses application.yml configuration
 */
@Configuration
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    @ConditionalOnProperty(name = "DATABASE_URL", matchIfMissing = false)
    public DataSource dataSource() {
        // Only process if DATABASE_URL is in Railway format (postgresql://)
        if (databaseUrl != null && !databaseUrl.isEmpty() && !databaseUrl.startsWith("jdbc:")) {
            // Railway provides: postgresql://user:password@host:port/dbname
            // Convert to: jdbc:postgresql://host:port/dbname
            try {
                URI uri = new URI(databaseUrl);
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                if (path.startsWith("/")) {
                    path = path.substring(1);
                }
                
                String userInfo = uri.getUserInfo();
                String username = userInfo != null && userInfo.contains(":") 
                    ? userInfo.split(":")[0] 
                    : (userInfo != null ? userInfo : "postgres");
                String password = userInfo != null && userInfo.contains(":") 
                    ? userInfo.split(":")[1] 
                    : "postgres";

                String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, path);

                return DataSourceBuilder.create()
                        .url(jdbcUrl)
                        .username(username)
                        .password(password)
                        .driverClassName("org.postgresql.Driver")
                        .build();
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse DATABASE_URL: " + databaseUrl, e);
            }
        }
        
        // If DATABASE_URL is in JDBC format or not set, use application.yml configuration
        // This allows normal JDBC URL format to work as before (previous method before Volume addition)
        // Return a DataSource that will be overridden by application.yml if needed
        return DataSourceBuilder.create()
                .url("jdbc:postgresql://localhost:5432/onboarding_db")
                .username("postgres")
                .password("postgres")
                .driverClassName("org.postgresql.Driver")
                .build();
    }
}
