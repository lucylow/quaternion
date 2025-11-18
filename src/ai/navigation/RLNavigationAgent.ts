/**
 * Reinforcement Learning Navigation Agent
 * Learns optimal navigation strategies through experience
 */

import { Tile, GameState } from '../terrain/AITileEvaluator';

export interface NavigationState {
  position: { x: number; y: number };
  destination: { x: number; y: number };
  pathStatus: 'valid' | 'blocked' | 'partial' | 'unknown';
  nearbyObstacles: DynamicObstacle[];
  urgencyLevel: UrgencyLevel;
  energy: number;
  memory: NavigationMemory;
  terrainType: string;
  distanceToDestination: number;
  lastActionSuccess: boolean;
}

export interface DynamicObstacle {
  position: { x: number; y: number };
  type: 'static' | 'temporary' | 'moving';
  estimatedDuration?: number;
  severity: number; // 0-1
}

export enum UrgencyLevel {
  LEISURE = 'leisure',
  NORMAL = 'normal',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export interface NavigationMemory {
  successfulRoutes: Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    path: Array<{ x: number; y: number }>;
    cost: number;
    timestamp: number;
  }>;
  failedRoutes: Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    failureReason: string;
    timestamp: number;
  }>;
  obstacleEncounters: Array<{
    obstacle: DynamicObstacle;
    resolution: 'waited' | 'rerouted' | 'forced_through';
    outcome: 'success' | 'failure';
    timestamp: number;
  }>;
}

export enum NavigationAction {
  FOLLOW_PATH = 'follow_path',
  FIND_ALTERNATE_ROUTE = 'find_alternate_route',
  WAIT_FOR_CLEARANCE = 'wait_for_clearance',
  USE_TRANSPORT = 'use_transport',
  REQUEST_HELP = 'request_help',
  ABANDON_GOAL = 'abandon_goal',
  EXPLORE_AREA = 'explore_area'
}

export interface QLearningState {
  qTable: Map<string, Map<NavigationAction, number>>;
  learningRate: number;
  discountFactor: number;
  explorationRate: number;
  minExplorationRate: number;
  explorationDecay: number;
}

export interface NavigationExperience {
  state: NavigationState;
  action: NavigationAction;
  reward: number;
  nextState: NavigationState;
  timestamp: number;
}

export class RLNavigationAgent {
  private qLearning: QLearningState;
  private experiences: NavigationExperience[] = [];
  private maxExperiences: number = 1000;
  private agentId: string;
  private memory: NavigationMemory;

  constructor(agentId: string, config: {
    learningRate?: number;
    discountFactor?: number;
    initialExplorationRate?: number;
  } = {}) {
    this.agentId = agentId;
    this.qLearning = {
      qTable: new Map(),
      learningRate: config.learningRate || 0.1,
      discountFactor: config.discountFactor || 0.95,
      explorationRate: config.initialExplorationRate || 0.3,
      minExplorationRate: 0.01,
      explorationDecay: 0.995
    };
    this.memory = {
      successfulRoutes: [],
      failedRoutes: [],
      obstacleEncounters: []
    };
  }

  /**
   * Select action using epsilon-greedy policy
   */
  public selectAction(state: NavigationState, availableActions: NavigationAction[]): NavigationAction {
    // Exploration vs exploitation
    if (Math.random() < this.qLearning.explorationRate) {
      // Explore: random action
      return availableActions[Math.floor(Math.random() * availableActions.length)];
    }

    // Exploit: best known action
    return this.getBestAction(state, availableActions);
  }

  /**
   * Get best action for state
   */
  private getBestAction(state: NavigationState, availableActions: NavigationAction[]): NavigationAction {
    const stateKey = this.stateToKey(state);
    const qValues = this.qLearning.qTable.get(stateKey);

    if (!qValues || qValues.size === 0) {
      // No experience, return default action
      return NavigationAction.FOLLOW_PATH;
    }

    let bestAction = availableActions[0];
    let bestQ = qValues.get(bestAction) || -Infinity;

    for (const action of availableActions) {
      const qValue = qValues.get(action) || 0;
      if (qValue > bestQ) {
        bestQ = qValue;
        bestAction = action;
      }
    }

    return bestAction;
  }

