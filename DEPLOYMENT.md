# 배포 가이드 (Deployment Guide)

## 📋 목차
1. [Railway.app 배포](#railwayapp-배포)
2. [환경 변수 설정](#환경-변수-설정)
3. [문제 해결](#문제-해결)

---

## Railway.app 배포

### 1. Railway 계정 생성
1. https://railway.app 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭

### 2. PostgreSQL 데이터베이스 생성
1. "New" → "Database" → "Add PostgreSQL"
2. 데이터베이스가 자동으로 생성됨
3. "Variables" 탭에서 `DATABASE_URL` 확인

### 3. Backend 서비스 배포
1. "New" → "GitHub Repo" → 프로젝트 선택
2. **Root Directory**: `backend` 설정
3. Railway가 자동으로 감지:
   - Java 17
   - Maven
   - Spring Boot
4. 배포 시작!

### 4. Frontend 서비스 배포
1. "New" → "GitHub Repo" → 같은 프로젝트 선택
2. **Root Directory**: `frontend` 설정
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start` (Express.js 서버 사용)

---

## 환경 변수 설정

### 백엔드 환경 변수

**Railway Dashboard → Backend Service → Variables 탭**에서 설정합니다.

#### 필수 변수

```bash
# 데이터베이스 (Railway PostgreSQL 서비스에서 자동 생성)
DATABASE_URL=postgresql://user:password@host:port/dbname

# JWT 인증
JWT_SECRET=<강력한-랜덤-문자열-최소-256비트>

# 프로필
SPRING_PROFILES_ACTIVE=prod
```

#### 이메일 관련 변수

```bash
# 이메일 발신자 정보
EMAIL_FROM=noreply@codeit.com  # 기본값: noreply@codeit.com
EMAIL_FROM_NAME=코드잇  # 기본값: 코드잇

# 허용된 이메일 도메인 (회원가입 시 검증)
EMAIL_DOMAIN=@codeit.com  # 기본값: @codeit.com

# 프론트엔드 URL (이메일 링크 생성용)
# 옵션 1: FRONTEND_URL 설정 (권장)
FRONTEND_URL=https://sprint-tutor-solution.up.railway.app

# 옵션 2: 명시적 URL 설정
EMAIL_VERIFICATION_URL=https://sprint-tutor-solution.up.railway.app/auth/verify-email
EMAIL_PASSWORD_RESET_URL=https://sprint-tutor-solution.up.railway.app/auth/reset-password

# Brevo 이메일 서비스 (REST API 사용 시)
BREVO_API_KEY=<your-brevo-api-key>
BREVO_API_URL=https://api.brevo.com/v3/smtp/email  # 기본값, 변경 불필요

# SMTP 사용 시 (BREVO_API_KEY가 없으면 SMTP 사용)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_AUTH=true
MAIL_STARTTLS=true
```

#### CORS 설정

```bash
# 허용된 프론트엔드 도메인
CORS_ALLOWED_ORIGINS=https://sprint-tutor-solution.up.railway.app
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS,PATCH
CORS_ALLOWED_HEADERS=*
CORS_ALLOW_CREDENTIALS=true
```

#### AWS S3 설정 (선택사항)

```bash
AWS_S3_ENABLED=false
AWS_S3_BUCKET_NAME=
AWS_S3_REGION=ap-northeast-2  # 기본값: 서울 리전
AWS_S3_ACCESS_KEY=
AWS_S3_SECRET_KEY=
AWS_S3_BASE_URL=
```

#### 기타 설정

```bash
# 포트 (Railway가 자동 설정)
PORT=8080

# 파일 업로드
UPLOAD_DIR=/app/data/uploads

# 로깅
LOG_LEVEL=INFO
HIBERNATE_SQL_LOG=false
HIBERNATE_BIND_LOG=false
```

### 프론트엔드 환경 변수

**Railway Dashboard → Frontend Service → Variables 탭**에서 설정합니다.

#### 필수 변수

```bash
# 백엔드 API URL
VITE_API_BASE_URL=https://sprint-tutor-solution-production.up.railway.app/api
```

#### 선택 변수

```bash
# 허용된 이메일 도메인 (회원가입 폼 검증용)
VITE_ALLOWED_EMAIL_DOMAIN=@codeit.com  # 기본값: @codeit.com

# 프로덕션 도메인 패턴 (URL 자동 구성용)
VITE_PRODUCTION_DOMAIN_PATTERN=railway.app  # 기본값: railway.app
```

### 설정 우선순위

#### 이메일 URL 구성 우선순위

백엔드에서 이메일 인증/비밀번호 재설정 URL을 구성할 때 다음 우선순위를 따릅니다:

1. **명시적 URL 설정** (최우선)
   - `EMAIL_VERIFICATION_URL`
   - `EMAIL_PASSWORD_RESET_URL`

2. **FRONTEND_URL 환경 변수**
   - `FRONTEND_URL`이 설정되어 있으면 자동으로 `/auth/verify-email` 또는 `/auth/reset-password` 경로를 추가

3. **CORS_ALLOWED_ORIGINS의 첫 번째 값**
   - `CORS_ALLOWED_ORIGINS`의 첫 번째 origin을 사용하여 URL 구성

#### 예시

```bash
# 옵션 1: FRONTEND_URL 사용 (권장)
FRONTEND_URL=https://sprint-tutor-solution.up.railway.app
# → 자동으로 https://sprint-tutor-solution.up.railway.app/auth/verify-email 생성

# 옵션 2: 명시적 URL 설정
EMAIL_VERIFICATION_URL=https://sprint-tutor-solution.up.railway.app/auth/verify-email
EMAIL_PASSWORD_RESET_URL=https://sprint-tutor-solution.up.railway.app/auth/reset-password
```

---

## 문제 해결

### 이메일 링크가 백엔드로 연결되는 경우
- `FRONTEND_URL` 또는 `EMAIL_VERIFICATION_URL`이 프론트엔드 도메인을 가리키는지 확인
- 백엔드 도메인이 아닌 **프론트엔드 도메인**을 사용해야 합니다

### CORS 에러가 발생하는 경우
- `CORS_ALLOWED_ORIGINS`에 프론트엔드 도메인이 정확히 포함되어 있는지 확인
- 프로토콜(`https://`)과 포트가 정확한지 확인

### 이메일이 발송되지 않는 경우
- `BREVO_API_KEY`가 올바르게 설정되어 있는지 확인
- Railway 로그에서 이메일 발송 관련 에러 확인

### Backend가 시작되지 않을 때
1. Railway 로그 확인 (Dashboard → Service → Deployments → Logs)
2. 환경 변수 확인
3. `DATABASE_URL` 형식 확인:
   - Railway 형식: `postgresql://user:password@host:port/dbname`
   - Spring Boot는 자동으로 변환 처리

### Frontend가 Backend에 연결되지 않을 때
1. `VITE_API_BASE_URL` 확인
2. CORS 설정 확인
3. Backend Health Check: `https://your-backend.railway.app/api/actuator/health`

### 메모리 부족 오류
- Railway 무료 티어는 메모리 제한이 있습니다
- `application-prod.yml`에서 메모리 최적화 설정이 적용되어 있습니다
- 필요시 Railway에서 서비스 업그레이드 고려

---

## 빠른 설정 체크리스트

### 백엔드
- [ ] `DATABASE_URL` 설정 (Railway PostgreSQL에서 자동 생성)
- [ ] `JWT_SECRET` 설정 (강력한 랜덤 문자열)
- [ ] `SPRING_PROFILES_ACTIVE=prod` 설정
- [ ] `FRONTEND_URL` 또는 `EMAIL_VERIFICATION_URL`/`EMAIL_PASSWORD_RESET_URL` 설정
- [ ] `CORS_ALLOWED_ORIGINS` 설정 (프론트엔드 도메인)
- [ ] `BREVO_API_KEY` 설정 (이메일 발송용)

### 프론트엔드
- [ ] `VITE_API_BASE_URL` 설정 (백엔드 API URL)
- [ ] (선택) `VITE_ALLOWED_EMAIL_DOMAIN` 설정 (기본값 사용 시 생략 가능)

---

## 참고

- 모든 환경 변수는 Railway Dashboard의 Variables 탭에서 설정합니다
- 환경 변수 변경 후 서비스가 자동으로 재배포됩니다
- 민감한 정보(API 키, 비밀번호 등)는 절대 코드에 하드코딩하지 마세요
- [Railway 문서](https://docs.railway.app)
