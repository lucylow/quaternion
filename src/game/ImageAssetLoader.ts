/**
 * Image Asset Loader for Phaser
 * Manages loading and organizing game images (maps, monsters, countries, etc.)
 */

export interface ImageAsset {
  key: string;
  path: string;
  category: 'map' | 'monster' | 'country' | 'ui' | 'other';
}

export class ImageAssetLoader {
  private static mapAssets: ImageAsset[] = [];
  private static monsterAssets: ImageAsset[] = [];
  private static countryAssets: ImageAsset[] = [];
  private static allAssets: ImageAsset[] = [];

  /**
   * Initialize asset lists from available files
   * Using simplified keys and paths that match the actual file structure
   */
  static initializeAssets(): void {
    // Map assets - using simplified keys for easier reference (all 12 maps)
    this.mapAssets = [
      { key: 'map-twilight', path: '/assets/maps/DALL·E 2024-11-20 16.22.21 - Create a unique 2D and 3D map design for a twilight biome for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature glowing a.webp', category: 'map' },
      { key: 'map-urban', path: '/assets/maps/DALL·E 2024-11-20 16.22.24 - Create a unique 2D and 3D map design for an urban battlefield for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature dense.webp', category: 'map' },
      { key: 'map-underwater', path: '/assets/maps/DALL·E 2024-11-20 16.22.28 - Create a unique 2D and 3D map design for an underwater biome for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature glowin.webp', category: 'map' },
      { key: 'map-mountain', path: '/assets/maps/DALL·E 2024-11-20 16.22.32 - Create a unique 2D and 3D map design for a mountainous terrain for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature laye.webp', category: 'map' },
      { key: 'map-desert', path: '/assets/maps/DALL·E 2024-11-20 16.22.35 - Create a unique 2D and 3D map design for a desert terrain for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature shifting .webp', category: 'map' },
      { key: 'map-icy', path: '/assets/maps/DALL·E 2024-11-20 16.22.38 - Create a unique 2D and 3D map design for an icy wasteland for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature slippery .webp', category: 'map' },
      { key: 'map-volcanic', path: '/assets/maps/DALL·E 2024-11-20 16.22.41 - Create a unique 2D and 3D map design for a volcanic terrain for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature glowing.webp', category: 'map' },
      { key: 'map-jungle', path: '/assets/maps/DALL·E 2024-11-20 16.22.45 - Create a unique 2D and 3D map design for a lush alien jungle for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature glowin.webp', category: 'map' },
      { key: 'map-varied', path: '/assets/maps/DALL·E 2024-11-20 16.22.47 - Create 8 unique 2D and 3D map designs for a StarCraft-inspired mobile game titled \'Eclipse Down,\' each representing varied terrains and gameplay chall.webp', category: 'map' },
      { key: 'map-easy', path: '/assets/maps/DALL·E 2024-11-20 16.22.49 - Create a 2D and 3D map for an __Easy difficulty__ level in the StarCraft-inspired game \'Eclipse Down.\' The map should feature open terrain with minima.webp', category: 'map' },
      { key: 'map-difficulty-series', path: '/assets/maps/DALL·E 2024-11-20 16.22.51 - Design a series of 2D and 3D maps for the StarCraft-inspired game \'Eclipse Down,\' each reflecting different difficulty levels. Include_ 1) __Easy Map_.webp', category: 'map' },
      { key: 'map-hybrid', path: '/assets/maps/DALL·E 2024-11-20 16.22.56 - Design both 2D and 3D maps for a StarCraft-inspired game titled \'Eclipse Down.\' The 2D map should display a tactical, top-down interface with detailed.webp', category: 'map' },
    ];

    // Monster assets - key monsters for the game
    this.monsterAssets = [
      { key: 'monster-celestial-1', path: '/assets/monsters/DALL·E 2024-11-20 16.27.14 - Create an AI-generated image of a Celestial Monster character from a celestial-themed game. The monster is chaotic and otherworldly, with glowing cosm.webp', category: 'monster' },
      { key: 'monster-celestial-2', path: '/assets/monsters/DALL·E 2024-11-20 16.27.15 - Create an AI-generated image of a Celestial Monster character from a celestial-themed game. The monster is chaotic and otherworldly, with glowing cosm.webp', category: 'monster' },
      { key: 'monster-quaternion-poster-1', path: '/assets/monsters/DALL·E 2024-11-22 18.35.00 - Design a cinematic, ultra-high-quality sci-fi movie poster for \'Quaternion.\' The composition features a massive, glowing monster emanating the four po.webp', category: 'monster' },
      { key: 'monster-quaternion-poster-2', path: '/assets/monsters/DALL·E 2024-11-22 18.36.36 - Create a visually striking and highly detailed sci-fi movie poster for \'Quaternion.\' At the center, a colossal, glowing monster radiates four distinct.webp', category: 'monster' },
      { key: 'monster-elemental', path: '/assets/monsters/DALL·E 2024-11-22 18.49.09 - Create an original and highly detailed sci-fi illustration of a colossal elemental monster formed from four floating islands, each representing a dist.webp', category: 'monster' },
      { key: 'monster-horror', path: '/assets/monsters/DALL·E 2024-11-20 16.27.04 - Create a dramatic, horror-themed scene from the celestial-themed game WOOHOO, where the Celestial Monster is attacking all the characters. The monster.webp', category: 'monster' },
    ];

    // Country/VR assets - special event backgrounds
    this.countryAssets = [
      { key: 'country-dubai', path: '/assets/countries/DALL·E 2024-11-20 16.24.01 - Create an AI-generated image of a massive Zerg-inspired monster, the Zyrithon, in a VR perspective, destroying the Burj Khalifa in Dubai, UAE. The sce.webp', category: 'country' },
      { key: 'country-china', path: '/assets/countries/DALL·E 2024-11-20 16.24.05 - Create an AI-generated image of a massive Zerg-inspired monster, the Zyrithon, in a VR perspective, destroying the Great Wall of China. The scene shou.webp', category: 'country' },
      { key: 'country-usa', path: '/assets/countries/DALL·E 2024-11-20 16.24.07 - Create an AI-generated image of a massive Zerg-inspired monster, the Zyrithon, in a VR perspective, destroying the Statue of Liberty in New York, USA.webp', category: 'country' },
      { key: 'country-france', path: '/assets/countries/DALL·E 2024-11-20 16.24.09 - Create an AI-generated image of a massive Zerg-inspired monster, the Zyrithon, in a VR perspective, destroying the Eiffel Tower in Paris, France. The .webp', category: 'country' },
    ];

    this.allAssets = [...this.mapAssets, ...this.monsterAssets, ...this.countryAssets];
  }

