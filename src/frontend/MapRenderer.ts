import Phaser from 'phaser';
import { MAP_THEMES, MapTheme } from './MapThemeGenerator';
import { QuaternionPerlinNoise } from './QuaternionPerlinNoise';

export interface TileData {
  type: number;
  name: string;
  walkable: boolean;
  resourceValue: number;
  noiseValue: number;
}

export class MapRenderer {
  scene: Phaser.Scene;
  width: number;
  height: number;
  tileSize: number;
  theme: MapTheme;
  seed: number;
  noiseGenerator: QuaternionPerlinNoise;
  mapData: TileData[][];
  tileSprites: Phaser.GameObjects.Image[];
  particleEmitters: Record<string, Phaser.GameObjects.Particles.ParticleEmitterManager>;
  overlays: Phaser.GameObjects.Graphics[];
  mapSprite: Phaser.GameObjects.Image | null;

  constructor(
    scene: Phaser.Scene,
    width: number,
    height: number,
    tileSize = 32,
    theme: string | MapTheme = 'FIRE',
    seed = 12345
  ) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.theme = typeof theme === 'string' ? MAP_THEMES[theme] : theme;
    this.seed = seed;
    this.noiseGenerator = new QuaternionPerlinNoise(seed);
    this.mapData = [];
    this.tileSprites = [];
    this.particleEmitters = {};
    this.overlays = [];
    this.mapSprite = null;

