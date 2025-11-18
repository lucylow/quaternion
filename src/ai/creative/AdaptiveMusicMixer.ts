/**
 * Adaptive AI Music Mixer
 * Procedurally adaptive soundtrack that shifts based on game state
 * Integrates with Fuser, Magnific, and Google AI Music
 */

import { MusicIntegration, MusicState } from '../integrations/MusicIntegration';

export interface GameStateMetrics {
  equilibrium: number; // 0-1, balance of all four axes
  chaos: number; // 0-1, entropy/instability
  tension: number; // 0-1, combat intensity
  energyCrisis: boolean;
  biomassGrowth: boolean;
  imbalance: boolean;
}

export interface MusicStyle {
  name: string;
  mood: string;
  stems: {
    ambient: number;
    drums: number;
    bass: number;
    melody: number;
    harmony: number;
  };
  effects: {
    lowPassCutoff: number; // Hz
    distortion: number; // 0-100
    reverb: number; // 0-100
  };
}

export class AdaptiveMusicMixer {
  private musicIntegration: MusicIntegration;
  private audioContext: AudioContext | null = null;
  private gainNodes: Map<string, GainNode> = new Map();
  private filterNodes: Map<string, BiquadFilterNode> = new Map();
  private currentStyle: MusicStyle | null = null;
  private currentMetrics: GameStateMetrics;

  constructor(musicConfig: { provider: 'fuser' | 'custom'; apiKey?: string }) {
    this.musicIntegration = new MusicIntegration(musicConfig);
    this.currentMetrics = {
      equilibrium: 0.5,
      chaos: 0.0,
      tension: 0.0,
      energyCrisis: false,
      biomassGrowth: false,
      imbalance: false
    };
    this.initializeAudioContext();
  }

  /**
   * Initialize Web Audio API context
   */
  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported', error);
    }
  }

  /**
   * Update music based on game state
   */
  async updateState(metrics: Partial<GameStateMetrics>): Promise<void> {
    this.currentMetrics = { ...this.currentMetrics, ...metrics };
    
    // Determine music style from state
    const style = this.determineMusicStyle(this.currentMetrics);
    
    if (style.name !== this.currentStyle?.name) {
      await this.transitionToStyle(style);
    } else {
      this.updateStyleParameters(style);
    }

    // Update music integration
    this.musicIntegration.updateMusic({
      tension: this.currentMetrics.tension,
      intensity: this.currentMetrics.chaos,
      mood: this.getMoodFromMetrics(this.currentMetrics)
    });
  }

  /**
   * Determine music style from game state
   */
  private determineMusicStyle(metrics: GameStateMetrics): MusicStyle {
    // Equilibrium state - calm, ordered
    if (metrics.equilibrium > 0.7 && metrics.chaos < 0.3) {
      return {
        name: 'equilibrium',
        mood: 'Calm, order',
        stems: {
          ambient: 1.0,
          drums: 0.2,
          bass: 0.3,
          melody: 0.4,
          harmony: 0.6
        },
        effects: {
          lowPassCutoff: 10000,
          distortion: 0,
          reverb: 20
        }
      };
    }

    // Energy Crisis - electronic pulses, tension
    if (metrics.energyCrisis) {
      return {
        name: 'energy_crisis',
        mood: 'Tension',
        stems: {
          ambient: 0.6,
          drums: 0.8,
          bass: 0.7,
          melody: 0.5,
          harmony: 0.3
        },
        effects: {
          lowPassCutoff: 6000,
          distortion: 15,
          reverb: 30
        }
      };
    }

    // Biomass Growth - organic synths, flourishing
    if (metrics.biomassGrowth) {
      return {
        name: 'biomass_growth',
        mood: 'Flourishing life',
        stems: {
          ambient: 0.8,
          drums: 0.4,
          bass: 0.5,
          melody: 0.7,
          harmony: 0.8
        },
        effects: {
          lowPassCutoff: 8000,
          distortion: 5,
          reverb: 40
        }
      };
    }

    // Imbalance/Chaos - dissonant, distorted
    if (metrics.imbalance || metrics.chaos > 0.7) {
      return {
        name: 'chaos',
        mood: 'Collapse',
        stems: {
          ambient: 0.5,
          drums: 1.0,
          bass: 0.9,
          melody: 0.6,
          harmony: 0.2
        },
        effects: {
          lowPassCutoff: 4000,
          distortion: 50,
          reverb: 60
        }
      };
    }

    // Default - balanced
    return {
      name: 'balanced',
      mood: 'Neutral',
      stems: {
        ambient: 0.7,
        drums: 0.5,
        bass: 0.5,
        melody: 0.5,
        harmony: 0.5
      },
      effects: {
        lowPassCutoff: 8000,
        distortion: 10,
        reverb: 25
      }
    };
  }

  /**
   * Transition to new music style
   */
  private async transitionToStyle(style: MusicStyle): Promise<void> {
    console.log(`🎶 Music transitioning to: ${style.name} (${style.mood})`);
    
    this.currentStyle = style;
    
    // Apply effects
    if (this.audioContext) {
      this.applyAudioEffects(style.effects);
    }
  }

  /**
   * Update style parameters smoothly
   */
  private updateStyleParameters(style: MusicStyle): void {
    if (!this.audioContext) return;

    // Smoothly transition effects
    const currentTime = this.audioContext.currentTime;
    
    // Update filter cutoff
    this.filterNodes.forEach(filter => {
      filter.frequency.exponentialRampToValueAtTime(
        style.effects.lowPassCutoff,
        currentTime + 1.0
      );
    });

    // Update gain nodes for stem volumes
    // (In production, you'd map stems to gain nodes)
  }

  /**
   * Apply audio effects (low-pass, distortion, reverb)
   */
  private applyAudioEffects(effects: MusicStyle['effects']): void {
    if (!this.audioContext) return;

    // Create master filter for low-pass
    if (!this.filterNodes.has('master')) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      this.filterNodes.set('master', filter);
    }

    const filter = this.filterNodes.get('master')!;
    filter.frequency.value = effects.lowPassCutoff;
    filter.Q.value = 1.0;

    // Note: Full distortion and reverb would require additional nodes
    // This is a simplified implementation
    console.log(`Audio effects: LowPass=${effects.lowPassCutoff}Hz, Distortion=${effects.distortion}%, Reverb=${effects.reverb}%`);
  }

  /**
   * Get mood from metrics
   */
  private getMoodFromMetrics(metrics: GameStateMetrics): MusicState['mood'] {
    if (metrics.tension > 0.7) return 'battle';
    if (metrics.equilibrium > 0.7) return 'peaceful';
    if (metrics.chaos > 0.7) return 'tense';
    return 'peaceful';
  }

  /**
   * Generate music stems for map theme
   */
  async generateMapMusic(mapTheme: string, seed: number): Promise<void> {
    await this.musicIntegration.generateMapMusic(mapTheme, seed);
  }

  /**
   * Play victory/defeat theme
   */
  async playVictoryTheme(victory: boolean): Promise<void> {
    await this.musicIntegration.playVictoryTheme(victory);
  }

  /**
   * Stop all music
   */
  stopAll(): void {
    this.musicIntegration.stopAll();
  }
}


