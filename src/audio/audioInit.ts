// src/audio/audioInit.ts
// Audio initialization helper for game boot sequence

import AudioManager from './AudioManager';
import MusicManager from './MusicManager';

export async function initializeAudio() {
  try {
    // Initialize AudioManager
    await AudioManager.instance().init({ enableAnalyzer: false });

    // Preload common SFX (add your actual asset paths)
    await AudioManager.instance().preload([
      { key: 'ui_click', url: '/assets/sfx/ui_click.ogg' },
      { key: 'boom', url: '/assets/sfx/boom.ogg' },
      // Add more SFX as needed
    ]);

    // Preload music stems (add your actual asset paths)
    await MusicManager.instance().loadStems([
      { id: 'ambient', url: '/assets/music/ambient.ogg' },
      { id: 'tension', url: '/assets/music/tension.ogg' },
      { id: 'pulse', url: '/assets/music/pulse.ogg' },
    ]);

    // Start baseline music
    MusicManager.instance().playBase(['ambient', 'pulse']);

    console.log('Audio system initialized');
  } catch (error) {
    console.warn('Audio initialization failed (non-critical):', error);
    // Don't throw - audio is optional
  }
}

