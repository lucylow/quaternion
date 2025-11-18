/**
 * Character Vignette Generator
 * Creates short character reactions to player choices for judge presentation
 */

export interface VignetteContext {
  characterName: string;
  characterPersonality: string;
  playerChoice: string;
  choiceContext: string;
  moralAlignment: 'good' | 'evil' | 'neutral';
}

export interface GeneratedVignette {
  characterId: string;
  characterName: string;
  choiceContext: string;
  reaction: string;
  ssml: string;
  emotion: string;
}

export class CharacterVignetteGenerator {
  private llmConfig?: any;

  constructor(llmConfig?: any) {
    this.llmConfig = llmConfig;
  }

  /**
   * Simple LLM text generation (would integrate with actual LLM service)
   */
  private async generateTextWithLLM(prompt: string): Promise<string> {
    // This would call actual LLM API
    // For now, return placeholder that triggers fallback
    throw new Error('LLM integration not configured - using fallback vignettes');
  }

  /**
   * Generate character vignette reactions to a choice
   */
  async generateVignettesForChoice(
    choice: string,
    choiceContext: string,
    moralAlignment: 'good' | 'evil' | 'neutral'
  ): Promise<GeneratedVignette[]> {
    const characters = [
      {
        id: 'lian',
        name: 'Commander Lian',
        personality: 'pragmatic, authoritative, military-focused'
      },
      {
        id: 'mara',
        name: 'Dr. Mara Kest',
        personality: 'empathetic, ethical, biologist, moral anchor'
      },
      {
        id: 'patch',
        name: 'Patch',
        personality: 'wry, humorous, drone, observational'
      }
    ];

    const vignettes: GeneratedVignette[] = [];

    for (const character of characters) {
      const vignette = await this.generateVignette({
        characterName: character.name,
        characterPersonality: character.personality,
        playerChoice: choice,
        choiceContext,
        moralAlignment
      });

      vignettes.push({
        characterId: character.id,
        characterName: character.name,
        choiceContext,
        reaction: vignette.reaction,
        ssml: vignette.ssml,
        emotion: vignette.emotion
      });
    }

    return vignettes;
  }

  /**
   * Generate single vignette
   */
  private async generateVignette(context: VignetteContext): Promise<{
    reaction: string;
    ssml: string;
    emotion: string;
  }> {
    const prompt = `
SYSTEM: You are a concise sci-fi character writer. Generate one voiced line for ${context.characterName} (${context.characterPersonality}) reacting to the player's choice: "${context.playerChoice}" in context: "${context.choiceContext}".

The line should be:
- 6-10 words
- Reflect the character's personality
- Show their emotional reaction (${context.moralAlignment} alignment)
- Be natural and voice-actable

Output JSON:
{
  "reaction": "the line text",
  "emotion": "emotional state",
  "ssml": "SSML formatted version with prosody"
}
`;

    try {
      const response = await this.generateTextWithLLM(prompt);
      const parsed = this.parseJSONResponse<{
        reaction: string;
        emotion: string;
        ssml: string;
      }>(response);

      return {
        reaction: parsed.reaction,
        ssml: parsed.ssml || this.generateSSML(parsed.reaction, context),
        emotion: parsed.emotion || 'neutral'
      };
    } catch (error) {
      console.warn('Vignette generation failed, using fallback', error);
      return this.getFallbackVignette(context);
    }
  }

  /**
   * Generate SSML from reaction
   */
  private generateSSML(reaction: string, context: VignetteContext): string {
    const voiceName = context.characterName.split(' ')[1] || context.characterName;
    const rate = context.characterName === 'Patch' ? '1.05' : '0.95';
    const pitch = context.characterName === 'Dr. Mara Kest' ? '-1st' : '0st';

    return `<speak><voice name="${voiceName}"><prosody rate="${rate}" pitch="${pitch}">${reaction}</prosody></voice></speak>`;
  }

