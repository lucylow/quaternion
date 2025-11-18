// PATCHED BY CURSOR - phaser hitArea fix - 2024-11-18
// PATCHED BY CURSOR - lovable integration - src/utils/phaserHelpers.js
// Safe helpers to avoid "input.hitAreaCallback is not a function" runtime errors.
// Use these helpers whenever calling setInteractive or assigning hitAreaCallback.

export function applyHitAreaCallbackSafely(input, cb) {
  // PATCHED BY CURSOR - lovable integration: enhanced with better fallbacks
  try {
    if (typeof cb === 'function') { 
      input.hitAreaCallback = cb; 
      return; 
    }
    // try Phaser Geom fallbacks
    if (window.Phaser && window.Phaser.Geom) {
      const G = window.Phaser.Geom;
      if (G.Rectangle && G.Rectangle.Contains) { 
        input.hitAreaCallback = G.Rectangle.Contains; 
        return; 
      }
      if (G.Circle && G.Circle.Contains) { 
        input.hitAreaCallback = G.Circle.Contains; 
        return; 
      }
    }
    input.hitAreaCallback = function() { return true; };
  } catch (err) {
    console.warn('[QUAT DEBUG] applyHitAreaCallbackSafely error', err);
    input.hitAreaCallback = function() { return false; };
  }
}

export function safeSetInteractive(gameObject, hitArea = null, hitAreaCallback = null) {
  // PATCHED BY CURSOR - lovable integration: enhanced safeSetInteractive
  // Accepts same shape as Phaser.GameObjects.GameObject#setInteractive but ensures hitAreaCallback is a function
  try {
    if (!gameObject || typeof gameObject.setInteractive !== 'function') {
      console.warn('[QUAT DEBUG] safeSetInteractive missing setInteractive', gameObject);
      return;
    }
    gameObject.setInteractive(hitArea, hitAreaCallback);
    if (gameObject.input && typeof gameObject.input.hitAreaCallback !== 'function') {
      applyHitAreaCallbackSafely(gameObject.input, hitAreaCallback);
    }
  } catch (err) {
    console.warn('[QUAT DEBUG] safeSetInteractive failed', err);
    try { gameObject.setInteractive(); } catch(e){}
  }
}

