/**
 * Chunk Manager for Infinite Terrain
 * Manages loading and unloading of terrain chunks for infinite worlds
 */

import { WorldGenerator, WorldData, WorldConfig } from './WorldGenerator';
import { PerlinNoise } from './PerlinNoise';

export interface Chunk {
  x: number; // Chunk grid X coordinate
  y: number; // Chunk grid Y coordinate
  worldX: number; // World X coordinate of chunk origin
  worldY: number; // World Y coordinate of chunk origin
  data: ChunkData;
  isLoaded: boolean;
  lastAccessed: number;
}

export interface ChunkData {
  heightMap: number[][];
  moistureMap: number[][];
  temperatureMap: number[][];
  biomeMap: string[][];
  waterMap: boolean[][];
  resources: Array<{ x: number; y: number; type: string; amount: number }>;
}

export interface ChunkManagerConfig {
  chunkSize: number; // Size of each chunk in tiles
  tileSize: number; // Size of each tile in pixels
  viewDistance: number; // Number of chunks to load around player
  seed: number;
  noiseScale?: number;
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
}

export class ChunkManager {
  private config: ChunkManagerConfig;
  private chunks: Map<string, Chunk>;
  private heightNoise: PerlinNoise;
  private moistureNoise: PerlinNoise;
  private temperatureNoise: PerlinNoise;
  private maxChunks: number;

  constructor(config: ChunkManagerConfig) {
    this.config = {
      noiseScale: 0.1,
      octaves: 4,
      persistence: 0.5,
      lacunarity: 2.0,
      ...config
    };

    this.chunks = new Map();
    this.heightNoise = new PerlinNoise(config.seed);
    this.moistureNoise = new PerlinNoise(config.seed + 1);
    this.temperatureNoise = new PerlinNoise(config.seed + 2);
    
    // Maximum chunks to keep in memory
    this.maxChunks = (this.config.viewDistance * 2 + 1) ** 2 * 2;
  }

  /**
   * Get chunk key from coordinates
   */
  private getChunkKey(chunkX: number, chunkY: number): string {
    return `${chunkX},${chunkY}`;
  }

  /**
   * Convert world coordinates to chunk coordinates
   */
  public worldToChunk(worldX: number, worldY: number): { chunkX: number; chunkY: number } {
    return {
      chunkX: Math.floor(worldX / this.config.chunkSize),
      chunkY: Math.floor(worldY / this.config.chunkSize)
    };
  }

  /**
   * Convert chunk coordinates to world coordinates (chunk origin)
   */
  public chunkToWorld(chunkX: number, chunkY: number): { worldX: number; worldY: number } {
    return {
      worldX: chunkX * this.config.chunkSize,
      worldY: chunkY * this.config.chunkSize
    };
  }

  /**
   * Get or generate chunk at chunk coordinates
   */
  public getChunk(chunkX: number, chunkY: number): Chunk {
    const key = this.getChunkKey(chunkX, chunkY);
    
    let chunk = this.chunks.get(key);
    
    if (!chunk || !chunk.isLoaded) {
      chunk = this.generateChunk(chunkX, chunkY);
      this.chunks.set(key, chunk);
      
      // Clean up old chunks if we exceed memory limit
      if (this.chunks.size > this.maxChunks) {
        this.cleanupOldChunks();
      }
    } else {
      chunk.lastAccessed = Date.now();
    }
    
    return chunk;
  }

  /**
   * Generate a new chunk
   */
  private generateChunk(chunkX: number, chunkY: number): Chunk {
    const { worldX, worldY } = this.chunkToWorld(chunkX, chunkY);
    
    const chunkData: ChunkData = {
      heightMap: [],
      moistureMap: [],
      temperatureMap: [],
      biomeMap: [],
      waterMap: [],
      resources: []
    };

    // Generate terrain for each tile in chunk
    for (let localY = 0; localY < this.config.chunkSize; localY++) {
      const heightRow: number[] = [];
      const moistureRow: number[] = [];
      const temperatureRow: number[] = [];
      const biomeRow: string[] = [];
      const waterRow: boolean[] = [];

      for (let localX = 0; localX < this.config.chunkSize; localX++) {
        const worldTileX = worldX + localX;
        const worldTileY = worldY + localY;

        // Generate height
        let height = this.heightNoise.fbm2D(
          worldTileX * this.config.noiseScale!,
          worldTileY * this.config.noiseScale!,
          this.config.octaves!,
          this.config.persistence!,
          this.config.lacunarity!
        );
        height = (height + 1) * 0.5; // Normalize to 0-1

        // Generate temperature
        let temperature = this.temperatureNoise.fbm2D(
          worldTileX * this.config.noiseScale!,
          worldTileY * this.config.noiseScale!,
          this.config.octaves!,
          this.config.persistence!,
          this.config.lacunarity!
        );
        temperature = (temperature + 1) * 0.5;
        temperature *= (1 - height); // Higher = colder

        // Generate moisture
        let moisture = this.moistureNoise.fbm2D(
          worldTileX * this.config.noiseScale! * 1.5,
          worldTileY * this.config.noiseScale! * 1.5,
          this.config.octaves!,
          this.config.persistence!,
          this.config.lacunarity!
        );
        moisture = (moisture + 1) * 0.5;

        // Determine if water
        const isWater = height < 0.2;

        // Determine biome
        const biome = isWater ? 'water' : this.determineBiome(height, temperature, moisture);

        heightRow.push(height);
        moistureRow.push(moisture);
        temperatureRow.push(temperature);
        biomeRow.push(biome);
        waterRow.push(isWater);

        // Generate resources
        if (!isWater && height > 0.2) {
          const resourceNoise = this.heightNoise.fbm2D(
            worldTileX * 0.05,
            worldTileY * 0.05,
            3,
            0.5,
            2.0
          );
          const threshold = (resourceNoise + 1) * 0.5;

          if (threshold > 0.7) {
            const resourceTypes = ['matter', 'energy', 'life', 'knowledge'];
            const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            const amount = Math.floor(Math.random() * 400) + 100;

            chunkData.resources.push({
              x: worldTileX,
              y: worldTileY,
              type,
              amount
            });
          }
        }
      }

      chunkData.heightMap.push(heightRow);
      chunkData.moistureMap.push(moistureRow);
      chunkData.temperatureMap.push(temperatureRow);
      chunkData.biomeMap.push(biomeRow);
      chunkData.waterMap.push(waterRow);
    }

    return {
      x: chunkX,
      y: chunkY,
      worldX,
      worldY,
      data: chunkData,
      isLoaded: true,
      lastAccessed: Date.now()
    };
  }

