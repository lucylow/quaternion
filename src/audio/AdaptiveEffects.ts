/**
 * Adaptive Effects - Chroma & Instability Reactive Audio
 * 
 * Procedural effects that react to world state:
 * - Chroma intensity morphing (harmonic content changes)
 * - Instability alarms (parameterized siren)
 * - Procedural particle impacts
 * - Dialogue mood morphing
 */

import AudioManager from './AudioManager';
import SFXManager from './SFXManager';

export interface AdaptiveEffectParams {
  chromaLevel: number;      // 0-1, world energy balance
  instabilityLevel: number; // 0-1, world collapse rate
  particleCount?: number;   // For granular effects
}

/**
 * Adaptive Effects Manager
 * Modifies audio parameters based on game state
 */
export default class AdaptiveEffects {
  private static _instance: AdaptiveEffects | null = null;
  public static instance(): AdaptiveEffects {
    if (!this._instance) this._instance = new AdaptiveEffects();
    return this._instance;
  }

  private audioManager: AudioManager;
  private sfxManager: SFXManager;
  private audioContext!: AudioContext;

  // Adaptive audio nodes
  private instabilityAlarm?: OscillatorNode;
  private instabilityGain?: GainNode;
  private chromaFilter?: BiquadFilterNode;

  // Current parameters
  private currentChroma = 0.5;
  private currentInstability = 0.0;

  private constructor() {
    this.audioManager = AudioManager.instance();
    this.sfxManager = SFXManager.instance();
  }

  async init(): Promise<void> {
    try {
      await this.audioManager.init();
      this.audioContext = this.audioManager.getAudioContext();
      if (!this.audioContext) {
        console.warn('Audio context not available for AdaptiveEffects');
        return;
      }
      this.setupAdaptiveNodes();
    } catch (error) {
      console.error('AdaptiveEffects initialization failed:', error);
      // Don't throw - allow game to continue without adaptive effects
    }
  }

  /**
   * Setup adaptive audio processing nodes
   */
  private setupAdaptiveNodes(): void {
    try {
      const ctx = this.audioContext;
      if (!ctx || ctx.state === 'closed') {
        console.warn('Audio context not available for adaptive nodes');
        return;
      }

      // Instability alarm oscillator
      try {
        this.instabilityAlarm = ctx.createOscillator();
        this.instabilityAlarm.type = 'sine';
        this.instabilityGain = ctx.createGain();
        this.instabilityGain.gain.value = 0;
        this.instabilityAlarm.connect(this.instabilityGain);
        this.instabilityGain.connect(this.audioManager.getSfxGainNode());
        this.instabilityAlarm.start(0);
      } catch (error) {
        console.error('Failed to create instability alarm:', error);
        // Continue without alarm
      }

      // Chroma filter for ambient morphing
      try {
        this.chromaFilter = ctx.createBiquadFilter();
        this.chromaFilter.type = 'lowpass';
        this.chromaFilter.frequency.value = 8000;
        this.chromaFilter.Q.value = 1.2;
      } catch (error) {
        console.error('Failed to create chroma filter:', error);
        // Continue without filter
      }
    } catch (error) {
      console.error('Failed to setup adaptive nodes:', error);
      // Don't throw - allow game to continue
    }
  }

  /**
   * Update adaptive effects based on game state
   */
  update(params: AdaptiveEffectParams): void {
    try {
      this.currentChroma = Math.max(0, Math.min(1, params.chromaLevel));
      this.currentInstability = Math.max(0, Math.min(1, params.instabilityLevel));

      this.updateChromaEffects();
      this.updateInstabilityEffects();
      this.updateParticleEffects(params.particleCount || 0);
    } catch (error) {
      console.error('Error updating adaptive effects:', error);
      // Don't throw - allow game to continue
    }
  }

