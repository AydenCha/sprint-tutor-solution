# Codeit Onboarding Portal

A full-stack web application for managing Sprint Instructor onboarding at Codeit.

## Overview

This portal provides a structured onboarding process for Sprint instructors, tracking their progress through document reviews, video content, quizzes, file submissions, and checklists.

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Java 17 + Spring Boot 3.2.1 + PostgreSQL 16
- **Authentication**: JWT-based with role separation (PM / Instructor)
- **Storage**: AWS S3 for video files (optional, falls back to local storage)
- **Deployment**: AWS (ECS/RDS/S3) or Railway.app (dev)

## Quick Start

### Prerequisites
- **Java 17+** (OpenJDK recommended)
- **Node.js 18+** and npm
- **Docker** (for PostgreSQL)
- **Maven 3.6+**

### Automated Setup
```bash
./start-all.sh
```

Then follow the on-screen instructions to start backend and frontend.

### Manual Setup

#### Start Database and MailHog
```bash
cd backend && docker-compose up -d
# MailHog Web UI: http://localhost:8025
```

#### Start Backend
```bash
cd backend && mvn spring-boot:run
```

#### Start Frontend
```bash
cd frontend && npm run dev
```

## Default Credentials

For security reasons, **no default accounts or sample DB data are committed**.

- Create a PM account via the registration flow (email verification uses MailHog in local dev).
- Or set up your own test data in your local database.

⚠️ **IMPORTANT**: Configure environment variables using `.env.example` as a template. **Never commit actual credentials to the repository!** Change all default credentials before deploying to production!

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **Database**: localhost:5432
- **MailHog** (이메일 테스팅): http://localhost:8025

## Key Features

### For PM (Project Managers)
- Register and manage instructors
- Create and manage step templates
- Create and manage content modules
- Assign onboarding steps to instructors
- Edit task content (even while instructor is in progress)
- Track instructor progress
- View audit logs
- Manage tracks

### For Instructors
- Step-by-step onboarding guidance
- Document and video content
- Interactive quizzes (objective/subjective)
- File upload for assignments
- Progress tracking
- Checklist completion

### Content Types
- **Type A**: Document + Quiz
- **Type B**: Video + Quiz
- **Type C**: File Upload
- **Type D**: Interactive Checklist

## Project Structure

```
sprint-tutor-flow/
├── backend/                    # Spring Boot (Java 17)
│   ├── src/main/java/         # Controllers, services, repositories, entities
│   ├── src/main/resources/
│   │   ├── db/migration/       # Flyway SQL migrations
│   │   └── application*.yml
│   ├── docker-compose.yml      # PostgreSQL + MailHog
│   ├── pom.xml
│   └── README.md
│
├── frontend/                   # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/              # Route-level pages
│   │   ├── components/         # UI + modules (DocumentQuiz, VideoQuiz, etc.)
│   │   ├── services/api.ts     # API client
│   │   ├── contexts/           # Auth state
│   │   └── hooks/, config/, design-system/
│   ├── public/
│   └── README.md
│
├── scripts/                    # Dev utilities (e.g. extract_token.py, ralph/)
├── start-all.sh
├── stop-all.sh
├── .env.example
├── CLAUDE.md                   # Development guide
├── DEPLOYMENT.md
└── README.md
```

## Security Features

- JWT-based authentication
- BCrypt password hashing
- Role-based access control (RBAC)
- Email verification for PM registration
- Optimistic locking for concurrent edits
- Input validation
- CORS configuration
- File upload security

## Development

### Run Tests
```bash
cd backend && mvn test
```

### Check Backend Health
```bash
# Health check endpoint
curl http://localhost:8080/api/health

# Test authentication (replace with your actual credentials)
curl http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"your-email@example.com","password":"your-password"}'
```

### Stop Everything
```bash
./stop-all.sh
```

## Deployment

### Railway.app (Development)
See `DEPLOYMENT.md` for detailed deployment guide and environment variable configuration.

### Production (AWS)
See `DEPLOYMENT.md` and backend README for production deployment.

**Before Production**:
1. ⚠️ **Change all default credentials** - Use strong, unique passwords
2. Set secure JWT secret (generate a strong random string)
3. Configure production database credentials
4. Set up S3 for video storage (optional)
5. Enable HTTPS/SSL
6. Configure all environment variables (use `.env.example` as a template)
7. **Never commit `.env` files or actual credentials to the repository**

## Documentation

**Essential:**
- `.env.example` - Environment variables template
- `CLAUDE.md` - Development guide for Claude Code
- `DEPLOYMENT.md` - Railway.app deployment guide

**Component-Specific:**
- `backend/README.md` - Backend API and database setup
- `backend/MAILHOG_SETUP.md` - Email testing (MailHog)
- `backend/AWS_S3_SETUP_GUIDE.md` - S3 video storage (optional)
- `frontend/README.md` - Frontend development guide

## License

Copyright © 2026 Codeit
