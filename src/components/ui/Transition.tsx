/**
 * Transition Component
 * Provides smooth transitions between states (150-300ms)
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TransitionProps {
  children: ReactNode;
  show: boolean;
  duration?: number; // milliseconds
  type?: 'fade' | 'slide' | 'scale' | 'slide-fade';
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export function Transition({
  children,
  show,
  duration = 200,
  type = 'fade',
  direction = 'up',
  className,
}: TransitionProps) {
  const baseClasses = 'transition-all ease-in-out';
  // Duration handled via inline style

  const typeClasses = {
    fade: show ? 'opacity-100' : 'opacity-0',
    slide: show
      ? direction === 'up'
        ? 'translate-y-0'
        : direction === 'down'
        ? 'translate-y-0'
        : direction === 'left'
        ? 'translate-x-0'
        : 'translate-x-0'
      : direction === 'up'
      ? 'translate-y-4'
      : direction === 'down'
      ? '-translate-y-4'
      : direction === 'left'
      ? 'translate-x-4'
      : '-translate-x-4',
    scale: show ? 'scale-100' : 'scale-95',
    'slide-fade': show
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 translate-y-4',
  };

  if (!show && type !== 'fade') {
    return null;
  }

  return (
    <div
      className={cn(
        baseClasses,
        durationClass,
        typeClasses[type],
        !show && type === 'fade' && 'pointer-events-none',
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

