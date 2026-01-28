import { cn } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';

interface DDayBannerProps {
  startDate: string;
  instructorName: string;
  track: string;
  cohort: string;
}

export function DDayBanner({ startDate, instructorName, track, cohort }: DDayBannerProps) {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = start.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isUrgent = diffDays <= 3;
  const isImminent = diffDays <= 7;

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-6',
      'bg-gradient-to-br from-primary via-primary to-accent-foreground',
      'text-primary-foreground shadow-figma-02'
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20" />
        <div className="absolute -left-5 -bottom-5 h-32 w-32 rounded-full bg-white/10" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm opacity-90 mb-1">
              {track} {cohort}
            </p>
            <h2 className="text-2xl font-bold mb-2">
              {instructorName} 강사님, 환영합니다! 👋
            </h2>
            <p className="text-sm opacity-80">
              온보딩을 완료하고 최고의 강의를 시작하세요
            </p>
          </div>
          
          <div className={cn(
            'flex items-center gap-4 px-6 py-4 rounded-xl',
            'bg-white/10 backdrop-blur-sm',
            isUrgent && 'animate-pulse-soft'
          )}>
            <div className="text-center">
              <div className={cn(
                'text-4xl font-bold',
                isUrgent ? 'text-warning' : 'text-primary-foreground'
              )}>
                D{diffDays > 0 ? '-' : '+'}{Math.abs(diffDays)}
              </div>
              <p className="text-xs opacity-80 mt-1">강의 시작일</p>
            </div>
            
            <div className="h-12 w-px bg-white/20" />
            
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-2 opacity-90">
                <Calendar className="h-4 w-4" />
                <span>{start.toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2 opacity-70">
                <Clock className="h-4 w-4" />
                <span>
                  {isUrgent ? '마감 임박!' : isImminent ? '곧 시작됩니다' : '여유있게 준비하세요'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
