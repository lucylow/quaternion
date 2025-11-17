// src/frontend/managers/AssetManager.ts

import Phaser from 'phaser';

interface MonsterStats {
  health: number;
  attack: number;
  defense: number;
  speed: number;
  attackRange: number;
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

interface AssetMetadata {
  type: 'monster' | 'country' | 'ui' | 'mobile';
  name: string;
  path: string;
  stats?: MonsterStats;
  metadata?: CountryMetadata;
}

interface SpriteConfig {
  scale?: number;
  alpha?: number;
  tint?: number;
  depth?: number;
  physics?: boolean;
}

export class AssetManager {
  private scene: Phaser.Scene;
  private assets: Map<string, AssetMetadata>;
  private loadedTextures: Map<string, Phaser.Textures.Texture>;
  private loadedSprites: Map<string, Phaser.GameObjects.Sprite>;
  private assetPaths: {
    monsters: string;
    countries: string;
    ui: string;
    mobile: string;
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.assets = new Map();
    this.loadedTextures = new Map();
    this.loadedSprites = new Map();
    this.assetPaths = {
      monsters: '/assets/monsters/',
      countries: '/assets/countries/',
      ui: '/assets/images/',
      mobile: '/assets/mobile-mockups/',
    };
  }

  /**
   * Load all game assets
   */
  async loadAllAssets(): Promise<boolean> {
    try {
      console.log('🎮 Starting asset loading...');

      await Promise.all([
        this.loadMonsterAssets(),
        this.loadCountryAssets(),
        this.loadUIAssets(),
        this.loadMobileAssets(),
      ]);

      console.log('✅ All assets loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Asset loading failed:', error);
      throw error;
    }
  }

  /**
   * Load monster sprites and animations
   */
  async loadMonsterAssets(): Promise<void> {
    const monsters = [
      'warrior',
      'dragon',
      'golem',
      'ghost',
      'demon',
      'spider',
      'scorpion',
      'drake',
      'wraith',
      'cyclops',
    ];

    // Use actual monster assets from the directory
    const actualMonsters = [
      'monster-celestial-1',
      'monster-celestial-2',
      'monster-quaternion-poster-1',
      'monster-quaternion-poster-2',
      'monster-elemental',
      'monster-horror',
    ];

    for (const monster of actualMonsters) {
      const basePath = `${this.assetPaths.monsters}${monster}.webp`;

      // Load image (since we have webp files, not spritesheets)
      this.scene.load.image(`monster_${monster}`, basePath);

      // Cache metadata
      this.assets.set(`monster_${monster}`, {
        type: 'monster',
        name: monster,
        path: basePath,
        stats: await this.loadMonsterStats(monster),
      });
    }
  }

  /**
   * Load country/map theme assets
   */
  async loadCountryAssets(): Promise<void> {
    const countries = [
      'country-dubai',
      'country-china',
      'country-usa',
      'country-france',
    ];

    for (const country of countries) {
      const basePath = `${this.assetPaths.countries}${country}.webp`;

      // Load country image
      this.scene.load.image(`country_${country}`, basePath);

      // Load as tileset alternative
      this.scene.load.image(`tileset_${country}`, basePath);

      // Load as terrain texture
      this.scene.load.image(`terrain_${country}`, basePath);

      // For parallax, we'll use the same image with different scroll factors
      for (let i = 1; i <= 3; i++) {
        this.scene.load.image(`parallax_${country}_${i}`, basePath);
      }

      this.assets.set(`country_${country}`, {
        type: 'country',
        name: country,
        path: basePath,
        metadata: await this.loadCountryMetadata(country),
      });
    }
  }

  /**
   * Load UI assets
   */
  async loadUIAssets(): Promise<void> {
    const uiElements = [
      'buttons',
      'panels',
      'icons',
      'health_bar',
      'resource_bar',
      'minimap',
      'hud_elements',
      'cursors',
      'tooltips',
      'notifications',
    ];

    // Since we may not have all UI assets, we'll create placeholders
    for (const element of uiElements) {
      const basePath = `${this.assetPaths.ui}${element}.png`;

      // Try to load, but don't fail if missing
      try {
        this.scene.load.image(`ui_${element}`, basePath);
      } catch (error) {
        console.warn(`UI asset not found: ${element}`);
      }
    }
  }

  /**
   * Load mobile-specific assets and layouts
   */
  async loadMobileAssets(): Promise<void> {
    const mobileUI = [
      'touch_controls',
      'mobile_hud',
      'minimap_mobile',
      'unit_selection_mobile',
      'build_menu_mobile',
      'chat_mobile',
      'inventory_mobile',
    ];

    // Load mobile mockup images
    for (const ui of mobileUI) {
      const basePath = `${this.assetPaths.mobile}${ui}.webp`;

      try {
        this.scene.load.image(`mobile_${ui}`, basePath);
      } catch (error) {
        console.warn(`Mobile asset not found: ${ui}`);
      }
    }
  }

  /**
   * Load monster stats from JSON
   */
  async loadMonsterStats(monsterName: string): Promise<MonsterStats> {
    try {
      const response = await fetch(
        `${this.assetPaths.monsters}${monsterName}/stats.json`
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Could not load stats for ${monsterName}:`, error);
    }
    return this.getDefaultMonsterStats();
  }

  /**
   * Load country metadata
   */
  async loadCountryMetadata(countryName: string): Promise<CountryMetadata> {
    try {
      const response = await fetch(
        `${this.assetPaths.countries}${countryName}/metadata.json`
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Could not load metadata for ${countryName}:`, error);
    }
    return this.getDefaultCountryMetadata();
  }

