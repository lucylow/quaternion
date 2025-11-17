/**
 * Dynamic Adaptation System
 * Adapts AI behavior based on game events, opponent patterns, and strategy effectiveness
 */

import { AIPersonality, TerrainAIAgent } from './TerrainAIPersonality';
import { GameState } from './AITileEvaluator';

export enum GameEventType {
  DYNAMIC_TILE_ACTIVATION = 'dynamic_tile_activation',
  CHOKEPOINT_CAPTURED = 'chokepoint_captured',
  RESEARCH_COMPLETED = 'research_completed',
  RESOURCE_DEPLETION = 'resource_depletion',
  UNIT_DESTROYED = 'unit_destroyed',
  BASE_ATTACKED = 'base_attacked',
  EXPANSION_COMPLETED = 'expansion_completed'
}

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  affectedTile?: { x: number; y: number };
  affectedUnit?: string;
  affectedPlayer?: string;
  metadata?: any;
}

export interface StrategyEffectiveness {
  expansion: number;    // 0-1
  defense: number;       // 0-1
  aggression: number;   // 0-1
  tech: number;         // 0-1
}

export interface OpponentPattern {
  movementPatterns: Array<{ x: number; y: number; timestamp: number }>;
  resourceFocus: string;
  preferredTactics: string[];
  personality?: AIPersonality;
}

export interface AIAction {
  type: 'capture_position' | 'expand_resources' | 'rush_dynamic' | 
        'attack_resources' | 'research_tech' | 'capture_synergy' | 
        'defend' | 'scout' | 'build';
  targetTile?: { x: number; y: number };
  techType?: string;
  priority: number;
  reasoning: string;
}

export class AIAdaptationManager {
  private strategyEffectiveness: StrategyEffectiveness;
  private recentEvents: GameEvent[] = [];
  private opponentPatterns: OpponentPattern;
  private maxEvents: number = 100;

  constructor() {
    this.strategyEffectiveness = {
      expansion: 0.5,
      defense: 0.5,
      aggression: 0.5,
      tech: 0.5
    };

    this.opponentPatterns = {
      movementPatterns: [],
      resourceFocus: 'unknown',
      preferredTactics: []
    };
  }

  /**
   * Analyze game state and adapt strategy
   */
  analyzeGameState(
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): void {
    this.updateStrategyEffectiveness(state, playerId);
    this.adaptToOpponentPatterns(state, agent, playerId);
    this.reactToCriticalEvents(state, agent, playerId);
  }

  /**
   * Record a game event
   */
  recordEvent(event: GameEvent): void {
    this.recentEvents.push(event);
    
    // Keep only recent events
    if (this.recentEvents.length > this.maxEvents) {
      this.recentEvents.shift();
    }
  }

  /**
   * Update strategy effectiveness based on outcomes
   */
  private updateStrategyEffectiveness(
    state: GameState,
    playerId: string
  ): void {
    // Calculate success rates for different strategies
    const expansionSuccess = this.calculateExpansionSuccessRate(state, playerId);
    const defenseSuccess = this.calculateDefenseSuccessRate(state, playerId);
    const aggressionSuccess = this.calculateAggressionSuccessRate(state, playerId);
    const techSuccess = this.calculateTechSuccessRate(state, playerId);

    // Update with moving average
    const learningRate = 0.1;
    this.strategyEffectiveness.expansion = 
      this.strategyEffectiveness.expansion * (1 - learningRate) + expansionSuccess * learningRate;
    this.strategyEffectiveness.defense = 
      this.strategyEffectiveness.defense * (1 - learningRate) + defenseSuccess * learningRate;
    this.strategyEffectiveness.aggression = 
      this.strategyEffectiveness.aggression * (1 - learningRate) + aggressionSuccess * learningRate;
    this.strategyEffectiveness.tech = 
      this.strategyEffectiveness.tech * (1 - learningRate) + techSuccess * learningRate;
  }

  /**
   * Adapt to opponent patterns
   */
  private adaptToOpponentPatterns(
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): void {
    const opponentPersonality = this.inferOpponentPersonality(state, playerId);
    const movementPatterns = this.analyzeOpponentMovement(state, playerId);
    const resourceFocus = this.analyzeOpponentEconomy(state, playerId);

    this.opponentPatterns.personality = opponentPersonality;
    this.opponentPatterns.movementPatterns = movementPatterns;
    this.opponentPatterns.resourceFocus = resourceFocus;

    // Counter opponent's preferred tactics
    if (opponentPersonality === AIPersonality.RECKLESS_STORM_CHASER) {
      this.setupDynamicTileCounterAmbushes(state, agent, playerId);
    }

    if (movementPatterns.length > 5) {
      const predictedMove = this.predictNextOpponentMove(movementPatterns);
      this.prepareCounterForPosition(predictedMove, state, agent, playerId);
    }
  }

