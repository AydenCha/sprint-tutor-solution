import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api, { InstructorDashboardResponse } from '@/services/api';
import { InstructorHeader } from '@/components/InstructorHeader';
import { WelcomeBanner } from '@/components/WelcomeBanner';
import { ProgressCard } from '@/components/ProgressCard';
import { StepCard } from '@/components/StepCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { FIGMA_ICON_INFO } from '@/assets/figma-images';
import { FigmaIcon } from '@/components/FigmaIcon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userId } = useAuth();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<InstructorDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [location.pathname]); // Re-fetch when navigating back to dashboard

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await api.instructor.getDashboard();
      setDashboardData(data);
    } catch (error) {
      toast({
        title: '데이터 로드 실패',
        description: error instanceof Error ? error.message : '대시보드를 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({ title: '로그아웃', description: '안전하게 로그아웃되었습니다.' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">로딩 중...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const { id, name, email, phone, track, cohort, accessCode, startDate, currentStep, overallProgress, steps, dDay, onboardingModule, instructorType, timingVariable } = dashboardData;

  // Calculate D-Day
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = start.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-figma-gray-00">
      <InstructorHeader 
        instructorName={name}
        accessCode={accessCode}
      />

      <main className="mx-auto max-w-[1920px] px-4 sm:px-8 md:px-16 lg:px-32 xl:px-[260px] pt-8 sm:pt-12 lg:pt-[64px] pb-16 sm:pb-24 lg:pb-[136px]">
        {/* Frame 64: gap: 80px, top: 136px (헤더 72px 아래 64px) */}
        <div className="flex flex-col gap-8 sm:gap-12 lg:gap-16 xl:gap-20">
          {/* Frame 48: gap: 24px */}
          <div className="flex flex-col gap-6">
            {/* Welcome Banner */}
            <WelcomeBanner
              track={track}
              cohort={cohort}
              instructorName={name}
            />

            {/* Progress Cards - Frame 47: gap: 24px */}
            <div className="flex flex-col sm:flex-row gap-6">
              <ProgressCard
                type="overall"
                overallProgress={overallProgress}
                currentStep={currentStep}
                totalSteps={steps.length}
                className="flex-1"
              />
              <ProgressCard
                type="startDate"
                startDate={startDate}
                dDay={diffDays}
                className="flex-1"
              />
            </div>
          </div>

          {/* Steps Section - Frame 45: gap: 16px */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Frame 39: gap: 12px */}
            <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2">
              <h2 className="text-lg sm:text-xl font-bold text-figma-gray-100 tracking-[-0.3px]">
                온보딩 단계
              </h2>
              <span className="text-lg sm:text-xl font-bold text-figma-purple-80 tracking-[-0.3px]">
                {steps.length}
              </span>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="cursor-help">
                      <FigmaIcon
                        src={FIGMA_ICON_INFO}
                        alt="Info"
                        className="h-6 w-6"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="bottom" 
                    align="start"
                    sideOffset={8}
                    className="relative bg-figma-gray-90 text-white border-none px-4 py-3 rounded-lg shadow-figma-02 w-auto z-50"
                  >
                    {/* 툴팁 화살표 */}
                    <div 
                      className="absolute -top-[6px] left-6 w-3 h-3 bg-figma-gray-90 rotate-45 rounded-[1px]"
                    />
                    <p className="text-base font-normal leading-[27px] tracking-[-0.3px] relative z-10">
                      강의 시작 전 꼭 필요한 내용을 단계별로 준비했어요.🌟<br />영상, 퀴즈 등을 통해 차근차근 익혀보세요!
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Frame 63: gap: 16px */}
            {steps.length === 0 ? (
              <div className="flex flex-row justify-center items-center py-16 px-0 bg-figma-gray-00 rounded-[32px]">
                <div className="flex flex-col items-center gap-8">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-14 h-14 bg-figma-gray-15 rounded-[14px] flex items-center justify-center">
                      <FigmaIcon
                        src={FIGMA_ICON_INFO}
                        alt="Empty"
                        className="h-7 w-7 text-figma-gray-80"
                      />
                    </div>
                    <p className="text-lg font-normal text-figma-gray-70 leading-[30px] tracking-[-0.3px] text-center">
                      아직 설정된 온보딩 단계가 없습니다.
                      <br />
                      PM에게 문의하세요.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {steps.map((step, index) => {
                  // Sequential unlocking: Step 1 is always unlocked, subsequent steps are unlocked only when previous step is completed
                  const isLocked = index > 0 && steps[index - 1]?.status !== 'COMPLETED';

                  return (
                    <StepCard
                      key={step.id}
                      step={step}
                      isLocked={isLocked}
                      currentStep={currentStep}
                      onClick={() => navigate(`/instructor/step/${step.stepNumber}`)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