  /**
   * Parse JSON from LLM response
   */
  private parseJSONResponse<T>(text: string): T {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch (e) {
        console.warn('Failed to parse JSON from LLM response', e);
      }
    }
    throw new Error('No valid JSON found in response');
  }

  /**
   * Get fallback vignette
   */
  private getFallbackVignette(context: VignetteContext): {
    reaction: string;
    ssml: string;
    emotion: string;
  } {
    const fallbacks: Record<string, Record<string, string>> = {
      'Commander Lian': {
        good: 'A necessary sacrifice for the greater good.',
        evil: 'Ruthless efficiency. I approve.',
        neutral: 'The decision is made. Move forward.'
      },
      'Dr. Mara Kest': {
        good: 'You chose life. The future thanks you.',
        evil: 'Please... what have we done?',
        neutral: 'Every choice has consequences we cannot see.'
      },
      'Patch': {
        good: 'Scanning... moral alignment: acceptable. Proceeding.',
        evil: 'Efficiency rating: high. Ethical rating: concerning.',
        neutral: 'Decision logged. Awaiting further instructions.'
      }
    };

    const characterFallbacks = fallbacks[context.characterName] || fallbacks['Patch'];
    const reaction = characterFallbacks[context.moralAlignment] || characterFallbacks.neutral;

    return {
      reaction,
      ssml: this.generateSSML(reaction, context),
      emotion: context.moralAlignment
    };
  }

  /**
   * Generate pre-written judge-ready vignettes
   */
  getJudgeReadyVignettes(): GeneratedVignette[] {
    return [
      // Lian - Harvest choice
      {
        characterId: 'lian',
        characterName: 'Commander Lian',
        choiceContext: 'Player chooses to harvest Bio-Seed for immediate resources',
        reaction: 'Resources secured. The mission continues.',
        ssml: '<speak><voice name="Lian"><prosody rate="0.95">Resources secured. The mission continues.</prosody></voice></speak>',
        emotion: 'pragmatic'
      },
      // Mara - Harvest choice
      {
        characterId: 'mara',
        characterName: 'Dr. Mara Kest',
        choiceContext: 'Player chooses to harvest Bio-Seed for immediate resources',
        reaction: 'What have we done? It remembers everything.',
        ssml: '<speak><voice name="Mara"><prosody rate="0.92" pitch="-1st">What have we done? It remembers everything.</prosody></voice></speak>',
        emotion: 'sorrowful'
      },
      // Patch - Harvest choice
      {
        characterId: 'patch',
        characterName: 'Patch',
        choiceContext: 'Player chooses to harvest Bio-Seed for immediate resources',
        reaction: 'Efficiency: optimal. Ethical rating: declining.',
        ssml: '<speak><voice name="Patch"><prosody rate="1.05">Efficiency: optimal. Ethical rating: declining.</prosody></voice></speak>',
        emotion: 'wry'
      },
      // Lian - Conserve choice
      {
        characterId: 'lian',
        characterName: 'Commander Lian',
        choiceContext: 'Player chooses to conserve Bio-Seed for long-term benefits',
        reaction: 'A calculated risk. Time will tell if it pays.',
        ssml: '<speak><voice name="Lian"><prosody rate="0.96">A calculated risk. Time will tell if it pays.</prosody></voice></speak>',
        emotion: 'measured'
      },
      // Mara - Conserve choice
      {
        characterId: 'mara',
        characterName: 'Dr. Mara Kest',
        choiceContext: 'Player chooses to conserve Bio-Seed for long-term benefits',
        reaction: 'You chose life. The future will remember this.',
        ssml: '<speak><voice name="Mara"><prosody rate="0.91" pitch="-1st">You chose life. The future will remember this.</prosody></voice></speak>',
        emotion: 'hopeful'
      },
      // Patch - Conserve choice
      {
        characterId: 'patch',
        characterName: 'Patch',
        choiceContext: 'Player chooses to conserve Bio-Seed for long-term benefits',
        reaction: 'Long-term strategy detected. Calculating... outcome: uncertain.',
        ssml: '<speak><voice name="Patch"><prosody rate="1.03">Long-term strategy detected. Calculating... outcome: uncertain.</prosody></voice></speak>',
        emotion: 'analytical'
      }
    ];
  }
}

