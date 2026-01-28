/**
 * API Service Layer - Sprint Tutor Flow Frontend
 *
 * This module provides a comprehensive API client for communicating with the backend REST API.
 * It serves as the primary communication layer between the frontend and backend services.
 *
 * Architecture:
 * - Uses native Fetch API for HTTP requests
 * - JWT-based authentication with Bearer tokens stored in localStorage
 * - Centralized error handling with typed responses
 * - RESTful endpoint organization by domain
 *
 * Features:
 * - Type-safe request/response interfaces using TypeScript
 * - Automatic authentication header injection
 * - Consistent error handling and validation
 * - Request/response interceptors for common operations
 * - File upload/download support with FormData
 *
 * API Domains:
 * - Authentication: User login, registration, email verification, password reset
 * - Instructor Management: CRUD operations for instructor onboarding
 * - Task Management: Task status updates, quiz submissions, progress tracking
 * - File Operations: Upload/download/delete file attachments
 * - Content Modules: Reusable learning content (documents, videos, quizzes, checklists)
 * - Step Templates: Onboarding workflow templates and definitions
 * - Track Management: Course track configuration (Frontend, Backend, etc.)
 * - Audit Logs: System activity tracking and history
 *
 * Error Handling:
 * - HTTP errors are converted to Error objects with descriptive messages
 * - Validation errors (400) are formatted with field-level details
 * - Authentication errors (401) should trigger token refresh/re-login
 * - All API methods throw errors for non-OK responses
 *
 * Usage Example:
 * ```typescript
 * import api from '@/services/api';
 *
 * // Login
 * const { token, userId, role } = await api.auth.login('user@example.com', 'password');
 * localStorage.setItem('token', token);
 *
 * // Fetch data
 * const instructors = await api.instructor.getAll();
 *
 * // Create resource
 * const newInstructor = await api.instructor.register({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   // ... other fields
 * });
 * ```
 *
 * @module api
 * @author Sprint Tutor Flow Team
 */

import { getApiBaseUrl } from '@/config/env';

// ============================================
// Constants
// ============================================

/**
 * API Configuration Constants
 */
const API_CONFIG = {
  /** Base URL for all API requests */
  BASE_URL: (() => {
    const baseUrl = getApiBaseUrl();
    // Ensure BASE_URL ends with /api if it doesn't already
    if (!baseUrl.endsWith('/api') && !baseUrl.endsWith('/api/')) {
      return baseUrl.endsWith('/') ? `${baseUrl}api` : `${baseUrl}/api`;
    }
    return baseUrl;
  })(),

  /** Default timeout for requests in milliseconds */
  DEFAULT_TIMEOUT: 30000,

  /** Timeout for file uploads in milliseconds */
  UPLOAD_TIMEOUT: 120000,

  /** Maximum file size in bytes (50MB) */
  MAX_FILE_SIZE: 50 * 1024 * 1024,

  /** Retry configuration */
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000,
    MAX_DELAY: 5000,
    BACKOFF_MULTIPLIER: 2,
  },
} as const;

/**
 * API Endpoint Constants
 * Centralized endpoint paths for maintainability
 */
const ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER_PM: '/auth/register/pm',
  AUTH_VERIFY_EMAIL: '/auth/verify-email',
  AUTH_RESEND_VERIFICATION: '/auth/resend-verification',
  AUTH_DELETE_ACCOUNT: '/auth/account',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',

  // Instructors
  INSTRUCTORS: '/instructors',
  INSTRUCTOR_BY_ID: (id: number) => `/instructors/${id}`,
  INSTRUCTOR_STEPS: (id: number) => `/instructors/${id}/steps`,
  INSTRUCTOR_DASHBOARD: '/instructors/dashboard',

  // Tasks
  TASKS: '/tasks',
  TASK_BY_ID: (id: number) => `/tasks/${id}`,
  TASK_CONTENT: (id: number) => `/tasks/${id}/content`,
  TASK_QUIZ_SUBMIT: (id: number) => `/tasks/${id}/quiz-submit`,
  TASK_QUIZ_QUESTIONS: (id: number) => `/tasks/${id}/quiz-questions`,
  TASK_QUIZ_QUESTION_BY_ID: (id: number) => `/tasks/quiz-questions/${id}`,

  // Files
  FILES_UPLOAD: '/files/upload',
  FILE_BY_ID: (id: number) => `/files/${id}`,
  FILES_BY_TASK: (taskId: number) => `/files/task/${taskId}`,

  // Checklists
  CHECKLIST_ITEM: (id: number) => `/checklist/${id}`,
  CHECKLIST_ITEM_LABEL: (id: number) => `/checklist/${id}/label`,

  // Modules
  MODULES: '/modules',
  MODULE_BY_ID: (id: number) => `/modules/${id}`,
  MODULE_IMPORT: '/modules/import',
  MODULE_UPLOAD_VIDEO: (id: number) => `/modules/${id}/upload-video`,

  // Step Definitions
  STEP_DEFINITIONS: '/steps/definitions',
  STEP_DEFINITION_BY_ID: (id: number) => `/steps/definitions/${id}`,
  STEP_DEFINITIONS_ORDER: '/steps/definitions/order',
  STEP_DEFINITION_MODULES: (id: number) => `/steps/definitions/${id}/modules`,

  // Tracks
  TRACKS: '/tracks',
  TRACK_BY_ID: (id: number) => `/tracks/${id}`,

  // Audit Logs
  AUDIT_LOGS: '/audit-logs',
  AUDIT_LOGS_SEARCH: '/audit-logs/search',
  AUDIT_LOGS_BY_PM: (pmId: number) => `/audit-logs/pm/${pmId}`,
  AUDIT_LOGS_BY_ENTITY: (entityType: string) => `/audit-logs/entity/${entityType}`,
  AUDIT_LOGS_ENTITY_HISTORY: (entityType: string, entityId: number) =>
    `/audit-logs/entity/${entityType}/${entityId}/history`,
  AUDIT_LOGS_STATS_ACTIONS: '/audit-logs/stats/action-types',
  AUDIT_LOGS_STATS_ENTITIES: '/audit-logs/stats/entity-types',
  AUDIT_LOGS_EXPORT: '/audit-logs/export',
} as const;

/**
 * Error Messages
 * Standardized error messages for consistent user experience
 */
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  FILE_TOO_LARGE: `File size exceeds maximum allowed size (${API_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB).`,
  FILE_UPLOAD_FAILED: 'File upload failed.',
  FILE_DOWNLOAD_FAILED: 'File download failed.',
} as const;

/**
 * HTTP Status Codes
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ============================================
// Core Utilities
// ============================================

/**
 * Retrieves authentication headers including JWT token if available.
 *
 * This helper automatically includes the Authorization header with Bearer token
 * if a token is stored in localStorage. Used by all authenticated API requests.
 *
 * @returns Headers object with Content-Type and optional Authorization
 */
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Retrieves authentication headers for file upload (without Content-Type).
 *
 * FormData automatically sets the correct Content-Type with boundary,
 * so we must not set it manually.
 *
 * @returns Headers object with optional Authorization only
 */
const getAuthHeadersForUpload = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Error response structure from backend validation
 */
interface ValidationErrorResponse {
  message: string;
  errors?: Record<string, string>;
}

