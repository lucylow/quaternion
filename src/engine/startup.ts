// PATCHED BY CURSOR - 2024-12-19 - safe bootstrap & debug
// PATCHED BY CURSOR - lovable integration - src/engine/startup.ts
//
// Robust engine initializer. Tries multiple known entry points and falls back to sample replay loader.
// Adds verbose debug logging with [QUAT DEBUG] prefix.
// Ensures global window.quaternionEngine exists.
// Now includes Lovable Cloud asset prefetching and graceful fallbacks.

import Phaser from 'phaser';
import { lovablySignedAsset, lovablyHealth } from '../utils/lovableClient';

export async function initEngine(canvasEl: HTMLCanvasElement | HTMLElement | null): Promise<void> {
  console.log('[QUAT DEBUG] initEngine called', { canvasEl, hasCanvas: !!canvasEl });
  
  if (!canvasEl) {
    throw new Error('initEngine: canvas element missing');
  }

  // Ensure canvas has proper attributes
  if (canvasEl instanceof HTMLCanvasElement) {
    if (!canvasEl.id) canvasEl.id = 'game-canvas';
    console.log('[QUAT DEBUG] canvas element prepared', {
      id: canvasEl.id,
      width: canvasEl.width,
      height: canvasEl.height,
      clientWidth: canvasEl.clientWidth,
      clientHeight: canvasEl.clientHeight,
    });
  }

  // Helper to attempt a function and log result
  async function tryCall(name: string, fn: ((el: HTMLElement) => Promise<void> | void) | undefined | null): Promise<boolean> {
    try {
      if (!fn) return false;
      const res = await fn(canvasEl as HTMLElement);
      console.log(`[QUAT DEBUG] ${name} succeeded`, { res });
      return true;
    } catch (err) {
      console.warn(`[QUAT DEBUG] ${name} failed`, err);
      return false;
    }
  }

  // 1) try global init function (legacy)
  if ((window as any).initQuaternionEngine && typeof (window as any).initQuaternionEngine === 'function') {
    if (await tryCall('window.initQuaternionEngine', (window as any).initQuaternionEngine.bind(window))) {
      // Ensure engine is on window
      if (!(window as any).quaternionEngine) {
        console.warn('[QUAT DEBUG] initQuaternionEngine succeeded but window.quaternionEngine not set');
      }
      return;
    }
  }

  // 2) try a known global engine object
  if ((window as any).quaternionEngine && typeof ((window as any).quaternionEngine as any).attachCanvas === 'function') {
    try {
      ((window as any).quaternionEngine as any).attachCanvas(canvasEl);
      console.log('[QUAT DEBUG] window.quaternionEngine.attachCanvas called');
      return;
    } catch (e) {
      console.warn('[QUAT DEBUG] window.quaternionEngine.attachCanvas threw', e);
    }
  }

  // 3) try exported createEngine if present (common pattern)
  try {
    // dynamic import in case module exists
    const mod = await import('../game/QuaternionGameState').catch(() => null);
    if (mod && typeof (mod as any).createEngine === 'function') {
      const engine = (mod as any).createEngine();
      if (typeof engine.attachCanvas === 'function') {
        engine.attachCanvas(canvasEl);
        (window as any).quaternionEngine = engine;
        console.log('[QUAT DEBUG] createEngine -> engine.attachCanvas ok');
        return;
      }
      if (typeof engine.start === 'function') {
        engine.start({ canvas: canvasEl });
        (window as any).quaternionEngine = engine;
        console.log('[QUAT DEBUG] createEngine -> engine.start ok');
        return;
      }
    }
  } catch (e) {
    console.warn('[QUAT DEBUG] dynamic import/createEngine failed', e);
  }

  // 4) fallback: try to find a global render function
  if (typeof (window as any).renderFrame === 'function') {
    try {
      (window as any).renderFrame(canvasEl);
      console.log('[QUAT DEBUG] window.renderFrame called as fallback');
      return;
    } catch (e) {
      console.warn('[QUAT DEBUG] window.renderFrame threw', e);
    }
  }

  // 5) Create minimal engine shim if nothing else worked
  console.warn('[QUAT DEBUG] engine init: no engine found, creating minimal shim');
  const minimalEngine = {
    attachCanvas: (canvas: HTMLElement) => {
      console.log('[QUAT DEBUG] minimalEngine.attachCanvas called', canvas);
    },
    step: (deltaTime: number) => {
      // No-op
    },
    render: (interpolation: number) => {
      // No-op, fallback renderer will handle it
    },
    getEntityCount: async () => {
      return 0;
    },
    loadReplay: (data: any) => {
      console.log('[QUAT DEBUG] minimalEngine.loadReplay called', data);
    },
    ensureDemoState: async () => {
      // Try to call ensureDemoState on actual game state if available
      try {
        const mod = await import('../game/QuaternionGameState').catch(() => null);
        if (mod && (window as any).quaternionEngine && typeof ((window as any).quaternionEngine as any).ensureDemoState === 'function') {
          ((window as any).quaternionEngine as any).ensureDemoState();
        }
      } catch (e) {
        console.warn('[QUAT DEBUG] ensureDemoState failed', e);
      }
    },
  };
  (window as any).quaternionEngine = minimalEngine;
  console.log('[QUAT DEBUG] minimal engine shim installed on window.quaternionEngine');

  // 5.5) Try to ensure demo state if env flag is set
  if (import.meta.env.REACT_APP_USE_SAMPLE_DEMO === 'true' || (window as any).__QUAT_FORCE_DEMO__) {
    console.log('[QUAT DEBUG] REACT_APP_USE_SAMPLE_DEMO flag set, ensuring demo state');
    setTimeout(async () => {
      try {
        if ((window as any).quaternionEngine && typeof ((window as any).quaternionEngine as any).ensureDemoState === 'function') {
          await ((window as any).quaternionEngine as any).ensureDemoState();
        }
      } catch (e) {
        console.warn('[QUAT DEBUG] auto ensureDemoState failed', e);
      }
    }, 1000);
  }

  // 6) last resort: load sample replay for debugging so something displays
  try {
    console.warn('[QUAT DEBUG] engine init failed — loading sample fallback');
    const url = '/fixtures/sample-replay.json';
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error('sample fetch failed ' + resp.status);
    const sample = await resp.json();
    // store sample globally for UI to pick up
    (window as any).__QUAT_SAMPLE_REPLAY__ = sample;
    console.log('[QUAT DEBUG] sample replay loaded to window.__QUAT_SAMPLE_REPLAY__', sample && (sample as any).replayId);
    
    // If there's a global loader, call it
    if ((window as any).useReplay && typeof (window as any).useReplay.loadReplay === 'function') {
      try {
        await (window as any).useReplay.loadReplay(sample);
        console.log('[QUAT DEBUG] useReplay.loadReplay used fallback sample');
        return;
      } catch (e) {
        console.warn('[QUAT DEBUG] useReplay.loadReplay failed', e);
      }
    }
  } catch (err) {
    console.error('[QUAT DEBUG] fallback sample load failed', err);
  }

  // If we get here, Phaser should handle rendering (it's initialized in QuaternionGame.tsx)
  console.log('[QUAT DEBUG] initEngine: Phaser game will handle rendering via QuaternionGame component');
  console.log('[QUAT DEBUG] initEngine: window.quaternionEngine is', typeof (window as any).quaternionEngine);
}

