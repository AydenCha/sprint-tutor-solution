/**
 * FileUploadModule Component (Type C Module) - Figma Design 100%
 *
 * Figma node-id: 67:1185
 * 
 * This module handles file upload requirements for instructors.
 * Completely rewritten to match Figma design specifications.
 */

import { useState, useRef } from 'react';
import { TaskResponse, FileUploadResponse } from '@/services/api';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { FigmaIcon } from '../FigmaIcon';
import {
  FIGMA_ICON_INFO_CIRCLE,
  FIGMA_ICON_UPLOAD_CLOUD,
  FIGMA_ICON_FILE_ITEM,
  FIGMA_ICON_X_CLOSE,
} from '@/assets/figma-images';

// ============================================
// Types and Interfaces
// ============================================

interface FileUploadModuleProps {
  task: TaskResponse;
  onUpdate: (task: TaskResponse) => void;
  onComplete: () => void;
  onSkip?: () => void;
  isPreview?: boolean;
  isFullWidth?: boolean;
}

interface UploadedFile {
  id: number;
  filename: string;
  fileSize: number;
  uploadDate: string;
}

// ============================================
// Constants
// ============================================

const FILE_SIZE_LIMITS = {
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
};

// ============================================
// Component
// ============================================

export function FileUploadModule({
  task,
  onUpdate,
  onComplete,
  onSkip,
  isPreview = false,
  isFullWidth = false,
}: FileUploadModuleProps) {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredFiles = task.requiredFiles || [];
  const isCompleted = isPreview ? false : task.status === 'COMPLETED';

  // Check if all required files are uploaded
  const allFilesUploaded = requiredFiles.length > 0 && uploadedFiles.length >= requiredFiles.length;

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > FILE_SIZE_LIMITS.MAX_SIZE) {
      toast({
        title: '파일 크기 초과',
        description: '파일 크기는 100MB를 초과할 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type if required
    if (requiredFiles.length > 0) {
      const requirement = requiredFiles[0];
      if (requirement.allowedExtensions && requirement.allowedExtensions.length > 0) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !requirement.allowedExtensions.includes(fileExtension)) {
          toast({
            title: '파일 형식 오류',
            description: `허용된 파일 형식: ${requirement.allowedExtensions.join(', ')}`,
            variant: 'destructive',
          });
          return;
        }
      }
    }

    // Upload file
    try {
      setIsUploading(true);
      const response: FileUploadResponse = await api.file.upload(file, task.id);

      const newFile: UploadedFile = {
        id: response.fileId,
        filename: file.name,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
      };

      setUploadedFiles(prev => [...prev, newFile]);

      toast({
        title: '업로드 완료',
        description: '파일이 성공적으로 업로드되었습니다.',
        variant: 'success',
      });

      // Check if all required files are now uploaded
      if (uploadedFiles.length + 1 >= requiredFiles.length) {
        // Mark task as completed
        onComplete();
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: '업로드 실패',
        description: error instanceof Error ? error.message : '파일 업로드에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file delete
  const handleFileDelete = async (fileId: number) => {
    try {
      await api.file.delete(fileId);
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      toast({
        title: '삭제 완료',
        description: '파일이 삭제되었습니다.',
        variant: 'success',
      });
    } catch (error) {
      console.error('File delete error:', error);
      toast({
        title: '삭제 실패',
        description: '파일 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Handle browse button click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Handle skip
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 items-start w-full">
      {/* Content Container */}
      <div className="bg-figma-gray-05 border border-figma-gray-50 rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 w-full flex flex-col gap-4 sm:gap-6 items-end">
        {/* File Requirements + Upload Area */}
        <div className="w-full flex flex-col gap-0">
          {/* File Requirements Header */}
          <div className="bg-figma-gray-00 border border-figma-gray-40 border-b-0 rounded-t-lg sm:rounded-t-xl px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-7 lg:py-8">
            <p className="text-lg sm:text-xl font-medium text-figma-gray-100 tracking-[-0.3px] leading-[28px] sm:leading-[32px]">
              제출이 필요한 파일
            </p>
            <div className="flex flex-col gap-3 sm:gap-4 mt-4 sm:mt-5">
              {requiredFiles.map((requirement, index) => (
                <div key={index} className="flex flex-col gap-1.5 sm:gap-2">
                  <p className="text-base sm:text-lg font-bold text-figma-gray-100 tracking-[-0.3px] leading-[27px] sm:leading-[30px]">
                    {requirement.fileName}
                  </p>
                  <div className="flex items-center gap-1">
                    <FigmaIcon src={FIGMA_ICON_INFO_CIRCLE} alt="Info" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-base font-normal text-figma-gray-70 tracking-[-0.3px] leading-[24px] sm:leading-[27px]">
                      허용 확장자: {requirement.allowedExtensions?.join(', ') || '모든 파일'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-figma-gray-00 border border-figma-gray-40 rounded-b-lg sm:rounded-b-xl px-4 sm:px-6 md:px-8 lg:px-10 pt-4 sm:pt-6 md:pt-6 pb-4 sm:pb-6 md:pb-8 flex flex-col gap-8 sm:gap-12 md:gap-16 lg:gap-20">
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'w-full min-h-[200px] sm:min-h-[250px] md:min-h-[280px] lg:min-h-[334px] border-2 border-dashed rounded-lg sm:rounded-xl flex flex-col items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 transition-colors cursor-pointer',
                isDragging ? 'border-figma-purple-60 bg-figma-purple-00' : 'border-figma-gray-40 bg-transparent',
                isUploading && 'pointer-events-none opacity-50'
              )}
              onClick={handleBrowseClick}
            >
              {isUploading ? (
                <Loader2 className="w-14 h-14 animate-spin text-figma-purple-60" />
              ) : (
                <>
                  <FigmaIcon
                    src={FIGMA_ICON_UPLOAD_CLOUD}
                    alt="Upload"
                    className="w-14 h-14 mt-16"
                  />
                  <div className="flex flex-col items-center gap-0">
                    <p className="text-base font-normal text-figma-gray-100 tracking-[-0.3px] leading-[27px]">
                      파일을 여기에 끌어다 놓거나
                    </p>
                    <p className="text-base font-normal text-figma-gray-100 tracking-[-0.3px] leading-[27px]">
                      아래 버튼을 클릭하여 파일을 선택하세요
                    </p>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBrowseClick();
                    }}
                    variant="ghost"
                    className="h-10 px-6 py-2 rounded-lg text-base font-medium text-figma-gray-100 tracking-[-0.3px] hover:bg-figma-gray-10 mt-6"
                  >
                    파일 찾기
                  </Button>
                </>
              )}
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-col gap-0">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="h-[86px] flex items-center gap-4 px-6 border-t border-figma-gray-20"
                  >
                    <FigmaIcon src={FIGMA_ICON_FILE_ITEM} alt="File" className="w-6 h-6" />
                    <div className="flex-1 flex flex-col gap-0">
                      <p className="text-base font-medium text-figma-gray-100 tracking-[-0.3px] leading-[27px]">
                        {file.filename}
                      </p>
                      <p className="text-base font-normal text-figma-gray-70 tracking-[-0.3px] leading-[27px]">
                        {formatFileSize(file.fileSize)} · {new Date(file.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleFileDelete(file.id)}
                      className="p-2.5 rounded-full hover:bg-figma-gray-10 transition-colors"
                      aria-label="파일 삭제"
                    >
                      <FigmaIcon src={FIGMA_ICON_X_CLOSE} alt="Delete" className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4">
          {onSkip && !isPreview && (
            <Button
              onClick={handleSkip}
              variant="secondary"
              className="min-w-[100px] w-[224px] h-[54px] px-8 py-[13px] rounded-[10px] text-lg font-bold leading-[30px] tracking-[-0.3px]"
            >
              건너뛰기
            </Button>
          )}
          <Button
            onClick={onComplete}
            disabled={!allFilesUploaded || isUploading}
            variant="primary"
            className="min-w-[100px] w-[224px] h-[54px] px-8 py-[13px] rounded-[10px] text-lg font-bold leading-[30px] tracking-[-0.3px]"
          >
            제출하기
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        accept={requiredFiles[0]?.allowedExtensions?.map(ext => `.${ext}`).join(',') || '*'}
      />
    </div>
  );
}
