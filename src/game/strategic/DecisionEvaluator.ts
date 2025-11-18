/**
 * Decision Evaluator
 * Evaluates strategic decisions using utility functions and personality weights
 */

import { StrategicDecision, DecisionType } from './DecisionTypes';
import { QuaternionState } from './QuaternionState';
import { AIPersonality, PersonalityEvaluator } from './AIPersonality';

export class DecisionEvaluator {
  private personalityEvaluator: PersonalityEvaluator;
  private supportedTypes: Set<DecisionType>;

  constructor(personality: AIPersonality, supportedTypes?: DecisionType[]) {
    this.personalityEvaluator = new PersonalityEvaluator(personality);
    this.supportedTypes = new Set(supportedTypes || Object.values(DecisionType));
  }

  /**
   * Evaluate a decision and return utility score
   */
  evaluateDecision(
    decision: StrategicDecision,
    currentState: QuaternionState
  ): number {
    const baseUtility = this.calculateBaseUtility(decision, currentState);
    const personalityModifier = this.personalityEvaluator.getDecisionWeight(decision, currentState);
    const riskAdjustment = this.calculateRiskAdjustment(decision, currentState);
    const temporalAdjustment = this.calculateTemporalValue(decision, currentState);
    
    return baseUtility * personalityModifier * riskAdjustment * temporalAdjustment;
  }

  /**
   * Calculate base utility from decision effects
   */
  private calculateBaseUtility(
    decision: StrategicDecision,
    state: QuaternionState
  ): number {
    // Economic utility - resource efficiency
    const economicUtility = this.calculateEconomicUtility(decision);
    
    // Strategic utility - positional advantage
    const strategicUtility = this.calculateStrategicValue(decision, state);
    
    // Developmental utility - long-term growth
    const developmentalUtility = this.calculateDevelopmentalValue(decision, state);
    
    return economicUtility * 0.3 + strategicUtility * 0.4 + developmentalUtility * 0.3;
  }

  /**
   * Calculate economic utility
   */
  private calculateEconomicUtility(decision: StrategicDecision): number {
    const oreGain = decision.immediateEffect.oreChange || 0;
    const energyGain = decision.immediateEffect.energyChange || 0;
    const biomassGain = decision.immediateEffect.biomassChange || 0;
    const dataGain = decision.immediateEffect.dataChange || 0;
    
    const oreCost = decision.cost.ore || 0;
    const energyCost = decision.cost.energy || 0;
    const biomassCost = decision.cost.biomass || 0;
    const dataCost = decision.cost.data || 0;
    
    // Net resource gain
    const netGain = (oreGain - oreCost) + (energyGain - energyCost) * 0.8 +
                   (biomassGain - biomassCost) * 0.6 + (dataGain - dataCost) * 1.2;
    
    // Normalize to 0-1 range, then scale
    return Math.max(0, Math.min(1, (netGain + 500) / 1000)) * 2;
  }

  /**
   * Calculate strategic value (positional advantage, territory control)
   */
  private calculateStrategicValue(
    decision: StrategicDecision,
    state: QuaternionState
  ): number {
    let score = 0.5; // Base score
    
    // Decisions that improve stability are strategically valuable
    const stabilityChange = decision.immediateEffect.stabilityChange || 0;
    score += stabilityChange * 0.5;
    
    // Decisions that reduce entropy are valuable
    const entropyChange = decision.immediateEffect.entropyChange || 0;
    if (entropyChange < 0) {
      score += Math.abs(entropyChange) * 0.3;
    }
    
    // Expansion decisions are strategically valuable
    if (decision.type === DecisionType.OPERATIONAL_EXPANSION) {
      score += 0.3;
    }
    
    // Defense decisions are valuable when stability is low
    if (decision.type === DecisionType.TACTICAL_DEFENSE && state.stability < 1.0) {
      score += (1 - state.stability) * 0.5;
    }
    
    return Math.max(0, Math.min(2, score));
  }

  /**
   * Calculate developmental value (long-term growth potential)
   */
  private calculateDevelopmentalValue(
    decision: StrategicDecision,
    state: QuaternionState
  ): number {
    let score = 0.5;
    
    // Long-term effects are valuable
    if (decision.longTermEffect) {
      const longTermOre = decision.longTermEffect.oreChange || 0;
      const longTermEnergy = decision.longTermEffect.energyChange || 0;
      const longTermData = decision.longTermEffect.dataChange || 0;
      
      score += (longTermOre + longTermEnergy * 0.8 + longTermData * 1.2) / 1000;
    }
    
    // Tech unlocks are developmentally valuable
    const techUnlocks = decision.immediateEffect.techUnlocks || 0;
    score += techUnlocks * 0.3;
    
    // Progress toward victory conditions
    const industrialProgress = decision.immediateEffect.industrialProgress || 0;
    const ecologicalProgress = decision.immediateEffect.ecologicalProgress || 0;
    const technologicalProgress = decision.immediateEffect.technologicalProgress || 0;
    const balancedProgress = decision.immediateEffect.balancedProgress || 0;
    
    score += (industrialProgress + ecologicalProgress + technologicalProgress + balancedProgress) * 0.2;
    
    return Math.max(0, Math.min(2, score));
  }

