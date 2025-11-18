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
   * This should be called during the preload() phase
   */
  loadAllAssets(): void {
    console.log('🎮 Starting asset loading...');

    // Load all asset types (these queue up in Phaser's loader)
    this.loadMonsterAssets();
    this.loadCountryAssets();
    this.loadUIAssets();
    this.loadMobileAssets();

    console.log('✅ Asset loading queued');
  }

  /**
   * Wait for all assets to finish loading
   * Call this after loadAllAssets() and start the loader
   */
  async waitForAssetsToLoad(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Check if loader is already complete
      if (!this.scene.load.isLoading() && this.scene.load.list.size === 0) {
        console.log('✅ All assets already loaded');
        resolve(true);
        return;
      }

      // Set up event listeners
      this.scene.load.once('complete', () => {
        console.log('✅ All assets loaded successfully');
        resolve(true);
      });

      this.scene.load.once('filecomplete-error', (file: any) => {
        console.error(`❌ Failed to load asset: ${file.key} from ${file.src}`);
        // Continue loading other assets even if one fails
      });

      this.scene.load.once('loaderror', (file: any) => {
        console.error(`❌ Load error for: ${file.key}`);
      });

      // Start the loader if it hasn't started
      if (!this.scene.load.isLoading()) {
        this.scene.load.start();
      }
    });
  }

  /**
   * Encode URL path to handle special characters robustly
   * Handles Unicode characters, spaces, special symbols, and edge cases
   */
  private encodePath(path: string): string {
    // If path already starts with /, keep it; otherwise ensure it does
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    
    // Split path and encode each segment separately to preserve slashes
    // This ensures proper encoding of special characters like · (middle dot), spaces, colons, etc.
    const encoded = normalizedPath.split('/').map(segment => {
      if (!segment) return segment; // Preserve empty segments (leading/trailing slashes)
      
      // Use encodeURIComponent which properly handles:
      // - Unicode characters (like · middle dot)
      // - Spaces (encoded as %20)
      // - Special characters (colons, periods, apostrophes, etc.)
      // - All non-ASCII characters
      return encodeURIComponent(segment);
    }).join('/');
    
    return encoded;
  }

  /**
   * Load monster sprites and animations
   * Maps actual file names to simplified keys
   */
  loadMonsterAssets(): void {
    // Map of simplified keys to actual file names
    const monsterFileMap: Record<string, string> = {
      'monster-celestial-1': 'DALL·E 2024-11-20 16.27.14 - Create an AI-generated image of a Celestial Monster character from a celestial-themed game. The monster is chaotic and otherworldly, with glowing cosm.webp',
      'monster-celestial-2': 'DALL·E 2024-11-20 16.27.15 - Create an AI-generated image of a Celestial Monster character from a celestial-themed game. The monster is chaotic and otherworldly, with glowing cosm.webp',
      'monster-horror': 'DALL·E 2024-11-20 16.27.04 - Create a dramatic, horror-themed scene from the celestial-themed game WOOHOO, where the Celestial Monster is attacking all the characters. The monster.webp',
      'monster-quaternion-poster-1': 'DALL·E 2024-11-22 18.35.00 - Design a cinematic, ultra-high-quality sci-fi movie poster for \'Quaternion.\' The composition features a massive, glowing monster emanating the four po.webp',
      'monster-quaternion-poster-2': 'DALL·E 2024-11-22 18.36.36 - Create a visually striking and highly detailed sci-fi movie poster for \'Quaternion.\' At the center, a colossal, glowing monster radiates four distinct.webp',
      'monster-quaternion-poster-3': 'DALL·E 2024-11-22 18.40.56 - Design a highly cinematic sci-fi movie poster for \'Quaternion,\' featuring a towering monster radiating four distinct powers_ Time (blue), Space (green.webp',
      'monster-quaternion-poster-4': 'DALL·E 2024-11-22 18.42.21 - Create a visually striking sci-fi movie poster for \'Quaternion.\' The central focus is a towering, glowing monster radiating four powers_ Time (blue, s.webp',
      'monster-quaternion-poster-5': 'DALL·E 2024-11-22 18.44.15 - Design an enhanced sci-fi movie poster for \'Quaternion,\' focusing on the battle between a colossal monster and three futuristic starships. The monster.webp',
      'monster-elemental': 'DALL·E 2024-11-22 18.49.09 - Create an original and highly detailed sci-fi illustration of a colossal elemental monster formed from four floating islands, each representing a dist.webp',
      'monster-elemental-2': 'DALL·E 2024-11-22 18.54.19 - Design a breathtaking sci-fi illustration for \'Quaternion_ Defend the Dimensions.\' Depict a massive elemental monster formed from four floating island.webp',
      'monster-quaternion-final': 'DALL·E 2024-11-22 19.02.15 - Create a visually striking and highly original sci-fi illustration for \'Quaternion_ Defend the Dimensions.\' Center the image on a colossal monster for.webp',
    };

    for (const [key, fileName] of Object.entries(monsterFileMap)) {
      const basePath = `${this.assetPaths.monsters}${fileName}`;
      const encodedPath = this.encodePath(basePath);
      const assetKey = `monster_${key}`;

      // Load image (since we have webp files, not spritesheets)
      // Use encoded path to handle special characters in filenames
      this.scene.load.image(assetKey, encodedPath);

      // Cache metadata (stats will be loaded asynchronously if needed)
      this.assets.set(assetKey, {
        type: 'monster',
        name: key,
        path: encodedPath, // Store encoded path for consistency
        stats: this.getDefaultMonsterStats(), // Use default stats for now
      });
    }
  }

  /**
   * Load country/map theme assets
   * Maps actual file names to simplified keys
   */
  loadCountryAssets(): void {
    // Map of simplified keys to actual file names
    const countryFileMap: Record<string, string> = {
      'country-dubai': 'DALL·E 2024-11-20 16.24.01 - Create an AI-generated image of a massive Zerg-inspired monster, the Zyrithon, in a VR perspective, destroying the Burj Khalifa in Dubai, UAE. The sce.webp',
      'country-china': 'DALL·E 2024-11-20 16.24.05 - Create an AI-generated image of a massive Zerg-inspired monster, the Zyrithon, in a VR perspective, destroying the Great Wall of China. The scene shou.webp',
      'country-usa': 'DALL·E 2024-11-20 16.24.07 - Create an AI-generated image of a massive Zerg-inspired monster, the Zyrithon, in a VR perspective, destroying the Statue of Liberty in New York, USA.webp',
      'country-france': 'DALL·E 2024-11-20 16.24.09 - Create an AI-generated image of a massive Zerg-inspired monster, the Zyrithon, in a VR perspective, destroying the Eiffel Tower in Paris, France. The .webp',
    };

    for (const [country, fileName] of Object.entries(countryFileMap)) {
      const basePath = `${this.assetPaths.countries}${fileName}`;
      const encodedPath = this.encodePath(basePath);

      // Load country image (use encoded path to handle special characters)
      this.scene.load.image(`country_${country}`, encodedPath);

      // Load as tileset alternative
      this.scene.load.image(`tileset_${country}`, encodedPath);

      // Load as terrain texture
      this.scene.load.image(`terrain_${country}`, encodedPath);

      // For parallax, we'll use the same image with different scroll factors
      for (let i = 1; i <= 3; i++) {
        this.scene.load.image(`parallax_${country}_${i}`, encodedPath);
      }

      this.assets.set(`country_${country}`, {
        type: 'country',
        name: country,
        path: encodedPath, // Store encoded path for consistency
        metadata: this.getDefaultCountryMetadata(), // Use default metadata for now
      });
    }
  }

  /**
   * Load UI assets
   */
  loadUIAssets(): void {
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

    // Since we may not have all UI assets, we'll skip loading them
    // They can be loaded on-demand if needed
    console.log('UI assets can be loaded on-demand');
  }

  /**
   * Load mobile-specific assets and layouts
   */
  loadMobileAssets(): void {
    // Mobile assets can be loaded on-demand from the mobile-mockups directory
    // The ResponsiveMobileUI will create UI elements programmatically
    console.log('Mobile assets can be loaded on-demand');
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