    this.generateMap();
    this.renderTiles();
    this.setupParticles();
    this.setupOverlayEffects();
  }

  generateMap(): void {
    const terrainArray = Object.values(this.theme.terrainTypes);

    for (let y = 0; y < this.height; y++) {
      this.mapData[y] = [];
      for (let x = 0; x < this.width; x++) {
        const scale = 0.05;
        const value = this.noiseGenerator.octavePerlin(x * scale, y * scale, 4, 0.6, 2);

        let terrainType;
        if (value < 0.3) terrainType = terrainArray[0];
        else if (value < 0.5) terrainType = terrainArray[1];
        else if (value < 0.65) terrainType = terrainArray[2];
        else if (value < 0.8) terrainType = terrainArray[3];
        else terrainType = terrainArray[4];

        this.mapData[y][x] = {
          type: terrainType.id,
          name: Object.keys(this.theme.terrainTypes).find(
            (k) => this.theme.terrainTypes[k].id === terrainType.id
          ) || 'unknown',
          walkable: terrainType.walkable,
          resourceValue: terrainType.resourceValue,
          noiseValue: value
        };
      }
    }
  }

  renderTiles(): void {
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: true });
    graphics.setDepth(0);

    // Draw tiles with grid
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.mapData[y][x];
        const terrainTypeInfo = this.theme.terrainTypes[tile.name];
        const color = Phaser.Display.Color.HexStringToColor(terrainTypeInfo.color);

        const px = x * this.tileSize;
        const py = y * this.tileSize;

        // Draw tile
        graphics.fillStyle(color.color, 0.9);
        graphics.fillRect(px, py, this.tileSize, this.tileSize);

        // Draw grid
        graphics.lineStyle(1, 0x333333, 0.3);
        graphics.strokeRect(px, py, this.tileSize, this.tileSize);

        // Add subtle gradient/shading
        const noiseShade = Math.floor((tile.noiseValue - 0.3) * 50);
        if (noiseShade > 0) {
          graphics.fillStyle(0xffffff, Math.min(noiseShade / 255, 0.1));
          graphics.fillRect(px, py, this.tileSize, this.tileSize);
        }
      }
    }

    // Draw grid overlay
    graphics.lineStyle(1, 0x444444, 0.4);
    for (let x = 0; x <= this.width; x++) {
      graphics.lineBetween(
        x * this.tileSize,
        0,
        x * this.tileSize,
        this.height * this.tileSize
      );
    }
    for (let y = 0; y <= this.height; y++) {
      graphics.lineBetween(
        0,
        y * this.tileSize,
        this.width * this.tileSize,
        y * this.tileSize
      );
    }

    graphics.generateTexture('mapTexture', this.width * this.tileSize, this.height * this.tileSize);
    graphics.destroy();

    this.mapSprite = this.scene.add.image(0, 0, 'mapTexture');
    this.mapSprite.setOrigin(0, 0);
    this.mapSprite.setDepth(0);
  }

  setupParticles(): void {
    const config = this.theme.particleEmitters;

    // Create particle systems at random walkable tiles
    Object.entries(config).forEach(([name, settings]) => {
      const manager = this.scene.add.particles(0, 0, 'particle', {
        ...settings,
        blendMode: 'ADD'
      });

      // Create emitter
      const emitter = manager.createEmitter(settings);

      // Randomly place emitters on walkable terrain
      for (let i = 0; i < 3; i++) {
        let x: number, y: number, tile: TileData;
        let attempts = 0;
        do {
          x = Math.floor(Math.random() * this.width);
          y = Math.floor(Math.random() * this.height);
          tile = this.mapData[y][x];
          attempts++;
        } while (!tile.walkable && attempts < 50);

        if (tile.walkable) {
          const worldX = x * this.tileSize + this.tileSize / 2;
          const worldY = y * this.tileSize + this.tileSize / 2;

          emitter.setPosition(worldX, worldY);
          emitter.start();
        }
      }

      this.particleEmitters[name] = manager;
    });
  }

  setupOverlayEffects(): void {
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: true });
    graphics.setDepth(5);
    graphics.setAlpha(0.15);

    if (this.theme.overlayEffects.dappled_light) {
      // Create dappled light effect for forest themes
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * this.width * this.tileSize;
        const y = Math.random() * this.height * this.tileSize;
        const radius = Math.random() * 30 + 20;

        graphics.fillStyle(0xffffff, 0.05);
        graphics.fillCircle(x, y, radius);
      }
    }

    if (this.theme.overlayEffects.glow_effect) {
      // Add glow around the edges of the map
      const glowGraphics = this.scene.make.graphics({ x: 0, y: 0, add: true });
      glowGraphics.setDepth(4);
      glowGraphics.clear();
      const primaryColor = Phaser.Display.Color.HexStringToColor(this.theme.colorPalette.primary);
      glowGraphics.fillStyle(primaryColor.color, 0.05);
      glowGraphics.fillRect(0, 0, this.width * this.tileSize, this.height * this.tileSize);
      this.overlays.push(glowGraphics);
    }

    this.overlays.push(graphics);
  }

  getTile(x: number, y: number): TileData | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.mapData[y][x];
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile ? tile.walkable : false;
  }

  getTerrainColor(x: number, y: number): string {
    const tile = this.getTile(x, y);
    if (!tile) return '#000000';
    const terrainType = this.theme.terrainTypes[tile.name];
    return terrainType.color;
  }

  updateParticles(deltaTime: number): void {
    // Continuous particle spawning at random locations
    if (Math.random() < 0.3) {
      const emitterNames = Object.keys(this.particleEmitters);
      if (emitterNames.length > 0) {
        const randomEmitterName = emitterNames[Math.floor(Math.random() * emitterNames.length)];
        const x = Math.floor(Math.random() * this.width);
        const y = Math.floor(Math.random() * this.height);

        if (this.mapData[y] && this.mapData[y][x] && this.mapData[y][x].walkable) {
          const worldX = x * this.tileSize + this.tileSize / 2;
          const worldY = y * this.tileSize + this.tileSize / 2;
          const emitter = this.particleEmitters[randomEmitterName].emitters.list[0];
          if (emitter) {
            emitter.emitParticleAt(worldX, worldY);
          }
        }
      }
    }
  }

  highlightTile(x: number, y: number, color = 0x00ff00, alpha = 0.3): Phaser.GameObjects.Graphics {
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: true });
    graphics.setDepth(3);

    const px = x * this.tileSize;
    const py = y * this.tileSize;

    graphics.fillStyle(color, alpha);
    graphics.fillRect(px, py, this.tileSize, this.tileSize);

    return graphics;
  }

  drawPath(
    path: Array<{ x: number; y: number }>,
    color = 0xffff00,
    alpha = 0.5
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: true });
    graphics.setDepth(2);
    graphics.lineStyle(2, color, alpha);

    for (let i = 0; i < path.length - 1; i++) {
      const x1 = path[i].x * this.tileSize + this.tileSize / 2;
      const y1 = path[i].y * this.tileSize + this.tileSize / 2;
      const x2 = path[i + 1].x * this.tileSize + this.tileSize / 2;
      const y2 = path[i + 1].y * this.tileSize + this.tileSize / 2;

      graphics.lineBetween(x1, y1, x2, y2);
    }

    return graphics;
  }

  destroy(): void {
    if (this.mapSprite) {
      this.mapSprite.destroy();
    }
    Object.values(this.particleEmitters).forEach((emitter) => emitter.destroy());
    this.overlays.forEach((overlay) => overlay.destroy());
  }
}

