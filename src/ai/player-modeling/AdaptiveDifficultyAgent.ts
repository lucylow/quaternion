/**
 * Adaptive Difficulty Agent
 * 
 * Reinforcement Learning-based system for dynamically adjusting game difficulty
 * to maintain optimal player experience in flow state.
 */

import { PlayerModel } from './PlayerExperienceModel';
import { FlowState, FlowStateCalculator } from './FlowStateCalculator';
import { EmotionRecognition } from './EmotionRecognition';

export interface DifficultyAction {
  enemyHealthModifier: number;    // -0.2 to +0.2 (percentage change)
  resourceAbundance: number;      // -0.3 to +0.3 (percentage change)
  puzzleComplexity: number;       // -0.15 to +0.15 (percentage change)
  timePressure: number;           // -0.25 to +0.25 (percentage change)
  hintFrequency: number;          // -0.1 to +0.1 (percentage change)
  aiReactionTimeModifier: number; // -0.2 to +0.2 (faster/slower AI)
}

export interface AdaptationState {
  playerModel: PlayerModel;
  flowState: FlowState;
  currentChallengeLevel: number;
  historicalPerformance: {
    averageSuccessRate: number;
    averageEngagement: number;
    averageFrustration: number;
  };
  lastAction?: DifficultyAction;
  tick: number;
}

export interface AdaptationReward {
  reward: number;
  breakdown: {
    flowReward: number;
    engagementReward: number;
    frustrationPenalty: number;
    enjoymentReward: number;
    skillImprovementReward: number;
  };
}

/**
 * Adaptive Difficulty Agent using RL principles
 * Adjusts game difficulty to maintain flow state
 */
export class AdaptiveDifficultyAgent {
  private flowCalculator: FlowStateCalculator;
  private emotionRecognition: EmotionRecognition;
  
  // Learning parameters
  private readonly learningRate = 0.1;
  private readonly explorationRate = 0.2; // Try random actions 20% of time
  private readonly discountFactor = 0.9;
  
  // State-action value estimates (Q-table approximation)
  private qEstimates: Map<string, number> = new Map();
  
  // Action bounds
  private readonly actionBounds = {
    enemyHealth: { min: -0.2, max: 0.2 },
    resourceAbundance: { min: -0.3, max: 0.3 },
    puzzleComplexity: { min: -0.15, max: 0.15 },
    timePressure: { min: -0.25, max: 0.25 },
    hintFrequency: { min: -0.1, max: 0.1 },
    aiReactionTime: { min: -0.2, max: 0.2 }
  };
  
  constructor() {
    this.flowCalculator = new FlowStateCalculator();
    this.emotionRecognition = new EmotionRecognition();
  }
  
  /**
   * Select difficulty action based on current state
   */
  selectAction(state: AdaptationState): DifficultyAction {
    // Exploration: random action sometimes
    if (Math.random() < this.explorationRate) {
      return this.generateRandomAction();
    }
    
    // Exploitation: best known action for this state
    const stateKey = this.getStateKey(state);
    const candidateActions = this.generateCandidateActions(state);
    
    let bestAction: DifficultyAction = candidateActions[0];
    let bestQ = this.getQValue(stateKey, bestAction);
    
    for (const action of candidateActions.slice(1)) {
      const qValue = this.getQValue(stateKey, action);
      if (qValue > bestQ) {
        bestQ = qValue;
        bestAction = action;
      }
    }
    
    return bestAction;
  }
  
