/**
 * DocumentQuizModule Component (Type A Module) - Figma Design 100%
 *
 * Figma node-id: 66:661
 * 
 * This module handles the Document + Quiz onboarding flow for instructors.
 * Completely rewritten to match Figma design specifications.
 */

import { useState, useEffect } from 'react';
import { TaskResponse, QuizQuestionResponse } from '@/services/api';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { FigmaIcon } from '../FigmaIcon';
import {
  FIGMA_ICON_MESSAGE_QUESTION,
  FIGMA_ICON_CHECK_CIRCLE,
  FIGMA_ICON_ALERT_CIRCLE,
} from '@/assets/figma-images';

// ============================================
// Types and Interfaces
// ============================================

interface DocumentQuizModuleProps {
  task: TaskResponse;
  onUpdate: (task: TaskResponse) => void;
  onComplete: () => void;
  onSkip?: () => void;
  isPreview?: boolean;
  isFullWidth?: boolean;
}

type ModulePhase = 'document' | 'quiz' | 'result';
type QuizAnswers = Record<number, number | string>;

// ============================================
// Constants
// ============================================

const DEFAULT_DOCUMENT_CONTENT = `이 문서는 코드잇 스프린트 강사 온보딩에 필요한 핵심 내용을 담고 있습니다.

1. 핵심 원칙
- 수강생 중심의 교육 철학을 유지합니다
- 명확하고 체계적인 커뮤니케이션을 합니다
- 문제 발생 시 즉시 PM에게 보고합니다

2. 주의사항
- 모든 수업 자료는 저작권 보호 대상입니다
- 개인정보 보호 규정을 준수합니다
- 출결 관리는 정확하게 진행합니다

3. 참고 사항
- 수업 시작 10분 전 Zoom 접속
- 녹화는 자동으로 진행됩니다
- 질문은 Slack 채널을 통해 받습니다`;

// ============================================
// Helper Functions
// ============================================

function isNotionUrl(url: string): boolean {
  return url.includes('notion.so') || url.includes('notion.site');
}

function isExternalMeetingUrl(url: string): boolean {
  const meetingDomains = ['zoom.us', 'meet.google.com', 'teams.microsoft.com'];
  return meetingDomains.some(domain => url.includes(domain));
}

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
    return true; // Subjective questions are always considered correct if answered
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

