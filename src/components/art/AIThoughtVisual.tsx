/**
 * AI Thought Visualization Component
 * L-system fractal visualization for AI decision processes
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { QuaternionArtPalette } from '@/game/art/ArtPalette';

interface AIThoughtVisualProps {
  type: 'matter' | 'energy' | 'life' | 'knowledge';
  intensity?: number; // 0-1
  size?: number; // pixels
  className?: string;
  animated?: boolean;
}

export function AIThoughtVisual({
  type,
  intensity = 1,
  size = 100,
  className,
  animated = true
}: AIThoughtVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    const palette = QuaternionArtPalette.getPalette(type);
    const color = QuaternionArtPalette.toRGBA(palette.emissive);

    // L-system parameters
    const axiom = 'F';
    const iterations = 3;
    const angle = 25 * (Math.PI / 180);
    const stepLength = size * 0.2;

    // Expand L-system string
    let current = axiom;
    for (let i = 0; i < iterations; i++) {
      current = current.replace(/F/g, 'F[+F]F[-F]F');
    }

    // Turtle graphics state
    interface TurtleState {
      x: number;
      y: number;
      angle: number;
    }

    const stack: TurtleState[] = [];
    let state: TurtleState = {
      x: size / 2,
      y: size * 0.9,
      angle: -Math.PI / 2 // Pointing up
    };

    // Draw function
    const draw = (time: number = 0) => {
      ctx.clearRect(0, 0, size, size);

      // Pulse effect
      const pulse = animated
        ? (Math.sin(time * 0.002) + 1) / 2
        : 1;

      const lineWidth = 1 + pulse * intensity * 2;
      const alpha = 0.4 + pulse * intensity * 0.6;

      ctx.strokeStyle = color.replace('1)', `${alpha})`);
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Reset state
      stack.length = 0;
      state = {
        x: size / 2,
        y: size * 0.9,
        angle: -Math.PI / 2
      };

      // Draw branches
      for (let i = 0; i < current.length; i++) {
        const char = current[i];

        if (char === 'F') {
          const newX = state.x + Math.cos(state.angle) * stepLength * (0.8 + pulse * 0.2);
          const newY = state.y + Math.sin(state.angle) * stepLength * (0.8 + pulse * 0.2);

          ctx.beginPath();
          ctx.moveTo(state.x, state.y);
          ctx.lineTo(newX, newY);
          ctx.stroke();

          // Add glow
          ctx.shadowBlur = 5 * intensity * pulse;
          ctx.shadowColor = color;
          ctx.stroke();

          state.x = newX;
          state.y = newY;
        } else if (char === '+') {
          state.angle += angle * (0.9 + Math.random() * 0.2);
        } else if (char === '-') {
          state.angle -= angle * (0.9 + Math.random() * 0.2);
        } else if (char === '[') {
          stack.push({ ...state });
        } else if (char === ']') {
          const saved = stack.pop();
          if (saved) {
            state = saved;
          }
        }
      }

      // Continue animation
      if (animated) {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };

    // Start animation
    draw(0);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [type, intensity, size, animated]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('block', className)}
      style={{ width: size, height: size }}
    />
  );
}

interface AIThoughtBurstProps {
  type: 'matter' | 'energy' | 'life' | 'knowledge';
  intensity?: number;
  count?: number;
  spread?: number;
  className?: string;
}

/**
 * Multiple thought visuals in a burst pattern
 */
export function AIThoughtBurst({
  type,
  intensity = 1,
  count = 3,
  spread = 120,
  className
}: AIThoughtBurstProps) {
  return (
    <div className={cn('relative inline-block', className)}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = spread * 0.5;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `50%`,
              top: `50%`,
              transform: `translate(${x}px, ${y}px)`,
              opacity: 0.6 + (i / count) * 0.4
            }}
          >
            <AIThoughtVisual
              type={type}
              intensity={intensity * (0.7 + Math.random() * 0.3)}
              size={40 + i * 10}
              animated={true}
            />
          </div>
        );
      })}
    </div>
  );
}


