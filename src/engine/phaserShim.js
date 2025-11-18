// PATCHED BY CURSOR - 2024-12-19 - safe bootstrap & debug
// src/engine/phaserShim.js
//
// Phaser compatibility shim to prevent "input.hitAreaCallback is not a function" errors.
// This shim runs early at app bootstrap to monkey-patch Phaser's input system.

console.log('[QUAT DEBUG] phaserShim: installing Phaser input compatibility shims');

// Wait for Phaser to be available
function installPhaserShim() {
  if (typeof window === 'undefined') return;
  
  // Check if Phaser is already loaded
  if (typeof window.Phaser === 'undefined') {
    // Wait a bit and try again
    setTimeout(installPhaserShim, 100);
    return;
  }

  const Phaser = window.Phaser;
  console.log('[QUAT DEBUG] phaserShim: Phaser detected, installing shims');

  // Monkey-patch InputPlugin.setHitArea to ensure hitAreaCallback is always a function
  try {
    if (Phaser.Input && Phaser.Input.InputPlugin) {
      const InputPlugin = Phaser.Input.InputPlugin;
      const originalSetHitArea = InputPlugin.prototype.setHitArea;

      if (originalSetHitArea) {
        InputPlugin.prototype.setHitArea = function(hitArea, callback) {
          // Ensure callback is a function
          if (callback && typeof callback !== 'function') {
            console.warn('[QUAT DEBUG] phaserShim: hitAreaCallback is not a function, replacing with safe fallback', callback);
            // Try to infer a safe callback based on hitArea type
            if (hitArea && Phaser.Geom) {
              if (hitArea instanceof Phaser.Geom.Rectangle || (hitArea.type === Phaser.Geom.RECTANGLE)) {
                callback = Phaser.Geom.Rectangle.Contains;
              } else if (hitArea instanceof Phaser.Geom.Circle || (hitArea.type === Phaser.Geom.CIRCLE)) {
                callback = Phaser.Geom.Circle.Contains;
              } else if (hitArea instanceof Phaser.Geom.Ellipse || (hitArea.type === Phaser.Geom.ELLIPSE)) {
                callback = Phaser.Geom.Ellipse.Contains;
              } else {
                // Fallback: permissive callback
                callback = function() { return true; };
              }
            } else {
              // Ultimate fallback
              callback = function() { return true; };
            }
          } else if (!callback && hitArea) {
            // If no callback provided but hitArea exists, try to infer one
            if (Phaser.Geom) {
              if (hitArea instanceof Phaser.Geom.Rectangle || (hitArea.type === Phaser.Geom.RECTANGLE)) {
                callback = Phaser.Geom.Rectangle.Contains;
              } else if (hitArea instanceof Phaser.Geom.Circle || (hitArea.type === Phaser.Geom.CIRCLE)) {
                callback = Phaser.Geom.Circle.Contains;
              } else if (hitArea instanceof Phaser.Geom.Ellipse || (hitArea.type === Phaser.Geom.ELLIPSE)) {
                callback = Phaser.Geom.Ellipse.Contains;
              }
            }
          }

          // Call original with safe callback
          return originalSetHitArea.call(this, hitArea, callback);
        };
        console.log('[QUAT DEBUG] phaserShim: InputPlugin.setHitArea patched');
      }
    }
  } catch (err) {
    console.warn('[QUAT DEBUG] phaserShim: failed to patch InputPlugin.setHitArea', err);
  }

  // Also patch GameObject.setInteractive if possible
  try {
    if (Phaser.GameObjects && Phaser.GameObjects.GameObject) {
      const GameObject = Phaser.GameObjects.GameObject;
      const originalSetInteractive = GameObject.prototype.setInteractive;

      if (originalSetInteractive) {
        GameObject.prototype.setInteractive = function(hitArea, callback, dropZone) {
          // Ensure callback is a function if provided
          if (callback && typeof callback !== 'function') {
            console.warn('[QUAT DEBUG] phaserShim: setInteractive callback is not a function, replacing', callback);
            if (hitArea && Phaser.Geom) {
              if (hitArea instanceof Phaser.Geom.Rectangle || (hitArea.type === Phaser.Geom.RECTANGLE)) {
                callback = Phaser.Geom.Rectangle.Contains;
              } else if (hitArea instanceof Phaser.Geom.Circle || (hitArea.type === Phaser.Geom.CIRCLE)) {
                callback = Phaser.Geom.Circle.Contains;
              } else if (hitArea instanceof Phaser.Geom.Ellipse || (hitArea.type === Phaser.Geom.ELLIPSE)) {
                callback = Phaser.Geom.Ellipse.Contains;
              } else {
                callback = function() { return true; };
              }
            } else {
              callback = function() { return true; };
            }
          }

          // Call original
          const result = originalSetInteractive.call(this, hitArea, callback, dropZone);

          // Post-patch: ensure input.hitAreaCallback is a function
          if (this.input && this.input.hitAreaCallback && typeof this.input.hitAreaCallback !== 'function') {
            console.warn('[QUAT DEBUG] phaserShim: post-patch fix needed for', this);
            if (this.input.hitArea && Phaser.Geom) {
              const h = this.input.hitArea;
              if (h instanceof Phaser.Geom.Rectangle || (h.type === Phaser.Geom.RECTANGLE)) {
                this.input.hitAreaCallback = Phaser.Geom.Rectangle.Contains;
              } else if (h instanceof Phaser.Geom.Circle || (h.type === Phaser.Geom.CIRCLE)) {
                this.input.hitAreaCallback = Phaser.Geom.Circle.Contains;
              } else if (h instanceof Phaser.Geom.Ellipse || (h.type === Phaser.Geom.ELLIPSE)) {
                this.input.hitAreaCallback = Phaser.Geom.Ellipse.Contains;
              } else {
                this.input.hitAreaCallback = function() { return true; };
              }
        } else {
              this.input.hitAreaCallback = function() { return true; };
            }
        }

          return result;
      };
        console.log('[QUAT DEBUG] phaserShim: GameObject.setInteractive patched');
      }
    }
  } catch (err) {
    console.warn('[QUAT DEBUG] phaserShim: failed to patch GameObject.setInteractive', err);
  }

  console.log('[QUAT DEBUG] phaserShim: installation complete');
}

// Install immediately if Phaser is already loaded, otherwise wait
if (typeof window !== 'undefined') {
  if (typeof window.Phaser !== 'undefined') {
    installPhaserShim();
  } else {
    // Try to install when Phaser loads
    const originalAddEventListener = window.addEventListener;
    window.addEventListener('load', installPhaserShim, { once: true });
    // Also try periodically (in case Phaser loads after 'load' event)
    setTimeout(installPhaserShim, 500);
    setTimeout(installPhaserShim, 1000);
    setTimeout(installPhaserShim, 2000);
  }
}