  /**
   * Calculate risk adjustment
   */
  private calculateRiskAdjustment(
    decision: StrategicDecision,
    state: QuaternionState
  ): number {
    const resourceRisk = this.calculateResourceExposure(decision, state);
    const positionalRisk = this.calculatePositionalRisk(decision);
    const entropyRisk = this.calculateEntropyImpact(decision, state);
    
    const totalRisk = (resourceRisk + positionalRisk + entropyRisk) / 3;
    
    // Risk-averse adjustment: higher risk = lower score
    return Math.max(0.5, Math.min(1.5, 1.2 - totalRisk));
  }

  /**
   * Calculate resource exposure risk
   */
  private calculateResourceExposure(
    decision: StrategicDecision,
    state: QuaternionState
  ): number {
    const cost = decision.cost;
    const totalCost = (cost.ore || 0) + (cost.energy || 0) + (cost.biomass || 0) + (cost.data || 0);
    
    const availableResources = state.ore + state.energy + state.biomass + state.data;
    
    if (availableResources === 0) return 1.0;
    
    // Risk increases if cost is a large portion of available resources
    const costRatio = totalCost / availableResources;
    return Math.min(1, costRatio);
  }

  /**
   * Calculate positional risk
   */
  private calculatePositionalRisk(decision: StrategicDecision): number {
    // Higher risk level = higher positional risk
    return decision.riskLevel;
  }

  /**
   * Calculate entropy impact risk
   */
  private calculateEntropyImpact(
    decision: StrategicDecision,
    state: QuaternionState
  ): number {
    const entropyChange = decision.immediateEffect.entropyChange || 0;
    
    // Risk increases if decision increases entropy significantly
    if (entropyChange > 0) {
      const currentEntropy = state.entropy;
      const maxEntropy = 10000; // Approximate max
      const entropyRatio = currentEntropy / maxEntropy;
      
      // Risk is higher if entropy is already high and decision increases it
      return Math.min(1, entropyRatio + (entropyChange / 1000));
    }
    
    return 0.2; // Low risk if entropy decreases
  }

  /**
   * Calculate temporal value (urgency, timing)
   */
  private calculateTemporalValue(
    decision: StrategicDecision,
    state: QuaternionState
  ): number {
    let score = 1.0;
    
    // High priority decisions are more valuable
    score += decision.priority * 0.3;
    
    // Decisions with short execution time are more valuable (can react faster)
    if (decision.executionTime !== undefined) {
      const executionTimeScore = Math.max(0, 1 - (decision.executionTime / 100));
      score += executionTimeScore * 0.2;
    }
    
    // Check if decision addresses current imbalance
    const imbalance = this.getStateImbalance(state);
    if (imbalance && this.decisionAddressesImbalance(decision, imbalance)) {
      score += 0.4; // Bonus for addressing current problems
    }
    
    return Math.max(0.8, Math.min(1.5, score));
  }

  /**
   * Get current state imbalance
   */
  private getStateImbalance(state: QuaternionState): {
    axis: 'ore' | 'energy' | 'biomass' | 'data';
    severity: number;
  } | null {
    const resources = [
      { name: 'ore' as const, value: state.ore },
      { name: 'energy' as const, value: state.energy },
      { name: 'biomass' as const, value: state.biomass },
      { name: 'data' as const, value: state.data }
    ];
    
    const mean = resources.reduce((sum, r) => sum + r.value, 0) / resources.length;
    const maxDeviation = Math.max(...resources.map(r => Math.abs(r.value - mean)));
    const maxValue = Math.max(...resources.map(r => r.value));
    
    if (maxValue === 0) return null;
    
    const severity = maxDeviation / maxValue;
    const mostImbalanced = resources.reduce((max, r) => 
      Math.abs(r.value - mean) > Math.abs(max.value - mean) ? r : max
    );
    
    return {
      axis: mostImbalanced.name,
      severity: Math.min(1, severity)
    };
  }

  /**
   * Check if decision addresses current imbalance
   */
  private decisionAddressesImbalance(
    decision: StrategicDecision,
    imbalance: { axis: 'ore' | 'energy' | 'biomass' | 'data'; severity: number }
  ): boolean {
    const effect = decision.immediateEffect;
    
    switch (imbalance.axis) {
      case 'ore':
        return (effect.oreChange || 0) > 0;
      case 'energy':
        return (effect.energyChange || 0) > 0;
      case 'biomass':
        return (effect.biomassChange || 0) > 0;
      case 'data':
        return (effect.dataChange || 0) > 0;
      default:
        return false;
    }
  }
}


