import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Download, File, Image as ImageIcon, FileText } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface FilePreviewProps {
  fileId: number;
  fileName: string;
  fileSize?: number;
  onClose: () => void;
}

/**
 * 파일 미리보기 컴포넌트
 * 
 * 이미지, PDF, 텍스트 파일 등을 미리보기할 수 있습니다.
 */
export function FilePreview({ fileId, fileName, onClose }: FilePreviewProps) {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'text' | 'other'>('other');

  useEffect(() => {
    let isMounted = true;

    const loadPreview = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 파일 타입 확인
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
          setFileType('image');
        } else if (extension === 'pdf') {
          setFileType('pdf');
        } else if (['txt', 'md', 'json', 'csv'].includes(extension)) {
          setFileType('text');
        } else {
          setFileType('other');
        }

        // 파일 다운로드
        const blob = await api.file.download(fileId);
        
        if (!isMounted) {
          return;
        }
        
        // Blob URL 생성
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(err instanceof Error ? err.message : '파일을 불러올 수 없습니다.');
        toast({
          title: '파일 로드 실패',
          description: '파일 미리보기를 불러올 수 없습니다.',
          variant: 'destructive',
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPreview();

    // Cleanup: Blob URL 해제
    return () => {
      isMounted = false;
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [fileId, fileName, toast]);

  const handleDownload = async () => {
    try {
      const blob = await api.file.download(fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: '다운로드 완료',
        description: `${fileName} 파일이 다운로드되었습니다.`,
      });
    } catch (error) {
      toast({
        title: '다운로드 실패',
        description: error instanceof Error ? error.message : '파일 다운로드에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="h-8 w-8 text-primary" />;
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'text':
        return <FileText className="h-8 w-8 text-blue-500" />;
      default:
        return <File className="h-8 w-8 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon()}
              <span className="truncate">{fileName}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                다운로드
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">로딩 중...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <File className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                다운로드로 확인
              </Button>
            </div>
          ) : previewUrl ? (
            <>
              {fileType === 'image' && (
                <div className="flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt={fileName}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                </div>
              )}
              {fileType === 'pdf' && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] border-0 rounded-lg"
                  title={fileName}
                />
              )}
              {fileType === 'text' && (
                <div className="bg-background p-4 rounded-lg border max-h-[70vh] overflow-auto">
                  <p className="text-sm text-muted-foreground mb-4">
                    텍스트 파일은 다운로드하여 확인해주세요.
                  </p>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    다운로드
                  </Button>
                </div>
              )}
              {fileType === 'other' && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <File className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    이 파일 형식은 미리보기를 지원하지 않습니다.
                  </p>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    다운로드하여 확인
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

