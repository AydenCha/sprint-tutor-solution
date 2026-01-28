/**
 * Segmented Control Component
 * 
 * Figma 디자인 시스템의 Segmented Control을 구현합니다.
 * 여러 선택지 중 하나를 선택하는 UI 컴포넌트입니다.
 * 
 * Usage:
 * ```tsx
 * <SegmentedControl
 *   options={[
 *     { value: 'all', label: '전체' },
 *     { value: 'active', label: '활성' },
 *     { value: 'completed', label: '완료' }
 *   ]}
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 * />
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  /**
   * 선택 가능한 옵션 목록
   */
  options: SegmentedControlOption[];
  /**
   * 현재 선택된 값
   */
  value?: string;
  /**
   * 값 변경 콜백
   */
  onChange?: (value: string) => void;
  /**
   * 크기
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 전체 너비 사용 여부
   */
  fullWidth?: boolean;
  /**
   * 추가 CSS 클래스
   */
  className?: string;
  /**
   * Disabled 상태
   */
  disabled?: boolean;
}

export const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  (
    {
      options,
      value,
      onChange,
      size = 'md',
      fullWidth = false,
      className,
      disabled = false,
    },
    ref
  ) => {
    const [selectedValue, setSelectedValue] = React.useState<string>(value || options[0]?.value || '');

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    const handleSelect = (optionValue: string, optionDisabled?: boolean) => {
      if (disabled || optionDisabled) return;
      
      setSelectedValue(optionValue);
      onChange?.(optionValue);
    };

    const sizeClasses = {
      sm: {
        container: 'h-8 p-1 gap-1',
        item: 'px-3 py-1 text-glyph-12 rounded-md',
      },
      md: {
        container: 'h-10 p-1 gap-1',
        item: 'px-4 py-2 text-glyph-14 rounded-md',
      },
      lg: {
        container: 'h-12 p-1.5 gap-1.5',
        item: 'px-5 py-2.5 text-glyph-16 rounded-lg',
      },
    };

    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(
          "inline-flex items-center bg-figma-gray-10 rounded-lg",
          sizeClasses[size].container,
          fullWidth && "w-full",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          const isDisabled = disabled || option.disabled;

          return (
            <button
              key={option.value}
              role="tab"
              aria-selected={isSelected}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              onClick={() => handleSelect(option.value, option.disabled)}
              className={cn(
                "flex items-center justify-center gap-2 font-medium transition-all duration-fast ease-figma-ease",
                sizeClasses[size].item,
                fullWidth && "flex-1",
                isSelected
                  ? "bg-figma-gray-00 text-figma-gray-100 shadow-figma-01"
                  : "bg-transparent text-figma-gray-60 hover:text-figma-gray-80",
                isDisabled && "cursor-not-allowed opacity-50"
              )}
            >
              {option.icon && <span className="shrink-0">{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
);

SegmentedControl.displayName = "SegmentedControl";

export default SegmentedControl;
