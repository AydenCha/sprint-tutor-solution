import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api, { InstructorResponse } from '@/services/api';
import { StatCard } from '@/components/StatCard';
import { InstructorTable } from '@/components/InstructorTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Users, CheckCircle, Clock, AlertTriangle, Plus, LogOut, Loader2, BookOpen, Search, X, Settings, Menu, User, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PMDashboard() {
  const navigate = useNavigate();
  const { logout, userName } = useAuth();
  const { toast } = useToast();
  const [instructors, setInstructors] = useState<InstructorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filterTrack, setFilterTrack] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setIsLoading(true);
      const data = await api.instructor.getAll();
      setInstructors(data);
    } catch (error) {
      toast({
        title: '데이터 로드 실패',
        description: error instanceof Error ? error.message : '강사 목록을 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInstructor = (instructor: InstructorResponse) => {
    navigate(`/pm/instructor/${instructor.id}/edit`);
  };

  const handleDeleteInstructor = async (instructor: InstructorResponse) => {
    if (!confirm(`"${instructor.name}" 강사를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 모든 데이터가 삭제됩니다.`)) {
      return;
    }

    try {
      await api.instructor.delete(instructor.id);
      toast({
        title: '삭제 완료',
        description: '강사가 삭제되었습니다.',
      });
      await fetchInstructors();
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '강사 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleEditSteps = (instructor: InstructorResponse) => {
    navigate(`/pm/instructor/${instructor.id}/steps`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({ title: '로그아웃', description: '안전하게 로그아웃되었습니다.' });
  };

  // 필터링 및 정렬된 강사 목록
  const filteredAndSortedInstructors = useMemo(() => {
    let filtered = [...instructors];

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (instructor) =>
          instructor.name?.toLowerCase().includes(query) ||
          instructor.email?.toLowerCase().includes(query) ||
          instructor.accessCode?.toLowerCase().includes(query)
      );
    }

    // 트랙 필터
    if (filterTrack !== 'all') {
      filtered = filtered.filter((instructor) => instructor.track === filterTrack);
    }

    // 상태 필터
    if (filterStatus !== 'all') {
      if (filterStatus === 'completed') {
        filtered = filtered.filter((instructor) => instructor.overallProgress >= 100);
      } else if (filterStatus === 'inProgress') {
        filtered = filtered.filter(
          (instructor) => instructor.overallProgress > 0 && instructor.overallProgress < 100
        );
      } else if (filterStatus === 'notStarted') {
        filtered = filtered.filter((instructor) => instructor.overallProgress === 0);
      }
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.overallProgress - a.overallProgress;
        case 'track':
          return a.track.localeCompare(b.track);
        case 'cohort':
          return a.cohort.localeCompare(b.cohort);
        default:
          return 0;
      }
    });

    return filtered;
  }, [instructors, searchQuery, filterTrack, filterStatus, sortBy]);

  // 고유한 트랙 목록
  const uniqueTracks = useMemo(() => {
    const tracks = new Set(instructors.map((i) => i.track));
    return Array.from(tracks).sort();
  }, [instructors]);

  const stats = {
    total: instructors.length,
    completed: instructors.filter((i) => i.overallProgress >= 100).length,
    inProgress: instructors.filter((i) => i.overallProgress > 0 && i.overallProgress < 100).length,
    notStarted: instructors.filter((i) => i.overallProgress === 0).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 max-w-[1600px] flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">강사 온보딩 관리</h1>
            <button
              onClick={() => navigate('/pm/audit-logs')}
              className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:underline flex items-center gap-1"
            >
              <User className="h-3 w-3" />
              {userName || '관리자'} PM
            </button>
          </div>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            {/* Mobile/Tablet Menu (< 1024px) */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="icon-md" 
                  className="lg:hidden"
                  title="메뉴 열기"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle>메뉴</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-3 mt-6">
                  <Button 
                    variant="primary" 
                    size="md"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/pm/register');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />신규 강사 등록
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/pm/steps');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />Step 관리
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="md"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/pm/tracks');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />트랙 관리
                  </Button>
                  <div className="border-t my-2"></div>
                  <Button 
                    variant="secondary" 
                    size="md"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/pm/settings');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />계정 설정
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="md"
                    className="w-full justify-start"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />로그아웃
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Buttons (≥ 1024px) */}
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/pm/steps')}
              className="hidden lg:flex"
            >
              <BookOpen className="h-4 w-4 mr-2" />Step 관리
            </Button>
            <Button 
              variant="secondary" 
              size="md"
              onClick={() => navigate('/pm/tracks')}
              className="hidden lg:flex"
            >
              <Settings className="h-4 w-4 mr-2" />트랙 관리
            </Button>
            <Button 
              variant="primary"
              size="md"
              onClick={() => navigate('/pm/register')}
              className="hidden lg:flex"
            >
              <Plus className="h-4 w-4 mr-2" />신규 강사 등록
            </Button>
            <Button 
              variant="icon" 
              size="icon-md" 
              onClick={() => navigate('/pm/settings')} 
              className="hidden lg:flex"
              title="계정 설정"
            >
              <User className="h-4 w-4" />
            </Button>
            <Button variant="icon" size="icon-md" onClick={handleLogout} className="hidden lg:flex" title="로그아웃">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-[1600px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <StatCard title="전체 강사" value={stats.total} icon={Users} variant="primary" />
          <StatCard title="온보딩 완료" value={stats.completed} icon={CheckCircle} variant="success" />
          <StatCard title="진행 중" value={stats.inProgress} icon={Clock} variant="warning" />
          <StatCard title="미시작" value={stats.notStarted} icon={AlertTriangle} variant="destructive" />
        </div>

        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">강사 목록</h2>
            <div className="text-xs sm:text-sm text-muted-foreground">
              총 {filteredAndSortedInstructors.length}명
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-3 sm:mb-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="강사명, 이메일, 접속 코드로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="icon"
                  size="icon-sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* 트랙 필터 */}
            <Select value={filterTrack} onValueChange={setFilterTrack}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="트랙 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 트랙</SelectItem>
                {uniqueTracks.map((track) => (
                  <SelectItem key={track} value={track}>
                    {track}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 상태 필터 */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="inProgress">진행 중</SelectItem>
                <SelectItem value="notStarted">미시작</SelectItem>
              </SelectContent>
            </Select>

            {/* 정렬 */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="정렬 기준" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">이름순</SelectItem>
                <SelectItem value="progress">진행률순</SelectItem>
                <SelectItem value="track">트랙순</SelectItem>
                <SelectItem value="cohort">기수순</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 필터 초기화 버튼 */}
          {(searchQuery || filterTrack !== 'all' || filterStatus !== 'all' || sortBy !== 'name') && (
            <div className="mb-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterTrack('all');
                  setFilterStatus('all');
                  setSortBy('name');
                }}
              >
                <X className="h-4 w-4 mr-2" />
                필터 초기화
              </Button>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">로딩 중...</span>
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>등록된 강사가 없습니다.</p>
            <Button variant="primary" size="md" onClick={() => navigate('/pm/register')} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />첫 강사 등록하기
            </Button>
          </div>
        ) : filteredAndSortedInstructors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>검색 조건에 맞는 강사가 없습니다.</p>
            {(searchQuery || filterTrack !== 'all' || filterStatus !== 'all') && (
              <Button
                variant="secondary"
                size="md"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setFilterTrack('all');
                  setFilterStatus('all');
                }}
              >
                필터 초기화
              </Button>
            )}
          </div>
        ) : (
          <InstructorTable 
            instructors={filteredAndSortedInstructors} 
            onViewInstructor={(i) => navigate(`/pm/instructor/${i.id}`)}
            onEditInstructor={handleEditInstructor}
            onDeleteInstructor={handleDeleteInstructor}
            onEditSteps={handleEditSteps}
          />
        )}
      </main>
    </div>
  );
}
