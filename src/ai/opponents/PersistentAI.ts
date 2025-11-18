/**
 * Persistent AI - Cross-session learning
 * AI that learns and adapts across multiple game sessions
 */

import { SeededRandom } from '../../lib/SeededRandom';

export interface EncounterData {
  timestamp: number;
  playerStrategy: string;
  aiStrategy: string;
  outcome: 'win' | 'loss' | 'draw';
  duration: number;
  keyDecisionPoints: Array<{
    time: number;
    decision: string;
    result: string;
  }>;
}

export interface PlayerTendency {
  preferredOpenings: string[];
  commonResponses: Map<string, string[]>;
  weaknessesDetected: string[];
  adaptationSpeed: number; // 0-1
}

export class PersistentAI {
  private playerId: string;
  private crossSessionMemory: Map<string, EncounterData[]>;
  private playerTendencies: Map<string, PlayerTendency>;
  private rng: SeededRandom;
  private adaptationHistory: Array<{
    timestamp: number;
    playerId: string;
    adaptation: string;
    reason: string;
  }>;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
    this.crossSessionMemory = new Map();
    this.playerTendencies = new Map();
    this.adaptationHistory = [];
  }

  /**
   * Load player history
   */
  public loadPlayerHistory(playerId: string): PlayerTendency | null {
    this.playerId = playerId;
    const history = this.crossSessionMemory.get(playerId) || [];

    if (history.length === 0) {
      return null;
    }

    // Analyze patterns
    const tendency = this.analyzePlayerPatterns(history);
    this.playerTendencies.set(playerId, tendency);

    // Adapt starting strategy based on historical success
    const mostEffectiveStrategies = this.analyzeHistoricalSuccess(history);
    
    return tendency;
  }

  /**
   * Update cross-session learning
   */
  public updateCrossSessionLearning(
    playerId: string,
    gameOutcome: 'win' | 'loss' | 'draw',
    strategyUsed: string,
    gameDuration: number,
    keyDecisions: Array<{ time: number; decision: string; result: string }>
  ): void {
    const playerStrategy = this.detectPlayerStrategy(); // Would detect from game state

    const encounterData: EncounterData = {
      timestamp: Date.now(),
      playerStrategy,
      aiStrategy: strategyUsed,
      outcome: gameOutcome,
      duration: gameDuration,
      keyDecisionPoints: keyDecisions
    };

    // Record encounter
    if (!this.crossSessionMemory.has(playerId)) {
      this.crossSessionMemory.set(playerId, []);
    }
    this.crossSessionMemory.get(playerId)!.push(encounterData);

    // Update long-term adaptation
    this.updateLongTermAdaptation(playerId, encounterData);
  }

  /**
   * Get initial strategy for player
   */
  public getInitialStrategy(playerId: string): string {
    const history = this.crossSessionMemory.get(playerId);
    
    if (!history || history.length === 0) {
      // New player - use default cautious approach
      return 'balanced_opening';
    }

    // Use most effective initial strategies from history
    const mostEffectiveStrategies = this.analyzeHistoricalSuccess(history);
    if (mostEffectiveStrategies.length > 0) {
      return this.rng.choice(mostEffectiveStrategies);
    }

    return 'balanced_opening';
  }

  /**
   * Analyze player patterns
   */
  private analyzePlayerPatterns(history: EncounterData[]): PlayerTendency {
    const preferredOpenings: string[] = [];
    const commonResponses = new Map<string, string[]>();
    const weaknessesDetected: string[] = [];
    const strategyFrequencies = new Map<string, number>();

    // Analyze opening strategies
    history.forEach(encounter => {
      if (encounter.duration < 300) { // Early game
        if (!preferredOpenings.includes(encounter.playerStrategy)) {
          preferredOpenings.push(encounter.playerStrategy);
        }
      }

      // Track strategy frequencies
      const count = strategyFrequencies.get(encounter.playerStrategy) || 0;
      strategyFrequencies.set(encounter.playerStrategy, count + 1);

      // Track common responses
      encounter.keyDecisionPoints.forEach(decision => {
        const situation = decision.decision;
        if (!commonResponses.has(situation)) {
          commonResponses.set(situation, []);
        }
        const responses = commonResponses.get(situation)!;
        if (!responses.includes(decision.result)) {
          responses.push(decision.result);
        }
      });
    });

    // Detect weaknesses
    history.forEach(encounter => {
      if (encounter.outcome === 'win') {
        // AI won - player had weaknesses
        if (encounter.playerStrategy === 'rush' && !weaknessesDetected.includes('weak_economy')) {
          weaknessesDetected.push('weak_economy');
        }
        if (encounter.playerStrategy === 'turtle' && !weaknessesDetected.includes('slow_expansion')) {
          weaknessesDetected.push('slow_expansion');
        }
      }
    });

    // Calculate adaptation speed (how quickly player adapts)
    const adaptationSpeed = this.calculateAdaptationSpeed(history);

    return {
      preferredOpenings,
      commonResponses,
      weaknessesDetected,
      adaptationSpeed
    };
  }

  /**
   * Calculate adaptation speed
   */
  private calculateAdaptationSpeed(history: EncounterData[]): number {
    if (history.length < 2) return 0.5;

    // Check how quickly player changes strategies after losses
    let adaptationCount = 0;
    let totalLosses = 0;

    for (let i = 1; i < history.length; i++) {
      if (history[i - 1].outcome === 'loss') {
        totalLosses++;
        if (history[i].playerStrategy !== history[i - 1].playerStrategy) {
          adaptationCount++;
        }
      }
    }

    return totalLosses > 0 ? adaptationCount / totalLosses : 0.5;
  }

  /**
   * Analyze historical success
   */
  private analyzeHistoricalSuccess(history: EncounterData[]): string[] {
    const strategySuccess = new Map<string, { wins: number; total: number }>();

    history.forEach(encounter => {
      const current = strategySuccess.get(encounter.aiStrategy) || { wins: 0, total: 0 };
      current.total++;
      if (encounter.outcome === 'win') {
        current.wins++;
      }
      strategySuccess.set(encounter.aiStrategy, current);
    });

    // Get strategies with > 60% win rate
    const effectiveStrategies: string[] = [];
    strategySuccess.forEach((stats, strategy) => {
      const winRate = stats.wins / stats.total;
      if (winRate > 0.6 && stats.total >= 2) {
        effectiveStrategies.push(strategy);
      }
    });

    return effectiveStrategies;
  }

  /**
   * Update long-term adaptation
   */
  private updateLongTermAdaptation(playerId: string, encounterData: EncounterData): void {
    const tendency = this.playerTendencies.get(playerId);
    if (!tendency) return;

    // Update tendencies based on new encounter
    if (encounterData.duration < 300 && !tendency.preferredOpenings.includes(encounterData.playerStrategy)) {
      tendency.preferredOpenings.push(encounterData.playerStrategy);
    }

    // Record adaptation
    this.adaptationHistory.push({
      timestamp: Date.now(),
      playerId,
      adaptation: `Learned from ${encounterData.outcome} against ${encounterData.playerStrategy}`,
      reason: `Strategy: ${encounterData.aiStrategy}`
    });
  }

  /**
   * Detect player strategy (simplified)
   */
  private detectPlayerStrategy(): string {
    // Would analyze actual game state
    return 'balanced';
  }

  /**
   * Get player tendency
   */
  public getPlayerTendency(playerId: string): PlayerTendency | null {
    return this.playerTendencies.get(playerId) || null;
  }

  /**
   * Get adaptation history
   */
  public getAdaptationHistory(): typeof this.adaptationHistory {
    return [...this.adaptationHistory];
  }
}

