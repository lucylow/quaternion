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
  private instabilityFilter?: BiquadFilterNode;
  private chromaFilter?: BiquadFilterNode;
  private chromaReverb?: ConvolverNode;
  private chromaReverbGain?: GainNode;
  private chromaDelay?: DelayNode;
  private chromaDelayGain?: GainNode;
  private chromaDelayFeedback?: GainNode;

  // Current parameters
  private currentChroma = 0.5;
  private currentInstability = 0.0;
  private updateInterval?: number;

  private constructor() {
    this.audioManager = AudioManager.instance();
    this.sfxManager = SFXManager.instance();
  }

  async init(): Promise<void> {
    await this.audioManager.init();
    this.audioContext = this.audioManager.getAudioContext();
    this.setupAdaptiveNodes();
  }

  /**
   * Create reverb impulse response
   */
  private createReverbImpulse(duration: number = 1.5, decay: number = 2.0): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const n = length - i;
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      }
    }
    
    return impulse;
  }

  /**
   * Setup adaptive audio processing nodes
   */
  private setupAdaptiveNodes(): void {
    const ctx = this.audioContext;

    // Instability alarm oscillator with filter
    this.instabilityAlarm = ctx.createOscillator();
    this.instabilityAlarm.type = 'sawtooth'; // More aggressive waveform
    
    this.instabilityFilter = ctx.createBiquadFilter();
    this.instabilityFilter.type = 'bandpass';
    this.instabilityFilter.frequency.value = 400;
    this.instabilityFilter.Q.value = 2.0;
    
    this.instabilityGain = ctx.createGain();
    this.instabilityGain.gain.value = 0;
    
    this.instabilityAlarm.connect(this.instabilityFilter);
    this.instabilityFilter.connect(this.instabilityGain);
    this.instabilityGain.connect(this.audioManager.getSfxGainNode());
    this.instabilityAlarm.start(0);

    // Chroma filter for ambient morphing
    this.chromaFilter = ctx.createBiquadFilter();
    this.chromaFilter.type = 'lowpass';
    this.chromaFilter.frequency.value = 8000;
    this.chromaFilter.Q.value = 1.2;

    // Chroma reverb for spatial effects
    this.chromaReverb = ctx.createConvolver();
    this.chromaReverb.buffer = this.createReverbImpulse(1.2, 1.8);
    this.chromaReverbGain = ctx.createGain();
    this.chromaReverbGain.gain.value = 0;

    // Chroma delay for depth
    this.chromaDelay = ctx.createDelay(0.3);
    this.chromaDelay.delayTime.value = 0.08;
    this.chromaDelayGain = ctx.createGain();
    this.chromaDelayGain.gain.value = 0;
    this.chromaDelayFeedback = ctx.createGain();
    this.chromaDelayFeedback.gain.value = 0.2;

    // Delay feedback loop
    this.chromaDelay.connect(this.chromaDelayFeedback);
    this.chromaDelayFeedback.connect(this.chromaDelay);
  }

  /**
   * Update adaptive effects based on game state
   */
  update(params: AdaptiveEffectParams): void {
    this.currentChroma = Math.max(0, Math.min(1, params.chromaLevel));
    this.currentInstability = Math.max(0, Math.min(1, params.instabilityLevel));

    this.updateChromaEffects();
    this.updateInstabilityEffects();
    this.updateParticleEffects(params.particleCount || 0);
  }

  /**
   * Chroma intensity morphing
   * As Chroma rises, add harmonic partials, reverb, and delay
   */
  private updateChromaEffects(): void {
    if (!this.chromaFilter) return;

    const now = this.audioContext.currentTime;
    const rampTime = 0.2; // Smooth transitions

    // Lowpass filter opens up with chroma (more harmonics)
    const targetFreq = 2000 + (this.currentChroma * 6000); // 2kHz - 8kHz
    this.chromaFilter.frequency.cancelScheduledValues(now);
    this.chromaFilter.frequency.setValueAtTime(this.chromaFilter.frequency.value, now);
    this.chromaFilter.frequency.linearRampToValueAtTime(targetFreq, now + rampTime);

    // Q increases with chroma (sharper resonance = more harmonics)
    const targetQ = 0.8 + (this.currentChroma * 0.8);
    this.chromaFilter.Q.cancelScheduledValues(now);
    this.chromaFilter.Q.setValueAtTime(this.chromaFilter.Q.value, now);
    this.chromaFilter.Q.linearRampToValueAtTime(targetQ, now + rampTime);

    // Reverb increases with chroma (more space)
    if (this.chromaReverbGain) {
      const reverbAmount = this.currentChroma * 0.25;
      this.chromaReverbGain.gain.cancelScheduledValues(now);
      this.chromaReverbGain.gain.setValueAtTime(this.chromaReverbGain.gain.value, now);
      this.chromaReverbGain.gain.linearRampToValueAtTime(reverbAmount, now + rampTime);
    }

    // Delay increases with chroma (more depth)
    if (this.chromaDelayGain) {
      const delayAmount = this.currentChroma * 0.2;
      this.chromaDelayGain.gain.cancelScheduledValues(now);
      this.chromaDelayGain.gain.setValueAtTime(this.chromaDelayGain.gain.value, now);
      this.chromaDelayGain.gain.linearRampToValueAtTime(delayAmount, now + rampTime);
    }

    // Music volume modulation based on chroma
    const musicVolume = 0.7 + (this.currentChroma * 0.3);
    this.audioManager.setMusicVolume(musicVolume);

    // Master EQ shifts with chroma (brighter at high chroma)
    const lowBoost = -this.currentChroma * 2; // Reduce bass slightly
    const highBoost = this.currentChroma * 3; // Boost treble
    this.audioManager.setMasterEQ(lowBoost, 0, highBoost);
  }

  /**
   * Instability alarm - parameterized siren with filter sweep
   * Rate increases with instability (0 = calm, 1 = frantic)
   */
  private updateInstabilityEffects(): void {
    if (!this.instabilityAlarm || !this.instabilityGain || !this.instabilityFilter) return;

    const now = this.audioContext.currentTime;
    const rampTime = 0.15;

    if (this.currentInstability < 0.1) {
      // Silent when calm
      this.instabilityGain.gain.cancelScheduledValues(now);
      this.instabilityGain.gain.setValueAtTime(0, now);
      return;
    }

    // Frequency oscillation rate increases with instability
    const baseFreq = 200; // Hz
    const modDepth = 150; // Hz (increased for more dramatic effect)
    const modRate = 0.5 + (this.currentInstability * 4.0); // 0.5 - 4.5 Hz modulation

    // Oscillate frequency using scheduled automation
    const time = this.audioContext.currentTime;
    const mod = Math.sin(2 * Math.PI * modRate * time) * modDepth;
    const targetFreq = baseFreq + mod;

    this.instabilityAlarm.frequency.cancelScheduledValues(now);
    this.instabilityAlarm.frequency.setValueAtTime(targetFreq, now);

    // Filter frequency sweeps with instability
    const filterFreq = 300 + (this.currentInstability * 700); // 300Hz - 1kHz
    this.instabilityFilter.frequency.cancelScheduledValues(now);
    this.instabilityFilter.frequency.setValueAtTime(this.instabilityFilter.frequency.value, now);
    this.instabilityFilter.frequency.linearRampToValueAtTime(filterFreq, now + rampTime);

    // Filter Q increases with instability (sharper resonance)
    const filterQ = 1.5 + (this.currentInstability * 2.5);
    this.instabilityFilter.Q.cancelScheduledValues(now);
    this.instabilityFilter.Q.setValueAtTime(this.instabilityFilter.Q.value, now);
    this.instabilityFilter.Q.linearRampToValueAtTime(filterQ, now + rampTime);

    // Volume increases with instability
    const targetGain = this.currentInstability * 0.35; // Max 35% volume
    this.instabilityGain.gain.cancelScheduledValues(now);
    this.instabilityGain.gain.setValueAtTime(this.instabilityGain.gain.value, now);
    this.instabilityGain.gain.linearRampToValueAtTime(targetGain, now + rampTime);

    // Master EQ shifts (more harsh mids at high instability)
    const midBoost = this.currentInstability * 4;
    const lowCut = -this.currentInstability * 3;
    this.audioManager.setMasterEQ(lowCut, midBoost, 0);
  }

  /**
   * Procedural particle impacts
   * Density scales with particle count
   */
  private updateParticleEffects(particleCount: number): void {
    // Trigger granular hits based on particle density
    if (particleCount > 0 && Math.random() < particleCount / 1000) {
      // Play impact sound with volume based on density
      const volume = Math.min(1, particleCount / 500);
      this.sfxManager.playCue('Electro_Spark', { volume: volume * 0.5 });
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
   * Start continuous updates (call from game loop)
   */
  startUpdates(intervalMs: number = 100): void {
    if (this.updateInterval) return;
    
    this.updateInterval = window.setInterval(() => {
      this.updateChromaEffects();
      this.updateInstabilityEffects();
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
   * Clean up
   */
  dispose(): void {
    this.stopUpdates();
    
    if (this.instabilityAlarm) {
      this.instabilityAlarm.stop();
      this.instabilityAlarm.disconnect();
    }
    if (this.instabilityFilter) {
      this.instabilityFilter.disconnect();
    }
    if (this.instabilityGain) {
      this.instabilityGain.disconnect();
    }
    if (this.chromaFilter) {
      this.chromaFilter.disconnect();
    }
    if (this.chromaReverb) {
      this.chromaReverb.disconnect();
    }
    if (this.chromaReverbGain) {
      this.chromaReverbGain.disconnect();
    }
    if (this.chromaDelay) {
      this.chromaDelay.disconnect();
    }
    if (this.chromaDelayGain) {
      this.chromaDelayGain.disconnect();
    }
    if (this.chromaDelayFeedback) {
      this.chromaDelayFeedback.disconnect();
    }
  }
}

