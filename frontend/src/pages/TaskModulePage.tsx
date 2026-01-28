/**
 * TaskModulePage - Module Detail Page - Figma Design 100%
 *
 * Displays a specific module/task for an instructor to complete.
 * Completely rewritten to match Figma design specifications.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { instructorApi, TaskResponse, StepResponse } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Figma Design Components
import { ModuleHeader } from '@/components/ModuleHeader';
import { ModuleStepHeader } from '@/components/ModuleStepHeader';
import { ModuleStepGuide } from '@/components/ModuleStepGuide';

// Content Type Module Components
import { DocumentQuizModule } from '@/components/modules/DocumentQuizModule';
import { VideoQuizModule } from '@/components/modules/VideoQuizModule';
import { FileUploadModule } from '@/components/modules/FileUploadModule';
import { ChecklistModule } from '@/components/modules/ChecklistModule';

export default function TaskModulePage() {
  const { stepNumber, taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<StepResponse | null>(null);
  const [task, setTask] = useState<TaskResponse | null>(null);
  const [allSteps, setAllSteps] = useState<StepResponse[]>([]);
  const [contentZoom, setContentZoom] = useState(1);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!stepNumber || !taskId) {
        setError('필수 매개변수가 누락되었습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const dashboard = await instructorApi.getDashboard();
        setAllSteps(dashboard.steps);

        const foundStep = dashboard.steps.find(
          s => s.stepNumber === Number(stepNumber)
        );

        if (!foundStep) {
          setError('단계를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        const foundTask = foundStep.tasks.find(
          t => t.id === Number(taskId)
        );

        if (!foundTask) {
          setError('작업을 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        setStep(foundStep);
        setTask(foundTask);
      } catch (err) {
        setError(err instanceof Error ? err.message : '작업을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stepNumber, taskId, location.pathname]);

  // Zoom handlers
  const handleZoomIn = () => {
    setContentZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setContentZoom(prev => Math.max(prev - 0.25, 0.75));
  };

  // Fullscreen handler - For video content only
  const handleToggleFullscreen = () => {
    // For video modules, find the video element and fullscreen it
    const videoElement = document.querySelector('video');
    if (videoElement) {
      if (!document.fullscreenElement) {
        videoElement.requestFullscreen().catch(err => {
          console.error('비디오 전체 화면 진입 실패:', err);
          toast({
            title: '전체 화면 모드',
            description: '브라우저에서 전체 화면 모드를 지원하지 않습니다.',
            variant: 'default',
          });
        });
      } else {
        document.exitFullscreen();
      }
    } else {
      // Fallback: fullscreen the entire page
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error('전체 화면 모드 진입 실패:', err);
          toast({
            title: '전체 화면 모드',
            description: '브라우저에서 전체 화면 모드를 지원하지 않습니다. F11 키를 사용해보세요.',
            variant: 'default',
          });
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  // Navigation handlers
  const handleBackToStep = () => {
    navigate(`/instructor/step/${stepNumber}`);
  };

  const handleBackToDashboard = () => {
    navigate('/instructor');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({ title: '로그아웃', description: '안전하게 로그아웃되었습니다.' });
  };

  const handleOpenNewTab = () => {
    const url = task?.documentUrl || task?.videoUrl;
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Task handlers
  const handleComplete = async () => {
    // Navigate to next task or back to step list
    const nextTask = findNextTask();

    if (nextTask) {
      const nextStep = allSteps.find(s =>
        s.tasks.some(t => t.id === nextTask.id)
      );
      if (nextStep) {
        navigate(`/instructor/step/${nextStep.stepNumber}/task/${nextTask.id}`);
      }
    } else {
      navigate(`/instructor/step/${stepNumber}`);
    }
  };

  const handleSkip = () => {
    // Skip logic - same as complete
    handleComplete();
  };

  const handleUpdateTask = (updatedTask: TaskResponse) => {
    setTask(updatedTask);
  };

  const findNextTask = (): TaskResponse | null => {
    if (!step || !task) return null;

    const currentTaskIndex = step.tasks.findIndex(t => t.id === task.id);

    if (currentTaskIndex !== -1 && currentTaskIndex < step.tasks.length - 1) {
      return step.tasks[currentTaskIndex + 1];
    }

    const currentStepIndex = allSteps.findIndex(s => s.stepNumber === step.stepNumber);

    for (let i = currentStepIndex + 1; i < allSteps.length; i++) {
      const nextStep = allSteps[i];
      if (nextStep.tasks && nextStep.tasks.length > 0) {
        return nextStep.tasks[0];
      }
    }

    return null;
  };

  // Get guide text based on content type
  const getGuideText = () => {
    switch (task?.contentType) {
      case 'A':
        return '아래 내용을 꼼꼼히 읽은 후, 퀴즈를 풀어주세요.';
      case 'B':
        return '아래 영상을 시청한 후, 퀴즈를 풀어주세요.';
      case 'C':
        return '필수 파일을 모두 제출해주세요.';
      case 'D':
        return '아래 체크리스트의 모든 항목을 확인해주세요.';
      default:
        return '';
    }
  };

  // Render module
  const renderModule = () => {
    if (!task) return null;

    switch (task.contentType) {
      case 'A':
        return (
          <DocumentQuizModule
            task={task}
            onUpdate={handleUpdateTask}
            onComplete={handleComplete}
            onSkip={handleSkip}
            isFullWidth={false}
          />
        );
      case 'B':
        return (
          <VideoQuizModule
            task={task}
            onUpdate={handleUpdateTask}
            onComplete={handleComplete}
            onSkip={handleSkip}
            isFullWidth={false}
            onRequestVideoFullscreen={handleToggleFullscreen}
          />
        );
      case 'C':
        return (
          <FileUploadModule
            task={task}
            onUpdate={handleUpdateTask}
            onComplete={handleComplete}
            onSkip={handleSkip}
            isFullWidth={false}
          />
        );
      case 'D':
        return (
          <ChecklistModule
            task={task}
            onUpdate={handleUpdateTask}
            onComplete={handleComplete}
            onSkip={handleSkip}
            isFullWidth={false}
          />
        );
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">로딩 중...</span>
      </div>
    );
  }

  // Error state
  if (error || !step || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{error || '콘텐츠를 찾을 수 없습니다.'}</p>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-figma-gray-00">
      {/* Module Header */}
      <ModuleHeader
        zoom={contentZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleFullscreen={handleToggleFullscreen}
        onBackToStep={handleBackToStep}
        onBackToDashboard={handleBackToDashboard}
        onLogout={handleLogout}
        showNewTabButton={!!(task.documentUrl || task.videoUrl)}
        onOpenNewTab={handleOpenNewTab}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-[1920px] px-4 sm:px-8 md:px-16 lg:px-32 xl:px-[260px] py-12 sm:py-20 md:py-24 lg:py-[136px]">
        {/* Step + Guide Section */}
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-14 items-start sm:items-end w-full">
          {/* Left: Step Header */}
          <div className="flex-1">
            <ModuleStepHeader
              stepNumber={`${step.stepNumber}-${task.displayOrder || 1}`}
              title={task.title}
              description={task.description}
            />
          </div>

          {/* Right: Guide (if applicable) */}
          {getGuideText() && (
            <div className="shrink-0">
              <ModuleStepGuide text={getGuideText()} />
            </div>
          )}
        </div>

        {/* Module Content */}
        <div
          className="w-full"
          style={{
            zoom: contentZoom,
          }}
        >
          {renderModule()}
        </div>
      </main>
    </div>
  );
}
