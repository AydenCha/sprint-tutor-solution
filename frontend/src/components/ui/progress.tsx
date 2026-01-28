import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

export interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /**
   * Progress bar label (위쪽에 표시)
   */
  label?: string;
  /**
   * 퍼센트 값 표시 여부
   */
  showValue?: boolean;
  /**
   * Value 표시 포맷
   */
  valueFormat?: (value: number) => string;
  /**
   * Progress bar 스타일 variant
   */
  variant?: 'default' | 'success' | 'warning' | 'error';
  /**
   * Progress bar 크기
   */
  size?: 'sm' | 'md' | 'lg';
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value = 0, 
  label, 
  showValue = false,
  valueFormat = (v) => `${Math.round(v)}%`,
  variant = 'default',
  size = 'md',
  ...props 
}, ref) => {
  const variantClasses = {
    default: 'bg-figma-purple-50',
    success: 'bg-figma-green-60',
    warning: 'bg-[#FFB800]', // Note: Figma에 Warning 색상 없음, Yellow 추가 필요
    error: 'bg-figma-red-60',
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-glyph-14 font-medium text-figma-gray-80">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-glyph-14 font-medium text-figma-gray-60">
              {valueFormat(value)}
            </span>
          )}
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-figma-gray-15",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-normal ease-figma-ease",
            variantClasses[variant]
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
