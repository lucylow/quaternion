// src/engine/startup.ts

// Robust engine initializer. Tries multiple known entry points and falls back to sample replay loader.
// Adds verbose debug logging with [QUAT DEBUG] prefix.

import Phaser from 'phaser';

export async function initEngine(canvasEl: HTMLCanvasElement | HTMLElement | null): Promise<void> {
  console.log('[QUAT DEBUG] initEngine called', { canvasEl });
  
  if (!canvasEl) {
    throw new Error('initEngine: canvas element missing');
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
  if (window.initQuaternionEngine && typeof window.initQuaternionEngine === 'function') {
    if (await tryCall('window.initQuaternionEngine', window.initQuaternionEngine.bind(window))) {
      return;
    }
  }

  // 2) try a known global engine object
  if (window.quaternionEngine && typeof (window.quaternionEngine as any).attachCanvas === 'function') {
    try {
      (window.quaternionEngine as any).attachCanvas(canvasEl);
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
        window.quaternionEngine = engine;
        console.log('[QUAT DEBUG] createEngine -> engine.attachCanvas ok');
        return;
      }
      if (typeof engine.start === 'function') {
        engine.start({ canvas: canvasEl });
        window.quaternionEngine = engine;
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

  // 5) last resort: load sample replay for debugging so something displays
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
}

