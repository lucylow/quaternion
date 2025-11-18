/**
 * Open-World Navigation & Interaction Manager
 * Integrates all navigation systems for intelligent open-world AI
 */

import { HierarchicalPathfinding } from './HierarchicalPathfinding';
import { RLNavigationAgent } from './RLNavigationAgent';
import { ContextAwareNavigation, NavigationRequest, NavigationPlan } from './ContextAwareNavigation';
import { HumanNavigationClustering } from './HumanNavigationClustering';
import { MultiModalTransport } from './MultiModalTransport';
import { DynamicWorldAdaptation, WorldChange } from './DynamicWorldAdaptation';
import { ChunkManager } from '../../map/ChunkManager';
import { Tile, GameState } from '../terrain/AITileEvaluator';
import { UrgencyLevel } from './RLNavigationAgent';

export interface NavigationConfig {
  useHierarchicalPathfinding: boolean;
  useReinforcementLearning: boolean;
  useContextAwareness: boolean;
  useHumanClustering: boolean;
  useMultiModalTransport: boolean;
  useDynamicAdaptation: boolean;
  chunkSize?: number;
}

export interface NavigationResult {
  path: Array<{ x: number; y: number }>;
  strategy: string;
  reasoning: string;
  estimatedTime: number;
  estimatedCost: number;
  confidence: number;
  alternatives?: Array<{
    path: Array<{ x: number; y: number }>;
    reasoning: string;
  }>;
}

export class OpenWorldNavigationManager {
  private hierarchicalPathfinding: HierarchicalPathfinding | null = null;
  private rlAgents: Map<string, RLNavigationAgent>;
  private contextAwareNavigation: ContextAwareNavigation;
  private humanClustering: HumanNavigationClustering;
  private multiModalTransport: MultiModalTransport;
  private dynamicAdaptation: DynamicWorldAdaptation;
  private config: NavigationConfig;

  constructor(
    chunkManager: ChunkManager,
    config: Partial<NavigationConfig> = {}
  ) {
    this.config = {
      useHierarchicalPathfinding: true,
      useReinforcementLearning: true,
      useContextAwareness: true,
      useHumanClustering: true,
      useMultiModalTransport: true,
      useDynamicAdaptation: true,
      chunkSize: 32,
      ...config
    };

    // Initialize systems
    if (this.config.useHierarchicalPathfinding) {
      this.hierarchicalPathfinding = new HierarchicalPathfinding(
        chunkManager,
        this.config.chunkSize
      );
    }

    this.rlAgents = new Map();
    this.contextAwareNavigation = new ContextAwareNavigation();
    this.humanClustering = new HumanNavigationClustering();
    this.multiModalTransport = new MultiModalTransport();
    this.dynamicAdaptation = new DynamicWorldAdaptation();
  }

