/**
 * Dynamic World Adaptation System
 * Handles navigation in constantly changing environments
 */

import { Tile, GameState } from '../terrain/AITileEvaluator';

export enum WorldChangeType {
  CONSTRUCTION = 'construction',
  NATURAL_DISASTER = 'natural_disaster',
  PLAYER_INFLUENCE = 'player_influence',
  ENVIRONMENTAL = 'environmental',
  TEMPORARY_BLOCKAGE = 'temporary_blockage',
  PERMANENT_OBSTACLE = 'permanent_obstacle'
}

export interface WorldChange {
  id: string;
  type: WorldChangeType;
  position: { x: number; y: number };
  radius: number;
  severity: number; // 0-1
  estimatedDuration: number; // milliseconds, -1 for permanent
  timestamp: number;
  description: string;
  affectedRoutes: Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
  }>;
}

export enum RouteDiscoveryMethod {
  EXPLORATION = 'exploration',
  SOCIAL_OBSERVATION = 'social_observation',
  MAP_CONSULTATION = 'map_consultation',
  TRIAL_AND_ERROR = 'trial_and_error',
  AI_ASSISTED = 'ai_assisted'
}

export interface RouteDiscovery {
  method: RouteDiscoveryMethod;
  newRoute: Array<{ x: number; y: number }>;
  oldRoute: Array<{ x: number; y: number }>;
  discoveryTime: number;
  efficiency: number; // 0-1
  success: boolean;
}

export class DynamicWorldAdaptation {
  private worldChanges: Map<string, WorldChange>;
  private routeDiscoveries: Map<string, RouteDiscovery[]>;
  private blockedRoutes: Map<string, Set<string>>; // routeKey -> set of blocked positions
  private alternativeRoutes: Map<string, Array<{ x: number; y: number }>>; // routeKey -> alternative paths

  constructor() {
    this.worldChanges = new Map();
    this.routeDiscoveries = new Map();
    this.blockedRoutes = new Map();
    this.alternativeRoutes = new Map();
  }

  /**
   * Register a world change
   */
  public registerWorldChange(change: WorldChange): void {
    this.worldChanges.set(change.id, change);

    // Identify affected routes
    this.identifyAffectedRoutes(change);

    // Notify navigation systems
    this.notifyNavigationSystems(change);
  }

  /**
   * Remove world change (when it expires or is resolved)
   */
  public removeWorldChange(changeId: string): void {
    const change = this.worldChanges.get(changeId);
    if (!change) return;

    this.worldChanges.delete(changeId);

    // Clear blocked routes
    for (const route of change.affectedRoutes) {
      const routeKey = this.routeKey(route.start, route.end);
      const blocked = this.blockedRoutes.get(routeKey);
      if (blocked) {
        blocked.delete(`${change.position.x},${change.position.y}`);
        if (blocked.size === 0) {
          this.blockedRoutes.delete(routeKey);
        }
      }
    }
  }

  /**
   * Check if route is blocked
   */
  public isRouteBlocked(
    start: { x: number; y: number },
    end: { x: number; y: number },
    waypoints: Array<{ x: number; y: number }>
  ): { blocked: boolean; blockingChanges: WorldChange[] } {
    const routeKey = this.routeKey(start, end);
    const blocked = this.blockedRoutes.get(routeKey);
    const blockingChanges: WorldChange[] = [];

    if (!blocked || blocked.size === 0) {
      return { blocked: false, blockingChanges: [] };
    }

    // Check each waypoint against world changes
    for (const waypoint of waypoints) {
      for (const change of this.worldChanges.values()) {
        const distance = this.distance(waypoint, change.position);
        if (distance <= change.radius) {
          blockingChanges.push(change);
        }
      }
    }

    return {
      blocked: blockingChanges.length > 0,
      blockingChanges
    };
  }

  /**
   * Find alternative route when blocked
   */
  public findAlternativeRoute(
    start: { x: number; y: number },
    end: { x: number; y: number },
    blockingChanges: WorldChange[],
    state: GameState,
    method: RouteDiscoveryMethod = RouteDiscoveryMethod.EXPLORATION
  ): Array<{ x: number; y: number }> | null {
    const routeKey = this.routeKey(start, end);

    // Check if we have a cached alternative
    if (this.alternativeRoutes.has(routeKey)) {
      const alternative = this.alternativeRoutes.get(routeKey)!;
      // Verify it's still valid
      const stillBlocked = this.isRouteBlocked(start, end, alternative);
      if (!stillBlocked.blocked) {
        return alternative;
      }
    }

    // Discover new route based on method
    const newRoute = this.discoverRoute(start, end, blockingChanges, state, method);

    if (newRoute) {
      // Cache the alternative
      this.alternativeRoutes.set(routeKey, newRoute);

      // Record discovery
      this.recordRouteDiscovery(routeKey, method, newRoute, start, end, state);
    }

    return newRoute;
  }

