/**
 * Chroma Pulse Synth
 * 
 * Procedurally generates a tonal hum that evolves with Chroma energy.
 * No samples needed - pure synthesis.
 * Based on playbook recipe: Chroma Pulse (lead tonal layer)
 * Enhanced with multiple oscillators, effects, and dynamic modulation
 */

import AudioManager from './AudioManager';
import AdaptiveEffects from './AdaptiveEffects';
import { MusicPreset } from './MusicPreset';

/**
 * Chroma Pulse Synth
 * Generates procedural chroma pulse sound with rich harmonics and effects
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
  private updateInterval?: number;

  // Synth parameters (from playbook recipe)
  private baseFreq = 220; // Hz (A3)
  private modulationDepth = 0.3;
  private lfoRate = 0.25; // Hz (slow breathing)
  private lfo2Rate = 0.15; // Hz (slower secondary modulation)
  private detuneAmount = 0.02; // Detuning for oscillator 2 (2% detune)
  private harmonicRatio = 1.5; // Oscillator 3 frequency ratio (perfect fifth)
  private randomVariation = 0.05; // Random variation for organic feel
  
  // Preset-specific parameters
  private filterCenterFreq = 1200;
  private filterQ = 1.2;
  private mainVolume = 0.25;
  private detunedVolume = 0.15;
  private harmonicVolume = 0.1;
  private distortionAmount = 0.6;
  private phaserDepth = 500;
  private reverbAmount = 0.2;

  private constructor() {
    this.audioManager = AudioManager.instance();
  }

  async init(): Promise<void> {
    try {
      if (!this.audioManager) {
        throw new Error('AudioManager not available');
      }
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
   * Start chroma pulse synth with enhanced creative synthesis
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
      // Create main oscillator (sine wave - fundamental)
      this.oscillator = ctx.createOscillator();
      if (!this.oscillator) {
        throw new Error('Failed to create oscillator');
      }
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = this.baseFreq;

      // Create second oscillator (slightly detuned for chorus effect)
      this.oscillator2 = ctx.createOscillator();
      if (!this.oscillator2) {
        throw new Error('Failed to create oscillator2');
      }
      this.oscillator2.type = 'triangle'; // Different waveform for texture
      this.oscillator2.frequency.value = this.baseFreq * (1 + this.detuneAmount);

      // Create third oscillator (harmonic - perfect fifth)
      this.oscillator3 = ctx.createOscillator();
      if (!this.oscillator3) {
        throw new Error('Failed to create oscillator3');
      }
      this.oscillator3.type = 'sawtooth'; // Rich harmonics
      this.oscillator3.frequency.value = this.baseFreq * this.harmonicRatio;

      // Create LFOs for complex modulation
      this.lfo = ctx.createOscillator();
      if (!this.lfo) {
        throw new Error('Failed to create LFO oscillator');
      }
      this.lfo.type = 'sine';
      this.lfo.frequency.value = this.lfoRate;

      this.lfo2 = ctx.createOscillator();
      if (!this.lfo2) {
        throw new Error('Failed to create LFO2 oscillator');
      }
      this.lfo2.type = 'triangle'; // Different shape for more interesting modulation
      this.lfo2.frequency.value = this.lfo2Rate;

      this.lfoGain = ctx.createGain();
      if (!this.lfoGain) {
        throw new Error('Failed to create LFO gain node');
      }
      this.lfoGain.gain.value = this.filterCenterFreq * this.modulationDepth;

      this.lfo2Gain = ctx.createGain();
      if (!this.lfo2Gain) {
        throw new Error('Failed to create LFO2 gain node');
      }
      this.lfo2Gain.gain.value = this.filterCenterFreq * this.modulationDepth * 0.5; // Subtle secondary modulation

      // Create filters (layered for richer texture)
      this.filter = ctx.createBiquadFilter();
      if (!this.filter) {
        throw new Error('Failed to create filter');
      }
      this.filter.type = 'bandpass';
      this.filter.frequency.value = this.filterCenterFreq;
      this.filter.Q.value = this.filterQ;

      this.filter2 = ctx.createBiquadFilter();
      if (!this.filter2) {
        throw new Error('Failed to create filter2');
      }
      this.filter2.type = 'lowpass';
      this.filter2.frequency.value = 2000;
      this.filter2.Q.value = 0.7;

      // Create gain nodes for each oscillator
      this.gain = ctx.createGain();
      if (!this.gain) {
        throw new Error('Failed to create gain node');
      }
      this.gain.gain.value = this.mainVolume; // Main oscillator volume

      this.gain2 = ctx.createGain();
      if (!this.gain2) {
        throw new Error('Failed to create gain2 node');
      }
      this.gain2.gain.value = this.detunedVolume; // Detuned oscillator (quieter)

      this.gain3 = ctx.createGain();
      if (!this.gain3) {
        throw new Error('Failed to create gain3 node');
      }
      this.gain3.gain.value = this.harmonicVolume; // Harmonic oscillator (subtle)

      // Create delay/chorus effect with variation
      this.delay = ctx.createDelay(0.05);
      if (!this.delay) {
        throw new Error('Failed to create delay node');
      }
      this.delayGain = ctx.createGain();
      if (!this.delayGain) {
        throw new Error('Failed to create delay gain node');
      }
      this.delayGain.gain.value = 0.4;
      this.delay.delayTime.value = 0.015 + Math.random() * 0.01; // Slight random variation

      // Create distortion for character
      this.distortionGain = ctx.createGain();
      if (!this.distortionGain) {
        throw new Error('Failed to create distortion gain node');
      }
      this.distortionGain.gain.value = this.distortionAmount; // Pre-distortion gain

      this.distortion = ctx.createWaveShaper();
      if (!this.distortion) {
        throw new Error('Failed to create distortion node');
      }
      // Soft saturation curve
      const curve = new Float32Array(65536);
      const deg = Math.PI / 180;
      for (let i = 0; i < 65536; i++) {
        const x = (i - 32768) / 32768;
        curve[i] = ((3 + 0.5) * x * 20 * deg) / (Math.PI + 0.5 * Math.abs(x));
      }
      this.distortion.curve = curve;
      this.distortion.oversample = '4x';

      // Create phaser effect (4-stage)
      this.phaser = [];
      this.phaserLfo = ctx.createOscillator();
      if (!this.phaserLfo) {
        throw new Error('Failed to create phaser LFO');
      }
      this.phaserLfo.type = 'sine';
      this.phaserLfo.frequency.value = 0.3; // Slow phaser sweep

      this.phaserGain = ctx.createGain();
      if (!this.phaserGain) {
        throw new Error('Failed to create phaser gain');
      }
      this.phaserGain.gain.value = this.phaserDepth; // Phaser depth

      for (let i = 0; i < 4; i++) {
        const allpass = ctx.createBiquadFilter();
        allpass.type = 'allpass';
        allpass.frequency.value = 350 + i * 100;
        allpass.Q.value = 1;
        this.phaser.push(allpass);
      }

      // Create reverb (impulse response)
      this.reverbGain = ctx.createGain();
      if (!this.reverbGain) {
        throw new Error('Failed to create reverb gain');
      }
      this.reverbGain.gain.value = this.reverbAmount;

      // Simple reverb using delay network
      this.reverb = ctx.createConvolver();
      if (!this.reverb) {
        throw new Error('Failed to create reverb');
      }
      // Create a simple impulse response
      const impulseLength = ctx.sampleRate * 0.5; // 0.5 second
      const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < impulseLength; i++) {
          channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
        }
      }
      this.reverb.buffer = impulse;

      // Connect LFOs to filters
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.filter.frequency);
      
      this.lfo2.connect(this.lfo2Gain);
      this.lfo2Gain.connect(this.filter2.frequency);

      // Connect phaser LFO
      this.phaserLfo.connect(this.phaserGain);
      if (this.phaser && this.phaser.length > 0) {
        this.phaserGain.connect(this.phaser[0].frequency);
        for (let i = 1; i < this.phaser.length; i++) {
          this.phaserGain.connect(this.phaser[i].frequency);
        }
      }

      // Connect oscillators through processing chain
      // Main path: osc -> filter -> distortion -> phaser -> delay -> gain
      this.oscillator.connect(this.filter);
      this.filter.connect(this.distortionGain);
      this.distortionGain.connect(this.distortion);
      
      // Second oscillator path: osc2 -> gain2 -> filter2 -> distortion
      this.oscillator2.connect(this.gain2);
      this.gain2.connect(this.filter2);
      this.filter2.connect(this.distortionGain);
      
      // Third oscillator path: osc3 -> gain3 -> filter -> distortion
      this.oscillator3.connect(this.gain3);
      this.gain3.connect(this.filter);
      
      // Continue main path: distortion -> phaser chain -> delay -> gain
      // All oscillators feed into the same distortion node, then through phaser
      let lastPhaser: AudioNode;
      if (this.phaser && this.phaser.length > 0) {
        this.distortion.connect(this.phaser[0]);
        lastPhaser = this.phaser[0];
        for (let i = 1; i < this.phaser.length; i++) {
          lastPhaser.connect(this.phaser[i]);
          lastPhaser = this.phaser[i];
        }
      } else {
        // Fallback: connect distortion directly if phaser is not available
        lastPhaser = this.distortion;
      }
      
      // Split to delay and direct
      lastPhaser.connect(this.gain);
      lastPhaser.connect(this.delay);
      this.delay.connect(this.delayGain);
      this.delayGain.connect(this.gain);

      // Add reverb
      this.gain.connect(this.reverbGain);
      this.reverbGain.connect(this.reverb);

      // Connect to ambient/SFX gain (not music)  
      const sfxGain = this.audioManager.getSfxGainNode();
      if (!sfxGain) {
        throw new Error('SFX gain node not available');
      }
      this.gain.connect(sfxGain);
      this.reverb.connect(sfxGain);

      // Start oscillators
      this.oscillator.start(0);
      this.oscillator2.start(0);
      this.oscillator3.start(0);
      this.lfo.start(0);
      this.lfo2.start(0);
      this.phaserLfo.start(0);

      this.isPlaying = true;
      this.updateFromChroma();
      this.startUpdates();
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

    // Stop continuous updates
    this.stopUpdates();

    try {
      // Stop oscillators safely
      if (this.oscillator) {
        try {
          this.oscillator.stop();
        } catch (e) {
          console.warn('ChromaPulseSynth: Error stopping oscillator', e);
        }
      }

      if (this.oscillator2) {
        try {
          this.oscillator2.stop();
        } catch (e) {
          console.warn('ChromaPulseSynth: Error stopping oscillator2', e);
        }
      }

      if (this.oscillator3) {
        try {
          this.oscillator3.stop();
        } catch (e) {
          console.warn('ChromaPulseSynth: Error stopping oscillator3', e);
        }
      }

      if (this.lfo) {
        try {
          this.lfo.stop();
        } catch (e) {
          console.warn('ChromaPulseSynth: Error stopping LFO', e);
        }
      }

      if (this.lfo2) {
        try {
          this.lfo2.stop();
        } catch (e) {
          console.warn('ChromaPulseSynth: Error stopping LFO2', e);
        }
      }

      if (this.phaserLfo) {
        try {
          this.phaserLfo.stop();
        } catch (e) {
          console.warn('ChromaPulseSynth: Error stopping phaser LFO', e);
        }
      }
    } catch (e) {
      console.warn('ChromaPulseSynth: Error during stop operation', e);
    }

    // Disconnect all nodes safely
    try {
      this.oscillator?.disconnect();
      this.oscillator2?.disconnect();
      this.oscillator3?.disconnect();
      this.lfo?.disconnect();
      this.lfo2?.disconnect();
      this.filter?.disconnect();
      this.filter2?.disconnect();
      this.gain?.disconnect();
      this.gain2?.disconnect();
      this.gain3?.disconnect();
      this.lfoGain?.disconnect();
      this.lfo2Gain?.disconnect();
      this.delay?.disconnect();
      this.delayGain?.disconnect();
      this.distortion?.disconnect();
      this.distortionGain?.disconnect();
      this.reverb?.disconnect();
      this.reverbGain?.disconnect();
      this.phaserLfo?.disconnect();
      this.phaserGain?.disconnect();
      this.phaser?.forEach(p => p?.disconnect());
    } catch (e) {
      console.warn('ChromaPulseSynth: Error disconnecting nodes', e);
    }

    // Clear references
    this.oscillator = undefined;
    this.oscillator2 = undefined;
    this.oscillator3 = undefined;
    this.lfo = undefined;
    this.lfo2 = undefined;
    this.filter = undefined;
    this.filter2 = undefined;
    this.gain = undefined;
    this.gain2 = undefined;
    this.gain3 = undefined;
    this.lfoGain = undefined;
    this.lfo2Gain = undefined;
    this.delay = undefined;
    this.delayGain = undefined;
    this.distortion = undefined;
    this.distortionGain = undefined;
    this.reverb = undefined;
    this.reverbGain = undefined;
    this.phaser = undefined;
    this.phaserLfo = undefined;
    this.phaserGain = undefined;

    this.isPlaying = false;
  }

  /**
   * Update synth parameters based on Chroma level with enhanced modulation
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
      const rampTime = 0.15; // Slightly longer ramp for smoother transitions

      // Frequency scales with chroma (0.8x - 1.4x base freq) with random variation
      const freqVariation = 1 + (Math.random() - 0.5) * this.randomVariation;
      const targetFreq = this.baseFreq * (0.8 + chromaLevel * 0.6) * freqVariation;
      if (targetFreq > 0 && targetFreq < 20000) {
        this.oscillator.frequency.cancelScheduledValues(now);
        this.oscillator.frequency.setValueAtTime(this.oscillator.frequency.value, now);
        this.oscillator.frequency.linearRampToValueAtTime(targetFreq, now + rampTime);

        // Update other oscillators proportionally
        if (this.oscillator2) {
          const targetFreq2 = targetFreq * (1 + this.detuneAmount);
          this.oscillator2.frequency.cancelScheduledValues(now);
          this.oscillator2.frequency.setValueAtTime(this.oscillator2.frequency.value, now);
          this.oscillator2.frequency.linearRampToValueAtTime(targetFreq2, now + rampTime);
        }

        if (this.oscillator3) {
          const targetFreq3 = targetFreq * this.harmonicRatio;
          this.oscillator3.frequency.cancelScheduledValues(now);
          this.oscillator3.frequency.setValueAtTime(this.oscillator3.frequency.value, now);
          this.oscillator3.frequency.linearRampToValueAtTime(targetFreq3, now + rampTime);
        }
      }

      // Filter Q increases with chroma (more resonance = more harmonics)
      const targetQ = 0.8 + (chromaLevel * 1.2); // Increased range for more dramatic effect
      if (targetQ > 0 && targetQ < 30) {
        this.filter.Q.cancelScheduledValues(now);
        this.filter.Q.setValueAtTime(this.filter.Q.value, now);
        this.filter.Q.linearRampToValueAtTime(targetQ, now + rampTime);
      }

      // Filter2 Q also responds to chroma
      if (this.filter2) {
        const targetQ2 = 0.5 + (chromaLevel * 0.8);
        if (targetQ2 > 0 && targetQ2 < 30) {
          this.filter2.Q.cancelScheduledValues(now);
          this.filter2.Q.setValueAtTime(this.filter2.Q.value, now);
          this.filter2.Q.linearRampToValueAtTime(targetQ2, now + rampTime);
        }
      }

      // Volume increases with chroma (with more dynamic range)
      const targetVolume = 0.15 + (chromaLevel * 0.4);
      if (this.gain && targetVolume >= 0 && targetVolume <= 1) {
        this.gain.gain.cancelScheduledValues(now);
        this.gain.gain.setValueAtTime(this.gain.gain.value, now);
        this.gain.gain.linearRampToValueAtTime(targetVolume, now + rampTime);
      }

      // Modulate distortion amount with chroma
      if (this.distortionGain) {
        const distortionAmount = 0.6 + (chromaLevel * 0.4); // More distortion at higher chroma
        this.distortionGain.gain.cancelScheduledValues(now);
        this.distortionGain.gain.setValueAtTime(this.distortionGain.gain.value, now);
        this.distortionGain.gain.linearRampToValueAtTime(distortionAmount, now + rampTime);
      }

      // Modulate phaser depth with chroma
      if (this.phaserGain) {
        const phaserDepth = 400 + (chromaLevel * 400); // 400-800 range
        this.phaserGain.gain.cancelScheduledValues(now);
        this.phaserGain.gain.setValueAtTime(this.phaserGain.gain.value, now);
        this.phaserGain.gain.linearRampToValueAtTime(phaserDepth, now + rampTime);
      }

      // Modulate reverb amount with chroma
      if (this.reverbGain) {
        const reverbAmount = 0.1 + (chromaLevel * 0.3); // More reverb at higher chroma
        this.reverbGain.gain.cancelScheduledValues(now);
        this.reverbGain.gain.setValueAtTime(this.reverbGain.gain.value, now);
        this.reverbGain.gain.linearRampToValueAtTime(reverbAmount, now + rampTime);
      }

      // Modulate LFO rates with chroma (faster modulation at higher chroma)
      if (this.lfo) {
        const lfoRate = this.lfoRate * (0.7 + chromaLevel * 0.6); // 0.7x to 1.3x
        this.lfo.frequency.cancelScheduledValues(now);
        this.lfo.frequency.setValueAtTime(this.lfo.frequency.value, now);
        this.lfo.frequency.linearRampToValueAtTime(lfoRate, now + rampTime);
      }

      if (this.lfo2) {
        const lfo2Rate = this.lfo2Rate * (0.6 + chromaLevel * 0.8); // 0.6x to 1.4x
        this.lfo2.frequency.cancelScheduledValues(now);
        this.lfo2.frequency.setValueAtTime(this.lfo2.frequency.value, now);
        this.lfo2.frequency.linearRampToValueAtTime(lfo2Rate, now + rampTime);
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
   * Start continuous updates (call from game loop)
   */
  startUpdates(intervalMs: number = 100): void {
    if (this.updateInterval) return;
    
    this.updateInterval = window.setInterval(() => {
      this.updateFromChroma();
    }, intervalMs);
  }

  /**
   * Stop continuous updates
   */
  stopUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  /**
   * Check if playing
   */
  isActive(): boolean {
    return this.isPlaying;
  }

  /**
   * Apply a music preset configuration
   * This updates the synth parameters. If playing, it will restart with new settings.
   */
  async applyPreset(preset: MusicPreset): Promise<void> {
    const wasPlaying = this.isPlaying;
    
    // Stop if playing to apply new parameters
    if (wasPlaying) {
      this.stop();
    }

    // Update all parameters from preset
    this.baseFreq = preset.baseFreq;
    this.modulationDepth = preset.modulationDepth;
    this.lfoRate = preset.lfoRate;
    this.lfo2Rate = preset.lfo2Rate;
    this.detuneAmount = preset.detuneAmount;
    this.harmonicRatio = preset.harmonicRatio;
    this.randomVariation = preset.randomVariation;
    this.filterCenterFreq = preset.filterCenterFreq;
    this.filterQ = preset.filterQ;
    this.mainVolume = preset.mainVolume;
    this.detunedVolume = preset.detunedVolume;
    this.harmonicVolume = preset.harmonicVolume;
    this.distortionAmount = preset.distortionAmount;
    this.phaserDepth = preset.phaserDepth;
    this.reverbAmount = preset.reverbAmount;

    // Restart if it was playing
    if (wasPlaying) {
      await this.start();
    }
  }

  /**
   * Clean up
   */
  dispose(): void {
    try {
      this.stop();
      this.stopUpdates();
    } catch (error) {
      console.error('ChromaPulseSynth: Error during dispose', error);
    }
    
    // Clear singleton instance
    if (ChromaPulseSynth._instance === this) {
      ChromaPulseSynth._instance = null;
    }
  }
}
