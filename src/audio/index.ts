/**
 * Audio System Exports
 * Central export for all audio functionality
 */

// Core audio systems
export * from './AudioManager';
export * from './AudioEngine';
export * from './MusicManager';
export * from './SFXManager';

// ElevenLabs integration
export { ElevenLabsAudioIntegration } from './ElevenLabsAudioIntegration';
export type { VoiceEvent, VoiceQueueItem } from './ElevenLabsAudioIntegration';

export { GameAudioIntegration } from './GameAudioIntegration';
export type { GameAudioEvent } from './GameAudioIntegration';

// Audio systems
export * from './AdaptiveMusicSystem';
export * from './CombatAudio';
export * from './TerrainAudio';
export * from './CinematicAudio';
export * from './AdaptiveEffects';

// Dialogue systems
export * from './AdvisorDialogSystem';
export * from './DialogEventManager';

// TTS
export * from './ttsClient';
export * from './ttsHelpers';
export * from './subtitleGenerator';

// ElevenLabs comprehensive client
export * from './elevenClient';
