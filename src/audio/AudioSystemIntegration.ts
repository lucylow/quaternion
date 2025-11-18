/**
 * Audio System Integration
 * 
 * Provides a unified interface for game audio operations.
 * Bridges the gap between game code and audio system.
 */

import AudioManager from './AudioManager';
import AdaptiveEffects from './AdaptiveEffects';
import SFXManager from './SFXManager';

export interface GameAudioParams {
  intensity?: number;    // 0-1, overall game intensity
  morality?: number;      // -1 to 1, moral alignment
  instability?: number;   // 0-1, world instability
}

/**
 * Get the AudioManager instance
 */
export function getAudioManager(): AudioManager {
  return AudioManager.instance();
}

/**
 * Update game audio based on current game state
 */
export function updateGameAudio(params: GameAudioParams): void {
  const adaptiveEffects = AdaptiveEffects.instance();
  
  // Convert intensity to chroma level (0-1)
  const chromaLevel = params.intensity !== undefined ? params.intensity : 0.5;
  
  // Use instability directly (0-1)
  const instabilityLevel = params.instability !== undefined ? params.instability : 0;
  
  adaptiveEffects.update({
    chromaLevel,
    instabilityLevel
  });
}

/**
 * Play a sound effect
 */
export function playSFX(sfxKey: string, options?: { volume?: number; loop?: boolean }): void {
  const audioManager = AudioManager.instance();
  audioManager.playSfx(sfxKey, options);
}

/**
 * Play a UI sound effect
 */
export function playUISound(soundName: string, options?: { volume?: number }): void {
  const sfxManager = SFXManager.instance();
  sfxManager.play(soundName, options);
}

/**
 * Play a resource-related sound effect
 */
export function playResourceSound(resourceType: string, action: string, options?: { volume?: number }): void {
  const sfxManager = SFXManager.instance();
  const soundKey = `resource_${resourceType}_${action}`;
  sfxManager.play(soundKey, options);
}

/**
 * Play a combat sound effect
 */
export function playCombatSound(eventType: string, options?: { volume?: number }): void {
  const sfxManager = SFXManager.instance();
  const soundKey = `combat_${eventType}`;
  sfxManager.play(soundKey, options);
}

/**
 * Play commander dialogue
 */
export function playCommanderDialogue(commanderId: string, dialogueKey: string, options?: { volume?: number }): void {
  const audioManager = AudioManager.instance();
  // This would typically trigger TTS or play pre-recorded dialogue
  // For now, we'll use a placeholder
  console.log(`Playing dialogue for ${commanderId}: ${dialogueKey}`);
  // In a full implementation, this would call the TTS system
}

