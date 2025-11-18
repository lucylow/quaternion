/**
 * Voice Synthesis Integration
 * Integrates with ElevenLabs and other TTS services for advisor voices
 */

import type { AdvisorID, VoiceLine } from './AICreativeCharacters';

export interface VoiceConfig {
  advisorId: AdvisorID;
  voiceId: string; // ElevenLabs voice ID
  voiceSettings: {
    stability: number; // 0-1
    similarity_boost: number; // 0-1
    style?: number; // 0-1 (if available)
    use_speaker_boost?: boolean;
  };
  emotionMapping: Record<string, number>; // emotion -> style value
}

export interface AudioCache {
  text: string;
  voiceId: string;
  emotion: string;
  audioUrl: string;
  timestamp: number;
}

/**
 * Voice Synthesis Integration
 * Handles TTS generation and caching for AI advisors
 */
export class VoiceSynthesisIntegration {
  private voiceConfigs: Map<AdvisorID, VoiceConfig>;
  private audioCache: Map<string, AudioCache> = new Map();
  private apiKey?: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ElevenLabs_API_key;
    this.voiceConfigs = new Map();
    this.initializeVoiceConfigs();
  }

  /**
   * Initialize voice configurations for all advisors
   */
  private initializeVoiceConfigs(): void {
    // AUREN - Deep baritone, mechanical cadence
    this.voiceConfigs.set('AUREN', {
      advisorId: 'AUREN',
      voiceId: process.env.ELEVENLABS_VOICE_AUREN || 'auren_voice_id',
      voiceSettings: {
        stability: 0.7,
        similarity_boost: 0.8,
        style: 0.3, // Lower style for more mechanical tone
        use_speaker_boost: false
      },
      emotionMapping: {
        'calm': 0.3,
        'pleased': 0.4,
        'concerned': 0.5,
        'furious': 0.7
      }
    });

    // VIREL - Expressive, passionate, emotional modulation
    this.voiceConfigs.set('VIREL', {
      advisorId: 'VIREL',
      voiceId: process.env.ELEVENLABS_VOICE_VIREL || 'virel_voice_id',
      voiceSettings: {
        stability: 0.5, // Lower stability for more variation
        similarity_boost: 0.7,
        style: 0.8, // High style for emotional expression
        use_speaker_boost: true
      },
      emotionMapping: {
        'calm': 0.4,
        'pleased': 0.6,
        'excited': 0.8,
        'concerned': 0.7,
        'distressed': 0.9,
        'furious': 1.0
      }
    });

    // LIRA - Soft contralto, warm organic tone
    this.voiceConfigs.set('LIRA', {
      advisorId: 'LIRA',
      voiceId: process.env.ELEVENLABS_VOICE_LIRA || 'lira_voice_id',
      voiceSettings: {
        stability: 0.6,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
      },
      emotionMapping: {
        'calm': 0.3,
        'pleased': 0.5,
        'concerned': 0.6,
        'distressed': 0.8,
        'despairing': 0.9
      }
    });

    // KOR - Digitally flattened tenor, synthetic overtone
    this.voiceConfigs.set('KOR', {
      advisorId: 'KOR',
      voiceId: process.env.ELEVENLABS_VOICE_KOR || 'kor_voice_id',
      voiceSettings: {
        stability: 0.9, // Very stable for mechanical tone
        similarity_boost: 0.9,
        style: 0.2, // Very low style for flat, synthetic tone
        use_speaker_boost: false
      },
      emotionMapping: {
        'calm': 0.2, // Always low emotion
        'pleased': 0.3,
        'concerned': 0.4
      }
    });

    // CORE - Blended ensemble, shifting background tone
    this.voiceConfigs.set('CORE', {
      advisorId: 'CORE',
      voiceId: process.env.ELEVENLABS_VOICE_CORE || 'core_voice_id',
      voiceSettings: {
        stability: 0.7,
        similarity_boost: 0.8,
        style: 0.6, // Moderate style for philosophical tone
        use_speaker_boost: true
      },
      emotionMapping: {
        'calm': 0.5,
        'pleased': 0.6,
        'concerned': 0.7
      }
    });
  }

  /**
   * Generate audio for a voice line
   */
  async generateAudio(voiceLine: VoiceLine): Promise<string | null> {
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not configured, skipping audio generation');
      return null;
    }

    const config = this.voiceConfigs.get(voiceLine.voiceId as AdvisorID);
    if (!config) {
      console.warn(`No voice config for ${voiceLine.voiceId}`);
      return null;
    }

    // Check cache
    const cacheKey = this.getCacheKey(voiceLine);
    const cached = this.audioCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 86400000) { // 24 hour cache
      return cached.audioUrl;
    }

    try {
      // Adjust voice settings based on emotion
      const emotionStyle = config.emotionMapping[voiceLine.emotion] || 0.5;
      const voiceSettings = {
        ...config.voiceSettings,
        style: emotionStyle
      };

      const response = await fetch(`${this.baseUrl}/text-to-speech/${config.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: voiceLine.text,
          model_id: 'eleven_multilingual_v2', // or 'eleven_turbo_v2' for faster generation
          voice_settings: voiceSettings
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      // Convert response to blob URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cache result
      this.audioCache.set(cacheKey, {
        text: voiceLine.text,
        voiceId: config.voiceId,
        emotion: voiceLine.emotion,
        audioUrl,
        timestamp: Date.now()
      });

      return audioUrl;
    } catch (error) {
      console.error(`Failed to generate audio for ${voiceLine.voiceId}:`, error);
      return null;
    }
  }

  /**
   * Pre-generate and cache audio for common lines
   */
  async pregenerateAudio(voiceLines: VoiceLine[]): Promise<void> {
    for (const line of voiceLines) {
      try {
        await this.generateAudio(line);
      } catch (error) {
        console.warn(`Failed to pre-generate audio for ${line.voiceId}:`, error);
      }
    }
  }

  /**
   * Get voice configuration for an advisor
   */
  getVoiceConfig(advisorId: AdvisorID): VoiceConfig | undefined {
    return this.voiceConfigs.get(advisorId);
  }

  /**
   * Update voice settings dynamically (e.g., for emotion changes)
   */
  updateVoiceSettings(advisorId: AdvisorID, settings: Partial<VoiceConfig['voiceSettings']>): void {
    const config = this.voiceConfigs.get(advisorId);
    if (config) {
      config.voiceSettings = { ...config.voiceSettings, ...settings };
    }
  }

  /**
   * Get cache key for a voice line
   */
  private getCacheKey(voiceLine: VoiceLine): string {
    return `${voiceLine.voiceId}_${voiceLine.emotion}_${voiceLine.text.substring(0, 50)}`;
  }

  /**
   * Clear audio cache
   */
  clearCache(): void {
    // Revoke all blob URLs
    this.audioCache.forEach(cache => {
      URL.revokeObjectURL(cache.audioUrl);
    });
    this.audioCache.clear();
  }

  /**
   * Get cached audio URL
   */
  getCachedAudio(text: string, advisorId: AdvisorID, emotion: string): string | null {
    const cacheKey = this.getCacheKey({
      text,
      voiceId: advisorId,
      emotion: emotion as any,
      timestamp: 0
    });
    return this.audioCache.get(cacheKey)?.audioUrl || null;
  }
}

/**
 * Trailer Voice Line Generator
 * Generates trailer intro lines with voice synthesis
 */
export class TrailerVoiceGenerator {
  constructor(private voiceIntegration: VoiceSynthesisIntegration) {}

  /**
   * Generate all trailer intro voices
   */
  async generateTrailerVoices(lines: {
    auren: string;
    virel: string;
    lira: string;
    kor: string;
    core: string;
  }): Promise<{
    auren?: string;
    virel?: string;
    lira?: string;
    kor?: string;
    core?: string;
  }> {
    const voices: Record<string, string | undefined> = {};

    // Generate audio for each advisor
    for (const [advisor, text] of Object.entries(lines)) {
      try {
        const voiceLine: VoiceLine = {
          text,
          voiceId: advisor.toUpperCase() as AdvisorID,
          emotion: 'calm',
          timestamp: Date.now()
        };
        const audioUrl = await this.voiceIntegration.generateAudio(voiceLine);
        if (audioUrl) {
          voices[advisor] = audioUrl;
        }
      } catch (error) {
        console.warn(`Failed to generate trailer voice for ${advisor}:`, error);
      }
    }

    return voices;
  }
}

