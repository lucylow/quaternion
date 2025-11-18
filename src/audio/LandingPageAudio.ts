/**
 * Landing Page Audio System
 * Provides simple audio for the landing page with fallback sound generation
 */

class LandingPageAudio {
  private ctx: AudioContext | null = null;
  private initialized = false;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicVolume = 0.4;
  private sfxVolume = 0.6;

  /**
   * Initialize audio context (must be called after user interaction)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Create gain nodes
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      // Connect: music/sfx -> master -> destination
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Set volumes
      this.masterGain.gain.value = 0.8;
      this.musicGain.gain.value = this.musicVolume;
      this.sfxGain.gain.value = this.sfxVolume;

      // Resume context if suspended
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.initialized = true;
      console.log('Landing page audio initialized');
    } catch (error) {
      console.warn('Failed to initialize landing page audio:', error);
    }
  }

  /**
   * Generate a simple beep sound
   */
  private generateBeep(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer {
    if (!this.ctx) throw new Error('Audio context not initialized');

    const sampleRate = this.ctx.sampleRate;
    const frameCount = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      // Apply envelope to avoid clicks
      const envelope = Math.min(1, Math.min(t * 100, (duration - t) * 100));
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }

    return buffer;
  }

  /**
   * Generate a click sound
   */
  private generateClick(): AudioBuffer {
    if (!this.ctx) throw new Error('Audio context not initialized');

    const sampleRate = this.ctx.sampleRate;
    const duration = 0.05; // 50ms
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);

    // White noise with quick decay
    for (let i = 0; i < frameCount; i++) {
      const t = i / frameCount;
      const envelope = Math.pow(1 - t, 2); // Exponential decay
      channelData[i] = (Math.random() * 2 - 1) * envelope * 0.2;
    }

    return buffer;
  }

  /**
   * Generate a hover sound (gentle whoosh)
   */
  private generateHover(): AudioBuffer {
    if (!this.ctx) throw new Error('Audio context not initialized');

    const sampleRate = this.ctx.sampleRate;
    const duration = 0.15;
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Sweep from low to high frequency
    for (let i = 0; i < frameCount; i++) {
      const t = i / frameCount;
      const freq = 400 + t * 200; // Sweep from 400Hz to 600Hz
      const envelope = Math.sin(t * Math.PI); // Sine envelope
      channelData[i] = Math.sin(2 * Math.PI * freq * i / sampleRate) * envelope * 0.15;
    }

    return buffer;
  }

  /**
   * Play a generated sound
   */
  private playGeneratedSound(buffer: AudioBuffer, volume: number = 1.0): void {
    if (!this.ctx || !this.sfxGain) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.sfxGain);
    source.start(0);
  }

  /**
   * Play UI click sound
   */
  playClick(): void {
    if (!this.initialized) return;
    try {
      const click = this.generateClick();
      this.playGeneratedSound(click, 0.5);
    } catch (error) {
      console.warn('Failed to play click sound:', error);
    }
  }

  /**
   * Play UI hover sound
   */
  playHover(): void {
    if (!this.initialized) return;
    try {
      const hover = this.generateHover();
      this.playGeneratedSound(hover, 0.3);
    } catch (error) {
      console.warn('Failed to play hover sound:', error);
    }
  }

  /**
   * Play success sound
   */
  playSuccess(): void {
    if (!this.initialized) return;
    try {
      // Two-tone success sound
      const buffer = this.generateBeep(523.25, 0.1, 'sine'); // C5
      this.playGeneratedSound(buffer, 0.4);
      
      setTimeout(() => {
        const buffer2 = this.generateBeep(659.25, 0.15, 'sine'); // E5
        this.playGeneratedSound(buffer2, 0.4);
      }, 100);
    } catch (error) {
      console.warn('Failed to play success sound:', error);
    }
  }

  /**
   * Start background music (ambient loop)
   */
  async startBackgroundMusic(): Promise<void> {
    if (!this.initialized || !this.ctx || !this.musicGain) return;

    try {
      // Try to load actual music file first
      try {
        const response = await fetch('/assets/music/stems/ambient_conserve.mp3');
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = await this.ctx.decodeAudioData(arrayBuffer);
          
          this.stopBackgroundMusic();
          
          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          
          const gain = this.ctx.createGain();
          gain.gain.value = 0;
          source.connect(gain);
          gain.connect(this.musicGain);
          
          source.start(0);
          gain.gain.linearRampToValueAtTime(this.musicVolume, this.ctx.currentTime + 2);
          
          this.musicSource = source;
          this.musicGain = gain;
          return;
        }
      } catch (e) {
        // Fall through to generated music
      }

      // Fallback: Generate ambient music
      this.playGeneratedAmbientMusic();
    } catch (error) {
      console.warn('Failed to start background music:', error);
      // Fallback to generated music
      this.playGeneratedAmbientMusic();
    }
  }

  /**
   * Generate and play ambient background music
   */
  private playGeneratedAmbientMusic(): void {
    if (!this.ctx || !this.musicGain) return;

    // Create a simple ambient pad sound
    const sampleRate = this.ctx.sampleRate;
    const duration = 4; // 4 second loop
    const frameCount = sampleRate * duration;
    const buffer = this.ctx.createBuffer(2, frameCount, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // Generate a pad-like sound with multiple harmonics
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      
      // Base frequency (low C)
      const baseFreq = 65.41; // C2
      const wave1 = Math.sin(2 * Math.PI * baseFreq * t) * 0.3;
      const wave2 = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.2; // Octave
      const wave3 = Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.1; // Fifth
      
      // Add slow LFO for movement
      const lfo = Math.sin(2 * Math.PI * 0.1 * t) * 0.05;
      
      const sample = (wave1 + wave2 + wave3) * (1 + lfo);
      
      // Apply fade in/out at loop points
      const fade = Math.min(1, Math.min(t * 2, (duration - t) * 2));
      
      leftChannel[i] = sample * fade * 0.15;
      rightChannel[i] = sample * fade * 0.15;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const gain = this.ctx.createGain();
    gain.gain.value = this.musicVolume * 0.5; // Quieter for generated music
    
    source.connect(gain);
    gain.connect(this.musicGain);
    
    source.start(0);
    
    this.musicSource = source;
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic(): void {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
      } catch (e) {
        // Ignore stop errors
      }
      this.musicSource = null;
    }
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }
  }

  /**
   * Set SFX volume
   */
  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopBackgroundMusic();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.initialized = false;
  }
}

// Singleton instance
let instance: LandingPageAudio | null = null;

export function getLandingPageAudio(): LandingPageAudio {
  if (!instance) {
    instance = new LandingPageAudio();
  }
  return instance;
}

export default LandingPageAudio;

