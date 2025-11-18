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
  private oscillator2?: OscillatorNode; // Second oscillator for detuning
  private oscillator3?: OscillatorNode; // Third oscillator for harmonics
  private gain?: GainNode;
  private gain2?: GainNode; // For second oscillator
  private gain3?: GainNode; // For third oscillator
  private lfo?: OscillatorNode;
  private lfo2?: OscillatorNode; // Second LFO for more complex modulation
  private lfoGain?: GainNode;
  private lfo2Gain?: GainNode;
  private filter?: BiquadFilterNode;
  private filter2?: BiquadFilterNode; // Second filter for layered texture
  private delay?: DelayNode;
  private delayGain?: GainNode;
  private reverb?: ConvolverNode;
  private reverbGain?: GainNode;
  private distortion?: WaveShaperNode;
  private distortionGain?: GainNode;
  private phaser?: BiquadFilterNode[];
  private phaserLfo?: OscillatorNode;
  private phaserGain?: GainNode;
  private isPlaying = false;

  // Synth parameters (from playbook recipe)
  private baseFreq = 220; // Hz (A3)
  private modulationDepth = 0.3;
  private lfoRate = 0.25; // Hz (slow breathing)
  private lfo2Rate = 0.15; // Hz (slower secondary modulation)
  private detuneAmount = 0.02; // Detuning for oscillator 2 (2% detune)
  private harmonicRatio = 1.5; // Oscillator 3 frequency ratio (perfect fifth)
  private randomVariation = 0.05; // Random variation for organic feel

  private constructor() {
    this.audioManager = AudioManager.instance();
  }

  async init(): Promise<void> {
    try {
      await this.audioManager.init();
      this.audioContext = this.audioManager.getAudioContext();
      
      if (!this.audioContext) {
        throw new Error('AudioContext not available after initialization');
      }
    } catch (error) {
      console.error('ChromaPulseSynth: Failed to initialize', error);
      throw error;
    }
  }

  /**
   * Start chroma pulse synth
   */
  async start(): Promise<void> {
    if (this.isPlaying) return;

    if (!this.audioContext) {
      console.error('ChromaPulseSynth: Cannot start - AudioContext not initialized. Call init() first.');
      return;
    }

    // Check if audio context is in a valid state
    if (this.audioContext.state === 'closed') {
      console.error('ChromaPulseSynth: Cannot start - AudioContext is closed');
      return;
    }

    // Resume audio context if suspended (required for user interaction)
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.error('ChromaPulseSynth: Failed to resume AudioContext', error);
        return;
      }
    }

    const ctx = this.audioContext;

    try {

      // Main oscillator (sine + saw mix)
      this.oscillator = ctx.createOscillator();
      if (!this.oscillator) {
        throw new Error('Failed to create oscillator');
      }
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = this.baseFreq;

      // LFO for filter modulation (breathing effect)
      this.lfo = ctx.createOscillator();
      if (!this.lfo) {
        throw new Error('Failed to create LFO oscillator');
      }
      this.lfo.type = 'sine';
      this.lfo.frequency.value = this.lfoRate;

      // Filter (bandpass per playbook)
      this.filter = ctx.createBiquadFilter();
      if (!this.filter) {
        throw new Error('Failed to create filter');
      }
      this.filter.type = 'bandpass';
      const filterCenterFreq = 1200; // Centered ~1.2 kHz
      this.filter.frequency.value = filterCenterFreq;
      this.filter.Q.value = 1.2;

      this.lfoGain = ctx.createGain();
      if (!this.lfoGain) {
        throw new Error('Failed to create LFO gain node');
      }
      // LFO gain should modulate relative to filter center frequency, not oscillator frequency
      this.lfoGain.gain.value = filterCenterFreq * this.modulationDepth;

      // Gain node
      this.gain = ctx.createGain();
      if (!this.gain) {
        throw new Error('Failed to create gain node');
      }
      this.gain.gain.value = 0.3; // Start at 30% volume

      // Create chorus effect (simple delay-based)
      this.delay = ctx.createDelay(0.02);
      if (!this.delay) {
        throw new Error('Failed to create delay node');
      }
      this.delayGain = ctx.createGain();
      if (!this.delayGain) {
        throw new Error('Failed to create delay gain node');
      }
      this.delayGain.gain.value = 0.3;
      this.delay.delayTime.value = 0.01;

      // Connect: LFO -> filter frequency
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.filter.frequency);

      // Connect: oscillator -> filter -> delay -> gain -> output
      this.oscillator.connect(this.filter);
      this.filter.connect(this.gain);
      this.filter.connect(this.delay);
      this.delay.connect(this.delayGain);
      this.delayGain.connect(this.gain);

      // Connect to ambient/SFX gain (not music)  
      const sfxGain = this.audioManager.getSfxGainNode();
      if (!sfxGain) {
        throw new Error('SFX gain node not available');
      }
      this.gain.connect(sfxGain);

      // Start oscillators
      this.oscillator.start(0);
      this.lfo.start(0);

      this.isPlaying = true;
      this.updateFromChroma();
    } catch (error) {
      console.error('ChromaPulseSynth: Error starting synth', error);
      // Clean up on error
      this.stop();
      throw error;
    }
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
          // Oscillator might already be stopped or in invalid state
          console.warn('ChromaPulseSynth: Error stopping oscillator', e);
        }
      }

      if (this.lfo) {
        try {
          this.lfo.stop();
        } catch (e) {
          // LFO might already be stopped or in invalid state
          console.warn('ChromaPulseSynth: Error stopping LFO', e);
        }
      }
    } catch (e) {
      console.warn('ChromaPulseSynth: Error during stop operation', e);
    }

    // Disconnect all nodes safely
    try {
      this.oscillator?.disconnect();
      this.lfo?.disconnect();
      this.filter?.disconnect();
      this.gain?.disconnect();
      this.lfoGain?.disconnect();
      this.delay?.disconnect();
      this.delayGain?.disconnect();
    } catch (e) {
      console.warn('ChromaPulseSynth: Error disconnecting nodes', e);
    }

    // Clear references
    this.oscillator = undefined;
    this.lfo = undefined;
    this.filter = undefined;
    this.gain = undefined;
    this.lfoGain = undefined;
    this.delay = undefined;
    this.delayGain = undefined;

    this.isPlaying = false;
  }

  /**
   * Update synth parameters based on Chroma level
   */
  updateFromChroma(): void {
    if (!this.isPlaying || !this.oscillator || !this.filter) return;

    if (!this.audioContext) {
      console.warn('ChromaPulseSynth: Cannot update - AudioContext not available');
      return;
    }

    try {
      const adaptiveEffects = AdaptiveEffects.instance();
      if (!adaptiveEffects) {
        console.warn('ChromaPulseSynth: AdaptiveEffects instance not available');
        return;
      }

      const chromaLevel = adaptiveEffects.getChromaLevel();
      
      // Validate chroma level (should be 0-1)
      if (typeof chromaLevel !== 'number' || isNaN(chromaLevel) || chromaLevel < 0 || chromaLevel > 1) {
        console.warn('ChromaPulseSynth: Invalid chroma level', chromaLevel);
        return;
      }

      const now = this.audioContext.currentTime;

      // Frequency scales with chroma (0.8x - 1.4x base freq)
      const targetFreq = this.baseFreq * (0.8 + chromaLevel * 0.6);
      if (targetFreq > 0 && targetFreq < 20000) { // Valid frequency range
        this.oscillator.frequency.cancelScheduledValues(now);
        this.oscillator.frequency.setValueAtTime(this.oscillator.frequency.value, now);
        this.oscillator.frequency.linearRampToValueAtTime(targetFreq, now + 0.1);
      }

      // Filter Q increases with chroma (more resonance = more harmonics)
      const targetQ = 0.8 + (chromaLevel * 0.6);
      if (targetQ > 0 && targetQ < 30) { // Valid Q range
        this.filter.Q.cancelScheduledValues(now);
        this.filter.Q.setValueAtTime(this.filter.Q.value, now);
        this.filter.Q.linearRampToValueAtTime(targetQ, now + 0.1);
      }

      // Volume increases with chroma
      const targetVolume = 0.2 + (chromaLevel * 0.3);
      if (this.gain && targetVolume >= 0 && targetVolume <= 1) {
        this.gain.gain.cancelScheduledValues(now);
        this.gain.gain.setValueAtTime(this.gain.gain.value, now);
        this.gain.gain.linearRampToValueAtTime(targetVolume, now + 0.1);
      }
    } catch (error) {
      console.error('ChromaPulseSynth: Error updating from chroma', error);
    }
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    // Validate volume parameter
    if (typeof volume !== 'number' || isNaN(volume)) {
      console.warn('ChromaPulseSynth: Invalid volume parameter', volume);
      return;
    }

    // Clamp volume to valid range [0, 1]
    const clampedVolume = Math.max(0, Math.min(1, volume));

    if (!this.gain) {
      console.warn('ChromaPulseSynth: Cannot set volume - gain node not available');
      return;
    }

    if (!this.audioContext) {
      console.warn('ChromaPulseSynth: Cannot set volume - AudioContext not available');
      return;
    }

    try {
      const now = this.audioContext.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(clampedVolume, now);
    } catch (error) {
      console.error('ChromaPulseSynth: Error setting volume', error);
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
      console.error('ChromaPulseSynth: Error during dispose', error);
    }
    
    // Clear singleton instance
    if (ChromaPulseSynth._instance === this) {
      ChromaPulseSynth._instance = null;
    }
  }
}

