/**
 * Procedural Dialogue System
 * Generates contextual, character-voiced dialogue using LLM
 */

import { LLMIntegration } from '@/ai/integrations/LLMIntegration';
import type { WorldModel, PlayerProfile } from './AINarrativeDirector';
import type { AICharacter, CharacterEmotionalState } from './CharacterAI';

export interface CharacterVoice {
  characterId: string;
  personalityTraits: string[];
  speechPatterns: string[];
  catchphrases: string[];
  emotionalTendencies: Record<string, number>; // emotion -> tendency (0-1)
  formalityLevel: number; // 0-1
  verbosity: number; // 0-1
}

export interface DialogueResponse {
  text: string;
  emotionalState: CharacterEmotionalState;
  tone: string;
}

export interface DialogueOption {
  id: string;
  text: string;
  topic: string;
  emotionalTone: 'curious' | 'aggressive' | 'friendly' | 'neutral' | 'suspicious';
  relationshipImpact: number; // -1 to 1
}

export class AIDialogueSystem {
  private characterVoices: Map<string, CharacterVoice> = new Map();

  constructor(private llm: LLMIntegration) {}

  /**
   * Register a character voice
   */
  registerCharacterVoice(voice: CharacterVoice): void {
    this.characterVoices.set(voice.characterId, voice);
  }

  /**
   * Generate contextual dialogue for a character
   */
  async generateContextualDialogue(
    characterId: string,
    topic: string,
    world: WorldModel,
    player: PlayerProfile,
    characterEmotion: CharacterEmotionalState,
    character?: AICharacter
  ): Promise<DialogueResponse> {
    const voice = this.characterVoices.get(characterId);
    if (!voice && !character) {
      return {
        text: '...',
        emotionalState: { type: 'calm', intensity: 0.5, calculateActionPreference: () => 0.5 },
        tone: 'neutral'
      };
    }

    const context = this.buildDialogueContext(
      characterId,
      topic,
      world,
      player,
      characterEmotion,
      voice || undefined,
      character
    );

    const prompt = `Generate dialogue for ${characterId} about: ${topic}

CONTEXT:
${context}

CHARACTER VOICE:
- Personality: ${voice ? voice.personalityTraits.join(', ') : character?.personality.getDescription() || 'neutral'}
- Speech Style: ${voice ? voice.speechPatterns.join(', ') : 'neutral'}
- Current Emotion: ${characterEmotion.type}

Create dialogue that:
- Matches the character's voice exactly
- Responds to the current situation
- Advances character development
- Feels authentic and grounded
- Is 1-3 sentences maximum

Return only the dialogue text.`;

    try {
      const baseDialogue = await this.llm.generateText(prompt);
      const voicedDialogue = voice
        ? this.applyVoiceToText(baseDialogue, voice, characterEmotion)
        : baseDialogue;

      return {
        text: voicedDialogue.trim(),
        emotionalState: characterEmotion,
        tone: characterEmotion.type
      };
    } catch (error) {
      console.error('Dialogue generation failed:', error);
      return {
        text: this.getFallbackDialogue(characterId, voice),
        emotionalState: characterEmotion,
        tone: characterEmotion.type
      };
    }
  }

  /**
   * Generate dialogue options for player
   */
  async generateDialogueOptions(
    player: PlayerProfile,
    characterId: string,
    world: WorldModel,
    availableTopics: string[]
  ): Promise<DialogueOption[]> {
    const prompt = `Generate dialogue options for player speaking to ${characterId}:

PLAYER CONTEXT:
- Archetype: ${player.dominantArchetype}
- Recent Actions: ${player.recentActions.slice(-3).join(', ')}
- Relationship with Character: ${this.getRelationshipDescription(player, characterId)}

WORLD CONTEXT:
- Recent Events: ${world.recentEvents.slice(-2).map(e => e.description).join(', ')}

AVAILABLE TOPICS: ${availableTopics.join(', ')}

Create 3-4 dialogue options that:
- Cover different conversation approaches
- Reflect player's personality
- Offer meaningful choices
- Advance relationships
- Are 5-10 words each

Respond as JSON array:
[
  {
    "text": "Option text",
    "topic": "topic_name",
    "emotionalTone": "curious/aggressive/friendly/neutral/suspicious",
    "relationshipImpact": 5.0
  }
]`;

    try {
      const response = await this.llm.generateText(prompt);
      const options = this.parseDialogueOptionsFromJSON(response);
      
      // Add IDs and normalize relationship impact
      return options.map((opt, idx) => ({
        ...opt,
        id: `option_${characterId}_${Date.now()}_${idx}`,
        relationshipImpact: Math.max(-1, Math.min(1, opt.relationshipImpact / 10))
      }));
    } catch (error) {
      console.error('Dialogue options generation failed:', error);
      return this.getFallbackDialogueOptions(availableTopics);
    }
  }

