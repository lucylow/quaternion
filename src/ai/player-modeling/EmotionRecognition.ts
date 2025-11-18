/**
 * Emotion Recognition System
 * 
 * Multi-modal emotion detection from gameplay patterns.
 * Infers player emotions without requiring specialized hardware.
 */

import { GameplayData, EmotionalState } from './PlayerExperienceModel';

export interface EmotionInferenceResult {
  emotionalState: EmotionalState;
  confidence: number;        // How confident we are in this inference (0-1)
  inferenceMethod: 'behavioral' | 'physiological' | 'hybrid';
  keyIndicators: string[];   // What behaviors led to this inference
}

/**
 * Emotion Recognition System
 * Detects player emotions from gameplay behavior and optional physiological data
 */
export class EmotionRecognition {
  
  /**
   * Infer emotional state from gameplay behavior
   */
  inferFromBehavior(
    recentData: GameplayData[],
    historicalBaseline?: GameplayData[]
  ): EmotionInferenceResult {
    if (recentData.length === 0) {
      return {
        emotionalState: {
          frustrationLevel: 0.0,
          engagementLevel: 0.5,
          confidence: 0.5,
          enjoyment: 0.5
        },
        confidence: 0.0,
        inferenceMethod: 'behavioral',
        keyIndicators: []
      };
    }
    
    const emotionalState: EmotionalState = {
      frustrationLevel: this.calculateFrustration(recentData, historicalBaseline),
      engagementLevel: this.calculateEngagement(recentData, historicalBaseline),
      confidence: this.calculateConfidence(recentData, historicalBaseline),
      enjoyment: this.calculateEnjoyment(recentData, historicalBaseline)
    };
    
    const keyIndicators = this.extractKeyIndicators(recentData, emotionalState);
    const confidence = this.calculateConfidenceScore(recentData.length, keyIndicators.length);
    
    return {
      emotionalState,
      confidence,
      inferenceMethod: 'behavioral',
      keyIndicators
    };
  }
  
  /**
   * Calculate frustration level from behavioral patterns
   */
  private calculateFrustration(
    recentData: GameplayData[],
    baseline?: GameplayData[]
  ): number {
    let frustration = 0.0;
    const indicators: string[] = [];
    
    // Repeated failures
    const failureRate = recentData.reduce((sum, d) => sum + d.failures, 0) / 
                       Math.max(1, recentData.reduce((sum, d) => sum + d.successes + d.failures, 0));
    if (failureRate > 0.5) {
      frustration += failureRate * 0.3;
      indicators.push(`High failure rate: ${(failureRate * 100).toFixed(0)}%`);
    }
    
    // Rapid restarts (rage quitting behavior)
    const avgRestarts = recentData.reduce((sum, d) => sum + d.rapidRestarts, 0) / recentData.length;
    if (avgRestarts > 0.5) {
      frustration += Math.min(0.2, avgRestarts * 0.4);
      indicators.push('Multiple rapid restarts detected');
    }
    
    // Pause frequency (taking breaks from frustration)
    const pauseFreq = recentData.reduce((sum, d) => sum + d.pauseFrequency, 0) / recentData.length;
    if (pauseFreq > 0.3) {
      frustration += pauseFreq * 0.15;
      indicators.push('Frequent pausing');
    }
    
    // Complaint inputs (button spamming, rage clicks)
    const complaintRate = recentData.reduce((sum, d) => sum + d.complaintInputs, 0) / 
                         Math.max(1, recentData.reduce((sum, d) => sum + d.actionsPerformed, 0));
    if (complaintRate > 0.1) {
      frustration += Math.min(0.25, complaintRate * 2.5);
      indicators.push('Excessive input patterns (button spamming)');
    }
    
    // Progress stagnation (stuck, unable to advance)
    const stagnationRate = recentData.reduce((sum, d) => sum + d.progressStagnation, 0) / 
                          recentData.length;
    if (stagnationRate > 5) {
      frustration += Math.min(0.1, stagnationRate / 50);
      indicators.push('Progress stagnation detected');
    }
    
    // Compare to baseline if available
    if (baseline && baseline.length > 0) {
      const baselineFailureRate = baseline.reduce((sum, d) => sum + d.failures, 0) / 
                                  Math.max(1, baseline.reduce((sum, d) => sum + d.successes + d.failures, 0));
      if (failureRate > baselineFailureRate * 1.5) {
        frustration += 0.05;
        indicators.push('Performance decline from baseline');
      }
    }
    
    return Math.max(0, Math.min(1, frustration));
  }
  
