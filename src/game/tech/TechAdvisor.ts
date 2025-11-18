/**
 * Tech Advisor System
 * Provides intelligent recommendations with optional LLM enhancement
 */

import { TechTreeSolver, PuzzleContext, TechEvaluation } from './TechTreeSolver';
import { TechTreeManager, TechNode } from '../TechTreeManager';
import { ResourceManager } from '../ResourceManager';

export enum AdvisorStyle {
  CONSERVATIVE = 'conservative',
  AGGRESSIVE = 'aggressive',
  INNOVATIVE = 'innovative',
  ADAPTIVE = 'adaptive'
}

export interface AdvisorPersonality {
  name: string;
  style: AdvisorStyle;
  riskTolerance: number; // 0-1
  planningHorizon: number; // Turns to look ahead
  specialization?: 'offensive' | 'defensive' | 'economic' | 'adaptive';
}

export interface AdvisorResponse {
  recommendation: string; // nodeId
  confidence: number; // 0-1
  reasoning: string;
  alternativeOptions?: string[];
}

export class TechAdvisor {
  private solver: TechTreeSolver;
  private techManager: TechTreeManager;
  private resourceManager: ResourceManager;
  private currentPersonality: AdvisorPersonality;
  private adviceCooldown: number = 45; // seconds
  private lastAdviceTime: number = 0;
  private enableLLM: boolean = false; // Can be enabled if LLM integration is available

  constructor(
    solver: TechTreeSolver,
    techManager: TechTreeManager,
    resourceManager: ResourceManager,
    personality?: AdvisorPersonality
  ) {
    this.solver = solver;
    this.techManager = techManager;
    this.resourceManager = resourceManager;
    this.currentPersonality = personality || this.getDefaultPersonality();
  }

  /**
   * Generate tech recommendation based on current game state
   */
  public generateRecommendation(context: PuzzleContext): AdvisorResponse | null {
    if (Date.now() / 1000 - this.lastAdviceTime < this.adviceCooldown) {
      return null; // Still on cooldown
    }

    const evaluations = this.solver.evaluateAvailableTechs(context);

    if (evaluations.length === 0) {
      return null;
    }

    // Apply advisor personality to selection
    const bestMatch = this.selectBasedOnPersonality(evaluations, context);

    if (!bestMatch) {
      return null;
    }

    const response: AdvisorResponse = {
      recommendation: bestMatch.node.nodeId,
      confidence: Math.min(1.0, bestMatch.totalScore / 100), // Normalize confidence
      reasoning: this.generatePersonalityReasoning(bestMatch, context),
      alternativeOptions: evaluations.slice(1, 3).map(e => e.node.nodeId)
    };

    this.lastAdviceTime = Date.now() / 1000;

    return response;
  }

  /**
   * Select recommendation based on advisor personality
   */
  private selectBasedOnPersonality(
    evaluations: TechEvaluation[],
    context: PuzzleContext
  ): TechEvaluation | null {
    switch (this.currentPersonality.style) {
      case AdvisorStyle.CONSERVATIVE:
        // Favor long-term value and synergies
        return evaluations.sort((a, b) => 
          (b.longTermValue + b.synergyBonus) - (a.longTermValue + a.synergyBonus)
        )[0];

      case AdvisorStyle.AGGRESSIVE:
        // Favor immediate impact and urgency
        return evaluations.sort((a, b) => 
          (b.immediateImpact + b.urgencyScore) - (a.immediateImpact + a.urgencyScore)
        )[0];

      case AdvisorStyle.INNOVATIVE:
        // Favor synergies and long-term potential
        return evaluations.sort((a, b) => 
          (b.synergyBonus + b.longTermValue) - (a.synergyBonus + a.longTermValue)
        )[0];

      case AdvisorStyle.ADAPTIVE:
        // Adapts based on game state
        return this.selectAdaptiveRecommendation(evaluations, context);

      default:
        return evaluations[0];
    }
  }

