/**
 * Cinematic Audio Triggers
 * 
 * Handles big set-piece sounds:
 * - Kaiju events
 * - Victory/defeat cinematics
 * - Collapse sequences
 * - Moral verdicts
 */

import SFXManager from './SFXManager';
import MusicManager from './MusicManager';
import type { PlaybackHandle } from './SFXManager';

export type CinematicEventType = 
  | 'kaiju_rise'
  | 'kaiju_stomp'
  | 'victory'
  | 'defeat'
  | 'collapse'
  | 'moral_verdict'
  | 'ultimate_impact';

/**
 * Cinematic Audio Manager
 * Coordinates cinematic audio events
 */
export default class CinematicAudio {
  private static _instance: CinematicAudio | null = null;
  public static instance(): CinematicAudio {
    if (!this._instance) this._instance = new CinematicAudio();
    return this._instance;
  }

  private sfxManager: SFXManager;
  private musicManager: MusicManager;
  private activeEvents: Map<string, PlaybackHandle> = new Map();

  private constructor() {
    this.sfxManager = SFXManager.instance();
    this.musicManager = MusicManager.instance();
  }

  /**
   * Play cinematic event
   */
  playEvent(
    event: CinematicEventType,
    options: {
      volume?: number;
      duckMusic?: boolean;
      fadeTime?: number;
    } = {}
  ): PlaybackHandle | null {
    const volume = options.volume ?? 1.0;
    const duckMusic = options.duckMusic ?? true;
    const fadeTime = options.fadeTime ?? 1.0;

    // Duck music if requested
    if (duckMusic) {
      this.duckMusic(true, fadeTime);
    }

    let handle: PlaybackHandle | null = null;

    switch (event) {
      case 'kaiju_rise':
        handle = this.sfxManager.playKaijuRise();
        break;
      case 'kaiju_stomp':
        handle = this.sfxManager.playCue('Kaiju_Stomp', { volume });
        break;
      case 'victory':
        handle = this.playVictory();
        break;
      case 'defeat':
        handle = this.playDefeat();
        break;
      case 'collapse':
        handle = this.sfxManager.playCollapse();
        break;
      case 'moral_verdict':
        handle = this.playMoralVerdict(volume);
        break;
      case 'ultimate_impact':
        handle = this.sfxManager.playCue('Ultimate_Impact', { volume });
        break;
    }

    if (handle) {
      this.activeEvents.set(event, handle);

      // Restore music after event (estimate duration)
      if (duckMusic) {
        const estimatedDuration = this.getEventDuration(event);
        setTimeout(() => {
          this.duckMusic(false, fadeTime);
        }, (estimatedDuration + fadeTime) * 1000);
      }
    }

    return handle;
  }

  /**
   * Play victory sequence
   */
  private playVictory(): PlaybackHandle | null {
    // Play victory sting
    const handle = this.sfxManager.playVictory();

    // Fade music to triumphant stem
    this.musicManager.setStemVolumes({
      ambient: 0.2,
      tension: 0.0,
      pulse: 1.0
    }, 2.0);

    return handle;
  }

  /**
   * Play defeat sequence
   */
  private playDefeat(): PlaybackHandle | null {
    // Play collapse sound
    const handle = this.sfxManager.playCollapse();

    // Fade music to tension
    this.musicManager.setStemVolumes({
      ambient: 0.0,
      tension: 1.0,
      pulse: 0.3
    }, 2.0);

    return handle;
  }

  /**
   * Play moral verdict sting
   */
  private playMoralVerdict(volume: number = 1.0): PlaybackHandle | null {
    return this.sfxManager.playCue('Moral_Verdict_Sting', { volume });
  }

  /**
   * Duck/unduck music smoothly
   */
  private duckMusic(enable: boolean, fadeTime: number = 1.0): void {
    const am = this.sfxManager as any;
    // Access AudioManager through SFXManager (would need refactoring)
    // For now, use MusicManager volume control
    const currentVolumes = this.musicManager.isActive() ? 1.0 : 0.0;
    const targetVolume = enable ? 0.35 : 1.0;

    // This is a simplified version - would need AudioManager duckMusic method
    // MusicManager doesn't have direct duck support, so we'd fade stems
    if (enable) {
      this.musicManager.setStemVolumes({
        ambient: 0.35,
        tension: 0.35,
        pulse: 0.35
      }, fadeTime);
    } else {
      this.musicManager.setStemVolumes({
        ambient: 1.0,
        tension: 1.0,
        pulse: 1.0
      }, fadeTime);
    }
  }

  /**
   * Get estimated duration for event (for scheduling)
   */
  private getEventDuration(event: CinematicEventType): number {
    const durations: Record<CinematicEventType, number> = {
      kaiju_rise: 4.0,
      kaiju_stomp: 3.0,
      victory: 5.0,
      defeat: 4.5,
      collapse: 4.5,
      moral_verdict: 2.5,
      ultimate_impact: 3.5
    };
    return durations[event] || 3.0;
  }

  /**
   * Stop all cinematic events
   */
  stopAll(): void {
    this.activeEvents.forEach(handle => handle.stop());
    this.activeEvents.clear();
  }

  /**
   * Clean up
   */
  dispose(): void {
    this.stopAll();
  }
}