  /**
   * Update Q-value based on experience
   */
  public learn(experience: NavigationExperience): void {
    const stateKey = this.stateToKey(experience.state);
    const nextStateKey = this.stateToKey(experience.nextState);

    // Initialize Q-table entries if needed
    if (!this.qLearning.qTable.has(stateKey)) {
      this.qLearning.qTable.set(stateKey, new Map());
    }
    if (!this.qLearning.qTable.has(nextStateKey)) {
      this.qLearning.qTable.set(nextStateKey, new Map());
    }

    const qValues = this.qLearning.qTable.get(stateKey)!;
    const nextQValues = this.qLearning.qTable.get(nextStateKey)!;

    // Current Q-value
    const currentQ = qValues.get(experience.action) || 0;

    // Max Q-value for next state
    const maxNextQ = Math.max(
      ...Array.from(nextQValues.values()),
      ...Object.values(NavigationAction).map(a => nextQValues.get(a as NavigationAction) || 0)
    );

    // Q-learning update: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
    const newQ = currentQ + this.qLearning.learningRate * (
      experience.reward + this.qLearning.discountFactor * maxNextQ - currentQ
    );

    qValues.set(experience.action, newQ);

    // Store experience
    this.experiences.push(experience);
    if (this.experiences.length > this.maxExperiences) {
      this.experiences.shift();
    }

    // Decay exploration rate
    this.qLearning.explorationRate = Math.max(
      this.qLearning.minExplorationRate,
      this.qLearning.explorationRate * this.qLearning.explorationDecay
    );

    // Update memory based on outcome
    this.updateMemory(experience);
  }

  /**
   * Calculate reward for navigation action
   */
  public calculateReward(
    state: NavigationState,
    action: NavigationAction,
    outcome: {
      reachedDestination: boolean;
      timeTaken: number;
      energyUsed: number;
      obstaclesEncountered: number;
      pathEfficiency: number;
    }
  ): number {
    let reward = 0;

    // Progress reward
    if (outcome.reachedDestination) {
      reward += 100; // Large reward for success
    } else {
      // Partial reward based on progress
      const progress = 1 - (state.distanceToDestination / this.estimateMaxDistance(state));
      reward += progress * 50;
    }

    // Efficiency reward
    reward += outcome.pathEfficiency * 20;

    // Time penalty
    reward -= outcome.timeTaken * 0.1;

    // Energy penalty
    reward -= outcome.energyUsed * 0.05;

    // Obstacle penalty
    reward -= outcome.obstaclesEncountered * 10;

    // Urgency modifier
    const urgencyMultiplier = this.getUrgencyMultiplier(state.urgencyLevel);
    reward *= urgencyMultiplier;

    // Safety bonus (if action avoided danger)
    if (action === NavigationAction.FIND_ALTERNATE_ROUTE && state.nearbyObstacles.length > 0) {
      reward += 5;
    }

    return reward;
  }

  /**
   * Update navigation memory
   */
  private updateMemory(experience: NavigationExperience): void {
    const outcome = this.inferOutcome(experience);

    if (outcome.reachedDestination) {
      this.memory.successfulRoutes.push({
        start: experience.state.position,
        end: experience.nextState.position,
        path: this.reconstructPath(experience),
        cost: experience.reward,
        timestamp: experience.timestamp
      });

      // Keep only recent successful routes
      if (this.memory.successfulRoutes.length > 50) {
        this.memory.successfulRoutes.shift();
      }
    } else {
      this.memory.failedRoutes.push({
        start: experience.state.position,
        end: experience.nextState.position,
        failureReason: this.inferFailureReason(experience),
        timestamp: experience.timestamp
      });

      // Keep only recent failures
      if (this.memory.failedRoutes.length > 50) {
        this.memory.failedRoutes.shift();
      }
    }

    // Track obstacle encounters
    if (experience.state.nearbyObstacles.length > 0) {
      for (const obstacle of experience.state.nearbyObstacles) {
        this.memory.obstacleEncounters.push({
          obstacle,
          resolution: this.inferResolution(experience.action),
          outcome: outcome.reachedDestination ? 'success' : 'failure',
          timestamp: experience.timestamp
        });
      }

      if (this.memory.obstacleEncounters.length > 100) {
        this.memory.obstacleEncounters.shift();
      }
    }
  }

  /**
   * Get learned route from memory
   */
  public getLearnedRoute(
    start: { x: number; y: number },
    end: { x: number; y: number },
    maxAge: number = 10000
  ): Array<{ x: number; y: number }> | null {
    const now = Date.now();
    const threshold = 0.3; // 30% distance threshold

    for (const route of this.memory.successfulRoutes) {
      if (now - route.timestamp > maxAge) continue;

      const startDist = this.distance(start, route.start);
      const endDist = this.distance(end, route.end);

      if (startDist < threshold && endDist < threshold) {
        return route.path;
      }
    }

    return null;
  }

