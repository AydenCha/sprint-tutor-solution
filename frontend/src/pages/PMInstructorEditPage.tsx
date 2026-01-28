import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { InstructorResponse, InstructorUpdateRequest, TrackResponse } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PMNavigationHeader } from '@/components/PMNavigationHeader';

export default function PMInstructorEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [instructor, setInstructor] = useState<InstructorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tracks, setTracks] = useState<TrackResponse[]>([]);

  const [formData, setFormData] = useState<InstructorUpdateRequest>({
    name: '',
    email: '',
    phone: '',
    track: '',
    cohort: '',
    startDate: '',
    instructorType: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [instructorData, tracksData] = await Promise.all([
        api.instructor.getById(Number(id)),
        api.track.getAll(),
      ]);
      setInstructor(instructorData);

      // Only show enabled tracks
      const enabledTracks = tracksData.filter(track => track.enabled);
      setTracks(enabledTracks);

      // Set form data with English track name
      setFormData({
        name: instructorData.name,
        email: instructorData.email,
        phone: instructorData.phone,
        track: instructorData.track || '',
        cohort: instructorData.cohort,
        startDate: instructorData.startDate,
        instructorType: instructorData.instructorType || '',
      });
    } catch (error) {
      toast({
        title: '데이터 로드 실패',
        description: error instanceof Error ? error.message : '강사 정보를 불러올 수 없습니다.',
        variant: 'destructive',
      });
      navigate('/pm/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof InstructorUpdateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.track || !formData.cohort || !formData.startDate) {
      toast({
        title: '입력 오류',
        description: '필수 항목을 모두 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      await api.instructor.update(Number(id), formData);
      toast({
        title: '수정 완료',
        description: '강사 정보가 성공적으로 수정되었습니다.',
      });
      navigate(`/pm/instructor/${id}`);
    } catch (error) {
      toast({
        title: '수정 실패',
        description: error instanceof Error ? error.message : '강사 정보 수정에 실패했습니다.',
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
        title="강사 정보 수정"
        description={`${instructor.name} 강사의 정보를 수정합니다.`}
        backTo={`/pm/instructor/${id}`}
        backLabel="상세 페이지로 돌아가기"
      />

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-5 lg:p-6 bg-card rounded-lg sm:rounded-xl border space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">전화번호 *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
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
                      "appearance-none cursor-pointer"
                    )}
                    required
                  >
                    <option value="">트랙 선택</option>
                    {tracks.map(track => (
                      <option key={track.id} value={track.name}>{track.koreanName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cohort">기수 *</Label>
                <Input
                  id="cohort"
                  placeholder="예: 1기, 2기, 3기 등"
                  value={formData.cohort}
                  onChange={(e) => handleInputChange('cohort', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">시작일 *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructorType">강사 유형</Label>
                <div className="relative">
                  <select
                    id="instructorType"
                    value={formData.instructorType || ''}
                    onChange={(e) => handleInputChange('instructorType', e.target.value)}
                    className={cn(
                      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "appearance-none cursor-pointer"
                    )}
                  >
                    <option value="">선택 안 함</option>
                    <option value="신입">🐣 신입</option>
                    <option value="경력">😎 경력</option>
                    <option value="재계약">🤝 재계약</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

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
    </div>
  );
}

