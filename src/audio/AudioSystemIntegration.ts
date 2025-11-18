/**
 * Audio System Integration
 * Integrates new AudioEngine with existing game systems
 */

import AudioManager from './AudioManager';
import { MUSIC_STEMS } from './musicConfig';
import { SFX_CONFIG } from './sfxConfig';
import type { GameAudioState } from './AudioEngine';

let audioManagerInstance: AudioManager | null = null;

/**
 * Initialize audio system (called from game startup)
 */
export async function initializeAudioSystem(): Promise<AudioManager> {
  if (audioManagerInstance) {
    return audioManagerInstance;
  }

  // Create audio manager with default config
  audioManagerInstance = new AudioManager({
    musicVolume: 0.7,
    sfxVolume: 1.0,
    dialogVolume: 1.0,
    masterVolume: 0.9
  });

  // Initialize music with stems
  await audioManagerInstance.initializeMusic(MUSIC_STEMS);

  // Preload essential SFX
  const essentialSFX = [
    'ui_click',
    'ui_hover',
    'ui_select',
    'resource_ore',
    'resource_energy',
    'resource_biomass',
    'resource_data'
  ];

  for (const sfxName of essentialSFX) {
    const config = SFX_CONFIG[sfxName];
    if (config) {
      try {
        await audioManagerInstance.preloadSFX(sfxName, config.path);
      } catch (error) {
        console.warn(`Failed to preload SFX ${sfxName}:`, error);
      }
    }
  }

  // Preload remaining SFX in background
  Object.entries(SFX_CONFIG).forEach(([name, config]) => {
    if (!essentialSFX.includes(name)) {
      audioManagerInstance?.preloadSFX(name, config.path).catch(err => {
        console.warn(`Background SFX preload failed for ${name}:`, err);
      });
    }
  });

  return audioManagerInstance;
}

/**
 * Get audio manager instance
 */
export function getAudioManager(): AudioManager | null {
  return audioManagerInstance;
}

/**
 * Update audio based on game state
 */
export function updateGameAudio(state: Partial<GameAudioState>): void {
  if (audioManagerInstance) {
    audioManagerInstance.updateGameState(state);
  }
}

/**
 * Play SFX helper
 */
export function playSFX(name: string, options?: {
  volume?: number;
  pitch?: number;
  delay?: number;
  pan?: number;
}): void {
  audioManagerInstance?.playSFX(name, options);
}

/**
 * Play UI sound
 */
export function playUISound(action: 'click' | 'hover' | 'select' | 'error' | 'success'): void {
  audioManagerInstance?.playUI(action);
}

/**
 * Play resource collection sound
 */
export function playResourceSound(resourceType: string): void {
  audioManagerInstance?.playResourceCollect(resourceType);
}

/**
 * Play combat sound
 */
export function playCombatSound(action: 'attack' | 'hit' | 'explosion' | 'defense'): void {
  audioManagerInstance?.playCombat(action);
}

/**
 * Play commander dialogue
 */
export async function playCommanderDialogue(
  commanderId: string,
  text: string,
  visemeCallback?: (viseme: string, time: number) => void
): Promise<void> {
  if (audioManagerInstance) {
    await audioManagerInstance.playCommanderDialogue(commanderId, text, visemeCallback);
  }
}