  /**
   * Determine biome from climate parameters
   */
  private determineBiome(height: number, temperature: number, moisture: number): string {
    if (height < 0.2) return 'water';
    if (height > 0.8) {
      if (temperature < 0.3) return 'snow';
      return 'mountain';
    }

    if (temperature < 0.3) {
      if (moisture < 0.4) return 'tundra';
      return 'snow';
    }

    if (temperature > 0.7) {
      if (moisture < 0.3) return 'desert';
      if (moisture < 0.6) return 'savanna';
      return 'jungle';
    }

    if (moisture < 0.3) return 'plains';
    if (moisture < 0.6) return 'forest';
    return 'swamp';
  }

  /**
   * Load chunks around a position
   */
  public loadChunksAround(worldX: number, worldY: number): Chunk[] {
    const { chunkX, chunkY } = this.worldToChunk(worldX, worldY);
    const loadedChunks: Chunk[] = [];

    for (let dx = -this.config.viewDistance; dx <= this.config.viewDistance; dx++) {
      for (let dy = -this.config.viewDistance; dy <= this.config.viewDistance; dy++) {
        const x = chunkX + dx;
        const y = chunkY + dy;
        const chunk = this.getChunk(x, y);
        loadedChunks.push(chunk);
      }
    }

    return loadedChunks;
  }

  /**
   * Unload chunks that are too far from a position
   */
  public unloadDistantChunks(worldX: number, worldY: number): void {
    const { chunkX, chunkY } = this.worldToChunk(worldX, worldY);
    const unloadDistance = this.config.viewDistance + 2;

    const chunksToUnload: string[] = [];

    for (const [key, chunk] of this.chunks.entries()) {
      const distance = Math.max(
        Math.abs(chunk.x - chunkX),
        Math.abs(chunk.y - chunkY)
      );

      if (distance > unloadDistance) {
        chunksToUnload.push(key);
      }
    }

    for (const key of chunksToUnload) {
      this.chunks.delete(key);
    }
  }

  /**
   * Get tile data at world coordinates
   */
  public getTileAt(worldX: number, worldY: number): {
    height: number;
    moisture: number;
    temperature: number;
    biome: string;
    isWater: boolean;
  } | null {
    const { chunkX, chunkY } = this.worldToChunk(worldX, worldY);
    const chunk = this.getChunk(chunkX, chunkY);

    const localX = worldX - chunk.worldX;
    const localY = worldY - chunk.worldY;

    if (
      localX < 0 || localX >= this.config.chunkSize ||
      localY < 0 || localY >= this.config.chunkSize
    ) {
      return null;
    }

    return {
      height: chunk.data.heightMap[localY][localX],
      moisture: chunk.data.moistureMap[localY][localX],
      temperature: chunk.data.temperatureMap[localY][localX],
      biome: chunk.data.biomeMap[localY][localX],
      isWater: chunk.data.waterMap[localY][localX]
    };
  }

  /**
   * Clean up old chunks based on last access time
   */
  private cleanupOldChunks(): void {
    const chunksArray = Array.from(this.chunks.entries());
    
    // Sort by last accessed time (oldest first)
    chunksArray.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove oldest chunks until we're under the limit
    const toRemove = chunksArray.length - this.maxChunks;
    for (let i = 0; i < toRemove; i++) {
      this.chunks.delete(chunksArray[i][0]);
    }
  }

  /**
   * Get all currently loaded chunks
   */
  public getLoadedChunks(): Chunk[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Clear all chunks
   */
  public clear(): void {
    this.chunks.clear();
  }
}

