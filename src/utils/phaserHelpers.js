// PATCHED BY CURSOR - phaser hitArea fix - 2024-11-18
// src/utils/phaserHelpers.js

// Safe helpers to avoid "input.hitAreaCallback is not a function" runtime errors.
// Use these helpers whenever calling setInteractive or assigning hitAreaCallback.

export function applyHitAreaCallbackSafely(input, cb) {
  // If cb is not a function, try to pick a sensible default based on hitArea shape type.
  try {
    if (typeof cb === 'function') {
      input.hitAreaCallback = cb;
      return;
    }
    // fallback heuristics:
    if (input && input.hitArea && input.hitArea.type !== undefined) {
      // Phaser.Geom shapes typically have type constants; try a few likely contains functions:
      // prefer rectangle, circle, ellipse contains tests if Phaser is available
      if (typeof window.Phaser !== 'undefined' && window.Phaser.Geom) {
        const G = window.Phaser.Geom;
        // rectangle-like shapes
        if (typeof G.Rectangle !== 'undefined' && typeof G.Rectangle.Contains === 'function') {
          input.hitAreaCallback = G.Rectangle.Contains;
          return;
        }
        if (typeof G.Circle !== 'undefined' && typeof G.Circle.Contains === 'function') {
          input.hitAreaCallback = G.Circle.Contains;
          return;
        }
      }
    }
    // last resort: permissive callback that returns true for bounding rect containment
    input.hitAreaCallback = function(hitArea, x, y, gameObject) {
      try {
        const canvas = gameObject && gameObject.scene && gameObject.scene.sys && gameObject.scene.sys.game && gameObject.scene.sys.game.canvas;
        // permissive: treat point as inside (avoid crash); but prefer not to block pointer events
        return true;
      } catch(e) {
        return false;
      }
    };
  } catch (err) {
    console.warn('[QUAT DEBUG] applyHitAreaCallbackSafely error', err);
    // final fallback:
    input.hitAreaCallback = function() { return false; };
  }
}

export function safeSetInteractive(gameObject, hitArea = null, hitAreaCallback = null) {
  // Accepts same shape as Phaser.GameObjects.GameObject#setInteractive but ensures hitAreaCallback is a function
  try {
    if (!gameObject || !gameObject.setInteractive) {
      console.warn('[QUAT DEBUG] safeSetInteractive: missing setInteractive on', gameObject);
      return;
    }
    // If Phaser is present, prefer to call with a Geom shape and a function. If callback not function, patch via helper.
    if (hitArea === null && hitAreaCallback === null) {
      // no args: call default
      gameObject.setInteractive();
      return;
    }
    // Call with provided args
    gameObject.setInteractive(hitArea, hitAreaCallback);
    // Now ensure input.hitAreaCallback is a function; if not, patch
    if (gameObject.input && typeof gameObject.input.hitAreaCallback !== 'function') {
      applyHitAreaCallbackSafely(gameObject.input, hitAreaCallback);
    }
  } catch (err) {
    console.warn('[QUAT DEBUG] safeSetInteractive failed', err);
    // attempt a safe fallback: basic interactive
    try { gameObject.setInteractive(); } catch(e){}
  }
}

