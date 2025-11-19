/**
 * ElevenLabs Text-to-Speech Integration
 * For dynamic voice narration and commander dialogue
 */

import { fetchElevenLabs } from '@/utils/networkUtils';

export interface ElevenLabsConfig {
  apiKey?: string;
  voiceId?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface VoiceProfile {
  voiceId: string;
  name: string;
  description: string;
  settings: {
    stability: number;
    similarityBoost: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
}

export class ElevenLabsIntegration {
  private config: ElevenLabsConfig;
  private cache: Map<string, ArrayBuffer> = new Map();
  private voiceProfiles: Map<string, VoiceProfile> = new Map();

  constructor(config: ElevenLabsConfig = {}) {
    this.config = {
      model: 'eleven_multilingual_v2',
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.0,
      useSpeakerBoost: true,
      ...config
    };

    // Initialize default voice profiles
    this.initializeDefaultVoices();
  }

  /**
   * Generate speech from text
   */
  async generateSpeech(
    text: string,
    voiceId?: string,
    options?: Partial<ElevenLabsConfig>
  ): Promise<ArrayBuffer> {
    // Check cache
    const cacheKey = `${text}_${voiceId || this.config.voiceId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const apiKey = options?.apiKey || this.config.apiKey || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voice = voiceId || this.config.voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel
    const model = options?.model || this.config.model || 'eleven_multilingual_v2';

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;

    const response = await fetchElevenLabs(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: options?.stability ?? this.config.stability ?? 0.5,
          similarity_boost: options?.similarityBoost ?? this.config.similarityBoost ?? 0.75,
          style: options?.style ?? this.config.style ?? 0.0,
          use_speaker_boost: options?.useSpeakerBoost ?? this.config.useSpeakerBoost ?? true
        }
      })
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
    }

    const audioBuffer = await response.arrayBuffer();
    this.cache.set(cacheKey, audioBuffer);
    return audioBuffer;
  }

  /**
   * Generate speech and return as blob URL for audio playback
   */
  async generateSpeechBlob(
    text: string,
    voiceId?: string,
    options?: Partial<ElevenLabsConfig>
  ): Promise<string> {
    const audioBuffer = await this.generateSpeech(text, voiceId, options);
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  }

  /**
   * Generate battle narration
   */
  async generateBattleNarration(
    text: string,
    narratorVoice: string = 'narrator'
  ): Promise<string> {
    const profile = this.voiceProfiles.get(narratorVoice);
    const voiceId = profile?.voiceId || this.config.voiceId;

    return this.generateSpeechBlob(text, voiceId, {
      stability: 0.6,
      similarityBoost: 0.8,
      style: 0.2
    });
  }

  /**
   * Generate commander dialogue
   */
  async generateCommanderDialogue(
    text: string,
    commanderName: string
  ): Promise<string> {
    const profile = this.voiceProfiles.get(commanderName.toLowerCase());
    if (!profile) {
      console.warn(`No voice profile for commander: ${commanderName}, using default`);
      return this.generateSpeechBlob(text);
    }

    return this.generateSpeechBlob(text, profile.voiceId, {
      stability: profile.settings.stability,
      similarityBoost: profile.settings.similarityBoost,
      ...(profile.settings.style !== undefined && { style: profile.settings.style }),
      ...(profile.settings.useSpeakerBoost !== undefined && { useSpeakerBoost: profile.settings.useSpeakerBoost })
    });
  }

  /**
   * Register a custom voice profile
   */
  registerVoiceProfile(profile: VoiceProfile): void {
    this.voiceProfiles.set(profile.name.toLowerCase(), profile);
  }

  /**
   * Get available voice profiles
   */
  getVoiceProfiles(): VoiceProfile[] {
    return Array.from(this.voiceProfiles.values());
  }

  /**
   * Initialize default voice profiles for commanders
   */
  private initializeDefaultVoices(): void {
    // Narrator voice
    this.voiceProfiles.set('narrator', {
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - clear, professional
      name: 'narrator',
      description: 'Epic battle narrator',
      settings: {
        stability: 0.6,
        similarityBoost: 0.8,
        style: 0.2
      }
    });

    // CORE - Logic Advisor: Analytical, precise, focused on optimization
    this.voiceProfiles.set('core', {
      voiceId: 'JBFqnCBsd6RMkjVDRZzb', // George - clear, professional, methodical
      name: 'core',
      description: 'Analytical logic advisor - precise and methodical',
      settings: {
        stability: 0.75, // High stability for precise, consistent delivery
        similarityBoost: 0.8,
        style: 0.1 // Low style for clear, unadorned speech
      }
    });

    // AUREN - Empathy Advisor: Compassionate, ethical, values preservation
    this.voiceProfiles.set('auren', {
      voiceId: 'XB0fDUnXU5powFXDhCwa', // Charlotte - warm, caring, empathetic
      name: 'auren',
      description: 'Compassionate empathy advisor - warm and caring',
      settings: {
        stability: 0.7,
        similarityBoost: 0.85, // High similarity for consistent warmth
        style: 0.2 // Slight style for emotional expressiveness
      }
    });

    // LIRA - Agility Advisor: Aggressive, tactical, combat-focused
    this.voiceProfiles.set('lira', {
      voiceId: 'VR6AewLTigWG4xSOukaG', // Arnold - aggressive, energetic, decisive
      name: 'lira',
      description: 'Aggressive agility advisor - energetic and tactical',
      settings: {
        stability: 0.5, // Lower stability for dynamic, energetic delivery
        similarityBoost: 0.7,
        style: 0.4 // Higher style for aggressive, expressive speech
      }
    });

    // VIREL - Knowledge Advisor: Curious, intellectual, research-oriented
    this.voiceProfiles.set('virel', {
      voiceId: 'ThT5KcBeYPX3keUQqHPh', // Dorothy - calm, measured, thoughtful
      name: 'virel',
      description: 'Intellectual knowledge advisor - thoughtful and scholarly',
      settings: {
        stability: 0.8, // High stability for measured, scholarly delivery
        similarityBoost: 0.8,
        style: 0.15 // Low-moderate style for clear, intellectual speech
      }
    });

    // KOR - Chaos Advisor: Unpredictable, chaotic, challenges conventions
    this.voiceProfiles.set('kor', {
      voiceId: 'MF3mGyEYCl7XYWbV9V6O', // Elli - expressive, varied, dynamic
      name: 'kor',
      description: 'Chaotic advisor - unpredictable and expressive',
      settings: {
        stability: 0.45, // Lower stability for unpredictable, varied delivery
        similarityBoost: 0.65, // Lower similarity for more variation
        style: 0.5 // High style for expressive, dynamic speech
      }
    });
  }

  /**
   * Pre-generate and cache dialogue lines
   */
  async pregenerateDialogue(
    lines: Array<{ text: string; voice: string }>
  ): Promise<void> {
    for (const line of lines) {
      try {
        await this.generateSpeech(line.text, this.voiceProfiles.get(line.voice)?.voiceId);
      } catch (error) {
        console.warn(`Failed to pre-generate dialogue: ${line.text}`, error);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (for monitoring)
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

