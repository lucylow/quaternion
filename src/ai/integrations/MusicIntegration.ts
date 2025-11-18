/**
 * Adaptive Music System Integration
 * Supports Fuser and other music generation APIs
 */

export interface MusicConfig {
  provider: 'fuser' | 'custom';
  apiKey?: string;
  baseUrl?: string;
}

export interface MusicStem {
  id: string;
  name: string;
  audioUrl: string;
  type: 'ambient' | 'drums' | 'bass' | 'melody' | 'harmony';
  volume: number;
}

export interface MusicState {
  tension: number; // 0-1
  intensity: number; // 0-1
  mood: 'peaceful' | 'tense' | 'battle' | 'victory' | 'defeat';
}

export class MusicIntegration {
  private config: MusicConfig;
  private stems: Map<string, MusicStem> = new Map();
  private activeStems: Set<string> = new Set();
  private audioContext: AudioContext | null = null;
  private gainNodes: Map<string, GainNode> = new Map();
  private currentState: MusicState = {
    tension: 0,
    intensity: 0,
    mood: 'peaceful'
  };

  constructor(config: MusicConfig) {
    this.config = config;
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
   * Generate music stems for a map theme
   */
  async generateMapMusic(
    mapTheme: string,
    seed: number
  ): Promise<MusicStem[]> {
    // Pre-generate stems based on map theme
    const stems: MusicStem[] = [];

    // Generate ambient base
    stems.push(await this.generateStem('ambient', mapTheme, seed));
    
    // Generate percussion layer
    stems.push(await this.generateStem('drums', mapTheme, seed));
    
    // Generate melody layer
    stems.push(await this.generateStem('melody', mapTheme, seed));

    // Store stems
    stems.forEach(stem => this.stems.set(stem.id, stem));

    return stems;
  }

  /**
   * Generate a single music stem
   */
  private async generateStem(
    type: MusicStem['type'],
    theme: string,
    seed: number
  ): Promise<MusicStem> {
    if (this.config.provider === 'fuser') {
      return this.generateFuserStem(type, theme, seed);
    }

    // Fallback: return placeholder stem
    return {
      id: `${type}_${seed}`,
      name: `${type} stem`,
      audioUrl: '', // Will be loaded from pre-generated assets
      type,
      volume: 0.5
    };
  }

  /**
   * Generate stem using Fuser API
   */
  private async generateFuserStem(
    type: MusicStem['type'],
    theme: string,
    seed: number
  ): Promise<MusicStem> {
    const apiKey = this.config.apiKey || process.env.FUSER_API_KEY;
    if (!apiKey) {
      console.warn('Fuser API key not configured, using placeholder');
      return this.getPlaceholderStem(type, seed);
    }

    const prompt = this.buildMusicPrompt(type, theme);

    try {
      const response = await fetch(`${this.config.baseUrl || 'https://api.fuser.ai/v1'}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          prompt,
          type,
          duration: 30, // 30 seconds
          seed
        })
      });

      if (!response.ok) {
        throw new Error(`Fuser API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: `${type}_${seed}`,
        name: `${type} stem`,
        audioUrl: data.audioUrl || data.url,
        type,
        volume: this.getDefaultVolume(type)
      };
    } catch (error) {
      console.warn('Fuser stem generation failed, using placeholder', error);
      return this.getPlaceholderStem(type, seed);
    }
  }

  /**
   * Update music based on game state
   */
  updateMusic(state: Partial<MusicState>): void {
    this.currentState = { ...this.currentState, ...state };
    this.applyMusicLayering();
  }

  /**
   * Apply dynamic music layering based on tension/intensity
   */
  private applyMusicLayering(): void {
    const { tension, intensity, mood } = this.currentState;

    // Determine which stems to play
    const stemsToPlay = new Set<string>();

    // Always play ambient
    const ambientStems = Array.from(this.stems.values()).filter(s => s.type === 'ambient');
    if (ambientStems.length > 0) {
      stemsToPlay.add(ambientStems[0].id);
    }

    // Add drums if tension > 0.3
    if (tension > 0.3) {
      const drumStems = Array.from(this.stems.values()).filter(s => s.type === 'drums');
      if (drumStems.length > 0) {
        stemsToPlay.add(drumStems[0].id);
      }
    }

    // Add bass if intensity > 0.5
    if (intensity > 0.5) {
      const bassStems = Array.from(this.stems.values()).filter(s => s.type === 'bass');
      if (bassStems.length > 0) {
        stemsToPlay.add(bassStems[0].id);
      }
    }

    // Add melody if tension > 0.6
    if (tension > 0.6) {
      const melodyStems = Array.from(this.stems.values()).filter(s => s.type === 'melody');
      if (melodyStems.length > 0) {
        stemsToPlay.add(melodyStems[0].id);
      }
    }

    // Update active stems
    this.activeStems.forEach(stemId => {
      if (!stemsToPlay.has(stemId)) {
        this.stopStem(stemId);
      }
    });

    stemsToPlay.forEach(stemId => {
      if (!this.activeStems.has(stemId)) {
        this.playStem(stemId);
      }
    });
  }

  /**
   * Play a music stem
   */
  private async playStem(stemId: string): Promise<void> {
    const stem = this.stems.get(stemId);
    if (!stem || !this.audioContext) return;

    try {
      // Load audio if not already loaded
      const response = await fetch(stem.audioUrl || this.getPlaceholderAudioUrl(stem.type));
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Create source and gain node
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = audioBuffer;
      source.loop = true;
      gainNode.gain.value = stem.volume * this.getVolumeMultiplier(stem.type);

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start(0);
      this.gainNodes.set(stemId, gainNode);
      this.activeStems.add(stemId);
    } catch (error) {
      console.warn(`Failed to play stem ${stemId}`, error);
    }
  }

  /**
   * Stop a music stem
   */
  private stopStem(stemId: string): void {
    const gainNode = this.gainNodes.get(stemId);
    if (gainNode) {
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.5);
      setTimeout(() => {
        this.gainNodes.delete(stemId);
        this.activeStems.delete(stemId);
      }, 500);
    }
  }

