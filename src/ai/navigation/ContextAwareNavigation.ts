/**
 * Context-Aware Navigation Decision Framework
 * Understands the "why" behind navigation to make intelligent decisions
 */

import { Tile, GameState } from '../terrain/AITileEvaluator';
import { UrgencyLevel } from './RLNavigationAgent';

export enum NavigationPurpose {
  COMMUTE = 'commute',
  EXPLORATION = 'exploration',
  ESCAPE = 'escape',
  STEALTH = 'stealth',
  COMBAT = 'combat',
  RESOURCE_GATHERING = 'resource_gathering',
  SOCIAL = 'social',
  EMERGENCY = 'emergency',
  LEISURE = 'leisure'
}

export interface NavigationContext {
  purpose: NavigationPurpose;
  urgency: UrgencyLevel;
  socialConstraints: SocialConstraints;
  environmentalFactors: EnvironmentalFactors;
  historicalPatterns: HistoricalPattern;
  agentCapabilities: AgentCapabilities;
}

export interface SocialConstraints {
  avoidCrowds: boolean;
  preferPopulatedAreas: boolean;
  groupCoordination: boolean;
  socialNorms: string[];
}

export interface EnvironmentalFactors {
  weather: 'clear' | 'rain' | 'storm' | 'fog';
  timeOfDay: 'day' | 'night' | 'dawn' | 'dusk';
  visibility: number; // 0-1
  terrainDifficulty: number; // 0-1
}

export interface HistoricalPattern {
  frequentRoutes: Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    frequency: number;
    averageTime: number;
  }>;
  preferredPaths: Array<{
    path: Array<{ x: number; y: number }>;
    preferenceScore: number;
  }>;
  avoidedAreas: Array<{
    area: { center: { x: number; y: number }; radius: number };
    reason: string;
  }>;
}

export interface AgentCapabilities {
  movementSpeed: number;
  canSwim: boolean;
  canClimb: boolean;
  canFly: boolean;
  transportOptions: TransportMode[];
  energyCapacity: number;
  stealthAbility: number; // 0-1
}

export enum TransportMode {
  WALKING = 'walking',
  RUNNING = 'running',
  VEHICLE = 'vehicle',
  FLYING = 'flying',
  FAST_TRAVEL = 'fast_travel'
}

export interface NavigationStrategy {
  priority: 'efficiency' | 'safety' | 'speed' | 'discovery' | 'concealment';
  riskTolerance: number; // 0-1
  pathStyle: 'direct' | 'scenic' | 'safe' | 'stealth';
  transportMode: TransportMode;
  allowDetours: boolean;
  socialBehavior: 'avoid' | 'neutral' | 'prefer';
}

export interface NavigationRequest {
  start: { x: number; y: number };
  destination: { x: number; y: number };
  purpose: NavigationPurpose;
  urgency: UrgencyLevel;
  agentId: string;
  constraints?: {
    maxTime?: number;
    maxDistance?: number;
    avoidAreas?: Array<{ center: { x: number; y: number }; radius: number }>;
    requireCover?: boolean;
    stealthRequired?: boolean;
  };
}

export interface NavigationPlan {
  waypoints: Array<{ x: number; y: number }>;
  strategy: NavigationStrategy;
  reasoning: string;
  estimatedTime: number;
  estimatedCost: number;
  riskAssessment: {
    overall: number; // 0-1
    factors: Array<{ factor: string; risk: number }>;
  };
}

export class ContextAwareNavigation {
  private purposeStrategyMap: Map<NavigationPurpose, NavigationStrategy>;
  private historicalPatterns: Map<string, HistoricalPattern>;

  constructor() {
    this.purposeStrategyMap = new Map();
    this.historicalPatterns = new Map();
    this.initializePurposeStrategies();
  }

  /**
   * Generate context-aware navigation plan
   */
  public generatePlan(
    request: NavigationRequest,
    context: NavigationContext,
    state: GameState
  ): NavigationPlan {
    // Analyze context
    const analyzedContext = this.analyzeNavigationContext(request, context, state);

    // Select strategy based on purpose and context
    const strategy = this.selectStrategy(analyzedContext);

    // Generate path based on strategy
    const waypoints = this.generatePathForStrategy(request, strategy, state, context);

    // Assess risks
    const riskAssessment = this.assessRisks(waypoints, strategy, state, context);

    // Calculate estimates
    const estimatedTime = this.estimateTime(waypoints, strategy, context);
    const estimatedCost = this.estimateCost(waypoints, strategy, context);

    const reasoning = this.generateReasoning(analyzedContext, strategy, riskAssessment);

    return {
      waypoints,
      strategy,
      reasoning,
      estimatedTime,
      estimatedCost,
      riskAssessment
    };
  }