  /**
   * Calculate engagement level from positive behaviors
   */
  private calculateEngagement(
    recentData: GameplayData[],
    baseline?: GameplayData[]
  ): number {
    let engagement = 0.0;
    const indicators: string[] = [];
    
    // Session duration (longer = more engaged)
    const avgSessionDuration = recentData.reduce((sum, d) => sum + d.sessionDuration, 0) / recentData.length;
    const sessionWeight = Math.min(1, avgSessionDuration / 1800); // 30 min = max
    engagement += sessionWeight * 0.2;
    if (avgSessionDuration > 600) {
      indicators.push(`Extended session: ${Math.floor(avgSessionDuration / 60)} min`);
    }
    
    // Focus actions (precise, deliberate inputs)
    const avgFocusActions = recentData.reduce((sum, d) => sum + d.focusActions, 0) / recentData.length;
    const focusScore = Math.min(1, avgFocusActions / 10);
    engagement += focusScore * 0.3;
    if (focusScore > 0.5) {
      indicators.push('High precision input patterns');
    }
    
    // Exploration actions
    const avgExploration = recentData.reduce((sum, d) => sum + d.explorationActions, 0) / recentData.length;
    const explorationScore = Math.min(1, avgExploration / 10);
    engagement += explorationScore * 0.25;
    if (explorationScore > 0.5) {
      indicators.push('Active exploration behavior');
    }
    
    // Skill progression (learning = engaged)
    const avgProgression = recentData.reduce((sum, d) => sum + d.skillProgression, 0) / recentData.length;
    engagement += Math.max(0, avgProgression) * 0.25;
    if (avgProgression > 0.1) {
      indicators.push('Positive skill progression');
    }
    
    // Compare to baseline
    if (baseline && baseline.length > 0) {
      const baselineActions = baseline.reduce((sum, d) => sum + d.actionsPerformed, 0) / baseline.length;
      const currentActions = recentData.reduce((sum, d) => sum + d.actionsPerformed, 0) / recentData.length;
      if (currentActions > baselineActions * 1.2) {
        engagement += 0.1;
        indicators.push('Increased activity from baseline');
      }
    }
    
    return Math.max(0, Math.min(1, engagement));
  }
  
  /**
   * Calculate confidence from success rate and consistency
   */
  private calculateConfidence(
    recentData: GameplayData[],
    baseline?: GameplayData[]
  ): number {
    const successes = recentData.reduce((sum, d) => sum + d.successes, 0);
    const attempts = recentData.reduce((sum, d) => sum + d.successes + d.failures, 0);
    
    if (attempts === 0) return 0.5;
    
    const successRate = successes / attempts;
    
    // Consistency boosts confidence
    const efficiencies = recentData.map(d => d.efficiencyScore);
    const mean = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
    const variance = efficiencies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / efficiencies.length;
    const consistency = Math.max(0, 1 - variance);
    
    return successRate * 0.6 + consistency * 0.4;
  }
  
  /**
   * Calculate enjoyment (inverse of frustration, boosted by engagement)
   */
  private calculateEnjoyment(
    recentData: GameplayData[],
    baseline?: GameplayData[]
  ): number {
    const frustration = this.calculateFrustration(recentData, baseline);
    const engagement = this.calculateEngagement(recentData, baseline);
    
    // Enjoyment = low frustration + high engagement
    return Math.max(0, Math.min(1,
      (1 - frustration) * 0.5 + engagement * 0.5
    ));
  }
  
  /**
   * Extract key behavioral indicators that led to emotion inference
   */
  private extractKeyIndicators(
    data: GameplayData[],
    emotionalState: EmotionalState
  ): string[] {
    const indicators: string[] = [];
    
    if (emotionalState.frustrationLevel > 0.6) {
      indicators.push('High frustration detected');
    }
    if (emotionalState.engagementLevel > 0.7) {
      indicators.push('High engagement detected');
    }
    if (emotionalState.confidence < 0.3) {
      indicators.push('Low confidence detected');
    }
    if (emotionalState.enjoyment < 0.4) {
      indicators.push('Low enjoyment detected');
    }
    
    return indicators;
  }
  
  /**
   * Calculate confidence score for emotion inference
   */
  private calculateConfidenceScore(dataPoints: number, indicatorsFound: number): number {
    // More data points = higher confidence
    const dataConfidence = Math.min(1, dataPoints / 30);
    
    // More indicators = higher confidence
    const indicatorConfidence = Math.min(1, indicatorsFound / 4);
    
    return (dataConfidence * 0.6 + indicatorConfidence * 0.4);
  }
  
  /**
   * Detect emotions from physiological data (if available)
   * This would integrate with hardware sensors in advanced implementations
   */
  detectFromPhysiological(
    heartRate?: number,
    gsr?: number,
    pupilDilation?: number
  ): Partial<EmotionalState> {
    const state: Partial<EmotionalState> = {};
    
    // Heart rate analysis (if available)
    // Elevated HR + high GSR = stress/frustration
    // Moderate HR + low GSR = relaxed/enjoyment
    if (heartRate !== undefined && gsr !== undefined) {
      const normalizedHR = Math.max(0, Math.min(1, (heartRate - 60) / 60)); // 60-120 bpm range
      const normalizedGSR = Math.min(1, gsr / 10); // Normalize GSR
      
      state.frustrationLevel = (normalizedHR * 0.6 + normalizedGSR * 0.4) * 0.7;
      state.engagementLevel = normalizedHR * 0.5 + (1 - normalizedGSR) * 0.5;
    }
    
    // Pupil dilation = cognitive load/engagement
    if (pupilDilation !== undefined) {
      state.engagementLevel = (state.engagementLevel || 0.5) * 0.7 + pupilDilation * 0.3;
    }
    
    return state;
  }
}

