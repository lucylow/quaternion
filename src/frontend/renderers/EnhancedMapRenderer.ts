// src/frontend/renderers/EnhancedMapRenderer.ts

import Phaser from 'phaser';
import { AssetManager } from '../managers/AssetManager';

interface ColorPalette {
  grass: { color: number };
  water: { color: number };
  mountains: { color: number };
  resource: { color: number };
  hazard: { color: number };
}

interface CountryMetadata {
  weather: string;
  terrain: string;
  hazards: string[];
  resources: string[];
  environment?: any[];
  lighting?: {
    baseColor?: number;
    glowColor?: number;
  };
}

export class EnhancedMapRenderer {
  private scene: Phaser.Scene;
  private width: number;
  private height: number;
  private country: string;
  private assetManager: AssetManager;

  private mapGraphics: Phaser.GameObjects.Graphics | null = null;
  private parallaxLayers: Phaser.GameObjects.TileSprite[] = [];
  private environmentObjects: Phaser.GameObjects.Sprite[] = [];
  private weatherEffects: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private lighting: Phaser.GameObjects.Graphics | null = null;
  private weatherData: string = 'normal';
  private hazards: string[] = [];

  constructor(
    scene: Phaser.Scene,
    width: number,
    height: number,
    country = 'country-dubai'
  ) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.country = country;
    this.assetManager = new AssetManager(scene);
  }

  /**
   * Initialize and render enhanced map
   */
  async initializeMap(): Promise<void> {
    try {
      // Create parallax background (may fail if assets not loaded, that's ok)
      try {
        this.parallaxLayers = this.assetManager.createParallaxBackground(
          this.scene,
          this.country
        );
      } catch (error) {
        console.warn('Parallax background not available, continuing without it');
      }

      // Load country-specific metadata
      const metadata = await this.assetManager.loadCountryMetadata(this.country);
      this.weatherData = metadata.weather;
      this.hazards = metadata.hazards;

      // Create base map
      this.createBaseMap();

      // Add environment objects
      if (metadata.environment) {
        this.addEnvironmentObjects(metadata.environment);
      }

      // Create weather effects (only if particle system is available)
      try {
        this.createWeatherEffects(metadata.weather);
      } catch (error) {
        console.warn('Weather effects not available');
      }

      // Setup dynamic lighting
      if (metadata.lighting) {
        this.setupDynamicLighting(metadata.lighting);
      }

      // Add grid overlay (optional)
      this.createGridOverlay();

      console.log(`✅ ${this.country} map initialized`);
    } catch (error) {
      console.error('Failed to initialize enhanced map:', error);
    }
  }

  /**
   * Create base tilemap
   */
  private createBaseMap(): void {
    // Create graphics-based map with country colors
    this.mapGraphics = this.scene.make.graphics({
      x: 0,
      y: 0,
      add: true,
    });

    this.mapGraphics.setDepth(0);

    // Get country color palette
    const colorPalette = this.getCountryColorPalette();
    const tileSize = 32;

    // Draw themed tiles
    for (let y = 0; y < this.height; y += tileSize) {
      for (let x = 0; x < this.width; x += tileSize) {
        const tileType = this.getTileType(x / tileSize, y / tileSize);
        const color = colorPalette[tileType];

        this.mapGraphics.fillStyle(color.color, 0.9);
        this.mapGraphics.fillRect(x, y, tileSize, tileSize);

        // Add detail based on terrain
        this.addTileDetail(this.mapGraphics, x, y, tileType, colorPalette);

        // Draw grid
        this.mapGraphics.lineStyle(1, 0x333333, 0.2);
        this.mapGraphics.strokeRect(x, y, tileSize, tileSize);
      }
    }
  }

  /**
   * Get country-specific color palette
   */
  private getCountryColorPalette(): Record<string, { color: number }> {
    const palettes: Record<string, Record<string, { color: number }>> = {
      'country-dubai': {
        grass: { color: 0xa94d44 },
        water: { color: 0xff4500 },
        mountains: { color: 0x8b0000 },
        resource: { color: 0xffd700 },
        hazard: { color: 0xff1493 },
      },
      'country-china': {
        grass: { color: 0xb0e0e6 },
        water: { color: 0x87ceeb },
        mountains: { color: 0x00ced1 },
        resource: { color: 0xe0ffff },
        hazard: { color: 0x000080 },
      },
      'country-usa': {
        grass: { color: 0x228b22 },
        water: { color: 0x32cd32 },
        mountains: { color: 0x1a5c1a },
        resource: { color: 0x7cfc00 },
        hazard: { color: 0x0b5e3c },
      },
      'country-france': {
        grass: { color: 0xdeb887 },
        water: { color: 0x7cb9e8 },
        mountains: { color: 0xcd853f },
        resource: { color: 0xf0e68c },
        hazard: { color: 0x8b4513 },
      },
    };

    return palettes[this.country] || palettes['country-dubai'];
  }

  /**
   * Get tile type based on position
   */
  getTileType(x: number, y: number): string {
    const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1);

    if (noise > 0.5) return 'resource';
    if (noise > 0.2) return 'mountains';
    if (noise < -0.3) return 'water';
    if (noise < -0.1) return 'hazard';
    return 'grass';
  }

  /**
   * Add tile-specific visual details
   */
  private addTileDetail(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    tileType: string,
    palette: Record<string, { color: number }>
  ): void {
    const detailColor = palette[tileType];

    switch (tileType) {
      case 'resource':
        // Add resource sparkle
        graphics.fillStyle(0xffff00, 0.3);
        graphics.fillCircle(x + 16, y + 16, 4);
        break;

      case 'hazard':
        // Add hazard indicator
        graphics.lineStyle(2, 0xff0000, 0.5);
        graphics.strokeCircle(x + 16, y + 16, 8);
        break;

      case 'mountains':
        // Add mountain texture
        graphics.fillStyle(0xffffff, 0.1);
        graphics.fillTriangle(x + 16, y + 8, x + 8, y + 24, x + 24, y + 24);
        break;

      case 'water':
        // Add water ripple effect
        graphics.lineStyle(1, 0x6495ed, 0.3);
        graphics.arc(x + 16, y + 16, 6, 0, Math.PI * 2);
        break;
    }
  }

  /**
   * Add environment objects (trees, rocks, buildings)
   */
  private addEnvironmentObjects(envData: any[]): void {
    const objectKey = `env_objects_${this.country}`;

    envData.forEach((obj) => {
      try {
        const envSprite = this.scene.add.sprite(obj.x, obj.y, objectKey);

        if (obj.frameIndex !== undefined) {
          envSprite.setFrame(obj.frameIndex);
        }
        envSprite.setDepth(50);
        envSprite.setScale(obj.scale || 1);

        if (obj.physics) {
          this.scene.physics.add.existing(envSprite, true);
        }

        this.environmentObjects.push(envSprite);
      } catch (error) {
        console.warn(`Could not create environment object:`, error);
      }
    });
  }

  /**
   * Create weather effects
   */
  private createWeatherEffects(weatherType: string): void {
    // Only create weather effects if particle system is available
    // For now, we'll skip this as it requires a particle texture
    // This can be enabled when particle assets are available
    console.log(`Weather effect requested: ${weatherType}`);
  }

  /**
   * Get weather particle configuration
   */
  private getWeatherParticleConfig(weatherType: string): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig {
    const configs: Record<string, Phaser.Types.GameObjects.Particles.ParticleEmitterConfig> = {
      rain: {
        speed: { x: 0, y: 200 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 2000,
        tint: 0x87ceeb,
      },
      snow: {
        speed: { x: { min: -50, max: 50 }, y: { min: 50, max: 150 } },
        scale: { start: 1, end: 0 },
        alpha: { start: 0.9, end: 0.3 },
        lifespan: 3000,
        tint: 0xe0ffff,
      },
      sandstorm: {
        speed: { x: { min: 100, max: 300 }, y: { min: -50, max: 50 } },
        scale: { start: 1, end: 0.3 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 1500,
        tint: 0xf0e68c,
      },
      ash: {
        speed: { x: { min: -30, max: 30 }, y: { min: 50, max: 150 } },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 2500,
        tint: 0xa9a9a9,
      },
    };

    return configs[weatherType] || configs['rain'];
  }

  /**
   * Setup dynamic lighting
   */
  private setupDynamicLighting(lightingConfig: {
    baseColor?: number;
    glowColor?: number;
  }): void {
    // Create spot light effect for day/night cycle
    const graphics = this.scene.make.graphics({
      x: 0,
      y: 0,
      add: true,
    });

    graphics.setDepth(5);
    graphics.setAlpha(0.3);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    graphics.fillStyle(lightingConfig.baseColor || 0xffffff, 0.2);
    graphics.fillCircle(centerX, centerY, 200);

    // Add glow
    graphics.fillStyle(lightingConfig.glowColor || 0xffff00, 0.1);
    graphics.fillCircle(centerX, centerY, 300);

    this.lighting = graphics;
  }

  /**
   * Create grid overlay
   */
  private createGridOverlay(): void {
    const grid = this.scene.make.graphics({
      x: 0,
      y: 0,
      add: true,
    });

    grid.setDepth(2);
    grid.lineStyle(1, 0x444444, 0.3);

    const tileSize = 32;

    for (let x = 0; x <= this.width; x += tileSize) {
      grid.lineBetween(x, 0, x, this.height);
    }

    for (let y = 0; y <= this.height; y += tileSize) {
      grid.lineBetween(0, y, this.width, y);
    }
  }

  /**
   * Update parallax with camera movement
   */
  updateParallax(camera: Phaser.Cameras.Scene2D.Camera): void {
    this.parallaxLayers.forEach((layer, index) => {
      layer.setScrollFactor(1 - index * 0.15);
    });
  }

  /**
   * Get tile at position
   */
  getTileAt(x: number, y: number): { x: number; y: number; type: string } {
    const tileX = Math.floor(x / 32);
    const tileY = Math.floor(y / 32);
    const tileType = this.getTileType(tileX, tileY);
    return { x: tileX, y: tileY, type: tileType };
  }

  /**
   * Highlight tile
   */
  highlightTile(
    x: number,
    y: number,
    color = 0x00ff00,
    alpha = 0.3
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.make.graphics();
    graphics.setDepth(3);

    const tileSize = 32;
    const px = Math.floor(x / tileSize) * tileSize;
    const py = Math.floor(y / tileSize) * tileSize;

    graphics.fillStyle(color, alpha);
    graphics.fillRect(px, py, tileSize, tileSize);

    return graphics;
  }
}

