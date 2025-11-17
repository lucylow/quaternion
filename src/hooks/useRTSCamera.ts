import { useRef, useEffect } from 'react';
import Phaser from 'phaser';

interface CameraConfig {
  panSpeed?: number;
  edgeScrollThickness?: number;
  zoomSpeed?: number;
  minZoom?: number;
  maxZoom?: number;
  enableEdgeScroll?: boolean;
}

export const useRTSCamera = (
  camera: Phaser.Cameras.Scene2D.CameraManager | Phaser.Cameras.Scene2D.Camera | null,
  config: CameraConfig = {}
) => {
  const {
    panSpeed = 200,
    edgeScrollThickness = 10,
    zoomSpeed = 0.1,
    minZoom = 0.5,
    maxZoom = 2.0,
    enableEdgeScroll = true
  } = config;

  const cameraRef = useRef<Phaser.Cameras.Scene2D.Camera | null>(null);

  useEffect(() => {
    if (!camera) return;

    // Get the main camera
    cameraRef.current = camera instanceof Phaser.Cameras.Scene2D.CameraManager 
      ? camera.main 
      : camera;

    if (!cameraRef.current) return;

    // Set initial zoom
    cameraRef.current.setZoom(1.0);
  }, [camera]);

  const setupCameraControls = (
    scene: Phaser.Scene,
    mapWidth: number,
    mapHeight: number,
    worldWidth: number,
    worldHeight: number
  ) => {
    if (!cameraRef.current) return;

    const mainCamera = cameraRef.current;

    // Set camera bounds
    mainCamera.setBounds(0, 0, worldWidth, worldHeight);

    // Keyboard controls (WASD + Arrows)
    const cursors = scene.input.keyboard?.createCursorKeys();
    const wasd = scene.input.keyboard?.addKeys('W,S,A,D') as {
      W: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };

    // Edge scrolling
    let isScrolling = false;

    // Mouse wheel zoom
    scene.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number, deltaZ: number) => {
      const zoom = mainCamera.zoom;
      const zoomDelta = deltaY > 0 ? -zoomSpeed : zoomSpeed;
      const newZoom = Phaser.Math.Clamp(zoom + zoomDelta, minZoom, maxZoom);
      mainCamera.setZoom(newZoom);
    });

    // Update function for camera movement
    const updateCamera = (time: number, delta: number) => {
      if (!mainCamera) return;

      const speed = (panSpeed * delta) / 1000;
      let moveX = 0;
      let moveY = 0;

      // Keyboard controls
      if (cursors) {
        if (cursors.left.isDown || wasd?.A.isDown) moveX -= speed;
        if (cursors.right.isDown || wasd?.D.isDown) moveX += speed;
        if (cursors.up.isDown || wasd?.W.isDown) moveY -= speed;
        if (cursors.down.isDown || wasd?.S.isDown) moveY += speed;
      }

      // Edge scrolling (only when not selecting)
      if (enableEdgeScroll && !isScrolling) {
        const pointer = scene.input.activePointer;
        const screenWidth = scene.scale.width;
        const screenHeight = scene.scale.height;

        if (pointer.x >= screenWidth - edgeScrollThickness) {
          moveX += speed;
        } else if (pointer.x <= edgeScrollThickness) {
          moveX -= speed;
        }

        if (pointer.y >= screenHeight - edgeScrollThickness) {
          moveY += speed;
        } else if (pointer.y <= edgeScrollThickness) {
          moveY -= speed;
        }
      }

      // Apply movement
      if (moveX !== 0 || moveY !== 0) {
        const newX = Phaser.Math.Clamp(
          mainCamera.scrollX + moveX,
          0,
          worldWidth - (mapWidth / mainCamera.zoom)
        );
        const newY = Phaser.Math.Clamp(
          mainCamera.scrollY + moveY,
          0,
          worldHeight - (mapHeight / mainCamera.zoom)
        );
        mainCamera.setScroll(newX, newY);
      }
    };

    // Track selection state to disable edge scroll during selection
    scene.events.on('selection-start', () => {
      isScrolling = false;
    });

    scene.events.on('selection-end', () => {
      isScrolling = false;
    });

    return {
      update: updateCamera,
      centerOn: (x: number, y: number, duration: number = 500) => {
        if (!mainCamera) return;
        scene.tweens.add({
          targets: mainCamera,
          scrollX: Phaser.Math.Clamp(x - mapWidth / 2, 0, worldWidth - mapWidth),
          scrollY: Phaser.Math.Clamp(y - mapHeight / 2, 0, worldHeight - mapHeight),
          duration: duration,
          ease: 'Power2'
        });
      },
      setZoom: (zoom: number) => {
        if (!mainCamera) return;
        mainCamera.setZoom(Phaser.Math.Clamp(zoom, minZoom, maxZoom));
      },
      getZoom: () => mainCamera?.zoom || 1.0
    };
  };

  return {
    setupCameraControls,
    centerOn: (x: number, y: number, duration?: number) => {
      // This will be called from the setupCameraControls return
    }
  };
};

