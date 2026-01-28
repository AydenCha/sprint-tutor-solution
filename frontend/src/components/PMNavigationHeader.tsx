import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PMNavigationHeaderProps {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PMNavigationHeader({
  title,
  description,
  backTo = '/pm/dashboard',
  backLabel = '대시보드로 돌아가기',
  className,
  children,
}: PMNavigationHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={cn('mb-4 sm:mb-6', className)}>
      <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate(backTo)}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4"
          size="sm"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline text-xs sm:text-sm">{backLabel}</span>
        </Button>
        {children}
      </div>
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">{title}</h1>
        {description && <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 break-all">{description}</p>}
      </div>
    </div>
  );
}
