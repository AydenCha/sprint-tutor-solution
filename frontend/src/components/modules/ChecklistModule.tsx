/**
 * ChecklistModule Component (Type D Module) - Figma Design 100%
 *
 * Figma node-id: 67:1210
 * 
 * This module handles checklist completion for instructors.
 * Completely rewritten to match Figma design specifications.
 */

import { useState, useEffect } from 'react';
import { TaskResponse, ChecklistItemResponse } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// ============================================
// Types and Interfaces
// ============================================

interface ChecklistModuleProps {
  task: TaskResponse;
  onUpdate: (task: TaskResponse) => void;
  onComplete: () => void;
  onSkip?: () => void;
  isPreview?: boolean;
  isFullWidth?: boolean;
}

interface ChecklistItemState {
  id: number;
  label: string;
  checked: boolean;
}

// ============================================
// Component
// ============================================

export function ChecklistModule({
  task,
  onUpdate,
  onComplete,
  onSkip,
  isPreview = false,
  isFullWidth = false,
}: ChecklistModuleProps) {
  const [items, setItems] = useState<ChecklistItemState[]>([]);

  const isCompleted = isPreview ? false : task.status === 'COMPLETED';
  const checklistItems = task.checklistItems || [];

  // Initialize checklist items
  useEffect(() => {
    if (isPreview) {
      // Preview mode: all items unchecked
      setItems(
        checklistItems.map((item) => ({
          id: item.id,
          label: item.label,
          checked: false,
        }))
      );
    } else if (isCompleted) {
      // Completed: all items checked
      setItems(
        checklistItems.map((item) => ({
          id: item.id,
          label: item.label,
          checked: true,
        }))
      );
    } else {
      // Normal mode: initialize as unchecked
      setItems(
        checklistItems.map((item) => ({
          id: item.id,
          label: item.label,
          checked: false,
        }))
      );
    }
  }, [checklistItems, isCompleted, isPreview]);

  // Handle checkbox toggle
  const handleToggle = (itemId: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // Check if all items are checked
  const allChecked = items.length > 0 && items.every((item) => item.checked);

  // Handle complete
  const handleComplete = () => {
    if (allChecked) {
      onComplete();
    }
  };

  // Handle skip
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 items-start w-full">
      {/* Content Container */}
      <div className="bg-figma-gray-05 border border-figma-gray-50 rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 w-full flex flex-col gap-4 sm:gap-6 items-end">
        {/* Checklist Card */}
        <div className="bg-figma-gray-00 border border-figma-gray-40 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 lg:p-10 w-full max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-320px)] overflow-y-auto">
          {/* Checklist Items */}
          <div className="flex flex-col gap-0">
            {/* Header */}
            <div className="h-7 sm:h-8 flex items-center mb-8 sm:mb-10 lg:mb-14">
              <p className="text-lg sm:text-xl font-medium text-figma-gray-100 tracking-[-0.3px] leading-[28px] sm:leading-[32px] pl-1 sm:pl-1.5">
                체크리스트
              </p>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-4 sm:gap-6">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="min-h-[60px] sm:min-h-[70px] lg:h-[76px] border-b border-figma-gray-20 flex items-start sm:items-center gap-3 sm:gap-4 lg:gap-6 pb-4 sm:pb-5 lg:pb-6"
                >
                  {/* Checkbox */}
                  <Checkbox
                    id={`checklist-item-${item.id}`}
                    checked={item.checked}
                    onCheckedChange={() => handleToggle(item.id)}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded border-2 border-figma-gray-40 data-[state=checked]:bg-figma-purple-60 data-[state=checked]:border-figma-purple-60 flex-shrink-0 mt-1 sm:mt-0"
                  />

                  {/* Text */}
                  <label
                    htmlFor={`checklist-item-${item.id}`}
                    className={cn(
                      'flex-1 text-base sm:text-lg lg:text-xl font-normal tracking-[-0.3px] leading-[27px] sm:leading-[30px] lg:leading-[32px] cursor-pointer',
                      item.checked ? 'text-figma-gray-60 line-through' : 'text-figma-gray-100'
                    )}
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Button */}
        <Button
          onClick={handleComplete}
          disabled={!allChecked}
          variant="primary"
          className="min-w-[100px] w-full sm:w-[180px] lg:w-[224px] h-[48px] sm:h-[54px] px-6 sm:px-8 py-3 sm:py-[13px] rounded-[10px] text-base sm:text-lg font-bold leading-[27px] sm:leading-[30px] tracking-[-0.3px]"
        >
          완료하기
        </Button>
      </div>
    </div>
  );
}
