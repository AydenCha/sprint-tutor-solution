import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { AlertTriangle, ArrowLeft, Loader2, Trash2 } from 'lucide-react';

/**
 * Delete Account Page
 *
 * Allows PM users to permanently delete their account with confirmation.
 * Requires user to type a specific confirmation text before deletion.
 *
 * @component
 * @example
 * <Route path="/auth/delete-account" element={<DeleteAccountPage />} />
 *
 * Features:
 * - Confirmation text validation (must type '탈퇴')
 * - Warning about irreversible action
 * - Automatic logout after deletion
 * - Redirect to home page after completion
 *
 * Notes:
 * - Account credentials are deleted
 * - Created data is preserved
 * - Audit logs maintain record with deletion marker
 */

// Constants
const REQUIRED_CONFIRMATION_TEXT = '탈퇴';

const TOAST_MESSAGES = {
  CONFIRMATION_REQUIRED: {
    title: '확인 필요',
  },
  DELETION_SUCCESS: {
    title: '회원 탈퇴 완료',
    description: '회원 탈퇴가 완료되었습니다.',
  },
  DELETION_FAILED: {
    title: '탈퇴 실패',
    defaultMessage: '회원 탈퇴에 실패했습니다.',
  },
} as const;

const ROUTES = {
  HOME: '/',
  PM_SETTINGS: '/pm/settings',
} as const;

const TIMEOUTS = {
  REDIRECT_DELAY: 2000,
} as const;

const WARNING_ITEMS = [
  '회원 탈퇴 시 로그인이 불가능합니다.',
  '작성한 데이터는 유지되며, 감사 로그에도 기록이 남습니다.',
  '감사 로그에는 "탈퇴" 표시가 추가됩니다.',
  '이 작업은 되돌릴 수 없습니다.',
] as const;

export default function DeleteAccountPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  /**
   * Handles confirmation text input change
   * Updates confirmed status when text matches required text
   */
  const handleConfirmChange = (value: string): void => {
    setConfirmText(value);
    setIsConfirmed(value === REQUIRED_CONFIRMATION_TEXT);
  };

  /**
   * Handles account deletion
   * Validates confirmation, deletes account, logs out, and redirects
   */
  const handleDelete = async (): Promise<void> => {
    if (!isConfirmed) {
      toast({
        title: TOAST_MESSAGES.CONFIRMATION_REQUIRED.title,
        description: `'${REQUIRED_CONFIRMATION_TEXT}'를 정확히 입력해주세요.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.deleteAccount();
      toast(TOAST_MESSAGES.DELETION_SUCCESS);

      logout();

      setTimeout(() => {
        navigate(ROUTES.HOME);
      }, TIMEOUTS.REDIRECT_DELAY);
    } catch (error) {
      toast({
        title: TOAST_MESSAGES.DELETION_FAILED.title,
        description: error instanceof Error ? error.message : TOAST_MESSAGES.DELETION_FAILED.defaultMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles navigation back to settings page
   */
  const handleCancel = (): void => {
    navigate(ROUTES.PM_SETTINGS);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="h-5 w-5 text-destructive" aria-hidden="true" />
            <CardTitle>회원 탈퇴</CardTitle>
          </div>
          <CardDescription>
            계정을 삭제하면 복구할 수 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive" role="alert" aria-labelledby="warning-title">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle id="warning-title">주의사항</AlertTitle>
            <AlertDescription className="mt-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                {WARNING_ITEMS.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label htmlFor="confirmInput" className="text-sm font-medium">
              탈퇴를 확인하려면 <span className="font-mono text-destructive">'{REQUIRED_CONFIRMATION_TEXT}'</span>를 입력하세요:
            </label>
            <input
              id="confirmInput"
              type="text"
              value={confirmText}
              onChange={(e) => handleConfirmChange(e.target.value)}
              placeholder={REQUIRED_CONFIRMATION_TEXT}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
              aria-label="탈퇴 확인 텍스트 입력"
              aria-required="true"
              aria-describedby="warning-title"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={isLoading}
              aria-label="탈퇴 취소하고 설정 페이지로 돌아가기"
            >
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              취소
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={!isConfirmed || isLoading}
              aria-label={isLoading ? '회원 탈퇴 처리 중' : '회원 탈퇴하기'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  처리 중...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  탈퇴하기
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
