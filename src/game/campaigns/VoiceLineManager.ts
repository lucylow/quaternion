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

    // Commander-specific voice lines
    this.initializeCommanderVoiceLines();
  }

  /**
   * Initialize commander-specific voice lines
   */
  private initializeCommanderVoiceLines() {
    // The Architect - Methodical, patient, detail-oriented
    this.voiceLines.set('architect_early_game', {
      id: 'architect_early_game',
      character: 'Architect',
      text: 'A fortress built in haste is a fortress built to fall. We build for eternity.',
      ssml: `<speak><voice name="Architect"><prosody rate="0.92">A fortress built in haste is a fortress built to fall. We build for eternity.</prosody><break time="200ms"/></voice></speak>`
    });

    this.voiceLines.set('architect_battle', {
      id: 'architect_battle',
      character: 'Architect',
      text: 'Let them break upon our walls. Mathematics favors the prepared.',
      ssml: `<speak><voice name="Architect"><prosody rate="0.94">Let them break upon our walls. Mathematics favors the prepared.</prosody><break time="200ms"/></voice></speak>`
    });

    this.voiceLines.set('architect_resource', {
      id: 'architect_resource',
      character: 'Architect',
      text: 'Every resource is a calculation. Every calculation is a step toward victory.',
      ssml: `<speak><voice name="Architect"><prosody rate="0.93">Every resource is a calculation. Every calculation is a step toward victory.</prosody><break time="200ms"/></voice></speak>`
    });

    // The Aggressor - Aggressive, impatient, risk-taking
    this.voiceLines.set('aggressor_early_game', {
      id: 'aggressor_early_game',
      character: 'Aggressor',
      text: 'Every moment we wait is a moment they prepare. Attack now!',
      ssml: `<speak><voice name="Aggressor"><prosody rate="1.05"><emphasis level="strong">Every moment we wait is a moment they prepare. Attack now!</emphasis></prosody><break time="150ms"/></voice></speak>`
    });

    this.voiceLines.set('aggressor_battle', {
      id: 'aggressor_battle',
      character: 'Aggressor',
      text: 'Push forward! Break their lines! Victory or death!',
      ssml: `<speak><voice name="Aggressor"><prosody rate="1.08"><emphasis level="strong">Push forward! Break their lines! Victory or death!</emphasis></prosody><break time="200ms"/></voice></speak>`
    });

    this.voiceLines.set('aggressor_victory', {
      id: 'aggressor_victory',
      character: 'Aggressor',
      text: 'They hesitated. We did not. That is why we stand victorious.',
      ssml: `<speak><voice name="Aggressor"><prosody rate="1.04">They hesitated. We did not. That is why we stand victorious.</prosody><break time="200ms"/></voice></speak>`
    });

    // The Nomad - Exploratory, innovative, mobile
    this.voiceLines.set('nomad_early_game', {
      id: 'nomad_early_game',
      character: 'Nomad',
      text: 'The world is vast. Those who stay in one place are already defeated.',
      ssml: `<speak><voice name="Nomad"><prosody rate="0.98">The world is vast. Those who stay in one place are already defeated.</prosody><break time="200ms"/></voice></speak>`
    });

    this.voiceLines.set('nomad_battle', {
      id: 'nomad_battle',
      character: 'Nomad',
      text: 'They expect a battle. We give them a hunt.',
      ssml: `<speak><voice name="Nomad"><prosody rate="1.00">They expect a battle. We give them a hunt.</prosody><break time="200ms"/></voice></speak>`
    });

    this.voiceLines.set('nomad_discovery', {
      id: 'nomad_discovery',
      character: 'Nomad',
      text: 'Every corner of the map holds a secret. Every secret is an advantage.',
      ssml: `<speak><voice name="Nomad"><prosody rate="0.99">Every corner of the map holds a secret. Every secret is an advantage.</prosody><break time="200ms"/></voice></speak>`
    });

    // The Tactician - Calculated, precise, micro-focused
    this.voiceLines.set('tactician_early_game', {
      id: 'tactician_early_game',
      character: 'Tactician',
      text: 'Victory is not about strength—it\'s about knowing exactly when and where to apply it.',
      ssml: `<speak><voice name="Tactician"><prosody rate="0.96">Victory is not about strength—it's about knowing exactly when and where to apply it.</prosody><break time="250ms"/></voice></speak>`
    });

    this.voiceLines.set('tactician_battle', {
      id: 'tactician_battle',
      character: 'Tactician',
      text: 'Watch. Learn. Execute. This is how wars are won.',
      ssml: `<speak><voice name="Tactician"><prosody rate="0.95">Watch. Learn. Execute. This is how wars are won.</prosody><break time="200ms"/></voice></speak>`
    });

    this.voiceLines.set('tactician_analysis', {
      id: 'tactician_analysis',
      character: 'Tactician',
      text: 'Information is the greatest weapon. Know your enemy, know yourself, know victory.',
      ssml: `<speak><voice name="Tactician"><prosody rate="0.94">Information is the greatest weapon. Know your enemy, know yourself, know victory.</prosody><break time="250ms"/></voice></speak>`
    });

    // The Harvester - Patient, economic, defensive
    this.voiceLines.set('harvester_early_game', {
      id: 'harvester_early_game',
      character: 'Harvester',
      text: 'Let them fight. We build. When they are exhausted, we will be unstoppable.',
      ssml: `<speak><voice name="Harvester"><prosody rate="0.91">Let them fight. We build. When they are exhausted, we will be unstoppable.</prosody><break time="250ms"/></voice></speak>`
    });

    this.voiceLines.set('harvester_battle', {
      id: 'harvester_battle',
      character: 'Harvester',
      text: 'Every unit lost is a resource wasted. We fight smart, not hard.',
      ssml: `<speak><voice name="Harvester"><prosody rate="0.93">Every unit lost is a resource wasted. We fight smart, not hard.</prosody><break time="200ms"/></voice></speak>`
    });

    this.voiceLines.set('harvester_economy', {
      id: 'harvester_economy',
      character: 'Harvester',
      text: 'Resources flow like rivers. Patience yields wealth, and wealth yields victory.',
      ssml: `<speak><voice name="Harvester"><prosody rate="0.92">Resources flow like rivers. Patience yields wealth, and wealth yields victory.</prosody><break time="250ms"/></voice></speak>`
    });

    // The Wildcard - Chaotic, innovative, unpredictable
    this.voiceLines.set('wildcard_early_game', {
      id: 'wildcard_early_game',
      character: 'Wildcard',
      text: 'Predictability is death. Let\'s see what happens when we break all the rules.',
      ssml: `<speak><voice name="Wildcard"><prosody rate="1.02">Predictability is death. Let's see what happens when we break all the rules.</prosody><break time="200ms"/></voice></speak>`
    });

    this.voiceLines.set('wildcard_battle', {
      id: 'wildcard_battle',
      character: 'Wildcard',
      text: 'They think they know our strategy. They\'re about to learn they know nothing.',
      ssml: `<speak><voice name="Wildcard"><prosody rate="1.03">They think they know our strategy. They're about to learn they know nothing.</prosody><break time="200ms"/></voice></speak>`
    });

    this.voiceLines.set('wildcard_innovation', {
      id: 'wildcard_innovation',
      character: 'Wildcard',
      text: 'Conventional wisdom is for conventional losers. Let\'s try something impossible.',
      ssml: `<speak><voice name="Wildcard"><prosody rate="1.04">Conventional wisdom is for conventional losers. Let's try something impossible.</prosody><break time="200ms"/></voice></speak>`
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
      'Patch': 'ThT5KcBeYPX3keUQqHPh',  // Dorothy - neutral/robotic
      'Architect': 'VR6AewLTigWG4xSOukaG', // Arnold - methodical, authoritative
      'Aggressor': 'VR6AewLTigWG4xSOukaG', // Arnold - aggressive, commanding
      'Nomad': 'EXAVITQu4vr4xnSDxMaL', // Bella - exploratory, curious
      'Tactician': 'VR6AewLTigWG4xSOukaG', // Arnold - calculated, precise
      'Harvester': 'EXAVITQu4vr4xnSDxMaL', // Bella - patient, calm
      'Wildcard': 'ThT5KcBeYPX3keUQqHPh'  // Dorothy - unpredictable, chaotic
    };
    return voiceMap[character];
  }

  /**
   * Get commander voice line by commander ID and situation
   */
  getCommanderVoiceLine(commanderId: string, situation: string): VoiceLine | undefined {
    const id = `${commanderId}_${situation}`;
    return this.voiceLines.get(id);
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


