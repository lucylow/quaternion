/**
 * AI Personality System
 * Defines different AI behavioral patterns for strategic decision-making
 */

import { StrategicDecision, DecisionType } from './DecisionTypes';
import { QuaternionState } from './QuaternionState';

export enum PersonalityType {
  INDUSTRIALIST = 'industrialist',
  ECOSYMBIOTE = 'ecosymbiote',
  TECHNOCRAT = 'technocrat',
  BALANCER = 'balancer',
  ENTROPY = 'entropy' // Chaos-driven
}

export interface AIPersonality {
  type: PersonalityType;
  description: string;
  
  // Resource Weights (0-2, 1.0 = neutral)
  oreWeight: number;
  energyWeight: number;
  biomassWeight: number;
  dataWeight: number;
  
  // Strategic Priorities (0-2, 1.0 = neutral)
  expansionPriority: number;
  defensePriority: number;
  researchPriority: number;
  balancePriority: number;
  
  // Risk Tolerance (0-1, 0.5 = neutral)
  riskTolerance: number;
  longTermPlanning: number;
  
  // Behavioral Traits (0-1)
  aggressionLevel: number;
  adaptability: number;
  predictability: number;
}

export class AIPersonalityPresets {
  static readonly Industrialist: AIPersonality = {
    type: PersonalityType.INDUSTRIALIST,
    description: 'Focuses on industrial might and resource extraction',
    oreWeight: 2.0,
    energyWeight: 1.5,
    biomassWeight: 0.3,
    dataWeight: 0.8,
    expansionPriority: 1.8,
    defensePriority: 0.7,
    researchPriority: 0.7,
    balancePriority: 0.5,
    riskTolerance: 0.7,
    longTermPlanning: 0.6,
    aggressionLevel: 0.8,
    adaptability: 0.5,
    predictability: 0.7
  };

  static readonly Ecosymbiote: AIPersonality = {
    type: PersonalityType.ECOSYMBIOTE,
    description: 'Seeks harmony with environment and sustainable growth',
    oreWeight: 0.5,
    energyWeight: 0.8,
    biomassWeight: 2.0,
    dataWeight: 1.2,
    expansionPriority: 0.6,
    defensePriority: 1.5,
    researchPriority: 1.0,
    balancePriority: 2.0,
    riskTolerance: 0.3,
    longTermPlanning: 0.8,
    aggressionLevel: 0.2,
    adaptability: 0.7,
    predictability: 0.6
  };

  static readonly Technocrat: AIPersonality = {
    type: PersonalityType.TECHNOCRAT,
    description: 'Pursues technological supremacy above all else',
    oreWeight: 0.7,
    energyWeight: 1.2,
    biomassWeight: 0.4,
    dataWeight: 2.5,
    expansionPriority: 0.8,
    defensePriority: 1.3,
    researchPriority: 2.0,
    balancePriority: 0.6,
    riskTolerance: 0.6,
    longTermPlanning: 0.9,
    aggressionLevel: 0.4,
    adaptability: 0.6,
    predictability: 0.8
  };

  static readonly Balancer: AIPersonality = {
    type: PersonalityType.BALANCER,
    description: 'Maintains equilibrium across all systems',
    oreWeight: 1.0,
    energyWeight: 1.0,
    biomassWeight: 1.0,
    dataWeight: 1.0,
    expansionPriority: 1.0,
    defensePriority: 1.0,
    researchPriority: 1.0,
    balancePriority: 2.0,
    riskTolerance: 0.4,
    longTermPlanning: 0.7,
    aggressionLevel: 0.5,
    adaptability: 0.8,
    predictability: 0.8
  };

  static readonly Entropy: AIPersonality = {
    type: PersonalityType.ENTROPY,
    description: 'Embraces chaos and unpredictability',
    oreWeight: 0.5 + Math.random() * 1.0,
    energyWeight: 0.5 + Math.random() * 1.0,
    biomassWeight: 0.5 + Math.random() * 1.0,
    dataWeight: 0.5 + Math.random() * 1.0,
    expansionPriority: 0.5 + Math.random() * 1.0,
    defensePriority: 0.5 + Math.random() * 1.0,
    researchPriority: 0.5 + Math.random() * 1.0,
    balancePriority: 0.0,
    riskTolerance: 0.8,
    longTermPlanning: 0.2,
    aggressionLevel: 0.5 + Math.random() * 0.5,
    adaptability: 1.0,
    predictability: 0.1
  };

