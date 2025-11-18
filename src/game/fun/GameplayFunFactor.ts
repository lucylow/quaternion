/**
 * Gameplay Fun Factor System
 * Orchestrates all fun systems to ensure the game is actually enjoyable
 */

import Phaser from 'phaser';
import { SatisfyingFeedbackSystem } from './SatisfyingFeedbackSystem';
import { PowerPlaySystem } from './PowerPlaySystem';
import { ExcitingMomentsSystem } from './ExcitingMomentsSystem';
import { QuaternionArtPalette } from '../art/ArtPalette';
import type { QuaternionState } from '../strategic/QuaternionState';

export interface FunMetrics {
  satisfactionScore: number; // 0-1, how satisfying the game feels
  excitementLevel: number; // 0-1, current excitement
  flowState: number; // 0-1, how "in the zone" player is
  feedbackQuality: number; // 0-1, quality of feedback received
}

export class GameplayFunFactor {
  private scene: Phaser.Scene;
  private feedbackSystem: SatisfyingFeedbackSystem;
  private powerPlaySystem: PowerPlaySystem;
  private excitingMomentsSystem: ExcitingMomentsSystem;

  private funMetrics: FunMetrics = {
    satisfactionScore: 0.5,
    excitementLevel: 0.5,
    flowState: 0.5,
    feedbackQuality: 0.5
  };

