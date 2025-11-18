/**
 * Advanced Pathfinding System
 * Provides terrain-aware pathfinding with flanking, cover, and tactical considerations
 */

import { Tile, GameState } from './AITileEvaluator';
import { TerrainAIAgent } from './TerrainAIPersonality';

export interface Path {
  waypoints: Array<{ x: number; y: number }>;
  score: number;
  safety: number;
  speed: number;
  tacticalValue: number;
  threat: number;
  reasoning: string;
}

export class AIPathfinding {
  /**
   * Find optimal path between two points
   */
  findOptimalPath(
    start: { x: number; y: number },
    target: { x: number; y: number },
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string,
    options: {
      avoidThreats?: boolean;
      preferCover?: boolean;
      allowFlanking?: boolean;
    } = {}
  ): Path | null {
    const {
      avoidThreats = true,
      preferCover = true,
      allowFlanking = true
    } = options;

    // Generate multiple route options
    const candidatePaths: Path[] = [];

    // Direct path
    const directPath = this.findDirectPath(start, target, state);
    if (directPath) candidatePaths.push(directPath);

    // Cover path
    if (preferCover) {
      const coverPath = this.findCoverPath(start, target, state, playerId);
      if (coverPath) candidatePaths.push(coverPath);
    }

    // High ground path
    const highGroundPath = this.findHighGroundPath(start, target, state);
    if (highGroundPath) candidatePaths.push(highGroundPath);

    // Flanking path
    if (allowFlanking) {
      const flankingPath = this.findFlankingPath(start, target, state, playerId);
      if (flankingPath) candidatePaths.push(flankingPath);
    }

    if (candidatePaths.length === 0) {
      return null;
    }

    // Score each path
    for (const path of candidatePaths) {
      path.safety = this.evaluatePathSafety(path, state, playerId);
      path.speed = this.evaluatePathSpeed(path, state);
      path.tacticalValue = this.evaluatePathTacticalValue(path, state, playerId);
      path.threat = avoidThreats ? this.evaluatePathThreat(path, state, playerId) : 0;

      path.score = path.safety * 0.4 +
                   path.speed * 0.3 +
                   path.tacticalValue * 0.2 -
                   path.threat * 0.1;

      path.reasoning = this.generatePathReasoning(path);
    }

    // Return highest scoring path
    return candidatePaths.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  /**
   * Find direct path using A* algorithm
   */
  private findDirectPath(
    start: { x: number; y: number },
    target: { x: number; y: number },
    state: GameState
  ): Path | null {
    // Simplified A* implementation
    const waypoints = this.aStar(start, target, state, (tile) => {
      // Cost based on passability
      return 1 / (tile.passability || 0.5);
    });

    if (waypoints.length === 0) {
      return null;
    }

    return {
      waypoints,
      score: 0,
      safety: 0,
      speed: 0,
      tacticalValue: 0,
      threat: 0,
      reasoning: 'Direct route'
    };
  }

  /**
   * Find path that maximizes cover
   */
  private findCoverPath(
    start: { x: number; y: number },
    target: { x: number; y: number },
    state: GameState,
    playerId: string
  ): Path | null {
    const waypoints = this.aStar(start, target, state, (tile) => {
      let cost = 1;
      
      // Prefer tiles with better cover (lower visibility)
      const visibility = tile.visibilityModifier || 1.0;
      cost *= (1 + visibility);
      
      // Prefer defensive positions
      if (tile.defenseBonus && tile.defenseBonus > 0.3) {
        cost *= 0.7;
      }
      
      return cost;
    });

    if (waypoints.length === 0) {
      return null;
    }

    return {
      waypoints,
      score: 0,
      safety: 0,
      speed: 0,
      tacticalValue: 0,
      threat: 0,
      reasoning: 'Cover route'
    };
  }

  /**
   * Find path that maximizes high ground
   */
  private findHighGroundPath(
    start: { x: number; y: number },
    target: { x: number; y: number },
    state: GameState
  ): Path | null {
    const waypoints = this.aStar(start, target, state, (tile) => {
      let cost = 1;
      
      // Prefer higher elevation
      if (tile.elevation && tile.elevation > 0.5) {
        cost *= 0.6;
      } else if (tile.elevation && tile.elevation < 0.3) {
        cost *= 1.3;
      }
      
      return cost;
    });

    if (waypoints.length === 0) {
      return null;
    }

    return {
      waypoints,
      score: 0,
      safety: 0,
      speed: 0,
      tacticalValue: 0,
      threat: 0,
      reasoning: 'High ground route'
    };
  }

  /**
   * Find flanking path that approaches from unexpected angles
   */
  private findFlankingPath(
    start: { x: number; y: number },
    target: { x: number; y: number },
    state: GameState,
    playerId: string
  ): Path | null {
    const enemyPosition = this.getPrimaryEnemyPosition(state, playerId);
    if (!enemyPosition) {
      return null;
    }

    // Calculate flanking approach vectors
    const flankingApproaches = this.calculateFlankingVectors(target, enemyPosition);

    for (const approach of flankingApproaches) {
      const waypoints = this.findPathToApproachVector(start, target, approach, state);
      if (waypoints && waypoints.length > 0) {
        const path: Path = {
          waypoints,
          score: 0,
          safety: 0,
          speed: 0,
          tacticalValue: 0,
          threat: 0,
          reasoning: 'Flanking route'
        };

        // Check if path is concealed
        if (this.isPathConcealed(path, state, playerId)) {
          return path;
        }
      }
    }

    return null;
  }

  /**
   * Evaluate path safety
   */
  private evaluatePathSafety(
    path: Path,
    state: GameState,
    playerId: string
  ): number {
    let safetyScore = 0;

    for (const waypoint of path.waypoints) {
      const tile = state.map.getTile(waypoint.x, waypoint.y);
      if (!tile) continue;

      safetyScore += (tile.defenseBonus || 0) * 0.2;
      safetyScore += (1 - (tile.visibilityModifier || 1)) * 0.3; // Prefer concealment

      // Penalize exposure to enemy vision
      if (this.isTileUnderEnemyVision(waypoint, state, playerId)) {
        safetyScore -= 0.5;
      }
    }

    return Math.max(0, safetyScore / path.waypoints.length);
  }

  /**
   * Evaluate path speed
   */
  private evaluatePathSpeed(
    path: Path,
    state: GameState
  ): number {
    let totalPassability = 0;

    for (const waypoint of path.waypoints) {
      const tile = state.map.getTile(waypoint.x, waypoint.y);
      if (tile) {
        totalPassability += tile.passability || 1.0;
      }
    }

    const avgPassability = totalPassability / path.waypoints.length;
    const pathLength = path.waypoints.length;
    
    // Shorter paths with good passability are faster
    return (1 / pathLength) * avgPassability;
  }

  /**
   * Evaluate tactical value of path
   */
  private evaluatePathTacticalValue(
    path: Path,
    state: GameState,
    playerId: string
  ): number {
    let tacticalValue = 0;

    for (const waypoint of path.waypoints) {
      const tile = state.map.getTile(waypoint.x, waypoint.y);
      if (!tile) continue;

      // Chokepoints are tactically valuable
      if (tile.isChokepoint) {
        tacticalValue += 0.3;
      }

      // High ground is tactically valuable
      if (tile.elevation && tile.elevation > 0.6) {
        tacticalValue += 0.2;
      }

      // Resource nodes along path
      if (tile.resource && tile.resource.amount > 0) {
        tacticalValue += 0.1;
      }
    }

    return Math.min(1, tacticalValue / path.waypoints.length);
  }

  /**
   * Evaluate threat along path
   */
  private evaluatePathThreat(
    path: Path,
    state: GameState,
    playerId: string
  ): number {
    let threatLevel = 0;

    for (const waypoint of path.waypoints) {
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
   * Check if path is concealed from enemies
   */
  private isPathConcealed(
    path: Path,
    state: GameState,
    playerId: string
  ): boolean {
    let exposedSteps = 0;

    for (const waypoint of path.waypoints) {
      if (this.isTileUnderEnemyVision(waypoint, state, playerId)) {
        exposedSteps++;
      }
    }

    // Path is considered concealed if less than 30% is exposed
    return (exposedSteps / path.waypoints.length) < 0.3;
  }

  /**
   * Check if tile is under enemy vision
   */
  private isTileUnderEnemyVision(
    position: { x: number; y: number },
    state: GameState,
    playerId: string
  ): boolean {
    const enemyUnits = state.units.filter(u => u.playerId !== playerId);
    
    for (const enemy of enemyUnits) {
      const distance = Math.sqrt(
        Math.pow(enemy.position.x - position.x, 2) +
        Math.pow(enemy.position.y - position.y, 2)
      );
      // Assume vision range of 6
      if (distance <= 6) {
        return true;
      }
    }

    return false;
  }

  /**
   * Simplified A* pathfinding
   */
  private aStar(
    start: { x: number; y: number },
    target: { x: number; y: number },
    state: GameState,
    costFunction: (tile: Tile) => number
  ): Array<{ x: number; y: number }> {
    // Simplified A* - in production, use a proper A* implementation
    const waypoints: Array<{ x: number; y: number }> = [start];
    let current = start;
    const visited = new Set<string>();
    visited.add(`${current.x},${current.y}`);

    const maxIterations = 100;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;
      
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 1.5) {
        waypoints.push(target);
        break;
      }

      // Move towards target
      const stepX = Math.sign(dx) * Math.min(1, Math.abs(dx));
      const stepY = Math.sign(dy) * Math.min(1, Math.abs(dy));

      const nextX = current.x + stepX;
      const nextY = current.y + stepY;
      const nextKey = `${nextX},${nextY}`;

      if (!visited.has(nextKey)) {
        const tile = state.map.getTile(nextX, nextY);
        if (tile && (tile.passability || 1) > 0.3) {
          current = { x: nextX, y: nextY };
          waypoints.push(current);
          visited.add(nextKey);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return waypoints;
  }

  /**
   * Calculate flanking approach vectors
   */
  private calculateFlankingVectors(
    target: { x: number; y: number },
    enemyPosition: { x: number; y: number }
  ): Array<{ x: number; y: number }> {
    const approaches: Array<{ x: number; y: number }> = [];

    // Calculate angle from enemy to target
    const dx = target.x - enemyPosition.x;
    const dy = target.y - enemyPosition.y;
    const angle = Math.atan2(dy, dx);

    // Generate flanking angles (perpendicular to line of sight)
    const flankAngle1 = angle + Math.PI / 2;
    const flankAngle2 = angle - Math.PI / 2;

    const distance = 5; // Flanking distance

    approaches.push({
      x: target.x + Math.cos(flankAngle1) * distance,
      y: target.y + Math.sin(flankAngle1) * distance
    });

    approaches.push({
      x: target.x + Math.cos(flankAngle2) * distance,
      y: target.y + Math.sin(flankAngle2) * distance
    });

    return approaches;
  }

  /**
   * Find path to approach vector
   */
  private findPathToApproachVector(
    start: { x: number; y: number },
    target: { x: number; y: number },
    approach: { x: number; y: number },
    state: GameState
  ): Array<{ x: number; y: number }> | null {
    // First go to approach point, then to target
    const path1 = this.aStar(start, approach, state, () => 1);
    const path2 = this.aStar(approach, target, state, () => 1);

    if (path1.length === 0 || path2.length === 0) {
      return null;
    }

    return [...path1, ...path2.slice(1)];
  }

  /**
   * Get primary enemy position
   */
  private getPrimaryEnemyPosition(
    state: GameState,
    playerId: string
  ): { x: number; y: number } | null {
    const enemyUnits = state.units.filter(u => u.playerId !== playerId);
    if (enemyUnits.length === 0) {
      return null;
    }

    // Return position of strongest enemy unit
    const strongest = enemyUnits.reduce((best, current) => {
      const bestThreat = (best.health / best.maxHealth) * (best.maxHealth || 100);
      const currentThreat = (current.health / current.maxHealth) * (current.maxHealth || 100);
      return currentThreat > bestThreat ? current : best;
    });

    return strongest.position;
  }

  /**
   * Generate reasoning for path choice
   */
  private generatePathReasoning(path: Path): string {
    const reasons: string[] = [];

    if (path.safety > 0.6) {
      reasons.push('safe');
    }
    if (path.speed > 0.6) {
      reasons.push('fast');
    }
    if (path.tacticalValue > 0.5) {
      reasons.push('tactically valuable');
    }
    if (path.threat < 0.2) {
      reasons.push('low threat');
    }

    if (reasons.length === 0) {
      return 'Standard route';
    }

    return `Route: ${reasons.join(', ')}`;
  }
}


