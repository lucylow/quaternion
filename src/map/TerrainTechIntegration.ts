/**
 * Terrain-Resource-Tech Integration System
 * Handles tech gating by terrain, resource adjacency bonuses, and environmental counterplay
 */

import { TerrainSystem, Tile } from './TerrainSystem';

export interface TechRequirement {
  techId: string;
  terrainType?: string;
  biomeType?: string;
  featureType?: string;
  controlDuration?: number; // seconds of control required
  resourceAdjacency?: {
    resourceType: string;
    minCount: number;
  };
}

export interface ResourceAdjacencyBonus {
  buildingType: string;
  adjacentTerrain: string[];
  bonusMultiplier: number;
}

export interface EnvironmentalCounterplay {
  techId: string;
  terrainManipulation: {
    type: 'freeze' | 'bridge' | 'clear' | 'fortify';
    targetBiome?: string;
    targetFeature?: string;
    duration?: number;
  };
}

export class TerrainTechIntegration {
  private terrainSystem: TerrainSystem;
  private controlledTiles: Map<string, { playerId: number; startTime: number }>; // tile key -> control info
  private techRequirements: Map<string, TechRequirement>;
  private adjacencyBonuses: ResourceAdjacencyBonus[];
  private environmentalCounterplay: Map<string, EnvironmentalCounterplay>;

  constructor(terrainSystem: TerrainSystem) {
    this.terrainSystem = terrainSystem;
    this.controlledTiles = new Map();
    this.techRequirements = new Map();
    this.adjacencyBonuses = [];
    this.environmentalCounterplay = new Map();
    
    this.initializeDefaultTechs();
  }

  /**
   * Initialize default tech requirements and bonuses
   */
  private initializeDefaultTechs(): void {
    // Thermal Shield - requires controlling lava vent
    this.techRequirements.set('thermal_shield', {
      techId: 'thermal_shield',
      featureType: 'lava_vent',
      controlDuration: 30
    });
    
    // Swamp Adaptation - requires controlling swamp tiles
    this.techRequirements.set('swamp_adaptation', {
      techId: 'swamp_adaptation',
      biomeType: 'swamp',
      controlDuration: 60
    });
    
    // Bridge Engineering - requires controlling bridge
    this.techRequirements.set('bridge_engineering', {
      techId: 'bridge_engineering',
      featureType: 'bridge',
      controlDuration: 45
    });
    
    // Resource adjacency bonuses
    this.adjacencyBonuses.push({
      buildingType: 'refinery',
      adjacentTerrain: ['high_ground'],
      bonusMultiplier: 1.5
    });
    
    this.adjacencyBonuses.push({
      buildingType: 'research_lab',
      adjacentTerrain: ['crystal'],
      bonusMultiplier: 2.0
    });
    
    // Environmental counterplay
    this.environmentalCounterplay.set('lava_freeze', {
      techId: 'lava_freeze',
      terrainManipulation: {
        type: 'freeze',
        targetBiome: 'lava',
        duration: 300 // 5 minutes
      }
    });
    
    this.environmentalCounterplay.set('bridge_builder', {
      techId: 'bridge_builder',
      terrainManipulation: {
        type: 'bridge',
        targetFeature: 'chokepoint',
        duration: Infinity
      }
    });
  }

  /**
   * Check if tech is available based on terrain control
   */
  public isTechAvailable(techId: string, playerId: number, gameTime: number): {
    available: boolean;
    reason?: string;
    progress?: number;
  } {
    const requirement = this.techRequirements.get(techId);
    if (!requirement) {
      return { available: true }; // No terrain requirement
    }
    
    // Check terrain control
    const controlledTiles = this.getControlledTilesForRequirement(requirement, playerId);
    
    if (controlledTiles.length === 0) {
      return {
        available: false,
        reason: `Requires controlling ${requirement.featureType || requirement.biomeType} terrain`
      };
    }
    
    // Check control duration
    if (requirement.controlDuration) {
      const controlStartTime = Math.min(
        ...controlledTiles.map(t => this.controlledTiles.get(`${t.x},${t.y}`)?.startTime || gameTime)
      );
      const controlDuration = gameTime - controlStartTime;
      const progress = Math.min(1, controlDuration / requirement.controlDuration);
      
      if (controlDuration < requirement.controlDuration) {
        return {
          available: false,
          reason: `Requires ${requirement.controlDuration}s of control (${Math.floor(controlDuration)}s / ${requirement.controlDuration}s)`,
          progress
        };
      }
    }
    
    // Check resource adjacency
    if (requirement.resourceAdjacency) {
      const adjacentCount = this.getAdjacentResourceCount(
        controlledTiles[0],
        requirement.resourceAdjacency.resourceType
      );
      
      if (adjacentCount < requirement.resourceAdjacency.minCount) {
        return {
          available: false,
          reason: `Requires ${requirement.resourceAdjacency.minCount} adjacent ${requirement.resourceAdjacency.resourceType} resources`
        };
      }
    }
    
    return { available: true };
  }

