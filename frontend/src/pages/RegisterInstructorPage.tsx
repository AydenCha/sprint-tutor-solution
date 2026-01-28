import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, ChevronDown, ChevronUp, Check, Loader2, Save, Search, GripVertical, X, Plus, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import api, { StepDefinitionResponse, TrackResponse, StepModuleConfiguration, ModuleResponse } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { PMNavigationHeader } from '@/components/PMNavigationHeader';
import { ModulePreviewDialog } from '@/components/ModulePreviewDialog';

// Step Selection List Component with Toggle (Memoized for performance with large lists)
const StepSelectionList = React.memo(({ 
  definitions, 
  searchQuery, 
  selectedIds, 
  onToggle,
  onReorder,
  onStepClick
}: {
  definitions: StepDefinitionResponse[];
  searchQuery: string;
  selectedIds: number[];
  onToggle: (id: number) => void;
  onReorder: (ids: number[]) => void;
  onStepClick?: (id: number) => void;
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  const filteredDefinitions = useMemo(() => {
    if (!searchQuery.trim()) return definitions;
    const query = searchQuery.toLowerCase();
    return definitions.filter(def => 
      def.title.toLowerCase().includes(query) ||
      def.description?.toLowerCase().includes(query)
    );
  }, [definitions, searchQuery]);

  const selectedDefinitions = useMemo(() => {
    return selectedIds.map(id => definitions.find(d => d.id === id)).filter(Boolean) as StepDefinitionResponse[];
  }, [selectedIds, definitions]);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragOverItem = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      // 드래그 중인 아이템이 다른 아이템 위에 있을 때 시각적 피드백 제공
    }
  };

  const handleDrop = (dropIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setIsDragging(false);
      setDragStartPos(null);
      return;
    }

    const newOrder = [...selectedDefinitions];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    onReorder(newOrder.map(d => d.id));
    setDraggedIndex(null);
    setIsDragging(false);
    setDragStartPos(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = (stepId: number, e: React.MouseEvent) => {
    if (!dragStartPos) return;
    
    const deltaX = Math.abs(e.clientX - dragStartPos.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.y);
    const moved = deltaX > 5 || deltaY > 5; // 5px 이상 이동했으면 드래그로 간주
    
    if (!moved && !isDragging && onStepClick) {
      // 실제 클릭인 경우에만 onStepClick 호출
      onStepClick(stepId);
    }
    
    setDragStartPos(null);
  };

  return (
    <div className="space-y-4">
      {/* Selected Steps (in order) */}
      {selectedDefinitions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">선택된 스텝 (순서대로)</Label>
          {selectedDefinitions.map((def, index) => (
            <div
              key={def.id}
              draggable
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOverItem(index)}
              onDrop={handleDrop(index)}
              onDragEnd={() => {
                setDraggedIndex(null);
                setIsDragging(false);
                setDragStartPos(null);
              }}
              onMouseDown={handleMouseDown}
              onMouseUp={(e) => handleMouseUp(def.id, e)}
              className={cn(
                "flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg cursor-pointer",
                draggedIndex === index && "opacity-50",
                draggedIndex !== null && draggedIndex !== index && "border-dashed"
              )}
            >
              <GripVertical 
                className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => e.stopPropagation()}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {def.emoji && <span>{def.emoji}</span>}
                  <span className="font-medium">#{index + 1}. {def.title}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(def.id);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Available Steps with Toggle */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          사용 가능한 스텝 ({filteredDefinitions.length}개)
        </Label>
        {filteredDefinitions.map((def) => {
          const isSelected = selectedIds.includes(def.id);
          return (
            <Card
              key={def.id}
              className={cn(
                "transition-colors cursor-pointer",
                isSelected ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50"
              )}
              onClick={() => {
                if (isSelected && onStepClick) {
                  // 선택된 스텝: 클릭하면 모듈 선택 화면으로 이동
                  onStepClick(def.id);
                } else if (!isSelected) {
                  // 선택되지 않은 스텝: 클릭하면 토글
                  onToggle(def.id);
                }
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {def.emoji && <span className="text-lg">{def.emoji}</span>}
                  <div className="flex-1">
                    <div className="font-medium">{def.title}</div>
                    {def.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {def.description}
                      </div>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={isSelected}
                      onCheckedChange={() => onToggle(def.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
});

StepSelectionList.displayName = 'StepSelectionList';

export default function RegisterInstructorPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    track: '',
    cohort: '',
    startDate: '',
    instructorType: '', // 신입, 경력, 재계약
  });

  // Step selection: Step Definitions only
  const [selectedStepDefinitionIds, setSelectedStepDefinitionIds] = useState<number[]>([]);
  const [stepDefinitions, setStepDefinitions] = useState<StepDefinitionResponse[]>([]);
  const [stepModules, setStepModules] = useState<Record<number, number[]>>({}); // stepId -> enabled module IDs
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null); // 현재 선택된 Step ID
  const [allModules, setAllModules] = useState<ModuleResponse[]>([]);
  const [stepSearchQuery, setStepSearchQuery] = useState('');
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasRestored, setHasRestored] = useState(false);
  const [isPreviewModuleDialogOpen, setIsPreviewModuleDialogOpen] = useState(false);
  const [previewModule, setPreviewModule] = useState<ModuleResponse | null>(null);

  // Fetch step definitions, modules, and tracks on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [definitionsData, modulesData, tracksData] = await Promise.all([
          api.stepDefinition.getAll(),
          api.module.getAll(),
          api.track.getAll(),
        ]);
        setStepDefinitions(definitionsData);
        setAllModules(modulesData);
        // Only show enabled tracks
        const enabledTracks = tracksData.filter(track => track.enabled);
        setTracks(enabledTracks);
        
        // 디버깅: 모듈 데이터 확인
        console.log('Loaded modules:', modulesData);
        console.log('Module count:', modulesData.length);
        console.log('Module IDs:', modulesData.map(m => m.id));
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: '데이터 로드 실패',
          description: error instanceof Error ? error.message : '데이터를 불러올 수 없습니다.',
          variant: 'destructive',
        });
      }
    };
    fetchData();
  }, []);

  // 변경사항 추적 (최소한 하나의 필드라도 입력되었는지 확인)
  const hasChanges = !!(
    formData.name || 
    formData.email || 
    formData.phone || 
    formData.track || 
    formData.cohort || 
    formData.startDate || 
    formData.instructorType ||
    selectedStepDefinitionIds.length > 0
  );

  // 페이지 이탈 방지
  const { createSafeNavigate } = useUnsavedChanges({
    hasUnsavedChanges: hasChanges && !isLoading,
    message: '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?',
  });

  const safeNavigate = createSafeNavigate(navigate);

  // 자동 저장 설정
  const autoSaveData = {
    formData,
    selectedStepDefinitionIds,
    stepModules,
  };

  const { restore, clear, getLastSavedTime } = useAutoSave(
    autoSaveData,
    'instructor-registration',
    {
      debounceMs: 2000,
      validate: (data) => {
        // 최소한 이름이나 이메일이 입력되어 있을 때만 저장
        return !!(data?.formData?.name || data?.formData?.email);
      },
    }
  );

  // 페이지 로드 시 복원
  useEffect(() => {
    if (hasRestored) return;

    const saved = restore();
    if (saved) {
      const lastSaved = getLastSavedTime();
      const timeAgo = lastSaved 
        ? Math.floor((Date.now() - lastSaved.getTime()) / 1000 / 60) 
        : null;

      if (timeAgo !== null && timeAgo < 60) {
        // 1시간 이내 저장된 데이터만 복원 제안
        const message = timeAgo < 1 
          ? '방금 전에 작성하던 내용이 있습니다. 복원하시겠습니까?'
          : `${timeAgo}분 전에 작성하던 내용이 있습니다. 복원하시겠습니까?`;
        
        if (window.confirm(message)) {
          setFormData(saved.formData || formData);
          setSelectedStepDefinitionIds(saved.selectedStepDefinitionIds || []);
          setStepModules(saved.stepModules || {});
          toast({
            title: '작성 내용 복원됨',
            description: '이전에 작성하던 내용을 불러왔습니다.',
          });
        } else {
          // 복원하지 않으면 삭제
          clear();
        }
      }
      setHasRestored(true);
    } else {
      setHasRestored(true);
    }
  }, [hasRestored, restore, clear, getLastSavedTime]);

  const [tracks, setTracks] = useState<TrackResponse[]>([]);
  const instructorTypes = [
    { value: '신입', label: '🐣 신입', description: '강의 경력 없음' },
    { value: '경력', label: '😎 경력', description: '타 기관 경험 있음' },
    { value: '재계약', label: '🤝 재계약', description: '코드잇 경험 있음' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 실시간 유효성 검사 (간단한 검증만)
    // 상세 검증은 제출 시 validateForm에서 수행
  };

  // Get module information based on instructor type and timing
  const getModuleInfo = (instructorType: string, timingVariable: string) => {
    const modules: Record<string, Record<string, { name: string; description: string }>> = {
      '신입': {
        '여유': { name: '육성형 (모듈 A)', description: '모든 항목을 꼼꼼히 검증하여 코드잇 강사로 육성' },
        '긴급': { name: '생존형 (모듈 B)', description: '행정 사고 방지와 첫 주 수업 진행에 집중' },
      },
      '경력': {
        '여유': { name: '얼라인형 (모듈 C)', description: '타 기관 습관을 버리고 코드잇의 톤앤매너를 입힘' },
        '긴급': { name: '속성 적응형 (모듈 D)', description: '강의력은 신뢰하되, 규정 리스크만 확실히 차단' },
      },
      '재계약': {
        '여유': { name: '업데이트형 (모듈 E)', description: '변경된 사항만 체크하고, 비전을 다시 공유' },
        '긴급': { name: '최소 확인형 (모듈 F)', description: '계약 및 필수 행정 절차만 빠르게 완료' },
      },
    };
    return modules[instructorType]?.[timingVariable] || { name: '표준 모듈', description: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.track || !formData.cohort || !formData.startDate) {
      toast({
        title: '필수 정보를 입력해주세요',
        description: '모든 필수 항목을 입력해주세요',
        variant: 'destructive',
      });
      return;
    }

    // Validate step selection
    if (selectedStepDefinitionIds.length === 0) {
      toast({
        title: '최소 1개 이상의 스텝을 선택해주세요',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Calculate days until start date to show timing variable
      const startDate = new Date(formData.startDate);
      const today = new Date();
      const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const timingVariable = daysUntilStart >= 14 ? '여유' : '긴급';
      
      // Build step configurations with module toggles
      const stepConfigurations: StepModuleConfiguration[] = selectedStepDefinitionIds.map(stepId => {
        // 기본값: 모든 모듈이 on (기본값으로 설정)
        const enabledModuleIds = stepModules[stepId] || allModules.map(m => m.id);
        console.log(`Step ${stepId}: enabledModuleIds =`, enabledModuleIds, `(from stepModules: ${stepModules[stepId] ? 'yes' : 'no'}, allModules count: ${allModules.length})`);
        return {
          stepId,
          enabledModuleIds,
        };
      });

      console.log('Submitting stepConfigurations:', stepConfigurations);
      console.log('Total modules available:', allModules.length);

      const response = await api.instructor.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        track: formData.track,
        cohort: formData.cohort,
        startDate: formData.startDate,
        // instructorType은 보내지 않음 (nullable)
        stepConfigurations,
      });

      toast({
        title: '강사 등록 완료',
        description: `접속 코드: ${response.accessCode}`,
      });

      // 저장 성공 후 임시 저장 삭제
      clear();

      // 저장 성공 후에는 차단하지 않고 이동
      navigate('/pm/dashboard');
    } catch (error) {
      toast({
        title: '등록 실패',
        description: error instanceof Error ? error.message : '강사 등록에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <PMNavigationHeader
        title="강사 등록"
        description="새로운 강사를 등록하고 온보딩 과정을 설정합니다."
        backTo="/pm/dashboard"
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">신규 강사 등록</h1>
              <p className="text-muted-foreground">온보딩을 시작할 강사 정보를 입력하세요</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-4 p-6 bg-card rounded-xl border">
            <h2 className="text-lg font-semibold text-foreground">기본 정보</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="instructor@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  placeholder="010-1234-5678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">강의 시작일 *</Label>
                <div className="relative">
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="track">트랙 *</Label>
                <div className="relative">
                  <select
                    id="track"
                    value={formData.track}
                    onChange={(e) => handleInputChange('track', e.target.value)}
                    className={cn(
                      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "appearance-none cursor-pointer",
                      !formData.track && "text-muted-foreground"
                    )}
                  >
                    <option value="" disabled>트랙 선택</option>
                    {tracks.map(track => (
                      <option key={track.id} value={track.name}>{track.koreanName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                </div>
              </div>

              {/* 강사 유형 필드는 당분간 숨김 처리 */}
              {false && (
                <div className="space-y-2">
                  <Label htmlFor="instructorType">강사 유형 *</Label>
                  <div className="relative">
                    <select
                      id="instructorType"
                      value={formData.instructorType}
                      onChange={(e) => handleInputChange('instructorType', e.target.value)}
                      className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "appearance-none cursor-pointer",
                        !formData.instructorType && "text-muted-foreground"
                      )}
                    >
                      <option value="" disabled>강사 유형 선택</option>
                      {instructorTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label} - {type.description}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    강사 유형과 강의 시작일을 기준으로 온보딩 모듈이 자동 선택됩니다
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cohort">기수 *</Label>
                <Input
                  id="cohort"
                  placeholder="예: 1기, 2기, 3기 등"
                  value={formData.cohort}
                  onChange={(e) => handleInputChange('cohort', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  기수를 직접 입력해주세요 (예: 1기, 2기, 3기 등)
                </p>
              </div>
            </div>
          </div>

          {/* Module Preview - 당분간 숨김 처리 */}
          {false && formData.instructorType && formData.startDate && (
            <div className="space-y-4 p-6 bg-primary/5 rounded-xl border-2 border-primary/20">
              <h2 className="text-lg font-semibold text-foreground">온보딩 모듈 미리보기</h2>
              {(() => {
                const startDate = new Date(formData.startDate);
                const today = new Date();
                const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const timingVariable = daysUntilStart >= 14 ? '여유' : '긴급';
                const moduleInfo = getModuleInfo(formData.instructorType, timingVariable);
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">선택된 모듈:</span>
                      <span className="text-sm font-bold text-primary">{moduleInfo.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{moduleInfo.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>강사 유형: {formData.instructorType}</span>
                      <span>•</span>
                      <span>투입 시점: {timingVariable} ({daysUntilStart >= 0 ? `D-${daysUntilStart}` : '과거 날짜'})</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Step Selection and Module Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Step Selection */}
            <div className="space-y-4 p-6 bg-card rounded-xl border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">온보딩 스텝 선택</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                스텝을 선택하여 순서를 지정하고, 우측에서 모듈을 활성화/비활성화할 수 있습니다.
              </p>

              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label>스텝 선택 (드래그하여 순서 변경)</Label>
                  <span className="text-sm text-muted-foreground">
                    {selectedStepDefinitionIds.length}개 선택됨
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="스텝 검색..."
                    value={stepSearchQuery}
                    onChange={(e) => setStepSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <ScrollArea className="h-[500px] border rounded-lg p-4">
                  <StepSelectionList
                    definitions={stepDefinitions}
                    searchQuery={stepSearchQuery}
                    selectedIds={selectedStepDefinitionIds}
                    onToggle={(id) => {
                      const isCurrentlySelected = selectedStepDefinitionIds.includes(id);
                      setSelectedStepDefinitionIds(prev => 
                        isCurrentlySelected
                          ? prev.filter(i => i !== id)
                          : [...prev, id]
                      );
                      // Step 제거 시 모듈 설정도 제거
                      if (isCurrentlySelected) {
                        setStepModules(prev => {
                          const newModules = { ...prev };
                          delete newModules[id];
                          return newModules;
                        });
                        // 선택된 Step이 제거되면 우측 모듈 리스트도 초기화
                        if (selectedStepId === id) {
                          setSelectedStepId(null);
                        }
                      } else {
                        // Step 추가 시 모든 모듈을 기본값으로 활성화 (기본값: on)
                        const allModuleIds = allModules.map(m => m.id);
                        console.log(`Step ${id} added: Initializing with ${allModuleIds.length} modules:`, allModuleIds);
                        setStepModules(prev => ({
                          ...prev,
                          [id]: allModuleIds, // 모든 모듈 ID를 기본값으로 설정
                        }));
                        // Step 추가 시 우측에 모듈 리스트 표시
                        setSelectedStepId(id);
                      }
                    }}
                    onStepClick={(id) => {
                      // Step 카드 클릭 시 해당 Step의 모듈을 우측에 표시
                      setSelectedStepId(id);
                    }}
                    onReorder={(ids) => setSelectedStepDefinitionIds(ids)}
                  />
                </ScrollArea>
              </div>
            </div>

            {/* Right: Module Configuration for Selected Step */}
            <div className="space-y-4 p-6 bg-card rounded-xl border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">모듈 설정</h2>
              </div>
              {selectedStepId ? (() => {
                const step = stepDefinitions.find(s => s.id === selectedStepId);
                if (!step) return null;

                // 선택된 Step에 귀속된 모듈만 표시
                const modulesForStep = allModules.filter(m => m.stepDefinitionId === selectedStepId);
                const moduleIdsForStep = modulesForStep.map(m => m.id);
                
                // 기본값: 선택된 Step에 귀속된 모듈만 ON
                const defaultModulesForStep = moduleIdsForStep;
                const rawEnabledModuleIds = stepModules[selectedStepId] || defaultModulesForStep;
                
                // 활성화된 모듈 중에서 선택된 스텝에 귀속된 모듈만 필터링
                const enabledModuleIds = rawEnabledModuleIds.filter(id => moduleIdsForStep.includes(id));

                // Filter modules based on search query (선택된 스텝의 모듈 내에서만 검색)
                const filteredModules = modulesForStep.filter((module) => {
                  if (!moduleSearchQuery) return true;
                  const query = moduleSearchQuery.toLowerCase();
                  return (
                    module.name.toLowerCase().includes(query) ||
                    module.description?.toLowerCase().includes(query) ||
                    module.contentType.toLowerCase().includes(query)
                  );
                });

                return (
                  <>
                    <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 rounded-lg">
                      {step.emoji && <span className="text-xl">{step.emoji}</span>}
                      <div className="flex-1">
                        <div className="font-medium">{step.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {enabledModuleIds.length} / {modulesForStep.length} 모듈 활성화
                        </div>
                      </div>
                    </div>

                    {/* Module Search Input */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="모듈 검색 (이름, 설명, 타입)"
                        value={moduleSearchQuery}
                        onChange={(e) => setModuleSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <ScrollArea className="h-[500px] border rounded-lg p-4">
                      <div className="space-y-2">
                        {modulesForStep.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            이 스텝에 귀속된 모듈이 없습니다.
                          </div>
                        ) : filteredModules.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            검색 결과가 없습니다.
                          </div>
                        ) : (
                          filteredModules.map((module) => {
                            const isEnabled = enabledModuleIds.includes(module.id);
                            
                            const toggleModule = () => {
                              setStepModules(prev => {
                                // 기본값: 선택된 Step에 귀속된 모듈만 ON
                                const defaultModulesForStep = moduleIdsForStep;
                                const current = prev[selectedStepId] || defaultModulesForStep;
                                // 현재 활성화된 모듈 중에서 선택된 스텝에 귀속된 모듈만 유지
                                const currentForStep = current.filter(id => moduleIdsForStep.includes(id));
                                const newEnabled = isEnabled
                                  ? currentForStep.filter(id => id !== module.id)
                                  : [...currentForStep, module.id].filter((id, idx, arr) => arr.indexOf(id) === idx); // 중복 제거
                                return {
                                  ...prev,
                                  [selectedStepId]: newEnabled,
                                };
                              });
                            };
                            
                            return (
                              <div
                                key={module.id}
                                onClick={toggleModule}
                                className={cn(
                                  "flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
                                  isEnabled && "bg-primary/5 border-primary/20"
                                )}
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{module.name}</div>
                                  <div className="text-xs text-muted-foreground">{module.contentType}</div>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setPreviewModule(module);
                                      setIsPreviewModuleDialogOpen(true);
                                    }}
                                    title="미리보기"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={toggleModule}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </>
                );
              })() : (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-sm">왼쪽에서 Step을 선택하면</p>
                  <p className="text-sm">해당 Step의 모듈 목록이 표시됩니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => safeNavigate('/pm/dashboard')}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />등록 중...</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" />강사 등록하기</>
              )}
            </Button>
          </div>
        </form>
      </main>

      {/* Module Preview Dialog */}
      <ModulePreviewDialog
        open={isPreviewModuleDialogOpen}
        onOpenChange={setIsPreviewModuleDialogOpen}
        module={previewModule}
      />
    </div>
  );
}