  /**
   * Main navigation method - finds intelligent path
   */
  public navigate(
    request: NavigationRequest,
    state: GameState,
    agentId: string
  ): NavigationResult | null {
    // Step 1: Check for dynamic world changes
    if (this.config.useDynamicAdaptation) {
      const blockingCheck = this.dynamicAdaptation.isRouteBlocked(
        request.start,
        request.destination,
        [request.start, request.destination]
      );

      if (blockingCheck.blocked) {
        // Find alternative route
        const alternative = this.dynamicAdaptation.findAlternativeRoute(
          request.start,
          request.destination,
          blockingCheck.blockingChanges,
          state
        );

        if (alternative) {
          return {
            path: alternative,
            strategy: 'dynamic_adaptation',
            reasoning: `Route blocked by ${blockingCheck.blockingChanges.length} world change(s), using alternative route`,
            estimatedTime: this.estimateTime(alternative),
            estimatedCost: 0,
            confidence: 0.8
          };
        }
      }
    }

    // Step 2: Get or create RL agent
    let rlAgent: RLNavigationAgent | null = null;
    if (this.config.useReinforcementLearning) {
      if (!this.rlAgents.has(agentId)) {
        this.rlAgents.set(agentId, new RLNavigationAgent(agentId));
      }
      rlAgent = this.rlAgents.get(agentId)!;

      // Check for learned route
      const learnedRoute = rlAgent.getLearnedRoute(
        request.start,
        request.destination
      );
      if (learnedRoute && !rlAgent.hasRecentFailure(request.start, request.destination)) {
        return {
          path: learnedRoute,
          strategy: 'learned_route',
          reasoning: 'Using route learned from previous experience',
          estimatedTime: this.estimateTime(learnedRoute),
          estimatedCost: 0,
          confidence: 0.9
        };
      }
    }

    // Step 3: Generate context-aware plan
    let plan: NavigationPlan | null = null;
    if (this.config.useContextAwareness) {
      const context = this.buildNavigationContext(request, state, agentId);
      plan = this.contextAwareNavigation.generatePlan(request, context, state);
    }

    // Step 4: Use hierarchical pathfinding if enabled
    let path: Array<{ x: number; y: number }> | null = null;
    if (this.config.useHierarchicalPathfinding && this.hierarchicalPathfinding) {
      path = this.hierarchicalPathfinding.findPath(
        request.start,
        request.destination,
        state,
        {
          avoidThreats: request.constraints?.requireCover || false,
          preferCover: request.constraints?.requireCover || false,
          urgency: this.urgencyToString(request.urgency)
        }
      )?.waypoints || null;
    }

    // Step 5: Apply RL agent decision if available
    if (rlAgent && path) {
      const stateVector = this.buildNavigationState(
        request.start,
        request.destination,
        path,
        state,
        request.urgency
      );

      const availableActions = [
        'FOLLOW_PATH',
        'FIND_ALTERNATE_ROUTE',
        'WAIT_FOR_CLEARANCE'
      ] as any;

      const action = rlAgent.selectAction(stateVector, availableActions);

      if (action === 'FIND_ALTERNATE_ROUTE') {
        // Agent wants to find alternate route
        // Would generate alternative here
      }
    }

    // Step 6: Select transport mode if multi-modal enabled
    if (this.config.useMultiModalTransport && plan) {
      const transportOptions = this.multiModalTransport.getAvailableOptions({
        canSwim: false,
        canClimb: false,
        canFly: false,
        hasVehicle: false,
        hasFastTravelAccess: false,
        energy: 100
      });

      const transportDecision = this.multiModalTransport.chooseTransportation(
        {
          distance: this.distance(request.start, request.destination),
          urgency: request.urgency,
          cost: 0,
          availability: true,
          skill: 0.7,
          weather: 'clear',
          social: false,
          terrain: {
            difficulty: 0.3,
            type: 'plains',
            hasRoads: false,
            hasWater: false
          }
        },
        transportOptions
      );

      plan.strategy.transportMode = transportDecision.selectedMode;
    }

    // Use plan path or fallback to direct path
    const finalPath = plan?.waypoints || path || [request.start, request.destination];

    return {
      path: finalPath,
      strategy: plan?.strategy.priority || 'direct',
      reasoning: plan?.reasoning || 'Direct path',
      estimatedTime: plan?.estimatedTime || this.estimateTime(finalPath),
      estimatedCost: plan?.estimatedCost || 0,
      confidence: plan ? 0.8 : 0.5
    };
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
    if (!this.config.useReinforcementLearning) return;

    const rlAgent = this.rlAgents.get(agentId);
    if (!rlAgent) return;

    const stateVector = this.buildNavigationState(start, end, path, null as any, UrgencyLevel.NORMAL);
    const nextStateVector = { ...stateVector, position: end };

    // Calculate reward
    const reward = rlAgent.calculateReward(
      stateVector,
      'FOLLOW_PATH' as any,
      outcome
    );

    // Learn from experience
    rlAgent.learn({
      state: stateVector,
      action: 'FOLLOW_PATH' as any,
      reward,
      nextState: nextStateVector,
      timestamp: Date.now()
    });
  }

