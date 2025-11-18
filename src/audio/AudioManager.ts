/**
 * Audio Manager - High-level interface for game audio
 * Wraps AudioEngine with game-specific logic and state management
 */

import AudioEngine, { DialogueLine, MusicStem, GameAudioState } from './AudioEngine';
import { COMMANDERS } from '@/data/quaternionData';

export type AudioConfig = {
  musicVolume?: number;
  sfxVolume?: number;
  dialogVolume?: number;
  masterVolume?: number;
};

export type VisemeCallback = (viseme: string, time: number) => void;

export default class AudioManager {
  private engine: AudioEngine;
  private config: AudioConfig;
  private currentGameState: GameAudioState = {
    intensity: 0.3,
    morality: 0,
    instability: 0
  };
  private visemeCallback?: VisemeCallback;
  private musicInitialized = false;

  constructor(config: AudioConfig = {}) {
    this.engine = new AudioEngine();
    this.config = {
      musicVolume: 0.7,
      sfxVolume: 1.0,
      dialogVolume: 1.0,
      masterVolume: 0.9,
      ...config
    };
    
    this.applyConfig();
  }

  /**
   * Apply audio configuration
   */
  private applyConfig(): void {
    if (this.config.musicVolume !== undefined) {
      this.engine.setMusicVolume(this.config.musicVolume);
    }
    if (this.config.sfxVolume !== undefined) {
      this.engine.setSFXVolume(this.config.sfxVolume);
    }
    if (this.config.dialogVolume !== undefined) {
      this.engine.setDialogVolume(this.config.dialogVolume);
    }
    if (this.config.masterVolume !== undefined) {
      this.engine.setMasterVolume(this.config.masterVolume);
    }
  }

  /**
   * Initialize music system with stems
   */
  async initializeMusic(stems: MusicStem[]): Promise<void> {
    try {
      await this.engine.ensureStarted();
      
      // Load all stems with error handling
      for (const stem of stems) {
        try {
          await this.engine.loadMusicStem(stem);
        } catch (error) {
          console.error(`Failed to load music stem ${stem.id}:`, error);
          // Continue loading other stems
        }
      }
      
      // Start with ambient stem
      const ambientStem = stems.find(s => s.id.includes('ambient'));
      if (ambientStem) {
        try {
          this.engine.playMusicStem(ambientStem.id, 1.0);
        } catch (error) {
          console.error(`Failed to play ambient stem:`, error);
        }
      }
      
      this.musicInitialized = true;
    } catch (error) {
      console.error('Music initialization failed:', error);
      // Don't throw - allow game to continue without music
    }
  }

  /**
   * Update game state and adapt music
   */
  updateGameState(state: Partial<GameAudioState>): void {
    this.currentGameState = { ...this.currentGameState, ...state };
    this.engine.updateAdaptiveMusic(this.currentGameState);
  }

  /**
   * Play SFX by name
   */
  playSFX(name: string, options?: {
    volume?: number;
    pitch?: number;
    delay?: number;
    pan?: number;
  }): void {
    try {
      this.engine.playSFX(name, options);
    } catch (error) {
      console.warn(`Failed to play SFX ${name}:`, error);
      // Don't throw - SFX failures are non-critical
    }
  }

  /**
   * Preload SFX
   */
  async preloadSFX(name: string, url: string): Promise<void> {
    try {
      await this.engine.loadBuffer(name, url, 'sfx');
    } catch (error) {
      console.warn(`Failed to preload SFX ${name}:`, error);
      // Don't throw - preload failures are non-critical
    }
  }

  /**
   * Play commander dialogue
   */
  async playCommanderDialogue(
    commanderId: string,
    text: string,
    visemeCallback?: VisemeCallback
  ): Promise<void> {
    const commander = COMMANDERS[commanderId];
    if (!commander) {
      console.warn(`Commander not found: ${commanderId}`);
      return;
    }

    // For now, use text-to-speech or pre-recorded lines
    // In production, this would load from dialogue.json
    const dialogueLine: DialogueLine = {
      id: `dialogue_${commanderId}_${Date.now()}`,
      url: `/assets/dialogue/${commanderId}/${text.substring(0, 20).replace(/\s/g, '_')}.wav`,
      text,
      speaker: commander.name,
      visemes: this.generateVisemesFromText(text) // Simplified - in production use proper phoneme analysis
    };

    const callback = visemeCallback || this.visemeCallback;
    await this.engine.playDialogue(dialogueLine, callback);
  }

  /**
   * Set viseme callback for lip-sync
   */
  setVisemeCallback(callback: VisemeCallback): void {
    this.visemeCallback = callback;
  }

