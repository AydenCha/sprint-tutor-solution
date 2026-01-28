import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { Loader2 } from 'lucide-react';
import { 
  FIGMA_LOGO_SYMBOL, 
  FIGMA_LOGIN_LINE,
  FIGMA_LOGIN_BACKGROUND
} from '@/assets/figma-images';
import { FigmaIcon } from '@/components/FigmaIcon';
import { cn } from '@/lib/utils';

/**
 * Landing Page / Login Page
 *
 * Dual-purpose authentication page supporting both instructor access code login
 * and PM email/password login. Features keyboard shortcuts for quick access.
 */

// Constants
const TOAST_MESSAGES = {
  INPUT_ERROR: {
    title: '입력 오류',
    emailPassword: '이메일과 비밀번호를 입력해주세요.',
    accessCode: '접속 코드를 입력해주세요.',
  },
  PM_LOGIN_SUCCESS: {
    title: 'PM 로그인 성공',
  },
  INSTRUCTOR_LOGIN_SUCCESS: {
    title: '접속 성공',
  },
  LOGIN_FAILED: {
    title: '로그인 실패',
    pm: '이메일 또는 비밀번호가 올바르지 않습니다.',
    instructor: '유효하지 않은 접속 코드입니다.',
  },
  ACCESS_FAILED: {
    title: '접속 실패',
  },
} as const;

const ROUTES = {
  PM_DASHBOARD: '/pm/dashboard',
  INSTRUCTOR_DASHBOARD: '/instructor',
  PM_REGISTER: '/pm/register-account',
  FORGOT_PASSWORD: '/auth/forgot-password',
} as const;

const KEYBOARD_SHORTCUTS = {
  INSTRUCTOR_TAB: '1',
  PM_TAB: '2',
} as const;

const TIMEOUTS = {
  TAB_SWITCH_DELAY: 150,
  AUTO_FOCUS_PREVENT: 100,
} as const;

const ACCESS_CODE_PLACEHOLDER = '예: FE4-JWP1';
const COPYRIGHT_TEXT = '© 2025 Codeit Sprint. All rights reserved.';

