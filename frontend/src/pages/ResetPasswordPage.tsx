import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';

/**
 * Reset Password Page
 *
 * Allows users to set a new password using a reset token from email.
 * Validates password strength and confirms match before submission.
 *
 * @component
 * @example
 * // User clicks reset link in email
 * // URL: /auth/reset-password?token=abc123xyz
 *
 * Features:
 * - Token validation on mount
 * - Password strength requirements (min 8 chars)
 * - Password confirmation matching
 * - Success/error status displays
 * - Auto-redirect to login after success
 */

// Constants
const PASSWORD_MIN_LENGTH = 8;

const TOAST_MESSAGES = {
  INPUT_ERROR: {
    title: '입력 오류',
    allFields: '모든 필드를 입력해주세요.',
    minLength: `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`,
    noMatch: '비밀번호가 일치하지 않습니다.',
  },
  PASSWORD_CHANGED: {
    title: '비밀번호 변경 완료',
    description: '비밀번호가 성공적으로 변경되었습니다.',
  },
  RESET_FAILED: {
    title: '재설정 실패',
    defaultMessage: '비밀번호 재설정에 실패했습니다.',
  },
} as const;

const ERROR_MESSAGES = {
  NO_TOKEN: '비밀번호 재설정 토큰이 없습니다.',
} as const;

const STATUS = {
  INPUT: 'input',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

const ROUTES = {
  HOME: '/',
  FORGOT_PASSWORD: '/auth/forgot-password',
} as const;

const TIMEOUTS = {
  REDIRECT_DELAY: 2000,
} as const;

type PageStatus = typeof STATUS[keyof typeof STATUS];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<PageStatus>(STATUS.INPUT);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Validates password inputs
   * Returns true if valid, false otherwise
   */
  const validatePasswords = (): boolean => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: TOAST_MESSAGES.INPUT_ERROR.title,
        description: TOAST_MESSAGES.INPUT_ERROR.allFields,
        variant: 'destructive',
      });
      return false;
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      toast({
        title: TOAST_MESSAGES.INPUT_ERROR.title,
        description: TOAST_MESSAGES.INPUT_ERROR.minLength,
        variant: 'destructive',
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: TOAST_MESSAGES.INPUT_ERROR.title,
        description: TOAST_MESSAGES.INPUT_ERROR.noMatch,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  /**
   * Handles password reset form submission
   * Validates inputs and submits new password
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    if (!token) {
      setStatus(STATUS.ERROR);
      setErrorMessage(ERROR_MESSAGES.NO_TOKEN);
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.resetPassword(token, newPassword);
      setStatus(STATUS.SUCCESS);
      toast(TOAST_MESSAGES.PASSWORD_CHANGED);

      setTimeout(() => {
        navigate(ROUTES.HOME);
      }, TIMEOUTS.REDIRECT_DELAY);
    } catch (error) {
      setStatus(STATUS.ERROR);
      const errorMsg = error instanceof Error ? error.message : TOAST_MESSAGES.RESET_FAILED.defaultMessage;
      setErrorMessage(errorMsg);
      toast({
        title: TOAST_MESSAGES.RESET_FAILED.title,
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles navigation to home page
   */
  const handleGoHome = (): void => {
    navigate(ROUTES.HOME);
  };

  /**
   * Handles navigation to forgot password page
   */
  const handleGoToForgotPassword = (): void => {
    navigate(ROUTES.FORGOT_PASSWORD);
  };

  /**
   * Effect to check for token in URL params on mount
   */
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setStatus(STATUS.ERROR);
      setErrorMessage(ERROR_MESSAGES.NO_TOKEN);
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  if (status === STATUS.SUCCESS) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center" role="status" aria-label="비밀번호 변경 완료">
              <CheckCircle className="h-8 w-8 text-green-600" aria-hidden="true" />
            </div>
            <CardTitle>비밀번호 변경 완료!</CardTitle>
            <CardDescription>
              비밀번호가 성공적으로 변경되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              잠시 후 로그인 페이지로 이동합니다...
            </p>
            <Button onClick={handleGoHome} className="w-full" aria-label="로그인 페이지로 이동">
              로그인 페이지로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === STATUS.ERROR) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center" role="status" aria-label="재설정 실패">
              <XCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
            </div>
            <CardTitle>재설정 실패</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGoToForgotPassword} className="w-full" aria-label="비밀번호 찾기 다시 시도">
              비밀번호 찾기 다시 시도
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="w-full" aria-label="로그인 페이지로 돌아가기">
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              로그인으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>비밀번호 재설정</CardTitle>
          <CardDescription>
            새 비밀번호를 입력해주세요. (최소 {PASSWORD_MIN_LENGTH}자 이상)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-label="비밀번호 재설정 폼">
            <div className="space-y-2">
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={PASSWORD_MIN_LENGTH}
                aria-label="새 비밀번호 입력"
                aria-required="true"
                aria-describedby="password-requirements"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={PASSWORD_MIN_LENGTH}
                aria-label="비밀번호 확인 입력"
                aria-required="true"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              aria-label={isLoading ? '비밀번호 변경 중' : '비밀번호 변경'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  변경 중...
                </>
              ) : (
                '비밀번호 변경'
              )}
            </Button>
            <div className="text-center">
              <Link
                to={ROUTES.HOME}
                className="text-sm text-primary hover:underline inline-flex items-center"
                aria-label="로그인 페이지로 돌아가기"
              >
                <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                로그인으로 돌아가기
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
