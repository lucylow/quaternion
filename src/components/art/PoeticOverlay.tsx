/**
 * Poetic Text Overlay Component
 * Displays AI-generated poetic lines with typewriter and parallax effects
 */

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface PoeticOverlayProps {
  text: string;
  duration?: number; // seconds to display
  charDelay?: number; // seconds between characters
  onComplete?: () => void;
  className?: string;
  style?: 'ambient' | 'dramatic' | 'subtle';
}

export function PoeticOverlay({
  text,
  duration = 6,
  charDelay = 0.03,
  onComplete,
  className,
  style = 'ambient'
}: PoeticOverlayProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [opacity, setOpacity] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // Typewriter effect
  useEffect(() => {
    if (!text) return;

    setOpacity(1);
    setDisplayedText('');
    setIsTyping(true);

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);

        // Hold text, then fade out
        const holdTimer = setTimeout(() => {
          let fadeTime = 0;
          const fadeInterval = setInterval(() => {
            fadeTime += 0.016; // ~60fps
            const newOpacity = Math.max(0, 1 - fadeTime / 0.8);
            setOpacity(newOpacity);

            if (newOpacity <= 0) {
              clearInterval(fadeInterval);
              setDisplayedText('');
              onComplete?.();
            }
          }, 16);
        }, duration * 1000);

        return () => clearTimeout(holdTimer);
      }
    }, charDelay * 1000);

    return () => clearInterval(interval);
  }, [text, charDelay, duration, onComplete]);

  // Parallax effect
  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!textRef.current) return;
      
      const rect = containerRef.current!.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / rect.width;
      const deltaY = (e.clientY - centerY) / rect.height;
      
      const parallaxAmount = 10;
      textRef.current.style.transform = `translate(${deltaX * parallaxAmount}px, ${deltaY * parallaxAmount}px)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!text) return null;

  const styleClasses = {
    ambient: 'text-white/90 backdrop-blur-sm',
    dramatic: 'text-white drop-shadow-lg font-bold',
    subtle: 'text-white/70 backdrop-blur-[2px]'
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 pointer-events-none flex items-center justify-center z-50',
        className
      )}
      style={{ opacity }}
    >
      <div
        ref={textRef}
        className={cn(
          'max-w-2xl px-8 py-6 text-center text-lg md:text-xl lg:text-2xl',
          'font-serif italic leading-relaxed',
          styleClasses[style],
          'transition-transform duration-300 ease-out'
        )}
      >
        {displayedText}
        {isTyping && (
          <span className="inline-block w-0.5 h-6 bg-current ml-1 animate-pulse" />
        )}
      </div>
    </div>
  );
}

