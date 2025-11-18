import Phaser from 'phaser';
import { MapScene } from './MapScene';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.scene.start('MapScene', { theme: 'FIRE', seed: 12345 });
  }
}

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 2048,
  height: 1024,
  parent: 'game-container',
  backgroundColor: '#111111',
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MapScene]
};


