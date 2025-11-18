// PATCHED BY CURSOR - phaser hitArea fix - 2024-11-18
/**
 * Safe input utilities for Phaser interactive objects
 * 
 * Provides defensive wrappers around Phaser's input system to prevent
 * TypeError: input.hitAreaCallback is not a function errors
 */

import Phaser from 'phaser';
import { applyHitAreaCallbackSafely } from './phaserHelpers';

/**
 * Safely test if a pointer is inside an interactive object's hit area
 * 
 * @param input - The Phaser input object (e.g., sprite.input)
 * @param x - X coordinate to test
 * @param y - Y coordinate to test
 * @returns true if the point is inside the hit area, false otherwise
 */
export function safeHitTest(
  input: Phaser.Input.InputObject | null | undefined,
  x: number,
  y: number
): boolean {
  if (!input) return false;

  // Check if hitAreaCallback is a function before calling
  if (typeof input.hitAreaCallback === 'function') {
    try {
      return !!input.hitAreaCallback(input.hitArea, x, y);
    } catch (e) {
      console.error('[QUAT DEBUG] hitAreaCallback error', e);
      return false;
    }
  }

  // Fallback: try using hitArea.contains if available
  const h = input.hitArea;
  if (!h) return false;

  if (typeof h.contains === 'function') {
    try {
      return h.contains(x, y);
    } catch (e) {
      return false;
    }
  }

  // Fallback: basic rectangle test
  if ('x' in h && 'y' in h && 'width' in h && 'height' in h) {
    const rect = h as { x: number; y: number; width: number; height: number };
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  // Fallback: circle test
  if ('x' in h && 'y' in h && 'radius' in h) {
    const circle = h as { x: number; y: number; radius: number };
    const dx = x - circle.x;
    const dy = y - circle.y;
    return dx * dx + dy * dy <= circle.radius * circle.radius;
  }

  return false;
}

/**
 * Safely make a game object interactive with proper hit area setup
 * 
 * @param obj - The Phaser game object to make interactive
 * @param options - Configuration options
 */
export function safeSetInteractive(
  obj: Phaser.GameObjects.GameObject,
  options: {
    useHandCursor?: boolean;
    hitArea?: Phaser.Geom.Rectangle | Phaser.Geom.Circle | Phaser.Geom.Ellipse;
    hitAreaCallback?: Phaser.Types.Input.HitAreaCallback;
  } = {}
): void {
  if (!obj || !('setInteractive' in obj)) {
    console.warn('[QUAT DEBUG] safeSetInteractive: object does not support setInteractive', obj);
    return;
  }

  const { useHandCursor = false, hitArea, hitAreaCallback } = options;

  try {
    if (hitArea && hitAreaCallback) {
      // Use explicit geometry and callback
      (obj as any).setInteractive(hitArea, hitAreaCallback);
    } else if (hitArea) {
      // Use geometry with default contains function
      if (hitArea instanceof Phaser.Geom.Rectangle) {
        (obj as any).setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
      } else if (hitArea instanceof Phaser.Geom.Circle) {
        (obj as any).setInteractive(hitArea, Phaser.Geom.Circle.Contains);
      } else if (hitArea instanceof Phaser.Geom.Ellipse) {
        (obj as any).setInteractive(hitArea, Phaser.Geom.Ellipse.Contains);
      } else {
        // Fallback to default interactive area
        (obj as any).setInteractive({ useHandCursor });
      }
    } else {
      // Use default interactive area (bounding box)
      (obj as any).setInteractive({ useHandCursor });
    }

    // Validate that input was created correctly
    if ((obj as any).input) {
      const input = (obj as any).input;
      if (input.hitAreaCallback && typeof input.hitAreaCallback !== 'function') {
        console.warn(
          '[QUAT DEBUG] hitAreaCallback is not a function after setInteractive',
          obj,
          input
        );
        // PATCHED BY CURSOR - phaser hitArea fix - 2024-11-18
        // Use helper to safely apply callback
        applyHitAreaCallbackSafely(input, hitAreaCallback);
      } else if (!input.hitAreaCallback || typeof input.hitAreaCallback !== 'function') {
        // Ensure callback exists even if not provided
        applyHitAreaCallbackSafely(input, hitAreaCallback);
      }
    }
  } catch (e) {
    console.error('[QUAT DEBUG] safeSetInteractive error', e, obj);
  }
}

/**
 * Debug helper to inspect an interactive object's input state
 */
export function debugInteractive(
  obj: Phaser.GameObjects.GameObject,
  label: string = 'interactive'
): void {
  try {
    const input = (obj as any).input;
    console.log(`[QUAT DEBUG] ${label}:`, {
      hasInput: !!input,
      hasHitArea: !!input?.hitArea,
      hitAreaType: input?.hitArea?.constructor?.name,
      hasHitAreaCallback: !!input?.hitAreaCallback,
      hitAreaCallbackType: typeof input?.hitAreaCallback,
      input: input
    });
  } catch (e) {
    console.warn(`[QUAT DEBUG] debugInteractive failed for ${label}`, e);
  }
}

