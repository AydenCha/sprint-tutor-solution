import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { FIGMA_LOGO_SYMBOL, FIGMA_ICON_USER, FIGMA_ICON_LOGOUT } from '@/assets/figma-images';
import { FigmaIcon } from '@/components/FigmaIcon';

interface InstructorHeaderProps {
  instructorName?: string;
  accessCode?: string;
}

export function InstructorHeader({ instructorName, accessCode }: InstructorHeaderProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({ title: '로그아웃', description: '안전하게 로그아웃되었습니다.' });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-figma-gray-20 bg-figma-gray-00 backdrop-blur-sm shadow-sm">
      {/* Header: responsive padding */}
      <div className="mx-auto max-w-[1920px] px-4 sm:px-8 md:px-16 lg:px-32 xl:px-[260px] py-2 sm:py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shrink-0">
            <FigmaIcon
              src={FIGMA_LOGO_SYMBOL}
              alt="Onboarding Logo"
              className="w-6 h-6 sm:w-8 sm:h-8"
              fallback={
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-figma-purple-100 rounded flex items-center justify-center">
                  <span className="text-figma-gray-00 text-xs font-bold">O</span>
                </div>
              }
            />
          </div>
          <span className="text-figma-purple-100 font-['Hammersmith_One',sans-serif] text-lg sm:text-xl lg:text-2xl leading-[24px] sm:leading-[26px] lg:leading-[30px] tracking-[-0.3px]">
            Onboarding
          </span>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-8">
          {instructorName && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                <FigmaIcon
                  src={FIGMA_ICON_USER}
                  alt="User"
                  className="h-3 w-3 sm:h-4 sm:w-4"
                />
                <span className="text-xs sm:text-sm lg:text-base font-medium text-figma-gray-100 tracking-[-0.3px]">
                  <span className="hidden sm:inline">{instructorName} 강사님</span>
                  <span className="sm:hidden">{instructorName}</span>
                </span>
              </div>
              {accessCode && (
                <>
                  <span className="hidden sm:inline text-sm lg:text-base text-figma-gray-60">•</span>
                  <span className="hidden sm:inline text-sm lg:text-base text-figma-gray-60 tracking-[-0.3px]">
                    {accessCode}
                  </span>
                </>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-5 w-5 sm:h-6 sm:w-6 text-figma-gray-60 hover:text-figma-gray-100 p-0"
          >
            <FigmaIcon
              src={FIGMA_ICON_LOGOUT}
              alt="Logout"
              className="h-4 w-4 sm:h-[19.2px] sm:w-[19.2px]"
            />
          </Button>
        </div>
      </div>
    </header>
  );
}