  /**
   * Encode URL path to handle special characters
   */
  private static encodePath(path: string): string {
    // Split path and encode each segment separately to preserve slashes
    return path.split('/').map(segment => encodeURIComponent(segment)).join('/');
  }

  /**
   * Load all assets into a Phaser scene
   */
  static loadAssets(scene: Phaser.Scene): void {
    this.allAssets.forEach(asset => {
      const encodedPath = this.encodePath(asset.path);
      scene.load.image(asset.key, encodedPath);
    });
  }

  /**
   * Load only map assets
   */
  static loadMaps(scene: Phaser.Scene): void {
    this.mapAssets.forEach(asset => {
      const encodedPath = this.encodePath(asset.path);
      scene.load.image(asset.key, encodedPath);
    });
  }

  /**
   * Load only monster assets
   */
  static loadMonsters(scene: Phaser.Scene): void {
    this.monsterAssets.forEach(asset => {
      const encodedPath = this.encodePath(asset.path);
      scene.load.image(asset.key, encodedPath);
    });
  }

  /**
   * Load only country assets
   */
  static loadCountries(scene: Phaser.Scene): void {
    this.countryAssets.forEach(asset => {
      const encodedPath = this.encodePath(asset.path);
      scene.load.image(asset.key, encodedPath);
    });
  }

  /**
   * Get a random map asset key
   */
  static getRandomMap(): string {
    if (this.mapAssets.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * this.mapAssets.length);
    return this.mapAssets[randomIndex].key;
  }

  /**
   * Get a random monster asset key
   */
  static getRandomMonster(): string {
    if (this.monsterAssets.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * this.monsterAssets.length);
    return this.monsterAssets[randomIndex].key;
  }

  /**
   * Get all map keys
   */
  static getMapKeys(): string[] {
    return this.mapAssets.map(asset => asset.key);
  }

  /**
   * Get all monster keys
   */
  static getMonsterKeys(): string[] {
    return this.monsterAssets.map(asset => asset.key);
  }

  /**
   * Get all country keys
   */
  static getCountryKeys(): string[] {
    return this.countryAssets.map(asset => asset.key);
  }

  /**
   * Get Phaser key for a map ID (from maps.json)
   * Maps map IDs to Phaser asset keys
   */
  static getMapKeyByMapId(mapId: string): string | null {
    const mapIdToKeyMap: Record<string, string> = {
      'twilight_biome': 'map-twilight',
      'urban_battlefield': 'map-urban',
      'underwater_biome': 'map-underwater',
      'mountainous_terrain': 'map-mountain',
      'desert_terrain': 'map-desert',
      'icy_wasteland': 'map-icy',
      'volcanic_terrain': 'map-volcanic',
      'alien_jungle': 'map-jungle',
      'varied_terrains': 'map-varied',
      'easy_map': 'map-easy',
      'difficulty_series': 'map-difficulty-series',
      'hybrid_2d_3d': 'map-hybrid'
    };
    return mapIdToKeyMap[mapId] || null;
  }

  /**
   * Get map asset by path
   */
  static getMapAssetByPath(imagePath: string): ImageAsset | undefined {
    return this.mapAssets.find(asset => asset.path === imagePath);
  }
}

// Initialize on module load
ImageAssetLoader.initializeAssets();

