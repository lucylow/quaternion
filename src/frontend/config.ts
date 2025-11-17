// src/frontend/config.ts

import Phaser from 'phaser';
import { UnifiedGameScene } from './scenes/UnifiedGameScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#111111',
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    smoothStep: true,
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    fullscreenTarget: 'parent',
    expandParent: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [UnifiedGameScene],
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
  },
};

// Initialize game
let game: Phaser.Game | null = null;

export function initializeGame(): Phaser.Game {
  if (!game) {
    game = new Phaser.Game(gameConfig);

    // Handle window resize
    window.addEventListener('resize', () => {
      const scene = game?.scene.getScenes()[0];
      if (scene && 'onWindowResize' in scene && typeof scene.onWindowResize === 'function') {
        scene.onWindowResize();
      }
    });
  }

  return game;
}

export function destroyGame(): void {
  if (game) {
    game.destroy(true);
    game = null;
  }
}

