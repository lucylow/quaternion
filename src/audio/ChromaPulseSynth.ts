/**
 * Chroma Pulse Synth
 * 
 * Procedurally generates a tonal hum that evolves with Chroma energy.
 * No samples needed - pure synthesis.
 * Based on playbook recipe: Chroma Pulse (lead tonal layer)
 */

import AudioManager from './AudioManager';
import AdaptiveEffects from './AdaptiveEffects';

/**
 * Chroma Pulse Synth
 * Generates procedural chroma pulse sound
 */
export default class ChromaPulseSynth {
  private static _instance: ChromaPulseSynth | null = null;
  public static instance(): ChromaPulseSynth {
    if (!this._instance) this._instance = new ChromaPulseSynth();
    return this._instance;
  }

  private audioManager: AudioManager;
  private audioContext!: AudioContext;
  private oscillator?: OscillatorNode;
  private gain?: GainNode;
  private lfo?: OscillatorNode;
  private lfoGain?: GainNode;
  private filter?: BiquadFilterNode;
  private isPlaying = false;

  // Synth parameters (from playbook recipe)
  private baseFreq = 220; // Hz (A3)
  private modulationDepth = 0.3;
  private lfoRate = 0.25; // Hz (slow breathing)

  private constructor() {
    this.audioManager = AudioManager.instance();
  }

  async init(): Promise<void> {
    try {
      await this.audioManager.init();
      this.audioContext = this.audioManager.getAudioContext();
      if (!this.audioContext) {
        throw new Error('Audio context not available');
      }
    } catch (error) {
      console.error('ChromaPulseSynth initialization failed:', error);
      // Don't throw - allow game to continue without audio
      // The synth will gracefully fail when start() is called
    }
  }