/**
 * Handles API responses with comprehensive error handling.
 *
 * Error Handling Strategy:
 * - 400 Bad Request with validation errors: Formats field-level errors
 * - 401 Unauthorized: Should trigger re-authentication in the calling code
 * - 404 Not Found: Resource doesn't exist
 * - 409 Conflict: Duplicate or constraint violation (e.g., email already exists)
 * - 500 Server Error: Backend failure
 *
 * @template T The expected response type
 * @param response The Fetch API Response object
 * @returns Parsed JSON response of type T
 * @throws Error with descriptive message for non-OK responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: ERROR_MESSAGES.UNKNOWN_ERROR
    })) as ValidationErrorResponse;

    // Handle validation errors (400 with errors object)
    if (response.status === HTTP_STATUS.BAD_REQUEST && error.errors) {
      // Format: "field: message, field: message"
      const validationMessages = Object.entries(error.errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ');
      throw new Error(validationMessages || error.message || ERROR_MESSAGES.VALIDATION_FAILED);
    }

    // Handle specific HTTP status codes
    switch (response.status) {
      case HTTP_STATUS.UNAUTHORIZED:
        throw new Error(error.message || ERROR_MESSAGES.UNAUTHORIZED);
      case HTTP_STATUS.FORBIDDEN:
        throw new Error(error.message || ERROR_MESSAGES.FORBIDDEN);
      case HTTP_STATUS.NOT_FOUND:
        throw new Error(error.message || ERROR_MESSAGES.NOT_FOUND);
      case HTTP_STATUS.CONFLICT:
        throw new Error(error.message || 'Conflict occurred');
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        throw new Error(error.message || ERROR_MESSAGES.SERVER_ERROR);
      default:
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
  }

  return response.json();
}

/**
 * Handles API responses that don't return JSON (e.g., DELETE operations).
 *
 * @param response The Fetch API Response object
 * @throws Error with descriptive message for non-OK responses
 */
async function handleVoidResponse(response: Response): Promise<void> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: ERROR_MESSAGES.UNKNOWN_ERROR
    })) as ValidationErrorResponse;

    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
}

/**
 * Creates a fetch configuration object with authentication headers.
 *
 * @param method HTTP method (GET, POST, PUT, DELETE)
 * @param body Optional request body (will be JSON stringified)
 * @returns Fetch RequestInit configuration
 */
function createFetchConfig(method: string, body?: unknown): RequestInit {
  const config: RequestInit = {
    method,
    headers: getAuthHeaders(),
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  return config;
}

/**
 * Creates a fetch configuration for file uploads.
 *
 * @param formData FormData object containing file and metadata
 * @returns Fetch RequestInit configuration
 */
function createUploadConfig(formData: FormData): RequestInit {
  return {
    method: 'POST',
    headers: getAuthHeadersForUpload(),
    body: formData,
  };
}

/**
 * Builds a URL with query parameters.
 *
 * @param endpoint Base endpoint path (e.g., '/instructors' or 'instructors')
 * @param params Record of query parameters
 * @returns Complete URL string with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Ensure BASE_URL doesn't have trailing slash
  const baseUrl = API_CONFIG.BASE_URL.endsWith('/') 
    ? API_CONFIG.BASE_URL.slice(0, -1) 
    : API_CONFIG.BASE_URL;
  
  // Construct full URL by concatenating baseUrl and endpoint
  // This ensures the endpoint is treated as a relative path
  const fullUrl = `${baseUrl}/${cleanEndpoint}`;
  const url = new URL(fullUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Performs a GET request.
 *
 * @template T The expected response type
 * @param endpoint API endpoint path
 * @param params Optional query parameters
 * @returns Promise resolving to typed response
 */
async function get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = buildUrl(endpoint, params);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include', // Include credentials for CORS
    });
    return handleResponse<T>(response);
  } catch (error) {
    // Handle network errors (CORS, connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`네트워크 오류: 백엔드 서버에 연결할 수 없습니다. (${url})`);
    }
    throw error;
  }
}

/**
 * Performs a POST request.
 *
 * @template T The expected response type
 * @param endpoint API endpoint path
 * @param body Request body
 * @returns Promise resolving to typed response
 */
async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const response = await fetch(url, createFetchConfig('POST', body));
  return handleResponse<T>(response);
}

/**
 * Performs a PUT request.
 *
 * @template T The expected response type
 * @param endpoint API endpoint path
 * @param body Request body
 * @returns Promise resolving to typed response
 */
async function put<T>(endpoint: string, body?: unknown): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const response = await fetch(url, createFetchConfig('PUT', body));
  return handleResponse<T>(response);
}

/**
 * Performs a DELETE request.
 *
 * @param endpoint API endpoint path
 * @returns Promise resolving when deletion completes
 */
async function del(endpoint: string): Promise<void> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const response = await fetch(url, createFetchConfig('DELETE'));
  return handleVoidResponse(response);
}

// ============================================
// Type Definitions
// ============================================

/**
 * Common Types
 */

/** Task status enum */
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

/** Step status enum */
export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

/** User role enum */
export type UserRole = 'PM' | 'INSTRUCTOR';

/** Content type enum for modules and tasks */
export type ContentType = 'A' | 'B' | 'C' | 'D';

/** Quiz question type enum */
export type QuizQuestionType = 'OBJECTIVE' | 'SUBJECTIVE';

/** Step type enum */
export type StepType = 'PM 주도' | '자가 점검' | '생략' | '지연';

/** Instructor type enum */
export type InstructorType = '신입' | '경력' | '재계약';

/** Onboarding module type enum */
export type OnboardingModuleType = '육성형' | '생존형' | '얼라인형' | '속성 적응형' | '업데이트형' | '최소 확인형';

/** Timing variable enum */
export type TimingVariable = '여유' | '긴급';

// ============================================
// Authentication API
// ============================================

/**
 * Authentication Request/Response Types
 */

export interface LoginRequest {
  /** Email or access code */
  identifier: string;
  /** User password */
  password: string;
}

export interface LoginResponse {
  /** JWT authentication token */
  token: string;
  /** User ID */
  userId: number;
  /** User role (PM or INSTRUCTOR) */
  role: UserRole;
  /** User display name */
  name: string;
}

export interface PmRegistrationRequest {
  /** Full name */
  name: string;
  /** Email address (must be unique) */
  email: string;
  /** Password (minimum 8 characters) */
  password: string;
}

export interface PmRegistrationResponse {
  /** JWT token (null until email verification completes) */
  token: string | null;
  /** User ID */
  userId: number;
  /** Full name */
  name: string;
  /** Email address */
  email: string;
  /** User role (always 'PM' for this endpoint) */
  role: 'PM';
  /** Email verification status */
  emailVerified: boolean;
}

export interface ApiSuccessResponse {
  /** Operation success status */
  success: boolean;
  /** Response message */
  message: string;
}

/**
 * Authentication API Methods
 *
 * Handles user authentication, registration, email verification, and password management.
 *
 * Endpoints:
 * - POST /auth/login - User login with identifier (email or access code) and password
 * - POST /auth/register/pm - PM user registration (requires email verification)
 * - POST /auth/verify-email - Email verification with token from verification email
 * - POST /auth/resend-verification - Resend verification email
 * - DELETE /auth/account - Delete user account (requires authentication)
 * - POST /auth/forgot-password - Request password reset email
 * - POST /auth/reset-password - Reset password with token from reset email
 *
 * Authentication Flow:
 * 1. Register: POST /auth/register/pm → returns userId but no token
 * 2. Verify Email: POST /auth/verify-email?token=XXX → returns token for login
 * 3. Login: POST /auth/login → returns token, store in localStorage
 * 4. API Calls: Include token in Authorization header as "Bearer {token}"
 *
 * Password Reset Flow:
 * 1. Request Reset: POST /auth/forgot-password?email=XXX
 * 2. Check Email: User receives reset link with token
 * 3. Reset Password: POST /auth/reset-password (token and newPassword in request body)
 */
