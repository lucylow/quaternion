import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

interface TouchControlsConfig {
  enablePan?: boolean;
  enableZoom?: boolean;
  enableTap?: boolean;
  longPressDuration?: number;
}

export const useTouchControls = (
  scene: Phaser.Scene | null,
  config: TouchControlsConfig = {}
) => {
  const {
    enablePan = true,
    enableZoom = true,
    enableTap = true,
    longPressDuration = 500
  } = config;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!scene) return;

    // Touch start
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && pointer.wasTouch) {
        touchStartRef.current = {
          x: pointer.worldX,
          y: pointer.worldY,
          time: Date.now()
        };

        // Long press detection
        longPressTimerRef.current = window.setTimeout(() => {
          scene.events.emit('long-press', {
            worldX: pointer.worldX,
            worldY: pointer.worldY,
            screenX: pointer.x,
            screenY: pointer.y
          });
        }, longPressDuration);
      }
    });

    // Touch move - pan camera
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && pointer.wasTouch && enablePan && touchStartRef.current) {
        // Cancel long press if moving
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        const deltaX = touchStartRef.current.x - pointer.worldX;
        const deltaY = touchStartRef.current.y - pointer.worldY;

        const camera = scene.cameras.main;
        camera.scrollX += deltaX;
        camera.scrollY += deltaY;

        touchStartRef.current = {
          x: pointer.worldX,
          y: pointer.worldY,
          time: Date.now()
        };
      }
    });

    // Touch end
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.wasTouch && touchStartRef.current) {
        // Cancel long press
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        const timeDelta = Date.now() - touchStartRef.current.time;
        const dist = Phaser.Math.Distance.Between(
          touchStartRef.current.x,
          touchStartRef.current.y,
          pointer.worldX,
          pointer.worldY
        );

        // Single tap
        if (timeDelta < 200 && dist < 10 && enableTap) {
          scene.events.emit('tap', {
            worldX: pointer.worldX,
            worldY: pointer.worldY,
            screenX: pointer.x,
            screenY: pointer.y
          });
        }

        touchStartRef.current = null;
      }
    });

    // Pinch zoom
    if (enableZoom) {
      let initialDistance = 0;
      let initialZoom = 1;

      scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (scene.input.pointers.length === 2) {
          const p1 = scene.input.pointers[0];
          const p2 = scene.input.pointers[1];
          initialDistance = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
          initialZoom = scene.cameras.main.zoom;
        }
      });

      scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (scene.input.pointers.length === 2) {
          const p1 = scene.input.pointers[0];
          const p2 = scene.input.pointers[1];
          const currentDistance = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
          const zoomDelta = (currentDistance - initialDistance) * 0.001;
          const newZoom = Phaser.Math.Clamp(initialZoom + zoomDelta, 0.5, 2.0);
          scene.cameras.main.setZoom(newZoom);
        }
      });
    }

    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [scene, enablePan, enableZoom, enableTap, longPressDuration]);

  return {};
};

