/**
 * Voice Line Manager
 * Manages SSML voice lines and TTS integration for campaigns
 */

import { ElevenLabsIntegration } from '../../ai/integrations/ElevenLabsIntegration';

export interface VoiceLine {
  id: string;
  character: string;
  text: string;
  ssml: string;
  audioUrl?: string;
}

export class VoiceLineManager {
  private tts: ElevenLabsIntegration;
  private voiceLines: Map<string, VoiceLine> = new Map();
  private audioCache: Map<string, string> = new Map();

  constructor(ttsConfig?: any) {
    this.tts = new ElevenLabsIntegration(ttsConfig);
    this.initializeVoiceLines();
  }

  /**
   * Initialize default voice lines for campaign characters
   */
  private initializeVoiceLines() {
    // Commander Lian
    this.voiceLines.set('lian_hold', {
      id: 'lian_hold',
      character: 'Lian',
      text: 'Hold the chokepoint — buy us time.',
      ssml: `<speak><voice name="Lian"><prosody rate="0.98">Hold the chokepoint — buy us time.</prosody><break time="180ms"/></voice></speak>`
    });

    this.voiceLines.set('lian_move', {
      id: 'lian_move',
      character: 'Lian',
      text: 'We move when I say we move.',
      ssml: `<speak><voice name="Lian"><prosody rate="0.95"><emphasis level="moderate">We move when I say we move.</emphasis></prosody><break time="150ms"/></voice></speak>`
    });

    // Dr. Mara Kest
    this.voiceLines.set('mara_warning', {
      id: 'mara_warning',
      character: 'Mara',
      text: 'Please — listen. It remembers more than we do.',
      ssml: `<speak><voice name="Mara"><prosody rate="0.92">Please — listen. It remembers more than we do.</prosody><break time="250ms"/></voice></speak>`
    });

    this.voiceLines.set('mara_plea', {
      id: 'mara_plea',
      character: 'Mara',
      text: 'There must be another way.',
      ssml: `<speak><voice name="Mara"><prosody rate="0.96"><emphasis level="moderate">There must be another way.</emphasis></prosody><break time="200ms"/></voice></speak>`
    });

    // Patch (Drone)
    this.voiceLines.set('patch_morale', {
      id: 'patch_morale',
      character: 'Patch',
      text: 'Alarms: loud. Morale: quieter than you, commander.',
      ssml: `<speak><voice name="Patch"><prosody rate="1.05">Alarms: loud. Morale: quieter than you, commander.</prosody><break time="120ms"/></voice></speak>`
    });

    this.voiceLines.set('patch_scan', {
      id: 'patch_scan',
      character: 'Patch',
      text: 'Scanning... nothing helpful. Sending passive judgement.',
      ssml: `<speak><voice name="Patch"><prosody rate="1.08">Scanning... nothing helpful. Sending passive judgement.</prosody><break time="100ms"/></voice></speak>`
    });
  }

  /**
   * Get voice line by ID
   */
  getVoiceLine(id: string): VoiceLine | undefined {
    return this.voiceLines.get(id);
  }

  /**
   * Play voice line (generates audio if needed)
   */
  async playVoiceLine(id: string): Promise<void> {
    const voiceLine = this.voiceLines.get(id);
    if (!voiceLine) {
      console.warn(`Voice line not found: ${id}`);
      return;
    }

    // Check cache
    if (this.audioCache.has(id)) {
      const audioUrl = this.audioCache.get(id)!;
      await this.playAudio(audioUrl);
      return;
    }

    // Generate audio
    try {
      // Extract plain text from SSML for TTS
      const text = voiceLine.text;
      const voiceId = this.getVoiceIdForCharacter(voiceLine.character);
      
      const audioUrl = await this.tts.generateSpeechBlob(text, voiceId);
      this.audioCache.set(id, audioUrl);
      voiceLine.audioUrl = audioUrl;

      await this.playAudio(audioUrl);
    } catch (error) {
      console.error(`Failed to generate audio for voice line ${id}:`, error);
    }
  }

  /**
   * Play audio from URL
   */
  private async playAudio(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.onended = () => resolve();
      audio.onerror = reject;
      audio.play();
    });
  }

  /**
   * Get voice ID for character
   */
  private getVoiceIdForCharacter(character: string): string | undefined {
    const voiceMap: Record<string, string> = {
      'Lian': 'VR6AewLTigWG4xSOukaG', // Arnold - authoritative
      'Mara': 'EXAVITQu4vr4xnSDxMaL', // Bella - empathetic
      'Patch': 'ThT5KcBeYPX3keUQqHPh'  // Dorothy - neutral/robotic
    };
    return voiceMap[character];
  }

  /**
   * Register custom voice line
   */
  registerVoiceLine(voiceLine: VoiceLine): void {
    this.voiceLines.set(voiceLine.id, voiceLine);
  }

  /**
   * Pre-generate all voice lines
   */
  async pregenerateAll(): Promise<void> {
    const lines = Array.from(this.voiceLines.values());
    for (const line of lines) {
      try {
        await this.playVoiceLine(line.id);
      } catch (error) {
        console.warn(`Failed to pre-generate voice line ${line.id}:`, error);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.audioCache.clear();
  }
}