  /**
   * Get personality by type
   */
  static getPersonality(type: PersonalityType): AIPersonality {
    switch (type) {
      case PersonalityType.INDUSTRIALIST:
        return { ...this.Industrialist };
      case PersonalityType.ECOSYMBIOTE:
        return { ...this.Ecosymbiote };
      case PersonalityType.TECHNOCRAT:
        return { ...this.Technocrat };
      case PersonalityType.BALANCER:
        return { ...this.Balancer };
      case PersonalityType.ENTROPY:
        return { ...this.Entropy };
      default:
        return { ...this.Balancer };
    }
  }
}

export class PersonalityEvaluator {
  private personality: AIPersonality;

  constructor(personality: AIPersonality) {
    this.personality = personality;
  }

  /**
   * Get decision weight based on personality
   */
  getDecisionWeight(decision: StrategicDecision, state: QuaternionState): number {
    let weight = 1.0;
    
    // Apply resource weights
    const oreChange = decision.immediateEffect.oreChange || 0;
    const energyChange = decision.immediateEffect.energyChange || 0;
    const biomassChange = decision.immediateEffect.biomassChange || 0;
    const dataChange = decision.immediateEffect.dataChange || 0;
    
    weight *= Math.pow(Math.abs(oreChange) + 1, this.personality.oreWeight / 2);
    weight *= Math.pow(Math.abs(energyChange) + 1, this.personality.energyWeight / 2);
    weight *= Math.pow(Math.abs(biomassChange) + 1, this.personality.biomassWeight / 2);
    weight *= Math.pow(Math.abs(dataChange) + 1, this.personality.dataWeight / 2);
    
    // Apply strategic priorities based on decision type
    switch (decision.type) {
      case DecisionType.OPERATIONAL_EXPANSION:
        weight *= this.personality.expansionPriority;
        break;
      case DecisionType.TACTICAL_DEFENSE:
      case DecisionType.BUILD_DEFENSE:
        weight *= this.personality.defensePriority;
        break;
      case DecisionType.OPERATIONAL_TECH:
      case DecisionType.RESEARCH_OVERCLOCK:
      case DecisionType.RESEARCH_EFFICIENCY:
        weight *= this.personality.researchPriority;
        break;
      case DecisionType.STRATEGIC_BALANCE:
      case DecisionType.ETHICAL_PRESERVE:
        weight *= this.personality.balancePriority;
        break;
    }
    
    // Apply risk adjustment
    const riskAdjustment = 1 + (this.personality.riskTolerance - 0.5) * decision.riskLevel * 2;
    weight *= riskAdjustment;
    
    // Apply long-term planning (prefer decisions with long-term effects)
    if (decision.longTermEffect && this.personality.longTermPlanning > 0.5) {
      const longTermBonus = (this.personality.longTermPlanning - 0.5) * 0.5;
      weight *= (1 + longTermBonus);
    }
    
    return Math.max(0.1, Math.min(3.0, weight));
  }

  /**
   * Calculate ecological stability preference
   */
  calculateEcologicalStability(decision: StrategicDecision, state: QuaternionState): number {
    const biomassChange = decision.immediateEffect.biomassChange || 0;
    const oreChange = decision.immediateEffect.oreChange || 0;
    
    // Prefer decisions that maintain or improve biomass
    let score = biomassChange > 0 ? 1.5 : 1.0;
    
    // Penalize decisions that convert biomass to ore
    if (biomassChange < 0 && oreChange > 0) {
      score *= 0.5;
    }
    
    return score;
  }

  /**
   * Calculate balance preservation preference
   */
  calculateBalancePreservation(decision: StrategicDecision, state: QuaternionState): number {
    const changes = [
      decision.immediateEffect.oreChange || 0,
      decision.immediateEffect.energyChange || 0,
      decision.immediateEffect.biomassChange || 0,
      decision.immediateEffect.dataChange || 0
    ];
    
    // Calculate variance of changes
    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / changes.length;
    
    // Lower variance = more balanced = better
    const maxVariance = 10000;
    const balanceScore = 1 - (variance / maxVariance);
    
    return Math.max(0.5, Math.min(2.0, 1 + balanceScore));
  }

  /**
   * Get personality description
   */
  getDescription(): string {
    return this.personality.description;
  }
}


