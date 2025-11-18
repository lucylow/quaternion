/**
 * Learning & Optimization System
 * Tracks decision outcomes and optimizes future decisions
 */

import { AIAction } from './AIAdaptationManager';

export interface AIDecision {
  actionType: string;
  primaryTarget: { x: number; y: number };
  riskLevel: number;
  timestamp: number;
  context: {
    resources: number;
    threatLevel: number;
    gamePhase: string;
  };
  outcome?: number;
}

export interface DecisionSignature {
  actionType: string;
  targetArea: string; // Grid area identifier
  riskLevel: string; // Low/Medium/High
  contextHash: string;
}

export class AILearningSystem {
  private decisionOutcomes: Map<string, number>;
  private historicalDecisions: AIDecision[];
  private maxHistorySize: number = 1000;
  private learningRate: number = 0.3;

  constructor() {
    this.decisionOutcomes = new Map();
    this.historicalDecisions = [];
  }

  /**
   * Record decision outcome for learning
   */
  recordDecisionOutcome(
    decision: AIDecision,
    outcome: number
  ): void {
    const signature = this.generateDecisionSignature(decision);
    
    // Update moving average
    const currentOutcome = this.decisionOutcomes.get(signature);
    if (currentOutcome !== undefined) {
      const newOutcome = currentOutcome * (1 - this.learningRate) + outcome * this.learningRate;
      this.decisionOutcomes.set(signature, newOutcome);
    } else {
      this.decisionOutcomes.set(signature, outcome);
    }

    // Store decision with outcome
    decision.outcome = outcome;
    this.historicalDecisions.push(decision);

    // Trim history to prevent memory bloat
    if (this.historicalDecisions.length > this.maxHistorySize) {
      this.historicalDecisions.splice(0, 200);
    }
  }

  /**
   * Get expected outcome for a decision
   */
  getExpectedOutcome(decision: AIDecision): number {
    const signature = this.generateDecisionSignature(decision);
    
    // Check for exact match
    if (this.decisionOutcomes.has(signature)) {
      return this.decisionOutcomes.get(signature)!;
    }

    // Find similar historical decisions
    const similarDecisions = this.findSimilarDecisions(decision);
    if (similarDecisions.length > 0) {
      return this.calculateAverageOutcome(similarDecisions);
    }

    // Neutral default
    return 0.5;
  }

  /**
   * Generate decision signature for matching
   */
  private generateDecisionSignature(decision: AIDecision): string {
    const targetArea = this.getTargetArea(decision.primaryTarget);
    const riskLevel = this.getRiskLevelCategory(decision.riskLevel);
    const contextHash = this.getContextHash(decision.context);

    return `${decision.actionType}_${targetArea}_${riskLevel}_${contextHash}`;
  }

  /**
   * Get target area identifier (grid-based)
   */
  private getTargetArea(target: { x: number; y: number }): string {
    // Divide map into 10x10 grid areas
    const gridSize = 10;
    const areaX = Math.floor(target.x / gridSize);
    const areaY = Math.floor(target.y / gridSize);
    return `${areaX}_${areaY}`;
  }

  /**
   * Get risk level category
   */
  private getRiskLevelCategory(riskLevel: number): string {
    if (riskLevel < 0.33) return 'low';
    if (riskLevel < 0.67) return 'medium';
    return 'high';
  }

  /**
   * Get context hash
   */
  private getContextHash(context: AIDecision['context']): string {
    // Create hash from context values
    const resourceLevel = Math.floor(context.resources / 1000);
    const threatLevel = Math.floor(context.threatLevel * 10);
    return `${resourceLevel}_${threatLevel}_${context.gamePhase}`;
  }

