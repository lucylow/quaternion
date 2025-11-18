/**
 * Loading Bar Component
 * Shows progress during asset loading and scene transitions
 */

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface LoadingBarProps {
  progress: number; // 0-100
  message?: string;
  showPercentage?: boolean;
  className?: string;
}

export function LoadingBar({
  progress,
  message = 'Loading...',
  showPercentage = true,
  className,
}: LoadingBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    // Smooth progress animation
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 50);

    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={cn('w-full space-y-2', className)}>
      {message && (
        <p className="text-sm text-muted-foreground text-center">{message}</p>
      )}
      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${displayProgress}%` }}
          role="progressbar"
          aria-valuenow={displayProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={message}
        />
      </div>
      {showPercentage && (
        <p className="text-xs text-muted-foreground text-center">
          {Math.round(displayProgress)}%
        </p>
      )}
    </div>
  );
}

