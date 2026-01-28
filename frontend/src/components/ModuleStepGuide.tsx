/**
 * ModuleStepGuide Component
 * 
 * 모듈 페이지의 보라색 안내 박스 - Figma 디자인에 100% 일치
 * - 보라색 배경 (#FBF5FF)
 * - 💡 아이콘 + "단계 설명"
 * - 안내 텍스트
 */

import { FigmaIcon } from './FigmaIcon';
import { FIGMA_ICON_LIGHTBULB } from '@/assets/figma-images';

interface ModuleStepGuideProps {
  /** 안내 텍스트 */
  text: string;
}

export function ModuleStepGuide({ text }: ModuleStepGuideProps) {
  return (
    <div
      className="bg-figma-purple-00 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-6 py-3 sm:py-3.5 lg:py-4 flex flex-col sm:flex-row items-start gap-2 sm:gap-2.5 w-full sm:w-auto overflow-hidden"
      style={{
        outline: '1px solid hsl(var(--figma-purple-10))',
        outlineOffset: '-1px'
      }}
    >
      {/* Icon + Label */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        <FigmaIcon src={FIGMA_ICON_LIGHTBULB} alt="Guide" className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-sm sm:text-base font-medium text-figma-purple-90 tracking-[-0.3px] leading-[24px] sm:leading-[27px]">
          단계 설명
        </span>
      </div>

      {/* Text */}
      <p className="text-sm sm:text-base font-normal text-figma-gray-100 tracking-[-0.3px] leading-[24px] sm:leading-[27px]">
        {text}
      </p>
    </div>
  );
}
