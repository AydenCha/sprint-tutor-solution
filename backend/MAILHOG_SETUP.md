# MailHog 설정 가이드

로컬 개발 환경에서 이메일 테스팅을 위한 MailHog 설정 방법입니다.

## MailHog란?

MailHog는 개발 환경에서 실제 이메일을 발송하지 않고 이메일을 테스트할 수 있는 도구입니다.
- 실제 이메일 서버로 발송하지 않음
- 웹 UI에서 발송된 이메일을 확인 가능
- 비밀번호 재설정, 이메일 인증 링크 등을 테스트하기에 적합

## 시작하기

### 1. MailHog 실행

Docker Compose를 사용하여 MailHog를 실행합니다:

```bash
cd backend
docker-compose up -d mailhog
```

또는 PostgreSQL과 함께 실행:

```bash
cd backend
docker-compose up -d
```

### 2. MailHog Web UI 접속

브라우저에서 다음 URL을 열어 발송된 이메일을 확인할 수 있습니다:

**http://localhost:8025**

### 3. 백엔드 설정 확인

로컬 개발 환경에서는 `BREVO_API_KEY`를 설정하지 않으면 자동으로 MailHog를 사용합니다.

확인 방법:
- 환경 변수에 `BREVO_API_KEY`가 없으면 MailHog 사용
- `BREVO_API_KEY`가 있으면 Brevo REST API 사용

## 사용 방법

### 비밀번호 재설정 테스트

1. 프론트엔드에서 "비밀번호를 잊으셨나요?" 링크 클릭
2. 이메일 주소 입력 (예: `pm@codeit.com`)
3. 백엔드에서 이메일 발송
4. **MailHog Web UI (http://localhost:8025)에서 이메일 확인**
5. 이메일의 링크를 클릭하여 비밀번호 재설정 페이지로 이동

### 이메일 인증 테스트

1. PM 회원가입 진행
2. 백엔드에서 인증 이메일 발송
3. **MailHog Web UI에서 인증 링크 확인**
4. 링크를 클릭하여 이메일 인증 완료

## MailHog 포트

- **SMTP 포트**: 1025 (백엔드에서 이메일 발송 시 사용)
- **Web UI 포트**: 8025 (브라우저에서 이메일 확인)

## 문제 해결

### MailHog가 시작되지 않는 경우

```bash
# MailHog 컨테이너 상태 확인
docker ps | grep mailhog

# MailHog 로그 확인
docker logs onboarding-mailhog

# MailHog 재시작
docker-compose restart mailhog
```

### 이메일이 MailHog에 도착하지 않는 경우

1. `BREVO_API_KEY` 환경 변수가 설정되어 있는지 확인
   - 설정되어 있으면 Brevo API를 사용하므로 MailHog에 도착하지 않음
   - 로컬 개발 시에는 `BREVO_API_KEY`를 비워두세요

2. 백엔드 로그 확인
   ```bash
   tail -f backend.log | grep -i mail
   ```

3. MailHog가 실행 중인지 확인
   ```bash
   curl http://localhost:8025/api/v2/messages
   ```

## MailHog 중지

```bash
cd backend
docker-compose stop mailhog
```

또는

```bash
docker stop onboarding-mailhog
```

## 참고

- MailHog는 개발 환경 전용입니다
- 프로덕션 환경에서는 실제 이메일 서비스(Brevo, SendGrid 등)를 사용해야 합니다
- MailHog에 저장된 이메일은 컨테이너를 삭제하면 사라집니다