  /**
   * Discover new route using specified method
   */
  private discoverRoute(
    start: { x: number; y: number },
    end: { x: number; y: number },
    blockingChanges: WorldChange[],
    state: GameState,
    method: RouteDiscoveryMethod
  ): Array<{ x: number; y: number }> | null {
    switch (method) {
      case RouteDiscoveryMethod.EXPLORATION:
        return this.exploreAlternativeRoute(start, end, blockingChanges, state);

      case RouteDiscoveryMethod.SOCIAL_OBSERVATION:
        return this.observeSocialRoutes(start, end, blockingChanges, state);

      case RouteDiscoveryMethod.MAP_CONSULTATION:
        return this.consultMapForRoute(start, end, blockingChanges, state);

      case RouteDiscoveryMethod.TRIAL_AND_ERROR:
        return this.trialAndErrorRoute(start, end, blockingChanges, state);

      case RouteDiscoveryMethod.AI_ASSISTED:
        return this.aiAssistedRoute(start, end, blockingChanges, state);

      default:
        return this.exploreAlternativeRoute(start, end, blockingChanges, state);
    }
  }

  /**
   * Explore alternative route by avoiding blocked areas
   */
  private exploreAlternativeRoute(
    start: { x: number; y: number },
    end: { x: number; y: number },
    blockingChanges: WorldChange[],
    state: GameState
  ): Array<{ x: number; y: number }> | null {
    // Simple avoidance: go around blocked areas
    const waypoints: Array<{ x: number; y: number }> = [start];

    // Calculate avoidance vectors
    const avoidanceVectors = blockingChanges.map(change => {
      const dx = end.x - change.position.x;
      const dy = end.y - change.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return {
        x: (dx / dist) * (change.radius + 5),
        y: (dy / dist) * (change.radius + 5),
        position: change.position
      };
    });

    // Create waypoints that avoid blocked areas
    let current = start;
    const maxIterations = 100;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;

      const dx = end.x - current.x;
      const dy = end.y - current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 2) {
        waypoints.push(end);
        break;
      }

      // Check if current path would intersect blocked area
      let needsAvoidance = false;
      for (const change of blockingChanges) {
        const distToChange = this.distance(current, change.position);
        if (distToChange < change.radius + 2) {
          needsAvoidance = true;
          break;
        }
      }

      if (needsAvoidance) {
        // Find avoidance waypoint
        const avoidance = avoidanceVectors[0];
        if (avoidance) {
          const avoidPoint = {
            x: avoidance.position.x + avoidance.x,
            y: avoidance.position.y + avoidance.y
          };
          waypoints.push(avoidPoint);
          current = avoidPoint;
          continue;
        }
      }