  /**
   * Get texture with caching
   */
  getTexture(key: string): Phaser.Textures.Texture | null {
    if (this.loadedTextures.has(key)) {
      return this.loadedTextures.get(key)!;
    }

    try {
      const texture = this.scene.textures.get(key);
      this.loadedTextures.set(key, texture);
      return texture;
    } catch (error) {
      console.error(`Texture not found: ${key}`);
      return null;
    }
  }

  /**
   * Create sprite from asset
   */
  createSprite(
    scene: Phaser.Scene,
    key: string,
    x: number,
    y: number,
    config: SpriteConfig = {}
  ): Phaser.GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, key);

    if (config.scale) sprite.setScale(config.scale);
    if (config.alpha) sprite.setAlpha(config.alpha);
    if (config.tint) sprite.setTint(config.tint);
    if (config.depth) sprite.setDepth(config.depth);

    this.loadedSprites.set(`${key}_${Date.now()}`, sprite);
    return sprite;
  }

  /**
   * Create monster with full setup
   */
  createMonster(
    scene: Phaser.Scene,
    monsterType: string,
    x: number,
    y: number,
    config: SpriteConfig = {}
  ): Phaser.GameObjects.Sprite {
    const key = `monster_${monsterType}`;
    const monster = this.createSprite(scene, key, x, y, {
      scale: config.scale || 1,
      depth: config.depth || 100,
    });

    // Add physics
    if (config.physics) {
      scene.physics.add.existing(monster);
      if (monster.body) {
        (monster.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
      }
    }

    return monster;
  }

  /**
   * Create monster animations from sprite sheet
   */
  createMonsterAnimations(scene: Phaser.Scene, monsterType: string): void {
    const key = `monster_${monsterType}`;
    const animKey = `${key}_anims`;

    try {
      const animData = scene.cache.json.get(animKey);

      if (animData && animData.animations) {
        animData.animations.forEach((anim: any) => {
          if (!scene.anims.exists(anim.key)) {
            scene.anims.create({
              key: anim.key,
              frames: scene.anims.generateFrameNumbers(key, {
                start: anim.start,
                end: anim.end,
              }),
              frameRate: anim.frameRate,
              repeat: anim.repeat,
              yoyo: anim.yoyo,
            });
          }
        });
      }
    } catch (error) {
      console.warn(`Could not load animations for ${monsterType}:`, error);
      this.createDefaultMonsterAnimations(scene, monsterType);
    }
  }

  /**
   * Create country tilemap
   */
  createCountryTilemap(
    scene: Phaser.Scene,
    countryName: string,
    mapData: number[][]
  ): { tilemap: Phaser.Tilemaps.Tilemap; layer: Phaser.Tilemaps.TilemapLayer } {
    const tilesetKey = `tileset_${countryName}`;
    const tilemap = scene.make.tilemap({
      data: mapData,
      tileWidth: 32,
      tileHeight: 32,
    });

    const tileset = tilemap.addTilesetImage(tilesetKey);
    const layer = tilemap.createLayer(0, tileset, 0, 0)!;

    return { tilemap, layer };
  }

  /**
   * Create parallax background
   */
  createParallaxBackground(
    scene: Phaser.Scene,
    countryName: string
  ): Phaser.GameObjects.TileSprite[] {
    const parallaxLayers: Phaser.GameObjects.TileSprite[] = [];

    for (let i = 1; i <= 3; i++) {
      const key = `parallax_${countryName}_${i}`;
      const parallax = scene.add.tileSprite(
        scene.cameras.main.width / 2,
        scene.cameras.main.height / 2,
        scene.cameras.main.width,
        scene.cameras.main.height,
        key
      );

      parallax.setDepth(-i);
      parallax.setScrollFactor(1 - i * 0.15); // Parallax effect
      parallaxLayers.push(parallax);
    }

    return parallaxLayers;
  }

  /**
   * Get default monster stats
   */
  getDefaultMonsterStats(): MonsterStats {
    return {
      health: 100,
      attack: 20,
      defense: 5,
      speed: 3,
      attackRange: 1,
    };
  }

  /**
   * Get default country metadata
   */
  getDefaultCountryMetadata(): CountryMetadata {
    return {
      weather: 'normal',
      terrain: 'grassland',
      hazards: [],
      resources: [],
    };
  }

  /**
   * Create default animations
   */
  createDefaultMonsterAnimations(
    scene: Phaser.Scene,
    monsterType: string
  ): void {
    const key = `monster_${monsterType}`;

    const defaultAnims = ['idle', 'walk', 'attack', 'die'];

    defaultAnims.forEach((animName, index) => {
      if (!scene.anims.exists(`${key}_${animName}`)) {
        scene.anims.create({
          key: `${key}_${animName}`,
          frames: scene.anims.generateFrameNumbers(key, {
            start: index * 4,
            end: index * 4 + 3,
          }),
          frameRate: 10,
          repeat: animName === 'idle' ? -1 : 0,
        });
      }
    });
  }

  /**
   * Unload assets to free memory
   */
  unloadAssets(keys: string | string[]): void {
    const keysArray = typeof keys === 'string' ? [keys] : keys;

    keysArray.forEach((key) => {
      this.scene.textures.remove(key);
      this.loadedTextures.delete(key);
      this.assets.delete(key);
    });
  }

  /**
   * Get memory stats
   */
  getMemoryStats(): {
    loadedTextures: number;
    loadedSprites: number;
    cachedAssets: number;
  } {
    return {
      loadedTextures: this.loadedTextures.size,
      loadedSprites: this.loadedSprites.size,
      cachedAssets: this.assets.size,
    };
  }
}