export const authApi = {
  /**
   * Authenticates a user with identifier and password.
   *
   * @param identifier Email or instructor access code
   * @param password User password
   * @returns Login response with JWT token and user info
   * @throws Error if credentials are invalid or account doesn't exist
   */
  login: async (identifier: string, password: string): Promise<LoginResponse> => {
    return post<LoginResponse>(ENDPOINTS.AUTH_LOGIN, { identifier, password });
  },

  /**
   * Registers a new PM user (requires email verification).
   *
   * After registration, a verification email is sent. The user must click
   * the verification link before they can log in.
   *
   * @param data PM registration data
   * @returns Registration response (token is null until email verified)
   * @throws Error if email already exists or validation fails
   */
  registerPm: async (data: PmRegistrationRequest): Promise<PmRegistrationResponse> => {
    return post<PmRegistrationResponse>(ENDPOINTS.AUTH_REGISTER_PM, data);
  },

  /**
   * Verifies user email with token from verification email.
   *
   * @param token Email verification token (from email link)
   * @returns Login response with JWT token for immediate login
   * @throws Error if token is invalid or expired
   */
  verifyEmail: async (token: string): Promise<LoginResponse> => {
    const url = buildUrl(ENDPOINTS.AUTH_VERIFY_EMAIL, { token });
    const response = await fetch(url, createFetchConfig('POST'));
    return handleResponse<LoginResponse>(response);
  },

  /**
   * Resends verification email to user.
   *
   * @param email User email address
   * @returns Success response
   * @throws Error if email doesn't exist or already verified
   */
  resendVerificationEmail: async (email: string): Promise<ApiSuccessResponse> => {
    const url = buildUrl(ENDPOINTS.AUTH_RESEND_VERIFICATION, { email });
    const response = await fetch(url, createFetchConfig('POST'));
    return handleResponse<ApiSuccessResponse>(response);
  },

  /**
   * Deletes the authenticated user's account permanently.
   *
   * WARNING: This action is irreversible. All associated data will be deleted.
   *
   * @returns Success response
   * @throws Error if not authenticated or deletion fails
   */
  deleteAccount: async (): Promise<ApiSuccessResponse> => {
    return del(ENDPOINTS.AUTH_DELETE_ACCOUNT) as unknown as Promise<ApiSuccessResponse>;
  },

  /**
   * Requests a password reset email.
   *
   * Sends an email with a password reset link containing a token.
   *
   * @param email User email address
   * @returns Success response
   * @throws Error if email doesn't exist
   */
  requestPasswordReset: async (email: string): Promise<ApiSuccessResponse> => {
    const url = buildUrl(ENDPOINTS.AUTH_FORGOT_PASSWORD, { email });
    const response = await fetch(url, createFetchConfig('POST'));
    return handleResponse<ApiSuccessResponse>(response);
  },

  /**
   * Resets user password with token from reset email.
   *
   * <p><strong>Security Note:</strong> Password is sent in request body, not URL parameters,
   * to prevent exposure in browser history, server logs, or Referer headers.</p>
   *
   * @param token Password reset token (from email link)
   * @param newPassword New password (minimum 8 characters)
   * @returns Success response
   * @throws Error if token is invalid or expired
   */
  resetPassword: async (token: string, newPassword: string): Promise<ApiSuccessResponse> => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH_RESET_PASSWORD}`,
      createFetchConfig('POST', { token, newPassword })
    );
    return handleResponse<ApiSuccessResponse>(response);
  },
};

// ============================================
// Instructor Management API
// ============================================

/**
 * Instructor Request/Response Types
 */

/**
 * Step module configuration for instructor registration.
 * Specifies which modules are enabled for a specific step.
 */
export interface StepModuleConfiguration {
  /** Step definition ID */
  stepId: number;
  /** List of enabled module IDs for this step */
  enabledModuleIds: number[];
}

export interface InstructorRegistrationRequest {
  /** Full name */
  name: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone: string;
  /** Track name (e.g., "Frontend", "Backend") */
  track: string;
  /** Cohort identifier */
  cohort: string;
  /** Start date (ISO 8601 format) */
  startDate: string;
  /** Instructor type (optional) */
  instructorType?: InstructorType;
  /** Step configurations with module toggles (recommended) */
  stepConfigurations?: StepModuleConfiguration[];
  /** Selected step template ID for onboarding flow (deprecated, use stepConfigurations) */
  /** @deprecated */
  selectedStepTemplateId?: number;
  /** Ordered list of step definition IDs (deprecated, use stepConfigurations) */
  /** @deprecated */
  selectedStepDefinitionIds?: number[];
}

export interface InstructorUpdateRequest {
  /** Full name */
  name: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone: string;
  /** Track name */
  track: string;
  /** Cohort identifier */
  cohort: string;
  /** Start date (ISO 8601 format) */
  startDate: string;
  /** Instructor type (optional) */
  instructorType?: InstructorType;
}

export interface InstructorStepsUpdateRequest {
  /** Step configurations with module toggles (recommended) */
  stepConfigurations?: StepModuleConfiguration[];
  /** Selected step template ID (deprecated, use stepConfigurations) */
  /** @deprecated */
  selectedStepTemplateId?: number;
  /** Ordered list of step definition IDs (deprecated, use stepConfigurations) */
  /** @deprecated */
  selectedStepDefinitionIds?: number[];
}

export interface InstructorResponse {
  /** Instructor ID */
  id: number;
  /** Full name */
  name: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone: string;
  /** Track name */
  track: string;
  /** Cohort identifier */
  cohort: string;
  /** Access code for login */
  accessCode: string;
  /** Start date (ISO 8601 format) */
  startDate: string;
  /** Current step number */
  currentStep: number;
  /** Overall progress percentage (0-100) */
  overallProgress: number;
  /** Instructor type */
  instructorType?: InstructorType;
  /** Onboarding module type */
  onboardingModule?: OnboardingModuleType;
  /** Timing variable */
  timingVariable?: TimingVariable;
  /** Creation timestamp */
  createdAt?: string;
  /** Steps array (included when fetching by ID) */
  steps?: StepResponse[];
}

export interface InstructorDashboardResponse {
  /** Instructor ID */
  id: number;
  /** Full name */
  name: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone: string;
  /** Track name */
  track: string;
  /** Cohort identifier */
  cohort: string;
  /** Access code for login */
  accessCode: string;
  /** Start date (ISO 8601 format) */
  startDate: string;
  /** Current step number */
  currentStep: number;
  /** Overall progress percentage (0-100) */
  overallProgress: number;
  /** Instructor type */
  instructorType?: InstructorType;
  /** Onboarding module type */
  onboardingModule?: OnboardingModuleType;
  /** Timing variable */
  timingVariable?: TimingVariable;
  /** All steps with tasks */
  steps: StepResponse[];
  /** Days until deadline (negative if overdue) */
  dDay: number;
}

/**
 * Paginated response wrapper
 */
export interface PagedResponse<T> {
  /** Page content */
  content: T[];
  /** Total number of pages */
  totalPages: number;
  /** Total number of elements */
  totalElements: number;
  /** Page size */
  size: number;
  /** Current page number (0-indexed) */
  number: number;
}

/**
 * Instructor Management API Methods
 *
 * Handles instructor CRUD operations, onboarding workflows, and dashboard data.
 *
 * Endpoints:
 * - GET /instructors - Get all instructors (PM only, with pagination)
 * - GET /instructors/{id} - Get instructor by ID with steps
 * - POST /instructors - Register new instructor (PM only)
 * - PUT /instructors/{id} - Update instructor info (PM only)
 * - DELETE /instructors/{id} - Delete instructor (PM only)
 * - PUT /instructors/{id}/steps - Update instructor's step workflow (PM only)
 * - GET /instructors/dashboard - Get instructor's own dashboard (Instructor only)
 *
 * Access Control:
 * - PM: Can access all instructors and perform all operations
 * - Instructor: Can only access their own data via dashboard endpoint
 *
 * Pagination:
 * - Default page size: 1000 (to get all instructors at once)
 * - Sorted by D-day ascending (closest deadlines first)
 * - For production with large datasets, implement proper pagination UI
 */
export const instructorApi = {
  /**
   * Retrieves all instructors (PM only).
   *
   * Automatically handles pagination if there are more than 100 instructors.
   * Fetches all pages and combines results.
   *
   * @returns Array of instructor summaries
   * @throws Error if not authenticated as PM
   */
  getAll: async (): Promise<InstructorResponse[]> => {
    const allInstructors: InstructorResponse[] = [];
    let page = 0;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await get<PagedResponse<InstructorResponse>>(
          ENDPOINTS.INSTRUCTORS,
          { page, size: pageSize, sortBy: 'dday', direction: 'ASC' }
        );

        if (response.content && response.content.length > 0) {
          allInstructors.push(...response.content);
          
          // Check if there are more pages
          hasMore = !response.last && response.content.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      } catch (error) {
        // If it's the first page and we get an error, throw it
        if (page === 0) {
          throw error;
        }
        // Otherwise, stop fetching and return what we have
        hasMore = false;
      }
    }

    return allInstructors;
  },

  /**
   * Retrieves a specific instructor by ID with full details including steps.
   *
   * @param id Instructor ID
   * @returns Instructor details with steps
   * @throws Error if instructor not found or access denied
   */
  getById: async (id: number): Promise<InstructorResponse> => {
    return get<InstructorResponse>(ENDPOINTS.INSTRUCTOR_BY_ID(id));
  },

  /**
   * Registers a new instructor (PM only).
   *
   * Creates an instructor with optional onboarding workflow configuration.
   * Access code is automatically generated.
   *
   * @param data Instructor registration data
   * @returns Created instructor details
   * @throws Error if validation fails or email already exists
   */
  register: async (data: InstructorRegistrationRequest): Promise<InstructorResponse> => {
    return post<InstructorResponse>(ENDPOINTS.INSTRUCTORS, data);
  },

  /**
   * Updates instructor information (PM only).
   *
   * Updates basic instructor info. For workflow changes, use updateSteps().
   *
   * @param id Instructor ID
   * @param data Updated instructor data
   * @returns Updated instructor details
   * @throws Error if instructor not found or validation fails
   */
  update: async (id: number, data: InstructorUpdateRequest): Promise<InstructorResponse> => {
    return put<InstructorResponse>(ENDPOINTS.INSTRUCTOR_BY_ID(id), data);
  },

  /**
   * Deletes an instructor permanently (PM only).
   *
   * WARNING: This deletes all associated data (steps, tasks, progress).
   *
   * @param id Instructor ID
   * @throws Error if instructor not found or deletion fails
   */
  delete: async (id: number): Promise<void> => {
    return del(ENDPOINTS.INSTRUCTOR_BY_ID(id));
  },

  /**
   * Updates instructor's onboarding workflow (PM only).
   *
   * Changes the step template or step definitions for an instructor's
   * onboarding process.
   *
   * @param id Instructor ID
   * @param data Step workflow configuration
   * @returns Updated instructor details
   * @throws Error if template/definitions not found
   */
  updateSteps: async (id: number, data: InstructorStepsUpdateRequest): Promise<InstructorResponse> => {
    return put<InstructorResponse>(ENDPOINTS.INSTRUCTOR_STEPS(id), data);
  },

  /**
   * Retrieves instructor's own dashboard (Instructor only).
   *
   * Returns comprehensive dashboard data including all steps, tasks,
   * and progress tracking.
   *
   * @returns Dashboard data for authenticated instructor
   * @throws Error if not authenticated as instructor
   */
  getDashboard: async (): Promise<InstructorDashboardResponse> => {
    return get<InstructorDashboardResponse>(ENDPOINTS.INSTRUCTOR_DASHBOARD);
  },

  /**
   * Retrieves steps for a specific instructor.
   *
   * Helper method that fetches instructor data and extracts steps.
   *
   * @param instructorId Instructor ID
   * @returns Array of steps with tasks
   * @throws Error if instructor not found
   */
  getSteps: async (instructorId: number): Promise<StepResponse[]> => {
    const instructor = await get<InstructorResponse>(ENDPOINTS.INSTRUCTOR_BY_ID(instructorId));
    return instructor.steps || [];
  },
};

// ============================================
// Task Management API
// ============================================

/**
 * Task Request/Response Types
 */

export interface StepResponse {
  /** Step ID */
  id: number;
  /** Step definition ID (template) */
  stepDefinitionId?: number;
  /** Step number in sequence */
  stepNumber: number;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Days until deadline (negative if overdue) */
  dDay: number;
  /** Step status */
  status: StepStatus;
  /** Step type */
  stepType?: StepType;
  /** Progress percentage (0-100) */
  progress: number;
  /** Tasks in this step */
  tasks: TaskResponse[];
}

export interface TaskResponse {
  /** Task ID */
  id: number;
  /** Task title */
  title: string;
  /** Task description */
  description: string;
  /** Content type (A=Document, B=Video, C=File Upload, D=Checklist) */
  contentType: ContentType;
  /** Task status */
  status: TaskStatus;
  /** Whether this task is enabled for the instructor */
  isEnabled: boolean;
  /** Document URL (Type A) */
  documentUrl?: string;
  /** Document markdown content (Type A) */
  documentContent?: string;
  /** Video URL (Type B) */
  videoUrl?: string;
  /** Video duration in seconds (Type B) */
  videoDuration?: number;
  /** File upload requirements (Type C) */
  requiredFiles?: FileRequirement[];
  /** Quiz questions (Type A, B) */
  quizQuestions?: QuizQuestionResponse[];
  /** Checklist items (Type D) */
  checklistItems?: ChecklistItemResponse[];
  /** Files uploaded by instructor (Type C) */
  uploadedFiles?: FileUploadResponse[];
}

export interface QuizQuestionResponse {
  /** Question ID */
  id: number;
  /** Question text */
  question: string;
  /** Question type */
  questionType?: QuizQuestionType;
  /** Answer options (for objective questions) */
  options?: string[];
  /** @deprecated Use correctAnswerIndex instead */
  correctAnswer?: number;
  /** Correct answer index 0-based (for objective questions, PM only) */
  correctAnswerIndex?: number;
  /** Correct answer text (for subjective questions, PM only) */
  correctAnswerText?: string;
  /** Answer guide for subjective questions */
  answerGuide?: string;
  /** Explanation shown after answering */
  explanation?: string;
  /** User's answer index (for objective questions) */
  userAnswer?: number;
  /** User's answer text (for subjective questions) */
  userAnswerText?: string;
}

export interface ChecklistItemResponse {
  /** Checklist item ID */
  id: number;
  /** Item label */
  label: string;
  /** Checked status */
  checked: boolean;
}

export interface FileUploadResponse {
  /** File ID */
  id: number;
  /** Original filename */
  fileName: string;
  /** File download URL */
  url?: string;
  /** File size in bytes */
  fileSize: number;
  /** Upload timestamp */
  uploadedAt: string;
}

export interface TaskUpdateRequest {
  /** New task status */
  status: TaskStatus;
}

export interface QuizSubmissionRequest {
  /** Map of question ID to answer index */
  answers: Record<number, number>;
}

export interface QuizSubmissionResponse {
  /** Number of correct answers */
  score: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Whether the user passed (score/total >= passing threshold) */
  passed: boolean;
  /** Detailed results per question */
  results: QuizResultItem[];
}

export interface QuizResultItem {
  /** Question ID */
  questionId: number;
  /** Whether the answer was correct */
  correct: boolean;
  /** User's answer index */
  userAnswer: number;
  /** Correct answer index */
  correctAnswer: number;
}

/**
 * Task Management API Methods
 *
 * Handles task status updates, quiz submissions, and progress tracking.
 *
 * Endpoints:
 * - PUT /tasks/{id} - Update task status
 * - POST /tasks/{id}/quiz-submit - Submit quiz answers
 *
 * Task Workflow:
 * 1. View task content and requirements
 * 2. Update status to IN_PROGRESS
 * 3. Complete required actions (watch video, upload files, answer quiz, etc.)
 * 4. Update status to COMPLETED (or SKIPPED if allowed)
 */
export const taskApi = {
  /**
   * Updates task status.
   *
   * @param taskId Task ID
   * @param data Status update request
   * @returns Updated task details
   * @throws Error if task not found or status transition invalid
   */
  update: async (taskId: number, data: TaskUpdateRequest): Promise<TaskResponse> => {
    return put<TaskResponse>(ENDPOINTS.TASK_BY_ID(taskId), data);
  },

  /**
   * Submits quiz answers for grading.
   *
   * @param taskId Task ID
   * @param answers Quiz submission with answer indices
   * @returns Quiz results with score and correct answers
   * @throws Error if task not found or not a quiz task
   */
  submitQuiz: async (taskId: number, answers: QuizSubmissionRequest): Promise<QuizSubmissionResponse> => {
    return post<QuizSubmissionResponse>(ENDPOINTS.TASK_QUIZ_SUBMIT(taskId), answers);
  },
};

// ============================================
// PM Content Management API
// ============================================

/**
 * PM Content Request/Response Types
 */

export interface TaskContentUpdateRequest {
  /** Task title */
  title: string;
  /** Task description */
  description?: string;
  /** Document URL (Type A) */
  documentUrl?: string;
  /** Document markdown content (Type A) */
  documentContent?: string;
  /** Video URL (Type B) */
  videoUrl?: string;
  /** Video duration in seconds (Type B) */
  videoDuration?: number;
  /** File upload requirements (Type C) */
  requiredFiles?: string[];
}

export interface QuizQuestionRequest {
  /** Question text */
  question: string;
  /** Question type */
  questionType: QuizQuestionType;
  /** Answer options (required for OBJECTIVE) */
  options?: string[];
  /** Correct answer index 0-based (required for OBJECTIVE) */
  correctAnswerIndex?: number;
  /** Correct answer text (required for SUBJECTIVE) */
  correctAnswerText?: string;
  /** Answer guide for subjective questions */
  answerGuide?: string;
}

/**
 * PM Content Management API Methods
 *
 * Allows PMs to manage task content, quiz questions, and checklist items.
 *
 * Endpoints:
 * - PUT /tasks/{id}/content - Update task content (PM only)
 * - POST /tasks/{id}/quiz-questions - Create quiz question (PM only)
 * - PUT /tasks/quiz-questions/{id} - Update quiz question (PM only)
 * - DELETE /tasks/quiz-questions/{id} - Delete quiz question (PM only)
 * - GET /files/task/{id} - Get all files uploaded by instructors (PM only)
 * - PUT /checklist/{id}/label - Update checklist item label (PM only)
 *
 * Content Types:
 * - Type A: Document with optional quiz
 * - Type B: Video with optional quiz
 * - Type C: File upload with requirements
 * - Type D: Checklist with items
 */
export const pmContentApi = {
  /**
   * Updates task content (PM only).
   *
   * @param taskId Task ID
   * @param data Task content update request
   * @returns Updated task details
   * @throws Error if task not found or validation fails
   */
  updateTaskContent: async (taskId: number, data: TaskContentUpdateRequest): Promise<TaskResponse> => {
    return put<TaskResponse>(ENDPOINTS.TASK_CONTENT(taskId), data);
  },

  /**
   * Creates a new quiz question for a task (PM only).
   *
   * @param taskId Task ID
   * @param data Quiz question data
   * @returns Created quiz question
   * @throws Error if task not found or validation fails
   */
  createQuizQuestion: async (taskId: number, data: QuizQuestionRequest): Promise<QuizQuestionResponse> => {
    return post<QuizQuestionResponse>(ENDPOINTS.TASK_QUIZ_QUESTIONS(taskId), data);
  },

  /**
   * Updates an existing quiz question (PM only).
   *
   * @param questionId Question ID
   * @param data Updated quiz question data
   * @returns Updated quiz question
   * @throws Error if question not found or validation fails
   */
  updateQuizQuestion: async (questionId: number, data: QuizQuestionRequest): Promise<QuizQuestionResponse> => {
    return put<QuizQuestionResponse>(ENDPOINTS.TASK_QUIZ_QUESTION_BY_ID(questionId), data);
  },

  /**
   * Deletes a quiz question (PM only).
   *
   * @param questionId Question ID
   * @throws Error if question not found
   */
  deleteQuizQuestion: async (questionId: number): Promise<void> => {
    return del(ENDPOINTS.TASK_QUIZ_QUESTION_BY_ID(questionId));
  },

  /**
   * Retrieves all files uploaded by instructors for a task (PM only).
   *
   * @param taskId Task ID
   * @returns Array of uploaded files
   * @throws Error if task not found
   */
  getFilesByTask: async (taskId: number): Promise<FileUploadResponse[]> => {
    return get<FileUploadResponse[]>(ENDPOINTS.FILES_BY_TASK(taskId));
  },

  /**
   * Updates checklist item label (PM only).
   *
   * @param checklistItemId Checklist item ID
   * @param label New label text
   * @returns Updated checklist item
   * @throws Error if item not found
   */
  updateChecklistItemLabel: async (checklistItemId: number, label: string): Promise<ChecklistItemResponse> => {
    return put<ChecklistItemResponse>(ENDPOINTS.CHECKLIST_ITEM_LABEL(checklistItemId), { label });
  },
};

// ============================================
// File Management API
// ============================================

/**
 * File Management API Methods
 *
 * Handles file uploads, downloads, and deletions.
 *
 * Endpoints:
 * - POST /files/upload?taskId={id} - Upload file for a task
 * - GET /files/{id} - Download file
 * - DELETE /files/{id} - Delete file
 *
 * File Upload:
 * - Maximum file size: 50MB
 * - Supported formats: Depends on task requirements
 * - Files are associated with specific tasks
 *
 * File Storage:
 * - Files are stored on the server filesystem
 * - Original filenames are preserved
 * - File metadata is stored in database
 */
export const fileApi = {
  /**
   * Uploads a file for a task.
   *
   * @param taskId Task ID
   * @param file File object to upload
   * @returns Uploaded file metadata
   * @throws Error if file too large or upload fails
   */
  upload: async (taskId: number, file: File): Promise<FileUploadResponse> => {
    // Validate file size
    if (file.size > API_CONFIG.MAX_FILE_SIZE) {
      throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE);
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = buildUrl(ENDPOINTS.FILES_UPLOAD, { taskId });
    const response = await fetch(url, createUploadConfig(formData));

    if (!response.ok) {
      throw new Error(ERROR_MESSAGES.FILE_UPLOAD_FAILED);
    }

    return handleResponse<FileUploadResponse>(response);
  },

  /**
   * Downloads a file by ID.
   *
   * @param fileId File ID
   * @returns File blob for download
   * @throws Error if file not found or access denied
   */
  download: async (fileId: number): Promise<Blob> => {
    const url = buildUrl(ENDPOINTS.FILE_BY_ID(fileId));
    const response = await fetch(url, {
      headers: getAuthHeadersForUpload(),
      credentials: 'include', // Include credentials for CORS
    });

    if (!response.ok) {
      // Try to get error details from response
      const errorText = await response.text().catch(() => '');
      const statusText = response.statusText || 'Unknown error';
      throw new Error(`${ERROR_MESSAGES.FILE_DOWNLOAD_FAILED} (${response.status} ${statusText}): ${errorText}`);
    }

    return response.blob();
  },

  /**
   * Deletes a file permanently.
   *
   * @param fileId File ID
   * @throws Error if file not found or access denied
   */
  delete: async (fileId: number): Promise<void> => {
    return del(ENDPOINTS.FILE_BY_ID(fileId));
  },
};

// ============================================
// Checklist Management API
// ============================================

/**
 * Checklist Request/Response Types
 */

export interface ChecklistUpdateRequest {
  /** Checked status */
  checked: boolean;
}

/**
 * Checklist Management API Methods
 *
 * Handles checklist item status updates.
 *
 * Endpoints:
 * - PUT /checklist/{id} - Update checklist item checked status
 *
 * Checklists:
 * - Used in Type D tasks
 * - Each item can be checked/unchecked
 * - Progress is calculated based on checked items
 */
export const checklistApi = {
  /**
   * Updates checklist item checked status.
   *
   * @param itemId Checklist item ID
   * @param checked New checked status
   * @returns Updated checklist item
   * @throws Error if item not found
   */
  updateItem: async (itemId: number, checked: boolean): Promise<ChecklistItemResponse> => {
    return put<ChecklistItemResponse>(ENDPOINTS.CHECKLIST_ITEM(itemId), { checked });
  },
};

// ============================================
// Content Module API
// ============================================

/**
 * Module Request/Response Types
 */

export interface FileRequirement {
  /** File description shown to user */
  placeholder: string;
  /** Filename hint (e.g., "resume.pdf") */
  fileNameHint?: string;
  /** Allowed file extensions (e.g., [".pdf", ".doc"]) */
  allowedExtensions?: string[];
  /** Whether this file is required */
  required?: boolean;
}

export interface ModuleResponse {
  /** Module ID */
  id: number;
  /** Module name */
  name: string;
  /** Module description */
  description?: string;
  /** Content type */
  contentType: ContentType;
  /** Document URL (Type A) */
  documentUrl?: string;
  /** Video URL (Type B) */
  videoUrl?: string;
  /** Stored video filename (Type B) */
  videoStoredFileName?: string;
  /** Video duration in seconds (Type B) */
  videoDuration?: number;
  /** File upload requirements (Type C) */
  requiredFiles?: FileRequirement[];
  /** Quiz questions (Type A, B) */
  quizQuestions?: QuizQuestionResponse[];
  /** Checklist items (Type D) */
  checklistItems?: ChecklistItemResponse[];
  /** Tags for categorization */
  tags?: string[];
  /** Associated step definition ID */
  stepDefinitionId?: number;
  /** Associated step definition title */
  stepDefinitionTitle?: string;
  /** Creator name */
  createdBy?: string;
  /** Creation timestamp */
  createdAt?: string;
}

export interface ModuleRequest {
  /** Module name */
  name: string;
  /** Module description */
  description?: string;
  /** Content type */
  contentType: ContentType;
  /** Document URL (Type A) */
  documentUrl?: string;
  /** Video URL (Type B, external link) */
  videoUrl?: string;
  /** Video duration in seconds (Type B) */
  videoDuration?: number;
  /** File upload requirements (Type C) */
  requiredFiles?: FileRequirement[];
  /** Quiz questions (Type A, B) */
  quizQuestions?: QuizQuestionRequest[];
  /** Checklist items (Type D) */
  checklistItems?: ChecklistItemRequest[];
  /** Tags for categorization */
  tags?: string[];
  /** Associated step definition ID */
  stepDefinitionId?: number;
}

export interface ChecklistItemRequest {
  /** Checklist item label */
  label: string;
}

/**
 * Content Module API Methods
 *
 * Manages reusable learning content modules that can be assigned to tasks.
 *
 * Endpoints:
 * - GET /modules - Get all modules (with optional step filter)
 * - GET /modules/{id} - Get specific module
 * - POST /modules - Create new module (PM only)
 * - PUT /modules/{id} - Update module (PM only)
 * - DELETE /modules/{id} - Delete module (PM only)
 * - POST /modules/import - Import modules from CSV/Excel (PM only)
 * - POST /modules/{id}/upload-video - Upload video file (PM only)
 *
 * Module Types:
 * - Type A: Document with optional quiz
 * - Type B: Video with optional quiz
 * - Type C: File upload requirements
 * - Type D: Checklist items
 *
 * Module Workflow:
 * 1. Create reusable modules in module library
 * 2. Assign modules to step templates
 * 3. Step templates are used when creating instructor onboarding flows
 * 4. Tasks are generated from modules for each instructor
 */
export const moduleApi = {
  /**
   * Creates a new content module (PM only).
   *
   * @param request Module data
   * @returns Created module
   * @throws Error if validation fails
   */
  create: async (request: ModuleRequest): Promise<ModuleResponse> => {
    const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.MODULES}`;
    const response = await fetch(url, createFetchConfig('POST', request));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: ERROR_MESSAGES.UNKNOWN_ERROR
      }));
      console.error('Module creation failed:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return handleResponse<ModuleResponse>(response);
  },

  /**
   * Retrieves all modules, optionally filtered by step definition.
   *
   * @param stepDefinitionId Optional step definition ID filter
   * @returns Array of modules
   * @throws Error if request fails
   */
  getAll: async (stepDefinitionId?: number): Promise<ModuleResponse[]> => {
    return get<ModuleResponse[]>(ENDPOINTS.MODULES,
      stepDefinitionId ? { stepDefinitionId } : undefined
    );
  },

  /**
   * Retrieves a specific module by ID.
   *
   * @param id Module ID
   * @returns Module details
   * @throws Error if module not found
   */
  getById: async (id: number): Promise<ModuleResponse> => {
    return get<ModuleResponse>(ENDPOINTS.MODULE_BY_ID(id));
  },

  /**
   * Updates a content module (PM only).
   *
   * @param id Module ID
   * @param request Updated module data
   * @returns Updated module
   * @throws Error if module not found or validation fails
   */
  update: async (id: number, request: ModuleRequest): Promise<ModuleResponse> => {
    const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.MODULE_BY_ID(id)}`;
    const response = await fetch(url, createFetchConfig('PUT', request));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: ERROR_MESSAGES.UNKNOWN_ERROR
      }));
      console.error('Module update failed:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return handleResponse<ModuleResponse>(response);
  },

  /**
   * Deletes a content module (PM only).
   *
   * WARNING: Cannot delete modules that are referenced by step templates.
   *
   * @param id Module ID
   * @throws Error if module not found or still in use
   */
  delete: async (id: number): Promise<void> => {
    const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.MODULE_BY_ID(id)}`;
    const response = await fetch(url, createFetchConfig('DELETE'));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: ERROR_MESSAGES.UNKNOWN_ERROR
      }));
      console.error('Module deletion failed:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  },

  /**
   * Imports modules from CSV or Excel file (PM only).
   *
   * @param file CSV or Excel file
   * @returns Array of created modules
   * @throws Error if file format invalid or import fails
   */
  import: async (file: File): Promise<ModuleResponse[]> => {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.MODULE_IMPORT}`;
    const response = await fetch(url, createUploadConfig(formData));

    return handleResponse<ModuleResponse[]>(response);
  },

  /**
   * Uploads a video file to a module (Type B, PM only).
   *
   * @param moduleId Module ID
   * @param file Video file
   * @returns Updated module with video details
   * @throws Error if file too large or upload fails
   */
  uploadVideo: async (moduleId: number, file: File): Promise<ModuleResponse> => {
    // Validate file size
    if (file.size > API_CONFIG.MAX_FILE_SIZE) {
      throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE);
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.MODULE_UPLOAD_VIDEO(moduleId)}`;
    const response = await fetch(url, createUploadConfig(formData));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: ERROR_MESSAGES.UNKNOWN_ERROR
      }));
      console.error('Video upload failed:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return handleResponse<ModuleResponse>(response);
  },
};

