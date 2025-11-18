/**
 * Strategic Decision Engine
 * Main orchestrator for strategic decision-making system
 */

import { StrategicDecision, DecisionType, DecisionLayer, DecisionImpact } from './DecisionTypes';
import { QuaternionState, QuaternionStateManager } from './QuaternionState';
import { DecisionEvaluator } from './DecisionEvaluator';
import { AIPersonality, AIPersonalityPresets, PersonalityType } from './AIPersonality';
import { TacticalLayerProcessor, OperationalLayerProcessor, StrategicLayerProcessor, EthicalLayerProcessor } from './LayerProcessors';
import { DecisionArbitrationSystem } from './DecisionArbitration';
import { QuaternionMathematics } from './QuaternionMathematics';

export class StrategicDecisionEngine {
  private stateManager: QuaternionStateManager;
  private decisionHistory: StrategicDecision[] = [];
  private impactHistory: DecisionImpact[] = [];
  private activePersonality: AIPersonality;
  private evaluator: DecisionEvaluator;
  private arbitrationSystem: DecisionArbitrationSystem;
  
  // Layer processors
  private tacticalProcessor: TacticalLayerProcessor;
  private operationalProcessor: OperationalLayerProcessor;
  private strategicProcessor: StrategicLayerProcessor;
  private ethicalProcessor: EthicalLayerProcessor;
  
  // Decision processing
  private decisionInterval: number = 2.0; // Seconds between major decisions
  private lastDecisionTime: number = 0;
  private maxConcurrentDecisions: number = 3;
  private activeDecisions: StrategicDecision[] = [];
  
  // Player learning
  private playerPreferenceHistory: Map<DecisionType, number> = new Map();

  constructor(
    initialState?: Partial<QuaternionState>,
    personalityType: PersonalityType = PersonalityType.BALANCER
  ) {
    this.stateManager = new QuaternionStateManager(initialState);
    this.activePersonality = AIPersonalityPresets.getPersonality(personalityType);
    this.evaluator = new DecisionEvaluator(this.activePersonality);
    this.arbitrationSystem = new DecisionArbitrationSystem();
    
    // Initialize layer processors
    this.tacticalProcessor = new TacticalLayerProcessor();
    this.operationalProcessor = new OperationalLayerProcessor();
    this.strategicProcessor = new StrategicLayerProcessor();
    this.ethicalProcessor = new EthicalLayerProcessor();
  }

  /**
   * Main decision processing cycle
   */
  processDecisionCycle(gameContext?: any): StrategicDecision[] {
    const currentTime = Date.now() / 1000; // Convert to seconds
    
    // Check if it's time for a new decision cycle
    if (currentTime - this.lastDecisionTime < this.decisionInterval) {
      return this.activeDecisions;
    }
    
    this.lastDecisionTime = currentTime;
    
    // Phase 1: Generate candidate decisions from all layers
    const candidates = this.generateCandidateDecisions(gameContext);
    
    // Phase 2: Evaluate and rank decisions
    const rankedDecisions = this.rankDecisions(candidates);
    
    // Phase 3: Arbitrate conflicts and select top decisions
    const finalDecisions = this.arbitrateAndSelectDecisions(rankedDecisions);
    
    // Phase 4: Update active decisions
    this.activeDecisions = finalDecisions;
    
    return finalDecisions;
  }

  /**
   * Generate candidate decisions from all layers
   */
  private generateCandidateDecisions(gameContext?: any): StrategicDecision[] {
    const state = this.stateManager.getState();
    const candidates: StrategicDecision[] = [];
    
    // Generate decisions from each layer
    candidates.push(...this.tacticalProcessor.generateDecisions(state, gameContext));
    candidates.push(...this.operationalProcessor.generateDecisions(state, gameContext));
    candidates.push(...this.strategicProcessor.generateDecisions(state, gameContext));
    candidates.push(...this.ethicalProcessor.generateDecisions(state, gameContext));
    
    // Filter to only executable decisions
    return candidates.filter(d => this.isExecutable(d, state));
  }

