/**
 * Map Music Manager
 * 
 * Manages different moody music configurations for different map themes.
 * Each map theme gets its own unique musical character through procedural synthesis.
 */

import ChromaPulseSynth from './ChromaPulseSynth';
import { mapLoader } from '../services/MapLoader';
import { MusicPreset } from './MusicPreset';

export type { MusicPreset };

/**
 * Music presets for different map themes
 * Each preset creates a unique moody atmosphere
 */
const MUSIC_PRESETS: Record<string, MusicPreset> = {
  // Alien/Twilight - mysterious, ethereal, otherworldly
  alien: {
    baseFreq: 180, // Lower, more mysterious
    modulationDepth: 0.4,
    lfoRate: 0.2, // Slower, more breathing
    lfo2Rate: 0.12,
    detuneAmount: 0.03,
    harmonicRatio: 1.618, // Golden ratio for mystical feel
    randomVariation: 0.08,
    filterCenterFreq: 1000,
    filterQ: 1.5,
    mainVolume: 0.2,
    detunedVolume: 0.18,
    harmonicVolume: 0.12,
    distortionAmount: 0.5,
    phaserDepth: 600,
    reverbAmount: 0.3
  },

  // Urban - tense, industrial, mechanical
  urban: {
    baseFreq: 250, // Higher, more urgent
    modulationDepth: 0.5,
    lfoRate: 0.35, // Faster, more mechanical
    lfo2Rate: 0.25,
    detuneAmount: 0.01, // Less detune for cleaner sound
    harmonicRatio: 1.5, // Perfect fifth
    randomVariation: 0.03,
    filterCenterFreq: 1500,
    filterQ: 2.0,
    mainVolume: 0.25,
    detunedVolume: 0.12,
    harmonicVolume: 0.08,
    distortionAmount: 0.7, // More distortion for industrial feel
    phaserDepth: 400,
    reverbAmount: 0.15 // Less reverb for tighter sound
  },

  // Aquatic/Underwater - flowing, fluid, deep
  aquatic: {
    baseFreq: 200,
    modulationDepth: 0.35,
    lfoRate: 0.18, // Very slow, like waves
    lfo2Rate: 0.1,
    detuneAmount: 0.04,
    harmonicRatio: 1.333, // Perfect fourth
    randomVariation: 0.06,
    filterCenterFreq: 800,
    filterQ: 1.0,
    mainVolume: 0.22,
    detunedVolume: 0.2,
    harmonicVolume: 0.15,
    distortionAmount: 0.4,
    phaserDepth: 800, // Deep phaser for underwater feel
    reverbAmount: 0.4 // More reverb for depth
  },

  // Mountain - epic, expansive, elevated
  mountain: {
    baseFreq: 220,
    modulationDepth: 0.45,
    lfoRate: 0.22,
    lfo2Rate: 0.14,
    detuneAmount: 0.025,
    harmonicRatio: 1.5,
    randomVariation: 0.05,
    filterCenterFreq: 1200,
    filterQ: 1.8,
    mainVolume: 0.24,
    detunedVolume: 0.16,
    harmonicVolume: 0.12,
    distortionAmount: 0.55,
    phaserDepth: 500,
    reverbAmount: 0.25
  },

  // Desert - sparse, dry, vast
  desert: {
    baseFreq: 190,
    modulationDepth: 0.3,
    lfoRate: 0.15, // Very slow, like heat shimmer
    lfo2Rate: 0.08,
    detuneAmount: 0.02,
    harmonicRatio: 1.414, // Square root of 2
    randomVariation: 0.1, // More variation for sparse feel
    filterCenterFreq: 900,
    filterQ: 0.8, // Less resonance
    mainVolume: 0.18,
    detunedVolume: 0.14,
    harmonicVolume: 0.1,
    distortionAmount: 0.45,
    phaserDepth: 300,
    reverbAmount: 0.35 // More reverb for vastness
  },

  // Ice - cold, crystalline, sharp
  ice: {
    baseFreq: 240,
    modulationDepth: 0.4,
    lfoRate: 0.28,
    lfo2Rate: 0.2,
    detuneAmount: 0.015,
    harmonicRatio: 1.732, // Square root of 3
    randomVariation: 0.04,
    filterCenterFreq: 1800, // Higher frequency for sharpness
    filterQ: 2.5, // High resonance for crystalline
    mainVolume: 0.22,
    detunedVolume: 0.1,
    harmonicVolume: 0.08,
    distortionAmount: 0.5,
    phaserDepth: 450,
    reverbAmount: 0.2
  },

  // Volcanic - intense, fiery, chaotic
  volcanic: {
    baseFreq: 210,
    modulationDepth: 0.6, // High modulation for intensity
    lfoRate: 0.4, // Fast, chaotic
    lfo2Rate: 0.3,
    detuneAmount: 0.035,
    harmonicRatio: 1.5,
    randomVariation: 0.12, // High variation for chaos
    filterCenterFreq: 1400,
    filterQ: 2.2,
    mainVolume: 0.26,
    detunedVolume: 0.18,
    harmonicVolume: 0.14,
    distortionAmount: 0.8, // Heavy distortion
    phaserDepth: 700,
    reverbAmount: 0.28
  },

  // Jungle - lush, organic, alive
  jungle: {
    baseFreq: 195,
    modulationDepth: 0.38,
    lfoRate: 0.25,
    lfo2Rate: 0.16,
    detuneAmount: 0.03,
    harmonicRatio: 1.618, // Golden ratio
    randomVariation: 0.07,
    filterCenterFreq: 1100,
    filterQ: 1.3,
    mainVolume: 0.23,
    detunedVolume: 0.19,
    harmonicVolume: 0.13,
    distortionAmount: 0.5,
    phaserDepth: 550,
    reverbAmount: 0.32
  },

  // Mixed/Varied - balanced, adaptive
  mixed: {
    baseFreq: 220,
    modulationDepth: 0.4,
    lfoRate: 0.25,
    lfo2Rate: 0.15,
    detuneAmount: 0.02,
    harmonicRatio: 1.5,
    randomVariation: 0.05,
    filterCenterFreq: 1200,
    filterQ: 1.2,
    mainVolume: 0.25,
    detunedVolume: 0.15,
    harmonicVolume: 0.1,
    distortionAmount: 0.6,
    phaserDepth: 500,
    reverbAmount: 0.2
  },

  // Open - spacious, clear, minimal
  open: {
    baseFreq: 200,
    modulationDepth: 0.3,
    lfoRate: 0.2,
    lfo2Rate: 0.12,
    detuneAmount: 0.02,
    harmonicRatio: 1.5,
    randomVariation: 0.04,
    filterCenterFreq: 1000,
    filterQ: 1.0,
    mainVolume: 0.2,
    detunedVolume: 0.15,
    harmonicVolume: 0.1,
    distortionAmount: 0.4,
    phaserDepth: 400,
    reverbAmount: 0.3
  },

  // Tactical - precise, strategic, focused
  tactical: {
    baseFreq: 230,
    modulationDepth: 0.42,
    lfoRate: 0.3,
    lfo2Rate: 0.18,
    detuneAmount: 0.018,
    harmonicRatio: 1.5,
    randomVariation: 0.04,
    filterCenterFreq: 1300,
    filterQ: 1.6,
    mainVolume: 0.24,
    detunedVolume: 0.14,
    harmonicVolume: 0.1,
    distortionAmount: 0.55,
    phaserDepth: 480,
    reverbAmount: 0.22
  }
};

