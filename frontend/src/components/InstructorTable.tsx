import { InstructorResponse } from '@/services/api';
import { cn } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Copy, Check, Edit, Trash2, Settings } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface InstructorTableProps {
  instructors: InstructorResponse[];
  onViewInstructor?: (instructor: InstructorResponse) => void;
  onEditInstructor?: (instructor: InstructorResponse) => void;
  onDeleteInstructor?: (instructor: InstructorResponse) => void;
  onEditSteps?: (instructor: InstructorResponse) => void;
}

export function InstructorTable({ instructors, onViewInstructor, onEditInstructor, onDeleteInstructor, onEditSteps }: InstructorTableProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: '접속 코드 복사됨',
      description: `${code}가 클립보드에 복사되었습니다.`,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-step-completed';
    if (progress >= 50) return 'bg-step-in-progress';
    return 'bg-warning';
  };

  const getStatusBadge = (currentStep: number, progress: number) => {
    if (progress >= 100) {
      return <Badge variant="default" className="bg-step-completed text-white">완료</Badge>;
    }
    return (
      <Badge variant="outline" className="border-step-in-progress text-step-in-progress">
        Step {currentStep} 진행중
      </Badge>
    );
  };

  return (
    <div className="rounded-lg sm:rounded-xl border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold text-xs sm:text-sm">강사명</TableHead>
            <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">트랙</TableHead>
            <TableHead className="font-semibold text-xs sm:text-sm hidden lg:table-cell">기수</TableHead>
            <TableHead className="font-semibold text-xs sm:text-sm">진행률</TableHead>
            <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell">상태</TableHead>
            <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">접속 코드</TableHead>
            <TableHead className="font-semibold text-xs sm:text-sm text-right">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instructors.map((instructor) => (
            <TableRow 
              key={instructor.id}
              className="hover:bg-muted/30 transition-colors"
            >
              <TableCell>
                <div className="min-w-[140px] max-w-[200px]">
                  <p className="text-sm sm:text-base font-medium text-foreground truncate">{instructor.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{instructor.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1 md:hidden">
                    <Badge variant="secondary" className="text-xs">{instructor.track}</Badge>
                    {instructor.overallProgress >= 100 ? (
                      <Badge variant="default" className="bg-step-completed text-white text-xs">완료</Badge>
                    ) : (
                      <Badge variant="outline" className="border-step-in-progress text-step-in-progress text-xs">
                        Step {instructor.currentStep}
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="secondary" className="text-xs sm:text-sm">{instructor.track}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">
                {instructor.cohort}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 sm:gap-3 min-w-[100px]">
                  <div className="w-16 sm:w-24 h-2 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    <div 
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        getProgressColor(instructor.overallProgress)
                      )}
                      style={{ width: `${instructor.overallProgress}%` }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-foreground flex-shrink-0">
                    {instructor.overallProgress}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {getStatusBadge(instructor.currentStep, instructor.overallProgress)}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {instructor.accessCode ? (
                  <button
                    onClick={() => handleCopyCode(instructor.accessCode)}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1 rounded-md',
                      'font-mono text-xs sm:text-sm',
                      'bg-muted hover:bg-muted/80 transition-colors',
                      'group'
                    )}
                  >
                    <span>{instructor.accessCode}</span>
                    {copiedCode === instructor.accessCode ? (
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                ) : (
                  <span className="text-muted-foreground text-xs sm:text-sm">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onViewInstructor?.(instructor)}
                    className="text-xs sm:text-sm px-2 sm:px-3 h-8"
                  >
                    상세
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                        <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditSteps?.(instructor)}>
                        <Settings className="h-4 w-4 mr-2" />
                        단계 수정
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditInstructor?.(instructor)}>
                        <Edit className="h-4 w-4 mr-2" />
                        정보 수정
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDeleteInstructor?.(instructor)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
