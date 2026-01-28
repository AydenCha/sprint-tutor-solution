# AWS S3 설정 가이드

## 개요

이 가이드는 AWS S3를 사용하여 동영상을 저장하고 제공하는 방법을 설명합니다.

## 1. AWS 계정 및 S3 버킷 생성

### 1.1 AWS 계정 생성
1. [AWS 콘솔](https://aws.amazon.com/ko/console/)에 로그인
2. 아직 계정이 없다면 계정 생성

### 1.2 S3 버킷 생성
1. AWS 콘솔에서 **S3** 서비스 선택
2. **버킷 만들기** 클릭
3. 버킷 설정:
   - **버킷 이름**: `codeit-onboarding-videos` (고유한 이름)
   - **AWS 리전**: `아시아 태평양(서울) ap-northeast-2` (권장)
   - **퍼블릭 액세스 차단 설정**: 
     - ✅ "모든 퍼블릭 액세스 차단" **해제** (동영상 공개 접근 필요)
     - 경고 확인 후 체크박스 체크
   - **버전 관리**: 비활성화 (선택)
   - **기본 암호화**: 활성화 (권장)
4. **버킷 만들기** 클릭

### 1.3 버킷 정책 설정 (Public Read)
1. 생성한 버킷 선택
2. **권한** 탭 클릭
3. **버킷 정책** 편집 클릭
4. 다음 정책 추가:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

⚠️ **주의**: `YOUR-BUCKET-NAME`을 실제 버킷 이름으로 변경하세요.

5. **저장** 클릭

### 1.4 CORS 설정 (선택)
브라우저에서 직접 S3에 접근하는 경우 CORS 설정 필요:

1. 버킷의 **권한** 탭
2. **CORS(Cross-origin resource sharing)** 편집
3. 다음 설정 추가:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

4. **저장** 클릭

---

## 2. IAM 사용자 생성 및 권한 설정

### 2.1 IAM 사용자 생성
1. AWS 콘솔에서 **IAM** 서비스 선택
2. **사용자** → **사용자 추가** 클릭
3. 사용자 이름: `s3-video-uploader`
4. **프로그래밍 방식 액세스** 선택
5. **다음: 권한** 클릭

### 2.2 권한 부여
1. **기존 정책 직접 연결** 선택
2. 다음 정책 검색 및 선택:
   - `AmazonS3FullAccess` (전체 접근)
   - 또는 커스텀 정책 (권장):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
        }
    ]
}
```

3. **다음: 태그** → **다음: 검토** → **사용자 만들기** 클릭

### 2.3 액세스 키 저장
1. **액세스 키 ID**와 **비밀 액세스 키** 복사
2. ⚠️ **중요**: 비밀 액세스 키는 이 페이지를 벗어나면 다시 볼 수 없습니다!
3. 안전한 곳에 저장 (환경 변수로 설정 예정)

---

## 3. 애플리케이션 설정

### 3.1 환경 변수 설정

#### 로컬 개발 (`.env` 파일 또는 환경 변수)
```bash
# S3 활성화
AWS_S3_ENABLED=true

# S3 버킷 정보
AWS_S3_BUCKET_NAME=codeit-onboarding-videos
AWS_S3_REGION=ap-northeast-2

# IAM 사용자 액세스 키
AWS_S3_ACCESS_KEY=<YOUR_AWS_ACCESS_KEY_ID>
AWS_S3_SECRET_KEY=<YOUR_AWS_SECRET_ACCESS_KEY>

# (선택) 커스텀 Base URL (CloudFront 사용 시)
# AWS_S3_BASE_URL=https://d1234567890.cloudfront.net
```

#### 프로덕션 (Railway, AWS 등)
환경 변수로 설정:
- `AWS_S3_ENABLED=true`
- `AWS_S3_BUCKET_NAME=codeit-onboarding-videos`
- `AWS_S3_REGION=ap-northeast-2`
- `AWS_S3_ACCESS_KEY=...`
- `AWS_S3_SECRET_KEY=...`

### 3.2 application.yml 설정 (선택)
환경 변수 대신 `application.yml`에 직접 설정 가능:

```yaml
app:
  s3:
    enabled: true
    bucket-name: codeit-onboarding-videos
    region: ap-northeast-2
    access-key: ${AWS_S3_ACCESS_KEY}
    secret-key: ${AWS_S3_SECRET_KEY}
