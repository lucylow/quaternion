/**
 * AI Personality Matrix - Dynamic personality system with memory and adaptation
 * Implements personality-driven decision making with learning capabilities
 */

import { SeededRandom } from '../../lib/SeededRandom';

export interface PersonalityTraits {
  aggression: number; // 0.1-0.9
  caution: number; // 0.1-0.9
  adaptability: number; // 0.1-0.9
  innovation: number; // 0.1-0.9
  ruthlessness: number; // 0.1-0.9
  predictability: number; // 0.1-0.9
}

export interface StrategyMemory {
  strategy: string;
  frequency: number;
  successRate: number;
  lastUsed: number;
  counterStrategies: string[];
}

export class AIPersonalityMatrix {
  private traits: PersonalityTraits;
  private memory: Map<string, StrategyMemory>;
  private learningRate: number;
  private rng: SeededRandom;
  private adaptationHistory: Array<{
    timestamp: number;
    trait: keyof PersonalityTraits;
    oldValue: number;
    newValue: number;
    reason: string;
  }>;

  constructor(seed: number, initialTraits?: Partial<PersonalityTraits>) {
    this.rng = new SeededRandom(seed);
    this.memory = new Map();
    this.learningRate = 0.1;
    this.adaptationHistory = [];

    // Initialize traits with random values or provided values
    this.traits = {
      aggression: initialTraits?.aggression ?? this.rng.nextFloat(0.1, 0.9),
      caution: initialTraits?.caution ?? this.rng.nextFloat(0.1, 0.9),
      adaptability: initialTraits?.adaptability ?? this.rng.nextFloat(0.1, 0.9),
      innovation: initialTraits?.innovation ?? this.rng.nextFloat(0.1, 0.9),
      ruthlessness: initialTraits?.ruthlessness ?? this.rng.nextFloat(0.1, 0.9),
      predictability: initialTraits?.predictability ?? this.rng.nextFloat(0.1, 0.9),
    };
  }

  /**
   * Adapt personality based on player strategy
   */
  public adaptToPlayer(playerStrategy: string, success: boolean): void {
    // Record strategy in memory
    if (!this.memory.has(playerStrategy)) {
      this.memory.set(playerStrategy, {
        strategy: playerStrategy,
        frequency: 0,
        successRate: 0,
        lastUsed: Date.now(),
        counterStrategies: []
      });
    }

    const memory = this.memory.get(playerStrategy)!;
    memory.frequency += 1;
    memory.lastUsed = Date.now();

    // Update success rate
    const totalEncounters = memory.frequency;
    memory.successRate = success
      ? (memory.successRate * (totalEncounters - 1) + 1) / totalEncounters
      : (memory.successRate * (totalEncounters - 1)) / totalEncounters;

    // Adapt traits based on what works against player
    if (playerStrategy === 'turtle_defense') {
      this.adjustTrait('aggression', this.learningRate * 0.5, 
        'Player uses turtle defense, increasing aggression');
      this.adjustTrait('innovation', this.learningRate * 0.3,
        'Need innovative strategies to break defenses');
    } else if (playerStrategy === 'rush') {
      this.adjustTrait('caution', this.learningRate * 0.5,
        'Player rushes, increasing caution');
      this.adjustTrait('aggression', -this.learningRate * 0.3,
        'Defensive stance against rush');
    } else if (playerStrategy === 'tech_focus') {
      this.adjustTrait('innovation', this.learningRate * 0.4,
        'Player focuses tech, matching innovation');
      this.adjustTrait('aggression', this.learningRate * 0.2,
        'Early pressure against tech focus');
    }
  }

  /**
   * Adjust a trait value
   */
  private adjustTrait(
    trait: keyof PersonalityTraits,
    delta: number,
    reason: string
  ): void {
    const oldValue = this.traits[trait];
    const newValue = this.clamp(0.1, 0.9, oldValue + delta);
    
    if (Math.abs(newValue - oldValue) > 0.01) {
      this.traits[trait] = newValue;
      this.adaptationHistory.push({
        timestamp: Date.now(),
        trait,
        oldValue,
        newValue,
        reason
      });
    }
  }

  /**
   * Get counter strategy for player strategy
   */
  public getCounterStrategy(playerStrategy: string): string | null {
    const memory = this.memory.get(playerStrategy);
    if (!memory || memory.counterStrategies.length === 0) {
      return null;
    }

    // Return most successful counter strategy
    return this.rng.choice(memory.counterStrategies);
  }

  /**
   * Record successful counter strategy
   */
  public recordSuccessfulCounter(playerStrategy: string, counterStrategy: string): void {
    const memory = this.memory.get(playerStrategy);
    if (memory && !memory.counterStrategies.includes(counterStrategy)) {
      memory.counterStrategies.push(counterStrategy);
    }
  }

  /**
   * Get current traits
   */
  public getTraits(): PersonalityTraits {
    return { ...this.traits };
  }

  /**
   * Get memory summary
   */
  public getMemorySummary(): Array<{ strategy: string; frequency: number; successRate: number }> {
    return Array.from(this.memory.values()).map(m => ({
      strategy: m.strategy,
      frequency: m.frequency,
      successRate: m.successRate
    }));
  }

  /**
   * Get adaptation history
   */
  public getAdaptationHistory(): typeof this.adaptationHistory {
    return [...this.adaptationHistory];
  }

  /**
   * Predict player move based on similar situations
   */
  public predictPlayerMove(currentState: any): string | null {
    // Find similar states in memory
    const similarStates = this.findSimilarStates(currentState);
    if (similarStates.length === 0) {
      return null;
    }

    // Return most common player response in similar situations
    const strategyCounts = new Map<string, number>();
    similarStates.forEach(state => {
      const count = strategyCounts.get(state.strategy) || 0;
      strategyCounts.set(state.strategy, count + 1);
    });

    let maxCount = 0;
    let mostLikely: string | null = null;
    strategyCounts.forEach((count, strategy) => {
      if (count > maxCount) {
        maxCount = count;
        mostLikely = strategy;
      }
    });

    return mostLikely;
  }

  /**
   * Find similar states in memory
   */
  private findSimilarStates(currentState: any): StrategyMemory[] {
    // Simplified similarity check - would use more sophisticated comparison
    return Array.from(this.memory.values()).filter(m => {
      // Consider recent strategies more relevant
      const timeSinceLastUse = Date.now() - m.lastUsed;
      return timeSinceLastUse < 300000; // 5 minutes
    });
  }

  /**
   * Clamp value between min and max
   */
  private clamp(min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

