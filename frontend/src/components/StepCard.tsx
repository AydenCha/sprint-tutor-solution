import { cn } from '@/lib/utils';
import { StepResponse } from '@/services/api';
import { FIGMA_ICON_CHECK_WHITE, FIGMA_ICON_PLAY } from '@/assets/figma-images';
import { FigmaIcon } from '@/components/FigmaIcon';

interface StepCardProps {
  step: StepResponse;
  onClick?: () => void;
  isActive?: boolean;
  isLocked?: boolean;
  currentStep?: number; // 현재 진행 중인 단계 번호
}

export function StepCard({ step, onClick, isActive, isLocked = false, currentStep }: StepCardProps) {
  // 현재 진행해야 할 단계인지 확인 (currentStep과 일치하고 완료되지 않은 경우)
  const isCurrentStep = currentStep !== undefined && step.stepNumber === currentStep && step.status !== 'COMPLETED';
  
  const getStatusStyles = () => {
    if (isLocked) {
      return 'border-figma-gray-50 bg-figma-gray-00 opacity-60';
    }
    // 완료된 경우: 녹색 테두리 (#07AC30)
    if (step.status === 'COMPLETED') {
      return 'border-figma-green-70 bg-figma-gray-00';
    }
    // 현재 진행해야 할 단계: 보라색 테두리 (#C47CFD)
    if (isCurrentStep) {
      return 'border-figma-purple-30 bg-figma-gray-00';
    }
    // 나머지: 회색 테두리 (#C2C3CD)
    return 'border-figma-gray-50 bg-figma-gray-00';
  };

  const getStatusBadge = () => {
    if (isLocked) {
      return (
        <span className="inline-flex items-center px-2 sm:px-[10px] py-0.5 sm:py-1 rounded-[32px] bg-figma-gray-15 text-figma-gray-70 text-xs sm:text-sm font-bold tracking-[-0.3px] border border-figma-gray-100/5 flex-shrink-0">
          진행전
        </span>
      );
    }
    switch (step.status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 sm:px-[10px] py-0.5 sm:py-1 rounded-[32px] bg-figma-green-00 text-figma-green-60 text-xs sm:text-sm font-bold tracking-[-0.3px] border border-figma-gray-100/5 flex-shrink-0">
            완료
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2 sm:px-[10px] py-0.5 sm:py-1 rounded-[32px] bg-figma-purple-05 text-figma-purple-50 text-xs sm:text-sm font-bold tracking-[-0.3px] border border-figma-gray-100/5 flex-shrink-0">
            진행중
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 sm:px-[10px] py-0.5 sm:py-1 rounded-[32px] bg-figma-gray-15 text-figma-gray-70 text-xs sm:text-sm font-bold tracking-[-0.3px] border border-figma-gray-100/5 flex-shrink-0">
            진행전
          </span>
        );
    }
  };

  const getProgressIndicator = () => {
    if (isLocked) {
      return null;
    }
    // 완료된 경우: 녹색 체크마크 (frame 61)
    if (step.status === 'COMPLETED') {
      return (
        <div className="absolute left-4 sm:left-8 lg:left-[63px] top-5 sm:top-7 lg:top-[29px] w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-figma-green-60 border-2 border-figma-gray-100 flex items-center justify-center overflow-hidden">
          <FigmaIcon
            src={FIGMA_ICON_CHECK_WHITE}
            alt="Completed"
            className="h-[10px] w-[10px] sm:h-[12.8px] sm:w-[12.8px]"
          />
        </div>
      );
    }
    // 현재 진행해야 할 단계: play 아이콘
    if (isCurrentStep) {
      return (
        <div className="absolute left-4 sm:left-8 lg:left-[63px] top-5 sm:top-7 lg:top-[29px] w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-figma-purple-50 border-2 border-figma-gray-100 flex items-center justify-center overflow-hidden">
          <FigmaIcon
            src={FIGMA_ICON_PLAY}
            alt="In Progress"
            className="h-[8px] w-[8px] sm:h-[10.24px] sm:w-[10.24px] ml-0.5"
          />
        </div>
      );
    }
    // 나머지: 아이콘 없음
    return null;
  };

  const totalTasks = step.tasks?.length || 0;
  const completedTasks = step.tasks?.filter(t => t.status === 'COMPLETED').length || 0;
  const progress = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : step.progress || 0;

  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={cn(
        'group relative w-full rounded-2xl sm:rounded-3xl border text-left transition-all duration-300',
        'px-4 sm:px-8 lg:px-10 py-5 sm:py-8 lg:py-10',
        'lg:px-10 lg:py-10 lg:pr-14', // Figma: padding: 40px 56px 40px 40px
        'h-[200px] sm:h-[209px]', // Fixed height for consistency - slightly taller on mobile
        !isLocked && 'hover:shadow-figma-01 cursor-pointer transition-shadow duration-200',
        'disabled:cursor-not-allowed disabled:hover:shadow-none',
        getStatusStyles(),
        isActive && 'ring-2 ring-figma-purple-50'
      )}
    >
      {/* Progress Indicator */}
      {getProgressIndicator()}

      {/* Frame 59: gap: 32px */}
      <div className="flex items-start gap-3 sm:gap-6 lg:gap-10">
        {/* Step Number - Frame 49: width: 40px, height: 40px, border-radius: 8px */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-figma-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-lg sm:text-xl font-bold text-white tracking-[-0.3px]">
            {step.stepNumber}
          </span>
        </div>

        {/* Frame 59: gap: 32px */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 sm:gap-6 lg:gap-8">
          {/* Frame 58: gap: 263px, justify-content: space-between */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 lg:gap-[263px]">
            {/* Frame 56: gap: 8px */}
            <div className="flex flex-col gap-1 sm:gap-2 flex-1 min-w-0">
              {/* Frame 60: gap: 8px */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg lg:text-xl font-medium text-figma-gray-100 tracking-[-0.3px] line-clamp-1">
                  {step.title.includes(`Step ${step.stepNumber}`) || step.title.includes(`STEP ${step.stepNumber}`)
                    ? step.title
                    : `STEP ${step.stepNumber}. ${step.title}`}
                </h3>
                {getStatusBadge()}
              </div>
              {isLocked ? (
                <p className="text-sm sm:text-base lg:text-lg font-normal text-figma-gray-70 tracking-[-0.3px] line-clamp-2">
                  이전 단계를 먼저 완료해주세요.
                </p>
              ) : (
                <p className="text-sm sm:text-base lg:text-lg font-normal text-figma-gray-70 tracking-[-0.3px] line-clamp-2">
                  {step.description || '목표: 계약 체결 및 KDT 필수 규정(Red Line) 숙지'}
                </p>
              )}
            </div>

            {/* Step Type Badge - 모바일에서 숨김 */}
            {step.stepType && (
              <span className="hidden sm:inline-flex items-center px-1.5 py-1 rounded bg-figma-blue-00 text-figma-blue-50 text-sm font-bold tracking-[-0.3px] border border-figma-gray-100/5 flex-shrink-0">
                {step.stepType}
              </span>
            )}
          </div>
          
          {/* Progress Bar - Frame 65: gap: 24px */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
            {/* Progress bar: gap: 12px */}
            <div className="flex-1 flex items-center gap-2 sm:gap-3">
              {/* Progress bar: height: 8px, border-radius: 8px (또는 9999px) */}
              <div className="flex-1 h-2 rounded-full bg-figma-gray-15 overflow-hidden relative">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500 absolute left-0 top-0',
                    step.status === 'COMPLETED' ? 'bg-figma-purple-50' :
                    step.status === 'IN_PROGRESS' ? 'bg-figma-purple-50' :
                    'bg-figma-purple-50 opacity-0'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Percentage: 14px medium */}
              <span className="text-xs sm:text-sm font-medium text-figma-gray-100 tracking-[-0.3px] flex-shrink-0">
                {progress}%
              </span>
            </div>
            {/* label: 16px medium, text-align: right */}
            <span className="text-sm sm:text-base font-medium text-figma-gray-60 text-right tracking-[-0.3px] flex-shrink-0">
              {completedTasks} / {totalTasks}
              <span className="hidden sm:inline"> 완료</span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
