import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, FileText, Video, Upload, CheckSquare, Check } from 'lucide-react';
import api, { ModuleRequest, QuizQuestionRequest, ChecklistItemRequest, FileRequirement, ModuleResponse } from '@/services/api';
import { cn } from '@/lib/utils';
import { MarkdownEditor } from '@/components/MarkdownEditor';

interface CreateModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  module?: ModuleResponse | null; // 수정 모드일 때 기존 모듈 데이터
  stepDefinitionId?: number;
}

export function CreateModuleDialog({ open, onOpenChange, onSuccess, module, stepDefinitionId }: CreateModuleDialogProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [contentType, setContentType] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const isLoadingModuleData = useRef(false); // Track if we're loading module data to avoid clearing fields

  // Step definitions
  const [stepDefinitions, setStepDefinitions] = useState<Array<{ id: number; title: string; emoji: string }>>([]);
  const [selectedStepId, setSelectedStepId] = useState<number | undefined>(stepDefinitionId);

  // 기본 필드
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Type A: Document + Quiz
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [documentInputMode, setDocumentInputMode] = useState<'markdown' | 'url'>('markdown');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionRequest[]>([]);
  
  // Type B: Video + Quiz
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState<number | undefined>(undefined);
  const [videoInputMode, setVideoInputMode] = useState<'url' | 'upload'>('url');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  
  // Type C: File Upload
  const [requiredFiles, setRequiredFiles] = useState<FileRequirement[]>([{
    placeholder: '',
    fileNameHint: '',
    allowedExtensions: [],
    required: true
  }]);
  // Store allowedExtensions as strings for input fields (to allow comma input)
  const [allowedExtensionsStrings, setAllowedExtensionsStrings] = useState<Record<number, string>>({});
  
  // Type D: Checklist
  const [checklistItems, setChecklistItems] = useState<ChecklistItemRequest[]>([]);

  // Load step definitions
  useEffect(() => {
    if (open) {
      api.stepDefinition.getAll()
        .then(response => {
          setStepDefinitions(response);
        })
        .catch(error => {
          console.error('Failed to load step definitions:', error);
          toast({
            title: '스텝 목록 로드 실패',
            description: '스텝 목록을 불러오는데 실패했습니다.',
            variant: 'destructive',
          });
        });
    }
  }, [open, toast]);

  // Load module data when editing
  useEffect(() => {
    if (module && open) {
      // Mark as loading to prevent clearing fields
      isLoadingModuleData.current = true;

      // Fetch latest module data to ensure all details (including checklist items) are loaded
      api.module.getById(module.id)
        .then(fullModule => {
          // Set content type
          setContentType(fullModule.contentType);

          // Set basic fields
          setName(fullModule.name);
          setDescription(fullModule.description || '');

          // Set step definition ID from module
          if (fullModule.stepDefinitionId) {
            setSelectedStepId(fullModule.stepDefinitionId);
          }

          // Type A: Document + Quiz
          if (fullModule.contentType === 'A') {
            setDocumentUrl(fullModule.documentUrl || '');
            setDocumentContent(fullModule.documentContent || '');
            setDocumentInputMode(fullModule.documentContent ? 'markdown' : 'url');
            setQuizQuestions(fullModule.quizQuestions?.map(q => ({
              question: q.question,
              questionType: q.questionType,
              options: q.options || [],
              correctAnswerIndex: q.correctAnswerIndex,
              correctAnswerText: q.correctAnswerText,
              answerGuide: q.answerGuide,
            })) || []);
          }

          // Type B: Video + Quiz
          if (fullModule.contentType === 'B') {
            setVideoUrl(fullModule.videoUrl || '');
            setVideoDuration(fullModule.videoDuration);
            setQuizQuestions(fullModule.quizQuestions?.map(q => ({
              question: q.question,
              questionType: q.questionType,
              options: q.options || [],
              correctAnswerIndex: q.correctAnswerIndex,
              correctAnswerText: q.correctAnswerText,
              answerGuide: q.answerGuide,
            })) || []);
          }

          // Type C: File Upload
          if (fullModule.contentType === 'C') {
            const files = fullModule.requiredFiles?.map(f => ({
              placeholder: f.placeholder,
              fileNameHint: f.fileNameHint || '',
              allowedExtensions: f.allowedExtensions || [],
              required: f.required !== undefined ? f.required : true,
            })) || [{
              placeholder: '',
              fileNameHint: '',
              allowedExtensions: [],
              required: true
            }];
            setRequiredFiles(files);
            // Initialize allowedExtensionsStrings for input fields
            const extensionsStrings: Record<number, string> = {};
            files.forEach((f, index) => {
              extensionsStrings[index] = f.allowedExtensions?.join(', ') || '';
            });
            setAllowedExtensionsStrings(extensionsStrings);
          }

          // Type D: Checklist - Load from full module data
          if (fullModule.contentType === 'D') {
            setChecklistItems(fullModule.checklistItems?.map(item => ({
              label: item.label
            })) || []);
          }

          // Mark loading as complete
          isLoadingModuleData.current = false;
        })
        .catch(error => {
          console.error('Failed to load module details:', error);
          toast({
            title: '모듈 로드 실패',
            description: '모듈 상세 정보를 불러오는데 실패했습니다.',
            variant: 'destructive',
          });
          isLoadingModuleData.current = false;
        });
    } else if (!module && open) {
      // Mark as not loading when creating new module
      isLoadingModuleData.current = false;
      // Reset form when creating new module
      setName('');
      setDescription('');
      setSelectedStepId(stepDefinitionId); // Reset to prop value or undefined
      setDocumentUrl('');
      setDocumentContent('');
      setVideoUrl('');
      setVideoDuration(undefined);
      setRequiredFiles([{
        placeholder: '',
        fileNameHint: '',
        allowedExtensions: [],
        required: true
      }]);
      setAllowedExtensionsStrings({});
      setQuizQuestions([]);
      setChecklistItems([]);
      setContentType('A');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, open]);

  // Clear type-specific fields when content type changes (but not during initial load)
  useEffect(() => {
    if (!isLoadingModuleData.current && open) {
      // Clear all type-specific fields
      setDocumentUrl('');
      setDocumentContent('');
      setVideoUrl('');
      setVideoDuration(undefined);
      setVideoInputMode('url');
      setQuizQuestions([]);
      setRequiredFiles([{
        placeholder: '',
        fileNameHint: '',
        allowedExtensions: [],
        required: true
      }]);
      setAllowedExtensionsStrings({});
      setChecklistItems([]);
    }
  }, [contentType, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedStepId(stepDefinitionId);
    setDocumentUrl('');
    setDocumentContent('');
    setVideoUrl('');
    setVideoDuration(undefined);
    setRequiredFiles([{
      placeholder: '',
      fileNameHint: '',
      allowedExtensions: [],
      required: true
    }]);
    setQuizQuestions([]);
    setChecklistItems([]);
    setContentType('A');
  };

  const handleClose = () => {
    isLoadingModuleData.current = false;
    resetForm();
    onOpenChange(false);
  };

  const handleAddQuizQuestion = () => {
    setQuizQuestions([...quizQuestions, { 
      question: '', 
      questionType: 'OBJECTIVE' as const,
      options: ['', ''], 
      correctAnswerIndex: 0 
    }]);
  };

  const handleUpdateQuizQuestion = (index: number, field: string, value: string | number | string[]) => {
    const updated = [...quizQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setQuizQuestions(updated);
  };

  const handleAddQuizOption = (questionIndex: number) => {
    const updated = [...quizQuestions];
    const currentOptions = updated[questionIndex].options || [];
    updated[questionIndex] = { ...updated[questionIndex], options: [...currentOptions, ''] };
    setQuizQuestions(updated);
  };

  const handleRemoveQuizOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...quizQuestions];
    const currentOptions = updated[questionIndex].options || [];
    updated[questionIndex] = { 
      ...updated[questionIndex], 
      options: currentOptions.filter((_, i) => i !== optionIndex)
    };
    if (updated[questionIndex].correctAnswerIndex !== undefined && 
        updated[questionIndex].correctAnswerIndex! >= updated[questionIndex].options!.length) {
      updated[questionIndex].correctAnswerIndex = 0;
    }
    setQuizQuestions(updated);
  };

  const handleRemoveQuizQuestion = (index: number) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  const handleAddRequiredFile = () => {
    const newIndex = requiredFiles.length;
    setRequiredFiles([...requiredFiles, {
      placeholder: '',
      fileNameHint: '',
      allowedExtensions: [],
      required: true
    }]);
    setAllowedExtensionsStrings(prev => ({
      ...prev,
      [newIndex]: ''
    }));
  };

  const handleUpdateRequiredFile = (index: number, field: keyof FileRequirement, value: string | string[] | boolean | undefined) => {
    const updated = [...requiredFiles];
    updated[index] = { ...updated[index], [field]: value };
    setRequiredFiles(updated);
  };

  const handleAllowedExtensionsChange = (index: number, value: string) => {
    // Update the string state for the input field
    setAllowedExtensionsStrings(prev => ({
      ...prev,
      [index]: value
    }));
    // Update the actual array when user types
    const extensions = value.split(',').map(ext => ext.trim()).filter(ext => ext);
    handleUpdateRequiredFile(index, 'allowedExtensions', extensions);
  };

  const handleRemoveRequiredFile = (index: number) => {
    setRequiredFiles(requiredFiles.filter((_, i) => i !== index));
    // Remove from allowedExtensionsStrings
    const newStrings: Record<number, string> = {};
    requiredFiles.forEach((_, i) => {
      if (i < index) {
        newStrings[i] = allowedExtensionsStrings[i] || '';
      } else if (i > index) {
        newStrings[i - 1] = allowedExtensionsStrings[i] || '';
      }
    });
    setAllowedExtensionsStrings(newStrings);
  };

  const handleAddChecklistItem = () => {
    setChecklistItems([...checklistItems, { label: '' }]);
  };

  const handleUpdateChecklistItem = (index: number, label: string) => {
    const updated = [...checklistItems];
    updated[index] = { label };
    setChecklistItems(updated);
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      toast({
        title: '입력 오류',
        description: '모듈 이름을 입력해주세요.',
        variant: 'destructive',
      });
      return false;
    }

    // Step definition is required - modules must belong to a step
    if (!selectedStepId) {
      toast({
        title: '입력 오류',
        description: '귀속 스텝을 선택해주세요. 모듈은 반드시 스텝에 귀속되어야 합니다.',
        variant: 'destructive',
      });
      return false;
    }

    if (contentType === 'A') {
      if (documentInputMode === 'markdown' && !documentContent.trim()) {
        toast({
          title: '입력 오류',
          description: '마크다운 문서 내용을 입력해주세요.',
          variant: 'destructive',
        });
        return false;
      }
      if (documentInputMode === 'url' && !documentUrl.trim()) {
        toast({
          title: '입력 오류',
          description: '문서 URL을 입력해주세요.',
          variant: 'destructive',
        });
        return false;
      }
    }

    if (contentType === 'B' && !videoUrl.trim()) {
      toast({
        title: '입력 오류',
        description: videoInputMode === 'url' 
          ? '동영상 URL을 입력해주세요.' 
          : '동영상 파일을 업로드해주세요.',
        variant: 'destructive',
      });
      return false;
    }

    if ((contentType === 'A' || contentType === 'B') && quizQuestions.length === 0) {
      toast({
        title: '입력 오류',
        description: '최소 1개 이상의 퀴즈 문제를 추가해주세요.',
        variant: 'destructive',
      });
      return false;
    }

    // 퀴즈 문제 유효성 검사
    for (let i = 0; i < quizQuestions.length; i++) {
      const q = quizQuestions[i];
      if (!q.question.trim()) {
        toast({
          title: '입력 오류',
          description: `퀴즈 문제 ${i + 1}의 질문을 입력해주세요.`,
          variant: 'destructive',
        });
        return false;
      }
      if (q.questionType === 'OBJECTIVE') {
        const options = q.options || [];
        if (options.length < 2) {
          toast({
            title: '입력 오류',
            description: `퀴즈 문제 ${i + 1}에 최소 2개 이상의 선택지를 추가해주세요.`,
            variant: 'destructive',
          });
          return false;
        }
        if (options.some(opt => !opt.trim())) {
          toast({
            title: '입력 오류',
            description: `퀴즈 문제 ${i + 1}의 모든 선택지를 입력해주세요.`,
            variant: 'destructive',
          });
          return false;
        }
        if (q.correctAnswerIndex === undefined) {
          toast({
            title: '입력 오류',
            description: `퀴즈 문제 ${i + 1}의 정답을 선택해주세요.`,
            variant: 'destructive',
          });
          return false;
        }
      }
    }

    if (contentType === 'C' && requiredFiles.filter(f => f.placeholder.trim()).length === 0) {
      toast({
        title: '입력 오류',
        description: '최소 1개 이상의 파일 요구사항을 입력해주세요.',
        variant: 'destructive',
      });
      return false;
    }

    if (contentType === 'D') {
      const validItems = checklistItems.filter(item => item.label.trim());
      if (validItems.length === 0) {
        toast({
          title: '입력 오류',
          description: '최소 1개 이상의 체크리스트 항목을 입력해주세요.',
          variant: 'destructive',
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsCreating(true);

      const request: ModuleRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        contentType: contentType as 'A' | 'B' | 'C' | 'D',
        stepDefinitionId: selectedStepId,
      };

      if (contentType === 'A') {
        request.documentUrl = documentUrl.trim();
        request.documentContent = documentContent.trim();
        // 퀴즈 문제가 있는 경우에만 추가
        if (quizQuestions.length > 0) {
          request.quizQuestions = quizQuestions.map(q => {
            if (q.questionType === 'OBJECTIVE') {
              const filteredOptions = (q.options || []).map(opt => opt.trim()).filter(opt => opt.length > 0);
              // 최소 2개 선택지 확인
              if (filteredOptions.length < 2) {
                throw new Error('객관식 문제는 최소 2개 이상의 선택지가 필요합니다.');
              }
              // 정답 인덱스가 유효한지 확인
              if (q.correctAnswerIndex === undefined || q.correctAnswerIndex >= filteredOptions.length) {
                throw new Error('정답 인덱스가 선택지 개수를 초과합니다.');
              }
              return {
                question: q.question.trim(),
                questionType: 'OBJECTIVE' as const,
                options: filteredOptions,
                correctAnswerIndex: q.correctAnswerIndex,
              };
            } else {
              // 주관식
              return {
                question: q.question.trim(),
                questionType: 'SUBJECTIVE' as const,
                correctAnswerText: q.correctAnswerText?.trim() || undefined,
                answerGuide: q.answerGuide?.trim() || undefined,
              };
            }
          });
        }
      } else if (contentType === 'B') {
        request.videoUrl = videoUrl.trim();
        request.videoDuration = videoDuration;
        // 퀴즈 문제가 있는 경우에만 추가
        if (quizQuestions.length > 0) {
          request.quizQuestions = quizQuestions.map(q => {
            if (q.questionType === 'OBJECTIVE') {
              const filteredOptions = (q.options || []).map(opt => opt.trim()).filter(opt => opt.length > 0);
              // 최소 2개 선택지 확인
              if (filteredOptions.length < 2) {
                throw new Error('객관식 문제는 최소 2개 이상의 선택지가 필요합니다.');
              }
              // 정답 인덱스가 유효한지 확인
              if (q.correctAnswerIndex === undefined || q.correctAnswerIndex >= filteredOptions.length) {
                throw new Error('정답 인덱스가 선택지 개수를 초과합니다.');
              }
              return {
                question: q.question.trim(),
                questionType: 'OBJECTIVE' as const,
                options: filteredOptions,
                correctAnswerIndex: q.correctAnswerIndex,
              };
            } else {
              // 주관식
              return {
                question: q.question.trim(),
                questionType: 'SUBJECTIVE' as const,
                correctAnswerText: q.correctAnswerText?.trim() || undefined,
                answerGuide: q.answerGuide?.trim() || undefined,
              };
            }
          });
        }
      } else if (contentType === 'C') {
        const filteredFiles = requiredFiles
          .filter(f => f.placeholder.trim())
          .map(f => ({
            placeholder: f.placeholder.trim(),
            fileNameHint: f.fileNameHint?.trim() || undefined,
            allowedExtensions: f.allowedExtensions && f.allowedExtensions.length > 0 ? f.allowedExtensions : undefined,
            required: f.required !== undefined ? f.required : true,
          }));
        if (filteredFiles.length > 0) {
          request.requiredFiles = filteredFiles;
        }
      } else if (contentType === 'D') {
        const filteredItems = checklistItems
          .filter(item => item.label.trim())
          .map(item => ({
            label: item.label.trim(),
          }));
        if (filteredItems.length > 0) {
          request.checklistItems = filteredItems;
        }
      }
      if (module) {
        // 수정 모드
        await api.module.update(module.id, request);
        toast({
          title: '모듈 수정 완료',
          description: '모듈이 성공적으로 수정되었습니다.',
        });
      } else {
        // 생성 모드
        await api.module.create(request);
        toast({
          title: '모듈 생성 완료',
          description: '새 모듈이 생성되었습니다. 계속해서 새 모듈을 생성하거나 닫기를 눌러주세요.',
        });
        // 생성 모드: 폼만 리셋하고 다이얼로그는 열린 상태 유지
        resetForm();
      }

      // 수정 모드일 때만 다이얼로그 닫기
      if (module) {
        handleClose();
      }

      onSuccess();
    } catch (error) {
      console.error(`Module ${module ? 'update' : 'creation'} error:`, error);
      const errorMessage = error instanceof Error ? error.message : `모듈 ${module ? '수정' : '생성'}에 실패했습니다.`;
      toast({
        title: `모듈 ${module ? '수정' : '생성'} 실패`,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => {
          // 외부 클릭 시 닫히지 않도록 방지 (실수로 작성 중인 내용 손실 방지)
          e.preventDefault();
        }}
        onKeyDown={(e) => {
          // Ctrl+Enter 또는 Cmd+Enter로 제출
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{module ? '모듈 수정' : '새 모듈 생성'}</DialogTitle>
          <DialogDescription>
            {module ? '모듈 내용을 수정하세요. (Ctrl/Cmd+Enter로 저장)' : '모듈 타입을 선택하고 내용을 입력하세요. (Ctrl/Cmd+Enter로 생성)'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4 overflow-y-auto flex-1 pr-2">
          {/* 모듈 타입 선택 */}
          <div>
            <Label>모듈 타입</Label>
            <Tabs value={contentType} onValueChange={(v) => setContentType(v as 'A' | 'B' | 'C' | 'D')}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="A" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  문서 + 퀴즈
                </TabsTrigger>
                <TabsTrigger value="B" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  동영상 + 퀴즈
                </TabsTrigger>
                <TabsTrigger value="C" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  파일 업로드
                </TabsTrigger>
                <TabsTrigger value="D" className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  체크리스트
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 기본 정보 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">모듈 이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 규정 문서 읽기"
              />
            </div>
            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="모듈에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="stepDefinition">귀속 스텝 *</Label>
              <Select
                value={selectedStepId?.toString() || ""}
                onValueChange={(value) => setSelectedStepId(value ? Number(value) : undefined)}
                required
              >
                <SelectTrigger id="stepDefinition">
                  <SelectValue placeholder="스텝을 선택하세요 (필수)" />
                </SelectTrigger>
                <SelectContent>
                  {stepDefinitions && stepDefinitions.length > 0 ? (
                    stepDefinitions.map((step) => (
                      <SelectItem key={step.id} value={step.id.toString()}>
                        {step.emoji} {step.title}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      스텝을 불러오는 중...
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                이 모듈이 속할 스텝을 선택하세요. 스텝이 삭제되면 귀속된 모듈도 함께 삭제됩니다.
              </p>
            </div>
          </div>

          {/* Type A: Document + Quiz */}
          {contentType === 'A' && (
            <div className="space-y-4">
              <div>
                <Label>문서 입력 방식</Label>
                <RadioGroup
                  value={documentInputMode}
                  onValueChange={(value: 'markdown' | 'url') => {
                    setDocumentInputMode(value);
                    if (value === 'markdown') {
                      setDocumentUrl('');
                    } else {
                      setDocumentContent('');
                    }
                  }}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="markdown" id="markdown" />
                    <Label htmlFor="markdown" className="font-normal cursor-pointer">
                      마크다운 직접 작성
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="url" id="url" />
                    <Label htmlFor="url" className="font-normal cursor-pointer">
                      외부 URL 링크
                    </Label>
                  </div>
                </RadioGroup>

                {documentInputMode === 'markdown' ? (
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="documentContent">마크다운 문서 내용 *</Label>
                    <MarkdownEditor
                      value={documentContent}
                      onChange={setDocumentContent}
                      placeholder="# 제목&#10;&#10;문서 내용을 마크다운으로 작성하세요...&#10;&#10;💡 Notion: Export → Markdown → 복사/붙여넣기"
                      minHeight="300px"
                    />
                  </div>
                ) : (
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="documentUrl">문서 URL *</Label>
                    <Input
                      id="documentUrl"
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Notion, Zoom, Discord, Zep 등의 링크는 새 탭에서 열립니다. Google Docs, PDF 등은 직접 표시됩니다.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>퀴즈 문제</Label>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddQuizQuestion}>
                    <Plus className="h-4 w-4 mr-2" />문제 추가
                  </Button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {quizQuestions.map((question, qIndex) => (
                    <Card key={qIndex}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">문제 {qIndex + 1}</Label>
                        <Button
                          type="button"
                          variant="icon"
                          size="icon-sm"
                          onClick={() => handleRemoveQuizQuestion(qIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex items-center gap-2">
                        <Label className="text-sm min-w-fit">문제 유형:</Label>
                        <Select
                            value={question.questionType || 'OBJECTIVE'}
                            onValueChange={(value) => handleUpdateQuizQuestion(qIndex, 'questionType', value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OBJECTIVE">객관식</SelectItem>
                              <SelectItem value="SUBJECTIVE">주관식</SelectItem>
                            </SelectContent>
                          </Select>
                      </div>
                      <Input
                        value={question.question}
                        onChange={(e) => handleUpdateQuizQuestion(qIndex, 'question', e.target.value)}
                        placeholder="질문을 입력하세요"
                      />
                      {question.questionType === 'OBJECTIVE' && (
                        <div className="space-y-2">
                          <Label>선택지</Label>
                          {(question.options || []).map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const updated = [...(question.options || [])];
                                  updated[oIndex] = e.target.value;
                                  handleUpdateQuizQuestion(qIndex, 'options', updated);
                                }}
                                placeholder={`선택지 ${oIndex + 1}`}
                                className={cn(
                                  question.correctAnswerIndex === oIndex && "border-figma-green-60 bg-figma-green-00/30"
                                )}
                              />
                              <Button
                                type="button"
                                variant={question.correctAnswerIndex === oIndex ? "primary" : "secondary"}
                                size="sm"
                                onClick={() => handleUpdateQuizQuestion(qIndex, 'correctAnswerIndex', oIndex)}
                              >
                                정답
                              </Button>
                              {(question.options || []).length > 2 && (
                                <Button
                                  type="button"
                                  variant="icon"
                                  size="icon-sm"
                                  onClick={() => handleRemoveQuizOption(qIndex, oIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAddQuizOption(qIndex)}
                          >
                            <Plus className="h-4 w-4 mr-2" />선택지 추가
                          </Button>
                        </div>
                      )}
                      {question.questionType === 'SUBJECTIVE' && (
                        <div className="space-y-2">
                          <div>
                            <Label>정답 텍스트 (선택사항)</Label>
                            <Input
                              value={question.correctAnswerText || ''}
                              onChange={(e) => handleUpdateQuizQuestion(qIndex, 'correctAnswerText', e.target.value)}
                              placeholder="예시 정답을 입력하세요"
                            />
                          </div>
                          <div>
                            <Label>답변 가이드라인 (선택사항)</Label>
                            <Textarea
                              value={question.answerGuide || ''}
                              onChange={(e) => handleUpdateQuizQuestion(qIndex, 'answerGuide', e.target.value)}
                              placeholder="답변 작성 시 참고할 가이드라인을 입력하세요"
                              rows={3}
                            />
                          </div>
                        </div>
                      )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Type B: Video + Quiz */}
          {contentType === 'B' && (
            <div className="space-y-4">
              <div>
                <Label>동영상 입력 방식 *</Label>
                <RadioGroup
                  value={videoInputMode}
                  onValueChange={(value) => setVideoInputMode(value as 'url' | 'upload')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="url" id="video-url-mode" />
                    <Label htmlFor="video-url-mode" className="font-normal cursor-pointer">
                      외부 URL (YouTube, Vimeo 등)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upload" id="video-upload-mode" />
                    <Label htmlFor="video-upload-mode" className="font-normal cursor-pointer">
                      동영상 파일 업로드
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {videoInputMode === 'url' ? (
                <div>
                  <Label htmlFor="videoUrl">동영상 URL *</Label>
                  <Input
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... 또는 https://vimeo.com/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    YouTube, Vimeo URL을 입력하세요. 자동으로 임베드 가능한 형식으로 변환됩니다.
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="video-file-upload">동영상 파일 업로드 *</Label>
                  <div className="mt-2 space-y-2">
                    <Input
                      id="video-file-upload"
                      type="file"
                      accept="video/*,.mp4,.mov,.avi,.mkv,.webm"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Validate file size (500MB max)
                        const maxSize = 500 * 1024 * 1024;
                        if (file.size > maxSize) {
                          toast({
                            title: '파일 크기 초과',
                            description: '동영상 파일은 500MB 이하여야 합니다.',
                            variant: 'destructive',
                          });
                          e.target.value = '';
                          return;
                        }

                        setUploadedVideoFile(file);
                        
                        // Upload immediately
                        setIsUploadingVideo(true);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);

                          const response = await api.post('/files/videos/upload', formData, {
                            headers: {
                              'Content-Type': 'multipart/form-data',
                            },
                          });

                          setVideoUrl(response.data.url);
                          toast({
                            title: '업로드 완료',
                            description: '동영상이 업로드되었습니다.',
                          });
                        } catch (error: any) {
                          console.error('Video upload failed:', error);
                          toast({
                            title: '업로드 실패',
                            description: error.response?.data?.message || '동영상 업로드에 실패했습니다.',
                            variant: 'destructive',
                          });
                          e.target.value = '';
                          setUploadedVideoFile(null);
                        } finally {
                          setIsUploadingVideo(false);
                        }
                      }}
                      disabled={isUploadingVideo}
                    />
                    {isUploadingVideo && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span>업로드 중...</span>
                      </div>
                    )}
                    {uploadedVideoFile && !isUploadingVideo && videoUrl && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="h-4 w-4" />
                        <span>{uploadedVideoFile.name} ({Math.round(uploadedVideoFile.size / 1024 / 1024)}MB)</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4, MOV, AVI, MKV, WebM 형식 지원 (최대 500MB)
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="videoDuration">동영상 길이 (초) *</Label>
                <Input
                  id="videoDuration"
                  type="number"
                  value={videoDuration || ''}
                  onChange={(e) => setVideoDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="예: 300 (5분)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  동영상의 총 길이를 초 단위로 입력하세요
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>퀴즈 문제</Label>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddQuizQuestion}>
                    <Plus className="h-4 w-4 mr-2" />문제 추가
                  </Button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {quizQuestions.map((question, qIndex) => (
                    <Card key={qIndex}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">문제 {qIndex + 1}</Label>
                        <Button
                          type="button"
                          variant="icon"
                          size="icon-sm"
                          onClick={() => handleRemoveQuizQuestion(qIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex items-center gap-2">
                        <Label className="text-sm min-w-fit">문제 유형:</Label>
                        <Select
                            value={question.questionType || 'OBJECTIVE'}
                            onValueChange={(value) => handleUpdateQuizQuestion(qIndex, 'questionType', value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OBJECTIVE">객관식</SelectItem>
                              <SelectItem value="SUBJECTIVE">주관식</SelectItem>
                            </SelectContent>
                          </Select>
                      </div>
                      <Input
                        value={question.question}
                        onChange={(e) => handleUpdateQuizQuestion(qIndex, 'question', e.target.value)}
                        placeholder="질문을 입력하세요"
                      />
                      {question.questionType === 'OBJECTIVE' && (
                        <div className="space-y-2">
                          <Label>선택지</Label>
                          {(question.options || []).map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const updated = [...(question.options || [])];
                                  updated[oIndex] = e.target.value;
                                  handleUpdateQuizQuestion(qIndex, 'options', updated);
                                }}
                                placeholder={`선택지 ${oIndex + 1}`}
                                className={cn(
                                  question.correctAnswerIndex === oIndex && "border-figma-green-60 bg-figma-green-00/30"
                                )}
                              />
                              <Button
                                type="button"
                                variant={question.correctAnswerIndex === oIndex ? "primary" : "secondary"}
                                size="sm"
                                onClick={() => handleUpdateQuizQuestion(qIndex, 'correctAnswerIndex', oIndex)}
                              >
                                정답
                              </Button>
                              {(question.options || []).length > 2 && (
                                <Button
                                  type="button"
                                  variant="icon"
                                  size="icon-sm"
                                  onClick={() => handleRemoveQuizOption(qIndex, oIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAddQuizOption(qIndex)}
                          >
                            <Plus className="h-4 w-4 mr-2" />선택지 추가
                          </Button>
                        </div>
                      )}
                      {question.questionType === 'SUBJECTIVE' && (
                        <div className="space-y-2">
                          <div>
                            <Label>정답 텍스트 (선택사항)</Label>
                            <Input
                              value={question.correctAnswerText || ''}
                              onChange={(e) => handleUpdateQuizQuestion(qIndex, 'correctAnswerText', e.target.value)}
                              placeholder="예시 정답을 입력하세요"
                            />
                          </div>
                          <div>
                            <Label>답변 가이드라인 (선택사항)</Label>
                            <Textarea
                              value={question.answerGuide || ''}
                              onChange={(e) => handleUpdateQuizQuestion(qIndex, 'answerGuide', e.target.value)}
                              placeholder="답변 작성 시 참고할 가이드라인을 입력하세요"
                              rows={3}
                            />
                          </div>
                        </div>
                      )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Type C: File Upload */}
          {contentType === 'C' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>파일 업로드 요구사항 *</Label>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddRequiredFile}>
                    <Plus className="h-4 w-4 mr-2" />요구사항 추가
                  </Button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {requiredFiles.map((file, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">파일 요구사항 {index + 1}</span>
                          {requiredFiles.length > 1 && (
                            <Button
                              type="button"
                              variant="icon"
                              size="icon-sm"
                              onClick={() => handleRemoveRequiredFile(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div>
                          <Label htmlFor={`file-placeholder-${index}`}>설명 (플레이스홀더) *</Label>
                          <Input
                            id={`file-placeholder-${index}`}
                            value={file.placeholder}
                            onChange={(e) => handleUpdateRequiredFile(index, 'placeholder', e.target.value)}
                            placeholder="예: 프로젝트 소스 코드를 업로드해주세요"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`file-hint-${index}`}>파일명 힌트</Label>
                          <Input
                            id={`file-hint-${index}`}
                            value={file.fileNameHint || ''}
                            onChange={(e) => handleUpdateRequiredFile(index, 'fileNameHint', e.target.value)}
                            placeholder="예: project-source"
                          />
                          <p className="text-xs text-muted-foreground">강사가 업로드하는 파일의 이름 가이드</p>
                        </div>
                        <div>
                          <Label htmlFor={`file-extensions-${index}`}>허용 확장자</Label>
                          <Input
                            id={`file-extensions-${index}`}
                            value={allowedExtensionsStrings[index] ?? (file.allowedExtensions?.join(', ') || '')}
                            onChange={(e) => handleAllowedExtensionsChange(index, e.target.value)}
                            placeholder="예: .zip, .tar.gz, .rar"
                          />
                          <p className="text-xs text-muted-foreground">쉼표로 구분하여 입력 (예: .pdf, .docx, .zip)</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`file-required-${index}`}
                            checked={file.required !== false}
                            onChange={(e) => handleUpdateRequiredFile(index, 'required', e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor={`file-required-${index}`} className="font-normal cursor-pointer">
                            필수 파일
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Type D: Checklist */}
          {contentType === 'D' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>체크리스트 항목 *</Label>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddChecklistItem}>
                    <Plus className="h-4 w-4 mr-2" />항목 추가
                  </Button>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {checklistItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) => handleUpdateChecklistItem(index, e.target.value)}
                        placeholder="체크리스트 항목"
                      />
                      <Button
                        type="button"
                        variant="icon"
                        size="icon-sm"
                        onClick={() => handleRemoveChecklistItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={handleClose} disabled={isCreating}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {module ? '수정 중...' : '생성 중...'}
                </>
              ) : (
                module ? '모듈 수정' : '모듈 생성'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

