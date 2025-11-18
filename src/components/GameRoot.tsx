// PATCHED BY CURSOR - 2024-12-19 - safe bootstrap & debug
// src/components/GameRoot.tsx
//
// Single-page canvas mount component that ensures canvas is present, sized, and calls initEngine.
// Adds status debug overlay (tick / fps / entity count).

import { useEffect, useRef, useState } from 'react';
import { initEngine } from '@/engine/startup';
import { loadDevSampleIfNoEntities } from '@/utils/dev_fallback_renderer';

interface GameRootProps {
  className?: string;
}

export default function GameRoot({ className }: GameRootProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<{
    initialized: boolean;
    error: string | null;
    entityCount: number | null;
    fps: number;
    tick: number;
  }>({
    initialized: false,
    error: null,
    entityCount: null,
    fps: 0,
    tick: 0,
  });
  const tickRef = useRef(0);
  const lastFpsUpdate = useRef(0);
  const frameCount = useRef(0);

  useEffect(() => {
    console.log('[QUAT DEBUG] GameRoot mounted');

    const container = containerRef.current;
    if (!container) {
      console.error('[QUAT DEBUG] GameRoot: container ref not found');
      return;
    }

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '1';
    canvas.style.display = 'block';
    canvas.style.background = 'linear-gradient(180deg, #04102a, #020214)';

    // Set canvas size
    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width || window.innerWidth;
      canvas.height = rect.height || window.innerHeight;
      console.log('[QUAT DEBUG] GameRoot: canvas size updated', canvas.width, canvas.height);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    canvasRef.current = canvas;
    container.appendChild(canvas);

    // Initialize engine
    let mounted = true;
    initEngine(canvas)
      .then(() => {
        if (!mounted) return;
        console.log('[QUAT DEBUG] GameRoot: initEngine succeeded');
        setStatus(prev => ({ ...prev, initialized: true }));

        // Check for entities after a short delay
        setTimeout(async () => {
          if (!mounted) return;
          const hasEntities = await loadDevSampleIfNoEntities();
          if (!mounted) return;

          // Try to get entity count
          try {
            const engine = (window as any).quaternionEngine;
            if (engine && typeof engine.getEntityCount === 'function') {
              const count = await engine.getEntityCount();
              setStatus(prev => ({ ...prev, entityCount: count }));
            }
          } catch (e) {
            console.warn('[QUAT DEBUG] GameRoot: failed to get entity count', e);
          }
        }, 1000);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('[QUAT DEBUG] GameRoot: initEngine failed', err);
        setStatus(prev => ({
          ...prev,
          error: err.message || 'Engine initialization failed',
        }));

        // Try fallback renderer
        loadDevSampleIfNoEntities().then(() => {
          if (!mounted) return;
          console.log('[QUAT DEBUG] GameRoot: fallback renderer loaded');
        });
      });

    // FPS tracking
    let lastTime = performance.now();
    const fpsInterval = setInterval(() => {
      if (!mounted) return;
      const now = performance.now();
      const elapsed = now - lastTime;
      if (elapsed > 0) {
        const fps = Math.round((frameCount.current * 1000) / elapsed);
        setStatus(prev => ({ ...prev, fps }));
        frameCount.current = 0;
        lastTime = now;
      }
    }, 1000);

    // Tick counter (increment on each frame)
    const tickInterval = setInterval(() => {
      if (!mounted) return;
      tickRef.current += 1;
      frameCount.current += 1;
      setStatus(prev => ({ ...prev, tick: tickRef.current }));
    }, 16); // ~60fps

    return () => {
      mounted = false;
      window.removeEventListener('resize', updateCanvasSize);
      clearInterval(fpsInterval);
      clearInterval(tickInterval);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Status overlay */}
      {status.initialized && (
        <div
          style={{
            position: 'absolute',
            left: 8,
            top: 8,
            zIndex: 9998,
            fontSize: 12,
            color: '#fff',
            background: 'rgba(0, 0, 0, 0.6)',
            padding: '4px 8px',
            borderRadius: 4,
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          <div>FPS: {status.fps}</div>
          <div>Tick: {status.tick}</div>
          {status.entityCount !== null && <div>Entities: {status.entityCount}</div>}
          {status.error && <div style={{ color: '#ff6b6b' }}>Error: {status.error}</div>}
        </div>
      )}
      {!status.initialized && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9998,
            color: '#fff',
            fontSize: 14,
          }}
        >
          Initializing game engine...
        </div>
      )}
    </div>
  );
}

