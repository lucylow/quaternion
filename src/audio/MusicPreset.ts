/**
 * Music Preset Interface
 * 
 * Defines the structure for music preset configurations used by the procedural synth.
 */

export interface MusicPreset {
  // Base frequency (Hz) - determines the fundamental pitch
  baseFreq: number;
  // Modulation depth - how much the filter moves
  modulationDepth: number;
  // LFO rates - how fast the modulation happens
  lfoRate: number;
  lfo2Rate: number;
  // Detuning amount for oscillator 2 (creates chorus effect)
  detuneAmount: number;
  // Harmonic ratio for oscillator 3 (interval relationship)
  harmonicRatio: number;
  // Random variation for organic feel
  randomVariation: number;
  // Filter center frequency
  filterCenterFreq: number;
  // Filter Q (resonance)
  filterQ: number;
  // Volume levels
  mainVolume: number;
  detunedVolume: number;
  harmonicVolume: number;
  // Distortion amount
  distortionAmount: number;
  // Phaser depth
  phaserDepth: number;
  // Reverb amount
  reverbAmount: number;
}

