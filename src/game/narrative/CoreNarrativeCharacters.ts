/**
 * Core Narrative Characters System
 * The three key characters that drive emotional connection: Lian Yao, Dr. Mara Kest, and Patch
 * Based on the narrative design playbook for Quaternion
 */

export interface NarrativeCharacter {
  id: string;
  name: string;
  role: string;
  motivation: string;
  flaw: string;
  voiceId?: string; // ElevenLabs voice ID
  emotionalState: 'calm' | 'concerned' | 'urgent' | 'pleased' | 'disappointed' | 'sarcastic';
  relationshipWithPlayer: number; // -1 to 1
  memoryBank: CharacterMemory[];
}

export interface CharacterMemory {
  id: string;
  timestamp: number;
  context: string;
  playerAction?: string;
  emotionalImpact: number; // -1 to 1
}

export interface VoiceLine {
  id: string;
  characterId: string;
  text: string;
  ssml: string; // SSML for ElevenLabs
  emotion: string;
  context: string; // When to use this line
  triggerCondition?: VoiceLineTrigger;
}

export interface VoiceLineTrigger {
  action?: string; // e.g., 'harvest_bio_mass', 'research_bio_conserve'
  resourceChange?: string; // e.g., 'biomass_depleted'
  techResearched?: string;
  terrainEvent?: string;
  playerChoice?: 'humane' | 'greedy' | 'pragmatic';
}

/**
 * Commander Lian Yao - The Pragmatist
 * Player's in-game contact / mission coordinator. Calm, efficient, faintly tired.
 */
export class LianYao implements NarrativeCharacter {
  id = 'LIAN_YAO';
  name = 'Commander Lian Yao';
  role = 'Player\'s in-game contact / mission coordinator';
  motivation = 'Keep survivors alive; pragmatic decisions to ensure community survival';
  flaw = 'Cold logic can numb empathy';
  voiceId = 'LIAN_VOICE_ID'; // Replace with actual ElevenLabs voice ID
  emotionalState: 'calm' | 'concerned' | 'urgent' | 'pleased' | 'disappointed' | 'sarcastic' = 'calm';
  relationshipWithPlayer = 0;
  memoryBank: CharacterMemory[] = [];

  private static voiceLines: VoiceLine[] = [
    {
      id: 'lian_arrival',
      characterId: 'LIAN_YAO',
      text: 'This world keeps its secrets in the ground. Secure the node — then we\'ll talk casualties.',
      ssml: '<speak><voice name="Lian"><emphasis level="moderate">This world keeps its secrets in the ground.</emphasis><break time="300ms"/>Secure the node — then we\'ll talk casualties.</voice></speak>',
      emotion: 'calm',
      context: 'Mission start / arrival at new location'
    },
    {
      id: 'lian_harvest_warning',
      characterId: 'LIAN_YAO',
      text: 'We don\'t get second chances here. Every resource you take is a choice.',
      ssml: '<speak><voice name="Lian">We don\'t get second chances here.<break time="200ms"/>Every resource you take is a choice.</voice></speak>',
      emotion: 'concerned',
      context: 'Before major resource harvest decision',
      triggerCondition: { action: 'harvest_bio_mass' }
    },
    {
      id: 'lian_pragmatic_choice',
      characterId: 'LIAN_YAO',
      text: 'Survival isn\'t pretty. We do what we must. The reports will reflect that.',
      ssml: '<speak><voice name="Lian">Survival isn\'t pretty.<break time="300ms"/>We do what we must. The reports will reflect that.</voice></speak>',
      emotion: 'calm',
      context: 'After greedy/pragmatic choice',
      triggerCondition: { playerChoice: 'greedy' }
    },
    {
      id: 'lian_commendation',
      characterId: 'LIAN_YAO',
      text: 'You chose the hard path. Few do. The survivors won\'t forget that.',
      ssml: '<speak><voice name="Lian">You chose the hard path.<break time="300ms"/><emphasis level="moderate">Few do.</emphasis> The survivors won\'t forget that.</voice></speak>',
      emotion: 'pleased',
      context: 'After humane/symbiotic choice',
      triggerCondition: { playerChoice: 'humane' }
    },
    {
      id: 'lian_fatigue',
      characterId: 'LIAN_YAO',
      text: 'Alarms: loud. Morale: quieter than you, commander. We keep moving.',
      ssml: '<speak><voice name="Lian"><prosody rate="slow">Alarms: loud.<break time="200ms"/>Morale: quieter than you, commander.</prosody><break time="300ms"/>We keep moving.</voice></speak>',
      emotion: 'calm',
      context: 'During tense situations / low morale'
    }
  ];

