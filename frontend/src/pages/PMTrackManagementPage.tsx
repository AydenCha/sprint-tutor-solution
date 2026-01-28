import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api, { TrackResponse, TrackRequest } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  LogOut, 
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { PMNavigationHeader } from '@/components/PMNavigationHeader';

export default function PMTrackManagementPage() {
  const navigate = useNavigate();
  const { logout, userName } = useAuth();
  const { toast } = useToast();
  const [tracks, setTracks] = useState<TrackResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<TrackResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<TrackRequest>({
    name: '',
    koreanName: '',
    code: '',
    description: '',
    enabled: true,
  });

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      const data = await api.track.getAll();
      setTracks(data);
    } catch (error) {
      toast({
        title: '데이터 로드 실패',
        description: error instanceof Error ? error.message : '트랙 목록을 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      koreanName: '',
      code: '',
      description: '',
      enabled: true,
    });
    setEditingTrack(null);
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (track: TrackResponse) => {
    setFormData({
      name: track.name,
      koreanName: track.koreanName,
      code: track.code,
      description: track.description || '',
      enabled: track.enabled,
    });
    setEditingTrack(track);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (track: TrackResponse) => {
    if (!confirm(`"${track.koreanName}" 트랙을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await api.track.delete(track.id);
      toast({
        title: '삭제 완료',
        description: '트랙이 삭제되었습니다.',
      });
      await fetchTracks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '트랙 삭제에 실패했습니다.';
      toast({
        title: '삭제 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.koreanName || !formData.code) {
      toast({
        title: '입력 오류',
        description: '필수 항목을 모두 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      if (editingTrack) {
        await api.track.update(editingTrack.id, formData);
        toast({
          title: '수정 완료',
          description: '트랙이 수정되었습니다.',
        });
        setIsEditDialogOpen(false);
      } else {
        await api.track.create(formData);
        toast({
          title: '생성 완료',
          description: '트랙이 생성되었습니다.',
        });
        setIsCreateDialogOpen(false);
      }
      await fetchTracks();
      setFormData({
        name: '',
        koreanName: '',
        code: '',
        description: '',
        enabled: true,
      });
      setEditingTrack(null);
    } catch (error) {
      toast({
        title: editingTrack ? '수정 실패' : '생성 실패',
        description: error instanceof Error ? error.message : '트랙 저장에 실패했습니다.',
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

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 max-w-[1600px]">
      <PMNavigationHeader
        title="트랙 관리"
        description="트랙을 추가, 수정, 삭제할 수 있습니다. 삭제 시 해당 트랙에 등록된 강사가 있으면 삭제할 수 없습니다."
      >
        <div className="flex gap-1 sm:gap-2 ml-auto">
          <Button onClick={handleCreate} size="sm" className="text-xs sm:text-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">새 트랙 추가</span>
            <span className="sm:hidden">추가</span>
          </Button>
          <Button variant="tertiary" size="icon" onClick={() => { logout(); navigate('/'); }} className="w-8 h-8 sm:w-10 sm:h-10">
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </PMNavigationHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {tracks.map((track) => (
            <Card key={track.id} className={cn(
              "overflow-hidden",
              !track.enabled && "opacity-60"
            )}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{track.koreanName}</CardTitle>
                    <CardDescription>
                      {track.name} ({track.code})
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {track.enabled ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {track.description && (
                  <p className="text-sm text-muted-foreground mb-4">{track.description}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(track)}
                  >
                    <Edit className="h-4 w-4 mr-2" />수정
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(track)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tracks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>등록된 트랙이 없습니다.</p>
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />첫 번째 트랙 추가하기
            </Button>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 트랙 추가</DialogTitle>
              <DialogDescription>
                새로운 트랙을 추가합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">트랙 이름(영문) *</Label>
                  <Input
                    id="name"
                    placeholder="예: FRONTEND"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="koreanName">트랙 이름(한글) *</Label>
                  <Input
                    id="koreanName"
                    placeholder="예: 프론트엔드"
                    value={formData.koreanName}
                    onChange={(e) => setFormData({ ...formData, koreanName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">트랙 코드 *</Label>
                <Input
                  id="code"
                  placeholder="예: FE"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
                <p className="text-xs text-muted-foreground">
                  접속 코드 생성에 사용됩니다 (예: FE4-JD117)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  placeholder="트랙에 대한 설명을 입력하세요"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled">활성화</Label>
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isSaving}
                >
                  취소
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  생성
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>트랙 수정</DialogTitle>
              <DialogDescription>
                트랙 정보를 수정합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">트랙 이름(영문) *</Label>
                  <Input
                    id="edit-name"
                    placeholder="예: FRONTEND"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-koreanName">트랙 이름(한글) *</Label>
                  <Input
                    id="edit-koreanName"
                    placeholder="예: 프론트엔드"
                    value={formData.koreanName}
                    onChange={(e) => setFormData({ ...formData, koreanName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">트랙 코드 *</Label>
                <Input
                  id="edit-code"
                  placeholder="예: FE"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
                <p className="text-xs text-muted-foreground">
                  접속 코드 생성에 사용됩니다 (예: FE4-JD117)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">설명</Label>
                <Textarea
                  id="edit-description"
                  placeholder="트랙에 대한 설명을 입력하세요"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-enabled">활성화</Label>
                <Switch
                  id="edit-enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSaving}
                >
                  취소
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Edit className="h-4 w-4 mr-2" />
                  )}
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}

