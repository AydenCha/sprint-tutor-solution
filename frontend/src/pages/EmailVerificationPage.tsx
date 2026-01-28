import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Email Verification Page
 *
 * Processes email verification tokens from verification links sent to users.
 * Automatically verifies the token on mount and displays appropriate status.
 *
 * @component
 * @example
 * // User clicks verification link in email
 * // URL: /auth/verify-email?token=abc123xyz
 *
 * Features:
 * - Automatic token verification on mount
 * - Four states: verifying, success, expired, error
 * - Auto-login on successful verification
 * - Automatic redirect to dashboard after verification
 */

// Constants
const VERIFICATION_STATUS = {
  VERIFYING: 'verifying',
  SUCCESS: 'success',
  EXPIRED: 'expired',
  ERROR: 'error',
} as const;

const TOAST_MESSAGES = {
  VERIFICATION_SUCCESS: {
    title: '이메일 인증 완료',
    description: '이메일 인증이 완료되었습니다. 대시보드로 이동합니다.',
  },
  VERIFICATION_CHECK: {
    title: '인증 확인',
    description: '인증 상태를 확인했습니다. 로그인 페이지로 이동합니다.',
  },
  VERIFICATION_FAILED: {
    title: '인증 실패',
  },
  RESEND_INFO: {
    title: '재발송 기능',
    description: '재발송을 원하시면 로그인 페이지에서 "인증 이메일 재발송"을 이용해주세요.',
  },
} as const;

const ERROR_KEYWORDS = {
  EXPIRED: ['expired', '만료'],
  INVALID: ['Invalid', '잘못된'],
} as const;

const ROUTES = {
  HOME: '/',
  PM_DASHBOARD: '/pm/dashboard',
} as const;

const TIMEOUTS = {
  REDIRECT_DELAY: 2000,
} as const;

const ERROR_MESSAGES = {
  NO_TOKEN: '인증 토큰이 없습니다.',
  NO_TOKEN_IN_RESPONSE: '인증 응답에 토큰이 없습니다.',
} as const;

const DEFAULT_ROLE = 'PM';
const DEFAULT_NAME = 'User';
const TOKEN_VALIDITY_HOURS = 24;

type VerificationStatus = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { login } = useAuth();

  const [status, setStatus] = useState<VerificationStatus>(VERIFICATION_STATUS.VERIFYING);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const token = searchParams.get('token');

  /**
   * Checks if the error message contains specific keywords
   */
  const containsKeyword = (message: string, keywords: readonly string[]): boolean => {
    return keywords.some(keyword => message.includes(keyword));
  };

  /**
   * Verifies the email using the provided token
   * Handles success, expiration, and error states
   */
  const verifyEmail = async (verificationToken: string): Promise<void> => {
    try {
      console.log('이메일 인증 시작, 토큰:', verificationToken.substring(0, 20) + '...');
      const response = await api.auth.verifyEmail(verificationToken);
      console.log('이메일 인증 응답:', response);

      if (!response?.token) {
        throw new Error(ERROR_MESSAGES.NO_TOKEN_IN_RESPONSE);
      }

      login(
        response.token,
        response.userId,
        response.role || DEFAULT_ROLE,
        response.name || DEFAULT_NAME
      );

      setStatus(VERIFICATION_STATUS.SUCCESS);
      toast(TOAST_MESSAGES.VERIFICATION_SUCCESS);

      setTimeout(() => {
        navigate(ROUTES.PM_DASHBOARD);
      }, TIMEOUTS.REDIRECT_DELAY);
    } catch (error) {
      console.error('이메일 인증 오류:', error);
      const errorMsg = error instanceof Error ? error.message : '이메일 인증에 실패했습니다.';
      setErrorMessage(errorMsg);

      if (containsKeyword(errorMsg, ERROR_KEYWORDS.EXPIRED)) {
        setStatus(VERIFICATION_STATUS.EXPIRED);
      } else if (containsKeyword(errorMsg, ERROR_KEYWORDS.INVALID)) {
        setStatus(VERIFICATION_STATUS.ERROR);
      } else {
        console.warn('인증 오류 발생, 하지만 이미 인증되었을 수 있음:', errorMsg);
        toast(TOAST_MESSAGES.VERIFICATION_CHECK);
        setTimeout(() => {
          navigate(ROUTES.HOME);
        }, TIMEOUTS.REDIRECT_DELAY);
      }

      toast({
        title: TOAST_MESSAGES.VERIFICATION_FAILED.title,
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  /**
   * Effect to verify email on component mount
   */
  useEffect(() => {
    if (!token) {
      setStatus(VERIFICATION_STATUS.ERROR);
      setErrorMessage(ERROR_MESSAGES.NO_TOKEN);
      return;
    }

    verifyEmail(token);
  }, [token]);

  /**
   * Handles resend email button click
   * Directs users to use the resend feature on the login page
   */
  const handleResendEmail = (): void => {
    toast(TOAST_MESSAGES.RESEND_INFO);
  };

  /**
   * Handles navigation to home page
   */
  const handleGoHome = (): void => {
    navigate(ROUTES.HOME);
  };

  /**
   * Handles navigation to PM dashboard
   */
  const handleGoToDashboard = (): void => {
    navigate(ROUTES.PM_DASHBOARD);
  };

  if (status === VERIFICATION_STATUS.VERIFYING) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center" role="status" aria-label="인증 진행 중">
              <Loader2 className="h-8 w-8 text-primary animate-spin" aria-hidden="true" />
            </div>
            <CardTitle>이메일 인증 중...</CardTitle>
            <CardDescription>잠시만 기다려주세요.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === VERIFICATION_STATUS.SUCCESS) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center" role="status" aria-label="인증 성공">
              <CheckCircle className="h-8 w-8 text-green-600" aria-hidden="true" />
            </div>
            <CardTitle>이메일 인증 완료!</CardTitle>
            <CardDescription>이메일 인증이 성공적으로 완료되었습니다.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              잠시 후 대시보드로 이동합니다...
            </p>
            <Button onClick={handleGoToDashboard} className="w-full" aria-label="대시보드로 이동">
              대시보드로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === VERIFICATION_STATUS.EXPIRED) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center" role="status" aria-label="인증 링크 만료">
              <Mail className="h-8 w-8 text-yellow-600" aria-hidden="true" />
            </div>
            <CardTitle>인증 링크 만료</CardTitle>
            <CardDescription>인증 링크가 만료되었습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              인증 링크는 {TOKEN_VALIDITY_HOURS}시간 동안만 유효합니다. 새로운 인증 링크를 요청해주세요.
            </p>
            <Button onClick={handleResendEmail} variant="outline" className="w-full" aria-label="인증 이메일 재발송 안내">
              인증 이메일 재발송
            </Button>
            <Button onClick={handleGoHome} variant="ghost" className="w-full" aria-label="홈으로 돌아가기">
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center" role="status" aria-label="인증 실패">
            <XCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
          </div>
          <CardTitle>인증 실패</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGoHome} className="w-full" aria-label="홈으로 돌아가기">
            홈으로 돌아가기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