  /**
   * Check if route failed recently
   */
  public hasRecentFailure(
    start: { x: number; y: number },
    end: { x: number; y: number },
    maxAge: number = 5000
  ): boolean {
    const now = Date.now();
    const threshold = 0.3;

    for (const failure of this.memory.failedRoutes) {
      if (now - failure.timestamp > maxAge) continue;

      const startDist = this.distance(start, failure.start);
      const endDist = this.distance(end, failure.end);

      if (startDist < threshold && endDist < threshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get obstacle handling strategy from memory
   */
  public getObstacleStrategy(obstacle: DynamicObstacle): NavigationAction | null {
    // Find similar obstacles in memory
    const similar = this.memory.obstacleEncounters.filter(e => {
      return e.obstacle.type === obstacle.type &&
             this.distance(e.obstacle.position, obstacle.position) < 5;
    });

    if (similar.length === 0) return null;

    // Find most successful resolution
    const successful = similar.filter(e => e.outcome === 'success');
    if (successful.length === 0) return null;

    // Return most common successful resolution
    const resolutions = successful.map(e => e.resolution);
    const counts = new Map<string, number>();
    for (const res of resolutions) {
      counts.set(res, (counts.get(res) || 0) + 1);
    }

    const bestResolution = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    // Map resolution to action
    switch (bestResolution) {
      case 'waited':
        return NavigationAction.WAIT_FOR_CLEARANCE;
      case 'rerouted':
        return NavigationAction.FIND_ALTERNATE_ROUTE;
      case 'forced_through':
        return NavigationAction.FOLLOW_PATH;
      default:
        return null;
    }
  }

  /**
   * Convert state to key for Q-table
   */
  private stateToKey(state: NavigationState): string {
    // Discretize state for Q-table
    const posX = Math.floor(state.position.x / 5) * 5;
    const posY = Math.floor(state.position.y / 5) * 5;
    const dist = Math.floor(state.distanceToDestination / 10) * 10;
    const obstacleCount = state.nearbyObstacles.length;
    const urgency = state.urgencyLevel;
    const pathStatus = state.pathStatus;

    return `${posX},${posY},${dist},${obstacleCount},${urgency},${pathStatus}`;
  }

  /**
   * Helper methods
   */
  private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  private estimateMaxDistance(state: NavigationState): number {
    return Math.max(100, state.distanceToDestination * 2);
  }

  private getUrgencyMultiplier(urgency: UrgencyLevel): number {
    switch (urgency) {
      case UrgencyLevel.CRITICAL:
        return 2.0;
      case UrgencyLevel.URGENT:
        return 1.5;
      case UrgencyLevel.NORMAL:
        return 1.0;
      case UrgencyLevel.LEISURE:
        return 0.8;
    }
  }

  private inferOutcome(experience: NavigationExperience): { reachedDestination: boolean } {
    const dist = this.distance(experience.nextState.position, experience.nextState.destination);
    return { reachedDestination: dist < 2.0 };
  }

  private inferFailureReason(experience: NavigationExperience): string {
    if (experience.nextState.pathStatus === 'blocked') {
      return 'path_blocked';
    }
    if (experience.nextState.nearbyObstacles.length > 0) {
      return 'obstacle_encountered';
    }
    return 'unknown';
  }

  private inferResolution(action: NavigationAction): 'waited' | 'rerouted' | 'forced_through' {
    switch (action) {
      case NavigationAction.WAIT_FOR_CLEARANCE:
        return 'waited';
      case NavigationAction.FIND_ALTERNATE_ROUTE:
        return 'rerouted';
      default:
        return 'forced_through';
    }
  }

  private reconstructPath(experience: NavigationExperience): Array<{ x: number; y: number }> {
    return [experience.state.position, experience.nextState.position];
  }

  /**
   * Get agent statistics
   */
  public getStats(): {
    explorationRate: number;
    learnedStates: number;
    successfulRoutes: number;
    failedRoutes: number;
    obstacleEncounters: number;
  } {
    return {
      explorationRate: this.qLearning.explorationRate,
      learnedStates: this.qLearning.qTable.size,
      successfulRoutes: this.memory.successfulRoutes.length,
      failedRoutes: this.memory.failedRoutes.length,
      obstacleEncounters: this.memory.obstacleEncounters.length
    };
  }

  /**
   * Get memory for external access
   */
  public getMemory(): NavigationMemory {
    return this.memory;
  }
}


