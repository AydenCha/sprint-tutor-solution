/**
 * VideoQuizModule Component (Type B Module) - Figma Design 100%
 *
 * Figma node-id: 67:1164
 * 
 * This module handles the Video + Quiz onboarding flow for instructors.
 * Completely rewritten to match Figma design specifications.
 */

import { useState, useEffect, useRef } from 'react';
import { TaskResponse, QuizQuestionResponse } from '@/services/api';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FigmaIcon } from '../FigmaIcon';
import {
  FIGMA_ICON_MESSAGE_QUESTION,
  FIGMA_ICON_CHECK_CIRCLE,
  FIGMA_ICON_ALERT_CIRCLE,
  FIGMA_ICON_PLAY_CIRCLE,
  FIGMA_ICON_CHECK,
} from '@/assets/figma-images';

// ============================================
// Types and Interfaces
// ============================================

interface VideoQuizModuleProps {
  task: TaskResponse;
  onUpdate: (task: TaskResponse) => void;
  onComplete: () => void;
  onSkip?: () => void;
  isPreview?: boolean;
  isFullWidth?: boolean;
  onRequestVideoFullscreen?: () => void;
}

type ModulePhase = 'video' | 'quiz' | 'result';
type QuizAnswers = Record<number, number | string>;

// ============================================
// Helper Functions
// ============================================

function areAllQuestionsAnswered(questions: QuizQuestionResponse[], answers: QuizAnswers): boolean {
  return questions.every(q => {
    const answer = answers[q.id];
    if (q.questionType === 'OBJECTIVE') {
      return typeof answer === 'number' && answer >= 0;
    }
    return typeof answer === 'string' && answer.trim().length > 0;
  });
}

function calculateQuizScore(questions: QuizQuestionResponse[], answers: QuizAnswers): { correct: number; total: number } {
  const total = questions.length;
  const correct = questions.filter(q => {
    if (q.questionType === 'OBJECTIVE') {
      return answers[q.id] === q.correctAnswerIndex;
    }
    return true;
  }).length;
  return { correct, total };
}

function areAllQuestionsCorrect(questions: QuizQuestionResponse[], answers: QuizAnswers): boolean {
  return questions.every(q => {
    if (q.questionType === 'OBJECTIVE') {
      return answers[q.id] === q.correctAnswerIndex;
    }
    return true;
  });
}

// ============================================
// Component
// ============================================

