import { cn } from '@/lib/utils';
import { 
  FIGMA_ICON_CHECK_LARGE, 
  FIGMA_ICON_CHECK, 
  FIGMA_ICON_CALENDAR, 
  FIGMA_ICON_CLOCK 
} from '@/assets/figma-images';
import { FigmaIcon } from '@/components/FigmaIcon';

interface ProgressCardProps {
  type: 'overall' | 'startDate';
  overallProgress?: number;
  currentStep?: number;
  totalSteps?: number;
  startDate?: string;
  dDay?: number;
  className?: string;
}

export function ProgressCard({ 
  type, 
  overallProgress = 0, 
  currentStep = 0, 
  totalSteps = 0,
  startDate,
  dDay,
  className 
}: ProgressCardProps) {
  if (type === 'overall') {
    return (
      <div className={cn(
        'bg-figma-gray-05 border border-figma-gray-40 rounded-xl sm:rounded-2xl lg:rounded-3xl h-auto sm:h-[192px] flex items-center justify-center sm:justify-start py-4 sm:py-6 lg:py-0',
        className
      )}>
        {/* Icon - Circular Progress Indicator - 모바일에서 숨김 */}
        <div className="hidden sm:flex w-16 lg:w-20 h-16 lg:h-20 items-center justify-center flex-shrink-0 ml-6 lg:ml-[60px] relative">
          {/* Progress circle - SVG based for smooth rendering */}
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="hsl(var(--figma-gray-20))"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="hsl(var(--figma-purple-50))"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - overallProgress / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
        </div>

        {/* Content - 모바일: 라벨+진행률, 데스크톱: 전체 정보 */}
        <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-3 sm:gap-4 lg:gap-10 px-4 sm:px-4 lg:px-[52px] py-0">
          {/* Frame 2147224950: gap: 8px */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-2 sm:gap-2 lg:gap-2">
            {/* Frame 40: gap: 4px - 모바일은 작은 라벨+진행률, 데스크톱은 큰 라벨+진행률 */}
            <div className="flex flex-col gap-0.5 sm:gap-1 items-center sm:items-start">
              <p className="text-sm sm:text-lg lg:text-xl font-bold text-figma-gray-100 tracking-[-0.3px]">
                <span className="sm:hidden">진행률</span>
                <span className="hidden sm:inline">전체 진행률</span>
              </p>
              <p className="text-4xl sm:text-4xl lg:text-[38px] font-bold text-figma-purple-90 leading-tight sm:leading-[50px] tracking-[-0.3px]">
                {overallProgress}%
              </p>
            </div>
            {/* Line 12: width: 106px, border: 1px solid #D5D6DD, transform: rotate(90deg) */}
            <div className="hidden sm:block h-[106px] w-px bg-figma-gray-40" />
            {/* Frame 53: gap: 10px - 데스크톱만 표시 */}
            <div className="hidden sm:flex items-center gap-2.5">
              <FigmaIcon
                src={FIGMA_ICON_CHECK}
                alt="Check"
                className="h-5 w-5"
              />
              <p className="text-base lg:text-lg font-normal text-figma-gray-100 tracking-[-0.3px]">
                현재 STEP {currentStep} 진행 중이에요.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'startDate') {
    const start = startDate ? new Date(startDate) : null;
    const dateStr = start ? start.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

    return (
      <div className={cn(
        'bg-figma-gray-05 border border-figma-gray-40 rounded-xl sm:rounded-2xl lg:rounded-3xl h-auto sm:h-[192px] flex items-center justify-center sm:justify-start py-4 sm:py-6 lg:py-0',
        className
      )}>
        {/* Content - 모바일: 라벨+D-X, 데스크톱: 전체 정보 */}
        <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-3 sm:gap-4 lg:gap-12 px-4 sm:px-4 lg:px-[56px] py-0">
          {/* Frame 2147224951: gap: 8px */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-2 sm:gap-2 lg:gap-2">
            {/* Frame 40: gap: 4px - 모바일은 작은 라벨+D-X, 데스크톱은 큰 라벨+D-X */}
            <div className="flex flex-col gap-0.5 sm:gap-1 items-center sm:items-start">
              <p className="text-sm sm:text-lg lg:text-xl font-bold text-figma-gray-100 tracking-[-0.3px]">
                <span className="sm:hidden">시작일</span>
                <span className="hidden sm:inline">강의 시작일</span>
              </p>
              <p className="text-4xl sm:text-4xl lg:text-[38px] font-bold text-figma-purple-90 leading-tight sm:leading-[50px] tracking-[-0.3px]">
                D{dDay !== undefined ? (dDay > 0 ? `-${dDay}` : `+${Math.abs(dDay)}`) : ''}
              </p>
            </div>
            {/* Line 12: width: 106px, border: 1px solid #D5D6DD, transform: rotate(90deg) */}
            <div className="hidden sm:block h-[106px] w-px bg-figma-gray-40" />
            {/* Frame 55: gap: 5px - 데스크톱만 표시 */}
            <div className="hidden sm:flex flex-col gap-[5px]">
              {/* Frame 54: gap: 10px */}
              <div className="flex items-center gap-2.5">
                <FigmaIcon
                  src={FIGMA_ICON_CALENDAR}
                  alt="Calendar"
                  className="h-5 w-5"
                />
                <p className="text-base lg:text-lg font-normal text-figma-gray-100 tracking-[-0.3px]">
                  {dateStr}
                </p>
              </div>
              {/* Frame 53: gap: 10px */}
              <div className="flex items-center gap-2.5">
                <FigmaIcon
                  src={FIGMA_ICON_CLOCK}
                  alt="Clock"
                  className="h-5 w-5"
                />
                <p className="text-base lg:text-lg font-normal text-figma-gray-100 tracking-[-0.3px]">
                  {dDay !== undefined && dDay > 7 ? '여유있게 준비하세요!' :
                   dDay !== undefined && dDay > 3 ? '곧 시작됩니다' : '마감 임박!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