  /**
   * Get tiles controlled by player that match requirement
   */
  private getControlledTilesForRequirement(
    requirement: TechRequirement,
    playerId: number
  ): Tile[] {
    const allTiles = this.terrainSystem.getAllTiles();
    return allTiles.filter(tile => {
      const control = this.controlledTiles.get(`${tile.x},${tile.y}`);
      if (!control || control.playerId !== playerId) {
        return false;
      }
      
      if (requirement.featureType && tile.feature !== requirement.featureType) {
        return false;
      }
      
      if (requirement.biomeType && tile.biome !== requirement.biomeType) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get count of adjacent resources
   */
  private getAdjacentResourceCount(tile: Tile, resourceType: string): number {
    const adjacentTiles = this.terrainSystem.getTilesInRadius(tile.x, tile.y, 1);
    return adjacentTiles.filter(t => t.resourceType === resourceType).length;
  }

  /**
   * Register tile control
   */
  public registerTileControl(x: number, y: number, playerId: number, gameTime: number): void {
    const key = `${x},${y}`;
    if (!this.controlledTiles.has(key)) {
      this.controlledTiles.set(key, { playerId, startTime: gameTime });
    }
  }

  /**
   * Remove tile control
   */
  public removeTileControl(x: number, y: number): void {
    const key = `${x},${y}`;
    this.controlledTiles.delete(key);
  }

  /**
   * Get resource yield bonus from adjacency
   */
  public getResourceYieldBonus(
    buildingType: string,
    x: number,
    y: number
  ): number {
    const tile = this.terrainSystem.getTile(x, y);
    if (!tile) return 1.0;
    
    for (const bonus of this.adjacencyBonuses) {
      if (bonus.buildingType === buildingType) {
        for (const terrainType of bonus.adjacentTerrain) {
          if (tile.feature === terrainType || tile.biome === terrainType) {
            return bonus.bonusMultiplier;
          }
        }
      }
    }
    
    return 1.0;
  }

  /**
   * Apply environmental counterplay tech
   */
  public applyTerrainManipulation(
    techId: string,
    x: number,
    y: number
  ): boolean {
    const counterplay = this.environmentalCounterplay.get(techId);
    if (!counterplay) return false;
    
    const tile = this.terrainSystem.getTile(x, y);
    if (!tile) return false;
    
    const manipulation = counterplay.terrainManipulation;
    
    switch (manipulation.type) {
      case 'freeze':
        if (tile.biome === manipulation.targetBiome) {
          // Convert lava to frozen (temporary)
          tile.biome = 'neon_plains';
          tile.movementModifier = 1.0;
          tile.metadata = {
            ...tile.metadata,
            frozen: true,
            freezeEndTime: Date.now() + (manipulation.duration || 0) * 1000
          };
          return true;
        }
        break;
        
      case 'bridge':
        if (tile.feature === manipulation.targetFeature) {
          // Create bridge over chokepoint
          tile.feature = 'bridge';
          tile.movementModifier = 1.5;
          tile.metadata = {
            ...tile.metadata,
            constructed: true
          };
          return true;
        }
        break;
        
      case 'clear':
        // Clear obstacles
        tile.passable = true;
        tile.buildable = true;
        return true;
        
      case 'fortify':
        // Increase defense
        tile.defenseBonus = Math.min(1.0, tile.defenseBonus + 0.3);
        return true;
    }
    
    return false;
  }

  /**
   * Get tech requirements for a tech
   */
  public getTechRequirements(techId: string): TechRequirement | null {
    return this.techRequirements.get(techId) || null;
  }

  /**
   * Get all controlled tiles for player
   */
  public getControlledTiles(playerId: number): Tile[] {
    const allTiles = this.terrainSystem.getAllTiles();
    return allTiles.filter(tile => {
      const control = this.controlledTiles.get(`${tile.x},${tile.y}`);
      return control && control.playerId === playerId;
    });
  }
}