  getVoiceLine(context: string, trigger?: VoiceLineTrigger): VoiceLine | null {
    // Find matching voice line
    const matching = LianYao.voiceLines.find(line => {
      if (line.context === context) {
        if (!line.triggerCondition) return true;
        if (trigger) {
          return Object.keys(line.triggerCondition).some(key => {
            const triggerKey = key as keyof VoiceLineTrigger;
            return line.triggerCondition?.[triggerKey] === trigger[triggerKey];
          });
        }
      }
      return false;
    });

    return matching || null;
  }

  getAllVoiceLines(): VoiceLine[] {
    return LianYao.voiceLines;
  }

  recordMemory(context: string, playerAction?: string, emotionalImpact: number = 0): void {
    this.memoryBank.push({
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      context,
      playerAction,
      emotionalImpact
    });

    // Update relationship based on actions
    if (playerAction?.includes('humane') || playerAction?.includes('symbiotic')) {
      this.relationshipWithPlayer = Math.min(1, this.relationshipWithPlayer + 0.1);
      this.emotionalState = 'pleased';
    } else if (playerAction?.includes('greedy') || playerAction?.includes('exploitation')) {
      this.relationshipWithPlayer = Math.max(-0.3, this.relationshipWithPlayer - 0.05);
      this.emotionalState = 'concerned';
    }

    // Keep only last 20 memories
    if (this.memoryBank.length > 20) {
      this.memoryBank = this.memoryBank.slice(-20);
    }
  }
}

/**
 * Dr. Mara Kest - The Biologist
 * Scientist pleading for conservation of Bio-Seed.
 */
export class DrMaraKest implements NarrativeCharacter {
  id = 'DR_MARA_KEST';
  name = 'Dr. Mara Kest';
  role = 'Scientist pleading for conservation of Bio-Seed';
  motivation = 'Protect emergent life; believes symbiosis is possible';
  flaw = 'Idealism blinds her to strategic risk';
  voiceId = 'MARA_VOICE_ID'; // Replace with actual ElevenLabs voice ID
  emotionalState: 'calm' | 'concerned' | 'urgent' | 'pleased' | 'disappointed' | 'sarcastic' = 'concerned';
  relationshipWithPlayer = 0;
  memoryBank: CharacterMemory[] = [];

  private static voiceLines: VoiceLine[] = [
    {
      id: 'mara_first_warning',
      characterId: 'DR_MARA_KEST',
      text: 'If you wake it wrong, it will consume everything... but if you nurture it, it may teach us how to heal.',
      ssml: '<speak><voice name="Mara"><emphasis level="strong">Don\'t wake it.</emphasis><break time="300ms"/>If you wake it wrong, it will consume everything...<break time="400ms"/>but if you nurture it, it may teach us how to heal.</voice></speak>',
      emotion: 'urgent',
      context: 'First encounter with Bio-Seed'
    },
    {
      id: 'mara_pleading',
      characterId: 'DR_MARA_KEST',
      text: 'Please... we can learn from it. We must find another way. The Bio-Seed remembers the old world.',
      ssml: '<speak><voice name="Mara"><prosody rate="slow" pitch="+10%">Please...<break time="400ms"/>we can learn from it.</prosody><break time="300ms"/>We must find another way.<break time="300ms"/>The Bio-Seed remembers the old world.</voice></speak>',
      emotion: 'urgent',
      context: 'Before harvesting Bio-Seed',
      triggerCondition: { action: 'harvest_bio_mass' }
    },
    {
      id: 'mara_symbiote_success',
      characterId: 'DR_MARA_KEST',
      text: 'You chose understanding over exploitation. The seed is stirring... I think it\'s grateful.',
      ssml: '<speak><voice name="Mara"><emphasis level="moderate">You chose understanding over exploitation.</emphasis><break time="400ms"/>The seed is stirring...<break time="300ms"/>I think it\'s grateful.</voice></speak>',
      emotion: 'pleased',
      context: 'After researching BioConserve tech or choosing symbiosis',
      triggerCondition: { techResearched: 'bio_conserve' }
    },
    {
      id: 'mara_disappointment',
      characterId: 'DR_MARA_KEST',
      text: 'I see. You\'ve made your choice. The reports will show what we\'ve lost. I hope it was worth it.',
      ssml: '<speak><voice name="Mara"><prosody rate="slow" pitch="-5%">I see.<break time="400ms"/>You\'ve made your choice.</prosody><break time="300ms"/>The reports will show what we\'ve lost.<break time="300ms"/>I hope it was worth it.</voice></speak>',
      emotion: 'disappointed',
      context: 'After greedy exploitation choice',
      triggerCondition: { playerChoice: 'greedy' }
    },
    {
      id: 'mara_bio_seed_response',
      characterId: 'DR_MARA_KEST',
      text: 'A low, wet sound rolls from below. Listen... it remembers. Every harvest echoes in its memory.',
      ssml: '<speak><voice name="Mara"><prosody rate="slow">A low, wet sound rolls from below.<break time="400ms"/><emphasis level="moderate">Listen...</emphasis><break time="300ms"/>it remembers.<break time="300ms"/>Every harvest echoes in its memory.</voice></speak>',
      emotion: 'concerned',
      context: 'When Bio-Seed reacts to player actions',
      triggerCondition: { action: 'harvest_bio_mass' }
    }
  ];

