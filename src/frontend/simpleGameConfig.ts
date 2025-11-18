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
  if (!simpleGame) {
    simpleGame = new Phaser.Game(simpleGameConfig);

    // Handle window resize
    window.addEventListener('resize', () => {
      if (simpleGame) {
        simpleGame.scale.refresh();
      }
    });
  }

  return simpleGame;
}

export function destroySimpleGame(): void {
  if (simpleGame) {
    simpleGame.destroy(true);
    simpleGame = null;
  }
}

