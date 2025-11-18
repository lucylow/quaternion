/**
 * Terrain-Aware AI Evaluation System
 * Provides tile evaluation, flank planning, dynamic adaptation, and ambush heuristics
 */

import { TerrainSystem, Tile, DynamicAnomaly } from './TerrainSystem';

export interface TileEvaluation {
  tile: Tile;
  score: number;
  reasons: string[];
}

export interface FlankRoute {
  waypoints: Array<{ x: number; y: number }>;
  risk: number; // 0-1
  time: number; // estimated travel time
  strategicValue: number;
}

export interface AmbushHeuristic {
  route: FlankRoute;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedUnits: string[];
  alternativeRoute?: FlankRoute;
}

export class TerrainAwareAI {
  private terrainSystem: TerrainSystem;
  private visionWeight: number = 0.3;
  private defenseWeight: number = 0.4;
  private resourceWeight: number = 0.5;
  private pathPenalty: number = 0.2;

  constructor(terrainSystem: TerrainSystem) {
    this.terrainSystem = terrainSystem;
  }

  /**
   * Evaluate tile for AI decision making
   */
  public evaluateTile(
    tile: Tile,
    gameState: any,
    fromX?: number,
    fromY?: number
  ): TileEvaluation {
    let score = 0;
    const reasons: string[] = [];
    
    // Resource value
    if (tile.resourceType) {
      const resourceValue = this.getResourceValue(tile.resourceType, gameState);
      score += resourceValue * this.resourceWeight;
      reasons.push(`Resource: ${tile.resourceType} (+${Math.floor(resourceValue * this.resourceWeight)})`);
    }
    
    // Elevation bonus (high ground)
    if (tile.elevation > 30) {
      const elevationBonus = tile.elevation * 0.3;
      score += elevationBonus;
      reasons.push(`High ground: +${Math.floor(elevationBonus)}`);
    }
    
    // Defense bonus
    if (tile.defenseBonus > 0) {
      const defenseBonus = tile.defenseBonus * 30 * this.defenseWeight;
      score += defenseBonus;
      reasons.push(`Defense: +${Math.floor(defenseBonus)}`);
    }
    
    // Vision bonus
    if (tile.visibilityModifier > 0) {
      const visionBonus = tile.visibilityModifier * 20 * this.visionWeight;
      score += visionBonus;
      reasons.push(`Vision: +${Math.floor(visionBonus)}`);
    }
    
    // Strategic feature value
    if (tile.feature === 'objective') {
      score += 100;
      reasons.push('Objective: +100');
    } else if (tile.feature === 'chokepoint') {
      score += 60;
      reasons.push('Chokepoint: +60');
    } else if (tile.feature === 'high_ground') {
      score += 40;
      reasons.push('High ground feature: +40');
    } else if (tile.feature === 'bridge') {
      score += 50;
      reasons.push('Bridge: +50');
    }
    
    // Dynamic anomaly bonus (if active)
    const activeAnomalies = this.terrainSystem.getActiveAnomalies();
    for (const anomaly of activeAnomalies) {
      const dist = Math.sqrt(
        Math.pow(tile.x - anomaly.x, 2) + Math.pow(tile.y - anomaly.y, 2)
      );
      if (dist <= anomaly.radius) {
        if (anomaly.effect.resource_multiplier) {
          const anomalyBonus = 30 * anomaly.effect.resource_multiplier;
          score += anomalyBonus;
          reasons.push(`Active anomaly bonus: +${Math.floor(anomalyBonus)}`);
        }
      }
    }
    
    // Path cost penalty (if from position provided)
    if (fromX !== undefined && fromY !== undefined) {
      const pathCost = this.terrainSystem.getMovementCost(fromX, fromY, tile.x, tile.y);
      const penalty = pathCost * this.pathPenalty;
      score -= penalty;
      if (penalty > 0) {
        reasons.push(`Path cost: -${Math.floor(penalty)}`);
      }
    }
    
    return { tile, score, reasons };
  }

  /**
   * Get resource value based on game state needs
   */
  private getResourceValue(resourceType: string, gameState: any): number {
    // Simplified: assume all resources are equally valuable
    // In a real implementation, this would check current resource levels
    return 50;
  }

  /**
   * Plan flank routes to target
   */
  public planFlankRoutes(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    avoidChokepoints: boolean = false
  ): FlankRoute[] {
    const routes: FlankRoute[] = [];
    
    // Direct route
    const directRoute = this.calculateRoute(fromX, fromY, toX, toY, avoidChokepoints);
    routes.push(directRoute);
    
    // Flank route 1: North
    const northRoute = this.calculateFlankRoute(
      fromX, fromY, toX, toY,
      { x: (fromX + toX) / 2, y: Math.min(fromY, toY) - 100 },
      avoidChokepoints
    );
    if (northRoute) routes.push(northRoute);
    
    // Flank route 2: South
    const southRoute = this.calculateFlankRoute(
      fromX, fromY, toX, toY,
      { x: (fromX + toX) / 2, y: Math.max(fromY, toY) + 100 },
      avoidChokepoints
    );
    if (southRoute) routes.push(southRoute);
    
    // Flank route 3: East
    const eastRoute = this.calculateFlankRoute(
      fromX, fromY, toX, toY,
      { x: Math.max(fromX, toX) + 100, y: (fromY + toY) / 2 },
      avoidChokepoints
    );
    if (eastRoute) routes.push(eastRoute);
    
    // Flank route 4: West
    const westRoute = this.calculateFlankRoute(
      fromX, fromY, toX, toY,
      { x: Math.min(fromX, toX) - 100, y: (fromY + toY) / 2 },
      avoidChokepoints
    );
    if (westRoute) routes.push(westRoute);
    
    // Sort by strategic value (highest first)
    routes.sort((a, b) => b.strategicValue - a.strategicValue);
    
    return routes;
  }

