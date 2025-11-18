// src/audio/audioInit.ts
// Audio initialization helper for game boot sequence

import AudioManager from './AudioManager';
import MusicManager from './MusicManager';
import SFXManager from './SFXManager';
import AdaptiveEffects from './AdaptiveEffects';
import AdvisorVoiceFilter from './AdvisorVoiceFilter';
import ChromaPulseSynth from './ChromaPulseSynth';
import BackgroundMusic from './BackgroundMusic';

export async function initializeAudio() {
  try {
    // Initialize core audio manager
    await AudioManager.instance().init({ enableAnalyzer: false });

    // Initialize SFX Manager
    const sfxManager = SFXManager.instance();
    await sfxManager.init();
    
    // Preload essential SFX (priority queues first)
    // Start with UI sounds (always needed)
    await sfxManager.preloadCategory('ui');
    
    // Then preload combat sounds (frequent)
    await sfxManager.preloadCategory('combat');
    
    // Preload all remaining SFX in background (can be async)
    sfxManager.preloadAll().catch(err => {
      console.warn('Background SFX preload failed:', err);
    });

    // Initialize adaptive effects
    const adaptiveEffects = AdaptiveEffects.instance();
    await adaptiveEffects.init();

    // Initialize advisor voice filter
    const voiceFilter = AdvisorVoiceFilter.instance();
    await voiceFilter.init();

    // Initialize chroma pulse synth (procedural)
    const chromaSynth = ChromaPulseSynth.instance();
    await chromaSynth.init();

    // Preload music stems (add your actual asset paths)
    // Wrap in try-catch to prevent crashes if music files don't exist
    try {
      await MusicManager.instance().loadStems([
        { id: 'ambient', url: '/assets/music/ambient.ogg' },
        { id: 'tension', url: '/assets/music/tension.ogg' },
        { id: 'pulse', url: '/assets/music/pulse.ogg' },
      ]);

      // Start baseline music
      MusicManager.instance().playBase(['ambient', 'pulse']);
    } catch (musicError) {
      console.warn('Music loading failed (non-critical):', musicError);
      // Continue without music - game will still work
    }

    // Start background music (procedural - no files needed)
    try {
      const backgroundMusic = BackgroundMusic.instance();
      await backgroundMusic.init();
      // Start after a short delay to ensure audio context is ready
      // This will be triggered by user interaction (game start)
      setTimeout(async () => {
        try {
          await backgroundMusic.start();
        } catch (err) {
          console.warn('BackgroundMusic: Failed to start (will retry on user interaction)', err);
        }
      }, 100);
    } catch (bgMusicError) {
      console.warn('BackgroundMusic initialization failed (non-critical):', bgMusicError);
    }

    // Start chroma pulse synth (procedural ambient)
    // Start after a short delay to ensure audio context is ready
    setTimeout(async () => {
      try {
        await chromaSynth.start();
      } catch (err) {
        console.warn('ChromaPulseSynth: Failed to start (will retry on user interaction)', err);
      }
    }, 100);

    console.log('Audio system initialized with SFX, adaptive effects, and background music');
  } catch (error) {
    console.warn('Audio initialization failed (non-critical):', error);
    // Don't throw - audio is optional
  }
}

