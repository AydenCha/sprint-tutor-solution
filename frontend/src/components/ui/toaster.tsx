import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isSuccess = variant === 'success';
        const isDestructive = variant === 'destructive';
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 w-full">
              {/* Icon */}
              {(isSuccess || isDestructive) && (
                <div className={cn(
                  "flex-shrink-0 mt-0.5",
                  isSuccess && "text-figma-green-60",
                  isDestructive && "text-red-600"
                )}>
                  {isSuccess && <CheckCircle2 className="h-5 w-5" />}
                  {isDestructive && <XCircle className="h-5 w-5" />}
                </div>
              )}
              
              {/* Content */}
              <div className="flex-1 grid gap-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
              
              {/* Close Button */}
              <ToastClose />
            </div>
            {action}
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