export function DocumentQuizModule({
  task,
  onUpdate,
  onComplete,
  onSkip,
  isPreview = false,
  isFullWidth = false,
}: DocumentQuizModuleProps) {
  const [phase, setPhase] = useState<ModulePhase>('document');
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [quizResult, setQuizResult] = useState<{ correct: number; total: number } | null>(null);

  // Determine if task is already completed
  const isCompleted = isPreview ? false : task.status === 'COMPLETED';

  // Determine which phase to start with
  useEffect(() => {
    if (isCompleted || isPreview) {
      setPhase('document');
    } else {
      setPhase('document');
    }
  }, [isCompleted, isPreview]);

  // Document content
  const documentUrl = task.documentUrl;
  const documentContent = task.documentContent || DEFAULT_DOCUMENT_CONTENT;
  const quizQuestions = task.quizQuestions || [];

  // Handle quiz answer change
  const handleAnswerChange = (questionId: number, value: number | string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Handle quiz submission
  const handleSubmitQuiz = () => {
    const score = calculateQuizScore(quizQuestions, answers);
    setQuizResult(score);
    setPhase('result');

    // If all correct, mark as completed
    if (areAllQuestionsCorrect(quizQuestions, answers)) {
      onComplete();
    }
  };

  // Handle retry
  const handleRetry = () => {
    setAnswers({});
    setQuizResult(null);
    setPhase('quiz');
  };

  // Handle proceed to quiz
  const handleProceedToQuiz = () => {
    setPhase('quiz');
  };

  // Handle skip
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  // ========================================
  // Render Phases
  // ========================================

  // DOCUMENT PHASE
  if (phase === 'document') {
    // External URL (Notion or Meeting)
    if (documentUrl && (isNotionUrl(documentUrl) || isExternalMeetingUrl(documentUrl))) {
      return (
        <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 items-start w-full">
          {/* Content Container */}
          <div className="bg-figma-gray-05 border border-figma-gray-50 rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 w-full flex flex-col gap-4 sm:gap-6 items-end">
            {/* Content Card */}
            <div className="bg-figma-gray-00 border border-figma-gray-40 rounded-lg sm:rounded-xl p-6 sm:p-8 lg:p-10 w-full py-12 sm:py-16 lg:py-20 flex items-center justify-center">
              {/* Empty state with external link icon */}
              <div className="flex flex-col items-center gap-6 sm:gap-8 lg:gap-10">
                <FigmaIcon
                  src={FIGMA_ICON_CHECK_CIRCLE}
                  alt="External Link"
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14"
                />
                <div className="flex flex-col items-center gap-6 sm:gap-8 lg:gap-16">
                  <div className="flex flex-col items-center gap-2 px-4 text-center max-w-2xl">
                    <p className="text-sm sm:text-base font-normal text-figma-gray-100 tracking-[-0.3px] leading-[24px] sm:leading-[27px]">
                      아래 외부 링크에서 내용을 확인해주세요
                    </p>
                    <p className="text-xs sm:text-sm lg:text-base font-normal text-figma-gray-70 tracking-[-0.3px] leading-[21px] sm:leading-[24px] lg:leading-[27px] break-all">
                      {documentUrl}
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open(documentUrl, '_blank')}
                    variant="ghost"
                    className="h-9 sm:h-10 px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium text-figma-gray-100 tracking-[-0.3px] hover:bg-figma-gray-10"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    링크 열기
                  </Button>
                </div>
              </div>
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
                variant="purple"
                className="min-w-[100px] w-full sm:w-[180px] lg:w-[224px] h-[48px] sm:h-[54px] px-6 sm:px-8 py-3 sm:py-[13px] rounded-[10px] text-base sm:text-lg font-bold leading-[27px] sm:leading-[30px] tracking-[-0.3px]"
              >
                퀴즈 풀기
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Internal Document Content
    return (
      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 items-start w-full">
        {/* Content Container */}
        <div className="bg-figma-gray-05 border border-figma-gray-50 rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 w-full flex flex-col gap-4 sm:gap-5 md:gap-6 items-end">
          {/* Content Card - 블로그처럼 자연스러운 높이 */}
          <div className="bg-figma-gray-00 border border-figma-gray-40 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 lg:p-10 w-full flex flex-col gap-4 sm:gap-6 md:gap-8 lg:gap-10">
            {/* Document Header */}
            <div className="flex flex-col gap-2 sm:gap-2.5 pb-6 sm:pb-8 lg:pb-10 border-b border-figma-gray-40">
              <h2 className="text-xl sm:text-2xl lg:text-[32px] font-bold text-figma-gray-100 tracking-[-0.3px] leading-[28px] sm:leading-[36px] lg:leading-[44px]">
                {task.title}
              </h2>
              {task.description && (
                <p className="text-sm sm:text-base font-normal text-figma-gray-100 tracking-[-0.3px] leading-[24px] sm:leading-[27px]">
                  {task.description}
                </p>
              )}
            </div>

            {/* Document Content - 자연스럽게 세로로 확장 */}
            <div className="w-full">
              <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:text-figma-gray-100 prose-p:text-figma-gray-100 prose-li:text-figma-gray-100 prose-strong:text-figma-gray-100">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                >
                  {documentContent}
                </ReactMarkdown>
              </div>
            </div>
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
                variant="purple"
                className="min-w-[100px] w-full sm:w-[180px] lg:w-[224px] h-[48px] sm:h-[54px] px-6 sm:px-8 py-3 sm:py-[13px] rounded-[10px] text-base sm:text-lg font-bold leading-[27px] sm:leading-[30px] tracking-[-0.3px]"
              >
                퀴즈 풀기
              </Button>
          </div>
        </div>
      </div>
    );
  }

  // QUIZ PHASE
  if (phase === 'quiz') {
    const allAnswered = areAllQuestionsAnswered(quizQuestions, answers);

    return (
      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 items-start w-full">
        {/* Content Container */}
        <div className="bg-figma-gray-05 border border-figma-gray-50 rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 w-full flex flex-col gap-4 sm:gap-5 md:gap-6 items-end">
          {/* Quiz Label */}
          <div className="flex items-center gap-2 sm:gap-2.5 self-start px-2 sm:px-2.5 py-1">
            <FigmaIcon src={FIGMA_ICON_MESSAGE_QUESTION} alt="Quiz" className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-lg sm:text-xl font-medium text-figma-gray-100 tracking-[-0.3px] leading-[28px] sm:leading-[32px]">
              퀴즈
            </span>
          </div>

          {/* Questions - 자연스럽게 세로로 확장 */}
          <div className="bg-figma-gray-00 border border-figma-gray-40 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 lg:p-10 w-full flex flex-col">
            {quizQuestions.map((question, index) => (
              <div key={question.id}>
                {index > 0 && (
                  <hr className="border-t border-figma-gray-40 my-6 sm:my-8" />
                )}
                <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
                  {/* Question */}
                  <div className="flex flex-col gap-4 sm:gap-6">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-figma-gray-100 tracking-[-0.3px] leading-[24px] sm:leading-[28px] lg:leading-[32px]">
                      Q{index + 1}. {question.questionText}
                    </h3>

                    {/* Answers */}
                    {question.questionType === 'OBJECTIVE' ? (
                      <RadioGroup
                        value={answers[question.id]?.toString() || ''}
                        onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
                      >
                        <div className="flex flex-col gap-3 sm:gap-4">
                          {question.answerOptions?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2 sm:gap-3">
                              <RadioGroupItem
                                value={optionIndex.toString()}
                                id={`q${question.id}-option${optionIndex}`}
                                className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                              />
                              <Label
                                htmlFor={`q${question.id}-option${optionIndex}`}
                                className="text-sm sm:text-base lg:text-lg font-normal text-figma-gray-100 tracking-[-0.3px] leading-[24px] sm:leading-[27px] lg:leading-[30px] cursor-pointer"
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
                        className="min-h-[120px] sm:min-h-[140px] text-sm sm:text-base"
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
            variant="purple"
            className="min-w-[100px] w-full sm:w-[180px] lg:w-[224px] h-[48px] sm:h-[54px] px-6 sm:px-8 py-3 sm:py-[13px] rounded-[10px] text-base sm:text-lg font-bold leading-[27px] sm:leading-[30px] tracking-[-0.3px]"
          >
            퀴즈 제출
          </Button>
        </div>
      </div>
    );
  }

  // RESULT PHASE
  if (phase === 'result' && quizResult) {
    const isAllCorrect = quizResult.correct === quizResult.total;

    return (
      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 items-start w-full">
        {/* Content Container */}
        <div className="bg-figma-gray-05 border border-figma-gray-50 rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 w-full flex flex-col gap-4 sm:gap-5 md:gap-6 items-end">
          {/* Quiz Label */}
          <div className="flex items-center gap-2 sm:gap-2.5 self-start px-2 sm:px-2.5 py-1">
            <FigmaIcon src={FIGMA_ICON_MESSAGE_QUESTION} alt="Quiz" className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-lg sm:text-xl font-medium text-figma-gray-100 tracking-[-0.3px] leading-[28px] sm:leading-[32px]">
              퀴즈
            </span>
          </div>

          {/* Result Card - 자연스럽게 세로로 확장 */}
          <div className="bg-figma-gray-00 border border-figma-gray-40 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 lg:p-10 w-full flex flex-col gap-8 sm:gap-10">
            {/* Result Message */}
            <div className="flex flex-col items-center gap-6 sm:gap-8 lg:gap-10">
              <FigmaIcon
                src={isAllCorrect ? FIGMA_ICON_CHECK_CIRCLE : FIGMA_ICON_ALERT_CIRCLE}
                alt={isAllCorrect ? 'Success' : 'Try Again'}
                className="w-12 h-12 sm:w-14 sm:h-14 mt-4 sm:mt-6"
              />
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm sm:text-base font-normal text-figma-gray-100 tracking-[-0.3px] leading-[24px] sm:leading-[27px]">
                  {isAllCorrect ? '축하합니다!' : '아쉽습니다'}
                </p>
                <p className="text-sm sm:text-base font-normal text-figma-gray-100 tracking-[-0.3px] leading-[24px] sm:leading-[27px]">
                  {isAllCorrect
                    ? '모든 문제를 맞추셨습니다'
                    : `${quizResult.total}문제 중 ${quizResult.correct}문제를 맞추셨습니다`}
                </p>
              </div>
            </div>

            {/* Quiz Review */}
            <div className="flex flex-col gap-3 sm:gap-4 lg:gap-[18px]">
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
                      'border rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 flex flex-col gap-3 sm:gap-4',
                      isCorrect ? 'border-figma-green-60 bg-figma-green-00' : 'border-figma-red-60 bg-figma-red-00'
                    )}
                  >
                    {/* Question */}
                    <div className="flex items-start gap-2 sm:gap-3">
                      {isCorrect ? (
                        <Check className="w-5 h-5 sm:w-6 sm:h-6 text-figma-green-70 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-figma-red-70 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base lg:text-lg font-bold text-figma-gray-100 tracking-[-0.3px] leading-[24px] sm:leading-[27px] lg:leading-[30px]">
                          Q{index + 1}. {question.questionText}
                        </p>
                      </div>
                    </div>

                    {/* Answer Review */}
                    {question.questionType === 'OBJECTIVE' && (
                      <div className="pl-7 sm:pl-9">
                        <p className="text-xs sm:text-sm lg:text-base font-normal text-figma-gray-70 tracking-[-0.3px] leading-[21px] sm:leading-[24px] lg:leading-[27px]">
                          정답: {question.answerOptions?.[question.correctAnswerIndex || 0]}
                        </p>
                        {!isCorrect && (
                          <p className="text-xs sm:text-sm lg:text-base font-normal text-figma-gray-70 tracking-[-0.3px] leading-[21px] sm:leading-[24px] lg:leading-[27px]">
                            선택한 답: {question.answerOptions?.[userAnswer as number]}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="pl-7 sm:pl-9">
                        <p className="text-xs sm:text-sm font-normal text-figma-gray-70 tracking-[-0.3px] leading-[21px] sm:leading-[24px]">
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
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {isAllCorrect ? (
              <Button
                onClick={onComplete}
                variant="purple"
                className="min-w-[100px] w-full sm:w-[180px] lg:w-[224px] h-[48px] sm:h-[54px] px-6 sm:px-8 py-3 sm:py-[13px] rounded-[10px] text-base sm:text-lg font-bold leading-[27px] sm:leading-[30px] tracking-[-0.3px]"
              >
                완료하기
              </Button>
            ) : (
              <Button
                onClick={handleRetry}
                variant="secondary"
                className="min-w-[100px] w-full sm:w-[200px] lg:w-[241px] h-[48px] sm:h-[54px] px-6 sm:px-8 py-3 sm:py-[13px] rounded-[10px] text-base sm:text-lg font-bold leading-[27px] sm:leading-[30px] tracking-[-0.3px]"
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