export function VideoQuizModule({
  task,
  onUpdate,
  onComplete,
  onSkip,
  isPreview = false,
  isFullWidth = false,
  onRequestVideoFullscreen,
}: VideoQuizModuleProps) {
  const [phase, setPhase] = useState<ModulePhase>('video');
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [quizResult, setQuizResult] = useState<{ correct: number; total: number } | null>(null);
  const [videoWatched, setVideoWatched] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isCompleted = isPreview ? false : task.status === 'COMPLETED';
  const videoUrl = task.videoUrl;
  const videoDuration = task.videoDuration;
  const quizQuestions = task.quizQuestions || [];

  useEffect(() => {
    if (isCompleted || isPreview) {
      setPhase('video');
      setVideoWatched(true);
    }
  }, [isCompleted, isPreview]);

  // Track video watch progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoDuration) return;

    const handleTimeUpdate = () => {
      const watchedPercentage = (video.currentTime / videoDuration) * 100;
      if (watchedPercentage >= 90) {
        setVideoWatched(true);
      }
    };

    const handleEnded = () => {
      setVideoWatched(true);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoDuration]);

  const handleAnswerChange = (questionId: number, value: number | string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitQuiz = () => {
    const score = calculateQuizScore(quizQuestions, answers);
    setQuizResult(score);
    setPhase('result');

    if (areAllQuestionsCorrect(quizQuestions, answers)) {
      onComplete();
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setQuizResult(null);
    setPhase('quiz');
  };

  const handleProceedToQuiz = () => {
    setPhase('quiz');
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  // ========================================
  // VIDEO PHASE
  // ========================================

  if (phase === 'video') {
    return (
      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 items-start w-full">
        {/* Content Container */}
        <div className="bg-figma-gray-05 border border-figma-gray-50 rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 w-full flex flex-col gap-4 sm:gap-6 items-end">
          {/* Video Container - 16:9 Aspect Ratio */}
          <div className="bg-figma-gray-00 border border-figma-gray-40 rounded-lg sm:rounded-xl w-full aspect-video flex items-center justify-center relative overflow-hidden">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                controlsList="nodownload"
                className="w-full h-full object-contain"
                onDoubleClick={() => {
                  if (videoRef.current) {
                    if (!document.fullscreenElement) {
                      videoRef.current.requestFullscreen().catch(err => {
                        console.error('비디오 전체 화면 진입 실패:', err);
                      });
                    } else {
                      document.exitFullscreen();
                    }
                  }
                }}
              />
            ) : (
              // Placeholder when no video
              <div className="flex items-center justify-center">
                <FigmaIcon
                  src={FIGMA_ICON_PLAY_CIRCLE}
                  alt="Play"
                  className="w-16 h-16 sm:w-24 sm:h-24 lg:w-[120px] lg:h-[120px]"
                />
              </div>
            )}
          </div>

          {/* Video Watch Status + Buttons */}
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            {/* Video Watch Status */}
            <div className="flex items-center gap-2">
              <FigmaIcon
                src={FIGMA_ICON_CHECK}
                alt="Check"
                className={cn('w-5 h-5 sm:w-6 sm:h-6', videoWatched ? 'opacity-100' : 'opacity-30')}
              />
              <span className="text-sm sm:text-base font-normal text-figma-gray-100 tracking-[-0.3px] leading-[24px] sm:leading-[27px]">
                영상을 모두 시청했습니다
              </span>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {onSkip && !isPreview && (
                <Button
                  onClick={handleSkip}
                  variant="secondary"
                  className="min-w-[100px] w-full sm:w-[180px] lg:w-[224px] h-[48px] sm:h-[54px] px-6 sm:px-8 py-3 sm:py-[13px] rounded-[10px] text-base sm:text-lg font-bold leading-[27px] sm:leading-[30px] tracking-[-0.3px]"
                >
                  건너뛰기
                </Button>
              )}
              <Button
                onClick={handleProceedToQuiz}
                disabled={!videoWatched}
                variant="primary"
                className="min-w-[100px] w-full sm:w-[180px] lg:w-[224px] h-[48px] sm:h-[54px] px-6 sm:px-8 py-3 sm:py-[13px] rounded-[10px] text-base sm:text-lg font-bold leading-[27px] sm:leading-[30px] tracking-[-0.3px]"
              >
                퀴즈 풀기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // QUIZ PHASE
  // ========================================

  if (phase === 'quiz') {
    const allAnswered = areAllQuestionsAnswered(quizQuestions, answers);

    return (
      <div className="flex flex-col gap-8 items-start w-full">
        {/* Content Container */}
        <div className="bg-figma-gray-05 border border-figma-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 w-full flex flex-col gap-4 sm:gap-5 md:gap-6 items-end">
          {/* Quiz Label */}
          <div className="flex items-center gap-2.5 self-start px-2.5 py-1">
            <FigmaIcon src={FIGMA_ICON_MESSAGE_QUESTION} alt="Quiz" className="w-6 h-6" />
            <span className="text-xl font-medium text-figma-gray-100 tracking-[-0.3px] leading-[32px]">
              퀴즈
            </span>
          </div>

          {/* Questions */}
          <div className="bg-figma-gray-00 border border-figma-gray-40 rounded-xl p-6 sm:p-8 md:p-10 w-full flex flex-col max-h-[calc(100vh-320px)] overflow-y-auto">
            {quizQuestions.map((question, index) => (
              <div key={question.id}>
                {index > 0 && (
                  <hr className="border-t border-figma-gray-40 my-8" />
                )}
                <div className="flex flex-col gap-10">
                  {/* Question */}
                  <div className="flex flex-col gap-6">
                    <h3 className="text-xl font-bold text-figma-gray-100 tracking-[-0.3px] leading-[32px]">
                      Q{index + 1}. {question.questionText}
                    </h3>

                    {/* Answers */}
                    {question.questionType === 'OBJECTIVE' ? (
                      <RadioGroup
                        value={answers[question.id]?.toString() || ''}
                        onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
                      >
                        <div className="flex flex-col gap-4">
                          {question.answerOptions?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-3">
                              <RadioGroupItem
                                value={optionIndex.toString()}
                                id={`q${question.id}-option${optionIndex}`}
                                className="w-6 h-6"
                              />
                              <Label
                                htmlFor={`q${question.id}-option${optionIndex}`}
                                className="text-lg font-normal text-figma-gray-100 tracking-[-0.3px] leading-[30px] cursor-pointer"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    ) : (
                      <Textarea
                        value={(answers[question.id] as string) || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="답변을 입력해주세요"
                        className="min-h-[120px] text-base"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmitQuiz}
            disabled={!allAnswered}
            variant="primary"
            className="min-w-[100px] w-[224px] h-[54px] px-8 py-[13px] rounded-[10px] text-lg font-bold leading-[30px] tracking-[-0.3px]"
          >
            퀴즈 제출
          </Button>
        </div>
      </div>
    );
  }

  // ========================================
  // RESULT PHASE
  // ========================================

  if (phase === 'result' && quizResult) {
    const isAllCorrect = quizResult.correct === quizResult.total;

    return (
      <div className="flex flex-col gap-8 items-start w-full">
        {/* Content Container */}
        <div className="bg-figma-gray-05 border border-figma-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 w-full flex flex-col gap-4 sm:gap-5 md:gap-6 items-end">
          {/* Quiz Label */}
          <div className="flex items-center gap-2.5 self-start px-2.5 py-1">
            <FigmaIcon src={FIGMA_ICON_MESSAGE_QUESTION} alt="Quiz" className="w-6 h-6" />
            <span className="text-xl font-medium text-figma-gray-100 tracking-[-0.3px] leading-[32px]">
              퀴즈
            </span>
          </div>

          {/* Result Card */}
          <div className="bg-figma-gray-00 border border-figma-gray-40 rounded-xl p-6 sm:p-8 md:p-10 w-full flex flex-col gap-6 sm:gap-8 md:gap-10">
            {/* Result Message */}
            <div className="flex flex-col items-center gap-10">
              <FigmaIcon
                src={isAllCorrect ? FIGMA_ICON_CHECK_CIRCLE : FIGMA_ICON_ALERT_CIRCLE}
                alt={isAllCorrect ? 'Success' : 'Try Again'}
                className="w-14 h-14 mt-6"
              />
              <div className="flex flex-col items-center gap-0">
                <p className="text-base font-normal text-figma-gray-100 tracking-[-0.3px] leading-[27px]">
                  {isAllCorrect ? '축하합니다!' : '아쉽습니다'}
                </p>
                <p className="text-base font-normal text-figma-gray-100 tracking-[-0.3px] leading-[27px]">
                  {isAllCorrect
                    ? '모든 문제를 맞추셨습니다'
                    : `${quizResult.total}문제 중 ${quizResult.correct}문제를 맞추셨습니다`}
                </p>
              </div>
            </div>

            {/* Quiz Review */}
            <div className="flex flex-col gap-4">
              {quizQuestions.map((question, index) => {
                const userAnswer = answers[question.id];
                const isCorrect =
                  question.questionType === 'OBJECTIVE'
                    ? userAnswer === question.correctAnswerIndex
                    : true;

                return (
                  <div
                    key={question.id}
                    className={cn(
                      'border rounded-xl p-6 flex flex-col gap-4',
                      isCorrect ? 'border-figma-green-60 bg-figma-green-00' : 'border-figma-red-60 bg-figma-red-00'
                    )}
                  >
                    {/* Question */}
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <Check className="w-6 h-6 text-figma-green-70 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-6 h-6 text-figma-red-70 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-lg font-bold text-figma-gray-100 tracking-[-0.3px] leading-[30px]">
                          Q{index + 1}. {question.questionText}
                        </p>
                      </div>
                    </div>

                    {/* Answer Review */}
                    {question.questionType === 'OBJECTIVE' && (
                      <div className="pl-9">
                        <p className="text-base font-normal text-figma-gray-70 tracking-[-0.3px] leading-[27px]">
                          정답: {question.answerOptions?.[question.correctAnswerIndex || 0]}
                        </p>
                        {!isCorrect && (
                          <p className="text-base font-normal text-figma-gray-70 tracking-[-0.3px] leading-[27px]">
                            선택한 답: {question.answerOptions?.[userAnswer as number]}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="pl-9">
                        <p className="text-sm font-normal text-figma-gray-70 tracking-[-0.3px] leading-[24px]">
                          해설: {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4">
            {isAllCorrect ? (
              <Button
                onClick={onComplete}
                variant="primary"
                className="min-w-[100px] w-[224px] h-[54px] px-8 py-[13px] rounded-[10px] text-lg font-bold leading-[30px] tracking-[-0.3px]"
              >
                완료하기
              </Button>
            ) : (
              <Button
                onClick={handleRetry}
                variant="secondary"
                className="min-w-[100px] w-[241px] h-[54px] px-8 py-[13px] rounded-[10px] text-lg font-bold leading-[30px] tracking-[-0.3px]"
              >
                다시 풀기
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
