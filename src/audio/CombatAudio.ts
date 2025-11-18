/**
 * Combat Audio Hooks
 * 
 * Triggers SFX based on combat events:
 * - Unit attacks
 * - Hits/impacts
 * - Destruction
 * - Hero ultimates
 */

import SFXManager from './SFXManager';
import type { PlaybackHandle } from './SFXManager';

export interface CombatEvent {
  type: 'attack' | 'hit' | 'destroyed' | 'ult_charge' | 'ult_impact';
  position?: { x: number; y: number };
  volume?: number;
  pitch?: number;
}

/**
 * Combat Audio Manager
 * Handles all combat-related sound effects
 */
export default class CombatAudio {
  private static _instance: CombatAudio | null = null;
  public static instance(): CombatAudio {
    if (!this._instance) this._instance = new CombatAudio();
    return this._instance;
  }

  private sfxManager: SFXManager;
  private activeUltCharges: Map<string, PlaybackHandle> = new Map();

  private constructor() {
    this.sfxManager = SFXManager.instance();
  }

  /**
   * Handle combat event
   */
  onCombatEvent(event: CombatEvent): void {
    const volume = event.volume ?? 1.0;

    switch (event.type) {
      case 'attack':
        this.onAttack(volume);
        break;
      case 'hit':
        this.onHit(volume);
        break;
      case 'destroyed':
        this.onDestroyed(volume);
        break;
      case 'ult_charge':
        this.onUltCharge(event.position?.x.toString() || 'default', volume);
        break;
      case 'ult_impact':
        this.onUltImpact(volume);
        break;
    }
  }

  /**
   * Unit attack sound
   */
  onAttack(volume: number = 0.9): PlaybackHandle | null {
    return this.sfxManager.playUnitAttack();
  }

  /**
   * Unit hit/impact sound
   */
  onHit(volume: number = 0.8): PlaybackHandle | null {
    return this.sfxManager.playUnitHit();
  }

  /**
   * Unit destroyed sound
   */
  onDestroyed(volume: number = 1.0): PlaybackHandle | null {
    return this.sfxManager.playUnitDestroyed();
  }

  /**
   * Hero ultimate charge (looping buildup)
   */
  onUltCharge(unitId: string, volume: number = 1.0): void {
    // Stop existing charge if any
    if (this.activeUltCharges.has(unitId)) {
      this.stopUltCharge(unitId);
    }

    const handle = this.sfxManager.playCue('Hero_Ult_Charge', {
      volume,
      pitch: 1.0
    });

    if (handle) {
      this.activeUltCharges.set(unitId, handle);
    }
  }

  /**
   * Stop ultimate charge
   */
  stopUltCharge(unitId: string): void {
    const handle = this.activeUltCharges.get(unitId);
    if (handle) {
      handle.stop();
      this.activeUltCharges.delete(unitId);
    }
  }

  /**
   * Hero ultimate impact
   */
  onUltImpact(volume: number = 1.0): PlaybackHandle | null {
    // Stop all active charges
    this.activeUltCharges.forEach(handle => handle.stop());
    this.activeUltCharges.clear();

    // Play impact
    return this.sfxManager.playCue('Ultimate_Impact', { volume });
  }

  /**
   * Quick attack sequence (for burst fire)
   */
  playAttackSequence(count: number, interval: number = 0.1): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.onAttack(0.8);
      }, i * interval * 1000);
    }
  }

  /**
   * Clean up
   */
  dispose(): void {
    this.activeUltCharges.forEach(handle => handle.stop());
    this.activeUltCharges.clear();
  }
}