  /**
   * Calculate reward for previous action
   */
  calculateReward(
    previousState: AdaptationState,
    action: DifficultyAction,
    newState: AdaptationState
  ): AdaptationReward {
    const breakdown = {
      flowReward: 0,
      engagementReward: 0,
      frustrationPenalty: 0,
      skillImprovementReward: 0
    };
    
    // Primary reward: Maintain flow state
    if (newState.flowState === FlowState.FLOW) {
      breakdown.flowReward = 1.0;
    } else if (newState.flowState === FlowState.ANXIETY || newState.flowState === FlowState.BOREDOM) {
      breakdown.flowReward = -0.5;
    }
    
    // Secondary rewards: Positive emotional indicators
    const emotionalState = newState.playerModel.emotionalState;
    breakdown.engagementReward = emotionalState.engagementLevel * 0.5;
    breakdown.frustrationPenalty = -emotionalState.frustrationLevel * 0.7;
    breakdown.enjoymentReward = emotionalState.enjoyment * 0.3;
    
    // Tertiary: Skill development (encouraging growth)
    const skillImprovement = this.calculateSkillImprovement(previousState, newState);
    breakdown.skillImprovementReward = skillImprovement * 0.2;
    
    const totalReward = 
      breakdown.flowReward +
      breakdown.engagementReward +
      breakdown.frustrationPenalty +
      breakdown.enjoymentReward +
      breakdown.skillImprovementReward;
    
    return {
      reward: totalReward,
      breakdown
    };
  }
  
  /**
   * Update Q-value estimate after taking action
   */
  updateQValue(
    state: AdaptationState,
    action: DifficultyAction,
    reward: number,
    nextState: AdaptationState
  ): void {
    const stateKey = this.getStateKey(state);
    const actionKey = this.getActionKey(action);
    const combinedKey = `${stateKey}_${actionKey}`;
    
    const currentQ = this.getQValue(stateKey, action);
    const nextMaxQ = this.getMaxQValue(nextState);
    
    // Q-learning update: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
    const newQ = currentQ + this.learningRate * (
      reward + this.discountFactor * nextMaxQ - currentQ
    );
    
    this.qEstimates.set(combinedKey, newQ);
  }
  
  /**
   * Generate candidate actions for current state
   */
  private generateCandidateActions(state: AdaptationState): DifficultyAction[] {
    const actions: DifficultyAction[] = [];
    
    // Action 1: Reduce difficulty (if anxiety)
    if (state.flowState === FlowState.ANXIETY) {
      actions.push({
        enemyHealthModifier: -0.1,
        resourceAbundance: 0.1,
        puzzleComplexity: -0.1,
        timePressure: -0.15,
        hintFrequency: 0.05,
        aiReactionTimeModifier: 0.1 // Slower AI = easier
      });
    }
    
    // Action 2: Increase difficulty (if boredom)
    if (state.flowState === FlowState.BOREDOM) {
      actions.push({
        enemyHealthModifier: 0.1,
        resourceAbundance: -0.1,
        puzzleComplexity: 0.1,
        timePressure: 0.15,
        hintFrequency: -0.05,
        aiReactionTimeModifier: -0.1 // Faster AI = harder
      });
    }
    
    // Action 3: Maintain difficulty (if flow)
    if (state.flowState === FlowState.FLOW) {
      actions.push({
        enemyHealthModifier: 0.0,
        resourceAbundance: 0.0,
        puzzleComplexity: 0.0,
        timePressure: 0.0,
        hintFrequency: 0.0,
        aiReactionTimeModifier: 0.0
      });
    }
    
    // Action 4-6: Fine-tuned adjustments based on emotional state
    const { frustrationLevel, engagementLevel } = state.playerModel.emotionalState;
    
    if (frustrationLevel > 0.6) {
      // High frustration: reduce challenge across the board
      actions.push({
        enemyHealthModifier: -0.15,
        resourceAbundance: 0.2,
        puzzleComplexity: -0.1,
        timePressure: -0.2,
        hintFrequency: 0.1,
        aiReactionTimeModifier: 0.15
      });
    }
    
    if (engagementLevel < 0.4) {
      // Low engagement: increase challenge slightly
      actions.push({
        enemyHealthModifier: 0.1,
        resourceAbundance: -0.1,
        puzzleComplexity: 0.1,
        timePressure: 0.1,
        hintFrequency: -0.05,
        aiReactionTimeModifier: -0.1
      });
    }
    
    // Always include "do nothing" option
    actions.push({
      enemyHealthModifier: 0.0,
      resourceAbundance: 0.0,
      puzzleComplexity: 0.0,
      timePressure: 0.0,
      hintFrequency: 0.0,
      aiReactionTimeModifier: 0.0
    });
    
    return actions;
  }
  