  /**
   * Analyze navigation context
   */
  private analyzeNavigationContext(
    request: NavigationRequest,
    context: NavigationContext,
    state: GameState
  ): NavigationContext {
    // Infer purpose if not explicitly provided
    if (!context.purpose) {
      context.purpose = this.inferPurpose(request, state);
    }

    // Calculate urgency based on context
    if (!context.urgency) {
      context.urgency = this.calculateUrgency(request, context);
    }

    // Identify social factors
    context.socialConstraints = this.identifySocialFactors(request, state, context);

    // Assess environmental conditions
    context.environmentalFactors = this.assessEnvironmentalConditions(state, request);

    // Load historical patterns
    context.historicalPatterns = this.getHistoricalPatterns(request.agentId);

    return context;
  }

  /**
   * Infer navigation purpose from request
   */
  private inferPurpose(request: NavigationRequest, state: GameState): NavigationPurpose {
    // Check if destination has resources
    const destTile = state.map.getTile(request.destination.x, request.destination.y);
    if (destTile?.resource) {
      return NavigationPurpose.RESOURCE_GATHERING;
    }

    // Check if there are enemies nearby
    const nearbyEnemies = state.units.filter(u => {
      const dist = this.distance(u.position, request.destination);
      return dist < 10 && u.playerId !== request.agentId;
    });

    if (nearbyEnemies.length > 0) {
      if (request.constraints?.stealthRequired) {
        return NavigationPurpose.STEALTH;
      }
      return NavigationPurpose.COMBAT;
    }

    // Check if destination is far and unexplored
    const distance = this.distance(request.start, request.destination);
    if (distance > 50) {
      return NavigationPurpose.EXPLORATION;
    }

    // Default to commute
    return NavigationPurpose.COMMUTE;
  }

  /**
   * Calculate urgency level
   */
  private calculateUrgency(
    request: NavigationRequest,
    context: NavigationContext
  ): UrgencyLevel {
    if (request.purpose === NavigationPurpose.EMERGENCY ||
        request.purpose === NavigationPurpose.ESCAPE) {
      return UrgencyLevel.CRITICAL;
    }

    if (request.purpose === NavigationPurpose.COMBAT) {
      return UrgencyLevel.URGENT;
    }

    if (request.purpose === NavigationPurpose.LEISURE ||
        request.purpose === NavigationPurpose.EXPLORATION) {
      return UrgencyLevel.LEISURE;
    }

    if (request.constraints?.maxTime && request.constraints.maxTime < 30) {
      return UrgencyLevel.URGENT;
    }

    return UrgencyLevel.NORMAL;
  }

  /**
   * Identify social factors
   */
  private identifySocialFactors(
    request: NavigationRequest,
    state: GameState,
    context: NavigationContext
  ): SocialConstraints {
    // Count units in area
    const nearbyUnits = state.units.filter(u => {
      const dist = this.distance(u.position, request.destination);
      return dist < 20;
    });

    const crowdDensity = nearbyUnits.length / 100; // Normalize

    return {
      avoidCrowds: context.purpose === NavigationPurpose.STEALTH || crowdDensity > 0.5,
      preferPopulatedAreas: context.purpose === NavigationPurpose.SOCIAL,
      groupCoordination: false, // Would check if agent is part of group
      socialNorms: []
    };
  }

  /**
   * Assess environmental conditions
   */
  private assessEnvironmentalConditions(
    state: GameState,
    request: NavigationRequest
  ): EnvironmentalFactors {
    // Sample tiles along path to assess terrain
    const samplePoints = this.samplePath(request.start, request.destination, 5);
    let totalDifficulty = 0;
    let visibilitySum = 0;

    for (const point of samplePoints) {
      const tile = state.map.getTile(point.x, point.y);
      if (tile) {
        totalDifficulty += 1 - (tile.passability || 0.5);
        visibilitySum += tile.visibilityModifier || 1.0;
      }
    }

    const avgDifficulty = totalDifficulty / samplePoints.length;
    const avgVisibility = visibilitySum / samplePoints.length;

    return {
      weather: 'clear', // Would come from game state
      timeOfDay: 'day', // Would come from game state
      visibility: avgVisibility,
      terrainDifficulty: avgDifficulty
    };
  }

