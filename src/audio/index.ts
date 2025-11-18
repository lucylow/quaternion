// src/audio/index.ts
// Central export for audio system

export { default as AudioManager } from './AudioManager';
export { default as MusicManager } from './MusicManager';
export { default as SFXManager, SFX_CUES, type SFXCue } from './SFXManager';
export { default as AdaptiveEffects, type AdaptiveEffectParams } from './AdaptiveEffects';
export { default as TerrainAudio, type BiomeType, type TerrainAudioConfig } from './TerrainAudio';
export { default as CombatAudio, type CombatEvent } from './CombatAudio';
export { default as AdvisorVoiceFilter, type EmotionType } from './AdvisorVoiceFilter';
export { default as CinematicAudio, type CinematicEventType } from './CinematicAudio';
export { default as ChromaPulseSynth } from './ChromaPulseSynth';
export { requestTtsAudio } from './ttsClient';
export { dialogueLinesToWebVTT, type DialogueLine } from './subtitleGenerator';
export { sendAudioTelemetry } from './telemetry';
export { initializeAudio } from './audioInit';
export { narrateModelDecision, playSfx } from './ttsHelpers';

