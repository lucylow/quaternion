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
    const position = event.position ? { ...event.position, z: 0 } : undefined;

    switch (event.type) {
      case 'attack':
        this.onAttack(volume, position);
        break;
      case 'hit':
        this.onHit(volume, position);
        break;
      case 'destroyed':
        this.onDestroyed(volume, position);
        break;
      case 'ult_charge':
        this.onUltCharge(event.position?.x.toString() || 'default', volume);
        break;
      case 'ult_impact':
        this.onUltImpact(volume, position);
        break;
    }
  }

  /**
   * Unit attack sound with layered effects
   */
  onAttack(volume: number = 0.9, position?: { x: number; y: number; z?: number }): PlaybackHandle | null {
    const handle = this.sfxManager.playUnitAttack(position);
    
    // Add subtle impact layer for more punch (slightly delayed)
    setTimeout(() => {
      this.sfxManager.playCue('Unit_Hit_Impact', {
        volume: volume * 0.3, // Quieter layer
        pitch: 1.2, // Higher pitch for snap
        position,
        effects: {
          compression: true,
          highpass: 200, // Remove low end
        }
      });
    }, 50); // 50ms delay for layering
    
    return handle;
  }

  /**
   * Unit hit/impact sound with variation
   */
  onHit(volume: number = 0.8, position?: { x: number; y: number; z?: number }): PlaybackHandle | null {
    const handle = this.sfxManager.playUnitHit(position);
    
    // Add spark layer for metallic hits
    if (Math.random() < 0.3) { // 30% chance
      setTimeout(() => {
        this.sfxManager.playCue('Electro_Spark', {
          volume: volume * 0.2,
          pitch: 1.5 + Math.random() * 0.5,
          position,
          effects: {
            highpass: 1000, // High frequencies only
          }
        });
      }, 20);
    }
    
    return handle;
  }

  /**
   * Unit destroyed sound with layered explosion
   */
  onDestroyed(volume: number = 1.0, position?: { x: number; y: number; z?: number }): PlaybackHandle | null {
    const handle = this.sfxManager.playUnitDestroyed(position);
    
    // Add debris layer
    setTimeout(() => {
      this.sfxManager.playCue('Unit_Destroyed_Blast', {
        volume: volume * 0.4,
        pitch: 0.7, // Lower pitch for debris
        position,
        effects: {
          lowpass: 3000, // Muffled debris
          reverb: 0.5, // More reverb for debris
        }
      });
    }, 200);
    
    // Add spark layer
    setTimeout(() => {
      this.sfxManager.playCue('Electro_Spark', {
        volume: volume * 0.3,
        pitch: 0.8 + Math.random() * 0.4,
        position,
        effects: {
          highpass: 800,
        }
      });
    }, 150);
    
    return handle;
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
   * Hero ultimate impact with layered effects
   */
  onUltImpact(volume: number = 1.0, position?: { x: number; y: number; z?: number }): PlaybackHandle | null {
    // Stop all active charges
    this.activeUltCharges.forEach(handle => handle.stop());
    this.activeUltCharges.clear();

    // Play main impact with heavy effects
    const handle = this.sfxManager.playCue('Ultimate_Impact', { 
      volume,
      position,
      effects: {
        compression: true,
        distortion: 0.4, // Heavy distortion
        reverb: 0.6, // Epic reverb
        lowpass: 10000, // Slight lowpass
      }
    });

    // Add layered explosion
    setTimeout(() => {
      this.sfxManager.playCue('Unit_Destroyed_Blast', {
        volume: volume * 0.5,
        pitch: 0.6, // Lower pitch for bass
        position,
        effects: {
          compression: true,
          distortion: 0.5,
          reverb: 0.7,
          lowpass: 5000,
        }
      });
    }, 100);

    // Add high-frequency spark layer
    setTimeout(() => {
      this.sfxManager.playCue('Electro_Spark', {
        volume: volume * 0.4,
        pitch: 2.0 + Math.random() * 1.0,
        position,
        effects: {
          highpass: 2000,
          reverb: 0.3,
        }
      });
    }, 50);

    return handle;
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