// ============================================
// Step Definition API
// ============================================

/**
 * Step Definition Request/Response Types
 */

export interface StepDefinitionResponse {
  /** Step definition ID */
  id: number;
  /** Step title */
  title: string;
  /** Step emoji icon */
  emoji?: string;
  /** Step description */
  description?: string;
  /** Default D-day value */
  defaultDDay?: number;
  /** Step type */
  stepType?: StepType;
  /** Default module IDs assigned to this step */
  defaultModuleIds?: number[];
  /** Creator name */
  createdBy?: string;
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
}

export interface StepDefinitionRequest {
  /** Step title */
  title: string;
  /** Step emoji icon */
  emoji?: string;
  /** Step description */
  description?: string;
  /** Default D-day value */
  defaultDDay?: number;
  /** Step type */
  stepType?: StepType;
  /** Module IDs to assign to this step */
  moduleIds?: number[];
}

/**
 * Step Definition API Methods
 *
 * Manages step definitions - reusable step blueprints.
 *
 * Endpoints:
 * - GET /steps/definitions - Get all step definitions
 * - GET /steps/definitions/{id} - Get specific step definition
 * - POST /steps/definitions - Create new step definition (PM only)
 * - PUT /steps/definitions/{id} - Update step definition (PM only)
 * - DELETE /steps/definitions/{id} - Delete step definition (PM only)
 * - PUT /steps/definitions/order - Update step definition order (PM only)
 *
 * Step Definitions:
 * - Define reusable onboarding steps (e.g., "Welcome", "Setup", "First Task")
 * - Can be combined into step templates
 * - Each definition has a default D-day and step type
 * - Order determines default sequence in templates
 */