  /**
   * Adaptive advisor changes strategy based on context
   */
  private selectAdaptiveRecommendation(
    evaluations: TechEvaluation[],
    context: PuzzleContext
  ): TechEvaluation {
    // If enemy is threatening, prioritize immediate counters
    if (context.enemyComposition) {
      const hasThreat = context.enemyComposition.hasAir || 
                       context.enemyComposition.hasHeavy || 
                       context.enemyComposition.hasStealth;
      
      if (hasThreat) {
        return evaluations.sort((a, b) => 
          (b.urgencyScore + b.immediateImpact) - (a.urgencyScore + a.immediateImpact)
        )[0];
      }
    }

    // If resources are abundant, favor long-term investments
    const totalResources = context.currentResources.ore + context.currentResources.energy +
                          context.currentResources.biomass + context.currentResources.data;
    
    if (totalResources > 500) {
      return evaluations.sort((a, b) => 
        (b.longTermValue + b.synergyBonus) - (a.longTermValue + a.synergyBonus)
      )[0];
    }

    // Default: balanced approach
    return evaluations[0];
  }

  /**
   * Generate reasoning based on advisor personality
   */
  private generatePersonalityReasoning(
    evaluation: TechEvaluation,
    context: PuzzleContext
  ): string {
    const node = evaluation.node;
    const reasons: string[] = [];

    switch (this.currentPersonality.style) {
      case AdvisorStyle.CONSERVATIVE:
        if (evaluation.longTermValue > 20) {
          reasons.push('strong long-term benefits');
        }
        if (evaluation.synergyBonus > 0.2) {
          reasons.push('synergy potential');
        }
        reasons.push('safe investment');
        break;

      case AdvisorStyle.AGGRESSIVE:
        if (evaluation.immediateImpact > 30) {
          reasons.push('immediate tactical advantage');
        }
        if (evaluation.urgencyScore > 0.6) {
          reasons.push('critical timing');
        }
        reasons.push('aggressive play');
        break;

      case AdvisorStyle.INNOVATIVE:
        if (evaluation.synergyBonus > 0.2) {
          reasons.push('combo potential');
        }
        if (evaluation.longTermValue > 20) {
          reasons.push('strategic innovation');
        }
        reasons.push('creative path');
        break;

      case AdvisorStyle.ADAPTIVE:
        reasons.push(evaluation.reasoning);
        break;
    }

    return reasons.length > 0 ? reasons.join(', ') : 'recommended choice';
  }

  /**
   * Generate LLM-enhanced recommendation (placeholder for future integration)
   */
  public async generateLLMRecommendation(
    context: PuzzleContext
  ): Promise<AdvisorResponse | null> {
    if (!this.enableLLM) {
      return this.generateRecommendation(context);
    }

    // Placeholder for LLM integration
    // Would call LLM API with context and get natural language reasoning
    const baseResponse = this.generateRecommendation(context);
    
    if (baseResponse) {
      // Enhance reasoning with LLM (if available)
      // const enhancedReasoning = await this.callLLMAPI(context, baseResponse);
      // baseResponse.reasoning = enhancedReasoning;
    }

    return baseResponse;
  }

  /**
   * Get default advisor personality
   */
  private getDefaultPersonality(): AdvisorPersonality {
    return {
      name: 'Adaptive Advisor',
      style: AdvisorStyle.ADAPTIVE,
      riskTolerance: 0.5,
      planningHorizon: 3,
      specialization: 'adaptive'
    };
  }

  /**
   * Set advisor personality
   */
  public setPersonality(personality: AdvisorPersonality): void {
    this.currentPersonality = personality;
  }

  /**
   * Get current personality
   */
  public getPersonality(): AdvisorPersonality {
    return this.currentPersonality;
  }

  /**
   * Enable/disable LLM enhancement
   */
  public setLLMEnabled(enabled: boolean): void {
    this.enableLLM = enabled;
  }
}


