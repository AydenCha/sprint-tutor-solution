import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';

/**
 * Forgot Password Page
 *
 * Allows users to request a password reset link via email.
 * Displays a success message after the email is sent.
 *
 * @component
 * @example
 * <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
 *
 * Features:
 * - Email validation
 * - Password reset link request
 * - Success confirmation screen
 * - Link expiration notice (1 hour)
 */

// Constants
const TOAST_MESSAGES = {
  INPUT_ERROR: {
    title: '입력 오류',
    description: '이메일을 입력해주세요.',
  },
  EMAIL_SENT: {
    title: '이메일 발송 완료',
    description: '비밀번호 재설정 링크를 이메일로 발송했습니다. 이메일을 확인해주세요.',
  },
  REQUEST_FAILED: {
    title: '요청 실패',
    defaultMessage: '비밀번호 재설정 요청에 실패했습니다.',
  },
} as const;

const ROUTES = {
  HOME: '/',
} as const;

const LINK_VALIDITY_HOURS = 1;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const emailPlaceholder = `pm${import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || '@codeit.com'}`;

  /**
   * Handles form submission for password reset request
   * Validates email and sends reset link
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!email) {
      toast({
        ...TOAST_MESSAGES.INPUT_ERROR,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.requestPasswordReset(email);
      setIsSubmitted(true);
      toast(TOAST_MESSAGES.EMAIL_SENT);
    } catch (error) {
      toast({
        title: TOAST_MESSAGES.REQUEST_FAILED.title,
        description: error instanceof Error ? error.message : TOAST_MESSAGES.REQUEST_FAILED.defaultMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles navigation back to home/login page
   */
  const handleGoBack = (): void => {
    navigate(ROUTES.HOME);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center" role="status" aria-label="이메일 발송 완료">
              <Mail className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <CardTitle>이메일 발송 완료</CardTitle>
            <CardDescription>
              비밀번호 재설정 링크를 {email}로 발송했습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정해주세요.
              링크는 {LINK_VALIDITY_HOURS}시간 동안 유효합니다.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleGoBack} aria-label="로그인 페이지로 돌아가기">
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                로그인으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>비밀번호 찾기</CardTitle>
          <CardDescription>
            등록된 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-label="비밀번호 재설정 요청 폼">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder={emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                aria-label="이메일 주소 입력"
                aria-required="true"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} aria-label={isLoading ? '재설정 링크 발송 중' : '재설정 링크 발송'}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  발송 중...
                </>
              ) : (
                '재설정 링크 발송'
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
