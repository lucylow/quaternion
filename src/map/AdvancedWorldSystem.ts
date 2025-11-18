/**
 * Advanced World System
 * Unified interface for all world generation features
 * Integrates Perlin noise, chunk management, biomes, water, and settlements
 */

import { WorldGenerator, WorldData, WorldConfig } from './WorldGenerator';
import { ChunkManager, ChunkManagerConfig } from './ChunkManager';
import { EnhancedProceduralGenerator, EnhancedMapConfig, GeneratedMap as EnhancedGeneratedMap } from './EnhancedProceduralGenerator';

export interface AdvancedWorldConfig {
  // World dimensions
  width: number;
  height: number;
  seed: number;
  
  // Generation mode
  mode: 'finite' | 'infinite';
  
  // Finite world config
  finiteConfig?: Partial<WorldConfig>;
  
  // Infinite world config
  infiniteConfig?: Partial<ChunkManagerConfig>;
  
  // Enhanced generator config (for compatibility)
  useEnhanced?: boolean;
  enhancedConfig?: Partial<EnhancedMapConfig>;
}

export interface WorldGenerationResult {
  mode: 'finite' | 'infinite';
  finiteWorld?: WorldData;
  enhancedMap?: EnhancedGeneratedMap;
  chunkManager?: ChunkManager;
  metadata: {
    seed: number;
    generationTime: number;
    width: number;
    height: number;
  };
}

/**
 * Advanced World System - Main entry point
 */
export class AdvancedWorldSystem {
  /**
   * Generate a world based on configuration
   */
  public static generate(config: AdvancedWorldConfig): WorldGenerationResult {
    const startTime = Date.now();
    const seed = config.seed || Date.now();

    if (config.mode === 'infinite') {
      return this.generateInfiniteWorld(config, seed, startTime);
    } else if (config.useEnhanced) {
      return this.generateEnhancedMap(config, seed, startTime);
    } else {
      return this.generateFiniteWorld(config, seed, startTime);
    }
  }

  /**
   * Generate finite world with full features
   */
  private static generateFiniteWorld(
    config: AdvancedWorldConfig,
    seed: number,
    startTime: number
  ): WorldGenerationResult {
    const worldConfig: WorldConfig = {
      width: config.width,
      height: config.height,
      seed,
      ...config.finiteConfig
    };

    const generator = new WorldGenerator(worldConfig);
    const world = generator.generate();

    return {
      mode: 'finite',
      finiteWorld: world,
      metadata: {
        seed,
        generationTime: Date.now() - startTime,
        width: config.width,
        height: config.height
      }
    };
  }

  /**
   * Generate infinite world with chunk management
   */
  private static generateInfiniteWorld(
    config: AdvancedWorldConfig,
    seed: number,
    startTime: number
  ): WorldGenerationResult {
    const chunkConfig: ChunkManagerConfig = {
      chunkSize: 32,
      tileSize: 1,
      viewDistance: 3,
      seed,
      ...config.infiniteConfig
    };

    const chunkManager = new ChunkManager(chunkConfig);

    return {
      mode: 'infinite',
      chunkManager,
      metadata: {
        seed,
        generationTime: Date.now() - startTime,
        width: 0, // Infinite
        height: 0 // Infinite
      }
    };
  }

  /**
   * Generate enhanced map (compatibility mode)
   */
  private static generateEnhancedMap(
    config: AdvancedWorldConfig,
    seed: number,
    startTime: number
  ): WorldGenerationResult {
    const enhancedConfig: EnhancedMapConfig = {
      width: config.width,
      height: config.height,
      seed,
      ...config.enhancedConfig
    };

    const generator = new EnhancedProceduralGenerator(enhancedConfig);
    const map = generator.generate();

    return {
      mode: 'finite',
      enhancedMap: map,
      metadata: {
        seed,
        generationTime: Date.now() - startTime,
        width: config.width,
        height: config.height
      }
    };
  }

  /**
   * Convert finite world to enhanced map format (for compatibility)
   */
  public static convertWorldToEnhancedMap(world: WorldData): EnhancedGeneratedMap {
    const nodes = world.resources.map(resource => ({
      x: resource.x,
      y: resource.y,
      type: resource.type as 'matter' | 'energy' | 'life' | 'knowledge',
      richness: Math.floor((resource.amount / resource.maxAmount) * 100),
      elevation: world.heightMap[resource.x][resource.y] * 100 - 50,
      strategicValue: Math.floor(world.heightMap[resource.x][resource.y] * 100)
    }));

    // Add central node
    const centerX = Math.floor(world.width / 2);
    const centerY = Math.floor(world.height / 2);
    nodes.push({
      x: centerX,
      y: centerY,
      type: 'central',
      richness: 100,
      elevation: world.heightMap[centerX][centerY] * 100 - 50,
      strategicValue: 100
    });

    // Convert terrain features
    const terrainFeatures = world.settlements.map(settlement => ({
      x: settlement.x,
      y: settlement.y,
      type: 'plateau' as const,
      elevation: world.heightMap[settlement.x][settlement.y] * 100 - 50,
      passability: 0.8,
      strategicValue: settlement.population / 10
    }));

    return {
      width: world.width,
      height: world.height,
      nodes,
      strategicPoints: [],
      terrainFeatures,
      playerStart: { x: world.width * 0.2, y: world.height * 0.5 },
      aiStart: { x: world.width * 0.8, y: world.height * 0.5 },
      centralNode: nodes.find(n => n.type === 'central') || null,
      seed: world.seed,
      personality: 'economic',
      biome: 'crystalline',
      strategicDNA: {
        openness: 0.5,
        defensiveness: 0.3,
        economicValue: 0.7,
        complexity: 0.4
      }
    };
  }

  /**
   * Get biome color for visualization
   */
  public static getBiomeColor(biome: string): string {
    const biomeColors: Record<string, string> = {
      water: '#4A90E2',
      plains: '#90EE90',
      forest: '#228B22',
      swamp: '#556B2F',
      desert: '#EDC9AF',
      savanna: '#D2B48C',
      jungle: '#2F4F2F',
      mountain: '#696969',
      snow: '#FFFAFA',
      tundra: '#E0E0E0'
    };

    return biomeColors[biome] || '#808080';
  }

  /**
   * Get height color for visualization
   */
  public static getHeightColor(height: number): string {
    if (height < 0.2) return '#4A90E2'; // Water
    if (height < 0.3) return '#F4A460'; // Beach
    if (height < 0.5) return '#90EE90'; // Plains
    if (height < 0.7) return '#8B7355'; // Hills
    if (height < 0.9) return '#696969'; // Mountains
    return '#FFFAFA'; // Snow
  }
}


