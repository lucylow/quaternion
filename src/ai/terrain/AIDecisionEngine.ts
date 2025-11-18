/**
 * Personality-Driven Decision Making Engine
 * Generates strategic actions based on AI personality and game situation
 */

import { AIPersonality, TerrainAIAgent } from './TerrainAIPersonality';
import { GameState, Tile } from './AITileEvaluator';
import { AIAction } from './AIAdaptationManager';
import { AITileEvaluator } from './AITileEvaluator';

export class AIDecisionEngine {
  private tileEvaluator: AITileEvaluator;

  constructor() {
    this.tileEvaluator = new AITileEvaluator();
  }

  /**
   * Generate strategic action based on personality
   */
  generateStrategicAction(
    agent: TerrainAIAgent,
    state: GameState,
    playerId: string
  ): AIAction | null {
    switch (agent.personality) {
      case AIPersonality.CAUTIOUS_GEOLOGIST:
        return this.cautiousGeologistAction(agent, state, playerId);
      case AIPersonality.RECKLESS_STORM_CHASER:
        return this.recklessStormChaserAction(agent, state, playerId);
      case AIPersonality.METHODICAL_ENGINEER:
        return this.methodicalEngineerAction(agent, state, playerId);
      case AIPersonality.ADAPTIVE_SURVIVOR:
        return this.adaptiveSurvivorAction(agent, state, playerId);
      default:
        return this.defaultAction(agent, state, playerId);
    }
  }

  /**
   * Cautious Geologist action - prioritize secure resource nodes and defensive positions
   */
  private cautiousGeologistAction(
    agent: TerrainAIAgent,
    state: GameState,
    playerId: string
  ): AIAction | null {
    // Find safe resource nodes
    const safeResources = this.findTilesWithLowThreat(
      state,
      playerId,
      t => t.resource && t.resource.amount > 0
    );

    // Find defensible chokepoints
    const defensiblePositions = this.findDefensibleChokepoints(state, playerId);

    // Prioritize chokepoints if we don't control key ones
    if (defensiblePositions.length > 0 && !this.controlKeyChokepoint(agent, state, playerId)) {
      const bestChokepoint = this.getMostValuableTile(defensiblePositions, state, agent, playerId);
      return {
        type: 'capture_position',
        targetTile: bestChokepoint,
        priority: 0.9,
        reasoning: 'Securing defensible chokepoint for resource protection'
      };
    }

    // Otherwise expand to secure resource nodes
    if (safeResources.length > 0) {
      const bestResource = this.getMostValuableTile(safeResources, state, agent, playerId);
      return {
        type: 'expand_resources',
        targetTile: bestResource,
        priority: 0.7,
        reasoning: 'Expanding to secure resource nodes'
      };
    }

    return this.defaultAction(agent, state, playerId);
  }

  /**
   * Reckless Storm Chaser action - chase dynamic tiles and aggressive expansion
   */
  private recklessStormChaserAction(
    agent: TerrainAIAgent,
    state: GameState,
    playerId: string
  ): AIAction | null {
    // Find imminent dynamic tiles
    const imminentDynamicTiles = this.findImminentDynamicTiles(state, 30); // 30 seconds
    const enemyVulnerabilities = this.findEnemyResourceVulnerabilities(state, playerId);

    // Prioritize dynamic tile opportunities
    if (imminentDynamicTiles.length > 0) {
      const bestDynamic = this.getMostValuableTile(imminentDynamicTiles, state, agent, playerId);
      return {
        type: 'rush_dynamic',
        targetTile: bestDynamic,
        priority: 0.95,
        reasoning: 'Capitalizing on imminent dynamic tile activation'
      };
    }

    // Strike vulnerable enemy resources
    if (enemyVulnerabilities.length > 0) {
      const bestTarget = this.getMostValuableTile(enemyVulnerabilities, state, agent, playerId);
      return {
        type: 'attack_resources',
        targetTile: bestTarget,
        priority: 0.8,
        reasoning: 'Striking vulnerable enemy resource node'
      };
    }

    return this.aggressiveExpansionAction(agent, state, playerId);
  }

  /**
   * Methodical Engineer action - focus on tech and terrain manipulation
   */
  private methodicalEngineerAction(
    agent: TerrainAIAgent,
    state: GameState,
    playerId: string
  ): AIAction | null {
    // Check if we can research terrain tech
    if (this.canResearchTerrainTech(state, playerId)) {
      const techType = this.getMostImpactfulTerrainTech(state, playerId);
      return {
        type: 'research_tech',
        techType,
        priority: 0.85,
        reasoning: 'Researching terrain-manipulation technology'
      };
    }

    // Find tiles with tech synergy
    const techSynergyTiles = this.findTilesWithTechSynergy(state, playerId);
    if (techSynergyTiles.length > 0) {
      const bestTile = this.getMostValuableTile(techSynergyTiles, state, agent, playerId);
      return {
        type: 'capture_synergy',
        targetTile: bestTile,
        priority: 0.75,
        reasoning: 'Securing tile with tech synergy potential'
      };
    }

    return this.defaultAction(agent, state, playerId);
  }

  /**
   * Adaptive Survivor action - react to opponent and counter terrain advantages
   */
  private adaptiveSurvivorAction(
    agent: TerrainAIAgent,
    state: GameState,
    playerId: string
  ): AIAction | null {
    // Infer opponent personality
    const opponentPersonality = this.inferOpponentPersonality(state, playerId);
    
    // Generate counter-action
    const counterAction = this.generateCounterAction(opponentPersonality, agent, state, playerId);
    if (counterAction) {
      return counterAction;
    }

    return this.defaultAction(agent, state, playerId);
  }