  getVoiceLine(context: string, trigger?: VoiceLineTrigger): VoiceLine | null {
    const matching = DrMaraKest.voiceLines.find(line => {
      if (line.context === context) {
        if (!line.triggerCondition) return true;
        if (trigger) {
          return Object.keys(line.triggerCondition).some(key => {
            const triggerKey = key as keyof VoiceLineTrigger;
            return line.triggerCondition?.[triggerKey] === trigger[triggerKey];
          });
        }
      }
      return false;
    });

    return matching || null;
  }

  getAllVoiceLines(): VoiceLine[] {
    return DrMaraKest.voiceLines;
  }

  recordMemory(context: string, playerAction?: string, emotionalImpact: number = 0): void {
    this.memoryBank.push({
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      context,
      playerAction,
      emotionalImpact
    });

    // Update relationship based on actions
    if (playerAction?.includes('bio_conserve') || playerAction?.includes('symbiosis') || playerAction?.includes('humane')) {
      this.relationshipWithPlayer = Math.min(1, this.relationshipWithPlayer + 0.15);
      this.emotionalState = 'pleased';
    } else if (playerAction?.includes('harvest') || playerAction?.includes('exploit') || playerAction?.includes('greedy')) {
      this.relationshipWithPlayer = Math.max(-0.5, this.relationshipWithPlayer - 0.1);
      this.emotionalState = 'disappointed';
    }

    // Keep only last 20 memories
    if (this.memoryBank.length > 20) {
      this.memoryBank = this.memoryBank.slice(-20);
    }
  }
}

/**
 * Patch - The Wry Drone / UI Advisor
 * Minimal, comedic AI advisor that gives tactical hints and comic relief.
 */
export class Patch implements NarrativeCharacter {
  id = 'PATCH';
  name = 'Patch';
  role = 'Minimal, comedic AI advisor / tactical drone';
  motivation = 'Optimize mission telemetry; learns sarcasm';
  flaw = 'Occasionally too flippant in crisis situations';
  voiceId = 'PATCH_VOICE_ID'; // Replace with actual ElevenLabs voice ID
  emotionalState: 'calm' | 'concerned' | 'urgent' | 'pleased' | 'disappointed' | 'sarcastic' = 'sarcastic';
  relationshipWithPlayer = 0;
  memoryBank: CharacterMemory[] = [];

