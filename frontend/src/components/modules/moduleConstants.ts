/**
 * Shared constants and utilities for module components
 * Used across Type A (Document+Quiz), Type B (Video+Quiz), Type C (File Upload), and Type D (Checklist) modules
 */

// ============================================
// File Upload Constants
// ============================================

/**
 * Maximum file size limits by file type
 */
export const FILE_SIZE_LIMITS = {
  VIDEO: 200 * 1024 * 1024, // 200MB for video files
  DOCUMENT: 50 * 1024 * 1024, // 50MB for documents, images, etc.
} as const;

/**
 * Accepted file extensions for different file types
 */
export const ACCEPTED_FILE_EXTENSIONS = {
  VIDEO: ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv'],
  DOCUMENT: ['.pdf', '.doc', '.docx'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
} as const;

/**
 * MIME types for file upload inputs
 */
export const MIME_TYPES = {
  VIDEO: 'video/*,.mp4,.webm,.ogg,.mov,.avi,.mkv,.flv,.wmv',
  DOCUMENT: '.pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov',
} as const;

// ============================================
// External URL Detection
// ============================================

/**
 * External platforms that cannot be embedded in iframes
 */
export const EXTERNAL_PLATFORMS = {
  NOTION: ['notion.so', 'notion.site'],
  MEETING: ['zoom.us', 'discord.com', 'discord.gg', 'zep.us', 'gather.town'],
} as const;

// ============================================
// Quiz Settings
// ============================================

/**
 * Demo auto-completion delay for video watching
 */
export const DEMO_VIDEO_WATCH_DELAY = 3000; // 3 seconds

// ============================================
// Error Messages
// ============================================

export const ERROR_MESSAGES = {
  FILE_TYPE_INVALID: '비디오 파일만 업로드 가능합니다 (.mp4, .webm, .ogg, .mov 등)',
  FILE_SIZE_VIDEO_EXCEEDED: '비디오 파일은 200MB 이하만 업로드 가능합니다',
  FILE_SIZE_DOCUMENT_EXCEEDED: '파일은 50MB 이하만 업로드 가능합니다',
  UPLOAD_FAILED: '파일 업로드에 실패했습니다',
  DELETE_FAILED: '파일 삭제에 실패했습니다',
  VIDEO_DELETE_FAILED: '비디오 삭제에 실패했습니다',
  IFRAME_LOAD_FAILED: '문서를 불러올 수 없습니다',
} as const;

export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: '업로드 완료',
  UPLOAD_SUCCESS_DESCRIPTION: '비디오가 성공적으로 업로드되었습니다',
  FILE_UPLOAD_SUCCESS: '업로드 성공',
  DELETE_SUCCESS: '삭제 완료',
  VIDEO_DELETE_SUCCESS: '비디오가 삭제되었습니다',
  FILE_DELETE_SUCCESS: '파일이 삭제되었습니다',
} as const;

// ============================================
// UI Text
// ============================================

export const UI_TEXT = {
  QUIZ: {
    PHASE_LABEL: '퀴즈 풀기',
    SUBMIT_BUTTON: '제출하기',
    RETRY_BUTTON: '다시 풀기',
    COMPLETE_BUTTON: '완료! 다음으로',
    PROGRESS_FORMAT: (answered: number, total: number) => `${answered} / ${total} 답변 완료`,
    SCORE_FORMAT: (score: number, total: number) => `${total}문제 중 ${score}문제 정답`,
    SUCCESS_TITLE: '축하합니다! 🎉',
    FAILURE_TITLE: '아쉬워요 😢',
  },
  DOCUMENT: {
    PHASE_LABEL: '문서 읽기',
    READ_COMPLETE_BUTTON: '다 읽었어요! 퀴즈 풀기',
    NOTION_TITLE: 'Notion 문서',
    EXTERNAL_LINK_TITLE: '외부 링크',
    NOTION_DESCRIPTION: 'Notion 페이지는 보안상의 이유로 여기에 직접 표시할 수 없습니다.',
    EXTERNAL_LINK_DESCRIPTION: '이 링크는 외부 서비스(Zoom, Discord, Zep 등)로 연결됩니다.',
    OPEN_NOTION_BUTTON: 'Notion에서 열기',
    OPEN_NEW_TAB_BUTTON: '새 탭에서 열기',
    IFRAME_ERROR_TITLE: '문서를 불러올 수 없습니다',
    IFRAME_ERROR_DESCRIPTION: '이 문서는 보안 설정으로 인해 직접 표시할 수 없습니다. 아래 버튼을 클릭하여 원본 페이지에서 읽어주세요.',
  },
  VIDEO: {
    PHASE_LABEL: '영상 시청',
    QUIZ_BUTTON: '퀴즈 풀기',
    WATCH_COMPLETE_LABEL: '시청 완료',
    WATCH_REQUIRED_MESSAGE: '영상을 끝까지 시청해주세요',
    UPLOAD_REQUIRED_MESSAGE: '비디오를 업로드해주세요',
    DEMO_MESSAGE: '데모: 3초 후 시청 완료로 처리됩니다',
    UPLOAD_TITLE: '비디오 파일 업로드',
    UPLOAD_DESCRIPTION: '비디오를 드래그하거나 클릭하여 업로드',
    UPLOAD_BUTTON: '파일 선택',
    UPLOAD_HINT: '지원 형식: MP4, WebM, OGG, MOV (최대 200MB)',
    UPLOADING_MESSAGE: '업로드 중...',
    UPLOADING_WAIT: '잠시만 기다려주세요',
  },
  FILE_UPLOAD: {
    PHASE_LABEL: '파일 업로드',
    REQUIRED_FILES_LABEL: '필수 제출 파일',
    UPLOADED_FILES_LABEL: '업로드된 파일',
    DROP_ZONE_TEXT: '파일을 드래그하거나 클릭하세요',
    DROP_ZONE_HINT: 'PDF, 이미지, 영상 파일 지원 (최대 50MB)',
    UPLOADING_TEXT: '업로드 중...',
    SUBMIT_BUTTON: '제출 완료',
    PROGRESS_FORMAT: (uploaded: number, required: number) => `${uploaded} / ${required} 파일 업로드됨`,
  },
  CHECKLIST: {
    PHASE_LABEL: '체크리스트',
    PROGRESS_FORMAT: (checked: number, total: number) => `${checked} / ${total} 완료`,
    COMPLETE_MESSAGE: '모든 항목을 완료했어요! 🎉',
    COMPLETE_BUTTON: '완료! 다음으로',
    CHECK_ALL_MESSAGE: '모든 항목을 체크해주세요',
  },
  COMMON: {
    SKIP_BUTTON: '건너뛰기',
  },
} as const;

