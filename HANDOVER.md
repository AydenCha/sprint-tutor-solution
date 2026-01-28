## Sprint Tutor Flow 인수인계 가이드

이 문서는 이 저장소를 포크하거나 이어받는 팀을 위한 **실무용 인수인계 요약**입니다.  
자세한 설정·배포 방법은 `README.md`, `DEPLOYMENT.md`, `backend/README.md`, `frontend/README.md`, `CLAUDE.md`를 참고하세요.

---

## 1. 프로젝트 개요

- **역할**: Codeit Sprint 강사용 온보딩 포털 (PM / Instructor 2가지 역할)
- **구성**
  - **Frontend**: React + TypeScript + Vite + Tailwind + shadcn/ui
  - **Backend**: Java 17 + Spring Boot 3.2 + PostgreSQL 16
  - **Auth**: JWT 기반, PM / INSTRUCTOR 롤 분리

PM은 강사를 등록·관리하고, 강사는 자기 온보딩 스텝을 따라가며 문서/영상/퀴즈/파일 업로드/체크리스트를 수행합니다.

---

## 2. 로컬 실행 요약

### 2.1 원클릭 스크립트

```bash
./start-all.sh   # PostgreSQL + MailHog + Backend + Frontend 순서로 실행
./stop-all.sh    # 모두 종료
```

### 2.2 수동 실행

```bash
# 1) DB + MailHog
cd backend
docker-compose up -d

# 2) Backend
mvn spring-boot:run

# 3) Frontend
cd ../frontend
npm install
npm run dev
```

접속:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080/api`
- MailHog: `http://localhost:8025`

---

## 3. 환경 변수 & 시크릿

- 루트 `.env.example`에 **필요한 모든 환경 변수 키**가 정의되어 있습니다.
- **실제 값(.env)은 Git에 커밋하지 않습니다.**
- 백엔드/프론트엔드 공통 규칙:
  - DB, JWT_SECRET, 이메일/SMTP, Brevo API Key, AWS S3 키 등은 **무조건 환경 변수**로만 주입
  - 프로덕션에서는 `.env` 대신 플랫폼 변수(Railway, AWS 등)를 사용

> 이 저장소에는 **운영용 비밀번호나 실제 키는 포함되어 있지 않고**,  
> 과거에 있던 샘플 데이터·SQL 덤프는 모두 제거된 상태입니다.

---

## 4. 폴더 구조 (운영·유지보수 관점)

```text
backend/
  src/main/java/kr/codeit/onboarding/
    config/       # Security, CORS, DB URL 변환, 이메일 URL 설정
    controller/   # REST API 엔드포인트 (Auth, Instructor, Task 등)
    service/      # 비즈니스 로직
    repository/   # Spring Data JPA 리포지토리
    domain/
      entity/     # JPA 엔티티
      enums/      # Enum 타입들
    dto/          # 요청/응답 DTO
    security/     # JWT 필터/유틸
    exception/    # 전역 예외 처리 및 에러 응답

  src/main/resources/
    db/migration/ # Flyway SQL 마이그레이션 (스키마 변경 이력)
    application.yml
    application-dev.yml

frontend/
  src/
    pages/        # 화면 단위 라우트 컴포넌트
    components/
      ui/         # shadcn 기반 공통 UI
      modules/    # A/B/C/D 온보딩 모듈 컴포넌트
    services/api.ts  # 백엔드 API 클라이언트
    contexts/AuthContext.tsx  # 로그인/역할 상태
    hooks/        # 공통 훅 (자동 저장, 미저장 경고 등)
    design-system/# Figma 디자인 토큰
    config/env.ts # VITE_API_URL 래핑

scripts/
  extract_token.py  # MailHog 이메일에서 토큰 추출 (로컬 PM 가입 테스트용)
  ralph/            # 추가 자동화 스크립트
```

---

## 5. 새 팀을 위한 “첫 1시간” 체크리스트

1. **코드 열어보기**
   - `README.md`, `HANDOVER.md` 훑어보기
   - `frontend/src/App.tsx`에서 전체 라우팅 구조 파악
   - `backend/src/main/java/kr/codeit/onboarding/controller`에서 주요 엔드포인트 확인
2. **로컬 환경 준비**
   - JDK 17, Node 18+, Docker 설치
   - 루트 `.env.example`를 `.env`로 복사 후 로컬 값 채우기
   - `./start-all.sh`로 전체 구동 확인
3. **도메인 모델 이해**
   - `backend/domain/entity`의 `User`, `Instructor`, `OnboardingStep`, `Task`, `ContentModule` 위주로 구조 확인
   - `frontend/src/components/modules`에서 A/B/C/D 모듈 UI 흐름 확인
4. **보안·운영 포인트 인지**
   - JWT_SECRET, DATABASE_PASSWORD, AWS 키 등은 **반드시 환경 변수**로만 사용
   - 파일 업로드 경로(`UPLOAD_DIR`)와 S3 설정(`AWS_S3_*`) 확인
5. **테스트/검증**
   - PM 계정으로 로그인 → Instructor 등록 → 온보딩 플로우 한 사이클 직접 수행

---

## 6. 정책 & 주의사항 (인수인계 시 전달 권장)

- **Git 히스토리**
  - 현재 리포에는 **실제 운영 시크릿은 없고, 테스트 데이터/옛 덤프는 제거된 상태**입니다.
  - 만약 회사 정책상 “히스토리도 완전히 정리된 리포”가 필요하면,
    - 이 상태를 기준으로 새 리포를 만들거나
    - orphan 브랜치로 깨끗한 초기 커밋을 하나 만들고 그걸 기준으로 포크하면 됩니다.
- **DB 마이그레이션**
  - 모든 스키마 변경은 `backend/src/main/resources/db/migration/` 아래 Flyway 스크립트로 관리합니다.
  - 수동 덤프/복구용 SQL은 Git에 두지 않는 것을 원칙으로 합니다.
- **테스트용 계정/패스워드**
  - 어떤 기본 계정이든, 실제 운영 환경에서는 **반드시 초기 비밀번호 변경 또는 계정 재생성**을 권장합니다.

---

## 7. 추가 자료

- `README.md` – 전반적인 개요, 실행 방법, 구조
- `DEPLOYMENT.md` – Railway 기준 배포 가이드
- `backend/README.md` – 백엔드 API/DB 중심 설명
- `frontend/README.md` – 프론트엔드 구조·스크립트 안내
- `CLAUDE.md` – AI/개발자용 상세 아키텍처·보안 가이드

이 파일 하나만 읽어도 **새 팀이 어디서부터 손을 대야 할지** 감을 잡을 수 있도록 구성했습니다.
