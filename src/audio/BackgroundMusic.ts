/**
 * Background Music Generator
 * 
 * Procedurally generates ambient background music for the game.
 * No audio files needed - pure synthesis.
 */

import AudioManager from './AudioManager';

export default class BackgroundMusic {
  private static _instance: BackgroundMusic | null = null;
  public static instance(): BackgroundMusic {
    if (!this._instance) this._instance = new BackgroundMusic();
    return this._instance;
  }

  private audioManager: AudioManager;
  private audioContext!: AudioContext;
  private oscillators: OscillatorNode[] = [];
  private gainNodes: GainNode[] = [];
  private lfo?: OscillatorNode;
  private lfoGain?: GainNode;
  private filter?: BiquadFilterNode;
  private masterGain?: GainNode;
  private isPlaying = false;

  // Music parameters
  private baseFreq = 110; // Hz (A2 - lower, more ambient)
  private volume = 0.3; // Background music volume (subtle)

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
      console.error('BackgroundMusic: Failed to initialize', error);
      throw error;
    }
  }

  /**
   * Start background music
   */
  async start(): Promise<void> {
    if (this.isPlaying) {
      return;
    }

    if (!this.audioContext) {
      const error = new Error('BackgroundMusic: Cannot start - AudioContext not initialized. Call init() first.');
      console.error(error.message);
      throw error;
    }

    // Check if audio context is in a valid state
    if (this.audioContext.state === 'closed') {
      const error = new Error('BackgroundMusic: Cannot start - AudioContext is closed');
      console.error(error.message);
      throw error;
    }

    // Resume audio context if suspended (required for user interaction)
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to resume AudioContext');
        console.error('BackgroundMusic: Failed to resume AudioContext', err);
        throw err;
      }
    }

    const ctx = this.audioContext;

    try {
      // Create master gain
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.volume;

      // Create multiple oscillators for rich harmonic content
      const frequencies = [
        this.baseFreq,           // Fundamental
        this.baseFreq * 1.5,     // Perfect fifth
        this.baseFreq * 2,       // Octave
        this.baseFreq * 2.5,     // Major third above octave
      ];

      const volumes = [0.4, 0.25, 0.2, 0.15]; // Decreasing volumes for harmonics
      const waveTypes: OscillatorType[] = ['sine', 'triangle', 'sine', 'triangle'];

      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        osc.type = waveTypes[index];
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        gain.gain.value = volumes[index];

        osc.connect(gain);
        gain.connect(this.masterGain);

        this.oscillators.push(osc);
        this.gainNodes.push(gain);
      });

      // Create LFO for subtle volume modulation (breathing effect)
      this.lfo = ctx.createOscillator();
      this.lfo.type = 'sine';
      this.lfo.frequency.value = 0.1; // Very slow modulation (10 second cycle)

      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.value = 0.1; // 10% volume variation

      // Connect LFO to master gain for subtle breathing
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.masterGain.gain);

      // Create low-pass filter for warmer, ambient sound
      this.filter = ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 2000; // Cut off high frequencies
      this.filter.Q.value = 1;

      // Connect master gain through filter to music output
      this.masterGain.connect(this.filter);
      const musicGain = this.audioManager.getMusicGainNode();
      if (!musicGain) {
        const error = new Error('Music gain node not available');
        console.error('BackgroundMusic:', error.message);
        this.stop();
        throw error;
      }
      this.filter.connect(musicGain);

      // Start all oscillators
      this.oscillators.forEach(osc => osc.start(0));
      this.lfo.start(0);

      this.isPlaying = true;
      console.log('BackgroundMusic: Started');
    } catch (error) {
      console.error('BackgroundMusic: Error starting music', error);
      this.stop();
      throw error;
    }
  }

  /**
   * Stop background music
   */
  stop(): void {
    if (!this.isPlaying) {
      return;
    }

    // Stop oscillators safely
    this.oscillators.forEach((osc, index) => {
      try {
        if (osc && typeof osc.stop === 'function') {
          osc.stop();
        }
      } catch (e) {
        // Oscillator may already be stopped or invalid - ignore
        console.debug(`BackgroundMusic: Oscillator ${index} already stopped or invalid`);
      }
    });

    if (this.lfo) {
      try {
        if (typeof this.lfo.stop === 'function') {
          this.lfo.stop();
        }
      } catch (e) {
        // LFO may already be stopped - ignore
        console.debug('BackgroundMusic: LFO already stopped or invalid');
      }
    }

    // Disconnect all nodes safely
    try {
      this.oscillators.forEach(osc => {
        try {
          osc?.disconnect();
        } catch (e) {
          // Already disconnected - ignore
        }
      });
      this.gainNodes.forEach(gain => {
        try {
          gain?.disconnect();
        } catch (e) {
          // Already disconnected - ignore
        }
      });
      try {
        this.lfo?.disconnect();
      } catch (e) {
        // Already disconnected - ignore
      }
      try {
        this.lfoGain?.disconnect();
      } catch (e) {
        // Already disconnected - ignore
      }
      try {
        this.filter?.disconnect();
      } catch (e) {
        // Already disconnected - ignore
      }
      try {
        this.masterGain?.disconnect();
      } catch (e) {
        // Already disconnected - ignore
      }
    } catch (e) {
      // Ignore disconnect errors - nodes may already be disconnected
      console.debug('BackgroundMusic: Some nodes were already disconnected');
    }

    // Clear references
    this.oscillators = [];
    this.gainNodes = [];
    this.lfo = undefined;
    this.lfoGain = undefined;
    this.filter = undefined;
    this.masterGain = undefined;

    this.isPlaying = false;
    console.log('BackgroundMusic: Stopped');
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.volume = clampedVolume;

    if (!this.masterGain || !this.audioContext) {
      return;
    }

    try {
      const now = this.audioContext.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(clampedVolume, now);
    } catch (error) {
      console.error('BackgroundMusic: Error setting volume', error);
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
      console.error('BackgroundMusic: Error during dispose', error);
    }
    
    // Clear singleton instance
    if (BackgroundMusic._instance === this) {
      BackgroundMusic._instance = null;
    }
  }
}

