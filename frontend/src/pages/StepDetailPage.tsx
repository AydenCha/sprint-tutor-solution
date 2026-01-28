import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api, { instructorApi, StepResponse, TaskResponse } from '@/services/api';
import { InstructorHeader } from '@/components/InstructorHeader';
import { StepCard } from '@/components/StepCard';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  FIGMA_ICON_ARROW_LEFT,
  FIGMA_ICON_FILE,
  FIGMA_ICON_VIDEO,
  FIGMA_ICON_UPLOAD,
  FIGMA_ICON_CHECKLIST,
  FIGMA_ICON_LOCK,
  FIGMA_ICON_CHECK_WHITE,
} from '@/assets/figma-images';
import { FigmaIcon } from '@/components/FigmaIcon';

export default function StepDetailPage() {
  const { stepNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  useAuth(); // Auth context for protected route
  const { toast } = useToast();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [step, setStep] = useState<StepResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStepData();
  }, [stepNumber, location.pathname]);

  const fetchStepData = async () => {
    try {
      setIsLoading(true);
      const dashboard = await instructorApi.getDashboard();
      setDashboardData(dashboard);
      const currentStep = dashboard.steps.find((s: StepResponse) => s.stepNumber === Number(stepNumber));

      if (!currentStep) {
        throw new Error('단계를 찾을 수 없습니다.');
      }

      setStep(currentStep);
    } catch (error) {
      toast({
        title: '단계 로드 오류',
        description: error instanceof Error ? error.message : '단계 상세 정보를 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-figma-gray-00">
        <Loader2 className="h-8 w-8 animate-spin text-figma-gray-70" />
        <span className="ml-2 text-figma-gray-70">로딩 중...</span>
      </div>
    );
  }

  if (!step || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-figma-gray-00">
        <p className="text-figma-gray-70">단계를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'A': return FIGMA_ICON_FILE;
      case 'B': return FIGMA_ICON_VIDEO;
      case 'C': return FIGMA_ICON_UPLOAD;
      case 'D': return FIGMA_ICON_CHECKLIST;
      default: return FIGMA_ICON_FILE;
    }
  };

  const handleTaskClick = (task: TaskResponse, isLocked: boolean) => {
    if (isLocked) return;
    navigate(`/instructor/step/${stepNumber}/task/${task.id}`);
  };

  // Constants for timeline calculations
  const moduleCardHeight = 114; // Module card height
  const moduleCardGap = 24; // Gap between module cards (gap-6 = 24px)

  return (
    <div className="min-h-screen bg-figma-gray-00">
      <InstructorHeader 
        instructorName={dashboardData.name}
        accessCode={dashboardData.accessCode}
      />

      <main className="mx-auto max-w-[1920px] px-4 sm:px-8 md:px-16 lg:px-32 xl:px-[260px] pt-8 sm:pt-12 lg:pt-[64px] pb-16 sm:pb-24 lg:pb-[136px]">
        {/* Back Button */}
        <div className="mb-3 sm:mb-4">
          <button
            onClick={() => navigate('/instructor')}
            className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2 py-0 text-figma-gray-70 hover:text-figma-gray-100 transition-colors"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <FigmaIcon
                src={FIGMA_ICON_ARROW_LEFT}
                alt="Back"
                className="w-[12.8px] h-[12.8px]"
              />
            </div>
            <span className="text-sm sm:text-base font-normal leading-[24px] sm:leading-[27px] tracking-[-0.3px]">
              <span className="hidden sm:inline">대시보드로 돌아가기</span>
              <span className="sm:hidden">돌아가기</span>
            </span>
          </button>
        </div>

        {/* Step Card Container - Frame 79: gap: 16px */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-0 relative z-10">
          <StepCard
            step={step}
            currentStep={dashboardData.currentStep}
            onClick={() => {}}
            isActive={false}
            isLocked={false}
          />
        </div>

        {/* Tasks List with Timeline */}
        {step.tasks && step.tasks.length > 0 ? (
          <div className="relative mt-4 sm:mt-6">
            {/* Timeline - Absolute positioned - 모바일에서는 숨김 */}
            <div className="hidden sm:block absolute left-0 top-0 w-5">
              {/* 스텝 카드에서 내려오는 연결선 - 첫 번째 원까지 */}
              <div 
                className="absolute w-[1px] bg-figma-gray-40 left-1/2 -translate-x-1/2"
                style={{
                  top: '-24px', // mt-6 갭을 넘어서 스텝 카드 영역까지
                  height: `${24 + moduleCardHeight / 2}px` // 갭(24px) + 첫 번째 카드 중앙까지(57px) = 81px
                }}
              ></div>
              
              {/* 연속된 세로 선 - 첫 번째 원 중앙에서 마지막 원 중앙까지 */}
              {step.tasks.length > 1 && (
                <div 
                  className="absolute w-[1px] bg-figma-gray-40 left-1/2 -translate-x-1/2"
                  style={{
                    top: `${moduleCardHeight / 2}px`, // 첫 번째 카드 중앙 (57px)
                    height: `${(step.tasks.length - 1) * (moduleCardHeight + moduleCardGap)}px` // 첫 번째에서 마지막 원까지의 거리
                  }}
                ></div>
              )}
              
              {/* 원들 */}
              {step.tasks.map((task, index) => {
                const isCompleted = task.status === 'COMPLETED';
                // 각 카드의 중앙 위치: (카드높이 + 갭) * index + 카드높이/2
                const cardCenterY = (moduleCardHeight + moduleCardGap) * index + moduleCardHeight / 2;
                
                return (
                  <div 
                    key={`timeline-${task.id}`} 
                    className="absolute left-1/2 -translate-x-1/2 w-5 h-5"
                    style={{ top: `${cardCenterY - 10}px` }}
                  >
                    {isCompleted ? (
                      <>
                        <div className="absolute inset-0 bg-figma-green-60 border border-figma-gray-100 rounded-full"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FigmaIcon
                            src={FIGMA_ICON_CHECK_WHITE}
                            alt="Completed"
                            className="w-4 h-4"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-figma-gray-40 rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Module Cards Container */}
            <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 ml-0 sm:ml-14">
              {step.tasks.map((task, index) => {
                const isLocked =
                  index > 0 &&
                  step.tasks[index - 1]?.status !== 'COMPLETED' &&
                  step.tasks[index - 1]?.status !== 'SKIPPED';
                const isCompleted = task.status === 'COMPLETED';
                // 배경색 교대: 첫 번째는 #FFFFFF, 두 번째는 #FBFBFB
                const bgColor = index % 2 === 0 ? 'bg-figma-gray-00' : 'bg-figma-gray-05';

                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task, isLocked)}
                    className={cn(
                      'rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 sm:justify-between transition-all',
                      'w-full min-h-[100px] sm:h-[114px]', // Responsive height
                      'px-4 py-4 sm:px-6 lg:px-8 sm:py-6', // Responsive padding
                      bgColor,
                      !isLocked && 'cursor-pointer hover:shadow-figma-01 transition-shadow duration-200'
                    )}
                  >
                    {/* Left: Icon + Content - Frame 72: gap: 24px */}
                    <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 flex-1 min-w-0 w-full sm:w-auto">
                      {/* Icon - Responsive size */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-figma-gray-10 border border-figma-gray-20 rounded-full flex items-center justify-center">
                        <FigmaIcon
                          src={isLocked ? FIGMA_ICON_LOCK : getContentTypeIcon(task.contentType)}
                          alt={task.title}
                          className="w-6 h-6 sm:w-8 sm:h-8"
                        />
                      </div>

                      {/* Text - Frame 73: gap: 4px */}
                      <div className="flex flex-col gap-0.5 sm:gap-1 flex-1 min-w-0">
                        <h3
                          className={cn(
                            'text-base sm:text-lg lg:text-xl font-normal leading-6 sm:leading-7 lg:leading-8 tracking-[-0.3px] truncate',
                            isLocked ? 'text-figma-gray-70' : 'text-figma-gray-100'
                          )}
                          title={task.title}
                        >
                          {task.title}
                        </h3>
                        <p className="text-sm sm:text-base lg:text-lg font-normal leading-5 sm:leading-6 lg:leading-[30px] tracking-[-0.3px] text-figma-gray-70 line-clamp-1 sm:line-clamp-2">
                          {isLocked ? '이전 컨텐츠를 먼저 완료해주세요.' : task.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Button - Responsive size */}
                    <div
                      className={cn(
                        'rounded-lg border flex items-center justify-center w-full sm:w-auto sm:min-w-[100px] h-[38px] sm:h-[42px]',
                        'px-4 py-1.5 sm:px-6 sm:py-2', // Responsive padding
                        isLocked
                          ? 'bg-figma-gray-15 border-figma-gray-40'
                          : 'bg-figma-gray-00 border-figma-gray-40'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm sm:text-base font-medium leading-6 sm:leading-[27px] tracking-[-0.3px]',
                          isLocked ? 'text-figma-gray-60' : 'text-figma-gray-70'
                        )}
                      >
                        {isCompleted ? '복습하기' : '시작하기'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-figma-gray-70">
            <p className="text-lg">이 단계에 사용 가능한 작업이 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
