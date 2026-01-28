interface WelcomeBannerProps {
  track?: string;
  cohort?: string;
  instructorName: string;
  welcomeMessage?: string;
}

export function WelcomeBanner({ 
  track, 
  cohort, 
  instructorName, 
  welcomeMessage = '강의를 잘 시작하실 수 있도록, 필요한 준비를 하나씩 안내해드릴게요.' 
}: WelcomeBannerProps) {
  const trackLabel = track && cohort ? `${track} ${cohort}` : undefined;

  return (
    <div className="relative bg-gradient-to-b from-figma-purple-00 to-figma-purple-05 rounded-xl sm:rounded-2xl lg:rounded-3xl min-h-[120px] sm:min-h-[160px] lg:h-[200px] flex items-center px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-5 border border-figma-purple-20 overflow-hidden">
      {/* Left side - Text content */}
      <div className="relative z-20 flex-1 flex flex-col justify-center">
        {/* Track Label */}
        {trackLabel && (
          <div className="mb-3 sm:mb-4 lg:mb-5">
            <span className="inline-flex items-center px-[8px] py-0.5 rounded-[32px] bg-figma-purple-50 text-figma-purple-00 text-xs sm:text-sm font-bold tracking-[-0.3px]">
              {trackLabel}
            </span>
          </div>
        )}

        {/* Welcome Message */}
        <div className="flex flex-col gap-1.5 sm:gap-2 lg:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <h1 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold leading-tight tracking-[-0.3px]">
                <span className="text-figma-purple-100">{instructorName}</span>
                <span className="text-figma-gray-100"> 강사님 환영합니다!</span>
              </h1>
            </div>
            <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl">🎉</span>
          </div>

          {/* Sub Message - 모바일에서는 숨김 */}
          <p className="hidden sm:block text-sm lg:text-base font-normal text-figma-purple-90 leading-relaxed tracking-[-0.3px]">
            {welcomeMessage}
          </p>
        </div>
      </div>

      {/* Right side - Illustration - 모바일에서 작게 */}
      <div className="absolute right-2 sm:right-4 lg:right-8 inset-y-0 z-10">
        <img
          src="/assets/images/banner-illustration.png"
          alt=""
          className="h-full w-auto scale-[0.8] sm:scale-[1.0] lg:scale-[1.20] origin-right-bottom"
        />
      </div>
    </div>
  );
}
