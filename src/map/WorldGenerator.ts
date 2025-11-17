/**
 * Advanced World Generator
 * Generates complete worlds with height maps, climate, biomes, and features
 * Based on the comprehensive world generation system
 */

import { PerlinNoise } from './PerlinNoise';
import { SeededRandom } from '../lib/SeededRandom';

export interface WorldConfig {
  width: number;
  height: number;
  seed: number;
  tileSize?: number;
  noiseScale?: number;
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
}

export interface WorldData {
  width: number;
  height: number;
  seed: number;
  heightMap: number[][];
  moistureMap: number[][];
  temperatureMap: number[][];
  biomeMap: string[][];
  waterMap: boolean[][];
  roadMap: boolean[][];
  resources: ResourceDeposit[];
  settlements: Settlement[];
  rivers: River[];
  lakes: Lake[];
}

export interface ResourceDeposit {
  x: number;
  y: number;
  type: 'matter' | 'energy' | 'life' | 'knowledge';
  amount: number;
  maxAmount: number;
}

export interface Settlement {
  name: string;
  x: number;
  y: number;
  size: SettlementSize;
  type: SettlementType;
  population: number;
  buildings: Building[];
}

export interface Building {
  x: number;
  y: number;
  type: string;
}

export interface River {
  path: Array<{ x: number; y: number }>;
  width: number;
}

export interface Lake {
  tiles: Array<{ x: number; y: number }>;
  centerX: number;
  centerY: number;
}

export enum SettlementSize {
  HAMLET = 'hamlet',
  VILLAGE = 'village',
  TOWN = 'town',
  CITY = 'city'
}

export enum SettlementType {
  AGRICULTURAL = 'agricultural',
  MINING = 'mining',
  TRADING = 'trading',
  MILITARY = 'military',
  RELIGIOUS = 'religious'
}

export class WorldGenerator {
  private config: WorldConfig;
  private heightNoise: PerlinNoise;
  private moistureNoise: PerlinNoise;
  private temperatureNoise: PerlinNoise;
  private rng: SeededRandom;

  constructor(config: WorldConfig) {
    this.config = {
      tileSize: 1,
      noiseScale: 0.1,
      octaves: 4,
      persistence: 0.5,
      lacunarity: 2.0,
      ...config
    };

    this.rng = new SeededRandom(config.seed);
    
    // Initialize noise generators with different seeds
    this.heightNoise = new PerlinNoise(config.seed);
    this.moistureNoise = new PerlinNoise(config.seed + 1);
    this.temperatureNoise = new PerlinNoise(config.seed + 2);
  }

  /**
   * Generate complete world
   */
  public generate(): WorldData {
    const world: WorldData = {
      width: this.config.width,
      height: this.config.height,
      seed: this.config.seed,
      heightMap: this.create2DArray(this.config.width, this.config.height, 0),
      moistureMap: this.create2DArray(this.config.width, this.config.height, 0),
      temperatureMap: this.create2DArray(this.config.width, this.config.height, 0),
      biomeMap: this.create2DArray(this.config.width, this.config.height, 'plains'),
      waterMap: this.create2DArray(this.config.width, this.config.height, false),
      roadMap: this.create2DArray(this.config.width, this.config.height, false),
      resources: [],
      settlements: [],
      rivers: [],
      lakes: []
    };

    // Generate base terrain
    this.generateHeightMap(world);
    
    // Apply erosion
    this.applyErosion(world);
    
    // Generate climate maps
    this.generateClimateMaps(world);
    
    // Generate water systems
    this.generateWaterSystems(world);
    
    // Assign biomes
    this.assignBiomes(world);
    
    // Generate resources
    this.generateResources(world);
    
    // Generate settlements
    this.generateSettlements(world);
    
    // Generate roads
    this.generateRoads(world);

    return world;
  }