      // Normal movement toward target
      const stepX = Math.sign(dx) * Math.min(1, Math.abs(dx));
      const stepY = Math.sign(dy) * Math.min(1, Math.abs(dy));
      current = { x: current.x + stepX, y: current.y + stepY };
      waypoints.push(current);
    }

    return waypoints.length > 1 ? waypoints : null;
  }

  /**
   * Observe social routes (learn from other agents)
   */
  private observeSocialRoutes(
    start: { x: number; y: number },
    end: { x: number; y: number },
    blockingChanges: WorldChange[],
    state: GameState
  ): Array<{ x: number; y: number }> | null {
    // Would observe other units' paths and learn from them
    // For now, fall back to exploration
    return this.exploreAlternativeRoute(start, end, blockingChanges, state);
  }

  /**
   * Consult map for route
   */
  private consultMapForRoute(
    start: { x: number; y: number },
    end: { x: number; y: number },
    blockingChanges: WorldChange[],
    state: GameState
  ): Array<{ x: number; y: number }> | null {
    // Would use map data to find alternative routes
    // For now, fall back to exploration
    return this.exploreAlternativeRoute(start, end, blockingChanges, state);
  }

  /**
   * Trial and error route discovery
   */
  private trialAndErrorRoute(
    start: { x: number; y: number },
    end: { x: number; y: number },
    blockingChanges: WorldChange[],
    state: GameState
  ): Array<{ x: number; y: number }> | null {
    // Try multiple random paths and pick best
    const candidates: Array<{ path: Array<{ x: number; y: number }>; score: number }> = [];

    for (let i = 0; i < 5; i++) {
      const path = this.exploreAlternativeRoute(start, end, blockingChanges, state);
      if (path) {
        const score = this.scoreRoute(path, blockingChanges);
        candidates.push({ path, score });
      }
    }

    if (candidates.length === 0) return null;

    // Return best scoring route
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].path;
  }

  /**
   * AI-assisted route discovery
   */
  private aiAssistedRoute(
    start: { x: number; y: number },
    end: { x: number; y: number },
    blockingChanges: WorldChange[],
    state: GameState
  ): Array<{ x: number; y: number }> | null {
    // Would use AI/ML to predict best alternative route
    // For now, use optimized exploration
    return this.exploreAlternativeRoute(start, end, blockingChanges, state);
  }

  /**
   * Score route quality
   */
  private scoreRoute(
    path: Array<{ x: number; y: number }>,
    blockingChanges: WorldChange[]
  ): number {
    let score = 1.0;

    // Penalize paths that get too close to blocked areas
    for (const waypoint of path) {
      for (const change of blockingChanges) {
        const dist = this.distance(waypoint, change.position);
        if (dist < change.radius + 5) {
          score -= 0.1;
        }
      }
    }

    // Prefer shorter paths
    let pathLength = 0;
    for (let i = 0; i < path.length - 1; i++) {
      pathLength += this.distance(path[i], path[i + 1]);
    }
    score -= pathLength * 0.01;

    return Math.max(0, score);
  }

  /**
   * Record route discovery
   */
  private recordRouteDiscovery(
    routeKey: string,
    method: RouteDiscoveryMethod,
    newRoute: Array<{ x: number; y: number }>,
    start: { x: number; y: number },
    end: { x: number; y: number },
    state: GameState
  ): void {
    if (!this.routeDiscoveries.has(routeKey)) {
      this.routeDiscoveries.set(routeKey, []);
    }

    const discoveries = this.routeDiscoveries.get(routeKey)!;
    const oldRoute = [start, end]; // Simplified

    const discovery: RouteDiscovery = {
      method,
      newRoute,
      oldRoute,
      discoveryTime: Date.now(),
      efficiency: this.calculateEfficiency(newRoute, oldRoute),
      success: true
    };

    discoveries.push(discovery);

    // Keep only recent discoveries
    if (discoveries.length > 10) {
      discoveries.shift();
    }
  }

  /**
   * Calculate route efficiency
   */
  private calculateEfficiency(
    newRoute: Array<{ x: number; y: number }>,
    oldRoute: Array<{ x: number; y: number }>
  ): number {
    const newLength = this.calculatePathLength(newRoute);
    const oldLength = this.calculatePathLength(oldRoute);
    return oldLength / Math.max(newLength, 0.1);
  }

  /**
   * Calculate path length
   */
  private calculatePathLength(path: Array<{ x: number; y: number }>): number {
    let length = 0;
    for (let i = 0; i < path.length - 1; i++) {
      length += this.distance(path[i], path[i + 1]);
    }
    return length;
  }

  /**
   * Identify routes affected by world change
   */
  private identifyAffectedRoutes(change: WorldChange): void {
    // Would analyze existing routes and identify which are affected
    // For now, mark the area as blocked
    const routeKey = `area_${change.position.x}_${change.position.y}`;
    if (!this.blockedRoutes.has(routeKey)) {
      this.blockedRoutes.set(routeKey, new Set());
    }
    this.blockedRoutes.get(routeKey)!.add(`${change.position.x},${change.position.y}`);
  }

  /**
   * Notify navigation systems of world change
   */
  private notifyNavigationSystems(change: WorldChange): void {
    // Would notify hierarchical pathfinding, RL agents, etc.
    // This would trigger route recalculation
  }

  /**
   * Get route discovery statistics
   */
  public getDiscoveryStats(): {
    totalDiscoveries: number;
    byMethod: Map<RouteDiscoveryMethod, number>;
    averageEfficiency: number;
  } {
    let total = 0;
    const byMethod = new Map<RouteDiscoveryMethod, number>();
    let totalEfficiency = 0;

    for (const discoveries of this.routeDiscoveries.values()) {
      for (const discovery of discoveries) {
        total++;
        byMethod.set(
          discovery.method,
          (byMethod.get(discovery.method) || 0) + 1
        );
        totalEfficiency += discovery.efficiency;
      }
    }

    return {
      totalDiscoveries: total,
      byMethod,
      averageEfficiency: total > 0 ? totalEfficiency / total : 0
    };
  }

  /**
   * Helper methods
   */
  private routeKey(start: { x: number; y: number }, end: { x: number; y: number }): string {
    return `${start.x},${start.y}_${end.x},${end.y}`;
  }

  private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}

