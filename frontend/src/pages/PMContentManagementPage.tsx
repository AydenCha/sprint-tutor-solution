import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { InstructorResponse, StepResponse, TaskResponse, TaskContentUpdateRequest, QuizQuestionRequest, FileUploadResponse } from '@/services/api';
import { getApiBaseUrl } from '@/config/env';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Save,
  Plus,
  Trash2,
  Edit,
  FileText,
  Video,
  Upload,
  CheckSquare,
  Download,
  Loader2,
  X,
  Link,
  FileVideo
} from 'lucide-react';
import { PMNavigationHeader } from '@/components/PMNavigationHeader';
import { cn } from '@/lib/utils';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { FilePreview } from '@/components/FilePreview';
import { MarkdownEditor } from '@/components/MarkdownEditor';

export default function PMContentManagementPage() {
  const { track, id: instructorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [instructor, setInstructor] = useState<InstructorResponse | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null);
  const [taskFiles, setTaskFiles] = useState<FileUploadResponse[]>([]);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{ 
    id?: number; 
    question: string; 
    questionType?: 'OBJECTIVE' | 'SUBJECTIVE';
    options: string[]; 
    correctAnswerIndex?: number;
    correctAnswerText?: string;
    answerGuide?: string;
  } | null>(null);
  const [editingChecklistItem, setEditingChecklistItem] = useState<{ id: number; label: string } | null>(null);
  const [hasRestored, setHasRestored] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ id: number; fileName: string } | null>(null);
  const [videoInputMode, setVideoInputMode] = useState<'url' | 'upload' | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // 주관식 키워드 관리
  const [subjectiveKeywords, setSubjectiveKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  // 변경사항 추적 (editingTask가 있고 원본과 다른지 확인)
  const originalTask = selectedTask;
  const hasChanges = editingTask && originalTask ? (
    editingTask.title !== originalTask.title ||
    editingTask.description !== originalTask.description ||
    editingTask.documentUrl !== originalTask.documentUrl ||
    editingTask.videoUrl !== originalTask.videoUrl ||
    editingTask.videoDuration !== originalTask.videoDuration ||
    JSON.stringify(editingTask.requiredFiles) !== JSON.stringify(originalTask.requiredFiles)
  ) : false;

  // 페이지 이탈 방지
  const { createSafeNavigate } = useUnsavedChanges({
    hasUnsavedChanges: hasChanges && !isSaving,
    message: '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?',
  });

  const safeNavigate = createSafeNavigate(navigate);

  // 자동 저장 설정 (editingTask가 있을 때만)
  const { restore, clear, getLastSavedTime } = useAutoSave(
    editingTask,
    `content-edit-${instructorId}-${editingTask?.id || 'new'}`,
    {
      debounceMs: 3000,
      validate: (task) => {
        // 최소한 제목이나 설명이 있을 때만 저장
        return !!(task?.title || task?.description);
      },
    }
  );

  useEffect(() => {
    fetchInstructorData();
  }, [instructorId]);

  // URL 쿼리 파라미터에서 taskId를 읽어서 자동으로 task 선택
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const taskIdParam = urlParams.get('taskId');
    
    if (taskIdParam && instructor && !selectedTask) {
      const taskId = Number(taskIdParam);
      // 모든 step에서 task 찾기
      for (const step of instructor.steps || []) {
        const task = step.tasks?.find(t => t.id === taskId);
        if (task) {
          handleEditTask(task);
          break;
        }
      }
    }
  }, [instructor]);

  useEffect(() => {
    if (selectedTask) {
      fetchTaskFiles(selectedTask.id);
    }
  }, [selectedTask]);

  const fetchInstructorData = async () => {
    try {
      setIsLoading(true);
      const data = await api.instructor.getById(Number(instructorId));
      setInstructor(data);
    } catch (error) {
      toast({
        title: '데이터 로드 실패',
        description: error instanceof Error ? error.message : '강사 정보를 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTaskFiles = async (taskId: number) => {
    try {
      const files = await api.pmContentApi.getFilesByTask(taskId);
      setTaskFiles(files);
    } catch (error) {
      // Error handled by toast notification
    }
  };

  const handleEditTask = (task: TaskResponse) => {
    // 이전 편집 내용 복원 시도
    if (!hasRestored) {
      const saved = restore();
      if (saved && saved.id === task.id) {
        const lastSaved = getLastSavedTime();
        const timeAgo = lastSaved 
          ? Math.floor((Date.now() - lastSaved.getTime()) / 1000 / 60) 
          : null;

        if (timeAgo !== null && timeAgo < 60) {
          const message = timeAgo < 1 
            ? '방금 전에 편집하던 내용이 있습니다. 복원하시겠습니까?'
            : `${timeAgo}분 전에 편집하던 내용이 있습니다. 복원하시겠습니까?`;
          
          if (window.confirm(message)) {
            setEditingTask(saved);
            setSelectedTask(task);
            toast({
              title: '편집 내용 복원됨',
              description: '이전에 편집하던 내용을 불러왔습니다.',
            });
            setHasRestored(true);
            return;
          }
        }
      }
      setHasRestored(true);
    }

    setEditingTask({ ...task });
    setSelectedTask(task);

    // Initialize video input mode based on existing data
    if (task.contentType === 'B') {
      if (task.videoUrl) {
        setVideoInputMode('url');
      } else if (task.uploadedFiles && task.uploadedFiles.length > 0) {
        setVideoInputMode('upload');
      } else {
        setVideoInputMode(null);
      }
    }
  };

  const handleSaveTaskContent = async () => {
    if (!editingTask) return;

    try {
      setIsSaving(true);
      const updateData: TaskContentUpdateRequest = {
        title: editingTask.title,
        description: editingTask.description || '',
      };

      if (editingTask.contentType === 'A') {
        updateData.documentUrl = editingTask.documentUrl;
        updateData.documentContent = editingTask.documentContent;
      } else if (editingTask.contentType === 'B') {
        updateData.videoUrl = editingTask.videoUrl;
        updateData.videoDuration = editingTask.videoDuration;
      } else if (editingTask.contentType === 'C') {
        updateData.requiredFiles = editingTask.requiredFiles || [];
      }

      const updated = await api.pmContentApi.updateTaskContent(editingTask.id, updateData);
      
      // Update local state
      if (instructor) {
        const updatedSteps = instructor.steps?.map(step => ({
          ...step,
          tasks: step.tasks?.map(t => t.id === updated.id ? updated : t) || []
        })) || [];
        setInstructor({ ...instructor, steps: updatedSteps });
      }
      
      setEditingTask(null);
      // 저장 성공 후 임시 저장 삭제
      clear();
      toast({
        title: '저장 완료',
        description: '작업 내용이 성공적으로 업데이트되었습니다.',
      });
    } catch (error) {
      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '작업 내용 저장에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuizQuestion = () => {
    setEditingQuestion({
      question: '',
      questionType: 'OBJECTIVE',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
    });
    setSubjectiveKeywords([]);
    setNewKeyword('');
    setShowQuizEditor(true);
  };

  const handleEditQuizQuestion = (question: QuizQuestionResponse) => {
    setEditingQuestion({
      id: question.id,
      question: question.question,
      questionType: question.questionType || 'OBJECTIVE',
      options: question.options || [],
      correctAnswerIndex: question.correctAnswerIndex,
      correctAnswerText: question.correctAnswerText,
      answerGuide: question.answerGuide,
    });
    // correctAnswerText를 키워드 배열로 변환
    if (question.questionType === 'SUBJECTIVE' && question.correctAnswerText) {
      setSubjectiveKeywords(
        question.correctAnswerText.split(',').map(k => k.trim()).filter(k => k)
      );
    } else {
      setSubjectiveKeywords([]);
    }
    setNewKeyword('');
    setShowQuizEditor(true);
  };

  // 주관식 키워드 추가
  const handleAddKeyword = () => {
    const trimmedKeyword = newKeyword.trim();
    if (trimmedKeyword && !subjectiveKeywords.includes(trimmedKeyword)) {
      const updatedKeywords = [...subjectiveKeywords, trimmedKeyword];
      setSubjectiveKeywords(updatedKeywords);
      setNewKeyword('');
      // editingQuestion의 correctAnswerText도 업데이트
      if (editingQuestion) {
        setEditingQuestion({
          ...editingQuestion,
          correctAnswerText: updatedKeywords.join(', ')
        });
      }
    }
  };

  // 주관식 키워드 제거
  const handleRemoveKeyword = (index: number) => {
    const updatedKeywords = subjectiveKeywords.filter((_, i) => i !== index);
    setSubjectiveKeywords(updatedKeywords);
    // editingQuestion의 correctAnswerText도 업데이트
    if (editingQuestion) {
      setEditingQuestion({
        ...editingQuestion,
        correctAnswerText: updatedKeywords.join(', ')
      });
    }
  };

  const handleSaveQuizQuestion = async () => {
    if (!editingQuestion || !selectedTask) return;

    // Validate required fields
    if (!editingQuestion.questionType) {
      toast({
        title: '저장 실패',
        description: '문제 유형을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (editingQuestion.questionType === 'OBJECTIVE') {
      const validOptions = editingQuestion.options?.filter(opt => opt.trim() !== '') || [];
      if (validOptions.length < 2) {
        toast({
          title: '저장 실패',
          description: '객관식 문제는 최소 2개의 선택지가 필요합니다.',
          variant: 'destructive',
        });
        return;
      }
      if (editingQuestion.correctAnswerIndex === undefined || 
          editingQuestion.correctAnswerIndex < 0 || 
          editingQuestion.correctAnswerIndex >= validOptions.length) {
        toast({
          title: '저장 실패',
          description: '올바른 정답을 선택해주세요.',
          variant: 'destructive',
        });
        return;
      }
    } else if (editingQuestion.questionType === 'SUBJECTIVE') {
      if (!editingQuestion.correctAnswerText || editingQuestion.correctAnswerText.trim() === '') {
        toast({
          title: '저장 실패',
          description: '주관식 문제는 정답 텍스트가 필요합니다.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setIsSaving(true);
      const questionData: QuizQuestionRequest = {
        question: editingQuestion.question,
        questionType: editingQuestion.questionType,
        options: editingQuestion.questionType === 'OBJECTIVE' 
          ? editingQuestion.options?.filter(opt => opt.trim() !== '') 
          : undefined,
        correctAnswerIndex: editingQuestion.questionType === 'OBJECTIVE' 
          ? editingQuestion.correctAnswerIndex 
          : undefined,
        correctAnswerText: editingQuestion.questionType === 'SUBJECTIVE' 
          ? editingQuestion.correctAnswerText 
          : undefined,
        answerGuide: editingQuestion.answerGuide,
      };

      if (editingQuestion.id) {
        // Update existing
        await api.pmContentApi.updateQuizQuestion(editingQuestion.id, questionData);
        toast({
          title: '저장 완료',
          description: '퀴즈 문제가 업데이트되었습니다.',
        });
      } else {
        // Create new
        await api.pmContentApi.createQuizQuestion(selectedTask.id, questionData);
        toast({
          title: '저장 완료',
          description: '새 퀴즈 문제가 추가되었습니다.',
        });
      }

      setShowQuizEditor(false);
      setEditingQuestion(null);
      await fetchInstructorData(); // Refresh to get updated quiz questions
    } catch (error) {
      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '퀴즈 문제 저장에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuizQuestion = async (questionId: number) => {
    if (!confirm('이 퀴즈 문제를 삭제하시겠습니까?')) return;

    try {
      await api.pmContentApi.deleteQuizQuestion(questionId);
      toast({
        title: '삭제 완료',
        description: '퀴즈 문제가 삭제되었습니다.',
      });
      await fetchInstructorData(); // Refresh
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '퀴즈 문제 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadFile = async (fileId: number, fileName: string) => {
    try {
      const blob = await api.file.download(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: '다운로드 실패',
        description: error instanceof Error ? error.message : '파일 다운로드에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && editingTask) {
      await uploadVideoFile(files[0]);
    }
  };

  const uploadVideoFile = async (file: File) => {
    if (!editingTask) return;

    // Validate file type
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!videoExtensions.includes(fileExtension)) {
      toast({
        title: '파일 형식 오류',
        description: '비디오 파일만 업로드 가능합니다 (.mp4, .webm, .ogg, .mov 등)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (200MB)
    if (file.size > 200 * 1024 * 1024) {
      toast({
        title: '파일 크기 초과',
        description: '비디오 파일은 200MB 이하만 업로드 가능합니다',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingVideo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${getApiBaseUrl()}/files/upload/${editingTask.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message || 'Upload failed');
      }

      const uploadedFile: FileUploadResponse = await response.json();

      // Update editingTask with uploaded file
      setEditingTask({
        ...editingTask,
        uploadedFiles: [uploadedFile],
        videoUrl: '', // Clear URL when uploading file
      });

      toast({
        title: '업로드 완료',
        description: '비디오가 성공적으로 업로드되었습니다',
      });
    } catch (error) {
      toast({
        title: '업로드 실패',
        description: error instanceof Error ? error.message : '비디오 업로드에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingVideo(false);
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteUploadedVideo = async () => {
    if (!editingTask || !editingTask.uploadedFiles || editingTask.uploadedFiles.length === 0) return;

    const fileId = editingTask.uploadedFiles[0].id;

    try {
      await api.file.delete(fileId);
      setEditingTask({
        ...editingTask,
        uploadedFiles: [],
      });
      setVideoInputMode(null);

      toast({
        title: '삭제 완료',
        description: '비디오가 삭제되었습니다',
      });
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '비디오 삭제에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">로딩 중...</span>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">강사 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 max-w-[1600px]">
      <PMNavigationHeader
        title="콘텐츠 관리"
        description={`${instructor.name} · ${instructor.track}`}
      />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Steps & Tasks List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 bg-card rounded-xl border">
              <h2 className="font-semibold text-foreground mb-4">온보딩 단계</h2>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {instructor.steps?.map((step: StepResponse) => (
                  <div key={step.id} className="space-y-2">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{step.emoji || '📚'}</span>
                        <h3 className="font-medium text-sm text-foreground">
                          {step.title}
                        </h3>
                      </div>
                    </div>
                    <div className="ml-6 space-y-1">
                      {step.tasks?.map((task: TaskResponse) => (
                        <button
                          key={task.id}
                          onClick={() => handleEditTask(task)}
                          className={cn(
                            "w-full text-left p-2 rounded-lg text-sm transition-colors",
                            selectedTask?.id === task.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-card hover:bg-muted border"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {task.contentType === 'A' && <FileText className="h-4 w-4" />}
                            {task.contentType === 'B' && <Video className="h-4 w-4" />}
                            {task.contentType === 'C' && <Upload className="h-4 w-4" />}
                            {task.contentType === 'D' && <CheckSquare className="h-4 w-4" />}
                            <span className="truncate">{task.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Content Editor */}
          <div className="lg:col-span-2">
            {selectedTask ? (
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="content">콘텐츠</TabsTrigger>
                  {selectedTask.contentType === 'A' || selectedTask.contentType === 'B' ? (
                    <TabsTrigger value="quiz">퀴즈</TabsTrigger>
                  ) : null}
                  {selectedTask.contentType === 'D' ? (
                    <TabsTrigger value="checklist">체크리스트</TabsTrigger>
                  ) : null}
                  {selectedTask.contentType === 'C' ? (
                    <TabsTrigger value="files">제출 파일</TabsTrigger>
                  ) : null}
                </TabsList>

                <TabsContent value="content" className="space-y-4 mt-4">
                  <div className="p-6 bg-card rounded-xl border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">작업 내용 편집</h3>
                      {editingTask && (
                        <Button
                          onClick={handleSaveTaskContent}
                          disabled={isSaving}
                          size="sm"
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          저장
                        </Button>
                      )}
                    </div>

                    {editingTask ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">제목</Label>
                          <Input
                            id="title"
                            value={editingTask.title}
                            onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="description">설명</Label>
                          <Textarea
                            id="description"
                            value={editingTask.description || ''}
                            onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                            rows={4}
                          />
                        </div>

                        {editingTask.contentType === 'A' && (
                          <div>
                            <Label htmlFor="documentUrl">문서 URL</Label>
                            <Input
                              id="documentUrl"
                              type="url"
                              value={editingTask.documentUrl || ''}
                              onChange={(e) => setEditingTask({ ...editingTask, documentUrl: e.target.value })}
                              placeholder="https://docs.codeit.kr/..."
                            />
                          </div>
                        )}

                        {editingTask.contentType === 'B' && (
                          <>
                            <div>
                              <Label>비디오 제공 방법</Label>
                              {!videoInputMode ? (
                                // Selection mode
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => setVideoInputMode('url')}
                                    className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
                                  >
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Link className="h-6 w-6 text-primary" />
                                    </div>
                                    <span className="font-medium text-foreground">URL 입력</span>
                                    <span className="text-xs text-muted-foreground text-center">YouTube, Vimeo 등</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setVideoInputMode('upload')}
                                    className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
                                  >
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Upload className="h-6 w-6 text-primary" />
                                    </div>
                                    <span className="font-medium text-foreground">파일 업로드</span>
                                    <span className="text-xs text-muted-foreground text-center">MP4, WebM 등</span>
                                  </button>
                                </div>
                              ) : videoInputMode === 'url' ? (
                                // URL input mode
                                <div className="space-y-4 mt-2">
                                  <div>
                                    <Label htmlFor="videoUrl">비디오 URL</Label>
                                    <div className="flex gap-2">
                                      <Input
                                        id="videoUrl"
                                        type="url"
                                        value={editingTask.videoUrl || ''}
                                        onChange={(e) => {
                                          setEditingTask({ ...editingTask, videoUrl: e.target.value, uploadedFiles: [] });
                                        }}
                                        placeholder="https://youtu.be/..."
                                      />
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                          setEditingTask({ ...editingTask, videoUrl: '' });
                                          setVideoInputMode(null);
                                        }}
                                      >
                                        변경
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="videoDuration">비디오 길이 (초)</Label>
                                    <Input
                                      id="videoDuration"
                                      type="number"
                                      value={editingTask.videoDuration || ''}
                                      onChange={(e) => setEditingTask({ ...editingTask, videoDuration: parseInt(e.target.value) || 0 })}
                                    />
                                  </div>
                                </div>
                              ) : (
                                // Upload mode
                                <div className="space-y-4 mt-2">
                                  {editingTask.uploadedFiles && editingTask.uploadedFiles.length > 0 ? (
                                    // Show uploaded file
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                                      <div className="flex items-center gap-2">
                                        <FileVideo className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-foreground">{editingTask.uploadedFiles[0].fileName}</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          size="sm"
                                          onClick={handleDeleteUploadedVideo}
                                        >
                                          삭제
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => {
                                            handleDeleteUploadedVideo();
                                            setVideoInputMode(null);
                                          }}
                                        >
                                          변경
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    // Show upload UI
                                    <>
                                      <input
                                        ref={videoFileInputRef}
                                        type="file"
                                        accept="video/*,.mp4,.webm,.ogg,.mov,.avi,.mkv,.flv,.wmv"
                                        onChange={handleVideoFileSelect}
                                        className="hidden"
                                        disabled={isUploadingVideo}
                                      />
                                      <div className="flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-dashed">
                                        {isUploadingVideo ? (
                                          <>
                                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                            <p className="text-foreground font-medium">업로드 중...</p>
                                          </>
                                        ) : (
                                          <>
                                            <FileVideo className="h-12 w-12 text-muted-foreground" />
                                            <Button
                                              type="button"
                                              variant="secondary"
                                              onClick={() => videoFileInputRef.current?.click()}
                                            >
                                              <Upload className="h-4 w-4 mr-2" />
                                              파일 선택
                                            </Button>
                                            <p className="text-xs text-muted-foreground">
                                              지원 형식: MP4, WebM, OGG, MOV (최대 200MB)
                                            </p>
                                            <Button
                                              type="button"
                                              variant="tertiary"
                                              size="sm"
                                              onClick={() => setVideoInputMode(null)}
                                            >
                                              취소
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {editingTask.contentType === 'C' && (
                          <div>
                            <Label>필수 파일 목록</Label>
                            <div className="space-y-2 mt-2">
                              {(editingTask.requiredFiles || []).map((file, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    value={file}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      // 쉼표로 구분된 값을 자동으로 분리
                                      if (value.includes(',')) {
                                        const parts = value.split(',').map(p => p.trim()).filter(p => p);
                                        if (parts.length > 1) {
                                          const newFiles = [...(editingTask.requiredFiles || [])];
                                          newFiles.splice(index, 1, ...parts);
                                          setEditingTask({ ...editingTask, requiredFiles: newFiles });
                                          return;
                                        }
                                      }
                                      const newFiles = [...(editingTask.requiredFiles || [])];
                                      newFiles[index] = value;
                                      setEditingTask({ ...editingTask, requiredFiles: newFiles });
                                    }}
                                    placeholder="예: .pdf 또는 여러 개 입력 시 .pdf,.docx,.xlsx"
                                  />
                                  <Button
                                    variant="tertiary"
                                    size="icon"
                                    onClick={() => {
                                      const newFiles = editingTask.requiredFiles?.filter((_, i) => i !== index) || [];
                                      setEditingTask({ ...editingTask, requiredFiles: newFiles });
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setEditingTask({
                                    ...editingTask,
                                    requiredFiles: [...(editingTask.requiredFiles || []), '']
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />파일 추가
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Edit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>왼쪽에서 작업을 선택하여 편집하세요</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {(selectedTask.contentType === 'A' || selectedTask.contentType === 'B') && (
                  <TabsContent value="quiz" className="space-y-4 mt-4">
                    <div className="p-6 bg-card rounded-xl border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">퀴즈 문제 관리</h3>
                        <Button onClick={handleAddQuizQuestion} size="sm">
                          <Plus className="h-4 w-4 mr-2" />문제 추가
                        </Button>
                      </div>

                      {showQuizEditor && editingQuestion && (
                        <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
                          <div>
                            <Label>문제 유형 *</Label>
                            <Select
                              value={editingQuestion.questionType || 'OBJECTIVE'}
                              onValueChange={(value: 'OBJECTIVE' | 'SUBJECTIVE') => {
                                setEditingQuestion({
                                  ...editingQuestion,
                                  questionType: value,
                                  // Reset fields when switching type
                                  options: value === 'OBJECTIVE' ? (editingQuestion.options || ['', '', '', '']) : [],
                                  correctAnswerIndex: value === 'OBJECTIVE' ? 0 : undefined,
                                  correctAnswerText: value === 'SUBJECTIVE' ? (editingQuestion.correctAnswerText || '') : undefined,
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OBJECTIVE">객관식</SelectItem>
                                <SelectItem value="SUBJECTIVE">주관식</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>문제 *</Label>
                            <Textarea
                              value={editingQuestion.question}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                              rows={2}
                            />
                          </div>
                          {editingQuestion.questionType === 'OBJECTIVE' && (
                            <div>
                              <Label>선택지 * (최소 2개)</Label>
                              {(editingQuestion.options || []).map((option, index) => (
                                <div key={index} className="flex items-center gap-2 mb-2">
                                  <input
                                    type="radio"
                                    checked={editingQuestion.correctAnswerIndex === index}
                                    onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswerIndex: index })}
                                    className="w-4 h-4"
                                  />
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...(editingQuestion.options || [])];
                                      newOptions[index] = e.target.value;
                                      setEditingQuestion({ ...editingQuestion, options: newOptions });
                                    }}
                                    placeholder={`선택지 ${index + 1}`}
                                  />
                                  {(editingQuestion.options || []).length > 2 && (
                                    <Button
                                      type="button"
                                      variant="tertiary"
                                      size="icon"
                                      onClick={() => {
                                        const newOptions = (editingQuestion.options || []).filter((_, i) => i !== index);
                                        setEditingQuestion({
                                          ...editingQuestion,
                                          options: newOptions,
                                          correctAnswerIndex: editingQuestion.correctAnswerIndex === index 
                                            ? 0 
                                            : (editingQuestion.correctAnswerIndex && editingQuestion.correctAnswerIndex > index
                                                ? editingQuestion.correctAnswerIndex - 1
                                                : editingQuestion.correctAnswerIndex),
                                        });
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    options: [...(editingQuestion.options || []), ''],
                                  });
                                }}
                                className="mt-2"
                              >
                                <Plus className="h-4 w-4 mr-2" />선택지 추가
                              </Button>
                            </div>
                          )}
                          {editingQuestion.questionType === 'SUBJECTIVE' && (
                            <>
                              <div>
                                <Label>정답 키워드 * (하나 이상 필수)</Label>
                                <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50 min-h-[80px] mt-2">
                                  {subjectiveKeywords.length === 0 ? (
                                    <span className="text-sm text-muted-foreground">키워드를 추가해주세요</span>
                                  ) : (
                                    subjectiveKeywords.map((keyword, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium"
                                      >
                                        {keyword}
                                        <button
                                          onClick={() => handleRemoveKeyword(index)}
                                          className="hover:bg-primary-foreground/20 rounded-full p-0.5 ml-1"
                                          type="button"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </span>
                                    ))
                                  )}
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Input
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddKeyword();
                                      }
                                    }}
                                    placeholder="키워드 입력 후 Enter 또는 추가 버튼 클릭"
                                    className="flex-1"
                                  />
                                  <Button onClick={handleAddKeyword} size="sm" type="button" variant="secondary">
                                    <Plus className="h-4 w-4 mr-1" />
                                    추가
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  💡 강사 답변에 키워드 중 <strong>하나라도 포함</strong>되면 정답으로 인정됩니다.
                                </p>
                              </div>
                              <div>
                                <Label>답변 가이드 (선택)</Label>
                                <Textarea
                                  value={editingQuestion.answerGuide || ''}
                                  onChange={(e) => setEditingQuestion({ ...editingQuestion, answerGuide: e.target.value })}
                                  rows={2}
                                  placeholder="강사가 참고할 수 있는 답변 가이드를 입력하세요"
                                />
                              </div>
                            </>
                          )}
                          <div className="flex gap-2">
                            <Button onClick={handleSaveQuizQuestion} disabled={isSaving} size="sm">
                              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                              저장
                            </Button>
                            <Button
                              variant="tertiary"
                              onClick={() => {
                                setShowQuizEditor(false);
                                setEditingQuestion(null);
                              }}
                              size="sm"
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {selectedTask.quizQuestions?.map((question) => (
                          <div key={question.id} className="p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-medium text-foreground">{question.question}</p>
                              <div className="flex gap-2">
                                <Button
                                  variant="tertiary"
                                  size="sm"
                                  onClick={() => handleEditQuizQuestion(question)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="tertiary"
                                  size="sm"
                                  onClick={() => handleDeleteQuizQuestion(question.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {question.options.map((option, index) => (
                                <div
                                  key={index}
                                  className={cn(
                                    "text-sm p-2 rounded",
                                    index === question.correctAnswerIndex
                                      ? "bg-green-500/10 text-green-600 font-medium"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {index === question.correctAnswerIndex && '✓ '}
                                  {option}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {(!selectedTask.quizQuestions || selectedTask.quizQuestions.length === 0) && !showQuizEditor && (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>퀴즈 문제가 없습니다.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                )}

                {selectedTask.contentType === 'D' && (
                  <TabsContent value="checklist" className="space-y-4 mt-4">
                    <div className="p-6 bg-card rounded-xl border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">체크리스트 항목 관리</h3>
                      </div>

                      {editingTask && editingTask.checklistItems && editingTask.checklistItems.length > 0 ? (
                        <div className="space-y-3">
                          {editingTask.checklistItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              {editingChecklistItem?.id === item.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <Input
                                    value={editingChecklistItem.label}
                                    onChange={(e) => setEditingChecklistItem({ ...editingChecklistItem, label: e.target.value })}
                                    className="flex-1"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        setIsSaving(true);
                                        await api.pmContentApi.updateChecklistItemLabel(item.id, editingChecklistItem.label);
                                        await fetchInstructorData();
                                        setEditingChecklistItem(null);
                                        toast({
                                          title: '저장 완료',
                                          description: '체크리스트 항목이 업데이트되었습니다.',
                                        });
                                      } catch (error) {
                                        toast({
                                          title: '저장 실패',
                                          description: error instanceof Error ? error.message : '체크리스트 항목 저장에 실패했습니다.',
                                          variant: 'destructive',
                                        });
                                      } finally {
                                        setIsSaving(false);
                                      }
                                    }}
                                    disabled={isSaving}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="tertiary"
                                    size="sm"
                                    onClick={() => setEditingChecklistItem(null)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <CheckSquare className="h-5 w-5 text-muted-foreground" />
                                  <span className="flex-1 text-foreground">{item.label}</span>
                                  <Button
                                    variant="tertiary"
                                    size="sm"
                                    onClick={() => setEditingChecklistItem({ id: item.id, label: item.label })}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>체크리스트 항목이 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}

                {selectedTask.contentType === 'C' && (
                  <TabsContent value="files" className="space-y-4 mt-4">
                    <div className="p-6 bg-card rounded-xl border">
                      <h3 className="text-lg font-semibold text-foreground mb-4">제출된 파일</h3>
                      {taskFiles.length > 0 ? (
                        <div className="space-y-2">
                          {taskFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                            >
                              <div 
                                className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setPreviewFile({ id: file.id, fileName: file.fileName })}
                              >
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{file.fileName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(file.fileSize / 1024).toFixed(2)} KB · {new Date(file.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewFile({ id: file.id, fileName: file.fileName });
                                  }}
                                >
                                  미리보기
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadFile(file.id, file.fileName);
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-2" />다운로드
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>아직 제출된 파일이 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            ) : (
              <div className="p-12 bg-card rounded-xl border text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">왼쪽에서 작업을 선택하여 콘텐츠를 관리하세요</p>
              </div>
            )}
          </div>
        </div>

      {/* 파일 미리보기 */}
      {previewFile && (
        <FilePreview
          fileId={previewFile.id}
          fileName={previewFile.fileName}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