/**
 * Default preset (fallback)
 */
const DEFAULT_PRESET: MusicPreset = {
  baseFreq: 220,
  modulationDepth: 0.3,
  lfoRate: 0.25,
  lfo2Rate: 0.15,
  detuneAmount: 0.02,
  harmonicRatio: 1.5,
  randomVariation: 0.05,
  filterCenterFreq: 1200,
  filterQ: 1.2,
  mainVolume: 0.25,
  detunedVolume: 0.15,
  harmonicVolume: 0.1,
  distortionAmount: 0.6,
  phaserDepth: 500,
  reverbAmount: 0.2
};

export default class MapMusicManager {
  private static _instance: MapMusicManager | null = null;
  public static instance(): MapMusicManager {
    if (!this._instance) this._instance = new MapMusicManager();
    return this._instance;
  }

  private currentTheme: string | null = null;
  private chromaSynth: ChromaPulseSynth;

  private constructor() {
    this.chromaSynth = ChromaPulseSynth.instance();
  }

  /**
   * Get music preset for a map theme
   */
  getPresetForTheme(theme: string): MusicPreset {
    return MUSIC_PRESETS[theme] || DEFAULT_PRESET;
  }

  /**
   * Get music preset for a map ID
   */
  getPresetForMapId(mapId: string): MusicPreset {
    const mapConfig = mapLoader.getMapById(mapId);
    if (mapConfig) {
      return this.getPresetForTheme(mapConfig.theme);
    }
    return DEFAULT_PRESET;
  }

  /**
   * Apply music preset to the chroma synth
   */
  async applyPreset(preset: MusicPreset): Promise<void> {
    // If synth is already playing, we need to restart it with new parameters
    const wasPlaying = this.chromaSynth.isActive();
    
    if (wasPlaying) {
      this.chromaSynth.stop();
    }

    // Apply preset parameters to synth
    // We'll need to extend ChromaPulseSynth to accept preset configuration
    await this.chromaSynth.applyPreset(preset);

    if (wasPlaying) {
      await this.chromaSynth.start();
    }
  }

  /**
   * Set music for a specific map theme
   */
  async setMusicForTheme(theme: string): Promise<void> {
    if (this.currentTheme === theme) {
      return; // Already set
    }

    const preset = this.getPresetForTheme(theme);
    await this.applyPreset(preset);
    this.currentTheme = theme;
  }

  /**
   * Set music for a specific map ID
   */
  async setMusicForMapId(mapId: string): Promise<void> {
    const mapConfig = mapLoader.getMapById(mapId);
    if (mapConfig) {
      await this.setMusicForTheme(mapConfig.theme);
    } else {
      // Fallback to default
      await this.setMusicForTheme('mixed');
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): string | null {
    return this.currentTheme;
  }
}

