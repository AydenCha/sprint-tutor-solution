import { cn } from '@/lib/utils';

interface OverallProgressProps {
  progress: number;
  currentStep: number;
  totalSteps?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function OverallProgress({ 
  progress, 
  currentStep, 
  totalSteps = 7,
  size = 'md',
  showLabel = true 
}: OverallProgressProps) {
  const sizeStyles = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            전체 진행률
          </span>
          <span className="text-sm font-semibold text-primary">
            {progress}%
          </span>
        </div>
      )}
      
      <div className={cn(
        'w-full rounded-full bg-muted overflow-hidden',
        sizeStyles[size]
      )}>
        <div 
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent-foreground transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {showLabel && (
        <p className="mt-2 text-xs text-muted-foreground">
          현재 Step {currentStep} / {totalSteps} 진행 중
        </p>
      )}
    </div>
  );
}
