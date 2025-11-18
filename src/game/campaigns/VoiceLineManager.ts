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
    // Commander Lian - Authoritative, pragmatic, sometimes cold
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

    this.voiceLines.set('lian_archive_breach', {
      id: 'lian_archive_breach',
      character: 'Lian',
      text: 'The archive is breached. Secure the perimeter. We\'re not alone down here.',
      ssml: `<speak><voice name="Lian"><prosody rate="0.97">The archive is breached. Secure the perimeter. We're not alone down here.</prosody><break time="200ms"/></voice></speak>`
    });

    this.voiceLines.set('lian_harvest_order', {
      id: 'lian_harvest_order',
      character: 'Lian',
      text: 'Resources now. Consequences later. That\'s the calculus of survival.',
      ssml: `<speak><voice name="Lian"><prosody rate="0.94"><emphasis level="moderate">Resources now. Consequences later.</emphasis> That's the calculus of survival.</prosody><break time="250ms"/></voice></speak>`
    });

    this.voiceLines.set('lian_preserve_acknowledge', {
      id: 'lian_preserve_acknowledge',
      character: 'Lian',
      text: 'A calculated risk. I hope your faith in the future is justified.',
      ssml: `<speak><voice name="Lian"><prosody rate="0.96">A calculated risk. I hope your faith in the future is justified.</prosody><break time="200ms"/></voice></speak>`
    });

    this.voiceLines.set('lian_consequence', {
      id: 'lian_consequence',
      character: 'Lian',
      text: 'Every choice has a price. We pay it, or we die. There\'s no third option.',
      ssml: `<speak><voice name="Lian"><prosody rate="0.93">Every choice has a price. We pay it, or we die. There's no third option.</prosody><break time="300ms"/></voice></speak>`
    });

    // Dr. Mara Kest - Ethical, pleading, empathetic, passionate about preservation
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

    this.voiceLines.set('mara_bio_seed_discovery', {
      id: 'mara_bio_seed_discovery',
      character: 'Mara',
      text: 'My God... it\'s still alive. After all these years, it\'s still breathing. We can\'t just— we can\'t destroy this.',
      ssml: `<speak><voice name="Mara"><prosody rate="0.90">My God... it's still alive. After all these years, it's still breathing. <break time="300ms"/>We can't just— we can't destroy this.</prosody><break time="300ms"/></voice></speak>`
    });

    this.voiceLines.set('mara_harvest_horror', {
      id: 'mara_harvest_horror',
      character: 'Mara',
      text: 'No... you don\'t understand what you\'re doing. This isn\'t just a resource— it\'s a living memory of what we lost.',
      ssml: `<speak><voice name="Mara"><prosody rate="0.88"><emphasis level="strong">No...</emphasis> you don't understand what you're doing. This isn't just a resource— it's a living memory of what we lost.</prosody><break time="400ms"/></voice></speak>`
    });

    this.voiceLines.set('mara_preserve_gratitude', {
      id: 'mara_preserve_gratitude',
      character: 'Mara',
      text: 'Thank you. You\'ve given it a chance to heal. Maybe... maybe we can learn from it instead of consuming it.',
      ssml: `<speak><voice name="Mara"><prosody rate="0.94">Thank you. You've given it a chance to heal. Maybe... maybe we can learn from it instead of consuming it.</prosody><break time="250ms"/></voice></speak>`
    });

    this.voiceLines.set('mara_aftermath', {
      id: 'mara_aftermath',
      character: 'Mara',
      text: 'The silence is different now. I can feel it— the land remembers what we chose.',
      ssml: `<speak><voice name="Mara"><prosody rate="0.91">The silence is different now. I can feel it— the land remembers what we chose.</prosody><break time="300ms"/></voice></speak>`
    });

    // Patch (Drone) - Wry, humorous, observant, sometimes philosophical
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

    this.voiceLines.set('patch_archive_comment', {
      id: 'patch_archive_comment',
      character: 'Patch',
      text: 'Archive integrity: compromised. Atmospheric readings: ominous. My recommendation: leave. But I\'m just a drone.',
      ssml: `<speak><voice name="Patch"><prosody rate="1.06">Archive integrity: compromised. Atmospheric readings: ominous. My recommendation: leave. But I'm just a drone.</prosody><break time="150ms"/></voice></speak>`
    });

    this.voiceLines.set('patch_choice_observation', {
      id: 'patch_choice_observation',
      character: 'Patch',
      text: 'Interesting. You\'re about to make a choice that will echo for generations. No pressure.',
      ssml: `<speak><voice name="Patch"><prosody rate="1.04">Interesting. You're about to make a choice that will echo for generations. No pressure.</prosody><break time="180ms"/></voice></speak>`
    });

    this.voiceLines.set('patch_harvest_quip', {
      id: 'patch_harvest_quip',
      character: 'Patch',
      text: 'Resource extraction: successful. Ecological impact: calculating... oh. That\'s not good.',
      ssml: `<speak><voice name="Patch"><prosody rate="1.07">Resource extraction: successful. Ecological impact: calculating... <break time="200ms"/>oh. That's not good.</prosody><break time="150ms"/></voice></speak>`
    });

    this.voiceLines.set('patch_preserve_approval', {
      id: 'patch_preserve_approval',
      character: 'Patch',
      text: 'Preservation protocols: active. Long-term viability: improved. For a meatbag decision, that was surprisingly wise.',
      ssml: `<speak><voice name="Patch"><prosody rate="1.05">Preservation protocols: active. Long-term viability: improved. For a meatbag decision, that was surprisingly wise.</prosody><break time="150ms"/></voice></speak>`
    });

    this.voiceLines.set('patch_philosophical', {
      id: 'patch_philosophical',
      character: 'Patch',
      text: 'You know, for beings with such short lifespans, you sure do make choices that last forever. Fascinating.',
      ssml: `<speak><voice name="Patch"><prosody rate="1.03">You know, for beings with such short lifespans, you sure do make choices that last forever. Fascinating.</prosody><break time="200ms"/></voice></speak>`
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