  /**
   * Generate simple visemes from text (simplified - use proper phoneme analysis in production)
   */
  private generateVisemesFromText(text: string): Array<{ time: number; viseme: string }> {
    // Simplified viseme generation
    // In production, use phoneme-to-viseme mapping or forced alignment
    const visemes: Array<{ time: number; viseme: string }> = [];
    const words = text.split(' ');
    let currentTime = 0.1;
    
    words.forEach((word, index) => {
      const duration = word.length * 0.1; // Rough estimate
      
      // Simple viseme mapping based on vowels
      let viseme = 'rest';
      if (/[aeiou]/i.test(word)) {
        viseme = 'aa';
      } else if (/[mnpb]/i.test(word)) {
        viseme = 'mm';
      } else if (/[fvs]/i.test(word)) {
        viseme = 'ff';
      }
      
      visemes.push({ time: currentTime, viseme });
      currentTime += duration;
    });
    
    return visemes;
  }

  /**
   * Play UI sound effect
   */
  playUI(action: 'click' | 'hover' | 'select' | 'error' | 'success'): void {
    const sfxMap: Record<string, string> = {
      click: 'ui_click',
      hover: 'ui_hover',
      select: 'ui_select',
      error: 'ui_error',
      success: 'ui_success'
    };
    
    this.playSFX(sfxMap[action] || 'ui_click', { volume: 0.6 });
  }

  /**
   * Play resource collection sound
   */
  playResourceCollect(resourceType: string): void {
    this.playSFX(`resource_${resourceType}`, {
      volume: 0.7,
      pitch: 1.0 + Math.random() * 0.1 // Slight variation
    });
  }

  /**
   * Play combat sound
   */
  playCombat(action: 'attack' | 'hit' | 'explosion' | 'defense'): void {
    const sfxMap: Record<string, string> = {
      attack: 'combat_attack',
      hit: 'combat_hit',
      explosion: 'combat_explosion',
      defense: 'combat_defense'
    };
    
    this.playSFX(sfxMap[action], {
      volume: 0.8,
      pitch: 0.9 + Math.random() * 0.2
    });
  }

  /**
   * Play environmental sound
   */
  playEnvironment(sound: 'wind' | 'lava' | 'creak' | 'rumble'): void {
    this.playSFX(`env_${sound}`, {
      volume: 0.5,
      loop: false
    });
  }

  /**
   * Volume controls
   */
  setMusicVolume(v: number): void {
    this.config.musicVolume = v;
    this.engine.setMusicVolume(v);
  }

  setSFXVolume(v: number): void {
    this.config.sfxVolume = v;
    this.engine.setSFXVolume(v);
  }

  setDialogVolume(v: number): void {
    this.config.dialogVolume = v;
    this.engine.setDialogVolume(v);
  }

  setMasterVolume(v: number): void {
    this.config.masterVolume = v;
    this.engine.setMasterVolume(v);
  }

  /**
   * Get volumes
   */
  getMusicVolume(): number {
    return this.engine.getMusicVolume();
  }

  getSFXVolume(): number {
    return this.engine.getSFXVolume();
  }

  getDialogVolume(): number {
    return this.engine.getDialogVolume();
  }

  /**
   * Stop all audio
   */
  stopAll(): void {
    this.engine.stopAll();
  }

  /**
   * Pause/Resume
   */
  async pause(): Promise<void> {
    await this.engine.suspend();
  }

  async resume(): Promise<void> {
    await this.engine.resume();
  }

  /**
   * Get engine instance (for advanced usage)
   */
  getEngine(): AudioEngine {
    return this.engine;
  }

  /**
   * Initialize audio system (ensure context is started)
   */
  async init(): Promise<void> {
    try {
      await this.engine.ensureStarted();
    } catch (error) {
      console.error('Audio initialization failed:', error);
      // Don't throw - allow game to continue without audio
    }
  }

  /**
   * Get AudioContext (for advanced usage)
   */
  getAudioContext(): AudioContext {
    try {
      return this.engine.getAudioContext();
    } catch (error) {
      console.error('Failed to get audio context:', error);
      // Return a fallback - this should not happen if engine is properly initialized
      throw error;
    }
  }

  /**
   * Get SFX gain node (for connecting external audio sources)
   */
  getSfxGainNode(): GainNode {
    try {
      return this.engine.getSfxGainNode();
    } catch (error) {
      console.error('Failed to get SFX gain node:', error);
      throw error;
    }
  }

  /**
   * Play TTS audio from ArrayBuffer
   */
  async playTtsArrayBuffer(
    audioBuffer: ArrayBuffer,
    options: {
      volume?: number;
      duckMusic?: boolean;
    } = {}
  ): Promise<{ id: string; stop: () => void }> {
    return this.engine.playTtsArrayBuffer(audioBuffer, options);
  }

  /**
   * Duck music (for external control)
   */
  duckMusic(enable: boolean): void {
    if (enable) {
      this.engine.duckMusicFor(5, 0.25); // Duck for 5 seconds
    }
  }

  /**
   * Get singleton instance
   */
  private static instanceCache: AudioManager | null = null;
  static instance(): AudioManager {
    if (!this.instanceCache) {
      this.instanceCache = new AudioManager();
    }
    return this.instanceCache;
  }
}
