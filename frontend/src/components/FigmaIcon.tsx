import { cn } from '@/lib/utils';
import { useState } from 'react';

interface FigmaIconProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
}

/**
 * Figma Icon Component
 * Displays Figma SVG icons with fallback support
 */
export function FigmaIcon({ src, alt, className, style, fallback }: FigmaIconProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={cn('block', className)}
      style={style}
      onError={() => setHasError(true)}
    />
  );
}