  /**
   * React to critical game events
   */
  private reactToCriticalEvents(
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): void {
    for (const event of this.recentEvents) {
      switch (event.type) {
        case GameEventType.DYNAMIC_TILE_ACTIVATION:
          this.reactToDynamicTileActivation(event, state, agent, playerId);
          break;
        case GameEventType.CHOKEPOINT_CAPTURED:
          this.reactToChokepointChange(event, state, agent, playerId);
          break;
        case GameEventType.RESEARCH_COMPLETED:
          this.reactToTechAdvancement(event, state, agent, playerId);
          break;
        case GameEventType.RESOURCE_DEPLETION:
          this.reactToResourceChange(event, state, agent, playerId);
          break;
        case GameEventType.BASE_ATTACKED:
          this.reactToBaseAttack(event, state, agent, playerId);
          break;
      }
    }

    // Clear processed events
    this.recentEvents = [];
  }

  /**
   * React to dynamic tile activation
   */
  private reactToDynamicTileActivation(
    event: GameEvent,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): void {
    if (agent.personality === AIPersonality.RECKLESS_STORM_CHASER) {
      // Rush to capitalize on activation
      if (event.affectedTile) {
        agent.recentDecisions.push({
          action: 'rush_dynamic',
          reasoning: 'Immediate response to dynamic tile activation',
          timestamp: Date.now()
        });
      }
    } else if (agent.personality === AIPersonality.CAUTIOUS_GEOLOGIST) {
      // Withdraw units from danger area
      if (event.affectedTile) {
        agent.recentDecisions.push({
          action: 'withdraw',
          reasoning: 'Withdrawing from dangerous dynamic tile area',
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * React to chokepoint change
   */
  private reactToChokepointChange(
    event: GameEvent,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): void {
    if (agent.personality === AIPersonality.CAUTIOUS_GEOLOGIST) {
      // Prioritize recapturing lost chokepoints
      if (event.affectedTile) {
        agent.recentDecisions.push({
          action: 'recapture_chokepoint',
          reasoning: 'Critical chokepoint lost, must recapture',
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * React to tech advancement
   */
  private reactToTechAdvancement(
    event: GameEvent,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): void {
    if (agent.personality === AIPersonality.METHODICAL_ENGINEER) {
      // Accelerate tech research
      agent.recentDecisions.push({
        action: 'accelerate_research',
        reasoning: 'Tech advancement detected, accelerating research',
        timestamp: Date.now()
      });
    }
  }

  /**
   * React to resource change
   */
  private reactToResourceChange(
    event: GameEvent,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): void {
    // Adjust expansion strategy
    agent.recentDecisions.push({
      action: 'adjust_expansion',
      reasoning: 'Resource depletion detected, adjusting expansion strategy',
      timestamp: Date.now()
    });
  }

  /**
   * React to base attack
   */
  private reactToBaseAttack(
    event: GameEvent,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): void {
    // Prioritize defense
    agent.recentDecisions.push({
      action: 'emergency_defense',
      reasoning: 'Base under attack, prioritizing defense',
      timestamp: Date.now(),
      outcome: 1.0 // High priority
    });
  }

  /**
   * Calculate expansion success rate
   */
  private calculateExpansionSuccessRate(
    state: GameState,
    playerId: string
  ): number {
    // Simplified calculation
    const expansionEvents = this.recentEvents.filter(
      e => e.type === GameEventType.EXPANSION_COMPLETED
    );
    return expansionEvents.length > 0 ? 0.7 : 0.5;
  }

  /**
   * Calculate defense success rate
   */
  private calculateDefenseSuccessRate(
    state: GameState,
    playerId: string
  ): number {
    const defenseEvents = this.recentEvents.filter(
      e => e.type === GameEventType.BASE_ATTACKED
    );
    // If base was attacked but not destroyed, defense was successful
    return defenseEvents.length > 0 ? 0.6 : 0.5;
  }

  /**
   * Calculate aggression success rate
   */
  private calculateAggressionSuccessRate(
    state: GameState,
    playerId: string
  ): number {
    const unitDestroyed = this.recentEvents.filter(
      e => e.type === GameEventType.UNIT_DESTROYED && e.affectedPlayer !== playerId
    );
    return unitDestroyed.length > 0 ? 0.8 : 0.5;
  }

  /**
   * Calculate tech success rate
   */
  private calculateTechSuccessRate(
    state: GameState,
    playerId: string
  ): number {
    const techEvents = this.recentEvents.filter(
      e => e.type === GameEventType.RESEARCH_COMPLETED && e.affectedPlayer === playerId
    );
    return techEvents.length > 0 ? 0.7 : 0.5;
  }

  /**
   * Infer opponent personality
   */
  private inferOpponentPersonality(
    state: GameState,
    playerId: string
  ): AIPersonality | undefined {
    // Analyze opponent behavior patterns
    const opponentUnits = state.units.filter(u => u.playerId !== playerId);
    const aggressiveActions = this.recentEvents.filter(
      e => e.type === GameEventType.BASE_ATTACKED || e.type === GameEventType.UNIT_DESTROYED
    );

    if (aggressiveActions.length > 5) {
      return AIPersonality.RECKLESS_STORM_CHASER;
    }

    // More sophisticated inference would analyze more patterns
    return undefined;
  }

  /**
   * Analyze opponent movement patterns
   */
  private analyzeOpponentMovement(
    state: GameState,
    playerId: string
  ): Array<{ x: number; y: number; timestamp: number }> {
    const opponentUnits = state.units.filter(u => u.playerId !== playerId);
    return opponentUnits.map(u => ({
      x: u.position.x,
      y: u.position.y,
      timestamp: state.tick
    }));
  }

  /**
   * Analyze opponent economy
   */
  private analyzeOpponentEconomy(
    state: GameState,
    playerId: string
  ): string {
    // Simplified analysis
    return 'balanced';
  }

  /**
   * Setup counter-ambushes for dynamic tiles
   */
  private setupDynamicTileCounterAmbushes(
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): void {
    // Implementation would set up ambush positions near dynamic tiles
    agent.recentDecisions.push({
      action: 'setup_ambush',
      reasoning: 'Setting up counter-ambush for aggressive opponent',
      timestamp: Date.now()
    });
  }

  /**
   * Predict next opponent move
   */
  private predictNextOpponentMove(
    movementPatterns: Array<{ x: number; y: number; timestamp: number }>
  ): { x: number; y: number } | null {
    if (movementPatterns.length < 2) {
      return null;
    }

    // Simple linear prediction
    const recent = movementPatterns.slice(-3);
    if (recent.length < 2) {
      return null;
    }

    const last = recent[recent.length - 1];
    const prev = recent[recent.length - 2];

    const dx = last.x - prev.x;
    const dy = last.y - prev.y;

    return {
      x: last.x + dx,
      y: last.y + dy
    };
  }

  /**
   * Prepare counter for predicted position
   */
  private prepareCounterForPosition(
    position: { x: number; y: number } | null,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): void {
    if (!position) return;

    agent.recentDecisions.push({
      action: 'prepare_counter',
      reasoning: `Preparing counter for predicted enemy position at (${position.x}, ${position.y})`,
      timestamp: Date.now()
    });
  }

  /**
   * Get strategy effectiveness
   */
  getStrategyEffectiveness(): StrategyEffectiveness {
    return { ...this.strategyEffectiveness };
  }

  /**
   * Get opponent patterns
   */
  getOpponentPatterns(): OpponentPattern {
    return { ...this.opponentPatterns };
  }

  /**
   * Generate counter-action based on opponent personality
   */
  generateCounterAction(
    opponentPersonality: AIPersonality | undefined,
    agent: TerrainAIAgent,
    state: GameState,
    playerId: string
  ): AIAction | null {
    if (!opponentPersonality) {
      return null;
    }

    switch (opponentPersonality) {
      case AIPersonality.CAUTIOUS_GEOLOGIST:
        // Attack their predictable resource nodes
        return {
          type: 'attack_resources',
          priority: 0.8,
          reasoning: 'Striking predictable resource nodes of cautious opponent'
        };

      case AIPersonality.RECKLESS_STORM_CHASER:
        // Set ambushes at dynamic tiles they'll target
        return {
          type: 'capture_position',
          priority: 0.9,
          reasoning: 'Setting ambush for aggressive opponent at dynamic tile'
        };

      case AIPersonality.METHODICAL_ENGINEER:
        // Disrupt their tech progression
        return {
          type: 'attack_resources',
          priority: 0.7,
          reasoning: 'Disrupting tech-focused opponent by attacking resources'
        };

      default:
        return null;
    }
  }
}

