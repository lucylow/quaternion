/**
 * Advanced Tile Evaluation System
 * Evaluates strategic value of tiles based on terrain, resources, and tactical position
 */

import { AIPersonality, TerrainAIAgent } from './TerrainAIPersonality';

export interface Tile {
  x: number;
  y: number;
  biome?: string;
  elevation?: number;
  defenseBonus?: number;
  visibilityModifier?: number;
  passability?: number;
  resource?: {
    type: string;
    amount: number;
  };
  isDynamic?: boolean;
  dynamicComponent?: {
    timeUntilActivation?: number;
    duration?: number;
    effect?: string;
  };
  isChokepoint?: boolean;
  controlledBy?: string;
}

export interface GameState {
  map: {
    getTile(x: number, y: number): Tile | null;
    getAdjacentTiles(x: number, y: number): Tile[];
    getTilesInRange(x: number, y: number, range: number): Tile[];
  };
  players: Map<string, any>;
  units: Array<{
    id: string;
    playerId: string;
    position: { x: number; y: number };
    type: string;
    health: number;
    maxHealth: number;
  }>;
  tick: number;
}

export interface TileEvaluation {
  tile: Tile;
  score: number;
  breakdown: {
    defensive: number;
    resource: number;
    vision: number;
    mobility: number;
    dynamic: number;
    counterplay: number;
    threat: number;
  };
  reasoning: string;
}

export class AITileEvaluator {
  /**
   * Evaluate strategic value of a tile
   */
  evaluateTileStrategicValue(
    tile: Tile,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): TileEvaluation {
    const breakdown = {
      defensive: this.evaluateDefensiveValue(tile, state, agent, playerId),
      resource: this.evaluateResourceValue(tile, state, agent, playerId),
      vision: this.evaluateVisionValue(tile, state, agent, playerId),
      mobility: this.evaluateMobilityValue(tile, state, agent, playerId),
      dynamic: this.evaluateDynamicTileTiming(tile, state, agent, playerId),
      counterplay: this.evaluateCounterplayOpportunity(tile, state, agent, playerId),
      threat: -this.calculateThreatAssessment(tile, state, playerId)
    };

    // Apply personality weights
    const score = 
      breakdown.defensive * agent.config.defenseWeight +
      breakdown.resource * agent.config.resourceWeight +
      breakdown.vision * agent.config.expansionWeight +
      breakdown.mobility * 0.1 +
      breakdown.dynamic * (agent.config.riskTolerance > 0.3 ? 0.2 : -0.1) +
      breakdown.counterplay * 0.15 +
      breakdown.threat;

    const reasoning = this.generateReasoning(breakdown, agent);

    return {
      tile,
      score: Math.max(0, score),
      breakdown,
      reasoning
    };
  }

  /**
   * Evaluate defensive value of a tile
   */
  private evaluateDefensiveValue(
    tile: Tile,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): number {
    let defenseScore = tile.defenseBonus || 0;

    // Chokepoints are highly valuable for defensive personalities
    if (tile.isChokepoint) {
      defenseScore *= 2.5;
    }

    // Consider adjacent tiles for flanking protection
    const adjacentTiles = state.map.getAdjacentTiles(tile.x, tile.y);
    const secureFlanks = adjacentTiles.filter(adj => {
      const adjDefense = adj.defenseBonus || 0;
      const adjControlled = adj.controlledBy === playerId;
      return adjDefense > 0.3 || adjControlled;
    }).length;

    defenseScore += secureFlanks * 0.1;

    // Elevation bonus
    if (tile.elevation && tile.elevation > 0.5) {
      defenseScore += 0.2;
    }

    return Math.max(0, defenseScore);
  }

