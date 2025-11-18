/**
 * Interaction Audio Manager
 * 
 * Provides audio feedback for UI interactions and game actions
 */

import AudioManager from './AudioManager';

export type InteractionSoundType =
  | 'click'
  | 'select'
  | 'hover'
  | 'command'
  | 'build'
  | 'research'
  | 'error'
  | 'success'
  | 'attack'
  | 'move';

export class InteractionAudio {
  private static _instance: InteractionAudio | null = null;
  private audioManager: AudioManager;
  private audioContext!: AudioContext;
  private masterGain!: GainNode;
  private enabled: boolean = true;
  private volume: number = 0.5;

  private constructor() {
    this.audioManager = AudioManager.instance();
  }

  public static instance(): InteractionAudio {
    if (!this._instance) {
      this._instance = new InteractionAudio();
    }
    return this._instance;
  }

  async init(): Promise<void> {
    await this.audioManager.init();
    this.audioContext = this.audioManager.getAudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.audioManager.getSfxGainNode());
  }

  /**
   * Play a sound for a specific interaction type
   */
  play(type: InteractionSoundType, options: { volume?: number; pitch?: number } = {}): void {
    if (!this.enabled || !this.audioContext) return;

    const { volume = 1.0, pitch = 1.0 } = options;
    const now = this.audioContext.currentTime;

    switch (type) {
      case 'click':
        this.playClickSound(volume, pitch);
        break;
      case 'select':
        this.playSelectSound(volume, pitch);
        break;
      case 'hover':
        this.playHoverSound(volume, pitch);
        break;
      case 'command':
        this.playCommandSound(volume, pitch);
        break;
      case 'build':
        this.playBuildSound(volume, pitch);
        break;
      case 'research':
        this.playResearchSound(volume, pitch);
        break;
      case 'error':
        this.playErrorSound(volume, pitch);
        break;
      case 'success':
        this.playSuccessSound(volume, pitch);
        break;
      case 'attack':
        this.playAttackSound(volume, pitch);
        break;
      case 'move':
        this.playMoveSound(volume, pitch);
        break;
    }
  }

  /**
   * Click sound - short, crisp beep
   */
  private playClickSound(volume: number, pitch: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 800 * pitch;

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  /**
   * Select sound - medium beep with slight rise
   */
  private playSelectSound(volume: number, pitch: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600 * pitch, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(800 * pitch, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.4, this.audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  /**
   * Hover sound - very subtle, high frequency
   */
  private playHoverSound(volume: number, pitch: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 1200 * pitch;

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.1, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.08);
  }

  /**
   * Command sound - two-tone confirmation
   */
  private playCommandSound(volume: number, pitch: number): void {
    const now = this.audioContext.currentTime;

    // First tone
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 500 * pitch;
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(volume * 0.3, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.1);

    // Second tone
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 700 * pitch;
    gain2.gain.setValueAtTime(0, now + 0.05);
    gain2.gain.linearRampToValueAtTime(volume * 0.3, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.15);
  }

  /**
   * Build sound - mechanical, lower frequency
   */
  private playBuildSound(volume: number, pitch: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 200 * pitch;

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.4, this.audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(volume * 0.2, this.audioContext.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  /**
   * Research sound - ascending tones
   */
  private playResearchSound(volume: number, pitch: number): void {
    const now = this.audioContext.currentTime;
    const frequencies = [400, 500, 600, 700].map(f => f * pitch);

    frequencies.forEach((freq, i) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;

      const startTime = now + i * 0.05;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.25, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.1);
    });
  }

  /**
   * Error sound - descending, dissonant
   */
  private playErrorSound(volume: number, pitch: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(400 * pitch, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(200 * pitch, this.audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  /**
   * Success sound - pleasant chime
   */
  private playSuccessSound(volume: number, pitch: number): void {
    const now = this.audioContext.currentTime;
    const frequencies = [523.25, 659.25, 783.99].map(f => f * pitch); // C, E, G major chord

    frequencies.forEach((freq, i) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;

      const startTime = now + i * 0.05;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }

  /**
   * Attack sound - sharp, aggressive
   */
  private playAttackSound(volume: number, pitch: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(300 * pitch, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(600 * pitch, this.audioContext.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.4, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  /**
   * Move sound - subtle whoosh
   */
  private playMoveSound(volume: number, pitch: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300 * pitch, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(200 * pitch, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.2, this.audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * Enable/disable sounds
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

