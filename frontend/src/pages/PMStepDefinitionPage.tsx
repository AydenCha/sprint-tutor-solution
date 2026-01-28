import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api, { StepDefinitionResponse, StepDefinitionRequest } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { 
  LogOut, 
  Loader2,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  GripVertical
} from 'lucide-react';
import { PMNavigationHeader } from '@/components/PMNavigationHeader';
import { cn } from '@/lib/utils';

export default function PMStepDefinitionPage() {
  const navigate = useNavigate();
  const { logout, userName } = useAuth();
  const { toast } = useToast();
  const [definitions, setDefinitions] = useState<StepDefinitionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<StepDefinitionRequest>({
    title: '',
    emoji: '',
    description: '',
    defaultDDay: undefined,
    stepType: undefined,
  });

  useEffect(() => {
    fetchDefinitions();
  }, []);

  const fetchDefinitions = async () => {
    try {
      setIsLoading(true);
      const data = await api.stepDefinition.getAll();
      setDefinitions(data);
    } catch (error) {
      toast({
        title: '데이터 로드 실패',
        description: error instanceof Error ? error.message : '스텝 정의를 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered definitions with memoization for performance
  const filteredDefinitions = useMemo(() => {
    if (!searchQuery.trim()) return definitions;
    const query = searchQuery.toLowerCase();
    return definitions.filter(def => 
      def.title.toLowerCase().includes(query) ||
      def.description?.toLowerCase().includes(query) ||
      def.emoji?.includes(query)
    );
  }, [definitions, searchQuery]);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({ title: '로그아웃', description: '안전하게 로그아웃되었습니다.' });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      emoji: '',
      description: '',
      defaultDDay: undefined,
      stepType: undefined,
    });
    setEditingId(null);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (definition: StepDefinitionResponse) => {
    setFormData({
      title: definition.title,
      emoji: definition.emoji || '',
      description: definition.description || '',
      defaultDDay: definition.defaultDDay,
      stepType: definition.stepType || undefined,
    });
    setEditingId(definition.id);
    setIsCreateDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: '입력 오류',
        description: '제목을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      if (editingId) {
        await api.stepDefinition.update(editingId, formData);
        toast({
          title: '수정 완료',
          description: '스텝 정의가 수정되었습니다.',
        });
      } else {
        await api.stepDefinition.create(formData);
        toast({
          title: '생성 완료',
          description: '스텝 정의가 생성되었습니다.',
        });
      }
      setIsCreateDialogOpen(false);
      resetForm();
      fetchDefinitions();
    } catch (error) {
      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '스텝 정의를 저장할 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('이 스텝 정의를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await api.stepDefinition.delete(id);
      toast({
        title: '삭제 완료',
        description: '스텝 정의가 삭제되었습니다.',
      });
      fetchDefinitions();
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '스텝 정의를 삭제할 수 없습니다.',
        variant: 'destructive',
      });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (dropIndex: number) => async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    try {
      setIsSaving(true);
      
      // 검색 중이면 전체 definitions에서 재정렬해야 함
      const allDefinitions = [...definitions];
      const itemToMove = filteredDefinitions[draggedIndex];
      const targetItem = filteredDefinitions[dropIndex];
      
      // 전체 리스트에서 해당 아이템들의 실제 인덱스 찾기
      const actualDraggedIndex = allDefinitions.findIndex(d => d.id === itemToMove.id);
      const actualDropIndex = allDefinitions.findIndex(d => d.id === targetItem.id);
      
      // 전체 리스트에서 재정렬
      const [removed] = allDefinitions.splice(actualDraggedIndex, 1);
      allDefinitions.splice(actualDropIndex, 0, removed);
      
      const definitionIds = allDefinitions.map(d => d.id);
      const updated = await api.stepDefinition.updateOrder(definitionIds);
      setDefinitions(updated);

      toast({
        title: '순서 변경 완료',
        description: '스텝 정의 순서가 변경되었습니다.',
      });
    } catch (error) {
      toast({
        title: '순서 변경 실패',
        description: error instanceof Error ? error.message : '순서를 변경할 수 없습니다.',
        variant: 'destructive',
      });
      await fetchDefinitions();
    } finally {
      setIsSaving(false);
      setDraggedIndex(null);
    }
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 max-w-[1600px]">
      <PMNavigationHeader
        title="스텝 정의 관리"
        description="스텝 정의를 생성, 수정, 삭제하고 순서를 변경할 수 있습니다"
      >
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">{userName}님</span>
          <Button variant="secondary" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </PMNavigationHeader>
        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="스텝 정의 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            스텝 정의 추가
          </Button>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          총 {filteredDefinitions.length}개의 스텝 정의 (드래그하여 순서 변경)
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          /* Step Definitions List - Single column for clear ordering */
          <div className="max-w-4xl mx-auto space-y-3">
            {filteredDefinitions.map((definition, index) => (
              <Card 
                key={definition.id} 
                className={cn(
                  "transition-all duration-200 cursor-move",
                  draggedIndex === index && "opacity-30 scale-95",
                  dragOverIndex === index && draggedIndex !== index && "border-2 border-primary border-dashed bg-primary/10 scale-[1.02] shadow-figma-02"
                )}
                draggable
                onDragStart={handleDragStart(index)}
                onDragOver={handleDragOver(index)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop(index)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      {definition.emoji && (
                        <span className="text-2xl">{definition.emoji}</span>
                      )}
                      <CardTitle className="text-lg">{definition.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="tertiary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(definition);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="tertiary"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(definition.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div className="w-8 flex-shrink-0"></div>
                    <div className="flex-1">
                      {definition.description && (
                        <CardDescription className="mb-2">
                          {definition.description}
                        </CardDescription>
                      )}
                      <div className="space-y-1">
                    {definition.defaultDDay !== undefined && (
                      <div className="text-sm text-muted-foreground">
                        기본 D-Day: {definition.defaultDDay}일
                      </div>
                    )}
                    {definition.stepType && (
                      <div>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          definition.stepType === 'PM 주도' && "bg-primary/10 text-primary",
                          definition.stepType === '자가 점검' && "bg-blue-500/10 text-blue-600",
                          definition.stepType === '지연' && "bg-yellow-500/10 text-yellow-600",
                          definition.stepType === '생략' && "bg-gray-500/10 text-gray-600"
                        )}>
                          {definition.stepType}
                        </span>
                      </div>
                    )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredDefinitions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? '검색 결과가 없습니다.' : 'Step 정의가 없습니다. 새로운 Step 정의를 추가해주세요.'}
            </p>
          </div>
        )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Step 정의 수정' : 'Step 정의 추가'}
            </DialogTitle>
            <DialogDescription>
              재사용 가능한 Step 정의를 생성하거나 수정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="예: 강사 역할 이해"
              />
            </div>

            <div>
              <Label htmlFor="emoji">이모지</Label>
              <div className="flex gap-2">
                <Input
                  id="emoji"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="예: 📚"
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="icon" type="button">
                      <span className="text-lg">😀</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid grid-cols-8 gap-2">
                      {['📚', '👋', '🎯', '✅', '📝', '💻', '🔧', '🚀',
                        '💡', '📊', '🎓', '🔍', '📌', '⚡', '🎉', '🏆',
                        '📱', '🌟', '💼', '📋', '🎨', '🔐', '📧', '🎬',
                        '📅', '🔔', '💬', '📞', '🌐', '📈', '💾', '🖥️',
                        '⚙️', '🎯', '📦', '🔗', '📄', '🗂️', '📤', '📥',
                        '🔒', '🔓', '🔑', '🎪', '🏁', '🎁', '🌈', '⭐',
                        '✨', '🔥', '💪', '👍', '👏', '🙌', '✌️', '🤝',
                        '🎊', '🎈', '🎀', '🎗️', '🏅', '🥇', '🥈', '🥉'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="text-2xl hover:bg-muted p-2 rounded transition-colors"
                          onClick={() => setFormData({ ...formData, emoji })}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="stepType">키워드 (스텝 유형)</Label>
              <Input
                id="stepType"
                value={formData.stepType || ''}
                onChange={(e) => setFormData({ ...formData, stepType: e.target.value || undefined })}
                placeholder="예: PM 주도, 자가 점검, 지연, 생략"
              />
            </div>

            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="스텝에 대한 설명을 입력하세요."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="defaultDDay">기본 D-Day</Label>
              <Input
                id="defaultDDay"
                type="number"
                value={formData.defaultDDay || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  defaultDDay: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="예: 7"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                취소
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? '수정' : '생성'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