export const stepDefinitionApi = {
  /**
   * Retrieves all step definitions.
   *
   * @returns Array of step definitions
   * @throws Error if request fails
   */
  getAll: async (): Promise<StepDefinitionResponse[]> => {
    return get<StepDefinitionResponse[]>(ENDPOINTS.STEP_DEFINITIONS);
  },

  /**
   * Retrieves a specific step definition by ID.
   *
   * @param id Step definition ID
   * @returns Step definition details
   * @throws Error if not found
   */
  getById: async (id: number): Promise<StepDefinitionResponse> => {
    return get<StepDefinitionResponse>(ENDPOINTS.STEP_DEFINITION_BY_ID(id));
  },

  /**
   * Creates a new step definition (PM only).
   *
   * @param request Step definition data
   * @returns Created step definition
   * @throws Error if validation fails
   */
  create: async (request: StepDefinitionRequest): Promise<StepDefinitionResponse> => {
    return post<StepDefinitionResponse>(ENDPOINTS.STEP_DEFINITIONS, request);
  },

  /**
   * Updates a step definition (PM only).
   *
   * @param id Step definition ID
   * @param request Updated step definition data
   * @returns Updated step definition
   * @throws Error if not found or validation fails
   */
  update: async (id: number, request: StepDefinitionRequest): Promise<StepDefinitionResponse> => {
    return put<StepDefinitionResponse>(ENDPOINTS.STEP_DEFINITION_BY_ID(id), request);
  },

  /**
   * Deletes a step definition (PM only).
   *
   * WARNING: Cannot delete if referenced by step templates.
   *
   * @param id Step definition ID
   * @throws Error if not found or still in use
   */
  delete: async (id: number): Promise<void> => {
    return del(ENDPOINTS.STEP_DEFINITION_BY_ID(id));
  },

  /**
   * Updates the order of step definitions (PM only).
   *
   * @param stepDefinitionIdsInOrder Ordered array of step definition IDs
   * @returns Updated step definitions in new order
   * @throws Error if any ID not found
   */
  updateOrder: async (stepDefinitionIdsInOrder: number[]): Promise<StepDefinitionResponse[]> => {
    return put<StepDefinitionResponse[]>(ENDPOINTS.STEP_DEFINITIONS_ORDER, stepDefinitionIdsInOrder);
  },

  /**
   * Assigns modules to a step definition (PM only).
   *
   * Associates content modules with a step definition. When instructors are registered
   * using this step, these modules become available tasks that can be individually enabled
   * or disabled per instructor.
   *
   * @param id Step definition ID
   * @param moduleIds Array of module IDs to assign (in display order)
   * @returns Updated step definition with assigned modules
   * @throws Error if step or modules not found
   */
  assignModules: async (id: number, moduleIds: number[]): Promise<StepDefinitionResponse> => {
    return put<StepDefinitionResponse>(ENDPOINTS.STEP_DEFINITION_MODULES(id), moduleIds);
  },
};

