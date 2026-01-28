import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { PMNavigationHeader } from '@/components/PMNavigationHeader';

export default function PMSettingsPage() {
  const navigate = useNavigate();
  const { userName, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 max-w-[1600px]">
      <PMNavigationHeader
        title="계정 설정"
        description={`${userName || '관리자'} PM`}
      />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <CardTitle className="text-base sm:text-lg">계정 정보</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              계정 정보를 확인하고 관리할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* 계정 정보 섹션 */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">사용자 정보</h3>
              <div className="p-4 bg-muted/50 rounded-md space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">이름</span>
                  <span className="text-sm font-medium">{userName || '관리자'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">역할</span>
                  <span className="text-sm font-medium">PM (Project Manager)</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* 세션 관리 섹션 */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">세션 관리</h3>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </div>

            <Separator />

            {/* 위험한 작업 섹션 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-destructive mb-2">위험한 작업</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  다음 작업은 되돌릴 수 없습니다. 신중하게 결정해주세요.
                </p>
              </div>
              
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <CardTitle className="text-base text-destructive">회원 탈퇴</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    계정을 삭제하면 복구할 수 없습니다. 작성한 데이터는 유지되지만 로그인이 불가능합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => navigate('/pm/delete-account')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    회원 탈퇴하기
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
