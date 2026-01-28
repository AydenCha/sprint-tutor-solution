import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Eye, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api, { StepDefinitionResponse, ModuleResponse, StepDefinitionRequest } from '@/services/api';
import { cn } from '@/lib/utils';
import { CreateModuleDialog } from '@/components/CreateModuleDialog';
import { ModulePreviewDialog } from '@/components/ModulePreviewDialog';
import { PMNavigationHeader } from '@/components/PMNavigationHeader';

const PMStepManagementPage: React.FC = () => {
  const { toast } = useToast();
  const [stepDefinitions, setStepDefinitions] = useState<StepDefinitionResponse[]>([]);
  const [allModules, setAllModules] = useState<ModuleResponse[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search states
  const [stepSearchQuery, setStepSearchQuery] = useState('');
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');

  // Dialog states
  const [isCreateStepDialogOpen, setIsCreateStepDialogOpen] = useState(false);
  const [isEditStepDialogOpen, setIsEditStepDialogOpen] = useState(false);
  const [isDeleteStepDialogOpen, setIsDeleteStepDialogOpen] = useState(false);

  // Module management states
  const [isCreateModuleDialogOpen, setIsCreateModuleDialogOpen] = useState(false);
  const [isEditModuleDialogOpen, setIsEditModuleDialogOpen] = useState(false);
  const [isPreviewModuleDialogOpen, setIsPreviewModuleDialogOpen] = useState(false);
  const [isDeleteModuleDialogOpen, setIsDeleteModuleDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleResponse | null>(null);

  // Form states
  const [formData, setFormData] = useState<StepDefinitionRequest>({
    title: '',
    emoji: '',
    description: '',
    defaultDDay: undefined,
    stepType: undefined,
  });

  useEffect(() => {
    loadStepDefinitions();
    loadModules();
  }, []);

  const loadStepDefinitions = async () => {
    try {
      setIsLoading(true);
      const definitions = await api.stepDefinition.getAll();
      setStepDefinitions(definitions);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load step definitions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadModules = async () => {
    try {
      const modules = await api.module.getAll();
      setAllModules(modules);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load modules',
        variant: 'destructive',
      });
    }
  };

  const handleSelectStep = (stepId: number) => {
    setSelectedStepId(stepId);
  };

  // Step CRUD handlers
  const handleCreateStep = async () => {
    try {
      await api.stepDefinition.create(formData);
      toast({
        title: 'Success',
        description: '스텝이 생성되었습니다',
      });
      setIsCreateStepDialogOpen(false);
      resetForm();
      await loadStepDefinitions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create step definition',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStep = async () => {
    if (!selectedStepId) return;

    try {
      await api.stepDefinition.update(selectedStepId, formData);
      toast({
        title: 'Success',
        description: '스텝이 수정되었습니다',
      });
      setIsEditStepDialogOpen(false);
      resetForm();
      await loadStepDefinitions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update step definition',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStep = async () => {
    if (!selectedStepId) return;

    try {
      await api.stepDefinition.delete(selectedStepId);
      toast({
        title: 'Success',
        description: '스텝이 삭제되었습니다. 귀속된 모듈도 함께 삭제되었습니다.',
      });
      setIsDeleteStepDialogOpen(false);
      setSelectedStepId(null);
      await loadStepDefinitions();
      await loadModules(); // Refresh modules list after step deletion
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete step definition',
        variant: 'destructive',
      });
    }
  };

  const openEditStepDialog = () => {
    if (!selectedStepId) return;
    const step = stepDefinitions.find((s) => s.id === selectedStepId);
    if (step) {
      setFormData({
        title: step.title,
        emoji: step.emoji || '',
        description: step.description || '',
        defaultDDay: step.defaultDDay,
        stepType: step.stepType,
      });
      setIsEditStepDialogOpen(true);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      emoji: '',
      description: '',
      defaultDDay: undefined,
      stepType: undefined,
    });
  };

  // Module CRUD handlers
  const handleCreateModule = () => {
    if (!selectedStepId) {
      toast({
        title: '스텝 선택 필요',
        description: '모듈을 생성하려면 먼저 스텝을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedModule(null);
    setIsCreateModuleDialogOpen(true);
  };

  const handleEditModule = (module: ModuleResponse) => {
    setSelectedModule(module);
    setIsEditModuleDialogOpen(true);
  };

  const handlePreviewModule = (module: ModuleResponse) => {
    setSelectedModule(module);
    setIsPreviewModuleDialogOpen(true);
  };

  const handleDeleteModule = (module: ModuleResponse) => {
    setSelectedModule(module);
    setIsDeleteModuleDialogOpen(true);
  };

  const handleConfirmDeleteModule = async () => {
    if (!selectedModule) return;

    try {
      await api.module.delete(selectedModule.id);
      toast({
        title: 'Success',
        description: '모듈이 삭제되었습니다',
      });
      setIsDeleteModuleDialogOpen(false);
      setSelectedModule(null);
      await loadModules();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete module',
        variant: 'destructive',
      });
    }
  };

  const handleModuleDialogSuccess = () => {
    setIsCreateModuleDialogOpen(false);
    setIsEditModuleDialogOpen(false);
    setSelectedModule(null);
    loadModules();
  };

  // Filter step definitions based on search query
  const filteredStepDefinitions = stepDefinitions.filter((step) => {
    if (!stepSearchQuery) return true;
    const query = stepSearchQuery.toLowerCase();
    return (
      step.title.toLowerCase().includes(query) ||
      step.description?.toLowerCase().includes(query) ||
      step.emoji?.toLowerCase().includes(query) ||
      step.stepType?.toLowerCase().includes(query)
    );
  });

  // Filter modules based on selected step and search query
  const filteredModules = allModules.filter((module) => {
    // Only show modules that belong to the selected step
    if (selectedStepId !== null && module.stepDefinitionId !== selectedStepId) {
      return false;
    }
    // If no step is selected, show no modules
    if (selectedStepId === null) {
      return false;
    }
    // Apply search query filter
    if (!moduleSearchQuery) return true;
    const query = moduleSearchQuery.toLowerCase();
    return (
      module.name.toLowerCase().includes(query) ||
      module.description?.toLowerCase().includes(query) ||
      module.contentType.toLowerCase().includes(query)
    );
  });

  const selectedStep = selectedStepId ? stepDefinitions.find((s) => s.id === selectedStepId) : null;

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 max-w-[1600px]">
      <PMNavigationHeader
        title="스텝 및 모듈 관리"
        description="스텝과 모듈을 각각 독립적으로 관리합니다. 스텝과 모듈의 연결은 강사 등록 페이지에서 설정합니다."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left: Step Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>스텝 목록</CardTitle>
                <CardDescription>스텝을 생성, 수정, 삭제할 수 있습니다</CardDescription>
              </div>
              <Button onClick={() => setIsCreateStepDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                새 스텝 만들기
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="스텝 검색 (제목, 설명, 이모지, 유형)"
                value={stepSearchQuery}
                onChange={(e) => setStepSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : stepDefinitions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">스텝이 없습니다</div>
            ) : filteredStepDefinitions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">검색 결과가 없습니다</div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                {filteredStepDefinitions.map((step) => (
                  <div
                    key={step.id}
                    onClick={() => handleSelectStep(step.id)}
                    className={cn(
                      'p-4 border rounded-lg cursor-pointer transition-colors',
                      selectedStepId === step.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {step.emoji && <span className="text-2xl">{step.emoji}</span>}
                        <div>
                          <div className="font-medium">{step.title}</div>
                          {step.description && (
                            <div className="text-sm text-gray-500">{step.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStep(step.id);
                            openEditStepDialog();
                          }}
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStep(step.id);
                            setIsDeleteStepDialogOpen(true);
                          }}
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Module Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>모듈 목록</CardTitle>
                <CardDescription>모듈을 생성, 수정, 삭제, 미리보기할 수 있습니다</CardDescription>
              </div>
              <Button 
                onClick={handleCreateModule}
                disabled={selectedStepId === null}
                title={selectedStepId === null ? '먼저 스텝을 선택해주세요' : '모듈 생성'}
              >
                <Plus className="w-4 h-4 mr-2" />
                모듈 생성
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="모듈 검색 (이름, 설명, 타입)"
                value={moduleSearchQuery}
                onChange={(e) => setModuleSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {selectedStepId === null ? (
              <div className="text-center py-8 text-gray-500">
                왼쪽에서 스텝을 선택하면 해당 스텝에 귀속된 모듈 목록이 표시됩니다.
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {moduleSearchQuery ? '검색 결과가 없습니다' : '이 스텝에 귀속된 모듈이 없습니다. 위의 "모듈 생성" 버튼을 눌러 모듈을 만들어주세요.'}
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                {filteredModules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{module.name}</div>
                      <div className="text-sm text-gray-500">
                        타입: {module.contentType}
                        {module.description && ` | ${module.description}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => handlePreviewModule(module)}
                        title="미리보기"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => handleEditModule(module)}
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => handleDeleteModule(module)}
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Step Dialog */}
      <Dialog open={isCreateStepDialogOpen} onOpenChange={setIsCreateStepDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 스텝 만들기</DialogTitle>
            <DialogDescription>새로운 스텝 정의를 생성합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="스텝 제목"
              />
            </div>
            <div>
              <Label htmlFor="emoji">이모지</Label>
              <Input
                id="emoji"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                placeholder="📝"
              />
            </div>
            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="스텝 설명"
              />
            </div>
            <div>
              <Label htmlFor="defaultDDay">기본 D-Day</Label>
              <Input
                id="defaultDDay"
                type="number"
                value={formData.defaultDDay || ''}
                onChange={(e) => setFormData({ ...formData, defaultDDay: parseInt(e.target.value) || undefined })}
                placeholder="-14"
              />
            </div>
            <div>
              <Label htmlFor="stepType">스텝 유형</Label>
              <Input
                id="stepType"
                value={formData.stepType || ''}
                onChange={(e) => setFormData({ ...formData, stepType: e.target.value || undefined })}
                placeholder="예: PM 주도, 자가 점검, 지연, 생략"
              />
              <p className="text-xs text-muted-foreground mt-1">
                💡 자유롭게 입력 가능 (권장: PM 주도, 자가 점검, 지연, 생략)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsCreateStepDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreateStep} disabled={!formData.title}>
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Step Dialog */}
      <Dialog open={isEditStepDialogOpen} onOpenChange={setIsEditStepDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>스텝 수정</DialogTitle>
            <DialogDescription>스텝 정의를 수정합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">제목 *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="스텝 제목"
              />
            </div>
            <div>
              <Label htmlFor="edit-emoji">이모지</Label>
              <Input
                id="edit-emoji"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                placeholder="📝"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">설명</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="스텝 설명"
              />
            </div>
            <div>
              <Label htmlFor="edit-defaultDDay">기본 D-Day</Label>
              <Input
                id="edit-defaultDDay"
                type="number"
                value={formData.defaultDDay || ''}
                onChange={(e) => setFormData({ ...formData, defaultDDay: parseInt(e.target.value) || undefined })}
                placeholder="-14"
              />
            </div>
            <div>
              <Label htmlFor="edit-stepType">Step 유형</Label>
              <Input
                id="edit-stepType"
                value={formData.stepType || ''}
                onChange={(e) => setFormData({ ...formData, stepType: e.target.value || undefined })}
                placeholder="예: PM 주도, 자가 점검, 지연, 생략"
              />
              <p className="text-xs text-muted-foreground mt-1">
                💡 자유롭게 입력 가능 (권장: PM 주도, 자가 점검, 지연, 생략)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsEditStepDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdateStep} disabled={!formData.title}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Step Confirmation Dialog */}
      <Dialog open={isDeleteStepDialogOpen} onOpenChange={setIsDeleteStepDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>스텝 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 스텝을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDeleteStepDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteStep}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Module Dialog */}
      <CreateModuleDialog
        open={isCreateModuleDialogOpen}
        onOpenChange={setIsCreateModuleDialogOpen}
        onSuccess={handleModuleDialogSuccess}
        module={null}
        stepDefinitionId={selectedStepId || undefined}
      />

      {/* Edit Module Dialog */}
      <CreateModuleDialog
        open={isEditModuleDialogOpen}
        onOpenChange={setIsEditModuleDialogOpen}
        onSuccess={handleModuleDialogSuccess}
        module={selectedModule}
      />

      {/* Preview Module Dialog */}
      <ModulePreviewDialog
        open={isPreviewModuleDialogOpen}
        onOpenChange={setIsPreviewModuleDialogOpen}
        module={selectedModule}
      />

      {/* Delete Module Confirmation Dialog */}
      <Dialog open={isDeleteModuleDialogOpen} onOpenChange={setIsDeleteModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>모듈 삭제</DialogTitle>
            <DialogDescription>
              정말로 "{selectedModule?.name}" 모듈을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDeleteModuleDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteModule}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PMStepManagementPage;