// ============================================
// Track Management API
// ============================================

/**
 * Track Request/Response Types
 */

export interface TrackRequest {
  /** English name (e.g., "FRONTEND") */
  name: string;
  /** Korean name (e.g., "프론트엔드") */
  koreanName: string;
  /** Short code (e.g., "FE", "BE") */
  code: string;
  /** Track description */
  description?: string;
  /** Whether track is enabled */
  enabled: boolean;
}

export interface TrackResponse {
  /** Track ID */
  id: number;
  /** English name */
  name: string;
  /** Korean name */
  koreanName: string;
  /** Short code */
  code: string;
  /** Whether track is enabled */
  enabled: boolean;
  /** Track description */
  description?: string;
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
}

/**
 * Track Management API Methods
 *
 * Manages course tracks (Frontend, Backend, etc.).
 *
 * Endpoints:
 * - GET /tracks - Get all tracks
 * - GET /tracks/{id} - Get specific track
 * - POST /tracks - Create new track (PM only)
 * - PUT /tracks/{id} - Update track (PM only)
 * - DELETE /tracks/{id} - Delete track (PM only)
 *
 * Tracks:
 * - Define different course types (e.g., Frontend, Backend, Mobile)
 * - Used for categorizing instructors and content
 * - Can be enabled/disabled
 */
