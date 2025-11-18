// src/audio/audioInit.ts
// Audio initialization helper for game boot sequence

import AudioManager from './AudioManager';
import MusicManager from './MusicManager';
import SFXManager from './SFXManager';
import AdaptiveEffects from './AdaptiveEffects';
import AdvisorVoiceFilter from './AdvisorVoiceFilter';
import ChromaPulseSynth from './ChromaPulseSynth';

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
    await MusicManager.instance().loadStems([
      { id: 'ambient', url: '/assets/music/ambient.ogg' },
      { id: 'tension', url: '/assets/music/tension.ogg' },
      { id: 'pulse', url: '/assets/music/pulse.ogg' },
    ]);

    // Start baseline music
    MusicManager.instance().playBase(['ambient', 'pulse']);

    // Start chroma pulse synth (procedural ambient)
    // Uncomment when ready:
    // chromaSynth.start();

    console.log('Audio system initialized with SFX & adaptive effects');
  } catch (error) {
    console.warn('Audio initialization failed (non-critical):', error);
    // Don't throw - audio is optional
  }
}

