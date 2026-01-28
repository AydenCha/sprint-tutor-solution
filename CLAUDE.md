# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sprint Tutor Flow is a full-stack onboarding platform for Codeit Sprint instructors with role-based access (PM/Instructor). The system uses a layered architecture with clear separation between frontend (React/TypeScript) and backend (Java/Spring Boot).

## Quick Start Commands

### Start All Services
```bash
./start-all.sh    # Starts PostgreSQL, backend, and frontend
./stop-all.sh     # Stops all services
```

### Backend (Port 8080)
```bash
cd backend
docker-compose up -d           # Start PostgreSQL + MailHog
mvn spring-boot:run            # Start backend server
mvn clean install              # Build with tests
mvn clean install -DskipTests  # Build without tests
mvn test                       # Run unit tests only
```

### Frontend (Port 5173)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
```

### Access Points
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- MailHog (email testing): http://localhost:8025
- Database: localhost:5432 (postgres/postgres)
- Health Check: http://localhost:8080/api/health

## Architecture Patterns

### Backend (Spring Boot Layered Architecture)

**Controller → Service → Repository → Entity**

1. **Controllers** (11 controllers in `controller/`): Handle HTTP requests/responses, validation, and route to services
2. **Services** (18 services in `service/`): Business logic, transactions (`@Transactional`), and orchestration
3. **Repositories** (15+ repos in `repository/`): Data access via Spring Data JPA
4. **Entities** (21 entities in `domain/entity/`): JPA entities with relationships
5. **DTOs** (40+ in `dto/`): Request/Response objects, mapped via MapStruct

**Key Patterns**:
- JWT-based stateless authentication (`JwtAuthenticationFilter`)
- Global exception handling (`GlobalExceptionHandler`)
- Audit logging for all CREATE/UPDATE/DELETE/ASSIGN operations
- Soft delete support (deletedAt field)
- Optimistic locking for concurrent edits

### Frontend (React Context + Component Composition)

1. **Pages** (`src/pages/`): Route-level components (20+ pages)
2. **Components** (`src/components/`): Reusable UI components
   - `modules/`: 4 content type modules (DocumentQuiz, VideoQuiz, FileUpload, Checklist)
   - `ui/`: shadcn/ui components (65+ components)
3. **API Layer** (`src/services/api.ts`): Centralized API client with ~100+ methods
4. **State** (`src/contexts/AuthContext.tsx`): Global auth state via Context API + localStorage
5. **Protected Routes**: `ProtectedRoute` component for role-based access

**Key Patterns**:
- React Query for server state management
- React Hook Form + Zod for form validation
- Error boundaries for error handling
- Custom hooks for reusable logic

## Content Type System (A/B/C/D Modules)

The system supports 4 reusable module types:

- **Type A**: Document + Quiz (markdown content + objective/subjective questions)
- **Type B**: Video + Quiz (embedded/uploaded video + quiz)
- **Type C**: File Upload (instructor file submission with requirements)
- **Type D**: Checklist (interactive checklist items)

Modules are reusable across instructors and steps. PMs can edit module content even while instructors are in progress.

## Database Schema

**Key Entities**:
- `users` - PM and Instructor accounts (role-based)
- `instructors` - Instructor metadata (track, cohort, start date, access code)
- `onboarding_steps` - Progress tracking per instructor (customizable step count)
- `tasks` - Task instances linked to content modules (Type A/B/C/D)
- `content_modules` - Reusable module definitions
- `quiz_questions` / `quiz_answers` - Quiz content and submissions
- `checklist_items` / `instructor_checklist_items` - Checklist templates and progress
- `file_uploads` - File metadata and storage paths
- `step_templates` / `step_definitions` - Step configuration system
- `tracks` - Course/program definitions
- `audit_logs` - Change tracking with JSONB metadata
- `email_verification_tokens` / `password_reset_tokens` - Auth tokens

**Notable Features**:
- All entities inherit from `BaseEntity` (createdAt, updatedAt)
- Soft delete support via `deletedAt` field
- Comprehensive indexing on foreign keys and frequently queried columns
- JSONB metadata in audit logs for change tracking

## Authentication & Security

**Authentication Flow**:
1. User logs in via `/api/auth/login` (email+password for PM, access code for Instructor)
2. Backend validates credentials and returns JWT token
3. Frontend stores token in localStorage via AuthContext
4. All subsequent requests include `Authorization: Bearer <token>` header
5. `JwtAuthenticationFilter` validates token and extracts user info

**Security Features**:
- BCrypt password hashing
- JWT expiration and secret configuration
- Role-based access control (PM vs INSTRUCTOR)
- Email verification for PM registration
- Password reset via email tokens
- IDOR prevention (all endpoints validate ownership)
- File upload security (type whitelist, size limits, UUID filenames)
- Input validation via Jakarta Bean Validation
- CORS configuration for allowed origins

## Email System

**Development**: MailHog (SMTP mock on port 1025, Web UI on port 8025)
**Production**: Configurable SMTP or Brevo API

Email use cases:
- PM registration email verification
- Password reset tokens
- Instructor welcome emails (optional)

## File Storage

**Default**: Local filesystem (`./uploads` directory)
**Optional**: AWS S3 for video files (configure via `AWS_S3_*` env vars)

File handling:
- Max size: 50MB (configurable)
- Whitelist: 40+ file types (documents, code, images, videos)
- UUID-based filenames to prevent path traversal
- Owner-only access control

## Testing

**Backend Tests** (15 tests total):
- AuthServiceTest (6 tests) - Login, registration, token validation
- QuizServiceTest (4 tests) - Quiz submission and grading
- InstructorServiceTest (5 tests) - Registration and onboarding initialization

**Run Tests**:
```bash
cd backend && mvn test
```

**QA Testing**: See `QA_REPORT_ROUND2.md` for comprehensive manual testing results.

## Development Workflows

### Creating New Endpoints

1. Create DTO classes in `dto/` for request/response
2. Add service method in appropriate service class
3. Create controller endpoint in appropriate controller
4. Add repository methods if needed
5. Test via Postman or frontend integration

### Adding New Entities

1. Create entity in `domain/entity/` extending `BaseEntity`
2. Define JPA relationships (`@ManyToOne`, `@OneToMany`, etc.)
3. Create repository interface extending `JpaRepository`
4. Add migration SQL if needed
5. Update related services and DTOs

### Modifying Frontend Components

1. Check if component exists in `src/components/ui/` (shadcn components)
2. For new pages, add to `src/pages/` and update routing in `App.tsx`
3. Use API client methods from `src/services/api.ts`
4. Update TypeScript types as needed
5. Follow existing component patterns (form validation, error handling)

## Configuration

**Environment Variables** (Backend):
```
DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD
JWT_SECRET, JWT_EXPIRATION
UPLOAD_DIR
AWS_S3_BUCKET_NAME, AWS_S3_REGION, AWS_S3_ACCESS_KEY, AWS_S3_SECRET_KEY (optional)
MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD
BREVO_API_KEY (optional)
CORS_ALLOWED_ORIGINS
EMAIL_VERIFICATION_URL, EMAIL_PASSWORD_RESET_URL
```

**Spring Profiles**:
- `dev` - Uses MailHog, local database (application-dev.yml)
- `prod` - Production settings (application-prod.yml)

**Frontend Environment**:
```
VITE_API_URL - Backend API URL (default: http://localhost:8080/api)
```

## Deployment

**Railway.app** (Development): See `DEPLOYMENT.md` for setup guide
**AWS** (Production): ECS + RDS + S3 setup (see `backend/DEPLOYMENT.md`)

**Pre-Production Checklist**:
- Change JWT_SECRET to strong random value
- Configure production database credentials
- Set up S3 for video storage (optional)
- Enable HTTPS/SSL
- Configure CORS for production frontend URL
- Set email service (SMTP or Brevo)

## Common Debugging

**Backend won't start**:
- Check PostgreSQL is running: `docker-compose ps`
- Verify database connection in `application.yml`
- Check Java version: `java -version` (requires 17+)

**Frontend can't connect to backend**:
- Verify backend is running on port 8080
- Check CORS settings in `backend/.../config/CorsConfig.java`
- Confirm `VITE_API_URL` in frontend env

**Authentication issues**:
- Check JWT token in browser localStorage
- Verify JWT_SECRET matches between environments
- Check token expiration time

**Database issues**:
- Reset database: `docker-compose down -v && docker-compose up -d`
- Migrations: `backend/src/main/resources/db/migration/` (Flyway)
- Verify schema matches entities

## Code Style Guidelines

**Backend (Java)**:
- Use Lombok annotations (`@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`)
- Service methods should be `@Transactional` when modifying data
- Use MapStruct for entity-to-DTO mapping
- Always validate user ownership in service methods (IDOR prevention)
- Use meaningful method names (e.g., `findInstructorWithStepsAndTasks`)

**Frontend (TypeScript/React)**:
- Use TypeScript strict mode
- Functional components with hooks (no class components)
- Use shadcn/ui components for consistency
- Handle loading and error states in all API calls
- Use React Hook Form + Zod for forms
- Follow existing naming conventions (PascalCase for components, camelCase for functions)

## Critical Security Rules

1. **Never skip authentication checks** - All endpoints except login/register require JWT
2. **Always validate ownership** - Instructors can only access their own data
3. **Sanitize user input** - Use validation annotations and Zod schemas
4. **Never commit secrets** - Use environment variables for sensitive data
5. **IDOR prevention** - Use authenticated user ID, never trust client-provided IDs for ownership checks
6. **File upload validation** - Always check file type and size
7. **SQL injection prevention** - Use JPA query methods, never raw SQL with user input

## Database Migrations

Migrations are in `backend/src/main/resources/db/migration/` (Flyway). The application applies them on startup. For manual runs, use the same SQL files with your database client.

## Default Credentials

**PM Login**:
- Email: `pm@codeit.com` (or your configured email)
- Password: (configure in your environment variables)

**Instructor Login**:
- Use access code provided by PM (e.g., `FE4-JWP1`)

## Documentation Files

- `README.md` - Project overview and quick start
- `CLAUDE.md` - This file (development guide)
- `DEPLOYMENT.md` - Railway deployment guide
- `backend/README.md` - Backend API and setup
- `backend/MAILHOG_SETUP.md` - Email testing (MailHog)
- `backend/AWS_S3_SETUP_GUIDE.md` - S3 video storage (optional)
- `frontend/README.md` - Frontend development guide
