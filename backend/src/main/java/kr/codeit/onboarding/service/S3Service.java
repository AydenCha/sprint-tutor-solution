package kr.codeit.onboarding.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * AWS S3 Service
 * Handles file upload, download, and deletion from S3
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    @Value("${app.s3.enabled:false}")
    private boolean s3Enabled;

    @Value("${app.s3.bucket-name:}")
    private String bucketName;

    @Value("${app.s3.region:ap-northeast-2}")
    private String region;

    @Value("${app.s3.access-key:}")
    private String accessKey;

    @Value("${app.s3.secret-key:}")
    private String secretKey;

    @Value("${app.s3.base-url:}")
    private String baseUrl;

    private S3Client s3Client;

    @PostConstruct
    public void init() {
        if (!s3Enabled) {
            log.info("S3 is disabled. Using local file storage.");
            return;
        }

        if (bucketName == null || bucketName.isBlank()) {
            log.warn("S3 is enabled but bucket-name is not configured. Falling back to local storage.");
            return;
        }

        try {
            // Initialize S3 client
            AwsBasicCredentials awsCreds = AwsBasicCredentials.create(
                    accessKey != null && !accessKey.isBlank() ? accessKey : "",
                    secretKey != null && !secretKey.isBlank() ? secretKey : ""
            );

            s3Client = S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                    .build();

            // Test connection
            HeadBucketRequest headBucketRequest = HeadBucketRequest.builder()
                    .bucket(bucketName)
                    .build();
            s3Client.headBucket(headBucketRequest);

            log.info("S3 client initialized successfully. Bucket: {}, Region: {}", bucketName, region);
        } catch (Exception e) {
            log.error("Failed to initialize S3 client. Falling back to local storage.", e);
            s3Client = null;
        }
    }

    @PreDestroy
    public void cleanup() {
        if (s3Client != null) {
            s3Client.close();
        }
    }

    /**
     * Check if S3 is enabled and configured
     */
    public boolean isEnabled() {
        return s3Enabled && s3Client != null && bucketName != null && !bucketName.isBlank();
    }

    /**
     * Upload file to S3
     *
     * @param file MultipartFile to upload
     * @param key S3 object key (path in bucket)
     * @return Public URL of uploaded file
     * @throws IOException if upload fails
     */
    public String uploadFile(MultipartFile file, String key) throws IOException {
        if (!isEnabled()) {
            throw new IllegalStateException("S3 is not enabled or not properly configured");
        }

        try {
            // Determine content type
            String contentType = file.getContentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = "application/octet-stream";
            }

            // Upload file
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType)
                    .acl(ObjectCannedACL.PUBLIC_READ) // Make file publicly readable
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // Generate public URL
            String url = getPublicUrl(key);
            log.info("File uploaded to S3: {} -> {}", key, url);

            return url;
        } catch (Exception e) {
            log.error("Failed to upload file to S3: {}", key, e);
            throw new IOException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }

    /**
     * Download file from S3
     *
     * @param key S3 object key
     * @return File content as byte array
     * @throws IOException if download fails
     */
    public byte[] downloadFile(String key) throws IOException {
        if (!isEnabled()) {
            throw new IllegalStateException("S3 is not enabled or not properly configured");
        }

        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            byte[] fileContent = s3Client.getObjectAsBytes(getObjectRequest).asByteArray();
            log.info("File downloaded from S3: {}", key);
            return fileContent;
        } catch (Exception e) {
            log.error("Failed to download file from S3: {}", key, e);
            throw new IOException("Failed to download file from S3: " + e.getMessage(), e);
        }
    }

    /**
     * Delete file from S3
     *
     * @param key S3 object key
     */
    public void deleteFile(String key) {
        if (!isEnabled()) {
            return;
        }

        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("File deleted from S3: {}", key);
        } catch (Exception e) {
            log.error("Failed to delete file from S3: {}", key, e);
        }
    }

    /**
     * Get public URL for S3 object
     *
     * @param key S3 object key
     * @return Public URL
     */
    public String getPublicUrl(String key) {
        if (baseUrl != null && !baseUrl.isBlank()) {
            // Use custom base URL if provided
            return baseUrl.endsWith("/") ? baseUrl + key : baseUrl + "/" + key;
        }

        // Auto-generate URL from bucket name and region
        String encodedKey = URLEncoder.encode(key, StandardCharsets.UTF_8).replace("+", "%20");
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, encodedKey);
    }

    /**
     * Check if file exists in S3
     *
     * @param key S3 object key
     * @return true if file exists
     */
    public boolean fileExists(String key) {
        if (!isEnabled()) {
            return false;
        }

        try {
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.headObject(headObjectRequest);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.error("Failed to check file existence in S3: {}", key, e);
            return false;
        }
    }
}
