/**
 * ModuleStepHeader Component
 * 
 * 모듈 페이지의 Step 정보 헤더 - Figma 디자인에 100% 일치
 * - STEP X-Y (보라색, 18px bold)
 * - 제목 (48px bold, 검정)
 * - 설명 (20px regular, 회색)
 */

interface ModuleStepHeaderProps {
  /** Step 번호 (e.g., "2-1") */
  stepNumber: string;
  /** 제목 */
  title: string;
  /** 설명 */
  description?: string;
}

export function ModuleStepHeader({
  stepNumber,
  title,
  description,
}: ModuleStepHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 px-1 sm:px-2">
      {/* STEP 2-1 */}
      <p className="text-base sm:text-lg font-bold text-figma-purple-100 tracking-[-0.3px] leading-[27px] sm:leading-[30px]">
        STEP {stepNumber}
      </p>

      {/* Title + Description */}
      <div className="flex flex-col gap-2 sm:gap-2.5 lg:gap-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[48px] font-bold text-figma-gray-100 tracking-[-0.5px] sm:tracking-[-0.8px] lg:tracking-[-1px] leading-[32px] sm:leading-[42px] md:leading-[52px] lg:leading-[62px]">
          {title}
        </h1>
        {description && (
          <p className="text-base sm:text-lg lg:text-xl font-normal text-figma-gray-70 tracking-[-0.3px] leading-[27px] sm:leading-[30px] lg:leading-[32px]">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
