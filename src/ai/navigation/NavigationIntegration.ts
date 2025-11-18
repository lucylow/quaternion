/**
 * Navigation System Integration
 * Integrates new open-world navigation with existing AIPathfinding system
 */

import { AIPathfinding, Path } from '../terrain/AIPathfinding';
import { OpenWorldNavigationManager } from './OpenWorldNavigationManager';
import { NavigationRequest, NavigationPurpose } from './ContextAwareNavigation';
import { UrgencyLevel } from './RLNavigationAgent';
import { GameState } from '../terrain/AITileEvaluator';
import { TerrainAIAgent } from '../terrain/TerrainAIPersonality';
import { ChunkManager } from '../../map/ChunkManager';

export interface EnhancedPathfindingOptions {
  useOpenWorldNavigation?: boolean;
  useHierarchicalPathfinding?: boolean;
  useReinforcementLearning?: boolean;
  useContextAwareness?: boolean;
  fallbackToOriginal?: boolean;
}

/**
 * Enhanced Pathfinding that integrates open-world navigation
 */
export class EnhancedAIPathfinding {
  private originalPathfinding: AIPathfinding;
  private openWorldNav: OpenWorldNavigationManager | null = null;
  private options: EnhancedPathfindingOptions;

  constructor(
    originalPathfinding: AIPathfinding,
    chunkManager: ChunkManager | null = null,
    options: EnhancedPathfindingOptions = {}
  ) {
    this.originalPathfinding = originalPathfinding;
    this.options = {
      useOpenWorldNavigation: true,
      useHierarchicalPathfinding: true,
      useReinforcementLearning: true,
      useContextAwareness: true,
      fallbackToOriginal: true,
      ...options
    };

    // Initialize open-world navigation if enabled and chunk manager available
    if (this.options.useOpenWorldNavigation && chunkManager) {
      this.openWorldNav = new OpenWorldNavigationManager(chunkManager, {
        useHierarchicalPathfinding: this.options.useHierarchicalPathfinding,
        useReinforcementLearning: this.options.useReinforcementLearning,
        useContextAwareness: this.options.useContextAwareness,
        useHumanClustering: true,
        useMultiModalTransport: true,
        useDynamicAdaptation: true
      });
    }
  }

  /**
   * Find optimal path - enhanced version with open-world capabilities
   */
  public findOptimalPath(
    start: { x: number; y: number },
    target: { x: number; y: number },
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string,
    options: {
      avoidThreats?: boolean;
      preferCover?: boolean;
      allowFlanking?: boolean;
      purpose?: NavigationPurpose;
      urgency?: UrgencyLevel;
      useOpenWorld?: boolean;
    } = {}
  ): Path | null {
    const useOpenWorld = options.useOpenWorld !== false && this.openWorldNav !== null;

    if (useOpenWorld) {
      // Use open-world navigation system
      const navRequest: NavigationRequest = {
        start,
        destination: target,
        purpose: options.purpose || this.inferPurpose(agent, state),
        urgency: options.urgency || UrgencyLevel.NORMAL,
        agentId: playerId,
        constraints: {
          requireCover: options.preferCover || false,
          stealthRequired: false
        }
      };

      const result = this.openWorldNav.navigate(navRequest, state, playerId);

      if (result && result.path.length > 0) {
        // Convert to Path format
        return this.convertToPath(result, state, playerId, options);
      }

      // Fallback to original if open-world navigation fails
      if (this.options.fallbackToOriginal) {
        return this.originalPathfinding.findOptimalPath(
          start,
          target,
          state,
          agent,
          playerId,
          options
        );
      }

      return null;
    }

    // Use original pathfinding
    return this.originalPathfinding.findOptimalPath(
      start,
      target,
      state,
      agent,
      playerId,
      options
    );
  }

  /**
   * Convert navigation result to Path format
   */
  private convertToPath(
    result: any,
    state: GameState,
    playerId: string,
    options: any
  ): Path {
    // Calculate path metrics
    const safety = this.calculatePathSafety(result.path, state, playerId);
    const speed = this.calculatePathSpeed(result.path, state);
    const tacticalValue = this.calculateTacticalValue(result.path, state, playerId);
    const threat = this.calculatePathThreat(result.path, state, playerId);

    // Calculate score
    const score = safety * 0.4 +
                 speed * 0.3 +
                 tacticalValue * 0.2 -
                 threat * 0.1;

    return {
      waypoints: result.path,
      score,
      safety,
      speed,
      tacticalValue,
      threat,
      reasoning: result.reasoning || `Open-world navigation: ${result.strategy}`
    };
  }