```

⚠️ **보안**: `access-key`와 `secret-key`는 환경 변수로 관리하는 것을 강력히 권장합니다.

---

## 4. 테스트

### 4.1 애플리케이션 시작
```bash
cd backend
mvn spring-boot:run
```

### 4.2 로그 확인
S3가 정상적으로 초기화되면 다음과 같은 로그가 출력됩니다:
```
S3 client initialized successfully. Bucket: codeit-onboarding-videos, Region: ap-northeast-2
```

### 4.3 동영상 업로드 테스트
1. PM으로 로그인
2. 모듈 생성/수정 페이지에서 동영상 업로드
3. 업로드 성공 시 S3 URL이 반환됨
4. 브라우저에서 URL 접근하여 동영상 재생 확인

---

## 5. 비용 모니터링

### 5.1 AWS 비용 대시보드
1. AWS 콘솔 → **비용 관리** → **비용 및 사용량 대시보드**
2. S3 사용량 및 비용 확인

### 5.2 예상 비용 (참고)
- **스토리지**: $0.023/GB/월
- **데이터 전송**: 첫 100GB 무료, 이후 $0.09/GB
- **요청**: $0.005/1,000 PUT, $0.0004/1,000 GET

자세한 내용은 `S3_VIDEO_STORAGE_ANALYSIS.md` 참고

---

## 6. 문제 해결

### 6.1 S3 초기화 실패
**증상**: `Failed to initialize S3 client` 로그

**해결 방법**:
1. 환경 변수 확인 (`AWS_S3_ENABLED`, `AWS_S3_BUCKET_NAME` 등)
2. IAM 사용자 권한 확인
3. 버킷 이름 및 리전 확인
4. 액세스 키 유효성 확인

### 6.2 업로드 실패
**증상**: `Failed to upload file to S3` 로그

**해결 방법**:
1. 버킷 정책 확인 (Public Read 권한)
2. IAM 사용자 권한 확인 (`s3:PutObject`, `s3:PutObjectAcl`)
3. 버킷 이름 및 리전 확인

### 6.3 동영상 재생 불가
**증상**: 업로드는 성공하지만 브라우저에서 재생 불가

**해결 방법**:
1. 버킷 정책 확인 (Public Read)
2. CORS 설정 확인
3. S3 URL 직접 접근 테스트
4. 브라우저 콘솔에서 에러 확인

---

## 7. 보안 권장 사항

### 7.1 IAM 최소 권한 원칙
- 필요한 권한만 부여 (`s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`)
- 전체 버킷 접근 권한 피하기

### 7.2 액세스 키 보안
- 환경 변수로 관리 (코드에 하드코딩 금지)
- 정기적으로 키 로테이션
- 프로덕션과 개발 환경 분리

### 7.3 버킷 보안
- Public Read는 `videos/` 폴더에만 제한 (버킷 정책으로)
- 버전 관리 활성화 (선택)
- 암호화 활성화

---

## 8. CloudFront 통합 (선택)

전 세계 사용자에게 빠른 전송을 위해 CloudFront를 추가할 수 있습니다.

### 8.1 CloudFront 배포 생성
1. AWS 콘솔 → **CloudFront** 서비스
2. **배포 만들기** 클릭
3. 원본 도메인: S3 버킷 선택
4. **배포 만들기** 클릭

### 8.2 Base URL 설정
생성된 CloudFront URL을 환경 변수로 설정:
```bash
AWS_S3_BASE_URL=https://d1234567890.cloudfront.net
```

자세한 내용은 AWS CloudFront 문서 참고

---

## 9. 로컬 저장소로 되돌리기

S3를 비활성화하고 로컬 저장소로 되돌리려면:

```bash
AWS_S3_ENABLED=false
```

또는 `application.yml`:
```yaml
app:
  s3:
    enabled: false
```

기존 S3에 업로드된 동영상은 계속 S3 URL로 접근 가능합니다.

---

## 참고 자료

- [AWS S3 공식 문서](https://docs.aws.amazon.com/ko_kr/s3/)
- [AWS SDK for Java](https://docs.aws.amazon.com/sdk-for-java/)
- [S3 비용 분석](./S3_VIDEO_STORAGE_ANALYSIS.md)
