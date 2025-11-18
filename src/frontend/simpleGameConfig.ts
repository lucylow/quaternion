/**
 * Simple Game Configuration
 * Configuration for the simplified playable RTS game
 */

import Phaser from 'phaser';
import { SimpleGameScene } from './scenes/SimpleGameScene';

export const simpleGameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#222222',
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    powerPreference: 'high-performance',
    batchSize: 4096, // Increase batch size for better performance
    maxTextures: 16,
    roundPixels: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    fullscreenTarget: 'parent',
    resizeInterval: 100, // Throttle resize events
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
      fps: 60,
      timeScale: 1,
    },
  },
  scene: [SimpleGameScene],
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
    activePointers: 2, // Support multi-touch
  },
  fps: {
    target: 60,
    forceSetTimeOut: false,
    smoothStep: true,
  },
  disableContextMenu: true, // Disable right-click context menu for better game experience
};

// Initialize simple game
let simpleGame: Phaser.Game | null = null;

export function initSimpleGame(): Phaser.Game {
  console.log('[QUAT DEBUG] initSimpleGame called');
  
  if (simpleGame) {
    console.log('[QUAT DEBUG] Game already exists, returning existing instance');
    return simpleGame;
  }

  // Verify parent container exists
  const parent = document.getElementById('game-container');
  if (!parent) {
    console.error('[QUAT DEBUG] game-container element not found!');
    throw new Error('game-container element not found in DOM');
  }

  console.log('[QUAT DEBUG] Parent container found:', {
    id: parent.id,
    width: parent.clientWidth,
    height: parent.clientHeight,
    offsetWidth: parent.offsetWidth,
    offsetHeight: parent.offsetHeight
  });

  // Update config with current dimensions
  const config = {
    ...simpleGameConfig,
    width: parent.clientWidth || window.innerWidth,
    height: parent.clientHeight || window.innerHeight,
  };

  console.log('[QUAT DEBUG] Creating Phaser game with config:', {
    width: config.width,
    height: config.height,
    parent: config.parent,
    type: config.type
  });

  try {
    simpleGame = new Phaser.Game(config);
    console.log('[QUAT DEBUG] Phaser game created successfully');
    console.log('[QUAT DEBUG] Game canvas:', simpleGame.canvas);
    console.log('[QUAT DEBUG] Game scenes:', simpleGame.scene.scenes.map(s => s.scene.key));

    // Verify canvas was created
    const canvas = parent.querySelector('canvas');
    if (canvas) {
      console.log('[QUAT DEBUG] Canvas verified in DOM:', {
        width: canvas.width,
        height: canvas.height,
        style: {
          display: canvas.style.display,
          position: canvas.style.position,
          zIndex: canvas.style.zIndex
        }
      });
    } else {
      console.warn('[QUAT DEBUG] Canvas not found in parent after game creation');
      // Wait a bit and check again
      setTimeout(() => {
        const canvas2 = parent.querySelector('canvas');
        if (canvas2) {
          console.log('[QUAT DEBUG] Canvas found on retry');
        } else {
          console.error('[QUAT DEBUG] Canvas still not found after delay');
        }
      }, 100);
    }

    // Handle window resize
    const resizeHandler = () => {
      if (simpleGame) {
        console.log('[QUAT DEBUG] Window resized, refreshing scale');
        simpleGame.scale.refresh();
      }
    };
    window.addEventListener('resize', resizeHandler);

    // Store resize handler for cleanup
    (simpleGame as any).__resizeHandler = resizeHandler;
  } catch (error) {
    console.error('[QUAT DEBUG] Error creating Phaser game:', error);
    throw error;
  }

  return simpleGame;
}

export function destroySimpleGame(): void {
  console.log('[QUAT DEBUG] destroySimpleGame called');
  if (simpleGame) {
    // Remove resize handler
    const resizeHandler = (simpleGame as any).__resizeHandler;
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }
    
    console.log('[QUAT DEBUG] Destroying Phaser game');
    simpleGame.destroy(true);
    simpleGame = null;
    console.log('[QUAT DEBUG] Phaser game destroyed');
  }
}