  /**
   * Check if decision is executable given current state
   */
  private isExecutable(decision: StrategicDecision, state: QuaternionState): boolean {
    // Check requirements
    for (const req of decision.requirements) {
      if (!this.checkRequirement(req, state)) {
        return false;
      }
    }
    
    // Check resource costs
    const cost = decision.cost;
    if ((cost.ore || 0) > state.ore) return false;
    if ((cost.energy || 0) > state.energy) return false;
    if ((cost.biomass || 0) > state.biomass) return false;
    if ((cost.data || 0) > state.data) return false;
    
    return true;
  }

  /**
   * Check if requirement is satisfied
   */
  private checkRequirement(req: any, state: QuaternionState): boolean {
    // Simplified requirement checking
    // In full implementation, would check tech, buildings, units, etc.
    return true;
  }

  /**
   * Rank decisions by utility score
   */
  private rankDecisions(candidates: StrategicDecision[]): StrategicDecision[] {
    const state = this.stateManager.getState();
    
    // Evaluate each decision
    candidates.forEach(decision => {
      decision.utilityScore = this.evaluator.evaluateDecision(decision, state);
      
      // Apply player preference learning
      const preferenceWeight = this.getPlayerPreferenceWeight(decision.type);
      decision.playerPreference = preferenceWeight;
      decision.utilityScore *= (0.7 + preferenceWeight * 0.3); // 30% weight on player preference
      
      // Apply situational urgency
      const urgency = this.calculateSituationalUrgency(decision, state);
      decision.utilityScore *= urgency;
    });
    
    // Sort by utility score
    return candidates.sort((a, b) => b.utilityScore - a.utilityScore);
  }

  /**
   * Get player preference weight for decision type
   */
  private getPlayerPreferenceWeight(decisionType: DecisionType): number {
    return this.playerPreferenceHistory.get(decisionType) || 0.5;
  }

  /**
   * Calculate situational urgency
   */
  private calculateSituationalUrgency(
    decision: StrategicDecision,
    state: QuaternionState
  ): number {
    let urgency = 1.0;
    
    // High urgency if stability is low and decision improves it
    if (state.stability < 0.5 && (decision.immediateEffect.stabilityChange || 0) > 0) {
      urgency += (0.5 - state.stability) * 0.5;
    }
    
    // High urgency if entropy is high and decision reduces it
    if (state.entropy > 5000 && (decision.immediateEffect.entropyChange || 0) < 0) {
      urgency += 0.3;
    }
    
    // High urgency if resources are critically low
    const minResource = Math.min(state.ore, state.energy, state.biomass, state.data);
    if (minResource < 50) {
      // Check if decision addresses the low resource
      const effect = decision.immediateEffect;
      if ((effect.oreChange || 0) > 0 && state.ore < 50) urgency += 0.2;
      if ((effect.energyChange || 0) > 0 && state.energy < 50) urgency += 0.2;
      if ((effect.biomassChange || 0) > 0 && state.biomass < 50) urgency += 0.2;
      if ((effect.dataChange || 0) > 0 && state.data < 50) urgency += 0.2;
    }
    
    return Math.min(2.0, urgency);
  }

  /**
   * Arbitrate conflicts and select final decisions
   */
  private arbitrateAndSelectDecisions(
    rankedDecisions: StrategicDecision[]
  ): StrategicDecision[] {
    // Group decisions by layer
    const layerDecisions = new Map<DecisionLayer, StrategicDecision[]>();
    
    rankedDecisions.forEach(decision => {
      const layer = decision.layer;
      if (!layerDecisions.has(layer)) {
        layerDecisions.set(layer, []);
      }
      layerDecisions.get(layer)!.push(decision);
    });
    
    // Arbitrate
    return this.arbitrationSystem.arbitrateDecisions(layerDecisions, this.stateManager.getState());
  }

