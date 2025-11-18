// PATCHED BY CURSOR - phaser hitArea fix - 2024-11-18
// src/engine/phaserShim.js

// Run this early during app bootstrap to patch Phaser input behaviors.

export function applyPhaserInputShims() {
  try {
    if (typeof window.Phaser === 'undefined') {
      console.warn('[QUAT DEBUG] Phaser not detected; skipping input shims');
      return;
    }
    const InputPlugin = window.Phaser && window.Phaser.Input && window.Phaser.Input.InputPlugin;
    if (InputPlugin && InputPlugin.prototype && !InputPlugin.prototype.__QUAT_SHIMMED__) {
      const proto = InputPlugin.prototype;
      proto.__QUAT_SHIMMED__ = true;
      const originalSetHitArea = proto.setHitArea || null;
      proto.setHitArea = function(gameObject, hitArea, callback, dropZone) {
        try {
          // if callback is not a function, replace with sensible default
          if (typeof callback !== 'function') {
            // choose default based on hitArea type if possible
            if (window.Phaser && window.Phaser.Geom) {
              if (window.Phaser.Geom.Rectangle && typeof window.Phaser.Geom.Rectangle.Contains === 'function') {
                callback = window.Phaser.Geom.Rectangle.Contains;
              } else if (window.Phaser.Geom.Circle && typeof window.Phaser.Geom.Circle.Contains === 'function') {
                callback = window.Phaser.Geom.Circle.Contains;
              } else {
                callback = function(hitArea, x, y) { return true; };
              }
            } else {
              callback = function() { return true; };
            }
          }
        } catch(e) {
          console.warn('[QUAT DEBUG] setHitArea shim choose callback error', e);
          callback = function() { return true; };
        }
        if (originalSetHitArea) {
          return originalSetHitArea.call(this, gameObject, hitArea, callback, dropZone);
        } else {
          // fallback: call original setInteractive to ensure interactive state
          try { gameObject.setInteractive(hitArea, callback); } catch(e){}
          return gameObject;
        }
      };
      console.log('[QUAT DEBUG] Phaser InputPlugin.setHitArea shim installed');
    }
  } catch (err) {
    console.error('[QUAT DEBUG] applyPhaserInputShims error', err);
  }
}

