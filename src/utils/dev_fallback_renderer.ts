// src/utils/dev_fallback_renderer.ts

// Simple canvas fallback renderer: draws sample entities when engine has none.
// Exposes loadDevSampleIfNoEntities() used by GameRoot.

export async function loadDevSampleIfNoEntities(): Promise<boolean> {
  try {
    // attempt to call engine.getEntityCount if present
    const getCount = (window as any).quaternionEngine?.getEntityCount;
    let count: number | null = null;
    
    if (typeof getCount === 'function') {
      count = await getCount();
      console.log('[QUAT DEBUG] engine.getEntityCount ->', count);
    }
    
    if (count && count > 0 && !(window as any).__QUAT_FORCE_LOAD_SAMPLE__) {
      return false;
    }

    // fetch a sample set if available
    const url = '/fixtures/sample-replay.json';
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error('sample file not found');
    const sample = await resp.json();
    
    // create lightweight sample renderer on window that draws simple shapes
    (window as any).__QUAT_DEV_SAMPLE__ = sample;
    (window as any).__QUAT_DEV_FALLBACK_RENDER__ = function() {
      const canvas = document.getElementById('game-canvas') || document.querySelector('canvas');
      if (!canvas) return;
      
      const ctx = (canvas as HTMLCanvasElement).getContext('2d');
      if (!ctx) return;
      
      const w = (canvas as HTMLCanvasElement).width || canvas.clientWidth;
      const h = (canvas as HTMLCanvasElement).height || canvas.clientHeight;
      
      ctx.clearRect(0, 0, w, h);
      
      // background
      ctx.fillStyle = '#04102a';
      ctx.fillRect(0, 0, w, h);
      
      // draw a few sample "units" from sample.replay if present, else draw default
      const units = (sample && (sample.entities || sample.actions)) 
        ? (sample.entities || [
            { x: 0.2, y: 0.5, type: 'worker' },
            { x: 0.6, y: 0.4, type: 'tank' }
          ])
        : [
            { x: 0.2, y: 0.5, type: 'worker' },
            { x: 0.6, y: 0.4, type: 'tank' }
          ];
      
      units.forEach((u: any, i: number) => {
        const cx = (u.x || Math.random()) * w;
        const cy = (u.y || Math.random()) * h;
        
        ctx.beginPath();
        ctx.fillStyle = (u.type === 'tank' ? '#ff9e3b' : '#6ce2a0');
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#023';
        ctx.font = '12px sans-serif';
        ctx.fillText(u.type || 'unit', cx - 20, cy + 30);
      });
      
      // draw sample objective
      ctx.strokeStyle = '#59f';
      ctx.lineWidth = 2;
      ctx.strokeRect(w / 2 - 40, h / 2 - 40, 80, 80);
    };
    
    console.log('[QUAT DEBUG] sample renderer installed');
    return true;
  } catch (err) {
    console.warn('[QUAT DEBUG] dev fallback failed', err);
    return false;
  }
}