export const trackApi = {
  /**
   * Retrieves all tracks.
   *
   * @returns Array of tracks
   * @throws Error if request fails
   */
  getAll: async (): Promise<TrackResponse[]> => {
    return get<TrackResponse[]>(ENDPOINTS.TRACKS);
  },

  /**
   * Retrieves a specific track by ID.
   *
   * @param id Track ID
   * @returns Track details
   * @throws Error if not found
   */
  getById: async (id: number): Promise<TrackResponse> => {
    return get<TrackResponse>(ENDPOINTS.TRACK_BY_ID(id));
  },

  /**
   * Creates a new track (PM only).
   *
   * @param data Track data
   * @returns Created track
   * @throws Error if validation fails or code/name already exists
   */
  create: async (data: TrackRequest): Promise<TrackResponse> => {
    return post<TrackResponse>(ENDPOINTS.TRACKS, data);
  },

  /**
   * Updates a track (PM only).
   *
   * @param id Track ID
   * @param data Updated track data
   * @returns Updated track
   * @throws Error if not found or validation fails
   */
  update: async (id: number, data: TrackRequest): Promise<TrackResponse> => {
    return put<TrackResponse>(ENDPOINTS.TRACK_BY_ID(id), data);
  },

  /**
   * Deletes a track (PM only).
   *
   * WARNING: Cannot delete if assigned to instructors.
   *
   * @param id Track ID
   * @throws Error if not found or still in use
   */
  delete: async (id: number): Promise<void> => {
    return del(ENDPOINTS.TRACK_BY_ID(id));
  },
};