  /**
   * Apply character voice to text
   */
  private async applyVoiceToText(
    baseText: string,
    voice: CharacterVoice,
    emotion: CharacterEmotionalState
  ): Promise<string> {
    const prompt = `Rewrite this dialogue in the character's voice:

CHARACTER: ${voice.characterId}
PERSONALITY: ${voice.personalityTraits.join(', ')}
SPEECH PATTERNS: ${voice.speechPatterns.join(', ')}
CURRENT EMOTION: ${emotion.type}
FORMALITY: ${voice.formalityLevel}/1.0
VERBOSITY: ${voice.verbosity}/1.0

ORIGINAL TEXT: ${baseText}

Rewrite the text to sound like this character would speak.
Keep the same core meaning but adapt:
- Vocabulary choice
- Sentence structure
- Emotional expression
- Formality level
- Length (${voice.verbosity > 0.7 ? 'be more verbose' : 'be concise'})

Return only the rewritten text.`;

    try {
      const voiced = await this.llm.generateText(prompt);
      return voiced.trim();
    } catch (error) {
      console.error('Voice application failed:', error);
      return baseText; // Return original if voice application fails
    }
  }

  private buildDialogueContext(
    characterId: string,
    topic: string,
    world: WorldModel,
    player: PlayerProfile,
    characterEmotion: CharacterEmotionalState,
    voice?: CharacterVoice,
    character?: AICharacter
  ): string {
    const voiceDesc = voice
      ? `Personality: ${voice.personalityTraits.join(', ')}, Speech: ${voice.speechPatterns.join(', ')}`
      : character?.personality.getDescription() || 'neutral';

    return `
CHARACTER: ${characterId}
${voiceDesc}
CURRENT EMOTION: ${characterEmotion.type} (${characterEmotion.intensity})

WORLD STATE:
- Recent Events: ${world.recentEvents.slice(-3).map(e => e.description).join(', ')}
- Global Tension: ${world.globalTension}/100

PLAYER STATE:
- Recent Actions: ${player.recentActions.slice(-3).join(', ')}
- Moral Alignment: ${player.moralAlignment}
- Emotional State: ${player.currentEmotion.type}

TOPIC: ${topic}
`;
  }

  private getRelationshipDescription(player: PlayerProfile, characterId: string): string {
    // Would need relationship tracking in player profile
    return 'neutral';
  }

  private parseDialogueOptionsFromJSON(text: string): Omit<DialogueOption, 'id'>[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse dialogue options JSON:', error);
    }
    return [];
  }

  private getFallbackDialogue(characterId: string, voice?: CharacterVoice): string {
    if (voice && voice.catchphrases.length > 0) {
      return voice.catchphrases[Math.floor(Math.random() * voice.catchphrases.length)];
    }
    return 'I understand.';
  }

  private getFallbackDialogueOptions(topics: string[]): DialogueOption[] {
    return topics.slice(0, 4).map((topic, idx) => ({
      id: `fallback_${idx}`,
      text: `Ask about ${topic}`,
      topic,
      emotionalTone: 'curious' as const,
      relationshipImpact: 0
    }));
  }

  /**
   * Create a default character voice for an AI character
   */
  createDefaultVoice(character: AICharacter): CharacterVoice {
    const personality = character.personality;
    const traits: string[] = [];
    const patterns: string[] = [];

    if (personality.extraversion > 0.7) {
      traits.push('outgoing');
      patterns.push('direct statements');
    }
    if (personality.agreeableness > 0.7) {
      traits.push('compassionate');
      patterns.push('polite language');
    }
    if (personality.openness > 0.7) {
      traits.push('curious');
      patterns.push('questions');
    }
    if (personality.conscientiousness > 0.7) {
      traits.push('disciplined');
      patterns.push('structured speech');
    }

    return {
      characterId: character.characterId,
      personalityTraits: traits.length > 0 ? traits : ['neutral'],
      speechPatterns: patterns.length > 0 ? patterns : ['standard'],
      catchphrases: [],
      emotionalTendencies: {},
      formalityLevel: 0.5,
      verbosity: personality.extraversion
    };
  }
}