  /**
   * Select navigation strategy based on context
   */
  private selectStrategy(context: NavigationContext): NavigationStrategy {
    // Get base strategy for purpose
    const baseStrategy = this.purposeStrategyMap.get(context.purpose) || this.getDefaultStrategy();

    // Adapt based on urgency
    if (context.urgency === UrgencyLevel.CRITICAL) {
      baseStrategy.priority = 'speed';
      baseStrategy.riskTolerance = 0.9;
      baseStrategy.pathStyle = 'direct';
      baseStrategy.transportMode = this.selectFastestTransport(context.agentCapabilities);
    } else if (context.urgency === UrgencyLevel.LEISURE) {
      baseStrategy.priority = 'discovery';
      baseStrategy.riskTolerance = 0.3;
      baseStrategy.pathStyle = 'scenic';
      baseStrategy.allowDetours = true;
    }

    // Adapt based on environmental factors
    if (context.environmentalFactors.visibility < 0.3) {
      baseStrategy.pathStyle = 'safe';
    }

    // Adapt based on social constraints
    if (context.socialConstraints.avoidCrowds) {
      baseStrategy.socialBehavior = 'avoid';
    } else if (context.socialConstraints.preferPopulatedAreas) {
      baseStrategy.socialBehavior = 'prefer';
    }

    return baseStrategy;
  }

  /**
   * Generate path based on strategy
   */
  private generatePathForStrategy(
    request: NavigationRequest,
    strategy: NavigationStrategy,
    state: GameState,
    context: NavigationContext
  ): Array<{ x: number; y: number }> {
    // This would integrate with HierarchicalPathfinding
    // For now, return simplified path
    const waypoints: Array<{ x: number; y: number }> = [request.start];

    // Check historical patterns for preferred routes
    const historical = context.historicalPatterns;
    if (historical.preferredPaths.length > 0) {
      const similarRoute = historical.preferredPaths.find(p => {
        const startDist = this.distance(p.path[0], request.start);
        const endDist = this.distance(p.path[p.path.length - 1], request.destination);
        return startDist < 5 && endDist < 5;
      });

      if (similarRoute && strategy.allowDetours) {
        return similarRoute.path;
      }
    }

    // Generate path based on strategy
    if (strategy.pathStyle === 'direct') {
      return this.generateDirectPath(request.start, request.destination);
    } else if (strategy.pathStyle === 'scenic') {
      return this.generateScenicPath(request.start, request.destination, state);
    } else if (strategy.pathStyle === 'safe') {
      return this.generateSafePath(request.start, request.destination, state);
    } else if (strategy.pathStyle === 'stealth') {
      return this.generateStealthPath(request.start, request.destination, state);
    }

    return this.generateDirectPath(request.start, request.destination);
  }

  /**
   * Assess risks along path
   */
  private assessRisks(
    waypoints: Array<{ x: number; y: number }>,
    strategy: NavigationStrategy,
    state: GameState,
    context: NavigationContext
  ): NavigationPlan['riskAssessment'] {
    const factors: Array<{ factor: string; risk: number }> = [];
    let totalRisk = 0;

    // Terrain risk
    let terrainRisk = 0;
    for (const waypoint of waypoints) {
      const tile = state.map.getTile(waypoint.x, waypoint.y);
      if (tile) {
        terrainRisk += 1 - (tile.passability || 0.5);
      }
    }
    terrainRisk = terrainRisk / waypoints.length;
    factors.push({ factor: 'terrain_difficulty', risk: terrainRisk });
    totalRisk += terrainRisk * 0.3;

    // Enemy presence risk
    let enemyRisk = 0;
    for (const waypoint of waypoints) {
      const nearbyEnemies = state.units.filter(u => {
        const dist = this.distance(u.position, waypoint);
        return dist < 10 && u.playerId !== context.agentCapabilities.transportOptions[0] as any;
      });
      if (nearbyEnemies.length > 0) {
        enemyRisk += 0.5;
      }
    }
    enemyRisk = Math.min(1, enemyRisk / waypoints.length);
    factors.push({ factor: 'enemy_presence', risk: enemyRisk });
    totalRisk += enemyRisk * 0.4;

    // Environmental risk
    const envRisk = context.environmentalFactors.terrainDifficulty * 0.2 +
                    (1 - context.environmentalFactors.visibility) * 0.1;
    factors.push({ factor: 'environmental', risk: envRisk });
    totalRisk += envRisk * 0.3;

    return {
      overall: Math.min(1, totalRisk),
      factors
    };
  }