  /**
   * Calculate route between two points
   */
  private calculateRoute(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    avoidChokepoints: boolean
  ): FlankRoute {
    const waypoints = [{ x: fromX, y: fromY }, { x: toX, y: toY }];
    let risk = 0;
    let time = 0;
    let strategicValue = 0;
    
    // Calculate path cost
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Sample points along path to assess risk
    const samples = 10;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = fromX + dx * t;
      const y = fromY + dy * t;
      
      const tile = this.terrainSystem.getTile(Math.floor(x), Math.floor(y));
      if (tile) {
        // Risk from chokepoints
        if (tile.feature === 'chokepoint' && avoidChokepoints) {
          risk += 0.2;
        }
        
        // Risk from low visibility
        if (tile.visibilityModifier < -0.5) {
          risk += 0.1; // Ambush potential
        }
        
        // Movement cost
        time += this.terrainSystem.getMovementCost(
          Math.floor(x), Math.floor(y),
          Math.floor(x + dx / samples), Math.floor(y + dy / samples)
        );
        
        // Strategic value along path
        strategicValue += tile.strategicValue * 0.1;
      }
    }
    
    risk = Math.min(1, risk);
    
    return { waypoints, risk, time, strategicValue };
  }

  /**
   * Calculate flank route through waypoint
   */
  private calculateFlankRoute(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    waypoint: { x: number; y: number },
    avoidChokepoints: boolean
  ): FlankRoute | null {
    const route1 = this.calculateRoute(fromX, fromY, waypoint.x, waypoint.y, avoidChokepoints);
    const route2 = this.calculateRoute(waypoint.x, waypoint.y, toX, toY, avoidChokepoints);
    
    return {
      waypoints: [
        { x: fromX, y: fromY },
        { x: waypoint.x, y: waypoint.y },
        { x: toX, y: toY }
      ],
      risk: (route1.risk + route2.risk) / 2,
      time: route1.time + route2.time,
      strategicValue: (route1.strategicValue + route2.strategicValue) / 2
    };
  }

  /**
   * Evaluate route for ambush risk
   */
  public evaluateAmbushRisk(route: FlankRoute): AmbushHeuristic {
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const recommendedUnits: string[] = [];
    
    if (route.risk > 0.7) {
      riskLevel = 'high';
      recommendedUnits.push('scout', 'skirmisher');
    } else if (route.risk > 0.4) {
      riskLevel = 'medium';
      recommendedUnits.push('scout', 'soldier');
    } else {
      riskLevel = 'low';
      recommendedUnits.push('soldier', 'heavy');
    }
    
    // Find alternative route if risk is high
    let alternativeRoute: FlankRoute | undefined;
    if (riskLevel === 'high' && route.waypoints.length >= 2) {
      const [start, end] = [route.waypoints[0], route.waypoints[route.waypoints.length - 1]];
      const alternatives = this.planFlankRoutes(
        start.x, start.y, end.x, end.y, true
      );
      if (alternatives.length > 1) {
        alternativeRoute = alternatives[1]; // Second best route
      }
    }
    
    return {
      route,
      riskLevel,
      recommendedUnits,
      alternativeRoute
    };
  }

  /**
   * Decide whether to contest or bypass dynamic tile
   */
  public shouldContestDynamicTile(
    anomaly: DynamicAnomaly,
    gameTime: number,
    currentResources: any
  ): {
    shouldContest: boolean;
    reason: string;
    urgency: 'low' | 'medium' | 'high';
  } {
    if (!anomaly.active) {
      return {
        shouldContest: false,
        reason: 'Anomaly is not active',
        urgency: 'low'
      };
    }
    
    // Calculate time remaining
    const timeRemaining = anomaly.endTime 
      ? Math.max(0, anomaly.endTime - gameTime)
      : Infinity;
    
    // Evaluate reward
    let rewardValue = 0;
    if (anomaly.effect.resource_multiplier) {
      rewardValue = 50 * anomaly.effect.resource_multiplier;
    }
    
    // Evaluate risk
    let riskValue = 0;
    if (anomaly.effect.damage_per_second) {
      riskValue = anomaly.effect.damage_per_second * (timeRemaining || 90);
    }
    
    // Calculate net value
    const netValue = rewardValue - riskValue;
    
    // Decision logic
    if (netValue > 30 && timeRemaining > 30) {
      return {
        shouldContest: true,
        reason: `High reward (${Math.floor(rewardValue)}) with manageable risk`,
        urgency: timeRemaining < 60 ? 'high' : 'medium'
      };
    } else if (netValue > 0 && timeRemaining > 15) {
      return {
        shouldContest: true,
        reason: `Positive net value, ${Math.floor(timeRemaining)}s remaining`,
        urgency: 'medium'
      };
    } else {
      return {
        shouldContest: false,
        reason: `Risk (${Math.floor(riskValue)}) exceeds reward (${Math.floor(rewardValue)})`,
        urgency: 'low'
      };
    }
  }

  /**
   * Get best tiles to control (for AI expansion)
   */
  public getBestTilesToControl(
    currentPosition: { x: number; y: number },
    count: number = 5,
    gameState: any
  ): TileEvaluation[] {
    const allTiles = this.terrainSystem.getAllTiles();
    const evaluations = allTiles
      .map(tile => this.evaluateTile(tile, gameState, currentPosition.x, currentPosition.y))
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
    
    return evaluations;
  }
}