  /**
   * Get volume multiplier based on stem type and game state
   */
  private getVolumeMultiplier(type: MusicStem['type']): number {
    const { tension, intensity } = this.currentState;

    switch (type) {
      case 'ambient':
        return 0.4;
      case 'drums':
        return 0.6 * tension;
      case 'bass':
        return 0.5 * intensity;
      case 'melody':
        return 0.4 * tension;
      case 'harmony':
        return 0.3;
      default:
        return 0.5;
    }
  }

  /**
   * Build music generation prompt
   */
  private buildMusicPrompt(type: MusicStem['type'], theme: string): string {
    const basePrompt = `Generate ${type} music for a sci-fi RTS game battlefield: ${theme}`;

    switch (type) {
      case 'ambient':
        return `${basePrompt}. Atmospheric, subtle, loopable. 2 minutes.`;
      case 'drums':
        return `${basePrompt}. Rhythmic, tense, builds intensity. 2 minutes.`;
      case 'bass':
        return `${basePrompt}. Deep, powerful, supports action. 2 minutes.`;
      case 'melody':
        return `${basePrompt}. Memorable, epic, emotional. 2 minutes.`;
      default:
        return `${basePrompt}. 2 minutes, loopable.`;
    }
  }

  /**
   * Get placeholder stem (for fallback)
   */
  private getPlaceholderStem(type: MusicStem['type'], seed: number): MusicStem {
    return {
      id: `${type}_${seed}`,
      name: `${type} stem (placeholder)`,
      audioUrl: this.getPlaceholderAudioUrl(type),
      type,
      volume: this.getDefaultVolume(type)
    };
  }

  /**
   * Get default volume for stem type
   */
  private getDefaultVolume(type: MusicStem['type']): number {
    switch (type) {
      case 'ambient': return 0.4;
      case 'drums': return 0.6;
      case 'bass': return 0.5;
      case 'melody': return 0.4;
      case 'harmony': return 0.3;
      default: return 0.5;
    }
  }

  /**
   * Get placeholder audio URL (for assets folder)
   */
  private getPlaceholderAudioUrl(type: MusicStem['type']): string {
    // In production, these would be pre-generated assets
    return `/assets/music/${type}_placeholder.mp3`;
  }

  /**
   * Play victory/defeat theme
   */
  async playVictoryTheme(victory: boolean): Promise<void> {
    const mood = victory ? 'victory' : 'defeat';
    this.updateMusic({ mood, tension: 1, intensity: 1 });
    
    // Play special victory/defeat stem
    const themeStem = await this.generateStem('melody', `victory_${victory}`, Date.now());
    this.stems.set(themeStem.id, themeStem);
    await this.playStem(themeStem.id);
  }

  /**
   * Stop all music
   */
  stopAll(): void {
    this.activeStems.forEach(stemId => this.stopStem(stemId));
    this.activeStems.clear();
  }
}