  /**
   * Evaluate resource value of a tile
   */
  private evaluateResourceValue(
    tile: Tile,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): number {
    if (!tile.resource || tile.resource.amount === 0) {
      return 0;
    }

    let resourceScore = this.getResourceValue(tile.resource.type, tile.resource.amount);

    // Resource clustering bonus
    const adjacentTiles = state.map.getAdjacentTiles(tile.x, tile.y);
    const adjacentResources = adjacentTiles.filter(t => t.resource && t.resource.amount > 0).length;
    resourceScore += adjacentResources * 0.3;

    // Biome affinity based on faction (if applicable)
    if (agent.faction && tile.biome) {
      const biomeAffinity = this.getFactionBiomeAffinity(agent.faction, tile.biome);
      resourceScore *= (1 + biomeAffinity);
    }

    return Math.max(0, resourceScore);
  }

  /**
   * Evaluate vision/expansion value
   */
  private evaluateVisionValue(
    tile: Tile,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): number {
    let visionScore = 0;

    // High elevation provides better vision
    if (tile.elevation && tile.elevation > 0.6) {
      visionScore += 0.3;
    }

    // Count visible tiles from this position
    const visibleTiles = state.map.getTilesInRange(tile.x, tile.y, 5);
    const unexploredTiles = visibleTiles.filter(t => 
      !t.controlledBy || t.controlledBy !== playerId
    ).length;

    visionScore += (unexploredTiles / visibleTiles.length) * 0.4;

    return Math.max(0, Math.min(1, visionScore));
  }

  /**
   * Evaluate mobility value
   */
  private evaluateMobilityValue(
    tile: Tile,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): number {
    const passability = tile.passability || 1.0;
    return passability;
  }

  /**
   * Evaluate dynamic tile timing
   */
  private evaluateDynamicTileTiming(
    tile: Tile,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): number {
    if (!tile.isDynamic || !tile.dynamicComponent) {
      return 0;
    }

    const timeUntilActive = tile.dynamicComponent.timeUntilActivation || Infinity;
    const duration = tile.dynamicComponent.duration || 0;

    // Risk-tolerant personalities value soon-to-activate dynamic tiles
    if (agent.personality === AIPersonality.RECKLESS_STORM_CHASER) {
      if (timeUntilActive < 60) {
        const urgencyBonus = (1 - (timeUntilActive / 60)) * 2;
        return urgencyBonus;
      }
    }

    // Cautious personalities avoid imminent dynamic events
    if (agent.personality === AIPersonality.CAUTIOUS_GEOLOGIST && timeUntilActive < 30) {
      return -1; // Penalize soon-to-activate tiles
    }

    return 0;
  }

  /**
   * Evaluate counterplay opportunities
   */
  private evaluateCounterplayOpportunity(
    tile: Tile,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): number {
    let counterplayScore = 0;

    // Check if this tile can counter enemy positions
    const enemyUnits = state.units.filter(u => u.playerId !== playerId);
    const nearbyEnemies = enemyUnits.filter(e => {
      const distance = Math.sqrt(
        Math.pow(e.position.x - tile.x, 2) + 
        Math.pow(e.position.y - tile.y, 2)
      );
      return distance < 8;
    });

    if (nearbyEnemies.length > 0 && tile.defenseBonus && tile.defenseBonus > 0.3) {
      counterplayScore += 0.3;
    }

    // Check if this position can cut off enemy resources
    const enemyResourceTiles = this.findEnemyResourceTiles(state, playerId);
    const canCutOff = enemyResourceTiles.some(rt => {
      const distance = Math.sqrt(
        Math.pow(rt.x - tile.x, 2) + 
        Math.pow(rt.y - tile.y, 2)
      );
      return distance < 5 && tile.isChokepoint;
    });

    if (canCutOff) {
      counterplayScore += 0.4;
    }

    return Math.max(0, Math.min(1, counterplayScore));
  }

