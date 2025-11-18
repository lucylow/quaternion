/**
 * Flow State Calculator
 * 
 * Implements Csikszentmihalyi's Flow Theory for game adaptation.
 * Maintains optimal challenge-skill balance to keep players in flow state.
 */

import { PlayerModel } from './PlayerExperienceModel';

export enum FlowState {
  ANXIETY = 'anxiety',    // Challenge too high
  FLOW = 'flow',          // Optimal challenge-skill balance
  BOREDOM = 'boredom'     // Challenge too low
}

export interface FlowChannel {
  playerSkillLevel: number;  // Current player skill (0-1)
  challengeLevel: number;    // Current challenge level (0-1)
  
  // Flow channel thresholds
  anxietyThreshold: number;  // Upper bound for flow
  boredomThreshold: number;  // Lower bound for flow
}

/**
 * Flow State Calculator
 * Determines if player is in flow, anxiety, or boredom state
 */
export class FlowStateCalculator {
  private readonly flowChannelWidth = 0.3; // ±0.15 from skill level = flow zone
  
  /**
   * Create a flow channel for a player
   */
  createFlowChannel(playerSkill: number): FlowChannel {
    return {
      playerSkillLevel: playerSkill,
      challengeLevel: playerSkill, // Start with challenge matching skill
      anxietyThreshold: playerSkill + (this.flowChannelWidth / 2),
      boredomThreshold: playerSkill - (this.flowChannelWidth / 2)
    };
  }
  
  /**
   * Calculate current flow state
   */
  calculateFlowState(channel: FlowChannel): FlowState {
    if (channel.challengeLevel > channel.anxietyThreshold) {
      return FlowState.ANXIETY;
    }
    if (channel.challengeLevel < channel.boredomThreshold) {
      return FlowState.BOREDOM;
    }
    return FlowState.FLOW;
  }
  
  /**
   * Calculate optimal challenge adjustment to reach/maintain flow
   */
  calculateOptimalChallenge(
    channel: FlowChannel,
    flowState: FlowState
  ): number {
    switch (flowState) {
      case FlowState.ANXIETY:
        // Reduce challenge toward flow zone
        return Math.max(
          channel.boredomThreshold,
          channel.challengeLevel - 0.05
        );
      
      case FlowState.BOREDOM:
        // Increase challenge toward flow zone
        return Math.min(
          channel.anxietyThreshold,
          channel.challengeLevel + 0.05
        );
      
      case FlowState.FLOW:
        // Maintain challenge slightly above skill for growth
        // Or keep current if already optimal
        return channel.playerSkillLevel + 0.02;
      
      default:
        return channel.challengeLevel;
    }
  }
  
  /**
   * Update flow channel based on player model
   */
  updateFlowChannel(
    channel: FlowChannel,
    playerModel: PlayerModel
  ): FlowChannel {
    // Update skill level from player model
    const overallSkill = this.calculateOverallSkill(playerModel);
    
    const updatedChannel: FlowChannel = {
      playerSkillLevel: overallSkill,
      challengeLevel: channel.challengeLevel,
      anxietyThreshold: overallSkill + (this.flowChannelWidth / 2),
      boredomThreshold: overallSkill - (this.flowChannelWidth / 2)
    };
    
    // Calculate flow state and adjust challenge
    const flowState = this.calculateFlowState(updatedChannel);
    updatedChannel.challengeLevel = this.calculateOptimalChallenge(updatedChannel, flowState);
    
    return updatedChannel;
  }
  
  /**
   * Calculate overall skill from player model
   * Combines skill metrics with emotional factors
   */
  private calculateOverallSkill(playerModel: PlayerModel): number {
    const { skillMetrics, emotionalState } = playerModel;
    
    // Base skill from metrics
    const baseSkill = (
      skillMetrics.accuracy * 0.3 +
      skillMetrics.efficiency * 0.25 +
      skillMetrics.adaptability * 0.25 +
      skillMetrics.consistency * 0.2
    );
    
    // Adjust for emotional state
    // High frustration = lower effective skill
    // High confidence = higher effective skill
    const emotionAdjustment = (
      emotionalState.confidence * 0.1 -
      emotionalState.frustrationLevel * 0.15
    );
    
    return Math.max(0, Math.min(1, baseSkill + emotionAdjustment));
  }
  
  /**
   * Get flow state metrics for visualization/debugging
   */
  getFlowMetrics(channel: FlowChannel, flowState: FlowState) {
    const distanceFromFlow = Math.abs(channel.challengeLevel - channel.playerSkillLevel);
    const flowZoneCenter = (channel.anxietyThreshold + channel.boredomThreshold) / 2;
    const distanceFromFlowCenter = Math.abs(channel.challengeLevel - flowZoneCenter);
    
    return {
      flowState,
      skillLevel: channel.playerSkillLevel,
      challengeLevel: channel.challengeLevel,
      distanceFromFlow,
      distanceFromFlowCenter,
      inFlowZone: flowState === FlowState.FLOW,
      adjustmentNeeded: distanceFromFlowCenter > 0.05
    };
  }
}