  /**
   * Calculate path safety
   */
  private calculatePathSafety(
    waypoints: Array<{ x: number; y: number }>,
    state: GameState,
    playerId: string
  ): number {
    let safetyScore = 0;

    for (const waypoint of waypoints) {
      const tile = state.map.getTile(waypoint.x, waypoint.y);
      if (!tile) continue;

      safetyScore += (tile.defenseBonus || 0) * 0.2;
      safetyScore += (1 - (tile.visibilityModifier || 1)) * 0.3;

      // Check enemy vision
      const enemyUnits = state.units.filter(u => u.playerId !== playerId);
      for (const enemy of enemyUnits) {
        const distance = Math.sqrt(
          Math.pow(enemy.position.x - waypoint.x, 2) +
          Math.pow(enemy.position.y - waypoint.y, 2)
        );
        if (distance < 6) {
          safetyScore -= 0.5;
        }
      }
    }

    return Math.max(0, safetyScore / waypoints.length);
  }

  /**
   * Calculate path speed
   */
  private calculatePathSpeed(
    waypoints: Array<{ x: number; y: number }>,
    state: GameState
  ): number {
    let totalPassability = 0;

    for (const waypoint of waypoints) {
      const tile = state.map.getTile(waypoint.x, waypoint.y);
      if (tile) {
        totalPassability += tile.passability || 1.0;
      }
    }

    const avgPassability = totalPassability / waypoints.length;
    const pathLength = waypoints.length;

    return (1 / pathLength) * avgPassability;
  }

  /**
   * Calculate tactical value
   */
  private calculateTacticalValue(
    waypoints: Array<{ x: number; y: number }>,
    state: GameState,
    playerId: string
  ): number {
    let tacticalValue = 0;

    for (const waypoint of waypoints) {
      const tile = state.map.getTile(waypoint.x, waypoint.y);
      if (!tile) continue;

      if (tile.isChokepoint) {
        tacticalValue += 0.3;
      }

      if (tile.elevation && tile.elevation > 0.6) {
        tacticalValue += 0.2;
      }

      if (tile.resource && tile.resource.amount > 0) {
        tacticalValue += 0.1;
      }
    }

    return Math.min(1, tacticalValue / waypoints.length);
  }

  /**
   * Calculate path threat
   */
  private calculatePathThreat(
    waypoints: Array<{ x: number; y: number }>,
    state: GameState,
    playerId: string
  ): number {
    let threatLevel = 0;

    for (const waypoint of waypoints) {
      const enemyUnits = state.units.filter(u => u.playerId !== playerId);
      for (const enemy of enemyUnits) {
        const distance = Math.sqrt(
          Math.pow(enemy.position.x - waypoint.x, 2) +
          Math.pow(enemy.position.y - waypoint.y, 2)
        );
        if (distance < 5) {
          threatLevel += 1 / (distance + 1);
        }
      }
    }

    return threatLevel;
  }

  /**
   * Infer navigation purpose from agent
   */
  private inferPurpose(agent: TerrainAIAgent, state: GameState): NavigationPurpose {
    // Would analyze agent state and game context
    // For now, default to commute
    return NavigationPurpose.COMMUTE;
  }

  /**
   * Record navigation outcome for learning
   */
  public recordNavigationOutcome(
    agentId: string,
    start: { x: number; y: number },
    end: { x: number; y: number },
    path: Array<{ x: number; y: number }>,
    outcome: {
      reachedDestination: boolean;
      timeTaken: number;
      energyUsed: number;
      obstaclesEncountered: number;
      pathEfficiency: number;
    }
  ): void {
    if (this.openWorldNav) {
      this.openWorldNav.recordNavigationOutcome(agentId, start, end, path, outcome);
    }
  }

  /**
   * Get open-world navigation manager
   */
  public getOpenWorldNavigation(): OpenWorldNavigationManager | null {
    return this.openWorldNav;
  }
}