  /**
   * Calculate threat assessment for a tile
   */
  private calculateThreatAssessment(
    tile: Tile,
    state: GameState,
    playerId: string
  ): number {
    let threatLevel = 0;

    // Enemy proximity threat
    const enemyUnits = state.units.filter(u => u.playerId !== playerId);
    for (const enemy of enemyUnits) {
      const distance = Math.sqrt(
        Math.pow(enemy.position.x - tile.x, 2) + 
        Math.pow(enemy.position.y - tile.y, 2)
      );
      const unitThreat = this.getUnitThreatLevel(enemy);
      threatLevel += unitThreat / (distance + 1);
    }

    // Exposure threat (visible from multiple enemy positions)
    const enemySightlines = this.countEnemySightlines(tile, state, playerId);
    threatLevel += enemySightlines * 0.2;

    return Math.max(0, threatLevel);
  }

  /**
   * Get resource value based on type and amount
   */
  private getResourceValue(type: string, amount: number): number {
    const typeValues: Record<string, number> = {
      matter: 1.0,
      energy: 0.9,
      life: 1.1,
      knowledge: 1.2
    };

    const baseValue = typeValues[type] || 1.0;
    return baseValue * (amount / 1000); // Normalize by typical resource amount
  }

  /**
   * Get faction biome affinity
   */
  private getFactionBiomeAffinity(faction: string, biome: string): number {
    // Simplified affinity system
    const affinities: Record<string, Record<string, number>> = {
      quantum: { quantum: 0.3, void: 0.2 },
      biological: { organic: 0.3, life: 0.2 },
      mechanical: { mechanical: 0.3, crystalline: 0.2 }
    };

    return affinities[faction]?.[biome] || 0;
  }

  /**
   * Get unit threat level
   */
  private getUnitThreatLevel(unit: any): number {
    // Simplified threat calculation
    const healthRatio = unit.health / (unit.maxHealth || 100);
    const typeThreat: Record<string, number> = {
      assault: 0.8,
      support: 0.4,
      siege: 1.0,
      scout: 0.3
    };

    return (typeThreat[unit.type] || 0.5) * healthRatio;
  }

  /**
   * Count enemy sightlines to a tile
   */
  private countEnemySightlines(
    tile: Tile,
    state: GameState,
    playerId: string
  ): number {
    const enemyUnits = state.units.filter(u => u.playerId !== playerId);
    let sightlines = 0;

    for (const enemy of enemyUnits) {
      const distance = Math.sqrt(
        Math.pow(enemy.position.x - tile.x, 2) + 
        Math.pow(enemy.position.y - tile.y, 2)
      );
      // Assume vision range of 6
      if (distance <= 6) {
        sightlines++;
      }
    }

    return sightlines;
  }

  /**
   * Find enemy resource tiles
   */
  private findEnemyResourceTiles(
    state: GameState,
    playerId: string
  ): Tile[] {
    const resourceTiles: Tile[] = [];
    const enemyUnits = state.units.filter(u => u.playerId !== playerId);
    
    // Simplified: find tiles near enemy units that might have resources
    for (const enemy of enemyUnits) {
      const nearbyTiles = state.map.getTilesInRange(
        enemy.position.x,
        enemy.position.y,
        3
      );
      
      for (const tile of nearbyTiles) {
        if (tile.resource && tile.resource.amount > 0) {
          resourceTiles.push(tile);
        }
      }
    }

    return resourceTiles;
  }

  /**
   * Generate reasoning for tile evaluation
   */
  private generateReasoning(
    breakdown: TileEvaluation['breakdown'],
    agent: TerrainAIAgent
  ): string {
    const reasons: string[] = [];

    if (breakdown.defensive > 0.5) {
      reasons.push('Strong defensive position');
    }
    if (breakdown.resource > 0.5) {
      reasons.push('Valuable resource node');
    }
    if (breakdown.vision > 0.5) {
      reasons.push('Excellent vision/expansion point');
    }
    if (breakdown.dynamic > 0.3) {
      reasons.push('Dynamic tile opportunity');
    }
    if (breakdown.threat < -0.5) {
      reasons.push('High threat area');
    }

    if (reasons.length === 0) {
      return 'Standard tactical position';
    }

    return reasons.join(', ');
  }
}