  /**
   * Record player navigation for clustering
   */
  public recordPlayerNavigation(
    playerId: string,
    path: {
      waypoints: Array<{ x: number; y: number; timestamp: number }>;
      start: { x: number; y: number };
      end: { x: number; y: number };
      purpose: string;
      duration: number;
      detours: number;
      backtracking: number;
      transportMode: string;
    }
  ): void {
    if (!this.config.useHumanClustering) return;

    this.humanClustering.recordPath(playerId, path);
  }

  /**
   * Register world change
   */
  public registerWorldChange(change: WorldChange): void {
    if (!this.config.useDynamicAdaptation) return;

    this.dynamicAdaptation.registerWorldChange(change);

    // Update hierarchical pathfinding
    if (this.hierarchicalPathfinding) {
      this.hierarchicalPathfinding.registerDynamicObstacle(
        change.position,
        change.type !== 'temporary_blockage'
      );
    }
  }

  /**
   * Build navigation context
   */
  private buildNavigationContext(
    request: NavigationRequest,
    state: GameState,
    agentId: string
  ): any {
    return {
      purpose: request.purpose,
      urgency: request.urgency,
      socialConstraints: {
        avoidCrowds: request.constraints?.stealthRequired || false,
        preferPopulatedAreas: false,
        groupCoordination: false,
        socialNorms: []
      },
      environmentalFactors: {
        weather: 'clear',
        timeOfDay: 'day',
        visibility: 1.0,
        terrainDifficulty: 0.3
      },
      historicalPatterns: {
        frequentRoutes: [],
        preferredPaths: [],
        avoidedAreas: []
      },
      agentCapabilities: {
        movementSpeed: 3,
        canSwim: false,
        canClimb: false,
        canFly: false,
        transportOptions: ['walking', 'running'] as any,
        energyCapacity: 100,
        stealthAbility: 0.5
      }
    };
  }

  /**
   * Build navigation state for RL agent
   */
  private buildNavigationState(
    position: { x: number; y: number },
    destination: { x: number; y: number },
    path: Array<{ x: number; y: number }>,
    state: GameState | null,
    urgency: UrgencyLevel
  ): any {
    return {
      position,
      destination,
      pathStatus: path.length > 0 ? 'valid' : 'unknown',
      nearbyObstacles: [],
      urgencyLevel: urgency,
      energy: 100,
      memory: {
        successfulRoutes: [],
        failedRoutes: [],
        obstacleEncounters: []
      },
      terrainType: 'plains',
      distanceToDestination: this.distance(position, destination),
      lastActionSuccess: true
    };
  }

  /**
   * Helper methods
   */
  private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  private estimateTime(path: Array<{ x: number; y: number }>): number {
    let distance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      distance += this.distance(path[i], path[i + 1]);
    }
    return distance / 3; // Assume walking speed of 3 units/sec
  }

  private urgencyToString(urgency: UrgencyLevel): 'low' | 'medium' | 'high' | 'critical' {
    switch (urgency) {
      case UrgencyLevel.CRITICAL:
        return 'critical';
      case UrgencyLevel.URGENT:
        return 'high';
      case UrgencyLevel.NORMAL:
        return 'medium';
      case UrgencyLevel.LEISURE:
        return 'low';
    }
  }

  /**
   * Get system statistics
   */
  public getStats(): {
    rlAgents: number;
    learnedRoutes: number;
    worldChanges: number;
    clusterStyles: number;
  } {
    let totalLearnedRoutes = 0;
    for (const agent of this.rlAgents.values()) {
      totalLearnedRoutes += agent.getMemory().successfulRoutes.length;
    }

    return {
      rlAgents: this.rlAgents.size,
      learnedRoutes: totalLearnedRoutes,
      worldChanges: 0, // Would get from dynamicAdaptation
      clusterStyles: this.humanClustering.getClusterStats().length
    };
  }
}