type TabValue = 'instructor' | 'pm';

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  // Form state
  const [pmEmail, setPmEmail] = useState('');
  const [pmPassword, setPmPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('instructor');
  const [userInteracted, setUserInteracted] = useState(false);

  // Refs for input fields
  const accessCodeRef = useRef<HTMLInputElement>(null);
  const pmEmailRef = useRef<HTMLInputElement>(null);

  /**
   * Prevents auto-focus on initial page load
   */
  useEffect(() => {
    const disableFocus = (): void => {
      if (document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement) {
        document.activeElement.blur();
      }
    };

    disableFocus();
    const timeout = setTimeout(disableFocus, TIMEOUTS.AUTO_FOCUS_PREVENT);

    return () => clearTimeout(timeout);
  }, []);

  /**
   * Handles PM login via email and password
   */
  const handlePMLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!pmEmail || !pmPassword) {
      toast({
        title: TOAST_MESSAGES.INPUT_ERROR.title,
        description: TOAST_MESSAGES.INPUT_ERROR.emailPassword,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.auth.login(pmEmail, pmPassword);
      login(response.token, response.userId, response.role, response.name);
      toast({
        title: TOAST_MESSAGES.PM_LOGIN_SUCCESS.title,
        description: `${response.name}님 환영합니다!`,
        variant: 'success',
      });
      navigate(ROUTES.PM_DASHBOARD);
    } catch (error) {
      toast({
        title: TOAST_MESSAGES.LOGIN_FAILED.title,
        description: error instanceof Error ? error.message : TOAST_MESSAGES.LOGIN_FAILED.pm,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Checks if the current focus target is an input element
   */
  const isInputFocused = (target: EventTarget | null): boolean => {
    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target as HTMLElement).isContentEditable
    );
  };

  /**
   * Switches to a tab and focuses its primary input field
   */
  const switchToTab = (tab: TabValue, inputRef: React.RefObject<HTMLInputElement>): void => {
    setUserInteracted(true);
    setActiveTab(tab);
    setTimeout(() => {
      inputRef.current?.focus();
    }, TIMEOUTS.TAB_SWITCH_DELAY);
  };

  /**
   * Sets up keyboard shortcuts for quick tab switching
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      if (isInputFocused(e.target)) {
        return;
      }

      if (e.key === KEYBOARD_SHORTCUTS.INSTRUCTOR_TAB) {
        e.preventDefault();
        switchToTab('instructor', accessCodeRef);
      } else if (e.key === KEYBOARD_SHORTCUTS.PM_TAB) {
        e.preventDefault();
        switchToTab('pm', pmEmailRef);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  /**
   * Handles instructor login via access code
   */
  const handleInstructorLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!accessCode) {
      toast({
        title: TOAST_MESSAGES.INPUT_ERROR.title,
        description: TOAST_MESSAGES.INPUT_ERROR.accessCode,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const normalizedCode = accessCode.toUpperCase();
      const response = await api.auth.login(normalizedCode, normalizedCode);
      login(response.token, response.userId, response.role, response.name);
      toast({
        title: TOAST_MESSAGES.INSTRUCTOR_LOGIN_SUCCESS.title,
        description: `${response.name} 강사님 환영합니다!`,
        variant: 'success',
      });
      navigate(ROUTES.INSTRUCTOR_DASHBOARD);
    } catch (error) {
      toast({
        title: TOAST_MESSAGES.ACCESS_FAILED.title,
        description: TOAST_MESSAGES.LOGIN_FAILED.instructor,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user interaction events (mousedown fires before focus)
   */
  const handleUserInteraction = (): void => {
    setUserInteracted(true);
  };

  /**
   * Handles tab change
   */
  const handleTabChange = (value: string): void => {
    setActiveTab(value as TabValue);
    setUserInteracted(true);
  };

  const emailPlaceholder = `pm${import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || '@codeit.com'}`;

  return (
    <div className="min-h-screen flex justify-center relative">
      {/* 4K 대응: 왼쪽은 보라색, 오른쪽은 흰색 배경 (데스크톱만) */}
      <div className="absolute inset-0 hidden lg:flex">
        <div className="flex-1 bg-figma-purple-00" /> {/* 왼쪽 보라색 */}
        <div className="flex-1 bg-white" /> {/* 오른쪽 흰색 */}
      </div>

      {/* 모바일 배경: 전체 화면에 보라색 배경 이미지 + 반투명 오버레이 */}
      <div className="absolute inset-0 lg:hidden">
        <div
          className="absolute inset-0 bg-figma-purple-00"
          style={{
            backgroundImage: `url(${FIGMA_LOGIN_BACKGROUND})`,
            backgroundPosition: 'center center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat'
          }}
        />
        {/* 반투명 오버레이로 텍스트 가독성 향상 */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Container: Max width 1920px (FHD) to maintain same ratio on 4K displays */}
      <div className="w-full max-w-[1920px] flex relative z-10">
        {/* Left Side - Purple background area (데스크톱만 표시) */}
        <div className="hidden lg:block lg:w-[906px] lg:h-screen relative overflow-hidden bg-figma-purple-00 flex-shrink-0">
          {/* Background Image Container */}
          <div
            className="absolute inset-0 w-full h-full bg-no-repeat"
            style={{
              backgroundImage: `url(${FIGMA_LOGIN_BACKGROUND})`,
              backgroundPosition: 'left center',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat'
            }}
          />
        </div>

        {/* Right Side - Login Form (모바일: 투명 배경, 데스크톱: 흰색 배경) */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-w-0 bg-transparent lg:bg-figma-gray-00 lg:min-w-[1014px] lg:max-w-[1014px]">
          {/* 모바일: 반투명 흰색 배경으로 폼 영역 강조 */}
          <div className="w-full max-w-[600px] bg-white/95 lg:bg-transparent rounded-2xl p-6 sm:p-8 lg:p-0">
          {/* Main Content Container - Frame 42: gap: 256px */}
          <div className="flex flex-col gap-8 sm:gap-12 lg:gap-[256px]">
            {/* Top Section: Logo, Title, and Form - Frame 35: gap: 56px */}
            <div className="flex flex-col gap-8 sm:gap-10 lg:gap-[56px]">
              {/* Logo and Title Section - Frame 15: gap: 40px */}
              <div className="flex flex-col gap-6 sm:gap-8 lg:gap-[40px]">
                {/* Logo */}
                <div className="flex items-center gap-2 sm:gap-3 p-2">
                  <div className="relative shrink-0 size-6 sm:size-8">
                    <img alt="" className="block max-w-none size-full" src={FIGMA_LOGO_SYMBOL} />
                  </div>
                  <h1 className="text-figma-purple-100 font-['Hammersmith_One',sans-serif] text-xl sm:text-2xl leading-[26px] sm:leading-[30px] tracking-[-0.3px] relative shrink-0">
                    Onboarding
                  </h1>
                </div>

                {/* Title: 코드잇 스프린트 | 강사 온보딩 */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-bold text-figma-gray-100 leading-[32px] sm:leading-[42px] lg:leading-[50px] tracking-[-0.3px] relative shrink-0">
                      코드잇 스프린트
                    </h2>
                    <div className="flex h-6 sm:h-8 items-center justify-center relative shrink-0 w-0">
                      <div className="flex-none rotate-90">
                        <div className="h-0 relative w-6 sm:w-8">
                          <div className="absolute inset-[-1px_0_0_0]">
                            <img alt="" className="block max-w-none size-full" src={FIGMA_LOGIN_LINE} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-bold text-figma-gray-100 leading-[32px] sm:leading-[42px] lg:leading-[50px] tracking-[-0.3px] relative shrink-0">
                      강사 온보딩
                    </h2>
                  </div>

                  {/* Keyboard Shortcuts - 모바일에서는 숨김 */}
                  <div className="hidden lg:flex items-center gap-2 flex-wrap">
                    <p className="text-lg text-figma-gray-80 leading-[30px] tracking-[-0.3px] relative shrink-0">단축키</p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1">
                        <div className="bg-figma-gray-00 border border-figma-gray-30 rounded-lg overflow-hidden relative shrink-0 size-7">
                          <p className="absolute left-[calc(50%-6px)] top-[calc(50%-14.5px)] text-base text-figma-gray-70 leading-[27px] tracking-[-0.3px]">
                            1
                          </p>
                        </div>
                        <p className="text-lg text-figma-gray-70 leading-[30px] tracking-[-0.3px] relative shrink-0">: 강사 접속 코드 입력</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="bg-figma-gray-00 border border-figma-gray-30 rounded-lg overflow-hidden relative shrink-0 size-7">
                          <p className="absolute left-[calc(50%-6px)] top-[calc(50%-14.5px)] text-base text-figma-gray-70 leading-[27px] tracking-[-0.3px]">
                            2
                          </p>
                        </div>
                        <p className="text-lg text-figma-gray-70 leading-[30px] tracking-[-0.3px] relative shrink-0">: PM 이메일 입력</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Form Section - Frame 14: gap: 32px */}
              <div className="flex flex-col gap-6 sm:gap-8 lg:gap-[32px]">
                {/* Figma Segmented Control - padding: 4px, gap: 4px, background: #F6F6F8, border-radius: 10px */}
                <SegmentedControl
                  options={[
                    { value: 'instructor', label: '강사' },
                    { value: 'pm', label: 'PM' }
                  ]}
                  value={activeTab}
                  onChange={(value) => handleTabChange(value)}
                  size="lg"
                  fullWidth
                  className="h-[48px] sm:h-[56px] rounded-[10px]"
                />

                {/* Instructor Tab Content - Frame 5: gap: 24px */}
                {activeTab === 'instructor' && (
                  <div className="mt-4 sm:mt-6">
                    <form onSubmit={handleInstructorLogin} className="flex flex-col gap-4 sm:gap-6">
                      {/* Frame 5: gap: 8px */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="accessCode" className="text-sm sm:text-base font-medium text-figma-gray-100 leading-[24px] sm:leading-[27px] tracking-[-0.3px]">
                          접속 코드
                        </Label>
                        {/* Frame 6: gap: 6px */}
                        <div className="flex flex-col gap-1.5">
                          {/* Custom TextField with Figma Design */}
                          <div className="flex flex-col items-start relative w-full">
                            <div className="flex flex-col items-start pb-1 pt-0 px-0 relative w-full">
                              {/* Top area */}
                              <div className="flex items-center mb-[-4px] px-4 py-0 relative w-full">
                                <div className="flex flex-1 flex-col items-center min-h-px min-w-px pb-[3px] pt-0 px-0 relative">
                                  <div className="bg-figma-gray-50 h-px shrink-0 w-full" />
                                </div>
                              </div>
                              {/* Bottom area */}
                              <div className="flex items-start mb-[-4px] relative w-full">
                                {/* Left area */}
                                <div className="border-figma-gray-50 border-b border-l border-solid border-t rounded-bl-lg rounded-tl-lg self-stretch shrink-0 w-4" />
                                {/* Center area */}
                                <div className="border-figma-gray-50 border-b border-solid flex flex-1 items-center justify-between min-h-px min-w-px pl-1 pr-0 py-3.5 relative">
                                  <div className="flex flex-1 h-7 items-center justify-between min-h-px min-w-px relative">
                                    <Input
                                      ref={accessCodeRef}
                                      id="accessCode"
                                      placeholder={ACCESS_CODE_PLACEHOLDER}
                                      value={accessCode}
                                      onChange={(e) => setAccessCode(e.target.value)}
                                      className={cn(
                                        "flex flex-1 flex-col font-['Spoqa_Han_Sans_Neo:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic relative text-base tracking-[-0.3px]",
                                        "h-7 border-0 p-0 bg-transparent",
                                        "text-figma-gray-70 placeholder:text-figma-gray-70",
                                        "focus-visible:ring-0 focus-visible:ring-offset-0"
                                      )}
                                      style={{ lineHeight: '27px' }}
                                      autoFocus={false}
                                      onMouseDown={handleUserInteraction}
                                      aria-label="강사 접속 코드 입력"
                                      aria-required="true"
                                    />
                                  </div>
                                </div>
                                {/* Right area */}
                                <div className="border-figma-gray-50 border-b border-r border-solid border-t rounded-br-lg rounded-tr-lg self-stretch shrink-0 w-4" />
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-figma-gray-70 leading-[24px] tracking-[-0.3px] relative shrink-0 w-full" id="accessCode-description">
                            PM에게 받은 개인 코드를 입력하세요.
                          </p>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className={cn(
                          "bg-figma-purple-50 flex items-center justify-center min-w-[100px] px-6 sm:px-8 py-3 sm:py-[13px] relative rounded-[10px] w-full h-[48px] sm:h-[54px]",
                          "hover:bg-figma-purple-50/90",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "transition-all duration-200"
                        )}
                        disabled={isLoading}
                        aria-label={isLoading ? '접속 중' : '강사 입장하기'}
                      >
                        <div className="flex gap-1.5 h-6 sm:h-7 items-center justify-center relative shrink-0">
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" aria-hidden="true" />
                              <span className="font-bold text-base sm:text-lg text-figma-gray-00 leading-[27px] sm:leading-[30px] tracking-[-0.3px] text-center relative shrink-0">
                                접속 중...
                              </span>
                            </>
                          ) : (
                            <span className="font-bold text-base sm:text-lg text-figma-gray-00 leading-[27px] sm:leading-[30px] tracking-[-0.3px] text-center relative shrink-0">
                              입장하기
                            </span>
                          )}
                        </div>
                      </Button>
                    </form>
                  </div>
                )}

                {/* PM Tab Content - Frame 5: gap: 24px */}
                {activeTab === 'pm' && (
                  <div className="mt-4 sm:mt-6">
                    <form onSubmit={handlePMLogin} className="flex flex-col gap-4 sm:gap-6">
                      {/* Frame 5: gap: 8px */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="email" className="text-sm sm:text-base font-medium text-figma-gray-100 leading-[24px] sm:leading-[27px] tracking-[-0.3px]">
                          이메일
                        </Label>
                        {/* Frame 6: gap: 6px */}
                        <div className="flex flex-col gap-1.5">
                          {/* Custom TextField with Figma Design */}
                          <div className="flex flex-col items-start relative w-full">
                            <div className="flex flex-col items-start pb-1 pt-0 px-0 relative w-full">
                              {/* Top area */}
                              <div className="flex items-center mb-[-4px] px-4 py-0 relative w-full">
                                <div className="flex flex-1 flex-col items-center min-h-px min-w-px pb-[3px] pt-0 px-0 relative">
                                  <div className="bg-figma-gray-50 h-px shrink-0 w-full" />
                                </div>
                              </div>
                              {/* Bottom area */}
                              <div className="flex items-start mb-[-4px] relative w-full">
                                {/* Left area */}
                                <div className="border-figma-gray-50 border-b border-l border-solid border-t rounded-bl-lg rounded-tl-lg self-stretch shrink-0 w-4" />
                                {/* Center area */}
                                <div className="border-figma-gray-50 border-b border-solid flex flex-1 items-center justify-between min-h-px min-w-px pl-1 pr-0 py-3.5 relative">
                                  <div className="flex flex-1 h-7 items-center justify-between min-h-px min-w-px relative">
                                    <Input
                                      ref={pmEmailRef}
                                      id="email"
                                      type="email"
                                      placeholder={emailPlaceholder}
                                      value={pmEmail}
                                      onChange={(e) => setPmEmail(e.target.value)}
                                      className={cn(
                                        "flex flex-1 flex-col font-['Spoqa_Han_Sans_Neo:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic relative text-base tracking-[-0.3px]",
                                        "h-7 border-0 p-0 bg-transparent",
                                        "text-figma-gray-70 placeholder:text-figma-gray-70",
                                        "focus-visible:ring-0 focus-visible:ring-offset-0"
                                      )}
                                      style={{ lineHeight: '27px' }}
                                      autoFocus={false}
                                      onMouseDown={handleUserInteraction}
                                      aria-label="PM 이메일 입력"
                                      aria-required="true"
                                    />
                                  </div>
                                </div>
                                {/* Right area */}
                                <div className="border-figma-gray-50 border-b border-r border-solid border-t rounded-br-lg rounded-tr-lg self-stretch shrink-0 w-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Frame 5: gap: 8px */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="password" className="text-sm sm:text-base font-medium text-figma-gray-100 leading-[24px] sm:leading-[27px] tracking-[-0.3px]">
                          비밀번호
                        </Label>
                        {/* Frame 6: gap: 6px */}
                        <div className="flex flex-col gap-1.5">
                          {/* Custom TextField with Figma Design */}
                          <div className="flex flex-col items-start relative w-full">
                            <div className="flex flex-col items-start pb-1 pt-0 px-0 relative w-full">
                              {/* Top area */}
                              <div className="flex items-center mb-[-4px] px-4 py-0 relative w-full">
                                <div className="flex flex-1 flex-col items-center min-h-px min-w-px pb-[3px] pt-0 px-0 relative">
                                  <div className="bg-figma-gray-50 h-px shrink-0 w-full" />
                                </div>
                              </div>
                              {/* Bottom area */}
                              <div className="flex items-start mb-[-4px] relative w-full">
                                {/* Left area */}
                                <div className="border-figma-gray-50 border-b border-l border-solid border-t rounded-bl-lg rounded-tl-lg self-stretch shrink-0 w-4" />
                                {/* Center area */}
                                <div className="border-figma-gray-50 border-b border-solid flex flex-1 items-center justify-between min-h-px min-w-px pl-1 pr-0 py-3.5 relative">
                                  <div className="flex flex-1 h-7 items-center justify-between min-h-px min-w-px relative">
                                    <Input
                                      id="password"
                                      type="password"
                                      placeholder="••••••••"
                                      value={pmPassword}
                                      onChange={(e) => setPmPassword(e.target.value)}
                                      className={cn(
                                        "flex flex-1 flex-col font-['Spoqa_Han_Sans_Neo:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic relative text-base tracking-[-0.3px]",
                                        "h-7 border-0 p-0 bg-transparent",
                                        "text-figma-gray-70 placeholder:text-figma-gray-70",
                                        "focus-visible:ring-0 focus-visible:ring-offset-0"
                                      )}
                                      style={{ lineHeight: '27px' }}
                                      aria-label="PM 비밀번호 입력"
                                      aria-required="true"
                                    />
                                  </div>
                                </div>
                                {/* Right area */}
                                <div className="border-figma-gray-50 border-b border-r border-solid border-t rounded-br-lg rounded-tr-lg self-stretch shrink-0 w-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className={cn(
                          "bg-figma-purple-50 flex items-center justify-center min-w-[100px] px-6 sm:px-8 py-3 sm:py-[13px] relative rounded-[10px] w-full h-[48px] sm:h-[54px]",
                          "hover:bg-figma-purple-50/90",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "transition-all duration-200"
                        )}
                        disabled={isLoading}
                        aria-label={isLoading ? '로그인 중' : 'PM 로그인'}
                      >
                        <div className="flex gap-1.5 h-6 sm:h-7 items-center justify-center relative shrink-0">
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" aria-hidden="true" />
                              <span className="font-bold text-base sm:text-lg text-figma-gray-00 leading-[27px] sm:leading-[30px] tracking-[-0.3px] text-center relative shrink-0">
                                로그인 중...
                              </span>
                            </>
                          ) : (
                            <span className="font-bold text-base sm:text-lg text-figma-gray-00 leading-[27px] sm:leading-[30px] tracking-[-0.3px] text-center relative shrink-0">
                              로그인
                            </span>
                          )}
                        </div>
                      </Button>
                      <div className="text-center pt-3 sm:pt-4 space-y-2">
                        <Link
                          to={ROUTES.PM_REGISTER}
                          className="text-sm sm:text-base text-figma-purple-50 hover:text-figma-purple-100 hover:underline block tracking-[-0.3px] transition-colors"
                          aria-label="PM 계정 회원가입 페이지로 이동"
                        >
                          계정이 없으신가요? 회원가입
                        </Link>
                        <Link
                          to={ROUTES.FORGOT_PASSWORD}
                          className="text-sm sm:text-base text-figma-gray-70 hover:text-figma-gray-100 hover:underline block tracking-[-0.3px] transition-colors"
                          aria-label="비밀번호 찾기 페이지로 이동"
                        >
                          비밀번호를 잊으셨나요?
                        </Link>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Copyright Footer - Frame 34: border-top: 1px solid #D5D6DD, padding: 16px 0px 0px */}
            <div className="border-figma-gray-40 border-solid border-t flex items-center justify-center pb-0 pt-3 sm:pt-4 px-0 relative shrink-0 w-full">
              <p className="text-xs sm:text-sm text-figma-gray-70 leading-[20px] sm:leading-[24px] tracking-[-0.3px] text-center relative shrink-0" role="contentinfo">
                {COPYRIGHT_TEXT}
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
