/**
 * Terrain Audio System
 * 
 * Handles biome-specific ambient loops and event sounds.
 * Each biome gets a distinct ambient bed plus unique event stings.
 */

import SFXManager from './SFXManager';
import type { PlaybackHandle } from './SFXManager';

export type BiomeType = 
  | 'NeonPlains'
  | 'Biome_Biotech'
  | 'Crater'
  | 'LavaField'
  | 'FogVault';

export interface TerrainAudioConfig {
  biome: BiomeType;
  ambientVolume?: number;
  eventCooldown?: number; // seconds between events
  eventProbability?: number; // 0-1 chance per check
}

/**
 * Terrain Audio Component
 * Manages ambient loops and random events for a biome
 */
export default class TerrainAudio {
  private sfxManager: SFXManager;
  private config: Required<TerrainAudioConfig>;
  private ambientHandle: PlaybackHandle | null = null;
  private eventTimer = 0;
  private isActive = false;

  // Event sounds per biome
  private readonly biomeEvents: Record<BiomeType, string[]> = {
    'NeonPlains': ['Chroma_Pulse', 'Breadcrumb_Ping'],
    'Biome_Biotech': ['BioBloom_Grow', 'Tile_Corrupt_Dissolve'],
    'Crater': ['Tile_Corrupt_Dissolve', 'Electro_Spark'],
    'LavaField': ['LavaVent_Erupt', 'LavaVent_Pressure'],
    'FogVault': ['Breadcrumb_Ping', 'Electro_Spark'],
  };

  constructor(config: TerrainAudioConfig) {
    this.sfxManager = SFXManager.instance();
    this.config = {
      ambientVolume: config.ambientVolume ?? 0.5,
      eventCooldown: config.eventCooldown ?? 8.0,
      eventProbability: config.eventProbability ?? 0.2,
      ...config
    };
  }

  /**
   * Start terrain audio (ambient loop)
   */
  start(): void {
    if (this.isActive) return;

    const ambientKey = `Ambient_${this.config.biome}`;
    this.ambientHandle = this.sfxManager.playCue(ambientKey, {
      volume: this.config.ambientVolume
    });

    this.isActive = true;
    this.eventTimer = 0;
  }

  /**
   * Stop terrain audio
   */
  stop(): void {
    if (!this.isActive) return;

    if (this.ambientHandle) {
      this.ambientHandle.stop();
      this.ambientHandle = null;
    }

    this.isActive = false;
  }

  /**
   * Update terrain audio (call in game loop)
   * Handles random event triggering
   */
  update(deltaTime: number): void {
    if (!this.isActive) return;

    this.eventTimer += deltaTime;

    if (this.eventTimer >= this.config.eventCooldown) {
      // Check if we should trigger an event
      if (Math.random() < this.config.eventProbability) {
        this.triggerRandomEvent();
      }
      this.eventTimer = 0;
    }

    // Add subtle pitch variation to ambient
    // This would require modifying the playback handle pitch
    // For now, handled by the SFX system
  }

  /**
   * Trigger a random biome event sound
   */
  private triggerRandomEvent(): void {
    const events = this.biomeEvents[this.config.biome];
    if (events.length === 0) return;

    const randomEvent = events[Math.floor(Math.random() * events.length)];
    this.sfxManager.playCue(randomEvent, { volume: 0.6 });
  }

  /**
   * Manually trigger a specific terrain event
   */
  triggerEvent(eventKey: string, volume: number = 0.8): void {
    this.sfxManager.playCue(eventKey, { volume });
  }

  /**
   * Update ambient volume
   */
  setAmbientVolume(volume: number): void {
    this.config.ambientVolume = Math.max(0, Math.min(1, volume));
    // Restart ambient with new volume
    if (this.isActive) {
      this.stop();
      this.start();
    }
  }

  /**
   * Check if audio is active
   */
  isPlaying(): boolean {
    return this.isActive;
  }

  /**
   * Create terrain audio for a biome
   */
  static create(config: TerrainAudioConfig): TerrainAudio {
    return new TerrainAudio(config);
  }
}