  /**
   * Start chroma pulse synth
   */
  start(): void {
    if (this.isPlaying) return;
    
    try {
      if (!this.audioContext) {
        console.warn('ChromaPulseSynth not initialized. Audio will be disabled.');
        return;
      }

      const ctx = this.audioContext;

      // Check if audio context is in a valid state
      if (ctx.state === 'closed') {
        console.warn('Audio context is closed. Cannot start synth.');
        return;
      }

      // Main oscillator (sine + saw mix)
      try {
        this.oscillator = ctx.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.value = this.baseFreq;
      } catch (error) {
        console.error('Failed to create oscillator:', error);
        return;
      }

      // LFO for filter modulation (breathing effect)
      try {
        this.lfo = ctx.createOscillator();
        this.lfo.type = 'sine';
        this.lfo.frequency.value = this.lfoRate;

        this.lfoGain = ctx.createGain();
        this.lfoGain.gain.value = this.baseFreq * this.modulationDepth;
      } catch (error) {
        console.error('Failed to create LFO:', error);
        this.oscillator?.disconnect();
        this.oscillator = undefined;
        return;
      }

      // Filter (bandpass per playbook)
      try {
        this.filter = ctx.createBiquadFilter();
        this.filter.type = 'bandpass';
        this.filter.frequency.value = 1200; // Centered ~1.2 kHz
        this.filter.Q.value = 1.2;
      } catch (error) {
        console.error('Failed to create filter:', error);
        this.cleanupNodes();
        return;
      }

      // Gain node
      try {
        this.gain = ctx.createGain();
        this.gain.gain.value = 0.3; // Start at 30% volume
      } catch (error) {
        console.error('Failed to create gain node:', error);
        this.cleanupNodes();
        return;
      }

      // Create chorus effect (simple delay-based)
      let delay: DelayNode | undefined;
      let delayGain: GainNode | undefined;
      try {
        delay = ctx.createDelay(0.02);
        delayGain = ctx.createGain();
        delayGain.gain.value = 0.3;
        delay.delayTime.value = 0.01;
      } catch (error) {
        console.warn('Failed to create delay effect (non-critical):', error);
        // Continue without delay effect
      }

      // Connect: LFO -> filter frequency
      try {
        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.filter.frequency);
      } catch (error) {
        console.error('Failed to connect LFO:', error);
        this.cleanupNodes();
        return;
      }

      // Connect: oscillator -> filter -> delay -> gain -> output
      try {
        this.oscillator.connect(this.filter);
        this.filter.connect(this.gain);
        if (delay && delayGain) {
          this.filter.connect(delay);
          delay.connect(delayGain);
          delayGain.connect(this.gain);
        }
      } catch (error) {
        console.error('Failed to connect audio nodes:', error);
        this.cleanupNodes();
        return;
      }

      // Connect to ambient/SFX gain (not music)  
      try {
        if (this.gain) {
          this.gain.connect(this.audioManager.getSfxGainNode());
        }
      } catch (error) {
        console.error('Failed to connect to SFX gain:', error);
        this.cleanupNodes();
        return;
      }

      // Start oscillators
      try {
        this.oscillator.start(0);
        this.lfo.start(0);
      } catch (error) {
        console.error('Failed to start oscillators:', error);
        this.cleanupNodes();
        return;
      }

      this.isPlaying = true;
      this.updateFromChroma();
    } catch (error) {
      console.error('Unexpected error starting ChromaPulseSynth:', error);
      this.cleanupNodes();
      this.isPlaying = false;
    }
  }

  /**
   * Clean up audio nodes on error
   */
  private cleanupNodes(): void {
    try {
      this.oscillator?.disconnect();
      this.lfo?.disconnect();
      this.filter?.disconnect();
      this.gain?.disconnect();
      this.lfoGain?.disconnect();
    } catch (error) {
      // Ignore cleanup errors
    }
    this.oscillator = undefined;
    this.lfo = undefined;
    this.filter = undefined;
    this.gain = undefined;
    this.lfoGain = undefined;
  }

  /**
   * Stop chroma pulse synth
   */
  stop(): void {
    if (!this.isPlaying) return;

    try {
      // Stop oscillators safely
      if (this.oscillator) {
        try {
          this.oscillator.stop();
        } catch (e) {
          // Ignore - might already be stopped or in invalid state
        }
      }
      if (this.lfo) {
        try {
          this.lfo.stop();
        } catch (e) {
          // Ignore - might already be stopped or in invalid state
        }
      }
    } catch (e) {
      // Ignore stop errors
    }

    // Disconnect all nodes safely
    try {
      this.oscillator?.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    try {
      this.lfo?.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    try {
      this.filter?.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    try {
      this.gain?.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    try {
      this.lfoGain?.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }

    this.oscillator = undefined;
    this.lfo = undefined;
    this.filter = undefined;
    this.gain = undefined;
    this.lfoGain = undefined;

    this.isPlaying = false;
  }

  /**
   * Update synth parameters based on Chroma level
   */
  updateFromChroma(): void {
    if (!this.isPlaying || !this.oscillator || !this.filter) return;
    if (!this.audioContext) return;

    try {
      const adaptiveEffects = AdaptiveEffects.instance();
      const chromaLevel = adaptiveEffects.getChromaLevel();

      const now = this.audioContext.currentTime;

      // Frequency scales with chroma (0.8x - 1.4x base freq)
      try {
        const targetFreq = this.baseFreq * (0.8 + chromaLevel * 0.6);
        this.oscillator.frequency.cancelScheduledValues(now);
        this.oscillator.frequency.setValueAtTime(this.oscillator.frequency.value, now);
        this.oscillator.frequency.linearRampToValueAtTime(targetFreq, now + 0.1);
      } catch (error) {
        console.warn('Failed to update oscillator frequency:', error);
      }

      // Filter Q increases with chroma (more resonance = more harmonics)
      try {
        const targetQ = 0.8 + (chromaLevel * 0.6);
        this.filter.Q.cancelScheduledValues(now);
        this.filter.Q.setValueAtTime(this.filter.Q.value, now);
        this.filter.Q.linearRampToValueAtTime(targetQ, now + 0.1);
      } catch (error) {
        console.warn('Failed to update filter Q:', error);
      }

      // Volume increases with chroma
      if (this.gain) {
        try {
          const targetVolume = 0.2 + (chromaLevel * 0.3);
          this.gain.gain.cancelScheduledValues(now);
          this.gain.gain.setValueAtTime(this.gain.gain.value, now);
          this.gain.gain.linearRampToValueAtTime(targetVolume, now + 0.1);
        } catch (error) {
          console.warn('Failed to update gain:', error);
        }
      }
    } catch (error) {
      console.error('Error updating chroma synth:', error);
      // Don't throw - allow game to continue
    }
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    if (!this.audioContext || !this.gain) return;
    
    try {
      const now = this.audioContext.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(volume, now);
    } catch (error) {
      console.warn('Failed to set volume:', error);
    }
  }

  /**
   * Check if playing
   */
  isActive(): boolean {
    return this.isPlaying;
  }

  /**
   * Clean up
   */
  dispose(): void {
    try {
      this.stop();
    } catch (error) {
      console.error('Error disposing ChromaPulseSynth:', error);
    }
  }
}

