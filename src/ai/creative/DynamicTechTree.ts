/**
 * Dynamic Tech Tree System
 * Available tech depends on controlled terrain and player actions
 */

export interface TerrainInfluencedTech {
  id: string;
  name: string;
  description: string;
  biome: string;
  requirements: TechRequirement[];
  effects: string;
  unlocked: boolean;
}

export interface TechRequirement {
  type: 'biome_control' | 'tile_count' | 'time_control' | 'resource';
  value: any;
  description: string;
}

export class DynamicTechTree {
  private terrainTechs: Map<string, TerrainInfluencedTech> = new Map();
  private playerTechs: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeTerrainTechs();
  }

  /**
   * Initialize terrain-influenced technologies
   */
  private initializeTerrainTechs(): void {
    // Volcanic techs
    this.terrainTechs.set('magma_forging', {
      id: 'magma_forging',
      name: 'Magma Forging',
      description: 'Weapons gain bonus damage in hot environments',
      biome: 'volcanic',
      requirements: [
        {
          type: 'biome_control',
          value: 'volcanic',
          description: 'Control 3 lava tiles'
        }
      ],
      effects: '+30% damage in volcanic terrain, fire immunity',
      unlocked: false
    });

    // Alpine techs
    this.terrainTechs.set('high_altitude_adaptation', {
      id: 'high_altitude_adaptation',
      name: 'High-Altitude Adaptation',
      description: 'Units move freely in mountains, gain vision range',
      biome: 'mountain',
      requirements: [
        {
          type: 'tile_count',
          value: { biome: 'mountain', count: 5 },
          description: 'Control 5 mountain tiles'
        },
        {
          type: 'time_control',
          value: 300000, // 5 minutes
          description: 'Control summit tile for 5 minutes'
        }
      ],
      effects: 'No movement penalty in mountains, +50% vision range',
      unlocked: false
    });

    // Forest techs
    this.terrainTechs.set('forest_synergy', {
      id: 'forest_synergy',
      name: 'Forest Synergy',
      description: 'Enhanced resource generation and stealth in forest biomes',
      biome: 'forest',
      requirements: [
        {
          type: 'tile_count',
          value: { biome: 'forest', count: 8 },
          description: 'Control 8 forest tiles'
        }
      ],
      effects: '+40% biomass generation, stealth bonus in forests',
      unlocked: false
    });

    // Desert techs
    this.terrainTechs.set('desert_nomad', {
      id: 'desert_nomad',
      name: 'Desert Nomad Techniques',
      description: 'Reduced movement cost and water efficiency in desert',
      biome: 'desert',
      requirements: [
        {
          type: 'tile_count',
          value: { biome: 'desert', count: 6 },
          description: 'Control 6 desert tiles'
        }
      ],
      effects: '50% reduced movement cost in sand, water consumption -40%',
      unlocked: false
    });

    // Water techs
    this.terrainTechs.set('aquatic_mastery', {
      id: 'aquatic_mastery',
      name: 'Aquatic Mastery',
      description: 'Units can traverse water, gain bonuses near water',
      biome: 'water',
      requirements: [
        {
          type: 'tile_count',
          value: { biome: 'water', count: 4 },
          description: 'Control 4 water tiles'
        }
      ],
      effects: 'Water traversal, +25% defense near water',
      unlocked: false
    });
  }

  /**
   * Generate terrain-influenced tech for player
   */
  generateTerrainInfluencedTech(gameState: any, playerId: string): TerrainInfluencedTech[] {
    const availableTechs: TerrainInfluencedTech[] = [];
    
    if (!gameState.players || gameState.players.length === 0) return availableTechs;
    
    const player = gameState.players[0];
    const controlledBiomes = this.getControlledBiomes(player, gameState);

    this.terrainTechs.forEach((tech, id) => {
      if (!tech.unlocked && this.checkTechRequirements(tech, controlledBiomes, gameState)) {
        tech.unlocked = true;
        availableTechs.push({ ...tech });
        
        // Track player techs
        if (!this.playerTechs.has(playerId)) {
          this.playerTechs.set(playerId, new Set());
        }
        this.playerTechs.get(playerId)!.add(id);
      }
    });

    return availableTechs;
  }

  /**
   * Get controlled biomes
   */
  private getControlledBiomes(player: any, gameState: any): Map<string, number> {
    const biomeCounts = new Map<string, number>();
    
    // Simplified - would check actual controlled tiles
    // For now, estimate based on player resources and game state
    if (player.resources.ore > 1000) biomeCounts.set('mountain', 5);
    if (player.resources.energy > 1000) biomeCounts.set('volcanic', 3);
    if (player.resources.biomass > 1000) biomeCounts.set('forest', 8);
    if (player.resources.data > 1000) biomeCounts.set('desert', 6);

    return biomeCounts;
  }

  /**
   * Check tech requirements
   */
  private checkTechRequirements(
    tech: TerrainInfluencedTech,
    controlledBiomes: Map<string, number>,
    gameState: any
  ): boolean {
    return tech.requirements.every(req => {
      switch (req.type) {
        case 'biome_control': {
          const biomeCount = controlledBiomes.get(req.value) || 0;
          return biomeCount >= 3;
        }
        
        case 'tile_count': {
          const requiredCount = req.value.count;
          const actualCount = controlledBiomes.get(req.value.biome) || 0;
          return actualCount >= requiredCount;
        }
        
        case 'time_control':
          // Would check if player controlled required tile for required time
          return gameState.gameTime >= req.value;
        
        case 'resource': {
          if (gameState.players && gameState.players.length > 0) {
            const player = gameState.players[0];
            return (player.resources[req.value.type] || 0) >= req.value.amount;
          }
          return false;
        }
        
        default:
          return false;
      }
    });
  }

  /**
   * Get available techs for player
   */
  getAvailableTechs(playerId: string): TerrainInfluencedTech[] {
    const playerTechSet = this.playerTechs.get(playerId);
    if (!playerTechSet) return [];

    return Array.from(this.terrainTechs.values())
      .filter(tech => playerTechSet.has(tech.id));
  }

  /**
   * Get all terrain techs
   */
  getAllTerrainTechs(): TerrainInfluencedTech[] {
    return Array.from(this.terrainTechs.values());
  }
}

