/**
 * Chaotic AI - Unpredictable AI using chaos theory
 * Balances optimal play with chaotic behavior for surprise
 */

import { SeededRandom } from '../../lib/SeededRandom';

export interface ChaoticDecision {
  decision: string;
  surpriseValue: number;
  optimalValue: number;
  finalScore: number;
}

export class ChaoticAI {
  private chaosLevel: number; // 0 = predictable, 1 = completely random
  private strangeAttractors: Array<{ pattern: string; frequency: number }>;
  private lastDecision: string | null;
  private rng: SeededRandom;
  private decisionHistory: Array<{
    timestamp: number;
    decision: string;
    surpriseValue: number;
    outcome: number;
  }>;

  constructor(seed: number, chaosLevel: number = 0.5) {
    this.rng = new SeededRandom(seed);
    this.chaosLevel = this.clamp(0, 1, chaosLevel);
    this.strangeAttractors = [];
    this.lastDecision = null;
    this.decisionHistory = [];
  }

  /**
   * Make decision with chaos theory
   */
  public makeDecision(gameState: any): {
    decision: string;
    reasoning: string;
    surpriseLevel: number;
  } {
    // Balance between optimal play and chaotic behavior
    const useChaos = this.rng.nextFloat() < this.chaosLevel;

    let decision: ChaoticDecision;
    if (useChaos) {
      decision = this.chaoticDecision(gameState);
    } else {
      decision = this.optimalDecision(gameState);
    }

    this.lastDecision = decision.decision;

    // Record decision
    this.decisionHistory.push({
      timestamp: Date.now(),
      decision: decision.decision,
      surpriseValue: decision.surpriseValue,
      outcome: 0 // Would be updated after action
    });

    return {
      decision: decision.decision,
      reasoning: this.generateReasoning(decision),
      surpriseLevel: decision.surpriseValue
    };
  }

  /**
   * Generate chaotic decision
   */
  private chaoticDecision(gameState: any): ChaoticDecision {
    const possibleDecisions = this.getAllPossibleDecisions(gameState);
    
    // Apply chaos theory: small changes in input create large changes in output
    const chaosFactor = this.calculateChaosFactor(gameState);
    
    // Weight decisions by how unexpected they would be
    const surpriseWeights = possibleDecisions.map(decision => 
      this.calculateSurpriseValue(decision)
    );
    
    // Normalize and select
    const total = surpriseWeights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = surpriseWeights.map(w => (total > 0 ? w / total : 1 / surpriseWeights.length));
    
    const selectedDecision = this.weightedChoice(possibleDecisions, normalizedWeights);
    const surpriseValue = this.calculateSurpriseValue(selectedDecision);
    const optimalValue = this.calculateOptimalValue(selectedDecision, gameState);

    return {
      decision: selectedDecision,
      surpriseValue,
      optimalValue,
      finalScore: surpriseValue * chaosFactor + optimalValue * (1 - chaosFactor)
    };
  }

  /**
   * Generate optimal decision
   */
  private optimalDecision(gameState: any): ChaoticDecision {
    const possibleDecisions = this.getAllPossibleDecisions(gameState);
    
    // Select most optimal decision
    let bestDecision = possibleDecisions[0];
    let bestScore = 0;

    possibleDecisions.forEach(decision => {
      const optimalValue = this.calculateOptimalValue(decision, gameState);
      if (optimalValue > bestScore) {
        bestScore = optimalValue;
        bestDecision = decision;
      }
    });

    return {
      decision: bestDecision,
      surpriseValue: this.calculateSurpriseValue(bestDecision),
      optimalValue: bestScore,
      finalScore: bestScore
    };
  }

  /**
   * Calculate surprise value
   */
  private calculateSurpriseValue(decision: string): number {
    let baseSurprise = 1.0;

    // Recent decisions affect surprise
    if (decision === this.lastDecision) {
      baseSurprise *= 0.1; // Repeating decisions are less surprising
    }

    // Some decisions are inherently more surprising
    const surprisingDecisions = ['all_in_attack', 'complete_retreat', 'tech_rush', 'economic_boom'];
    if (surprisingDecisions.includes(decision)) {
      baseSurprise *= 2.0;
    }

    // Check if decision follows a pattern (less surprising)
    if (this.followsPattern(decision)) {
      baseSurprise *= 0.5;
    }

    return this.clamp(0, 1, baseSurprise);
  }

  /**
   * Calculate optimal value
   */
  private calculateOptimalValue(decision: string, gameState: any): number {
    // Simplified optimal value calculation
    let value = 0.5;

    // Adjust based on game state
    if (decision === 'attack' && gameState.militaryAdvantage > 0.3) {
      value = 0.9;
    } else if (decision === 'defend' && gameState.threatLevel > 0.7) {
      value = 0.9;
    } else if (decision === 'expand' && gameState.resourceAdvantage < -0.2) {
      value = 0.8;
    } else if (decision === 'tech' && gameState.techAdvantage < -0.2) {
      value = 0.8;
    }

    return this.clamp(0, 1, value);
  }

  /**
   * Calculate chaos factor
   */
  private calculateChaosFactor(gameState: any): number {
    // Chaos increases with game complexity
    const complexity = (gameState.units || 0) / 100;
    return this.clamp(0, 1, this.chaosLevel * (1 + complexity * 0.1));
  }

  /**
   * Get all possible decisions
   */
  private getAllPossibleDecisions(gameState: any): string[] {
    return [
      'attack',
      'defend',
      'expand',
      'tech',
      'economic',
      'scout',
      'all_in_attack',
      'complete_retreat',
      'tech_rush',
      'economic_boom'
    ];
  }

  /**
   * Check if decision follows a pattern
   */
  private followsPattern(decision: string): boolean {
    if (this.decisionHistory.length < 3) return false;

    const recent = this.decisionHistory.slice(-3).map(d => d.decision);
    return recent.every(d => d === decision);
  }

  /**
   * Weighted choice
   */
  private weightedChoice<T>(items: T[], weights: number[]): T {
    const rand = this.rng.nextFloat();
    let cumulative = 0;

    for (let i = 0; i < items.length; i++) {
      cumulative += weights[i];
      if (rand <= cumulative) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }

  /**
   * Generate reasoning for decision
   */
  private generateReasoning(decision: ChaoticDecision): string {
    if (decision.surpriseValue > 0.7) {
      return `Unconventional approach. Surprise value: ${(decision.surpriseValue * 100).toFixed(0)}%`;
    } else if (decision.optimalValue > 0.7) {
      return `Optimal strategy. Expected value: ${(decision.optimalValue * 100).toFixed(0)}%`;
    } else {
      return `Balanced decision. Score: ${(decision.finalScore * 100).toFixed(0)}%`;
    }
  }

  /**
   * Update chaos level based on outcomes
   */
  public updateChaosLevel(success: boolean): void {
    // If chaos leads to success, increase chaos slightly
    // If chaos leads to failure, decrease chaos slightly
    const adjustment = success ? 0.05 : -0.05;
    this.chaosLevel = this.clamp(0, 1, this.chaosLevel + adjustment);
  }

  /**
   * Get chaos level
   */
  public getChaosLevel(): number {
    return this.chaosLevel;
  }

  /**
   * Clamp value
   */
  private clamp(min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