  /**
   * Chroma intensity morphing
   * As Chroma rises, add harmonic partials and widen stereo
   */
  private updateChromaEffects(): void {
    if (!this.chromaFilter || !this.audioContext) return;

    try {
      const now = this.audioContext.currentTime;

      // Lowpass filter opens up with chroma (more harmonics)
      try {
        const targetFreq = 2000 + (this.currentChroma * 6000); // 2kHz - 8kHz
        this.chromaFilter.frequency.cancelScheduledValues(now);
        this.chromaFilter.frequency.setValueAtTime(this.chromaFilter.frequency.value, now);
        this.chromaFilter.frequency.linearRampToValueAtTime(targetFreq, now + 0.1);
      } catch (error) {
        console.warn('Failed to update chroma filter frequency:', error);
      }

      // Q increases with chroma (sharper resonance = more harmonics)
      try {
        const targetQ = 0.8 + (this.currentChroma * 0.6);
        this.chromaFilter.Q.cancelScheduledValues(now);
        this.chromaFilter.Q.setValueAtTime(this.chromaFilter.Q.value, now);
        this.chromaFilter.Q.linearRampToValueAtTime(targetQ, now + 0.1);
      } catch (error) {
        console.warn('Failed to update chroma filter Q:', error);
      }

      // Music pitch modulation based on chroma
      try {
        const musicVolume = 0.7 + (this.currentChroma * 0.3);
        this.audioManager.setMusicVolume(musicVolume);
      } catch (error) {
        console.warn('Failed to update music volume:', error);
      }
    } catch (error) {
      console.error('Error updating chroma effects:', error);
    }
  }

  /**
   * Instability alarm - parameterized siren
   * Rate increases with instability (0 = calm, 1 = frantic)
   */
  private updateInstabilityEffects(): void {
    if (!this.instabilityAlarm || !this.instabilityGain || !this.audioContext) return;

    try {
      const now = this.audioContext.currentTime;

      if (this.currentInstability < 0.1) {
        // Silent when calm
        try {
          this.instabilityGain.gain.cancelScheduledValues(now);
          this.instabilityGain.gain.setValueAtTime(0, now);
        } catch (error) {
          console.warn('Failed to set instability gain to 0:', error);
        }
        return;
      }

      // Frequency oscillation rate increases with instability
      try {
        const baseFreq = 200; // Hz
        const modDepth = 100; // Hz
        const modRate = 0.5 + (this.currentInstability * 3.5); // 0.5 - 4 Hz modulation

        // Oscillate frequency
        const time = this.audioContext.currentTime;
        const mod = Math.sin(2 * Math.PI * modRate * time) * modDepth;
        const targetFreq = baseFreq + mod;

        this.instabilityAlarm.frequency.cancelScheduledValues(now);
        this.instabilityAlarm.frequency.setValueAtTime(targetFreq, now);
      } catch (error) {
        console.warn('Failed to update instability frequency:', error);
      }

      // Volume increases with instability
      try {
        const targetGain = this.currentInstability * 0.3; // Max 30% volume
        this.instabilityGain.gain.cancelScheduledValues(now);
        this.instabilityGain.gain.setValueAtTime(this.instabilityGain.gain.value, now);
        this.instabilityGain.gain.linearRampToValueAtTime(targetGain, now + 0.2);
      } catch (error) {
        console.warn('Failed to update instability gain:', error);
      }

      // Ambient volume increases with instability
      // Apply to ambient loops if playing
      // This would need integration with terrain audio system
    } catch (error) {
      console.error('Error updating instability effects:', error);
    }
  }

  /**
   * Procedural particle impacts
   * Density scales with particle count
   */
  private updateParticleEffects(particleCount: number): void {
    try {
      // Trigger granular hits based on particle density
      if (particleCount > 0 && Math.random() < particleCount / 1000) {
        // Play impact sound with volume based on density
        const volume = Math.min(1, particleCount / 500);
        this.sfxManager.playCue('Electro_Spark', { volume: volume * 0.5 });
      }
    } catch (error) {
      console.warn('Failed to update particle effects:', error);
      // Don't throw - particle effects are non-critical
    }
  }

  /**
   * Apply chroma filter to an audio node
   */
  applyChromaFilter(source: AudioNode): AudioNode {
    if (!this.chromaFilter) return source;
    source.connect(this.chromaFilter);
    return this.chromaFilter;
  }

  /**
   * Get current chroma level
   */
  getChromaLevel(): number {
    return this.currentChroma;
  }

  /**
   * Get current instability level
   */
  getInstabilityLevel(): number {
    return this.currentInstability;
  }

  /**
   * Clean up
   */
  dispose(): void {
    try {
      if (this.instabilityAlarm) {
        try {
          this.instabilityAlarm.stop();
        } catch (error) {
          // Ignore stop errors
        }
        try {
          this.instabilityAlarm.disconnect();
        } catch (error) {
          // Ignore disconnect errors
        }
      }
      if (this.instabilityGain) {
        try {
          this.instabilityGain.disconnect();
        } catch (error) {
          // Ignore disconnect errors
        }
      }
      if (this.chromaFilter) {
        try {
          this.chromaFilter.disconnect();
        } catch (error) {
          // Ignore disconnect errors
        }
      }
    } catch (error) {
      console.error('Error disposing AdaptiveEffects:', error);
    }
  }
}

