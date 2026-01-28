import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ResizableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function ResizableDialog({
  open,
  onOpenChange,
  title,
  children,
  defaultWidth = 1000,
  defaultHeight = 700,
  minWidth = 400,
  minHeight = 300,
  onFullscreenChange,
}: ResizableDialogProps) {
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (direction.includes('right')) {
        const newWidth = Math.max(minWidth, startPos.current.width + (moveEvent.clientX - startPos.current.x));
        setSize(prev => ({ ...prev, width: newWidth }));
      }
      if (direction.includes('bottom')) {
        const newHeight = Math.max(minHeight, startPos.current.height + (moveEvent.clientY - startPos.current.y));
        setSize(prev => ({ ...prev, height: newHeight }));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleFullscreen = useCallback(() => {
    const newValue = !isFullscreen;
    setIsFullscreen(newValue);
    onFullscreenChange?.(newValue);
  }, [isFullscreen, onFullscreenChange]);

  const handleClose = () => {
    onOpenChange(false);
  };

  useEffect(() => {
    // Reset to default size when dialog opens
    if (open) {
      setSize({ width: defaultWidth, height: defaultHeight });
      setIsFullscreen(false);
      onFullscreenChange?.(false);
    }
  }, [open, defaultWidth, defaultHeight, onFullscreenChange]);

  // F 키 단축키로 최대화 토글 (다이얼로그가 열려있을 때만)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // F 키를 눌렀을 때 (input, textarea 등에 포커스가 없을 때만)
      if (e.key === 'f' || e.key === 'F') {
        const target = e.target as HTMLElement;
        const isInputFocused = target.tagName === 'INPUT' || 
                              target.tagName === 'TEXTAREA' || 
                              target.isContentEditable;
        
        // 다이얼로그 내부에 포커스가 있는지 확인
        const dialogElement = resizeRef.current?.closest('[role="dialog"]');
        const isInsideDialog = dialogElement && dialogElement.contains(target);
        
        if (!isInputFocused && isInsideDialog) {
          e.preventDefault();
          e.stopPropagation(); // 이벤트 버블링 방지
          toggleFullscreen();
        }
      }
    };

    // 다이얼로그가 열려있을 때만 이벤트 리스너 등록
    window.addEventListener('keydown', handleKeyDown, true); // capture phase에서 처리
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open, toggleFullscreen]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "overflow-hidden p-0 gap-0 [&>button]:hidden",
          isFullscreen ? "w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]" : ""
        )}
        style={isFullscreen ? {
          width: 'calc(100vw - 2rem)',
          height: 'calc(100vh - 2rem)',
          maxWidth: 'calc(100vw - 2rem)',
          maxHeight: 'calc(100vh - 2rem)',
        } : {
          width: `${size.width}px`,
          height: `${size.height}px`,
          maxWidth: 'calc(100vw - 2rem)',
          maxHeight: 'calc(100vh - 2rem)',
        }}
        onInteractOutside={(e) => e.preventDefault()}
        ref={resizeRef}
      >
        {/* Custom Header - 최대화 시에도 작게 유지 */}
        <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30 flex-shrink-0" style={{ height: '48px' }}>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
            <Badge variant="outline" className="text-xs font-normal">
              F: {isFullscreen ? '최소화' : '최대화'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleFullscreen}
              title={isFullscreen ? "원래 크기로 (F)" : "전체 화면 (F)"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleClose}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content - 최대화 시 본문이 대부분의 공간을 차지하도록 */}
        <div
          className={cn(
            "flex-1 flex flex-col overflow-hidden",
            isFullscreen ? "p-4" : "p-6"
          )}
          style={{
            minHeight: 0,
            height: isFullscreen ? 'calc(100% - 48px)' : `${size.height - 48}px`
          }}
        >
          {children}
        </div>

        {/* Resize Handles */}
        {!isFullscreen && (
          <>
            {/* Right handle */}
            <div
              className={cn(
                "absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/20 transition-colors",
                isResizing && "bg-primary/40"
              )}
              onMouseDown={(e) => handleResizeStart(e, 'right')}
            />
            {/* Bottom handle */}
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary/20 transition-colors",
                isResizing && "bg-primary/40"
              )}
              onMouseDown={(e) => handleResizeStart(e, 'bottom')}
            />
            {/* Bottom-right corner handle */}
            <div
              className={cn(
                "absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-primary/20 transition-colors",
                isResizing && "bg-primary/40"
              )}
              onMouseDown={(e) => handleResizeStart(e, 'right-bottom')}
            >
              <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-muted-foreground/30" />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