  /**
   * Find similar historical decisions
   */
  private findSimilarDecisions(decision: AIDecision): AIDecision[] {
    return this.historicalDecisions.filter(hist => {
      // Same action type
      if (hist.actionType !== decision.actionType) {
        return false;
      }

      // Similar target location (within 5 units)
      const distance = Math.sqrt(
        Math.pow(hist.primaryTarget.x - decision.primaryTarget.x, 2) +
        Math.pow(hist.primaryTarget.y - decision.primaryTarget.y, 2)
      );
      if (distance > 5) {
        return false;
      }

      // Similar risk level (within 0.2)
      if (Math.abs(hist.riskLevel - decision.riskLevel) > 0.2) {
        return false;
      }

      // Similar context
      const resourceDiff = Math.abs(hist.context.resources - decision.context.resources) / 
                          Math.max(hist.context.resources, decision.context.resources, 1);
      if (resourceDiff > 0.3) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate average outcome from similar decisions
   */
  private calculateAverageOutcome(decisions: AIDecision[]): number {
    if (decisions.length === 0) {
      return 0.5;
    }

    const outcomes = decisions
      .filter(d => d.outcome !== undefined)
      .map(d => d.outcome!);

    if (outcomes.length === 0) {
      return 0.5;
    }

    const sum = outcomes.reduce((a, b) => a + b, 0);
    return sum / outcomes.length;
  }

  /**
   * Get decision statistics
   */
  getDecisionStatistics(actionType: string): {
    totalDecisions: number;
    averageOutcome: number;
    successRate: number;
  } {
    const decisions = this.historicalDecisions.filter(d => d.actionType === actionType);
    const withOutcomes = decisions.filter(d => d.outcome !== undefined);

    if (withOutcomes.length === 0) {
      return {
        totalDecisions: decisions.length,
        averageOutcome: 0.5,
        successRate: 0.5
      };
    }

    const outcomes = withOutcomes.map(d => d.outcome!);
    const averageOutcome = outcomes.reduce((a, b) => a + b, 0) / outcomes.length;
    const successRate = outcomes.filter(o => o > 0.6).length / outcomes.length;

    return {
      totalDecisions: decisions.length,
      averageOutcome,
      successRate
    };
  }

  /**
   * Get best action type based on historical performance
   */
  getBestActionType(context: AIDecision['context']): string | null {
    const actionTypes = new Set(this.historicalDecisions.map(d => d.actionType));
    let bestAction: string | null = null;
    let bestScore = -Infinity;

    for (const actionType of actionTypes) {
      const stats = this.getDecisionStatistics(actionType);
      
      // Weight by recency and success rate
      const recentDecisions = this.historicalDecisions
        .filter(d => d.actionType === actionType)
        .slice(-10);
      
      const recentSuccessRate = recentDecisions.length > 0
        ? recentDecisions.filter(d => d.outcome && d.outcome > 0.6).length / recentDecisions.length
        : 0.5;

      const score = stats.averageOutcome * 0.6 + recentSuccessRate * 0.4;

      if (score > bestScore) {
        bestScore = score;
        bestAction = actionType;
      }
    }

    return bestAction;
  }

  /**
   * Clear old decisions to free memory
   */
  clearOldDecisions(maxAge: number = 10000): void {
    const cutoff = Date.now() - maxAge;
    this.historicalDecisions = this.historicalDecisions.filter(
      d => d.timestamp > cutoff
    );
  }

  /**
   * Export learning data for persistence
   */
  exportLearningData(): {
    decisionOutcomes: Array<[string, number]>;
    recentDecisions: AIDecision[];
  } {
    return {
      decisionOutcomes: Array.from(this.decisionOutcomes.entries()),
      recentDecisions: this.historicalDecisions.slice(-100)
    };
  }

  /**
   * Import learning data from persistence
   */
  importLearningData(data: {
    decisionOutcomes: Array<[string, number]>;
    recentDecisions: AIDecision[];
  }): void {
    this.decisionOutcomes = new Map(data.decisionOutcomes);
    this.historicalDecisions = data.recentDecisions;
  }
}


