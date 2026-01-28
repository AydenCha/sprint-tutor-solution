import { useState, useEffect, createContext, useContext } from 'react';
import { ModuleResponse, TaskResponse, QuizQuestionResponse, ChecklistItemResponse } from '@/services/api';
import { DocumentQuizModule } from '@/components/modules/DocumentQuizModule';
import { VideoQuizModule } from '@/components/modules/VideoQuizModule';
import { FileUploadModule } from '@/components/modules/FileUploadModule';
import { ChecklistModule } from '@/components/modules/ChecklistModule';
import { ResizableDialog } from '@/components/ResizableDialog';

// Fullscreen context for module components
const FullscreenContext = createContext<boolean>(false);
export const useFullscreen = () => useContext(FullscreenContext);

interface ModulePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: ModuleResponse | null;
}

/**
 * ModuleResponse를 TaskResponse로 변환
 */
function convertModuleToTask(module: ModuleResponse): TaskResponse {
  // Quiz questions 변환
  const quizQuestions: QuizQuestionResponse[] | undefined = module.quizQuestions?.map((q: Partial<QuizQuestionResponse>, index: number) => {
    const questionType = q.questionType || (q.options && q.options.length > 0 ? 'OBJECTIVE' : 'SUBJECTIVE');
    return {
      id: index + 1,
      question: q.question || '',
      questionType: questionType as 'OBJECTIVE' | 'SUBJECTIVE',
      options: q.options || [],
      // 객관식: correctAnswerIndex 사용, 주관식: correctAnswer는 사용 안 함
      correctAnswer: questionType === 'OBJECTIVE' ? (q.correctAnswerIndex ?? q.correctAnswer ?? 0) : 0,
      correctAnswerIndex: q.correctAnswerIndex,
      correctAnswerText: q.correctAnswerText,
      answerGuide: q.answerGuide,
      explanation: q.answerGuide || q.explanation,
    };
  });

  // Checklist items 변환
  const checklistItems: ChecklistItemResponse[] | undefined = module.checklistItems?.map((item: Partial<ChecklistItemResponse>, index: number) => ({
    id: index + 1,
    label: item.label || '',
    checked: false,
  }));

  return {
    id: module.id,
    title: module.name || '',
    description: module.description || '',
    contentType: module.contentType as 'A' | 'B' | 'C' | 'D',
    status: 'PENDING' as const,
    documentUrl: module.documentUrl || undefined,
    documentContent: module.documentContent || undefined,
    videoUrl: module.videoUrl || undefined,
    videoDuration: module.videoDuration || undefined,
    requiredFiles: module.requiredFiles || [],
    quizQuestions,
    checklistItems,
    uploadedFiles: [],
  };
}

export function ModulePreviewDialog({ open, onOpenChange, module }: ModulePreviewDialogProps) {
  const [previewTask, setPreviewTask] = useState<TaskResponse | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Module이 변경되면 Task로 변환
  useEffect(() => {
    if (module) {
      setPreviewTask(convertModuleToTask(module));
    } else {
      setPreviewTask(null);
    }
  }, [module]);

  if (!module || !previewTask) {
    return null;
  }

  const handleUpdate = (updatedTask: TaskResponse) => {
    setPreviewTask(updatedTask);
  };

  const handleComplete = () => {
    // 미리보기에서는 완료 동작을 하지 않음
  };

  const renderModule = () => {
    switch (previewTask.contentType) {
      case 'A':
        return (
          <DocumentQuizModule
            task={previewTask}
            onUpdate={handleUpdate}
            onComplete={handleComplete}
            onSkip={handleComplete}
            isPreview={true}
          />
        );
      case 'B':
        return (
          <VideoQuizModule
            task={previewTask}
            onUpdate={handleUpdate}
            onComplete={handleComplete}
            isPreview={true}
          />
        );
      case 'C':
        return (
          <FileUploadModule
            task={previewTask}
            onUpdate={handleUpdate}
            onComplete={handleComplete}
          />
        );
      case 'D':
        return (
          <ChecklistModule
            task={previewTask}
            onUpdate={handleUpdate}
            onComplete={handleComplete}
            isPreview={true}
          />
        );
    }
  };

  return (
    <ResizableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`모듈 미리보기: ${module.name}`}
      defaultWidth={1000}
      defaultHeight={700}
      minWidth={600}
      minHeight={400}
      onFullscreenChange={setIsFullscreen}
    >
      <FullscreenContext.Provider value={isFullscreen}>
        <div className="flex flex-col h-full">
          {/* Module Title and Description */}
          {(previewTask.title || previewTask.description) && (
            <div className="mb-4 pb-4 border-b flex-shrink-0">
              {previewTask.title && (
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {previewTask.title}
                </h2>
              )}
              {previewTask.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {previewTask.description}
                </p>
              )}
            </div>
          )}

          {/* Module Content */}
          <div className="flex-1 min-h-0">
            {renderModule()}
          </div>
        </div>
      </FullscreenContext.Provider>
    </ResizableDialog>
  );
}