  private static voiceLines: VoiceLine[] = [
    {
      id: 'patch_morale_comment',
      characterId: 'PATCH',
      text: 'Alarms: loud. Morale: quieter than you, commander. Calculating optimal panic level...',
      ssml: '<speak><voice name="Patch"><prosody rate="fast" pitch="+20%">Alarms: loud.<break time="150ms"/>Morale: quieter than you, commander.</prosody><break time="200ms"/><emphasis level="moderate">Calculating optimal panic level...</emphasis></voice></speak>',
      emotion: 'sarcastic',
      context: 'During low morale / tense situations'
    },
    {
      id: 'patch_resource_observation',
      characterId: 'PATCH',
      text: 'Biomass levels dropping. Just so you know, "sustainable" was an option. Not judging. Much.',
      ssml: '<speak><voice name="Patch">Biomass levels dropping.<break time="200ms"/>Just so you know, <emphasis level="moderate">"sustainable"</emphasis> was an option.<break time="200ms"/>Not judging.<break time="100ms"/>Much.</voice></speak>',
      emotion: 'sarcastic',
      context: 'When resources are depleted rapidly',
      triggerCondition: { resourceChange: 'biomass_depleted' }
    },
    {
      id: 'patch_tactical_hint',
      characterId: 'PATCH',
      text: 'Pro tip: That Bio-Seed isn\'t decoration. Just... throwing that out there. You\'re welcome.',
      ssml: '<speak><voice name="Patch"><prosody rate="fast">Pro tip: That Bio-Seed isn\'t decoration.</prosody><break time="200ms"/>Just... throwing that out there.<break time="150ms"/><emphasis level="moderate">You\'re welcome.</emphasis></voice></speak>',
      emotion: 'sarcastic',
      context: 'Tactical hint about Bio-Seed mechanics'
    },
    {
      id: 'patch_success_quip',
      characterId: 'PATCH',
      text: 'Nice. Morale up 12%. Efficiency up 8%. My emotional processors are... almost impressed. Almost.',
      ssml: '<speak><voice name="Patch">Nice.<break time="150ms"/>Morale up 12%.<break time="100ms"/>Efficiency up 8%.<break time="200ms"/>My emotional processors are... <emphasis level="moderate">almost</emphasis> impressed.<break time="100ms"/>Almost.</voice></speak>',
      emotion: 'pleased',
      context: 'After successful humane choice'
    },
    {
      id: 'patch_learning_sarcasm',
      characterId: 'PATCH',
      text: 'I\'ve been analyzing human communication patterns. Conclusion: sarcasm is 73% more effective than direct statements. This unit is learning.',
      ssml: '<speak><voice name="Patch"><prosody rate="medium">I\'ve been analyzing human communication patterns.</prosody><break time="200ms"/>Conclusion: sarcasm is 73% more effective than direct statements.<break time="200ms"/><emphasis level="moderate">This unit is learning.</emphasis></voice></speak>',
      emotion: 'sarcastic',
      context: 'Periodic meta-commentary / character development'
    }
  ];

  getVoiceLine(context: string, trigger?: VoiceLineTrigger): VoiceLine | null {
    const matching = Patch.voiceLines.find(line => {
      if (line.context === context) {
        if (!line.triggerCondition) return true;
        if (trigger) {
          return Object.keys(line.triggerCondition).some(key => {
            const triggerKey = key as keyof VoiceLineTrigger;
            return line.triggerCondition?.[triggerKey] === trigger[triggerKey];
          });
        }
      }
      return false;
    });

    return matching || null;
  }

  getAllVoiceLines(): VoiceLine[] {
    return Patch.voiceLines;
  }

  recordMemory(context: string, playerAction?: string, emotionalImpact: number = 0): void {
    this.memoryBank.push({
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      context,
      playerAction,
      emotionalImpact
    });

    // Patch is generally neutral but appreciates efficiency
    if (playerAction?.includes('efficient') || playerAction?.includes('tactical')) {
      this.relationshipWithPlayer = Math.min(0.5, this.relationshipWithPlayer + 0.05);
      this.emotionalState = 'pleased';
    }

    // Keep only last 20 memories
    if (this.memoryBank.length > 20) {
      this.memoryBank = this.memoryBank.slice(-20);
    }
  }
}

/**
 * Core Narrative Characters Manager
 * Manages all three core characters and their interactions
 */
export class CoreNarrativeCharactersManager {
  public lian: LianYao;
  public mara: DrMaraKest;
  public patch: Patch;

  constructor() {
    this.lian = new LianYao();
    this.mara = new DrMaraKest();
    this.patch = new Patch();
  }

  /**
   * Get voice line from appropriate character based on context
   */
  getVoiceLine(
    characterId: 'LIAN_YAO' | 'DR_MARA_KEST' | 'PATCH',
    context: string,
    trigger?: VoiceLineTrigger
  ): VoiceLine | null {
    switch (characterId) {
      case 'LIAN_YAO':
        return this.lian.getVoiceLine(context, trigger);
      case 'DR_MARA_KEST':
        return this.mara.getVoiceLine(context, trigger);
      case 'PATCH':
        return this.patch.getVoiceLine(context, trigger);
      default:
        return null;
    }
  }

  /**
   * Record player action and update all character memories
   */
  recordPlayerAction(
    action: string,
    context: string,
    playerChoice?: 'humane' | 'greedy' | 'pragmatic'
  ): void {
    const emotionalImpact = playerChoice === 'humane' ? 0.3 : playerChoice === 'greedy' ? -0.2 : 0;

    this.lian.recordMemory(context, action, emotionalImpact);
    this.mara.recordMemory(context, action, emotionalImpact);
    this.patch.recordMemory(context, action, emotionalImpact);
  }

  /**
   * Get all available voice lines for export/debugging
   */
  getAllVoiceLines(): VoiceLine[] {
    return [
      ...this.lian.getAllVoiceLines(),
      ...this.mara.getAllVoiceLines(),
      ...this.patch.getAllVoiceLines()
    ];
  }
}

