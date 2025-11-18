/**
 * Audio System Exports - Simplified
 */

// Core audio systems
export * from './AudioManager';
export * from './AudioEngine';

// Game audio integration (if needed)
export { GameAudioIntegration } from './GameAudioIntegration';
export type { GameAudioEvent } from './GameAudioIntegration';

// Landing page audio
export { getLandingPageAudio } from './LandingPageAudio';
export { default as LandingPageAudio } from './LandingPageAudio';
