import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Save, Search, GripVertical, X, Plus, Check } from 'lucide-react';
import { PMNavigationHeader } from '@/components/PMNavigationHeader';
import api, { StepDefinitionResponse, InstructorResponse, StepModuleConfiguration, ModuleResponse } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Step Selection List Component
const StepSelectionList = React.memo(({ 
  definitions, 
  searchQuery, 
  selectedIds, 
  onToggle,
  onReorder 
}: {
  definitions: StepDefinitionResponse[];
  searchQuery: string;
  selectedIds: number[];
  onToggle: (id: number) => void;
  onReorder: (ids: number[]) => void;
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (dropIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newOrder = [...selectedDefinitions];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    onReorder(newOrder.map(d => d.id));
    setDraggedIndex(null);
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
              onDragOver={handleDragOver}
              onDrop={handleDrop(index)}
              className={cn(
                "flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg cursor-move",
                draggedIndex === index && "opacity-50"
              )}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {def.emoji && <span>{def.emoji}</span>}
                  <span className="font-medium">#{index + 1}. {def.title}</span>
                </div>
              </div>
              <Button
                variant="tertiary"
                size="icon"
                className="h-6 w-6"
                onClick={() => onToggle(def.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Available Steps */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">사용 가능한 스텝</Label>
        <ScrollArea className="h-[400px] border rounded-lg p-4">
          <div className="space-y-2">
            {filteredDefinitions
              .filter(def => !selectedIds.includes(def.id))
              .map(def => (
                <Card
                  key={def.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary",
                    selectedIds.includes(def.id) && "border-primary bg-primary/5"
                  )}
                  onClick={() => onToggle(def.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      {def.emoji && <span className="text-xl">{def.emoji}</span>}
                      <div className="flex-1">
                        <div className="font-medium">{def.title}</div>
                        {def.description && (
                          <div className="text-sm text-muted-foreground">{def.description}</div>
                        )}
                      </div>
                      {selectedIds.includes(def.id) && (
                        <div className="text-primary">
                          <Plus className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});

StepSelectionList.displayName = 'StepSelectionList';

export default function PMInstructorStepsEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [instructor, setInstructor] = useState<InstructorResponse | null>(null);
  const [stepDefinitions, setStepDefinitions] = useState<StepDefinitionResponse[]>([]);
  const [allModules, setAllModules] = useState<ModuleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleSearchQueries, setModuleSearchQueries] = useState<Record<number, string>>({}); // stepId -> search query

  const [selectedDefinitionIds, setSelectedDefinitionIds] = useState<number[]>([]);
  const [stepModules, setStepModules] = useState<Record<number, number[]>>({}); // stepId -> enabled module IDs

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [instructorData, definitionsData, modulesData] = await Promise.all([
        api.instructor.getById(Number(id)),
        api.stepDefinition.getAll(),
        api.module.getAll(),
      ]);
      setInstructor(instructorData);
      setStepDefinitions(definitionsData);
      setAllModules(modulesData);
      
      // Load existing steps and modules from instructor
      if (instructorData.steps) {
        // Use stepDefinitionId (template ID) instead of step.id (onboarding step instance ID)
        const stepDefIds = instructorData.steps
          .map(s => s.stepDefinitionId)
          .filter((id): id is number => id !== undefined);
        setSelectedDefinitionIds(stepDefIds);

        // Initialize step modules from existing tasks, keyed by stepDefinitionId
        const modulesByStep: Record<number, number[]> = {};
        instructorData.steps.forEach(step => {
          if (step.stepDefinitionId) {
            if (step.tasks && step.tasks.length > 0) {
              // Step에 tasks가 있으면 enabled된 모듈들 사용
              const enabledModuleIds = step.tasks
                .filter(task => task.isEnabled !== false)
                .map(task => task.moduleId)
                .filter((id): id is number => id !== undefined);
              modulesByStep[step.stepDefinitionId] = enabledModuleIds;
            } else {
              // Step에 tasks가 없으면 defaultModuleIds 사용
              const stepDef = stepDefinitions.find(s => s.id === step.stepDefinitionId);
              if (stepDef?.defaultModuleIds && stepDef.defaultModuleIds.length > 0) {
                modulesByStep[step.stepDefinitionId] = [...stepDef.defaultModuleIds];
              } else {
                // defaultModuleIds도 없으면 빈 배열 (나중에 전체 모듈로 처리됨)
                modulesByStep[step.stepDefinitionId] = [];
              }
            }
          }
        });
        setStepModules(modulesByStep);
      }
    } catch (error) {
      toast({
        title: '데이터 로드 실패',
        description: error instanceof Error ? error.message : '데이터를 불러올 수 없습니다.',
        variant: 'destructive',
      });
      navigate('/pm/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDefinition = (definitionId: number) => {
    setSelectedDefinitionIds(prev => {
      if (prev.includes(definitionId)) {
        // Step 제거 시 모듈 설정도 제거
        setStepModules(prevModules => {
          const newModules = { ...prevModules };
          delete newModules[definitionId];
          return newModules;
        });
        return prev.filter(id => id !== definitionId);
      } else {
        // Step 추가 시 기본 모듈 활성화
        const step = stepDefinitions.find(s => s.id === definitionId);
        if (step?.defaultModuleIds) {
          setStepModules(prev => ({
            ...prev,
            [definitionId]: [...step.defaultModuleIds!],
          }));
        }
        return [...prev, definitionId];
      }
    });
  };

  const handleReorderDefinitions = (newOrder: number[]) => {
    setSelectedDefinitionIds(newOrder);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedDefinitionIds.length === 0) {
      toast({
        title: '선택 오류',
        description: '최소 1개 이상의 Step을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Build step configurations with module toggles
      const stepConfigurations: StepModuleConfiguration[] = selectedDefinitionIds.map(stepId => {
        const step = stepDefinitions.find(s => s.id === stepId);
        // UI와 동일한 로직: stepModules[stepId] -> defaultModuleIds -> allModules
        const currentModules = stepModules[stepId];
        let enabledModuleIds: number[];

        if (currentModules !== undefined) {
          // stepModules에 명시적으로 설정된 값이 있으면 사용 (빈 배열이라도)
          enabledModuleIds = currentModules;
        } else if (step?.defaultModuleIds && step.defaultModuleIds.length > 0) {
          // defaultModuleIds가 있으면 사용
          enabledModuleIds = step.defaultModuleIds;
        } else {
          // 둘 다 없으면 모든 모듈 사용 (UI와 동일)
          enabledModuleIds = allModules.map(m => m.id);
        }

        return {
          stepId,
          enabledModuleIds,
        };
      });

      // Validate that all step configurations have at least one module
      const invalidSteps = stepConfigurations.filter(config => !config.enabledModuleIds || config.enabledModuleIds.length === 0);
      if (invalidSteps.length > 0) {
        toast({
          title: '설정 오류',
          description: '모든 Step에 최소 1개 이상의 모듈이 활성화되어 있어야 합니다.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Updating steps with configurations:', stepConfigurations);
      const response = await api.instructor.updateSteps(Number(id), {
        stepConfigurations,
      });
      console.log('Update response:', response);
      toast({
        title: '수정 완료',
        description: '강사의 온보딩 단계가 성공적으로 수정되었습니다.',
      });
      navigate(`/pm/instructor/${id}`);
    } catch (error) {
      console.error('Failed to update steps:', error);
      const errorMessage = error instanceof Error ? error.message : '단계 수정에 실패했습니다.';
      toast({
        title: '수정 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
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

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 max-w-[1600px]">
      <PMNavigationHeader
        title={`${instructor.name} 강사 온보딩 단계 수정`}
        description="강사의 온보딩 단계와 모듈을 설정합니다"
        backTo={`/pm/instructor/${id}`}
        backLabel="상세 페이지로 돌아가기"
      />

      <main className="w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">온보딩 단계 수정</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{instructor.name} 강사의 온보딩 단계를 수정합니다.</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-destructive">
            ⚠️ 주의: 기존 단계와 진행 상황이 모두 삭제되고 새로운 단계로 교체됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <Card>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="mb-4">
                <Label className="text-base font-semibold mb-2 block">Step 검색</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Step 제목 또는 설명으로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md"
                  />
                </div>
              </div>
              <StepSelectionList
                definitions={stepDefinitions}
                searchQuery={searchQuery}
                selectedIds={selectedDefinitionIds}
                onToggle={handleToggleDefinition}
                onReorder={handleReorderDefinitions}
              />
            </CardContent>
          </Card>

          {/* Module Toggle for Selected Steps */}
          {selectedDefinitionIds.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-md font-semibold text-foreground mb-4">Step별 모듈 설정</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  각 Step에 부여된 모듈을 토글하여 강사에게 제공할 과정을 선택하세요.
                </p>
                <div className="space-y-4">
                  {selectedDefinitionIds.map((stepId) => {
                    const step = stepDefinitions.find(s => s.id === stepId);
                    if (!step) return null;

                    // Use allModules if defaultModuleIds is empty (for steps without assigned modules)
                    const stepModuleIds = step.defaultModuleIds && step.defaultModuleIds.length > 0 
                      ? step.defaultModuleIds 
                      : allModules.map(m => m.id);
                    const enabledModuleIds = stepModules[stepId] || (step.defaultModuleIds && step.defaultModuleIds.length > 0 ? step.defaultModuleIds : allModules.map(m => m.id));
                    const moduleSearchQuery = moduleSearchQueries[stepId] || '';

                    // Filter modules based on search query
                    const filteredModuleIds = stepModuleIds.filter((moduleId) => {
                      if (!moduleSearchQuery) return true;
                      const module = allModules.find(m => m.id === moduleId);
                      if (!module) return false;
                      const query = moduleSearchQuery.toLowerCase();
                      return (
                        module.name.toLowerCase().includes(query) ||
                        module.description?.toLowerCase().includes(query) ||
                        module.contentType.toLowerCase().includes(query)
                      );
                    });

                    return (
                      <Card key={stepId} className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          {step.emoji && <span className="text-xl">{step.emoji}</span>}
                          <div className="flex-1">
                            <div className="font-medium">{step.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {enabledModuleIds.length} / {stepModuleIds.length} 모듈 활성화
                            </div>
                          </div>
                        </div>

                        {/* Module Search Input */}
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="모듈 검색 (이름, 설명, 타입)"
                            value={moduleSearchQuery}
                            onChange={(e) => setModuleSearchQueries(prev => ({
                              ...prev,
                              [stepId]: e.target.value
                            }))}
                            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          {filteredModuleIds.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              {moduleSearchQuery ? '검색 결과가 없습니다' : '모듈이 없습니다'}
                            </div>
                          ) : (
                            filteredModuleIds.map((moduleId) => {
                            const module = allModules.find(m => m.id === moduleId);
                            if (!module) return null;
                            
                            const isEnabled = enabledModuleIds.includes(moduleId);
                            
                            return (
                              <div
                                key={moduleId}
                                className="flex items-center justify-between p-2 border rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{module.name}</div>
                                  <div className="text-xs text-muted-foreground">{module.contentType}</div>
                                </div>
                                <Button
                                  type="button"
                                  variant={isEnabled ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    setStepModules(prev => {
                                      const current = prev[stepId] || stepModuleIds;
                                      const newEnabled = isEnabled
                                        ? current.filter(id => id !== moduleId)
                                        : [...current, moduleId];
                                      return {
                                        ...prev,
                                        [stepId]: newEnabled,
                                      };
                                    });
                                  }}
                                >
                                  {isEnabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                </Button>
                              </div>
                            );
                          })
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/pm/instructor/${id}`)}
              disabled={isSaving}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  저장
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