  /**
   * Generate height map using Perlin noise
   */
  private generateHeightMap(world: WorldData): void {
    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        // Base height from primary noise
        let height = this.heightNoise.fbm2D(
          x * this.config.noiseScale!,
          y * this.config.noiseScale!,
          this.config.octaves!,
          this.config.persistence!,
          this.config.lacunarity!
        );

        // Add ridge noise for mountain ranges
        const ridgeNoise = this.heightNoise.ridge2D(
          x * this.config.noiseScale! * 2,
          y * this.config.noiseScale! * 2,
          this.config.octaves!,
          this.config.persistence!,
          this.config.lacunarity!
        );

        // Domain warping for more natural shapes
        const warped = this.heightNoise.domainWarp2D(
          x * this.config.noiseScale!,
          y * this.config.noiseScale!,
          50,
          this.config.octaves!
        );
        const domainWarped = this.heightNoise.fbm2D(
          warped.x * this.config.noiseScale! * 0.5,
          warped.y * this.config.noiseScale! * 0.5,
          this.config.octaves!,
          this.config.persistence!,
          this.config.lacunarity!
        );

        // Combine noise layers
        height = (height * 0.6) + (ridgeNoise * 0.3) + (domainWarped * 0.1);

        // Normalize to 0-1 range
        height = (height + 1) * 0.5;
        
        // Apply curve for better height distribution
        height = this.applyHeightCurve(height);

        world.heightMap[x][y] = Math.max(0, Math.min(1, height));
      }
    }
  }

  /**
   * Apply height curve for better terrain distribution
   */
  private applyHeightCurve(height: number): number {
    // Smooth curve that emphasizes mid-range heights
    return Math.pow(height, 1.2);
  }

  /**
   * Apply hydraulic erosion to terrain
   */
  private applyErosion(world: WorldData): void {
    const erosionIterations = Math.floor(world.width * world.height * 0.1);
    
    for (let i = 0; i < erosionIterations; i++) {
      const x = this.rng.nextInt(1, world.width - 2);
      const y = this.rng.nextInt(1, world.height - 2);
      this.simulateWaterDroplet(world, x, y);
    }
  }

  /**
   * Simulate water droplet erosion
   */
  private simulateWaterDroplet(world: WorldData, startX: number, startY: number): void {
    let sediment = 0;
    let posX = startX;
    let posY = startY;
    let velX = 0;
    let velY = 0;

    for (let lifetime = 0; lifetime < 30; lifetime++) {
      const x = Math.round(posX);
      const y = Math.round(posY);

      if (x < 1 || x >= world.width - 1 || y < 1 || y >= world.height - 1) {
        break;
      }

      // Calculate gradient
      const height = world.heightMap[x][y];
      const heightLeft = world.heightMap[x - 1][y];
      const heightRight = world.heightMap[x + 1][y];
      const heightDown = world.heightMap[x][y - 1];
      const heightUp = world.heightMap[x][y + 1];

      const gradX = heightRight - heightLeft;
      const gradY = heightUp - heightDown;

      // Update velocity
      const speed = Math.sqrt(velX * velX + velY * velY);
      velX = (velX + gradX * 0.1) * 0.9;
      velY = (velY + gradY * 0.1) * 0.9;

      // Normalize velocity
      const velMag = Math.sqrt(velX * velX + velY * velY);
      if (velMag > 0.01) {
        velX /= velMag;
        velY /= velMag;
      }

      // Update position
      posX += velX;
      posY += velY;

      // Erode
      const erosionAmount = Math.min(world.heightMap[x][y], 0.05);
      world.heightMap[x][y] -= erosionAmount;
      sediment += erosionAmount;

      // Deposit sediment when velocity slows
      if (velMag < 0.01 && sediment > 0) {
        world.heightMap[x][y] += sediment * 0.3;
        sediment *= 0.7;
      }
    }
  }

  /**
   * Generate climate maps (temperature and moisture)
   */
  private generateClimateMaps(world: WorldData): void {
    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        const height = world.heightMap[x][y];
        
        // Temperature based on height and latitude
        const latitudeEffect = Math.abs((y / world.height) - 0.5) * 2; // 0 at equator, 1 at poles
        
        let temperature = this.temperatureNoise.fbm2D(
          x * this.config.noiseScale!,
          y * this.config.noiseScale!,
          this.config.octaves!,
          this.config.persistence!,
          this.config.lacunarity!
        );
        temperature = (temperature + 1) * 0.5; // Convert to 0-1
        temperature *= (1 - height); // Higher = colder
        temperature *= (1 - latitudeEffect * 0.5); // Poles are colder
        
        world.temperatureMap[x][y] = Math.max(0, Math.min(1, temperature));

        // Moisture based on noise and distance to water
        let moisture = this.moistureNoise.fbm2D(
          x * this.config.noiseScale! * 1.5,
          y * this.config.noiseScale! * 1.5,
          this.config.octaves!,
          this.config.persistence!,
          this.config.lacunarity!
        );
        moisture = (moisture + 1) * 0.5;

        // Increase moisture near water bodies (will be updated after water generation)
        world.moistureMap[x][y] = Math.max(0, Math.min(1, moisture));
      }
    }
  }

  /**
   * Generate water systems (rivers and lakes)
   */
  private generateWaterSystems(world: WorldData): void {
    // Generate rivers from mountains
    this.generateRivers(world);
    
    // Generate lakes
    this.generateLakes(world);
    
    // Update moisture map based on water
    this.updateMoistureFromWater(world);
  }

  /**
   * Generate rivers flowing from high to low terrain
   */
  private generateRivers(world: WorldData): void {
    const riverSources: Array<{ x: number; y: number }> = [];

    // Find river sources in mountains
    for (let x = 10; x < world.width - 10; x += 5) {
      for (let y = 10; y < world.height - 10; y += 5) {
        const height = world.heightMap[x][y];
        if (height > 0.8) { // High mountains
          const sourceChance = height * 0.3;
          if (this.rng.next() < sourceChance) {
            riverSources.push({ x, y });
          }
        }
      }
    }

    // Generate rivers from sources
    for (const source of riverSources) {
      const river = this.generateRiverFromSource(world, source.x, source.y);
      if (river && river.path.length > 10) {
        world.rivers.push(river);
      }
    }
  }

  /**
   * Generate a single river from source
   */
  private generateRiverFromSource(world: WorldData, startX: number, startY: number): River | null {
    const path: Array<{ x: number; y: number }> = [];
    let currentX = startX;
    let currentY = startY;
    const maxLength = 100;

    for (let i = 0; i < maxLength; i++) {
      path.push({ x: Math.round(currentX), y: Math.round(currentY) });
      
      const x = Math.round(currentX);
      const y = Math.round(currentY);
      
      if (x < 1 || x >= world.width - 1 || y < 1 || y >= world.height - 1) {
        break;
      }

      world.waterMap[x][y] = true;
      world.heightMap[x][y] = Math.max(0.2, world.heightMap[x][y] - 0.1);

      // Find next point (flow downhill)
      const next = this.findDownhillNeighbor(world, x, y);
      if (!next || world.heightMap[next.x][next.y] <= 0.2) {
        break;
      }

      currentX = next.x;
      currentY = next.y;
    }

    return path.length > 0 ? { path, width: 1 } : null;
  }

  /**
   * Find downhill neighbor for river flow
   */
  private findDownhillNeighbor(world: WorldData, x: number, y: number): { x: number; y: number } | null {
    let bestX = x;
    let bestY = y;
    let bestHeight = world.heightMap[x][y];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height) {
          const neighborHeight = world.heightMap[nx][ny];
          if (neighborHeight < bestHeight) {
            bestHeight = neighborHeight;
            bestX = nx;
            bestY = ny;
          }
        }
      }
    }

    return bestX !== x || bestY !== y ? { x: bestX, y: bestY } : null;
  }

  /**
   * Generate lakes in low-lying areas
   */
  private generateLakes(world: WorldData): void {
    for (let x = 5; x < world.width - 5; x += 3) {
      for (let y = 5; y < world.height - 5; y += 3) {
        const height = world.heightMap[x][y];
        const moisture = world.moistureMap[x][y];

        if (height > 0.2 && height < 0.4 && moisture > 0.7) {
          if (this.rng.next() < 0.1) {
            const lake = this.generateLake(world, x, y);
            if (lake) {
              world.lakes.push(lake);
            }
          }
        }
      }
    }
  }

  /**
   * Generate a single lake
   */
  private generateLake(world: WorldData, centerX: number, centerY: number): Lake | null {
    const lakeRadius = this.rng.nextInt(3, 8);
    const tiles: Array<{ x: number; y: number }> = [];

    for (let x = centerX - lakeRadius; x <= centerX + lakeRadius; x++) {
      for (let y = centerY - lakeRadius; y <= centerY + lakeRadius; y++) {
        if (x >= 0 && x < world.width && y >= 0 && y < world.height) {
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (distance <= lakeRadius) {
            world.waterMap[x][y] = true;
            world.heightMap[x][y] = 0.2; // Flat lake bottom
            tiles.push({ x, y });
          }
        }
      }
    }

    return tiles.length > 0 ? { tiles, centerX, centerY } : null;
  }

  /**
   * Update moisture map based on water bodies
   */
  private updateMoistureFromWater(world: WorldData): void {
    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        if (world.waterMap[x][y]) {
          // Increase moisture near water
          for (let dx = -10; dx <= 10; dx++) {
            for (let dy = -10; dy <= 10; dy++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                const moistureBoost = Math.max(0, 1 - distance / 10) * 0.3;
                world.moistureMap[nx][ny] = Math.min(1, world.moistureMap[nx][ny] + moistureBoost);
              }
            }
          }
        }
      }
    }
  }

  /**
   * Assign biomes based on height, temperature, and moisture
   */
  private assignBiomes(world: WorldData): void {
    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        if (world.waterMap[x][y]) {
          world.biomeMap[x][y] = 'water';
        } else {
          const height = world.heightMap[x][y];
          const temperature = world.temperatureMap[x][y];
          const moisture = world.moistureMap[x][y];
          
          world.biomeMap[x][y] = this.determineBiome(height, temperature, moisture);
        }
      }
    }
  }

  /**
   * Determine biome from climate parameters
   */
  private determineBiome(height: number, temperature: number, moisture: number): string {
    // Water is handled separately
    if (height < 0.2) return 'water';

    // High elevation = mountains
    if (height > 0.8) {
      if (temperature < 0.3) return 'snow';
      return 'mountain';
    }

    // Temperature-based biomes
    if (temperature < 0.3) {
      if (moisture < 0.4) return 'tundra';
      return 'snow';
    }

    if (temperature > 0.7) {
      if (moisture < 0.3) return 'desert';
      if (moisture < 0.6) return 'savanna';
      return 'jungle';
    }

    // Temperate biomes
    if (moisture < 0.3) return 'plains';
    if (moisture < 0.6) return 'forest';
    return 'swamp';
  }

  /**
   * Generate resources based on biomes
   */
  private generateResources(world: WorldData): void {
    const resourceTypes: Array<'matter' | 'energy' | 'life' | 'knowledge'> = 
      ['matter', 'energy', 'life', 'knowledge'];
    
    const resourceNoise = new PerlinNoise(this.config.seed + 100);

    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        if (!world.waterMap[x][y] && world.heightMap[x][y] > 0.2) {
          const noiseValue = resourceNoise.fbm2D(
            x * 0.05,
            y * 0.05,
            3,
            0.5,
            2.0
          );
          const threshold = (noiseValue + 1) * 0.5;

          if (threshold > 0.7) {
            const type = this.rng.choice(resourceTypes);
            const amount = this.rng.nextInt(100, 500);
            
            world.resources.push({
              x,
              y,
              type,
              amount,
              maxAmount: amount
            });
          }
        }
      }
    }
  }

  /**
   * Generate settlements
   */
  private generateSettlements(world: WorldData): void {
    const sites = this.findSettlementSites(world);
    
    for (const site of sites) {
      const settlement = this.createSettlement(world, site.x, site.y);
      if (settlement) {
        world.settlements.push(settlement);
      }
    }
  }

  /**
   * Find suitable locations for settlements
   */
  private findSettlementSites(world: WorldData): Array<{ x: number; y: number }> {
    const sites: Array<{ x: number; y: number }> = [];
    const settlementNoise = new PerlinNoise(this.config.seed + 1000);

    for (let x = 20; x < world.width - 20; x += 10) {
      for (let y = 20; y < world.height - 20; y += 10) {
        if (this.isAreaSuitableForSettlement(world, x, y, 15)) {
          const noiseValue = settlementNoise.noise2D(x, y);
          if ((noiseValue + 1) * 0.5 > 0.3) {
            sites.push({ x, y });
          }
        }
      }
    }

    return sites;
  }

  /**
   * Check if area is suitable for settlement
   */
  private isAreaSuitableForSettlement(world: WorldData, centerX: number, centerY: number, radius: number): boolean {
    let suitableTiles = 0;
    let totalTiles = 0;

    for (let x = centerX - radius; x <= centerX + radius; x++) {
      for (let y = centerY - radius; y <= centerY + radius; y++) {
        if (x >= 0 && x < world.width && y >= 0 && y < world.height) {
          totalTiles++;
          const height = world.heightMap[x][y];
          const distanceToWater = this.calculateDistanceToWater(world, x, y);

          if (height > 0.3 && height < 0.6 && distanceToWater < 8 && !world.waterMap[x][y]) {
            suitableTiles++;
          }
        }
      }
    }

    return totalTiles > 0 && suitableTiles / totalTiles > 0.7;
  }

  /**
   * Calculate distance to nearest water
   */
  private calculateDistanceToWater(world: WorldData, x: number, y: number): number {
    let minDistance = Infinity;

    for (let dx = -10; dx <= 10; dx++) {
      for (let dy = -10; dy <= 10; dy++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height) {
          if (world.waterMap[nx][ny]) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            minDistance = Math.min(minDistance, distance);
          }
        }
      }
    }

    return minDistance === Infinity ? 100 : minDistance;
  }

  /**
   * Create a settlement
   */
  private createSettlement(world: WorldData, x: number, y: number): Settlement | null {
    const size = this.rng.choice([
      SettlementSize.HAMLET,
      SettlementSize.VILLAGE,
      SettlementSize.TOWN
    ]);
    
    const type = this.determineSettlementType(world, x, y);
    const population = this.calculatePopulation(size);
    const name = this.generateSettlementName();

    return {
      name,
      x,
      y,
      size,
      type,
      population,
      buildings: []
    };
  }

  /**
   * Determine settlement type from environment
   */
  private determineSettlementType(world: WorldData, x: number, y: number): SettlementType {
    const height = world.heightMap[x][y];
    const moisture = world.moistureMap[x][y];
    const biome = world.biomeMap[x][y];

    if (height > 0.6) return SettlementType.MINING;
    if (moisture > 0.7) return SettlementType.AGRICULTURAL;
    if (biome === 'plains' || biome === 'savanna') return SettlementType.TRADING;
    
    return this.rng.choice([
      SettlementType.AGRICULTURAL,
      SettlementType.TRADING,
      SettlementType.MILITARY
    ]);
  }

  /**
   * Calculate population based on size
   */
  private calculatePopulation(size: SettlementSize): number {
    switch (size) {
      case SettlementSize.HAMLET: return this.rng.nextInt(50, 200);
      case SettlementSize.VILLAGE: return this.rng.nextInt(200, 500);
      case SettlementSize.TOWN: return this.rng.nextInt(500, 2000);
      case SettlementSize.CITY: return this.rng.nextInt(2000, 10000);
      default: return 100;
    }
  }

  /**
   * Generate settlement name
   */
  private generateSettlementName(): string {
    const prefixes = ['New', 'Old', 'Great', 'Little', 'Upper', 'Lower', 'East', 'West'];
    const suffixes = ['ton', 'ville', 'burg', 'ford', 'bridge', 'port', 'field', 'wood'];
    const prefix = this.rng.choice(prefixes);
    const suffix = this.rng.choice(suffixes);
    return `${prefix}${suffix}`;
  }

  /**
   * Generate roads connecting settlements
   */
  private generateRoads(world: WorldData): void {
    const settlements = world.settlements;
    
    for (let i = 0; i < settlements.length; i++) {
      for (let j = i + 1; j < settlements.length; j++) {
        if (this.shouldConnectSettlements(settlements[i], settlements[j], world.width, world.height)) {
          this.generateRoad(world, settlements[i], settlements[j]);
        }
      }
    }
  }

  /**
   * Check if settlements should be connected
   */
  private shouldConnectSettlements(a: Settlement, b: Settlement, worldWidth: number, worldHeight: number): boolean {
    const distance = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    return distance < Math.min(worldWidth, worldHeight) * 0.3;
  }

  /**
   * Generate road between two settlements
   */
  private generateRoad(world: WorldData, start: Settlement, end: Settlement): void {
    // Simple straight-line pathfinding (can be improved with A*)
    const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(start.x + (end.x - start.x) * t);
      const y = Math.round(start.y + (end.y - start.y) * t);
      
      if (x >= 0 && x < world.width && y >= 0 && y < world.height) {
        world.roadMap[x][y] = true;
        
        // Add road decorations
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height) {
              // Mark nearby tiles for road visual
            }
          }
        }
      }
    }
  }

  /**
   * Helper to create 2D array
   */
  private create2DArray<T>(width: number, height: number, defaultValue: T): T[][] {
    return Array(width).fill(null).map(() => Array(height).fill(defaultValue));
  }
}

