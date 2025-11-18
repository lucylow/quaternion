/**
 * AI Strategy Learner - Learning and adaptation systems
 * Records player strategies and develops counter-strategies
 */

import { SeededRandom } from '../../lib/SeededRandom';

export interface PlayerAction {
  type: string;
  timestamp: number;
  gameState: any;
  success: number; // 0-1
}

export interface PlayerProfile {
  preferredOpenings: string[];
  commonResponses: Map<string, string[]>; // situation -> responses
  weaknessesDetected: string[];
  strategyPatterns: Map<string, number>; // pattern -> frequency
}

export interface CounterStrategy {
  strategy: string;
  effectiveness: number; // 0-1
  conditions: string[];
  lastUsed: number;
}

export class AIStrategyLearner {
  private strategyMemory: Map<string, PlayerAction[]>;
  private counterStrategies: Map<string, CounterStrategy[]>;
  private playerProfile: PlayerProfile;
  private rng: SeededRandom;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
    this.strategyMemory = new Map();
    this.counterStrategies = new Map();
    this.playerProfile = {
      preferredOpenings: [],
      commonResponses: new Map(),
      weaknessesDetected: [],
      strategyPatterns: new Map()
    };
  }

  /**
   * Record player action
   */
  public recordPlayerAction(gameState: any, playerAction: any): void {
    // Convert game state to feature vector/signature
    const stateSignature = this.hashGameState(gameState);

    if (!this.strategyMemory.has(stateSignature)) {
      this.strategyMemory.set(stateSignature, []);
    }

    const success = this.evaluateSuccess(playerAction, gameState);
    const action: PlayerAction = {
      type: playerAction.type || 'unknown',
      timestamp: Date.now(),
      gameState,
      success
    };

    this.strategyMemory.get(stateSignature)!.push(action);

    // Update player profile
    this.updatePlayerProfile(stateSignature, playerAction);
  }

  /**
   * Predict player move based on current state
   */
  public predictPlayerMove(currentState: any): string | null {
    const stateSignature = this.hashGameState(currentState);
    const similarStates = this.findSimilarStates(currentState);

    if (similarStates.length === 0) {
      return null;
    }

    // Get most common player response in similar situations
    const responseCounts = new Map<string, number>();
    similarStates.forEach(stateSig => {
      const actions = this.strategyMemory.get(stateSig) || [];
      actions.forEach(action => {
        const count = responseCounts.get(action.type) || 0;
        responseCounts.set(action.type, count + 1);
      });
    });

    let maxCount = 0;
    let mostLikely: string | null = null;
    responseCounts.forEach((count, actionType) => {
      if (count > maxCount) {
        maxCount = count;
        mostLikely = actionType;
      }
    });

    return mostLikely;
  }

  /**
   * Develop counter strategy for player strategy
   */
  public developCounterStrategy(playerStrategy: string, personalityTraits: any): CounterStrategy | null {
    // Check if we already have a counter strategy
    const existingCounters = this.counterStrategies.get(playerStrategy) || [];
    if (existingCounters.length > 0) {
      // Return most effective counter
      const bestCounter = existingCounters.reduce((best, current) =>
        current.effectiveness > best.effectiveness ? current : best
      );
      return bestCounter;
    }

    // Analyze weaknesses in player's approach
    const weaknesses = this.analyzeStrategyWeaknesses(playerStrategy);

    // Generate counter strategy based on weaknesses and personality
    const counterStrategy = this.generateCounterStrategy(playerStrategy, weaknesses, personalityTraits);

    if (counterStrategy) {
      if (!this.counterStrategies.has(playerStrategy)) {
        this.counterStrategies.set(playerStrategy, []);
      }
      this.counterStrategies.get(playerStrategy)!.push(counterStrategy);
    }

    return counterStrategy;
  }

  /**
   * Evaluate strategy success
   */
  public evaluateStrategySuccess(strategyUsed: string, outcome: number): void {
    // Update counter strategy effectiveness
    this.counterStrategies.forEach((counters, playerStrategy) => {
      counters.forEach(counter => {
        if (counter.strategy === strategyUsed) {
          // Update effectiveness based on outcome
          counter.effectiveness = counter.effectiveness * 0.9 + outcome * 0.1;
          counter.lastUsed = Date.now();
        }
      });
    });
  }

  /**
   * Hash game state to signature
   */
  private hashGameState(gameState: any): string {
    // Simplified hash - would use more sophisticated state representation
    const resources = gameState.resources || {};
    const military = gameState.military || {};
    return `${Math.floor(resources.ore || 0) / 100}_${Math.floor(resources.energy || 0) / 100}_${military.units || 0}`;
  }

  /**
   * Find similar states
   */
  private findSimilarStates(currentState: any): string[] {
    const currentSig = this.hashGameState(currentState);
    const similar: string[] = [];

    // Find states with similar resource levels and military strength
    this.strategyMemory.forEach((actions, stateSig) => {
      if (this.statesSimilar(currentSig, stateSig)) {
        similar.push(stateSig);
      }
    });

    return similar;
  }

  /**
   * Check if two state signatures are similar
   */
  private statesSimilar(sig1: string, sig2: string): boolean {
    // Simplified similarity - would use more sophisticated comparison
    const parts1 = sig1.split('_');
    const parts2 = sig2.split('_');
    
    if (parts1.length !== parts2.length) return false;

    for (let i = 0; i < parts1.length; i++) {
      const diff = Math.abs(parseFloat(parts1[i]) - parseFloat(parts2[i]));
      if (diff > 2) return false; // Threshold for similarity
    }

    return true;
  }

  /**
   * Evaluate success of player action
   */
  private evaluateSuccess(playerAction: any, gameState: any): number {
    // Simplified - would analyze actual game outcome
    // For now, return random value as placeholder
    return this.rng.nextFloat(0.3, 0.9);
  }

  /**
   * Update player profile
   */
  private updatePlayerProfile(stateSignature: string, playerAction: any): void {
    // Track preferred openings (early game actions)
    if (stateSignature.includes('0_0') || stateSignature.includes('1_1')) {
      if (!this.playerProfile.preferredOpenings.includes(playerAction.type)) {
        this.playerProfile.preferredOpenings.push(playerAction.type);
      }
    }

    // Track common responses
    if (!this.playerProfile.commonResponses.has(stateSignature)) {
      this.playerProfile.commonResponses.set(stateSignature, []);
    }
    const responses = this.playerProfile.commonResponses.get(stateSignature)!;
    if (!responses.includes(playerAction.type)) {
      responses.push(playerAction.type);
    }

    // Track strategy patterns
    const patternCount = this.playerProfile.strategyPatterns.get(playerAction.type) || 0;
    this.playerProfile.strategyPatterns.set(playerAction.type, patternCount + 1);
  }

  /**
   * Analyze strategy weaknesses
   */
  private analyzeStrategyWeaknesses(playerStrategy: string): string[] {
    const weaknesses: string[] = [];

    // Strategy-specific weaknesses
    if (playerStrategy === 'turtle_defense') {
      weaknesses.push('slow_expansion', 'weak_early_game', 'vulnerable_to_tech');
    } else if (playerStrategy === 'rush') {
      weaknesses.push('weak_economy', 'vulnerable_to_defense', 'poor_late_game');
    } else if (playerStrategy === 'tech_focus') {
      weaknesses.push('weak_military', 'vulnerable_to_early_aggression', 'slow_start');
    } else if (playerStrategy === 'economic_boom') {
      weaknesses.push('weak_defense', 'vulnerable_to_harassment', 'slow_military');
    }

    return weaknesses;
  }

  /**
   * Generate counter strategy
   */
  private generateCounterStrategy(
    playerStrategy: string,
    weaknesses: string[],
    personalityTraits: any
  ): CounterStrategy | null {
    // Generate counter based on weaknesses and personality
    let counterStrategy = 'balanced';

    if (weaknesses.includes('slow_expansion') && personalityTraits.aggression > 0.6) {
      counterStrategy = 'aggressive_expansion';
    } else if (weaknesses.includes('weak_economy') && personalityTraits.caution > 0.6) {
      counterStrategy = 'defensive_economic';
    } else if (weaknesses.includes('weak_military') && personalityTraits.aggression > 0.5) {
      counterStrategy = 'military_pressure';
    } else if (weaknesses.includes('vulnerable_to_early_aggression') && personalityTraits.aggression > 0.7) {
      counterStrategy = 'early_rush';
    }

    return {
      strategy: counterStrategy,
      effectiveness: 0.5, // Initial effectiveness
      conditions: weaknesses,
      lastUsed: 0
    };
  }

  /**
   * Get player profile
   */
  public getPlayerProfile(): PlayerProfile {
    return { ...this.playerProfile };
  }
}