  /**
   * Helper methods
   */
  private initializePurposeStrategies(): void {
    this.purposeStrategyMap.set(NavigationPurpose.COMMUTE, {
      priority: 'efficiency',
      riskTolerance: 0.1,
      pathStyle: 'direct',
      transportMode: TransportMode.WALKING,
      allowDetours: false,
      socialBehavior: 'neutral'
    });

    this.purposeStrategyMap.set(NavigationPurpose.EXPLORATION, {
      priority: 'discovery',
      riskTolerance: 0.8,
      pathStyle: 'scenic',
      transportMode: TransportMode.WALKING,
      allowDetours: true,
      socialBehavior: 'neutral'
    });

    this.purposeStrategyMap.set(NavigationPurpose.ESCAPE, {
      priority: 'speed',
      riskTolerance: 0.9,
      pathStyle: 'direct',
      transportMode: TransportMode.RUNNING,
      allowDetours: false,
      socialBehavior: 'avoid'
    });

    this.purposeStrategyMap.set(NavigationPurpose.STEALTH, {
      priority: 'concealment',
      riskTolerance: 0.3,
      pathStyle: 'stealth',
      transportMode: TransportMode.WALKING,
      allowDetours: true,
      socialBehavior: 'avoid'
    });

    this.purposeStrategyMap.set(NavigationPurpose.COMBAT, {
      priority: 'speed',
      riskTolerance: 0.7,
      pathStyle: 'direct',
      transportMode: TransportMode.RUNNING,
      allowDetours: false,
      socialBehavior: 'neutral'
    });
  }

  private getDefaultStrategy(): NavigationStrategy {
    return {
      priority: 'efficiency',
      riskTolerance: 0.5,
      pathStyle: 'direct',
      transportMode: TransportMode.WALKING,
      allowDetours: false,
      socialBehavior: 'neutral'
    };
  }

  private selectFastestTransport(capabilities: AgentCapabilities): TransportMode {
    if (capabilities.canFly && capabilities.transportOptions.includes(TransportMode.FLYING)) {
      return TransportMode.FLYING;
    }
    if (capabilities.transportOptions.includes(TransportMode.VEHICLE)) {
      return TransportMode.VEHICLE;
    }
    if (capabilities.transportOptions.includes(TransportMode.FAST_TRAVEL)) {
      return TransportMode.FAST_TRAVEL;
    }
    return TransportMode.RUNNING;
  }

  private generateDirectPath(start: { x: number; y: number }, end: { x: number; y: number }): Array<{ x: number; y: number }> {
    return [start, end];
  }

  private generateScenicPath(start: { x: number; y: number }, end: { x: number; y: number }, state: GameState): Array<{ x: number; y: number }> {
    // Would find path through interesting terrain
    return [start, end];
  }

  private generateSafePath(start: { x: number; y: number }, end: { x: number; y: number }, state: GameState): Array<{ x: number; y: number }> {
    // Would find path avoiding dangers
    return [start, end];
  }

  private generateStealthPath(start: { x: number; y: number }, end: { x: number; y: number }, state: GameState): Array<{ x: number; y: number }> {
    // Would find path with maximum concealment
    return [start, end];
  }

  private samplePath(start: { x: number; y: number }, end: { x: number; y: number }, count: number): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      });
    }
    return points;
  }

  private estimateTime(waypoints: Array<{ x: number; y: number }>, strategy: NavigationStrategy, context: NavigationContext): number {
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistance += this.distance(waypoints[i], waypoints[i + 1]);
    }

    const speed = this.getTransportSpeed(strategy.transportMode, context.agentCapabilities);
    return totalDistance / speed;
  }

  private estimateCost(waypoints: Array<{ x: number; y: number }>, strategy: NavigationStrategy, context: NavigationContext): number {
    // Cost based on distance and transport mode
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistance += this.distance(waypoints[i], waypoints[i + 1]);
    }

    const costPerUnit = this.getTransportCost(strategy.transportMode);
    return totalDistance * costPerUnit;
  }

  private getTransportSpeed(mode: TransportMode, capabilities: AgentCapabilities): number {
    switch (mode) {
      case TransportMode.FLYING:
        return 10;
      case TransportMode.VEHICLE:
        return 8;
      case TransportMode.RUNNING:
        return 5;
      case TransportMode.FAST_TRAVEL:
        return 100; // Instant
      default:
        return 3;
    }
  }

  private getTransportCost(mode: TransportMode): number {
    switch (mode) {
      case TransportMode.FLYING:
        return 2.0;
      case TransportMode.VEHICLE:
        return 1.5;
      case TransportMode.FAST_TRAVEL:
        return 5.0;
      default:
        return 1.0;
    }
  }

  private generateReasoning(
    context: NavigationContext,
    strategy: NavigationStrategy,
    riskAssessment: NavigationPlan['riskAssessment']
  ): string {
    const reasons: string[] = [];

    reasons.push(`Purpose: ${context.purpose}`);
    reasons.push(`Strategy: ${strategy.priority} priority, ${strategy.pathStyle} path`);
    reasons.push(`Transport: ${strategy.transportMode}`);
    reasons.push(`Risk: ${(riskAssessment.overall * 100).toFixed(0)}%`);

    return reasons.join('; ');
  }

  private getHistoricalPatterns(agentId: string): HistoricalPattern {
    return this.historicalPatterns.get(agentId) || {
      frequentRoutes: [],
      preferredPaths: [],
      avoidedAreas: []
    };
  }

  private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}

