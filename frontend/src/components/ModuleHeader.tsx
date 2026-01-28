/**
 * ModuleHeader Component
 * 
 * 모듈 페이지 전용 헤더 - Figma 디자인에 100% 일치
 * 좌측: 🏠 홈 버튼 | ← 단계로 돌아가기
 * 우측: 🔍- (줌아웃) | 100% | 🔍+ (줌인) | ⛶ (전체화면) | [새 탭] | 🚪 (로그아웃)
 */

import { FigmaIcon } from './FigmaIcon';
import {
  FIGMA_LOGO_SYMBOL,
  FIGMA_ICON_HOME,
  FIGMA_ICON_ARROW_LEFT,
  FIGMA_ICON_ZOOM_OUT,
  FIGMA_ICON_ZOOM_IN,
  FIGMA_ICON_EXPAND,
  FIGMA_ICON_EXTERNAL_LINK,
  FIGMA_ICON_LOGOUT,
  FIGMA_LINE_DIVIDER,
} from '@/assets/figma-images';

interface ModuleHeaderProps {
  /** 줌 레벨 (0.75 ~ 3.0) */
  zoom: number;
  /** 줌 인 콜백 */
  onZoomIn: () => void;
  /** 줌 아웃 콜백 */
  onZoomOut: () => void;
  /** 전체화면 토글 콜백 */
  onToggleFullscreen: () => void;
  /** 단계로 돌아가기 콜백 */
  onBackToStep: () => void;
  /** 대시보드로 돌아가기 콜백 */
  onBackToDashboard: () => void;
  /** 로그아웃 콜백 */
  onLogout: () => void;
  /** 새 탭에서 열기 버튼 표시 여부 (외부 링크가 있는 경우) */
  showNewTabButton?: boolean;
  /** 새 탭에서 열기 콜백 */
  onOpenNewTab?: () => void;
}

export function ModuleHeader({
  zoom,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  onBackToStep,
  onBackToDashboard,
  onLogout,
  showNewTabButton = false,
  onOpenNewTab,
}: ModuleHeaderProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <header className="sticky top-0 z-50 bg-figma-gray-00 border-b border-figma-gray-20 backdrop-blur-sm shadow-sm">
      <div className="h-[60px] sm:h-[72px] px-3 sm:px-6 md:px-12 lg:px-24 xl:px-[260px] py-3 sm:py-5 flex items-center justify-between">
        {/* Left: Logo + Home + Back to Step */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          {/* Home Button */}
          <button
            onClick={onBackToDashboard}
            className="p-1.5 sm:p-2 rounded-full hover:bg-figma-gray-10 transition-colors"
            aria-label="대시보드로 돌아가기"
          >
            <FigmaIcon src={FIGMA_ICON_HOME} alt="Home" className="w-4 h-4 sm:w-[19.2px] sm:h-[19.2px]" />
          </button>

          {/* Divider - 모바일에서 숨김 */}
          <div className="hidden sm:flex w-0 h-4 items-center justify-center rotate-90">
            <img src={FIGMA_LINE_DIVIDER} alt="" className="h-4" />
          </div>

          {/* Back to Step */}
          <button
            onClick={onBackToStep}
            className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2 hover:bg-figma-gray-10 rounded-lg transition-colors"
          >
            <FigmaIcon src={FIGMA_ICON_ARROW_LEFT} alt="Back" className="w-3 h-3 sm:w-[12.8px] sm:h-[12.8px]" />
            <span className="text-sm sm:text-base font-normal text-figma-gray-70 tracking-[-0.3px]">
              <span className="hidden lg:inline">단계로 돌아가기</span>
              <span className="lg:hidden">돌아가기</span>
            </span>
          </button>
        </div>

        {/* Right: Zoom Controls + Fullscreen + New Tab + Logout */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          {/* Zoom Controls - 데스크톱만 표시 */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={onZoomOut}
              disabled={zoom <= 0.75}
              className="p-2 rounded-full hover:bg-figma-gray-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="축소"
            >
              <FigmaIcon src={FIGMA_ICON_ZOOM_OUT} alt="Zoom Out" className="w-[19.2px] h-[19.2px]" />
            </button>
            <span className="text-sm font-medium text-figma-gray-70 tracking-[-0.3px] min-w-[50px] text-center">
              {zoomPercent}%
            </span>
            <button
              onClick={onZoomIn}
              disabled={zoom >= 3}
              className="p-2 rounded-full hover:bg-figma-gray-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="확대"
            >
              <FigmaIcon src={FIGMA_ICON_ZOOM_IN} alt="Zoom In" className="w-[19.2px] h-[19.2px]" />
            </button>
          </div>

          {/* Divider - 데스크톱만 표시 */}
          <div className="hidden lg:flex w-0 h-4 items-center justify-center rotate-90">
            <img src={FIGMA_LINE_DIVIDER} alt="" className="h-4" />
          </div>

          {/* Fullscreen Button - 모바일에서는 작게 */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 sm:p-2 rounded-full hover:bg-figma-gray-10 transition-colors"
            aria-label="전체화면"
          >
            <FigmaIcon src={FIGMA_ICON_EXPAND} alt="Fullscreen" className="w-4 h-4 sm:w-[19.2px] sm:h-[19.2px]" />
          </button>

          {/* New Tab Button (Optional) - 태블릿 이상만 표시 */}
          {showNewTabButton && onOpenNewTab && (
            <>
              <div className="hidden sm:flex w-0 h-4 items-center justify-center rotate-90">
                <img src={FIGMA_LINE_DIVIDER} alt="" className="h-4" />
              </div>
              <button
                onClick={onOpenNewTab}
                className="hidden sm:block p-2 rounded-full hover:bg-figma-gray-10 transition-colors"
                aria-label="새 탭에서 열기"
              >
                <FigmaIcon src={FIGMA_ICON_EXTERNAL_LINK} alt="New Tab" className="w-[19.2px] h-[19.2px]" />
              </button>
            </>
          )}

          {/* Divider - 모바일에서 숨김 */}
          <div className="hidden sm:flex w-0 h-4 items-center justify-center rotate-90">
            <img src={FIGMA_LINE_DIVIDER} alt="" className="h-4" />
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-1.5 sm:p-2 rounded-full hover:bg-figma-gray-10 transition-colors"
            aria-label="로그아웃"
          >
            <FigmaIcon src={FIGMA_ICON_LOGOUT} alt="Logout" className="w-4 h-4 sm:w-[19.2px] sm:h-[19.2px]" />
          </button>
        </div>
      </div>
    </header>
  );
}
