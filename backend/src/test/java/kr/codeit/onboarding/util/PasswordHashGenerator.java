package kr.codeit.onboarding.util;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {

    @Test
    public void generatePasswordHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // Generate hash for password123
        String password = "password123";
        String hash = encoder.encode(password);

        System.out.println("========================================");
        System.out.println("Password: " + password);
        System.out.println("BCrypt Hash: " + hash);
        System.out.println("========================================");

        // Verify it works
        boolean matches = encoder.matches(password, hash);
        System.out.println("Verification test: " + (matches ? "PASS" : "FAIL"));

        // Test with the hash from init_sample_data.sql
        String sampleDataHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
        boolean matchesSampleData = encoder.matches(password, sampleDataHash);
        System.out.println("Sample data hash matches 'password123': " + (matchesSampleData ? "YES" : "NO"));
        
        // If it doesn't match, generate a new one
        if (!matchesSampleData) {
            System.out.println("\n⚠️  WARNING: Sample data hash doesn't match 'password123'");
            System.out.println("Use this new hash instead:");
            System.out.println("UPDATE users SET password_hash = '" + hash + "' WHERE email = 'pm@codeit.com';");
        }

        // Test with admin123 for reference
        String adminPassword = "admin123";
        boolean matchesAdmin = encoder.matches(adminPassword, sampleDataHash);
        System.out.println("Sample data hash matches 'admin123': " + (matchesAdmin ? "YES" : "NO"));
    }
}