  /**
   * Generate random action for exploration
   */
  private generateRandomAction(): DifficultyAction {
    const randomInRange = (min: number, max: number) => 
      Math.random() * (max - min) + min;
    
    return {
      enemyHealthModifier: randomInRange(
        this.actionBounds.enemyHealth.min,
        this.actionBounds.enemyHealth.max
      ),
      resourceAbundance: randomInRange(
        this.actionBounds.resourceAbundance.min,
        this.actionBounds.resourceAbundance.max
      ),
      puzzleComplexity: randomInRange(
        this.actionBounds.puzzleComplexity.min,
        this.actionBounds.puzzleComplexity.max
      ),
      timePressure: randomInRange(
        this.actionBounds.timePressure.min,
        this.actionBounds.timePressure.max
      ),
      hintFrequency: randomInRange(
        this.actionBounds.hintFrequency.min,
        this.actionBounds.hintFrequency.max
      ),
      aiReactionTimeModifier: randomInRange(
        this.actionBounds.aiReactionTime.min,
        this.actionBounds.aiReactionTime.max
      )
    };
  }
  
  /**
   * Get Q-value for state-action pair
   */
  private getQValue(stateKey: string, action: DifficultyAction): number {
    const actionKey = this.getActionKey(action);
    const combinedKey = `${stateKey}_${actionKey}`;
    return this.qEstimates.get(combinedKey) || 0.0;
  }
  
  /**
   * Get maximum Q-value for state (over all possible actions)
   */
  private getMaxQValue(state: AdaptationState): number {
    const candidateActions = this.generateCandidateActions(state);
    const stateKey = this.getStateKey(state);
    
    let maxQ = -Infinity;
    for (const action of candidateActions) {
      const qValue = this.getQValue(stateKey, action);
      maxQ = Math.max(maxQ, qValue);
    }
    
    return maxQ > -Infinity ? maxQ : 0.0;
  }
  
  /**
   * Convert state to string key for Q-table
   */
  private getStateKey(state: AdaptationState): string {
    const skill = Math.floor(state.playerModel.skillMetrics.accuracy * 10);
    const flowState = state.flowState;
    const frustration = Math.floor(state.playerModel.emotionalState.frustrationLevel * 10);
    const engagement = Math.floor(state.playerModel.emotionalState.engagementLevel * 10);
    
    return `${skill}_${flowState}_${frustration}_${engagement}`;
  }
  
  /**
   * Convert action to string key
   */
  private getActionKey(action: DifficultyAction): string {
    const quantize = (val: number, steps: number) => 
      Math.floor(val * steps) / steps;
    
    return [
      quantize(action.enemyHealthModifier, 5),
      quantize(action.resourceAbundance, 5),
      quantize(action.puzzleComplexity, 5),
      quantize(action.timePressure, 5),
      quantize(action.hintFrequency, 5),
      quantize(action.aiReactionTimeModifier, 5)
    ].join('_');
  }
  
  /**
   * Calculate skill improvement between states
   */
  private calculateSkillImprovement(
    previousState: AdaptationState,
    newState: AdaptationState
  ): number {
    const previousSkill = 
      previousState.playerModel.skillMetrics.accuracy * 0.3 +
      previousState.playerModel.skillMetrics.efficiency * 0.3 +
      previousState.playerModel.skillMetrics.adaptability * 0.2 +
      previousState.playerModel.skillMetrics.consistency * 0.2;
    
    const newSkill = 
      newState.playerModel.skillMetrics.accuracy * 0.3 +
      newState.playerModel.skillMetrics.efficiency * 0.3 +
      newState.playerModel.skillMetrics.adaptability * 0.2 +
      newState.playerModel.skillMetrics.consistency * 0.2;
    
    return Math.max(0, newSkill - previousSkill);
  }
  
  /**
   * Create adaptation state from player model and flow state
   */
  createAdaptationState(
    playerModel: PlayerModel,
    flowState: FlowState,
    currentChallengeLevel: number,
    tick: number
  ): AdaptationState {
    return {
      playerModel,
      flowState,
      currentChallengeLevel,
      historicalPerformance: {
        averageSuccessRate: playerModel.skillMetrics.accuracy,
        averageEngagement: playerModel.emotionalState.engagementLevel,
        averageFrustration: playerModel.emotionalState.frustrationLevel
      },
      tick
    };
  }
}

