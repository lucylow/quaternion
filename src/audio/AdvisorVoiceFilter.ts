/**
 * Advisor Voice Filter
 * 
 * Adds emotional audio effects to TTS dialogue based on sentiment/faction.
 * Implements mood-based EQ, reverb, and distortion.
 */

import AudioManager from './AudioManager';

export type EmotionType = 'calm' | 'hopeful' | 'angry' | 'melancholy' | 'neutral';

export interface VoiceFilterSettings {
  echoDelay: number;      // ms
  echoDecay: number;      // 0-1
  distortionLevel: number; // 0-1
  lowpassCutoff: number;  // Hz
  reverbDecay: number;    // seconds
}

/**
 * Advisor Voice Filter
 * Applies emotional filters to advisor/narrative voices
 */
export default class AdvisorVoiceFilter {
  private static _instance: AdvisorVoiceFilter | null = null;
  public static instance(): AdvisorVoiceFilter {
    if (!this._instance) this._instance = new AdvisorVoiceFilter();
    return this._instance;
  }

  private audioManager: AudioManager;
  private audioContext!: AudioContext;
  private currentEmotion: EmotionType = 'neutral';

  private constructor() {
    this.audioManager = AudioManager.instance();
  }

  // Audio processing nodes
  private voiceSource?: AudioBufferSourceNode;
  private gainNode?: GainNode;
  private lowpassFilter?: BiquadFilterNode;
  private echoDelay?: DelayNode;
  private echoGain?: GainNode;
  private distortion?: WaveShaperNode;

  // Emotion presets
  private readonly emotionPresets: Record<EmotionType, VoiceFilterSettings> = {
    calm: {
      echoDelay: 120,
      echoDecay: 0.25,
      distortionLevel: 0.05,
      lowpassCutoff: 8000,
      reverbDecay: 0.3
    },
    hopeful: {
      echoDelay: 150,
      echoDecay: 0.4,
      distortionLevel: 0.1,
      lowpassCutoff: 10000,
      reverbDecay: 0.4
    },
    angry: {
      echoDelay: 60,
      echoDecay: 0.3,
      distortionLevel: 0.35,
      lowpassCutoff: 6000,
      reverbDecay: 0.2
    },
    melancholy: {
      echoDelay: 200,
      echoDecay: 0.6,
      distortionLevel: 0.08,
      lowpassCutoff: 5000,
      reverbDecay: 0.8
    },
    neutral: {
      echoDelay: 100,
      echoDecay: 0.2,
      distortionLevel: 0.0,
      lowpassCutoff: 8000,
      reverbDecay: 0.3
    }
  };

  async init(): Promise<void> {
    await this.audioManager.init();
    this.audioContext = this.audioManager.getAudioContext();
    this.setupFilterChain();
  }

  /**
   * Setup audio processing chain
   */
  private setupFilterChain(): void {
    const ctx = this.audioContext;

    // Create processing nodes
    this.gainNode = ctx.createGain();
    this.lowpassFilter = ctx.createBiquadFilter();
    this.lowpassFilter.type = 'lowpass';
    
    this.echoDelay = ctx.createDelay(0.5); // Max 500ms delay
    this.echoGain = ctx.createGain();
    this.echoGain.gain.value = 0;

    // Wave shaper for distortion
    this.distortion = ctx.createWaveShaper();
    this.distortion.curve = this.makeDistortionCurve(0);

    // Connect: source -> lowpass -> echo -> distortion -> gain -> voice output
    this.lowpassFilter.connect(this.echoDelay);
    this.echoDelay.connect(this.echoGain);
    this.echoGain.connect(this.distortion);
    this.distortion.connect(this.gainNode);
    this.gainNode.connect(this.audioManager.getVoiceGainNode());

    // Feedback loop for echo
    this.echoGain.connect(this.echoDelay);
  }

  /**
   * Create distortion curve
   */
  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }

    return curve;
  }

  /**
   * Set emotion and apply filters
   */
  setEmotion(emotion: EmotionType): void {
    this.currentEmotion = emotion;
    this.applyFilter(this.emotionPresets[emotion]);
  }

  /**
   * Apply filter settings
   */
  private applyFilter(settings: VoiceFilterSettings): void {
    if (!this.lowpassFilter || !this.echoDelay || !this.echoGain || !this.distortion) {
      return;
    }

    const now = this.audioContext.currentTime;

    // Lowpass filter (tone)
    this.lowpassFilter.frequency.cancelScheduledValues(now);
    this.lowpassFilter.frequency.setValueAtTime(this.lowpassFilter.frequency.value, now);
    this.lowpassFilter.frequency.linearRampToValueAtTime(
      settings.lowpassCutoff,
      now + 0.1
    );

    // Echo delay
    const delayTime = settings.echoDelay / 1000; // Convert ms to seconds
    this.echoDelay.delayTime.cancelScheduledValues(now);
    this.echoDelay.delayTime.setValueAtTime(
      Math.min(delayTime, this.echoDelay.delayTime.maxValue),
      now
    );

    // Echo decay (feedback)
    this.echoGain.gain.cancelScheduledValues(now);
    this.echoGain.gain.setValueAtTime(this.echoGain.gain.value, now);
    this.echoGain.gain.linearRampToValueAtTime(settings.echoDecay, now + 0.1);

    // Distortion
    this.distortion.curve = this.makeDistortionCurve(settings.distortionLevel * 50);
  }

  /**
   * Process audio buffer through filter chain
   */
  processBuffer(buffer: AudioBuffer, emotion?: EmotionType): AudioBufferSourceNode {
    if (emotion) {
      this.setEmotion(emotion);
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // Connect source to filter chain input
    source.connect(this.lowpassFilter!);

    return source;
  }

  /**
   * Get input node for connecting external sources
   */
  getInputNode(): AudioNode {
    return this.lowpassFilter || this.audioContext.createGain();
  }

  /**
   * Get current emotion
   */
  getCurrentEmotion(): EmotionType {
    return this.currentEmotion;
  }
}