// ============================================
// Default Content
// ============================================

/**
 * Default markdown content for documents without documentContent or documentUrl
 */
export const DEFAULT_DOCUMENT_CONTENT = (title: string, description: string) => `# ${title}

${description || ''}

---

## 주요 내용

이 문서는 코드잇 스프린트 강사 온보딩에 필요한 핵심 내용을 담고 있습니다.

### 1. 핵심 원칙
- 수강생 중심의 교육 철학을 유지합니다
- 명확하고 체계적인 커뮤니케이션을 합니다
- 문제 발생 시 즉시 PM에게 보고합니다

### 2. 주의사항
- 모든 수업 자료는 저작권 보호 대상입니다
- 개인정보 보호 규정을 준수합니다
- 출결 관리는 정확하게 진행합니다

### 3. 참고 사항
- 수업 시작 10분 전 Zoom 접속
- 녹화는 자동으로 진행됩니다
- 질문은 Slack 채널을 통해 받습니다

---

위 내용을 충분히 숙지한 후 아래 퀴즈를 진행해주세요.`;

// ============================================
// Helper Functions
// ============================================

/**
 * Check if URL is a Notion page
 */
export function isNotionUrl(url: string): boolean {
  return EXTERNAL_PLATFORMS.NOTION.some((domain) => url.includes(domain));
}

/**
 * Check if URL is an external meeting/collaboration platform
 */
export function isExternalMeetingUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return EXTERNAL_PLATFORMS.MEETING.some((domain) => lowerUrl.includes(domain));
}

/**
 * Validate video file extension
 */
export function isValidVideoFile(fileName: string): boolean {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return ACCEPTED_FILE_EXTENSIONS.VIDEO.includes(extension);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Format date string to Korean locale
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format video duration to minutes and seconds
 */
export function formatVideoDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}분 ${remainingSeconds}초`;
}

/**
 * Get file extension from file name
 */
export function getFileExtension(fileName: string): string {
  return fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
}

/**
 * Check if all required quiz questions are answered
 */
export function areAllQuestionsAnswered(
  answers: Record<number, number>,
  questionCount: number
): boolean {
  return Object.keys(answers).length === questionCount;
}

/**
 * Calculate quiz score
 */
export function calculateQuizScore(
  answers: Record<number, number>,
  questions: Array<{ id: number; correctAnswerIndex?: number; correctAnswer?: number }>
): number {
  return questions.filter((q) => {
    const correctIdx = q.correctAnswerIndex ?? q.correctAnswer;
    return answers[q.id] === correctIdx;
  }).length;
}

/**
 * Check if all quiz questions are answered correctly
 */
export function areAllQuestionsCorrect(
  answers: Record<number, number>,
  questions: Array<{ id: number; correctAnswerIndex?: number; correctAnswer?: number }>
): boolean {
  return questions.every((q) => {
    const correctIdx = q.correctAnswerIndex ?? q.correctAnswer;
    return answers[q.id] === correctIdx;
  });
}
