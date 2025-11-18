/**
 * AI Voice Controller with Sentiment Modulation
 * Dynamic voiceover with emotion-based pitch and volume adjustment
 * Integrates with ElevenLabs for TTS
 */

import { ElevenLabsIntegration } from '../integrations/ElevenLabsIntegration';

export enum VoiceTone {
  Calm = 'calm',
  Panicked = 'panicked',
  Arrogant = 'arrogant',
  Neutral = 'neutral',
  Excited = 'excited',
  Worried = 'worried',
  Triumphant = 'triumphant'
}

export interface VoiceSettings {
  pitch: number; // 0.5 - 2.0
  volume: number; // 0.0 - 1.0
  speed: number; // 0.5 - 2.0
  stability: number; // 0.0 - 1.0
  similarityBoost: number; // 0.0 - 1.0
}

export interface VoiceProfile {
  voiceId: string;
  name: string;
  baseSettings: VoiceSettings;
}

export class AIVoiceController {
  private elevenLabs: ElevenLabsIntegration | null = null;
  private currentTone: VoiceTone = VoiceTone.Neutral;
  private voiceProfiles: Map<string, VoiceProfile> = new Map();
  private audioContext: AudioContext | null = null;
  private activeAudio: HTMLAudioElement | null = null;

  constructor(elevenLabsConfig?: { apiKey?: string }) {
    if (elevenLabsConfig) {
      this.elevenLabs = new ElevenLabsIntegration(elevenLabsConfig);
    }

    this.initializeAudioContext();
    this.initializeVoiceProfiles();
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
   * Initialize default voice profiles
   */
  private initializeVoiceProfiles(): void {
    this.voiceProfiles.set('narrator', {
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
      name: 'Narrator',
      baseSettings: {
        pitch: 1.0,
        volume: 0.75,
        speed: 1.0,
        stability: 0.6,
        similarityBoost: 0.8
      }
    });

    this.voiceProfiles.set('economist', {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella
      name: 'The Economist',
      baseSettings: {
        pitch: 0.95,
        volume: 0.7,
        speed: 0.9,
        stability: 0.7,
        similarityBoost: 0.75
      }
    });

    this.voiceProfiles.set('biologist', {
      voiceId: 'ThT5KcBeYPX3keUQqHPh', // Dorothy
      name: 'The Biologist',
      baseSettings: {
        pitch: 1.05,
        volume: 0.7,
        speed: 1.0,
        stability: 0.8,
        similarityBoost: 0.8
      }
    });
  }

  /**
   * Set voice tone (affects pitch, volume, speed)
   */
  setTone(tone: VoiceTone): void {
    this.currentTone = tone;
    console.log(`🎙️ Voice tone set to: ${tone}`);
  }

  /**
   * Get voice settings for current tone
   */
  private getToneSettings(baseSettings: VoiceSettings): VoiceSettings {
    const toneModifiers: Record<VoiceTone, Partial<VoiceSettings>> = {
      [VoiceTone.Calm]: { pitch: 0.95, volume: 0.6, speed: 0.9 },
      [VoiceTone.Panicked]: { pitch: 1.2, volume: 0.9, speed: 1.2 },
      [VoiceTone.Arrogant]: { pitch: 1.05, volume: 0.8, speed: 0.95 },
      [VoiceTone.Neutral]: { pitch: 1.0, volume: 0.75, speed: 1.0 },
      [VoiceTone.Excited]: { pitch: 1.1, volume: 0.85, speed: 1.1 },
      [VoiceTone.Worried]: { pitch: 0.98, volume: 0.7, speed: 0.95 },
      [VoiceTone.Triumphant]: { pitch: 1.08, volume: 0.9, speed: 1.05 }
    };

    const modifier = toneModifiers[this.currentTone] || {};
    
    return {
      pitch: modifier.pitch ?? baseSettings.pitch,
      volume: modifier.volume ?? baseSettings.volume,
      speed: modifier.speed ?? baseSettings.speed,
      stability: baseSettings.stability,
      similarityBoost: baseSettings.similarityBoost
    };
  }

  /**
   * Speak text with current tone
   */
  async speak(
    text: string,
    voiceProfile: string = 'narrator',
    tone?: VoiceTone
  ): Promise<void> {
    if (tone) {
      this.setTone(tone);
    }

    const profile = this.voiceProfiles.get(voiceProfile);
    if (!profile) {
      console.warn(`Voice profile not found: ${voiceProfile}`);
      return;
    }

    const settings = this.getToneSettings(profile.baseSettings);

    if (this.elevenLabs) {
      try {
        // Generate speech with tone-adjusted settings
        const audioUrl = await this.elevenLabs.generateSpeechBlob(
          text,
          profile.voiceId,
          {
            stability: settings.stability,
            similarityBoost: settings.similarityBoost,
            style: (settings.pitch - 1.0) * 0.5 // Map pitch to style
          }
        );

        // Play audio with pitch/volume/speed adjustment
        await this.playAudioWithModulation(audioUrl, settings);
      } catch (error) {
        console.warn('ElevenLabs speech generation failed', error);
        // Fallback: use browser TTS
        this.fallbackTTS(text, settings);
      }
    } else {
      // Fallback: use browser TTS
      this.fallbackTTS(text, settings);
    }
  }

  /**
   * Play audio with pitch/volume/speed modulation
   */
  private async playAudioWithModulation(
    audioUrl: string,
    settings: VoiceSettings
  ): Promise<void> {
    if (!this.audioContext) {
      console.warn('AudioContext not available');
      return;
    }

    try {
      // Load audio
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Create source
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      const pitchShift = this.audioContext.createBiquadFilter();

      source.buffer = audioBuffer;
      source.playbackRate.value = settings.speed;
      gainNode.gain.value = settings.volume;

      // Pitch shift using filter (simplified)
      if (settings.pitch !== 1.0) {
        pitchShift.type = 'lowpass';
        pitchShift.frequency.value = 20000 * settings.pitch;
      }

      // Connect nodes
      source.connect(pitchShift);
      pitchShift.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Play
      source.start(0);

      // Store reference
      this.activeAudio = new Audio(audioUrl);
      this.activeAudio.playbackRate = settings.speed;
      this.activeAudio.volume = settings.volume;
      await this.activeAudio.play();
    } catch (error) {
      console.warn('Audio modulation failed', error);
    }
  }

  /**
   * Fallback to browser TTS
   */
  private fallbackTTS(text: string, settings: VoiceSettings): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.speed;
      utterance.volume = settings.volume;
      utterance.pitch = settings.pitch;
      window.speechSynthesis.speak(utterance);
    } else {
      console.log(`[${this.currentTone}] ${text}`);
    }
  }

  /**
   * Register custom voice profile
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
   * Stop current speech
   */
  stop(): void {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}


