/**
 * Terrain-based Strategy System
 * Implements terrain primitives, chokepoints, high ground, cover, dynamic tiles, and movement modifiers
 */

import { SeededRandom } from '../lib/SeededRandom';

export type BiomeType = 
  | 'neon_plains' 
  | 'crater' 
  | 'lava' 
  | 'swamp' 
  | 'forest' 
  | 'crystal' 
  | 'void';

export type TerrainFeatureType = 
  | 'chokepoint' 
  | 'high_ground' 
  | 'cover' 
  | 'ruins' 
  | 'bridge' 
  | 'tunnel' 
  | 'road' 
  | 'objective'
  | 'crashed_ship'
  | 'memorial'
  | 'artifact'
  | 'ancient_ruins'
  | 'broadcast_tower'
  | 'research_station'
  | 'cataclysm_scar';

export type DynamicAnomalyType = 
  | 'lava_vent' 
  | 'storm' 
  | 'sensor_jamming' 
  | 'quantum_fracture' 
  | 'resource_flux';

export interface Tile {
  x: number;
  y: number;
  elevation: number; // -100 to 100
  biome: BiomeType;
  resourceType: 'ore' | 'crystals' | 'biomass' | 'data_nodes' | null;
  defenseBonus: number; // 0-1, reduces incoming damage multiplier
  visibilityModifier: number; // -1 to 1, affects LOS
  movementModifier: number; // 0-2, affects unit speed (1.0 = normal)
  passable: boolean;
  buildable: boolean;
  strategicValue: number; // 0-100, for AI evaluation
  feature?: TerrainFeatureType;
  metadata?: Record<string, any>;
  lore?: {
    name?: string;
    description?: string;
    backstory?: string;
    factionContext?: string;
    eventText?: string;
  };
}

export interface Chokepoint {
  x: number;
  y: number;
  width: number; // 1-5 tiles
  defenseBonus: number;
  strategicValue: number;
}

export interface HighGround {
  x: number;
  y: number;
  radius: number;
  elevation: number;
  visionBonus: number; // multiplier for LOS
  attackBonus: number; // multiplier for damage
}

export interface DynamicAnomaly {
  id: string;
  type: DynamicAnomalyType;
  x: number;
  y: number;
  radius: number;
  frequency: 'short' | 'medium' | 'long' | 'continuous';
  duration: number; // seconds (0 = continuous)
  startTime?: number; // game time when it activates
  endTime?: number; // game time when it deactivates
  effect: {
    damage_per_second?: number;
    resource_multiplier?: number;
    visibility_modifier?: number;
    detection_range?: number;
    movement_penalty?: number;
  };
  active: boolean;
}

export interface SpecialFeature {
  type: string;
  coordinates: number[] | number[][];
  properties: Record<string, any>;
}

export interface MapSpec {
  seed: number;
  size: number;
  biomes: Record<BiomeType, number>; // weights
  resourceClusters: number;
  chokepoints: number;
  objectives: number;
  dynamicAnomalies: Array<{
    type: DynamicAnomalyType;
    frequency: 'short' | 'medium' | 'long' | 'continuous';
    duration: number;
    coordinates?: number[];
    radius?: number;
    effect?: Record<string, any>;
  }>;
  specialFeatures: SpecialFeature[];
  resourcePlacement?: Record<string, number[][]>;
  startingPositions: number[][];
}

export class TerrainSystem {
  private tiles: Map<string, Tile>; // key: "x,y"
  private chokepoints: Chokepoint[];
  private highGrounds: HighGround[];
  private dynamicAnomalies: Map<string, DynamicAnomaly>;
  private rng: SeededRandom;
  private width: number;
  private height: number;
  private gameTime: number = 0;

  constructor(width: number, height: number, seed: number) {
    this.width = width;
    this.height = height;
    this.tiles = new Map();
    this.chokepoints = [];
    this.highGrounds = [];
    this.dynamicAnomalies = new Map();
    this.rng = new SeededRandom(seed);
  }

