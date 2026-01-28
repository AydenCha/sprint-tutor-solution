import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { InstructorResponse, StepResponse, TaskResponse } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check, Clock, AlertTriangle,
  FileText, Video, Upload, CheckSquare, ChevronRight,
  Phone, Mail, Calendar, Shield, Loader2, Edit, Download
} from 'lucide-react';
import { PMNavigationHeader } from '@/components/PMNavigationHeader';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function PMInstructorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [instructor, setInstructor] = useState<InstructorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInstructorData();
  }, [id]);

  const fetchInstructorData = async () => {
    try {
      setIsLoading(true);
      const data = await api.instructor.getById(Number(id));
      setInstructor(data);
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '강사 정보를 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (fileId: number, fileName: string) => {
    try {
      console.log('Downloading file:', fileId, fileName);
      const blob = await api.file.download(fileId);
      console.log('File downloaded, blob size:', blob.size);

      if (!blob || blob.size === 0) {
        throw new Error('다운로드된 파일이 비어있습니다.');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: '다운로드 완료',
        description: `${fileName} 파일이 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error('File download failed:', error);
      const errorMessage = error instanceof Error ? error.message : '파일 다운로드에 실패했습니다.';
      toast({
        title: '다운로드 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">로딩 중...</span>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">강사를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-step-completed text-primary-foreground">완료</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-step-in-progress text-primary-foreground">진행 중</Badge>;
      default:
        return <Badge variant="secondary">대기 중</Badge>;
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'A': return <FileText className="h-4 w-4" />;
      case 'B': return <Video className="h-4 w-4" />;
      case 'C': return <Upload className="h-4 w-4" />;
      case 'D': return <CheckSquare className="h-4 w-4" />;
    }
  };

  const getContentTypeLabel = (contentType: string) => {
    switch (contentType) {
      case 'A': return '문서+퀴즈';
      case 'B': return '영상+퀴즈';
      case 'C': return '파일 업로드';
      case 'D': return '체크리스트';
    }
  };

  const totalTasks = instructor.steps?.reduce((sum, step) => sum + (step.tasks?.length || 0), 0) || 0;
  const completedTasks = instructor.steps?.reduce((sum, step) =>
    sum + (step.tasks?.filter(t => t.status === 'COMPLETED').length || 0), 0) || 0;

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 max-w-[1600px]">
      <PMNavigationHeader
        title={`강사 상세: ${instructor.name}`}
        description={instructor.email}
      >
        <Button
          variant="secondary"
          size="md"
          onClick={() => navigate(`/pm/instructor/${id}/edit`)}
          className="ml-auto"
        >
          <Edit className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">정보 수정</span>
          <span className="sm:hidden">수정</span>
        </Button>
      </PMNavigationHeader>
        {/* Instructor Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
            <div className="w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">{instructor.name}</h1>
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="break-all">{instructor.email}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  {instructor.phone}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  시작일: {new Date(instructor.startDate).toLocaleDateString()}
                </div>
                {instructor.accessCode && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    {instructor.accessCode}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
              <Badge variant="outline" className="text-xs sm:text-sm lg:text-base px-2 sm:px-3 py-0.5 sm:py-1">
                {instructor.track} · {instructor.cohort}
              </Badge>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 lg:p-6 bg-card rounded-lg sm:rounded-xl border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">전체 진행률</span>
                <span className="text-xl sm:text-2xl font-bold text-foreground">{instructor.overallProgress}%</span>
              </div>
              <Progress value={instructor.overallProgress} className="h-2" />
            </div>

            <div className="p-4 sm:p-5 lg:p-6 bg-card rounded-lg sm:rounded-xl border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">현재 단계</span>
                <span className="text-xl sm:text-2xl font-bold text-foreground">{instructor.currentStep}</span>
              </div>
              <p className="text-xs text-muted-foreground">전체 {instructor.steps?.length || 0}단계 중</p>
            </div>

            <div className="p-4 sm:p-5 lg:p-6 bg-card rounded-lg sm:rounded-xl border sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">완료된 작업</span>
                <span className="text-xl sm:text-2xl font-bold text-foreground">{completedTasks}/{totalTasks}</span>
              </div>
              <Progress value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0} className="h-2" />
            </div>
          </div>
        </div>

        {/* Steps & Tasks */}
        <Tabs defaultValue="steps" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="steps" className="text-xs sm:text-sm">단계 개요</TabsTrigger>
            <TabsTrigger value="details" className="text-xs sm:text-sm">단계 상세</TabsTrigger>
          </TabsList>

          <TabsContent value="steps" className="space-y-3 sm:space-y-4">
            {instructor.steps && instructor.steps.length > 0 ? (
              instructor.steps.map((step: StepResponse) => {
                const stepCompletedTasks = step.tasks?.filter(t => t.status === 'COMPLETED').length || 0;
                const stepTotalTasks = step.tasks?.length || 0;
                const stepProgress = stepTotalTasks > 0 ? (stepCompletedTasks / stepTotalTasks) * 100 : 0;

                return (
                  <div
                    key={step.id}
                    className="p-4 sm:p-5 lg:p-6 bg-card rounded-lg sm:rounded-xl border hover:shadow-figma-01 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1">
                        <span className="text-2xl sm:text-3xl flex-shrink-0">{step.emoji || '📚'}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-semibold text-foreground break-words">
                            Step {step.stepNumber}. {step.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{step.description}</p>
                        </div>
                      </div>
                      {getStatusBadge(step.status)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">진행률</span>
                        <span className="font-medium">{stepCompletedTasks}/{stepTotalTasks} 작업</span>
                      </div>
                      <Progress value={stepProgress} className="h-2" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 sm:py-12 text-xs sm:text-sm text-muted-foreground">
                사용 가능한 단계가 없습니다.
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4 sm:space-y-6">
            {instructor.steps && instructor.steps.length > 0 ? (
              instructor.steps.map((step: StepResponse) => (
                <div key={step.id} className="border rounded-lg sm:rounded-xl overflow-hidden">
                  <div className="p-3 sm:p-4 bg-muted/50 border-b">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{step.emoji || '📚'}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-semibold text-foreground break-words">
                          Step {step.stepNumber}. {step.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{step.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    {step.tasks && step.tasks.length > 0 ? (
                      step.tasks.map((task: TaskResponse) => (
                        <div
                          key={task.id}
                          className="p-3 sm:p-4 bg-card rounded-lg border"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm sm:text-base font-medium text-foreground">{task.title}</h4>
                              {getStatusBadge(task.status)}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">{task.description}</p>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                              {getContentTypeIcon(task.contentType)}
                              <span>{getContentTypeLabel(task.contentType)}</span>
                            </div>

                            {/* Show uploaded files for File Upload type tasks */}
                            {task.contentType === 'C' && task.uploadedFiles && task.uploadedFiles.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                {task.uploadedFiles.map((file) => (
                                  <Button
                                    key={file.id}
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => downloadFile(file.id, file.fileName)}
                                    className="gap-1 sm:gap-1.5 w-full sm:w-auto"
                                  >
                                    <Download className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate max-w-[120px] sm:max-w-none">{file.fileName}</span>
                                    <span className="text-muted-foreground flex-shrink-0">
                                      ({Math.round((file.fileSize || 0) / 1024)}KB)
                                    </span>
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">이 단계에 작업이 없습니다.</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 sm:py-12 text-xs sm:text-sm text-muted-foreground">
                단계 상세 정보를 사용할 수 없습니다.
              </div>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
