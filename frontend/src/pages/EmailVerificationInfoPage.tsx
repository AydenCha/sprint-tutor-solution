import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

/**
 * Email Verification Information Page
 *
 * Displays post-registration instructions for PM email verification.
 * Allows users to resend verification emails if needed.
 *
 * @component
 * @example
 * // Navigated to after successful PM registration with email state
 * navigate('/auth/verify-email-info', { state: { email: 'pm@codeit.com' } })
 */

// Constants
const TOAST_MESSAGES = {
  NO_EMAIL: {
    title: '오류',
    description: '이메일 주소를 찾을 수 없습니다.',
  },
  RESEND_SUCCESS: {
    title: '재발송 완료',
    description: '인증 이메일을 재발송했습니다. 이메일을 확인해주세요.',
  },
  RESEND_ERROR: {
    title: '재발송 실패',
    description: '이메일 재발송에 실패했습니다.',
  },
} as const;

interface LocationState {
  email?: string;
}

export default function EmailVerificationInfoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const locationState = location.state as LocationState | null;
  const email = locationState?.email || '';
  const [isResending, setIsResending] = useState(false);

  /**
   * Handles resending the verification email
   * Shows appropriate toast notifications for success/failure
   */
  const handleResendEmail = async (): Promise<void> => {
    if (!email) {
      toast({
        ...TOAST_MESSAGES.NO_EMAIL,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsResending(true);
      await api.auth.resendVerificationEmail(email);
      toast(TOAST_MESSAGES.RESEND_SUCCESS);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : TOAST_MESSAGES.RESEND_ERROR.description;

      toast({
        title: TOAST_MESSAGES.RESEND_ERROR.title,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>이메일 인증이 필요합니다</CardTitle>
          <CardDescription>
            회원가입이 완료되었습니다. 이메일을 확인해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-center font-medium mb-2">
              {email || '등록하신 이메일 주소'}로 인증 링크를 발송했습니다.
            </p>
            <p className="text-xs text-muted-foreground text-center">
              이메일의 링크를 클릭하여 인증을 완료해주세요.
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 이메일이 보이지 않으면 스팸함을 확인해주세요.</p>
            <p>• 인증 링크는 24시간 동안 유효합니다.</p>
            <p>• 인증을 완료해야 로그인할 수 있습니다.</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={isResending || !email}
              className="flex-1"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  발송 중...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  이메일 재발송
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex-1"
              aria-label="홈으로 이동"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              홈으로
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

