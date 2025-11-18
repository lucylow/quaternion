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
    await this.audioManager.init();
    this.audioContext = this.audioManager.getAudioContext();
  }

  /**
   * Start chroma pulse synth
   */
  start(): void {
    if (this.isPlaying) return;
    if (!this.audioContext) throw new Error('ChromaPulseSynth not initialized. Call init() first.');

    const ctx = this.audioContext;

    // Main oscillator (sine + saw mix)
    this.oscillator = ctx.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = this.baseFreq;

    // LFO for filter modulation (breathing effect)
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = this.lfoRate;

    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = this.baseFreq * this.modulationDepth;

    // Filter (bandpass per playbook)
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'bandpass';
    this.filter.frequency.value = 1200; // Centered ~1.2 kHz
    this.filter.Q.value = 1.2;

    // Gain node
    this.gain = ctx.createGain();
    this.gain.gain.value = 0.3; // Start at 30% volume

    // Create chorus effect (simple delay-based)
    const delay = ctx.createDelay(0.02);
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0.3;
    delay.delayTime.value = 0.01;

    // Connect: LFO -> filter frequency
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);

    // Connect: oscillator -> filter -> delay -> gain -> output
    this.oscillator.connect(this.filter);
    this.filter.connect(this.gain);
    this.filter.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(this.gain);

    // Connect to ambient/SFX gain (not music)  
    if (this.gain) {
      this.gain.connect(this.audioManager.getSfxGainNode());
    }

    // Start oscillators
    this.oscillator.start(0);
    this.lfo.start(0);

    this.isPlaying = true;
    this.updateFromChroma();
  }

  /**
   * Stop chroma pulse synth
   */
  stop(): void {
    if (!this.isPlaying) return;

    try {
      this.oscillator?.stop();
      this.lfo?.stop();
    } catch (e) {
      // Ignore - might already be stopped
    }

    this.oscillator?.disconnect();
    this.lfo?.disconnect();
    this.filter?.disconnect();
    this.gain?.disconnect();
    this.lfoGain?.disconnect();

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

    const adaptiveEffects = AdaptiveEffects.instance();
    const chromaLevel = adaptiveEffects.getChromaLevel();

    const now = this.audioContext.currentTime;

    // Frequency scales with chroma (0.8x - 1.4x base freq)
    const targetFreq = this.baseFreq * (0.8 + chromaLevel * 0.6);
    this.oscillator.frequency.cancelScheduledValues(now);
    this.oscillator.frequency.setValueAtTime(this.oscillator.frequency.value, now);
    this.oscillator.frequency.linearRampToValueAtTime(targetFreq, now + 0.1);

    // Filter Q increases with chroma (more resonance = more harmonics)
    const targetQ = 0.8 + (chromaLevel * 0.6);
    this.filter.Q.cancelScheduledValues(now);
    this.filter.Q.setValueAtTime(this.filter.Q.value, now);
    this.filter.Q.linearRampToValueAtTime(targetQ, now + 0.1);

    // Volume increases with chroma
    const targetVolume = 0.2 + (chromaLevel * 0.3);
    if (this.gain) {
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.linearRampToValueAtTime(targetVolume, now + 0.1);
    }
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    if (!this.audioContext) return;
    if (this.gain) {
      const now = this.audioContext.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(volume, now);
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
    this.stop();
  }
}