// ============================================
// Audit Log API
// ============================================

/**
 * Audit Log Request/Response Types
 */

export interface AuditLogResponse {
  /** Audit log ID */
  id: number;
  /** Action type (CREATE, UPDATE, DELETE, etc.) */
  actionType: string;
  /** Entity type (Instructor, Task, Module, etc.) */
  entityType: string;
  /** Entity ID (null for system actions) */
  entityId: number | null;
  /** Name of user who performed action */
  performedByName: string;
  /** Email of user who performed action */
  performedByEmail: string | null;
  /** ID of user who performed action */
  performedById: number | null;
  /** Old value before change (JSON string) */
  oldValue: string | null;
  /** New value after change (JSON string) */
  newValue: string | null;
  /** Human-readable description */
  description: string;
  /** Additional metadata (JSON string) */
  metadata: string | null;
  /** When action was performed */
  actionTime: string;
  /** When log was created */
  createdAt: string;
}

export interface PagedAuditLogResponse {
  /** Page content */
  content: AuditLogResponse[];
  /** Total number of pages */
  totalPages: number;
  /** Total number of elements */
  totalElements: number;
  /** Page size */
  size: number;
  /** Current page number (0-indexed) */
  number: number;
}

/**
 * Audit Log API Methods
 *
 * Provides comprehensive audit logging and activity tracking.
 *
 * Endpoints:
 * - GET /audit-logs - Get recent logs (paginated)
 * - GET /audit-logs/search - Search logs with filters (paginated)
 * - GET /audit-logs/pm/{pmId} - Get logs by PM (paginated)
 * - GET /audit-logs/entity/{entityType} - Get logs by entity type (paginated)
 * - GET /audit-logs/entity/{entityType}/{entityId}/history - Get entity history
 * - GET /audit-logs/stats/action-types - Get action type statistics
 * - GET /audit-logs/stats/entity-types - Get entity type statistics
 * - GET /audit-logs/export - Export logs to CSV
 *
 * Audit Logs:
 * - Track all significant system actions
 * - Record who performed actions and when
 * - Maintain history of changes with old/new values
 * - Support filtering, searching, and exporting
 */
export const auditLogApi = {
  /**
   * Retrieves recent audit logs with pagination.
   *
   * @param page Page number (0-indexed)
   * @param size Page size
   * @returns Paginated audit logs
   * @throws Error if request fails
   */
  getRecentLogs: async (page = 0, size = 20): Promise<PagedAuditLogResponse> => {
    return get<PagedAuditLogResponse>(ENDPOINTS.AUDIT_LOGS, { page, size });
  },

  /**
   * Searches audit logs with filters and pagination.
   *
   * @param actionType Filter by action type
   * @param entityType Filter by entity type
   * @param searchQuery Search in descriptions
   * @param startDate Filter by start date (ISO 8601)
   * @param endDate Filter by end date (ISO 8601)
   * @param page Page number (0-indexed)
   * @param size Page size
   * @returns Paginated audit logs matching filters
   * @throws Error if request fails
   */
  searchLogs: async (
    actionType?: string,
    entityType?: string,
    searchQuery?: string,
    startDate?: string,
    endDate?: string,
    page = 0,
    size = 20
  ): Promise<PagedAuditLogResponse> => {
    return get<PagedAuditLogResponse>(ENDPOINTS.AUDIT_LOGS_SEARCH, {
      page,
      size,
      ...(actionType && { actionType }),
      ...(entityType && { entityType }),
      ...(searchQuery && { searchQuery }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
  },

  /**
   * Retrieves audit logs for a specific PM with pagination.
   *
   * @param pmId PM user ID
   * @param page Page number (0-indexed)
   * @param size Page size
   * @returns Paginated audit logs for PM
   * @throws Error if PM not found
   */
  getLogsByPm: async (pmId: number, page = 0, size = 20): Promise<PagedAuditLogResponse> => {
    return get<PagedAuditLogResponse>(ENDPOINTS.AUDIT_LOGS_BY_PM(pmId), { page, size });
  },

  /**
   * Retrieves audit logs for a specific entity type with pagination.
   *
   * @param entityType Entity type (Instructor, Task, Module, etc.)
   * @param page Page number (0-indexed)
   * @param size Page size
   * @returns Paginated audit logs for entity type
   * @throws Error if request fails
   */
  getLogsByEntityType: async (entityType: string, page = 0, size = 20): Promise<PagedAuditLogResponse> => {
    return get<PagedAuditLogResponse>(ENDPOINTS.AUDIT_LOGS_BY_ENTITY(entityType), { page, size });
  },

  /**
   * Retrieves complete history for a specific entity.
   *
   * @param entityType Entity type (Instructor, Task, Module, etc.)
   * @param entityId Entity ID
   * @returns Complete audit history for entity
   * @throws Error if entity not found
   */
  getEntityHistory: async (entityType: string, entityId: number): Promise<AuditLogResponse[]> => {
    return get<AuditLogResponse[]>(ENDPOINTS.AUDIT_LOGS_ENTITY_HISTORY(entityType, entityId));
  },

  /**
   * Retrieves statistics by action type.
   *
   * @returns Map of action type to count
   * @throws Error if request fails
   */
  getStatsByActionType: async (): Promise<Record<string, number>> => {
    return get<Record<string, number>>(ENDPOINTS.AUDIT_LOGS_STATS_ACTIONS);
  },

  /**
   * Retrieves statistics by entity type.
   *
   * @returns Map of entity type to count
   * @throws Error if request fails
   */
  getStatsByEntityType: async (): Promise<Record<string, number>> => {
    return get<Record<string, number>>(ENDPOINTS.AUDIT_LOGS_STATS_ENTITIES);
  },

  /**
   * Exports audit logs to CSV file.
   *
   * Downloads a CSV file with filtered audit logs. File is automatically
   * downloaded via browser.
   *
   * @param actionType Filter by action type
   * @param entityType Filter by entity type
   * @param searchQuery Search in descriptions
   * @param startDate Filter by start date (ISO 8601)
   * @param endDate Filter by end date (ISO 8601)
   * @throws Error if export fails
   */
  exportToCsv: async (
    actionType?: string,
    entityType?: string,
    searchQuery?: string,
    startDate?: string,
    endDate?: string
  ): Promise<void> => {
    const url = buildUrl(ENDPOINTS.AUDIT_LOGS_EXPORT, {
      ...(actionType && { actionType }),
      ...(entityType && { entityType }),
      ...(searchQuery && { searchQuery }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    const response = await fetch(url, { headers: getAuthHeaders() });

    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

// ============================================
// Default Export - Unified API Object
// ============================================

/**
 * Unified API client object.
 *
 * This is the main export that provides access to all API domains.
 * Import this in your components to make API calls.
 *
 * Example:
 * ```typescript
 * import api from '@/services/api';
 *
 * const instructors = await api.instructor.getAll();
 * const loginResponse = await api.auth.login('user@example.com', 'password');
 * ```
 */
const api = {
  /** Authentication API */
  auth: authApi,
  /** Instructor management API */
  instructor: instructorApi,
  /** Task management API */
  task: taskApi,
  /** File operations API */
  file: fileApi,
  /** Checklist management API */
  checklist: checklistApi,
  /** PM content management API */
  pmContentApi: pmContentApi,
  /** Step definitions API */
  stepDefinition: stepDefinitionApi,
  /** Content modules API */
  module: moduleApi,
  /** Track management API */
  track: trackApi,
  /** Audit logs API */
  auditLog: auditLogApi,
};

export default api;