  /**
   * Default action fallback
   */
  private defaultAction(
    agent: TerrainAIAgent,
    state: GameState,
    playerId: string
  ): AIAction | null {
    // Simple expansion as default
    const expansionTiles = this.findExpansionTiles(state, playerId);
    if (expansionTiles.length > 0) {
      const bestTile = this.getMostValuableTile(expansionTiles, state, agent, playerId);
      return {
        type: 'expand_resources',
        targetTile: bestTile,
        priority: 0.5,
        reasoning: 'Standard expansion'
      };
    }

    return null;
  }

  /**
   * Aggressive expansion action
   */
  private aggressiveExpansionAction(
    agent: TerrainAIAgent,
    state: GameState,
    playerId: string
  ): AIAction | null {
    const expansionTiles = this.findExpansionTiles(state, playerId);
    if (expansionTiles.length > 0) {
      const bestTile = this.getMostValuableTile(expansionTiles, state, agent, playerId);
      return {
        type: 'expand_resources',
        targetTile: bestTile,
        priority: 0.7,
        reasoning: 'Aggressive expansion to gain territory'
      };
    }
    return null;
  }

  /**
   * Generate counter-action for opponent personality
   */
  private generateCounterAction(
    opponentPersonality: AIPersonality | null,
    agent: TerrainAIAgent,
    state: GameState,
    playerId: string
  ): AIAction | null {
    if (!opponentPersonality) {
      return null;
    }

    switch (opponentPersonality) {
      case AIPersonality.CAUTIOUS_GEOLOGIST: {
        // Attack their predictable resource nodes
        const resourceTargets = this.findEnemyResourceVulnerabilities(state, playerId);
        if (resourceTargets.length > 0) {
          return {
            type: 'attack_resources',
            targetTile: this.getMostValuableTile(resourceTargets, state, agent, playerId),
            priority: 0.8,
            reasoning: 'Attacking predictable resource nodes of cautious opponent'
          };
        }
        break;
      }

      case AIPersonality.RECKLESS_STORM_CHASER: {
        // Set ambushes at dynamic tiles they'll target
        const dynamicTiles = this.findImminentDynamicTiles(state, 60);
        if (dynamicTiles.length > 0) {
          return {
            type: 'capture_position',
            targetTile: this.getMostValuableTile(dynamicTiles, state, agent, playerId),
            priority: 0.9,
            reasoning: 'Setting ambush for aggressive opponent at dynamic tile'
          };
        }
        break;
      }

      case AIPersonality.METHODICAL_ENGINEER:
        // Disrupt their tech progression
        return {
          type: 'attack_resources',
          priority: 0.7,
          reasoning: 'Disrupting tech-focused opponent by attacking resources'
        };
    }

    return null;
  }

  // Helper methods

  private findTilesWithLowThreat(
    state: GameState,
    playerId: string,
    filter: (tile: Tile) => boolean
  ): Tile[] {
    const allTiles: Tile[] = [];
    // Simplified - would iterate through map tiles
    return allTiles.filter(filter);
  }

  private findDefensibleChokepoints(state: GameState, playerId: string): Tile[] {
    const chokepoints: Tile[] = [];
    // Simplified - would find actual chokepoints
    return chokepoints;
  }

  private controlKeyChokepoint(agent: TerrainAIAgent, state: GameState, playerId: string): boolean {
    // Simplified check
    return false;
  }

  private getMostValuableTile(
    tiles: Tile[],
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): { x: number; y: number } {
    if (tiles.length === 0) {
      return { x: 0, y: 0 };
    }

    // Evaluate all tiles and return best
    let bestTile = tiles[0];
    let bestScore = -Infinity;

    for (const tile of tiles) {
      const evaluation = this.tileEvaluator.evaluateTileStrategicValue(tile, state, agent, playerId);
      if (evaluation.score > bestScore) {
        bestScore = evaluation.score;
        bestTile = tile;
      }
    }

    return { x: bestTile.x, y: bestTile.y };
  }

  private findImminentDynamicTiles(state: GameState, timeThreshold: number): Tile[] {
    const dynamicTiles: Tile[] = [];
    // Simplified - would find actual dynamic tiles
    return dynamicTiles;
  }

  private findEnemyResourceVulnerabilities(state: GameState, playerId: string): Tile[] {
    const vulnerabilities: Tile[] = [];
    // Simplified - would find actual vulnerabilities
    return vulnerabilities;
  }

  private canResearchTerrainTech(state: GameState, playerId: string): boolean {
    // Simplified check
    return false;
  }

  private getMostImpactfulTerrainTech(state: GameState, playerId: string): string {
    return 'terrain_manipulation';
  }

  private findTilesWithTechSynergy(state: GameState, playerId: string): Tile[] {
    const synergyTiles: Tile[] = [];
    // Simplified
    return synergyTiles;
  }

  private inferOpponentPersonality(state: GameState, playerId: string): AIPersonality | null {
    // Simplified inference
    return null;
  }

  private findExpansionTiles(state: GameState, playerId: string): Tile[] {
    const expansionTiles: Tile[] = [];
    // Simplified
    return expansionTiles;
  }
}

