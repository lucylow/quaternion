// src/audio/audioInit.ts
// Audio initialization helper for game boot sequence
// Now uses the new AudioEngine system with fallback to legacy systems

import { initializeAudioSystem } from './AudioSystemIntegration';

export async function initializeAudio() {
  try {
    // Initialize new audio system (Web Audio API based)
    const audioManager = await initializeAudioSystem();
    
    console.log('Audio system initialized with Web Audio API engine');
    return audioManager;
  } catch (error) {
    console.warn('Audio initialization failed (non-critical):', error);
    // Don't throw - audio is optional
    return null;
  }
}

