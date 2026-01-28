import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Eye, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = '마크다운 형식으로 작성하세요...',
  className,
  minHeight = '400px'
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  return (
    <div className={cn("space-y-2", className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">
            <FileText className="h-4 w-4 mr-2" />
            작성
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            미리보기
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="font-mono"
            style={{ minHeight }}
          />
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>마크다운 사용 팁:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li><code># 제목</code> - 큰 제목</li>
              <li><code>## 소제목</code> - 중간 제목</li>
              <li><code>**굵게**</code> - <strong>굵게</strong></li>
              <li><code>- 항목</code> - 글머리 기호</li>
              <li><code>[링크](url)</code> - 링크</li>
            </ul>
            <p className="mt-2">📄 <strong>Notion에서 가져오기:</strong> Notion 페이지 → 우측 상단 ⋯ → Export → Markdown & CSV → 내용 복사/붙여넣기</p>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div 
            className="rounded-lg border bg-muted/20 p-6 overflow-auto"
            style={{ minHeight }}
          >
            {value.trim() ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  components={{
                  h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-5 mb-3" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />,
                  p: ({node, ...props}) => <p className="my-3 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside my-3 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside my-3 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="ml-4" {...props} />,
                  code: ({node, inline, ...props}: any) => 
                    inline ? 
                      <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono" {...props} /> : 
                      <code className="block p-4 bg-muted rounded my-3 font-mono text-sm overflow-x-auto" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic my-3" {...props} />,
                  a: ({node, ...props}) => <a className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer" {...props} />,
                  hr: ({node, ...props}) => <hr className="my-6 border-t-2" {...props} />,
                  table: ({node, ...props}) => <div className="overflow-x-auto my-3"><table className="min-w-full border-collapse border" {...props} /></div>,
                  th: ({node, ...props}) => <th className="border px-4 py-2 bg-muted font-semibold" {...props} />,
                  td: ({node, ...props}) => <td className="border px-4 py-2" {...props} />,
                }}
                >
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                미리보기할 내용이 없습니다.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
