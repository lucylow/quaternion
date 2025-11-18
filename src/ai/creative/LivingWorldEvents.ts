/**
 * Living World Events System
 * Terrain evolves based on player actions, creating dynamic environmental responses
 */

export interface WorldEvent {
  id: string;
  type: 'environmental' | 'cultural' | 'ecological' | 'catastrophic';
  name: string;
  description: string;
  trigger: EventTrigger;
  effects: EventEffect[];
  duration: number;
  active: boolean;
  triggeredAt?: number;
}

export interface EventTrigger {
  condition: string;
  threshold: number;
  checkInterval: number;
}

export interface EventEffect {
  type: 'spawn' | 'modify' | 'damage' | 'benefit' | 'transform';
  target: string;
  value: any;
  area?: { x: number; y: number; radius: number };
}

export interface FactionTrait {
  name: string;
  description: string;
  biome: string;
  effects: {
    unitBonus?: string;
    resourceBonus?: string;
    defensiveBonus?: string;
  };
}

export class LivingWorldEvents {
  private events: Map<string, WorldEvent> = new Map();
  private factionTraits: Map<string, FactionTrait[]> = new Map();
  private playerActions: Map<string, number> = new Map();

  constructor() {
    this.initializeEvents();
  }

  /**
   * Initialize world events
   */
  private initializeEvents(): void {
    // Deforestation events
    this.events.set('dust_storm', {
      id: 'dust_storm',
      type: 'environmental',
      name: 'Dust Storm',
      description: 'Massive dust storms sweep across the plains, reducing visibility and movement',
      trigger: {
        condition: 'deforested_area',
        threshold: 50,
        checkInterval: 30000
      },
      effects: [{
        type: 'modify',
        target: 'movement_speed',
        value: -0.3,
        area: { x: 0, y: 0, radius: 500 }
      }],
      duration: 120000,
      active: false
    });

    // Pollution events
    this.events.set('mutant_creatures', {
      id: 'mutant_creatures',
      type: 'ecological',
      name: 'Mutant Creatures',
      description: 'Polluted waters have spawned aggressive mutant creatures',
      trigger: {
        condition: 'polluted_rivers',
        threshold: 3,
        checkInterval: 60000
      },
      effects: [{
        type: 'spawn',
        target: 'hostile_creature',
        value: { count: 5, type: 'mutant' }
      }],
      duration: 300000,
      active: false
    });

    // Resource depletion events
    this.events.set('resource_depletion', {
      id: 'resource_depletion',
      type: 'environmental',
      name: 'Resource Depletion',
      description: 'Over-extraction has caused local resource collapse',
      trigger: {
        condition: 'resource_extraction_rate',
        threshold: 0.8,
        checkInterval: 45000
      },
      effects: [{
        type: 'modify',
        target: 'resource_generation',
        value: -0.5
      }],
      duration: 180000,
      active: false
    });
  }

  /**
   * Generate ecosystem events based on player actions
   */
  generateEcosystemEvents(gameState: any, playerActions: Record<string, number>): WorldEvent[] {
    const triggeredEvents: WorldEvent[] = [];
    
    // Update player action tracking
    Object.entries(playerActions).forEach(([action, count]) => {
      this.playerActions.set(action, (this.playerActions.get(action) || 0) + count);
    });

    // Check each event trigger
    this.events.forEach((event, id) => {
      if (!event.active && this.checkTrigger(event, gameState)) {
        event.active = true;
        event.triggeredAt = Date.now();
        triggeredEvents.push({ ...event });
      }
    });

    return triggeredEvents;
  }

  /**
   * Check if event trigger condition is met
   */
  private checkTrigger(event: WorldEvent, gameState: any): boolean {
    const { condition, threshold } = event.trigger;

    switch (condition) {
      case 'deforested_area': {
        const deforested = this.playerActions.get('deforest') || 0;
        return deforested >= threshold;
      }

      case 'polluted_rivers': {
        const polluted = this.playerActions.get('pollute') || 0;
        return polluted >= threshold;
      }

      case 'resource_extraction_rate': {
        const extractionRate = this.calculateExtractionRate(gameState);
        return extractionRate >= threshold;
      }

      case 'instability':
        return gameState.instability >= threshold;

      default:
        return false;
    }
  }

  /**
   * Create cultural events - factions develop traits based on terrain
   */
  createCulturalEvents(gameState: any, factions: any[]): FactionTrait[] {
    const newTraits: FactionTrait[] = [];

    factions.forEach(faction => {
      const dominantBiome = this.getDominantBiome(faction, gameState);
      
      if (dominantBiome) {
        const trait = this.generateBiomeTrait(dominantBiome, faction);
        if (trait) {
          newTraits.push(trait);
          
          // Add trait to faction
          if (!this.factionTraits.has(faction.id)) {
            this.factionTraits.set(faction.id, []);
          }
          this.factionTraits.get(faction.id)!.push(trait);
        }
      }
    });

    return newTraits;
  }