  /**
   * Execute a decision
   */
  executeDecision(decision: StrategicDecision): DecisionImpact {
    const state = this.stateManager.getState();
    
    // Apply immediate effects
    this.stateManager.applyResourceChanges({
      ore: decision.immediateEffect.oreChange,
      energy: decision.immediateEffect.energyChange,
      biomass: decision.immediateEffect.biomassChange,
      data: decision.immediateEffect.dataChange
    });
    
    // Update stability and entropy
    const currentState = this.stateManager.getState();
    if (decision.immediateEffect.stabilityChange) {
      this.stateManager.updateState({
        stability: Math.max(0, Math.min(2, currentState.stability + decision.immediateEffect.stabilityChange))
      });
    }
    
    if (decision.immediateEffect.entropyChange) {
      this.stateManager.updateState({
        entropy: Math.max(0, currentState.entropy + decision.immediateEffect.entropyChange)
      });
    }
    
    // Record decision
    this.decisionHistory.push(decision);
    if (this.decisionHistory.length > 100) {
      this.decisionHistory.shift();
    }
    
    // Create impact record
    const impact: DecisionImpact = {
      decisionID: decision.decisionID,
      executedAt: Date.now(),
      immediateResult: decision.immediateEffect,
      longTermResult: decision.longTermEffect,
      actualCost: decision.cost,
      success: true
    };
    
    this.impactHistory.push(impact);
    if (this.impactHistory.length > 100) {
      this.impactHistory.shift();
    }
    
    // Learn from player choice (if this was a player decision)
    this.learnFromPlayerChoice(decision);
    
    return impact;
  }

  /**
   * Learn from player choice to adapt to playstyle
   */
  learnFromPlayerChoice(decision: StrategicDecision): void {
    const currentWeight = this.playerPreferenceHistory.get(decision.type) || 0.5;
    const newWeight = currentWeight * 0.9 + 0.1; // Slight increase for chosen decisions
    
    this.playerPreferenceHistory.set(decision.type, Math.min(1.0, newWeight));
  }

  /**
   * Get recommended decisions for player
   */
  getRecommendedDecisions(count: number = 3): StrategicDecision[] {
    const candidates = this.generateCandidateDecisions();
    const ranked = this.rankDecisions(candidates);
    const arbitrated = this.arbitrateAndSelectDecisions(ranked);
    
    return arbitrated.slice(0, count);
  }

  /**
   * Simulate decision execution to show consequences
   */
  simulateDecision(decision: StrategicDecision): {
    shortTerm: QuaternionState;
    longTerm: QuaternionState;
  } {
    const currentState = this.stateManager.getState();
    
    // Simulate short-term effects
    const shortTerm = { ...currentState };
    if (decision.immediateEffect.oreChange) shortTerm.ore += decision.immediateEffect.oreChange;
    if (decision.immediateEffect.energyChange) shortTerm.energy += decision.immediateEffect.energyChange;
    if (decision.immediateEffect.biomassChange) shortTerm.biomass += decision.immediateEffect.biomassChange;
    if (decision.immediateEffect.dataChange) shortTerm.data += decision.immediateEffect.dataChange;
    if (decision.immediateEffect.stabilityChange) {
      shortTerm.stability = Math.max(0, Math.min(2, shortTerm.stability + decision.immediateEffect.stabilityChange));
    }
    
    // Simulate long-term effects
    const longTerm = { ...shortTerm };
    if (decision.longTermEffect) {
      if (decision.longTermEffect.oreChange) longTerm.ore += decision.longTermEffect.oreChange;
      if (decision.longTermEffect.energyChange) longTerm.energy += decision.longTermEffect.energyChange;
      if (decision.longTermEffect.biomassChange) longTerm.biomass += decision.longTermEffect.biomassChange;
      if (decision.longTermEffect.dataChange) longTerm.data += decision.longTermEffect.dataChange;
      if (decision.longTermEffect.stabilityChange) {
        longTerm.stability = Math.max(0, Math.min(2, longTerm.stability + decision.longTermEffect.stabilityChange));
      }
    }
    
    return { shortTerm, longTerm };
  }

  /**
   * Get current state
   */
  getState(): QuaternionState {
    return this.stateManager.getState();
  }

  /**
   * Update state from game resources
   */
  updateStateFromGameResources(resources: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  }): void {
    this.stateManager.updateState(resources);
  }

  /**
   * Get decision history
   */
  getDecisionHistory(): StrategicDecision[] {
    return [...this.decisionHistory];
  }

  /**
   * Get impact history
   */
  getImpactHistory(): DecisionImpact[] {
    return [...this.impactHistory];
  }

  /**
   * Change AI personality
   */
  setPersonality(personalityType: PersonalityType): void {
    this.activePersonality = AIPersonalityPresets.getPersonality(personalityType);
    this.evaluator = new DecisionEvaluator(this.activePersonality);
  }

  /**
   * Get current personality
   */
  getPersonality(): AIPersonality {
    return { ...this.activePersonality };
  }
}


