# Codeit Onboarding Backend

Spring Boot backend for the Codeit Sprint Instructor Onboarding Portal.

## Technology Stack

- Java 17
- Spring Boot 3.2.1
- Spring Data JPA
- Spring Security with JWT
- PostgreSQL 16
- Maven

## Prerequisites

- JDK 17 or later
- Maven 3.6+
- Docker and Docker Compose (for PostgreSQL)

## Local Development Setup

### 1. Start PostgreSQL Database

```bash
cd backend
docker-compose up -d
```

This will start a PostgreSQL instance on port 5432 with:
- Database: `onboarding_db`
- Username: `postgres` (default)
- Password: Configure in `docker-compose.yml` or environment variables

### 2. Build the Project

```bash
mvn clean install
```

### 3. Run the Application

```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080/api`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (PM or Instructor)

### Instructors
- `POST /api/instructors` - Register new instructor (PM only)
- `GET /api/instructors` - Get all instructors (PM only)
- `GET /api/instructors/{id}` - Get instructor with steps and tasks

### Tasks
- `PUT /api/tasks/{taskId}` - Update task status
- `POST /api/tasks/{taskId}/quiz-submit` - Submit quiz answers

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/{fileId}` - Download file
- `DELETE /api/files/{fileId}` - Delete file

### Checklist
- `PUT /api/checklist/{checklistItemId}` - Update checklist item

## Authentication

The API uses JWT-based authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Login Flow

**PM Login:**
```json
POST /api/auth/login
{
  "identifier": "pm@codeit.kr",
  "password": "your-password"
}
```

**Instructor Login:**
```json
POST /api/auth/login
{
  "identifier": "FE4-JWP1"
}
```

## Database Schema

The application uses the following main entities:
- `users` - User accounts (PM and Instructor)
- `instructors` - Instructor details
- `onboarding_steps` - 7 onboarding steps per instructor
- `tasks` - Tasks within each step (4 content types: A, B, C, D)
- `quiz_questions` - Quiz questions for Type A & B tasks
- `quiz_answers` - Instructor quiz submissions
- `checklist_items` - Checklist items for Type D tasks
- `instructor_checklist_items` - Instructor checklist progress
- `file_uploads` - Uploaded files for Type C tasks

## Configuration

Main configuration is in `src/main/resources/application.yml`:

- Database connection settings
- JWT secret and expiration
- File upload settings
- CORS configuration
- Logging levels

## File Uploads

Files are stored locally in the `./uploads` directory by default. This can be changed in `application.yml`:

```yaml
app:
  file:
    upload-dir: ./uploads
    max-size: 52428800 # 50MB
```

## Development Notes

### Creating a Test PM User

You'll need to manually create a PM user in the database:

```sql
INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
VALUES (
  'pm@codeit.kr',
  '$2a$10$XYZ...', -- BCrypt hash of your password
  'PM Admin',
  'PM',
  NOW(),
  NOW()
);
```

To generate a BCrypt hash, you can use online tools or run this Java code:

```java
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
String hash = encoder.encode("your-password");
System.out.println(hash);
```

### Registering an Instructor

Use the PM dashboard or POST to `/api/instructors` with:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "010-1234-5678",
  "track": "FRONTEND",
  "cohort": "4기",
  "startDate": "2026-02-01"
}
```

The system will auto-generate an access code (e.g., `FE4-JD1`).

## AWS Deployment (Future)

For AWS deployment, consider:
- **Compute**: AWS ECS with Fargate or EC2
- **Database**: Amazon RDS for PostgreSQL
- **File Storage**: Amazon S3 (replace local file storage)
- **Load Balancer**: Application Load Balancer
- **Domain**: Route 53 + ACM for SSL

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/kr/codeit/onboarding/
│   │   │   ├── config/          # Security, CORS config
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── domain/
│   │   │   │   ├── entity/      # JPA entities
│   │   │   │   └── enums/       # Enums
│   │   │   ├── dto/             # Request/Response DTOs
│   │   │   ├── exception/       # Custom exceptions
│   │   │   ├── repository/      # JPA repositories
│   │   │   ├── security/        # JWT utilities
│   │   │   └── service/         # Business logic
│   │   └── resources/
│   │       └── application.yml  # Configuration
│   └── test/                    # Test files
├── docker-compose.yml           # PostgreSQL setup
├── pom.xml                      # Maven dependencies
└── README.md                    # This file
```

## Testing & Quality Assurance

### Unit Tests

Run all unit tests:
```bash
mvn test
```

Test coverage includes:
- **AuthServiceTest** (6 tests) - Authentication and authorization
- **QuizServiceTest** (4 tests) - Quiz submission and grading
- **InstructorServiceTest** (5 tests) - Registration and onboarding initialization

**Total**: 15 tests, all passing ✅

### QA Testing

Comprehensive QA testing has been completed. See **QA_REPORT_ROUND2.md** in the project root for detailed results.

**QA Summary**:
- ✅ Authentication & Authorization (4 scenarios)
- ✅ Instructor Registration (3 scenarios)
- ✅ Quiz Submission (2 scenarios)
- ✅ File Upload (3 scenarios, code files supported)
- ✅ Checklist Updates (3 scenarios, IDOR vulnerability fixed)

## Security Features

### Implemented Security Measures

✅ **Authentication**: JWT-based stateless authentication
✅ **Password Security**: BCrypt hashing with salt
✅ **Authorization**: Role-based access control (RBAC)
✅ **IDOR Prevention**: All endpoints validate user ownership
✅ **File Upload Security**:
  - File size limit (50MB)
  - File type whitelist (25+ allowed extensions)
  - UUID-based filenames (prevents path traversal)
  - Owner-only access control

✅ **SQL Injection Prevention**: Parameterized queries via JPA
✅ **CORS Configuration**: Configured for specific origins
✅ **Input Validation**: Jakarta Bean Validation on all requests

### Security Fixes Applied (QA Round 2)

**Critical IDOR Vulnerability Fixed** (January 6, 2026):
- **Issue**: Checklist update endpoint accepted `instructorId` as parameter without validation
- **Impact**: Instructors could modify other instructors' checklist progress
- **Fix**: Removed parameter, now uses authenticated user's ID automatically
- **Files**: `ChecklistController.java`, `ChecklistService.java`
- **Status**: ✅ Verified and fixed

**File Upload Whitelist Extended**:
- Added support for code files (.js, .java, .py, .ts, etc.)
- Total 40+ file types now supported
- File: `FileUploadService.java`

## License

Copyright © 2026 Codeit