  /**
   * Generate biome-specific trait
   */
  private generateBiomeTrait(biome: string, faction: any): FactionTrait | null {
    const traitTemplates: Record<string, FactionTrait> = {
      'mountain': {
        name: 'Cliff Dwellers',
        description: 'Units gain defense bonus in high elevation',
        biome: 'mountain',
        effects: {
          defensiveBonus: '+25% defense in elevated terrain',
          unitBonus: 'Mountain movement penalty reduced by 50%'
        }
      },
      'volcanic': {
        name: 'Fire Walkers',
        description: 'Immune to lava damage, movement bonus in volcanic areas',
        biome: 'volcanic',
        effects: {
          unitBonus: 'Immune to fire damage, +30% movement in lava',
          resourceBonus: '+20% energy generation from volcanic tiles'
        }
      },
      'forest': {
        name: 'Forest Guardians',
        description: 'Enhanced resource generation and stealth in forest biomes',
        biome: 'forest',
        effects: {
          resourceBonus: '+30% biomass generation',
          unitBonus: 'Stealth bonus in forest tiles'
        }
      },
      'desert': {
        name: 'Sand Nomads',
        description: 'Reduced movement cost and water efficiency in desert',
        biome: 'desert',
        effects: {
          unitBonus: '50% reduced movement cost in sand',
          resourceBonus: 'Water consumption reduced by 40%'
        }
      }
    };

    return traitTemplates[biome.toLowerCase()] || null;
  }

  /**
   * Get dominant biome for faction
   */
  private getDominantBiome(faction: any, gameState: any): string | null {
    // Simplified - check controlled tiles
    const biomeCounts: Record<string, number> = {};
    
    if (faction.controlledTiles) {
      faction.controlledTiles.forEach((tileId: string) => {
        const tile = gameState.map?.tiles?.get(tileId);
        if (tile?.biome) {
          biomeCounts[tile.biome] = (biomeCounts[tile.biome] || 0) + 1;
        }
      });
    }

    // Find most common biome
    let maxCount = 0;
    let dominantBiome: string | null = null;
    
    Object.entries(biomeCounts).forEach(([biome, count]) => {
      if (count > maxCount && count >= 5) { // Need at least 5 tiles
        maxCount = count;
        dominantBiome = biome;
      }
    });

    return dominantBiome;
  }

  /**
   * Calculate resource extraction rate
   */
  private calculateExtractionRate(gameState: any): number {
    // Simplified calculation
    if (gameState.players && gameState.players.length > 0) {
      const player = gameState.players[0];
      const totalResources = player.resources.ore + player.resources.energy + 
                           player.resources.biomass + player.resources.data;
      const maxResources = 20000; // Estimated max
      return totalResources / maxResources;
    }
    return 0;
  }

  /**
   * Apply event effects to game state
   */
  applyEventEffects(event: WorldEvent, gameState: any): void {
    event.effects.forEach(effect => {
      switch (effect.type) {
        case 'modify':
          this.modifyGameProperty(gameState, effect.target, effect.value);
          break;
        case 'spawn':
          this.spawnEntities(gameState, effect);
          break;
        case 'transform':
          this.transformTerrain(gameState, effect);
          break;
      }
    });
  }

  /**
   * Modify game property
   */
  private modifyGameProperty(gameState: any, target: string, value: any): void {
    // Apply modification based on target
    if (target === 'movement_speed') {
      gameState.movementModifier = (gameState.movementModifier || 1) * (1 + value);
    } else if (target === 'resource_generation') {
      gameState.resourceGenerationModifier = (gameState.resourceGenerationModifier || 1) * (1 + value);
    }
  }

  /**
   * Spawn entities
   */
  private spawnEntities(gameState: any, effect: EventEffect): void {
    // Add entities to game state
    if (!gameState.entities) {
      gameState.entities = [];
    }
    
    for (let i = 0; i < effect.value.count; i++) {
      gameState.entities.push({
        type: effect.value.type,
        id: `entity_${Date.now()}_${i}`,
        position: this.getRandomPositionInArea(effect.area)
      });
    }
  }

  /**
   * Transform terrain
   */
  private transformTerrain(gameState: any, effect: EventEffect): void {
    // Transform tiles in area
    if (gameState.map?.tiles && effect.area) {
      gameState.map.tiles.forEach((tile: any) => {
        const distance = Math.sqrt(
          Math.pow(tile.x - effect.area!.x, 2) + 
          Math.pow(tile.y - effect.area!.y, 2)
        );
        
        if (distance < effect.area!.radius) {
          tile.biome = effect.value.newBiome || tile.biome;
        }
      });
    }
  }

  /**
   * Get random position in area
   */
  private getRandomPositionInArea(area?: { x: number; y: number; radius: number }): { x: number; y: number } {
    if (!area) {
      return { x: Math.random() * 1200, y: Math.random() * 700 };
    }
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * area.radius;
    
    return {
      x: area.x + Math.cos(angle) * distance,
      y: area.y + Math.sin(angle) * distance
    };
  }

  /**
   * Get active events
   */
  getActiveEvents(): WorldEvent[] {
    return Array.from(this.events.values()).filter(e => e.active);
  }

  /**
   * Get faction traits
   */
  getFactionTraits(factionId: string): FactionTrait[] {
    return this.factionTraits.get(factionId) || [];
  }

  /**
   * Update event status
   */
  updateEvents(): void {
    const now = Date.now();
    
    this.events.forEach((event, id) => {
      if (event.active && event.triggeredAt) {
        if (now - event.triggeredAt > event.duration) {
          event.active = false;
          event.triggeredAt = undefined;
        }
      }
    });
  }
}