  /**
   * Generate terrain from map spec
   */
  public generateFromSpec(spec: MapSpec): void {
    this.width = spec.size;
    this.height = spec.size;
    
    // Generate base terrain tiles
    this.generateBaseTerrain(spec);
    
    // Place resources
    this.placeResources(spec);
    
    // Create chokepoints
    this.createChokepoints(spec);
    
    // Create high ground
    this.createHighGround(spec);
    
    // Place objectives
    this.placeObjectives(spec);
    
    // Apply special features
    this.applySpecialFeatures(spec);
    
    // Initialize dynamic anomalies
    this.initializeDynamicAnomalies(spec);
  }

  /**
   * Generate base terrain using noise and biome weights
   */
  private generateBaseTerrain(spec: MapSpec): void {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const biome = this.selectBiome(x, y, spec.biomes);
        const elevation = this.generateElevation(x, y);
        
        const tile: Tile = {
          x,
          y,
          elevation,
          biome,
          resourceType: null,
          defenseBonus: this.getDefenseBonusForBiome(biome),
          visibilityModifier: this.getVisibilityModifierForBiome(biome),
          movementModifier: this.getMovementModifierForBiome(biome),
          passable: true,
          buildable: this.isBuildable(biome),
          strategicValue: 0,
        };
        
        this.tiles.set(`${x},${y}`, tile);
      }
    }
  }

  /**
   * Select biome based on weights and position
   */
  private selectBiome(x: number, y: number, biomeWeights: Record<BiomeType, number>): BiomeType {
    const noise = this.rng.nextFloat(0, 1);
    const distanceFromCenter = Math.sqrt(
      Math.pow(x - this.width / 2, 2) + Math.pow(y - this.height / 2, 2)
    ) / (this.width / 2);
    
    // Use noise and distance to select biome
    let cumulative = 0;
    const totalWeight = Object.values(biomeWeights).reduce((a, b) => a + b, 0);
    
    for (const [biome, weight] of Object.entries(biomeWeights)) {
      cumulative += weight / totalWeight;
      if (noise <= cumulative) {
        return biome as BiomeType;
      }
    }
    
    return 'neon_plains'; // fallback
  }

  /**
   * Generate elevation using noise
   */
  private generateElevation(x: number, y: number): number {
    const noise1 = this.rng.nextFloat(0, 1);
    const noise2 = this.rng.nextFloat(0, 1);
    return (noise1 - 0.5) * 100 + (noise2 - 0.5) * 50;
  }

  /**
   * Get defense bonus for biome
   */
  private getDefenseBonusForBiome(biome: BiomeType): number {
    switch (biome) {
      case 'crater': return 0.7;
      case 'forest': return 0.5;
      case 'swamp': return 0.3;
      case 'lava': return 0.2;
      default: return 0.0;
    }
  }

  /**
   * Get visibility modifier for biome
   */
  private getVisibilityModifierForBiome(biome: BiomeType): number {
    switch (biome) {
      case 'swamp': return -0.8;
      case 'forest': return -0.5;
      case 'crystal': return 0.3;
      case 'neon_plains': return 0.1;
      default: return 0.0;
    }
  }

  /**
   * Get movement modifier for biome
   */
  private getMovementModifierForBiome(biome: BiomeType): number {
    switch (biome) {
      case 'swamp': return 0.5; // slow
      case 'lava': return 0.3; // very slow
      case 'road': return 1.5; // fast (if road feature)
      case 'neon_plains': return 1.0;
      default: return 1.0;
    }
  }

  /**
   * Check if biome is buildable
   */
  private isBuildable(biome: BiomeType): boolean {
    return biome !== 'lava' && biome !== 'void';
  }

  /**
   * Place resources based on spec
   */
  private placeResources(spec: MapSpec): void {
    if (spec.resourcePlacement) {
      // Use explicit placement from spec
      for (const [resourceType, positions] of Object.entries(spec.resourcePlacement)) {
        for (const [x, y] of positions) {
          const tile = this.getTile(x, y);
          if (tile) {
            tile.resourceType = resourceType as any;
            tile.strategicValue += 50;
          }
        }
      }
    } else {
      // Procedural placement
      const resourceTypes: Array<'ore' | 'crystals' | 'biomass' | 'data_nodes'> = 
        ['ore', 'crystals', 'biomass', 'data_nodes'];
      
      for (let i = 0; i < spec.resourceClusters; i++) {
        const x = this.rng.nextInt(0, this.width);
        const y = this.rng.nextInt(0, this.height);
        const resourceType = this.rng.choice(resourceTypes);
        
        const tile = this.getTile(x, y);
        if (tile) {
          tile.resourceType = resourceType;
          tile.strategicValue += 50;
        }
      }
    }
  }

  /**
   * Create chokepoints
   */
  private createChokepoints(spec: MapSpec): void {
    for (let i = 0; i < spec.chokepoints; i++) {
      const x = this.rng.nextInt(0, this.width);
      const y = this.rng.nextInt(0, this.height);
      const width = this.rng.nextInt(1, 3);
      const defenseBonus = 0.7;
      
      this.chokepoints.push({
        x,
        y,
        width,
        defenseBonus,
        strategicValue: 80
      });
      
      // Apply chokepoint to tiles
      for (let dx = -width; dx <= width; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const tile = this.getTile(x + dx, y + dy);
          if (tile) {
            tile.defenseBonus = Math.max(tile.defenseBonus, defenseBonus);
            tile.feature = 'chokepoint';
            tile.strategicValue += 30;
          }
        }
      }
    }
  }

  /**
   * Create high ground
   */
  private createHighGround(spec: MapSpec): void {
    const highGroundCount = Math.floor(spec.chokepoints * 0.5);
    
    for (let i = 0; i < highGroundCount; i++) {
      const x = this.rng.nextInt(0, this.width);
      const y = this.rng.nextInt(0, this.height);
      const radius = this.rng.nextInt(2, 5);
      const elevation = this.rng.nextFloat(30, 80);
      
      this.highGrounds.push({
        x,
        y,
        radius,
        elevation,
        visionBonus: 1.5,
        attackBonus: 1.2
      });
      
      // Apply high ground to tiles
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            const tile = this.getTile(x + dx, y + dy);
            if (tile) {
              tile.elevation = Math.max(tile.elevation, elevation);
              tile.feature = 'high_ground';
              tile.strategicValue += 40;
            }
          }
        }
      }
    }
  }

  /**
   * Place control objectives
   */
  private placeObjectives(spec: MapSpec): void {
    for (let i = 0; i < spec.objectives; i++) {
      const x = this.rng.nextInt(0, this.width);
      const y = this.rng.nextInt(0, this.height);
      
      const tile = this.getTile(x, y);
      if (tile) {
        tile.feature = 'objective';
        tile.strategicValue = 100;
        tile.metadata = {
          resourceBonus: 2.0,
          techUnlock: null
        };
      }
    }
  }

  /**
   * Apply special features from spec
   */
  private applySpecialFeatures(spec: MapSpec): void {
    for (const feature of spec.specialFeatures) {
      switch (feature.type) {
        case 'parallel_bridges':
          this.createBridges(feature);
          break;
        case 'central_caldera':
          this.createCaldera(feature);
          break;
        case 'hidden_vault':
          this.createHiddenVault(feature);
          break;
        case 'scout_towers':
          this.createScoutTowers(feature);
          break;
      }
    }
  }

  /**
   * Create parallel bridges
   */
  private createBridges(feature: SpecialFeature): void {
    const coords = feature.coordinates as Record<string, number[]>;
    const props = feature.properties;
    
    if (coords.bridge_wide) {
      const [x, y] = coords.bridge_wide;
      const width = props.width_wide || 3;
      this.createBridge(x, y, width, props.defense_bonus || 0.7);
    }
    
    if (coords.bridge_narrow) {
      const [x, y] = coords.bridge_narrow;
      const width = props.width_narrow || 1;
      this.createBridge(x, y, width, props.defense_bonus || 0.7);
    }
  }

  /**
   * Create a bridge
   */
  private createBridge(x: number, y: number, width: number, defenseBonus: number): void {
    for (let dx = -width; dx <= width; dx++) {
      const tile = this.getTile(x + dx, y);
      if (tile) {
        tile.feature = 'bridge';
        tile.defenseBonus = defenseBonus;
        tile.movementModifier = 1.2; // faster on bridge
        tile.strategicValue += 60;
      }
    }
  }

  /**
   * Create central caldera
   */
  private createCaldera(feature: SpecialFeature): void {
    const coords = feature.coordinates as number[];
    const props = feature.properties;
    const [x, y] = coords;
    const radius = props.radius || 128;
    const elevation = props.elevation || 0.8;
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const tile = this.getTile(x + dx, y + dy);
          if (tile) {
            tile.elevation = elevation * 100;
            tile.defenseBonus = Math.max(tile.defenseBonus, props.defense_bonus || 0.3);
            tile.strategicValue += 50;
          }
        }
      }
    }
  }

  /**
   * Create hidden vault
   */
  private createHiddenVault(feature: SpecialFeature): void {
    const coords = feature.coordinates as number[];
    const props = feature.properties;
    const [x, y] = coords;
    
    const tile = this.getTile(x, y);
    if (tile) {
      tile.feature = 'objective';
      tile.resourceType = 'data_nodes';
      tile.strategicValue = 100;
      tile.metadata = {
        hidden: true,
        requiresVision: props.requires_vision || true,
        resourceBonus: props.resource_bonus || 3.0
      };
    }
  }

  /**
   * Create scout towers
   */
  private createScoutTowers(feature: SpecialFeature): void {
    const coords = feature.coordinates as number[][];
    const props = feature.properties;
    
    for (const [x, y] of coords) {
      const tile = this.getTile(x, y);
      if (tile) {
        tile.feature = 'objective';
        tile.strategicValue = 70;
        tile.metadata = {
          visionRange: props.vision_range || 2.0,
          stealthDetection: props.stealth_detection || true
        };
      }
    }
  }

  /**
   * Initialize dynamic anomalies
   */
  private initializeDynamicAnomalies(spec: MapSpec): void {
    for (const anomaly of spec.dynamicAnomalies) {
      const id = `anomaly_${this.dynamicAnomalies.size}`;
      const [x, y] = anomaly.coordinates || [
        this.rng.nextInt(0, this.width),
        this.rng.nextInt(0, this.height)
      ];
      
      const dynamicAnomaly: DynamicAnomaly = {
        id,
        type: anomaly.type,
        x,
        y,
        radius: anomaly.radius || 50,
        frequency: anomaly.frequency,
        duration: anomaly.duration,
        effect: anomaly.effect || {},
        active: false
      };
      
      this.dynamicAnomalies.set(id, dynamicAnomaly);
    }
  }

  /**
   * Update dynamic anomalies based on game time
   */
  public updateDynamicAnomalies(gameTime: number): void {
    this.gameTime = gameTime;
    
    for (const anomaly of this.dynamicAnomalies.values()) {
      if (anomaly.frequency === 'continuous') {
        anomaly.active = true;
        continue;
      }
      
      if (!anomaly.startTime) {
        // Schedule first activation
        anomaly.startTime = gameTime;
        anomaly.endTime = gameTime + anomaly.duration;
        anomaly.active = true;
      } else if (anomaly.endTime && gameTime >= anomaly.endTime) {
        // Deactivate
        anomaly.active = false;
        
        // Schedule next activation based on frequency
        const frequencyDelay = 
          anomaly.frequency === 'short' ? 30 :
          anomaly.frequency === 'medium' ? 90 :
          180; // long
        
        anomaly.startTime = gameTime + frequencyDelay;
        anomaly.endTime = anomaly.startTime + anomaly.duration;
      } else if (anomaly.startTime && gameTime >= anomaly.startTime && !anomaly.active) {
        // Activate
        anomaly.active = true;
        if (anomaly.endTime === undefined) {
          anomaly.endTime = gameTime + anomaly.duration;
        }
      }
    }
  }

  /**
   * Get tile at position
   */
  public getTile(x: number, y: number): Tile | undefined {
    return this.tiles.get(`${x},${y}`);
  }

  /**
   * Get all tiles
   */
  public getAllTiles(): Tile[] {
    return Array.from(this.tiles.values());
  }

  /**
   * Get tiles in radius
   */
  public getTilesInRadius(x: number, y: number, radius: number): Tile[] {
    const tiles: Tile[] = [];
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const tile = this.getTile(x + dx, y + dy);
          if (tile) tiles.push(tile);
        }
      }
    }
    return tiles;
  }

  /**
   * Evaluate tile for AI (returns strategic value)
   */
  public evaluateTileForAI(tile: Tile, gameState: any): number {
    let score = 0;
    
    // Resource value
    if (tile.resourceType) {
      score += 50;
    }
    
    // Elevation bonus
    score += tile.elevation * 0.3;
    
    // Defense bonus
    score += tile.defenseBonus * 30;
    
    // Vision bonus
    score += tile.visibilityModifier * 20;
    
    // Strategic feature
    if (tile.feature === 'objective') {
      score += 100;
    } else if (tile.feature === 'chokepoint') {
      score += 60;
    } else if (tile.feature === 'high_ground') {
      score += 40;
    }
    
    // Dynamic anomaly bonus (if active)
    for (const anomaly of this.dynamicAnomalies.values()) {
      if (anomaly.active) {
        const dist = Math.sqrt(
          Math.pow(tile.x - anomaly.x, 2) + Math.pow(tile.y - anomaly.y, 2)
        );
        if (dist <= anomaly.radius) {
          if (anomaly.effect.resource_multiplier) {
            score += 30 * anomaly.effect.resource_multiplier;
          }
        }
      }
    }
    
    return score;
  }

  /**
   * Get active dynamic anomalies
   */
  public getActiveAnomalies(): DynamicAnomaly[] {
    return Array.from(this.dynamicAnomalies.values()).filter(a => a.active);
  }

  /**
   * Get chokepoints
   */
  public getChokepoints(): Chokepoint[] {
    return [...this.chokepoints];
  }

  /**
   * Get high grounds
   */
  public getHighGrounds(): HighGround[] {
    return [...this.highGrounds];
  }

  /**
   * Check if position is passable
   */
  public isPassable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile ? tile.passable : false;
  }

  /**
   * Get movement cost for path
   */
  public getMovementCost(fromX: number, fromY: number, toX: number, toY: number): number {
    const tile = this.getTile(toX, toY);
    if (!tile) return Infinity;
    
    const baseCost = 1.0;
    const movementModifier = tile.movementModifier;
    
    // Check for active anomalies affecting movement
    for (const anomaly of this.dynamicAnomalies.values()) {
      if (anomaly.active && anomaly.effect.movement_penalty) {
        const dist = Math.sqrt(
          Math.pow(toX - anomaly.x, 2) + Math.pow(toY - anomaly.y, 2)
        );
        if (dist <= anomaly.radius) {
          return baseCost / (movementModifier * (1 - anomaly.effect.movement_penalty));
        }
      }
    }
    
    return baseCost / movementModifier;
  }
}

