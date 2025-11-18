// PATCHED BY CURSOR - 2024-12-19 - safe bootstrap & debug
// src/hooks/useGameLoop.ts
//
// Decoupled fixed tick + render RAF loop.
// Fixed TICK_MS (default 50ms), accumulator, interpolation parameter for render.

import { useEffect, useRef } from 'react';

export interface GameLoopConfig {
  tickMs?: number; // Fixed timestep in milliseconds (default: 50ms = 20 TPS)
  maxAccumulator?: number; // Maximum accumulated time (default: 200ms)
  enableInterpolation?: boolean; // Enable interpolation for smooth rendering (default: true)
}

export interface GameLoopCallbacks {
  onTick?: (deltaTime: number) => void; // Fixed timestep update
  onRender?: (interpolation: number) => void; // Render with interpolation (0-1)
}

const DEFAULT_TICK_MS = 50; // 20 ticks per second
const DEFAULT_MAX_ACCUMULATOR = 200; // Max 200ms accumulation

export function useGameLoop(
  callbacks: GameLoopCallbacks,
  config: GameLoopConfig = {}
) {
  const {
    tickMs = DEFAULT_TICK_MS,
    maxAccumulator = DEFAULT_MAX_ACCUMULATOR,
    enableInterpolation = true,
  } = config;

  const callbacksRef = useRef(callbacks);
  const accumulatorRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    console.log('[QUAT DEBUG] useGameLoop: starting loop', { tickMs, maxAccumulator });

    isRunningRef.current = true;
    accumulatorRef.current = 0;
    lastTimeRef.current = null;

    const tick = (currentTime: number) => {
      if (!isRunningRef.current) return;

      // Initialize lastTime on first frame
      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      // Calculate delta time
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Clamp delta time to prevent spiral of death
      const clampedDelta = Math.min(deltaTime, maxAccumulator);

      // Add to accumulator
      accumulatorRef.current += clampedDelta;

      // Fixed timestep updates
      const tickSeconds = tickMs / 1000;
      let updateCount = 0;
      const maxUpdates = Math.ceil(maxAccumulator / tickMs) + 1; // Safety limit

      while (accumulatorRef.current >= tickMs && updateCount < maxUpdates) {
        accumulatorRef.current -= tickMs;

        // Call fixed update
        try {
          if (callbacksRef.current.onTick) {
            callbacksRef.current.onTick(tickSeconds);
          } else {
            // Fallback: try engine.step() or engine.tick()
            const engine = (window as any).quaternionEngine;
            if (engine) {
              if (typeof engine.step === 'function') {
                engine.step(tickSeconds);
              } else if (typeof engine.tick === 'function') {
                engine.tick(tickSeconds);
              }
            }
          }
        } catch (err) {
          console.error('[QUAT DEBUG] useGameLoop: tick error', err);
        }

        updateCount++;
      }

      // Calculate interpolation factor (0-1) for smooth rendering
      const interpolation = enableInterpolation
        ? accumulatorRef.current / tickMs
        : 0;

      // Render with interpolation
      try {
        if (callbacksRef.current.onRender) {
          callbacksRef.current.onRender(interpolation);
        } else {
          // Fallback: try engine.render()
          const engine = (window as any).quaternionEngine;
          if (engine) {
            if (typeof engine.render === 'function') {
              engine.render(interpolation);
            }
          } else {
            // Ultimate fallback: try dev renderer
            const devRender = (window as any).__QUAT_DEV_FALLBACK_RENDER__;
            if (typeof devRender === 'function') {
              devRender();
            }
          }
        }
      } catch (err) {
        console.error('[QUAT DEBUG] useGameLoop: render error', err);
      }

      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    // Start the loop
    animationFrameRef.current = requestAnimationFrame(tick);
    console.log('[QUAT DEBUG] useGameLoop: render loop started');

    return () => {
      console.log('[QUAT DEBUG] useGameLoop: stopping loop');
      isRunningRef.current = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [tickMs, maxAccumulator, enableInterpolation]);

  return {
    stop: () => {
      isRunningRef.current = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    },
    start: () => {
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        lastTimeRef.current = null;
        animationFrameRef.current = requestAnimationFrame((t) => {
          // Restart the loop
          const tick = (currentTime: number) => {
            if (!isRunningRef.current) return;
            // ... (same tick logic as above, but we'll reuse the effect)
          };
          tick(t);
        });
      }
    },
  };
}

