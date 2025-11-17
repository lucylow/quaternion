// src/audio/index.ts
// Central export for audio system

export { default as AudioManager } from './AudioManager';
export { default as MusicManager } from './MusicManager';
export { requestTtsAudio } from './ttsClient';
export { dialogueLinesToWebVTT, type DialogueLine } from './subtitleGenerator';
export { sendAudioTelemetry } from './telemetry';
export { initializeAudio } from './audioInit';
export { narrateModelDecision, playSfx } from './ttsHelpers';

