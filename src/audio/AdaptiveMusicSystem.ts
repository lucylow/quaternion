/**
 * Adaptive Music System
 * Dynamically adjusts music stems based on game state, entropy, and control percentage
 */

import MusicManager from './MusicManager';
import type { QuaternionState } from '../game/strategic/QuaternionState';

export interface MusicState {
  entropy: number; // 0-1, chaos level
  control: number; // 0-1, player control percentage
  tension: number; // 0-1, overall tension
  factionBalance: number; // 0-1, 0 = Quaternion, 1 = Corp
}

export class AdaptiveMusicSystem {
  private musicManager: MusicManager;
  private currentState: MusicState = {
    entropy: 0.5,
    control: 0.5,
    tension: 0.5,
    factionBalance: 0.5
  };

  constructor() {
    this.musicManager = MusicManager.instance();
  }

  /**
   * Initialize music stems
   */
  async initializeStems(stemUrls: { id: string; url: string }[]): Promise<void> {
    await this.musicManager.loadStems(stemUrls);
    
    // Start with base ambient stem
    this.musicManager.playBase(['ambient']);
  }

  /**
   * Update music based on game state
   */
  updateFromGameState(gameState: QuaternionState): void {
    const musicState = this.calculateMusicState(gameState);
    this.updateMusic(musicState);
    this.currentState = musicState;
  }

  /**
   * Calculate music state from quaternion game state
   */
  private calculateMusicState(gameState: QuaternionState): MusicState {
    const { w, x, y, z } = gameState;
    const total = Math.abs(w) + Math.abs(x) + Math.abs(y) + Math.abs(z);

    if (total === 0) {
      return {
        entropy: 0.5,
        control: 0.5,
        tension: 0.5,
        factionBalance: 0.5
      };
    }

    // Calculate entropy (chaos level)
    const avg = total / 4;
    const variance = Math.sqrt(
      (Math.pow(Math.abs(w) - avg, 2) +
       Math.pow(Math.abs(x) - avg, 2) +
       Math.pow(Math.abs(y) - avg, 2) +
       Math.pow(Math.abs(z) - avg, 2)) / 4
    );
    const entropy = Math.min(1, variance / avg);

    // Calculate control (how balanced the state is)
    const control = 1 - entropy;

    // Calculate tension (increases with imbalance)
    const tension = entropy;

    // Calculate faction balance
    const quaternionPower = Math.abs(y) + Math.abs(z); // Life + Knowledge
    const corpPower = Math.abs(w) + Math.abs(x); // Matter + Energy
    const totalPower = quaternionPower + corpPower;
    const factionBalance = totalPower > 0 ? corpPower / totalPower : 0.5;

    return {
      entropy,
      control,
      tension,
      factionBalance
    };
  }

  /**
   * Update music stem volumes based on state
   */
  private updateMusic(state: MusicState): void {
    const { entropy, control, tension, factionBalance } = state;

    // Base volumes
    const ambientVolume = Math.max(0.2, 0.8 - tension * 0.6); // Calm = more ambient
    const tensionVolume = Math.max(0.1, tension * 0.8); // Tension = more tension stem
    const rhythmVolume = 0.3 + control * 0.5; // Control = more rhythm
    const triumphVolume = control > 0.7 ? 0.4 : 0.1; // High control = triumph

    // Faction-based modulation
    // Quaternion (biotech) = softer, more ambient
    // Corp (industrial) = harsher, more tension
    const factionMod = factionBalance; // 0 = Quaternion, 1 = Corp
    
    const adjustedAmbient = ambientVolume * (1 - factionMod * 0.3);
    const adjustedTension = tensionVolume * (0.7 + factionMod * 0.3);

    // Update stem volumes
    this.musicManager.setStemVolumes({
      ambient: adjustedAmbient,
      tension: adjustedTension,
      rhythm: rhythmVolume,
      triumph: triumphVolume
    }, 0.5); // 0.5s ramp time
  }

  /**
   * Trigger dramatic music shift (for events)
   */
  triggerDramaticShift(targetEntropy: number, duration: number = 2000): void {
    const originalEntropy = this.currentState.entropy;
    
    // Smoothly transition to target entropy
    const steps = 20;
    const stepDuration = duration / steps;
    const stepSize = (targetEntropy - originalEntropy) / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= steps) {
        clearInterval(interval);
        return;
      }

      const newEntropy = originalEntropy + stepSize * (currentStep + 1);
      this.updateMusic({
        ...this.currentState,
        entropy: newEntropy,
        tension: newEntropy
      });

      currentStep++;
    }, stepDuration);
  }

  /**
   * Get current music state
   */
  getCurrentState(): MusicState {
    return { ...this.currentState };
  }
}

