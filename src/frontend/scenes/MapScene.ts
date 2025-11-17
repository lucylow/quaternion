import Phaser from 'phaser';
import { MapRenderer } from '../MapRenderer';
import { MAP_THEMES } from '../MapThemeGenerator';

export class MapScene extends Phaser.Scene {
  mapRenderer: MapRenderer | null = null;
  tileInfoText: Phaser.GameObjects.Text | null = null;
  currentTheme: string = 'FIRE';
  currentSeed: number = 12345;

  constructor() {
    super({ key: 'MapScene' });
  }

  init(data?: { theme?: string; seed?: number }): void {
    if (data?.theme) {
      this.currentTheme = data.theme;
    }
    if (data?.seed !== undefined) {
      this.currentSeed = data.seed;
    }
  }

  preload(): void {
    // Create a simple white pixel for particles
    this.add.graphics()
      .fillStyle(0xffffff, 1)
      .fillRect(0, 0, 1, 1)
      .generateTexture('particle', 1, 1);
  }

  create(): void {
    // Clean up previous map if exists
    if (this.mapRenderer) {
      this.mapRenderer.destroy();
    }

    // Initialize map
    this.mapRenderer = new MapRenderer(
      this,
      64,
      64,
      32,
      this.currentTheme,
      this.currentSeed
    );

    // Setup UI
    this.setupUI();
    this.setupInput();

    // Set background color based on theme
    const theme = MAP_THEMES[this.currentTheme];
    if (theme) {
      this.cameras.main.setBackgroundColor(
        Phaser.Display.Color.HexStringToColor(theme.colorPalette.background).color
      );
    }
  }

  setupUI(): void {
    const mapThemeButtons = Object.keys(MAP_THEMES);

    mapThemeButtons.forEach((themeName, index) => {
      const button = this.add.text(
        10 + index * 120,
        10,
        themeName,
        {
          fontSize: '16px',
          color: '#FFF',
          backgroundColor: '#333',
          padding: { x: 10, y: 5 }
        }
      );

      button.setInteractive({ useHandCursor: true });
      button.setDepth(100);
      button.setScrollFactor(0);

      button.on('pointerdown', () => {
        this.currentTheme = themeName;
        this.scene.restart({ theme: themeName, seed: this.currentSeed });
      });

      button.on('pointerover', () => {
        button.setStyle({ color: '#FF0' });
      });

      button.on('pointerout', () => {
        button.setStyle({ color: '#FFF' });
      });
    });

    // Add seed input and regenerate button
    const regenerateButton = this.add.text(
      10,
      50,
      'Regenerate Map',
      {
        fontSize: '14px',
        color: '#FFF',
        backgroundColor: '#0099FF',
        padding: { x: 10, y: 5 }
      }
    );

    regenerateButton.setInteractive({ useHandCursor: true });
    regenerateButton.setDepth(100);
    regenerateButton.setScrollFactor(0);

    regenerateButton.on('pointerdown', () => {
      this.currentSeed = Math.floor(Math.random() * 1000000);
      this.scene.restart({ theme: this.currentTheme, seed: this.currentSeed });
    });

    regenerateButton.on('pointerover', () => {
      regenerateButton.setStyle({ backgroundColor: '#00CCFF' });
    });

    regenerateButton.on('pointerout', () => {
      regenerateButton.setStyle({ backgroundColor: '#0099FF' });
    });
  }

  setupInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const tileX = Math.floor(pointer.x / 32);
      const tileY = Math.floor(pointer.y / 32);
      const tile = this.mapRenderer?.getTile(tileX, tileY);

      if (tile && this.mapRenderer) {
        // Show tile info
        if (!this.tileInfoText) {
          this.tileInfoText = this.add.text(
            400,
            10,
            '',
            {
              fontSize: '14px',
              color: '#FFF',
              backgroundColor: '#000',
              padding: { x: 5, y: 5 }
            }
          );
          this.tileInfoText.setDepth(100);
          this.tileInfoText.setScrollFactor(0);
        }

        this.tileInfoText.setText(
          `Tile: (${tileX}, ${tileY})\nType: ${tile.name}\nWalkable: ${tile.walkable}\nResource: ${tile.resourceValue}`
        );
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const tileX = Math.floor(pointer.x / 32);
      const tileY = Math.floor(pointer.y / 32);

      if (this.mapRenderer?.isWalkable(tileX, tileY)) {
        this.mapRenderer.highlightTile(tileX, tileY, 0x00ff00, 0.5);
      }
    });
  }

  update(): void {
    // Continuous updates for particles
    if (this.mapRenderer && this.game.loop.deltaHistory.length > 0) {
      this.mapRenderer.updateParticles(this.game.loop.deltaHistory[0]);
    }
  }
}