  private actionHistory: Array<{ action: string; timestamp: number; feedback: number }> = [];
  private lastBigMoment: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.feedbackSystem = new SatisfyingFeedbackSystem(scene);
    this.powerPlaySystem = new PowerPlaySystem();
    this.excitingMomentsSystem = new ExcitingMomentsSystem();
  }

  /**
   * Process player action with fun enhancements
   */
  processAction(
    action: string,
    actionType: 'build' | 'research' | 'expand' | 'conservation' | 'exploitation',
    gameState: QuaternionState,
    position?: { x: number; y: number }
  ): void {
    // Record action for feedback
    this.feedbackSystem.recordAction(action);
    
    // Get combo multiplier
    const comboMultiplier = this.feedbackSystem.getComboMultiplier();
    const comboBonus = this.feedbackSystem.getComboBonus();

    // Check for power plays
    const powerPlays = this.powerPlaySystem.checkPowerPlays(gameState, action);
    
    // Calculate feedback intensity based on action significance
    const intensity = this.calculateFeedbackIntensity(actionType, gameState, powerPlays.length);

    // Trigger satisfying feedback
    this.feedbackSystem.triggerFeedback({
      type: this.mapActionToFeedbackType(actionType),
      position,
      resourceType: this.detectResourceType(gameState),
      intensity,
      text: this.generateFeedbackText(action, actionType, powerPlays.length > 0)
    });

    // Handle power plays
    powerPlays.forEach(powerPlay => {
      this.handlePowerPlay(powerPlay);
    });

    // Check for exciting moments
    const moments = this.excitingMomentsSystem.checkExcitingMoments(
      gameState,
      action,
      this.scene.time.now
    );

    moments.forEach(moment => {
      this.handleExcitingMoment(moment);
    });

    // Update fun metrics
    this.updateFunMetrics(action, intensity, powerPlays.length, moments.length);
  }

  /**
   * Calculate feedback intensity
   */
  private calculateFeedbackIntensity(
    actionType: string,
    gameState: QuaternionState,
    powerPlayCount: number
  ): number {
    let intensity = 0.5; // Base intensity

    // Action type modifier
    switch (actionType) {
      case 'build':
        intensity = 0.6;
        break;
      case 'research':
        intensity = 0.7;
        break;
      case 'expand':
        intensity = 0.8;
        break;
    }

    // Stability modifier (high stability = more satisfying)
    intensity += (gameState.stability / 2) * 0.2;

    // Power play modifier
    intensity += powerPlayCount * 0.1;

    // Resource abundance modifier
    const total = gameState.ore + gameState.energy + gameState.biomass + gameState.data;
    intensity += Math.min(0.2, total / 10000);

    // Combo modifier
    const comboMultiplier = this.feedbackSystem.getComboMultiplier();
    intensity *= comboMultiplier;

    return Math.min(1, Math.max(0.1, intensity));
  }

  /**
   * Map action type to feedback type
   */
  private mapActionToFeedbackType(actionType: string): 'build' | 'research' | 'resource_gain' {
    switch (actionType) {
      case 'build':
      case 'expand':
        return 'build';
      case 'research':
        return 'research';
      default:
        return 'resource_gain';
    }
  }

  /**
   * Detect dominant resource type for feedback
   */
  private detectResourceType(gameState: QuaternionState): 'matter' | 'energy' | 'life' | 'knowledge' {
    const { ore, energy, biomass, data } = gameState;
    const max = Math.max(ore, energy, biomass, data);
    
    if (max === ore) return 'matter';
    if (max === energy) return 'energy';
    if (max === biomass) return 'life';
    return 'knowledge';
  }

  /**
   * Generate feedback text
   */
  private generateFeedbackText(
    action: string,
    actionType: string,
    hasPowerPlay: boolean
  ): string {
    if (hasPowerPlay) {
      return 'POWER PLAY!';
    }

    const texts: Record<string, string[]> = {
      'build': ['Built!', 'Construction started!', 'Building!'],
      'research': ['Researching!', 'Discovery!', 'Breakthrough!'],
      'expand': ['Expanding!', 'Growing!', 'Expansion!'],
      'resource_gain': ['Resources!', 'Gained!', 'Acquired!']
    };

    const options = texts[actionType] || texts['resource_gain'];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Handle power play
   */
  private handlePowerPlay(powerPlay: PowerPlay): void {
    // Show power play notification
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    const notification = this.scene.add.text(centerX, centerY - 150, powerPlay.name, {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 6,
      align: 'center'
    });
    notification.setOrigin(0.5);
    notification.setDepth(100);

    this.scene.tweens.add({
      targets: notification,
      scale: { from: 0.8, to: 1.2, then: 1 },
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: notification,
          alpha: 0,
          y: notification.y - 30,
          duration: 1000,
          delay: 2000,
          onComplete: () => notification.destroy()
        });
      }
    });

    // Trigger feedback
    this.feedbackSystem.triggerFeedback({
      type: 'combo',
      intensity: 0.9,
      text: powerPlay.name
    });
  }

  /**
   * Handle exciting moment
   */
  private handleExcitingMoment(moment: ExcitingMoment): void {
    // Show exciting moment notification
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    const title = this.scene.add.text(centerX, centerY - 200, moment.title, {
      fontSize: '42px',
      fontFamily: 'Arial',
      color: '#00FFFF',
      stroke: '#000',
      strokeThickness: 8,
      align: 'center'
    });
    title.setOrigin(0.5);
    title.setDepth(100);

    const description = this.scene.add.text(centerX, centerY - 150, moment.description, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      stroke: '#000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: 600 }
    });
    description.setOrigin(0.5);
    description.setDepth(100);

    // Animate
    this.scene.tweens.add({
      targets: [title, description],
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: [title, description],
          alpha: 0,
          y: '-=50',
          duration: 800,
          delay: 3000,
          onComplete: () => {
            title.destroy();
            description.destroy();
          }
        });
      }
    });

    // Trigger feedback
    this.feedbackSystem.triggerFeedback({
      type: moment.type === 'discovery' ? 'milestone' : 'combo',
      intensity: 1.0,
      text: moment.title
    });

    // Apply rewards
    if (moment.reward) {
      this.applyReward(moment.reward);
    }

    this.lastBigMoment = this.scene.time.now;
  }

  /**
   * Apply reward from exciting moment
   */
  private applyReward(reward: ExcitingMoment['reward']): void {
    if (!reward) return;

    // Resources would be added to game state
    if (reward.resources) {
      // Game state would be updated
      console.log('Reward applied:', reward.resources);
    }

    // Unlocks would be granted
    if (reward.unlock) {
      console.log('Unlock granted:', reward.unlock);
    }

    // Bonuses would be applied
    if (reward.bonus) {
      // Bonus would be tracked and applied
      console.log('Bonus active:', reward.bonus);
    }
  }

  /**
   * Update fun metrics
   */
  private updateFunMetrics(
    action: string,
    intensity: number,
    powerPlayCount: number,
    momentCount: number
  ): void {
    // Satisfaction score (weighted average of recent actions)
    const feedbackScore = intensity * 0.6 + (powerPlayCount > 0 ? 0.3 : 0) + (momentCount > 0 ? 0.4 : 0);
    this.actionHistory.push({
      action,
      timestamp: Date.now(),
      feedback: feedbackScore
    });

    // Keep only last 20 actions
    if (this.actionHistory.length > 20) {
      this.actionHistory.shift();
    }

    // Calculate average satisfaction
    const avgFeedback = this.actionHistory.reduce((sum, a) => sum + a.feedback, 0) / this.actionHistory.length;
    this.funMetrics.satisfactionScore = avgFeedback;

    // Excitement level (based on recent big moments)
    const timeSinceBigMoment = this.scene.time.now - this.lastBigMoment;
    const excitement = momentCount > 0 ? 1.0 : Math.max(0.2, 1 - timeSinceBigMoment / 60000);
    this.funMetrics.excitementLevel = excitement;

    // Flow state (consistent actions = flow)
    const recentActions = this.actionHistory.slice(-5);
    const timeVariance = this.calculateTimeVariance(recentActions);
    const flowState = 1 - Math.min(1, timeVariance / 5000); // Lower variance = higher flow
    this.funMetrics.flowState = flowState;

    // Feedback quality
    this.funMetrics.feedbackQuality = intensity;
  }

  /**
   * Calculate time variance between actions
   */
  private calculateTimeVariance(actions: typeof this.actionHistory): number {
    if (actions.length < 2) return 0;

    const intervals: number[] = [];
    for (let i = 1; i < actions.length; i++) {
      intervals.push(actions[i].timestamp - actions[i - 1].timestamp);
    }

    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avg, 2), 0) / intervals.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Get fun metrics
   */
  getFunMetrics(): FunMetrics {
    return { ...this.funMetrics };
  }

  /**
   * Get power play bonuses
   */
  getPowerPlayBonuses() {
    return this.powerPlaySystem.getActiveBonuses();
  }

  /**
   * Get active power plays
   */
  getActivePowerPlays() {
    return this.powerPlaySystem.getActivePowerPlays();
  }

  /**
   * Update systems
   */
  update(deltaTime: number): void {
    this.powerPlaySystem.update(deltaTime);
    
    // Ensure we have big moments periodically (every 2 minutes if no big moments)
    const timeSinceBigMoment = this.scene.time.now - this.lastBigMoment;
    if (timeSinceBigMoment > 120000 && this.funMetrics.excitementLevel < 0.3) {
      // Trigger a small exciting moment to keep player engaged
      // This would be handled by exciting moments system
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.feedbackSystem.cleanup();
  }
}

