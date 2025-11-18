/**
 * Narrative Generation Service
 * Uses Gemini API via LLMIntegration to generate commander-specific narratives
 */

import { LLMIntegration, type LLMConfig } from '../ai/integrations/LLMIntegration';
import type { CommanderProfile, CommanderArchetype } from '../ai/opponents/AICommanderArchetypes';

export interface NarrativeContext {
  commanderProfile: CommanderProfile;
  gamePhase?: 'early' | 'mid' | 'late';
  gameState?: {
    resources?: Record<string, number>;
    unitCount?: number;
    buildingCount?: number;
    militaryAdvantage?: number;
    resourceAdvantage?: number;
  };
  recentAction?: string;
  mapTheme?: string;
  opponentProfile?: CommanderProfile;
}

export interface CommanderNarrative {
  type: 'intro' | 'dialogue' | 'event' | 'victory' | 'defeat' | 'taunt' | 'strategy_comment';
  text: string;
  tone: string;
  timing?: 'pre_battle' | 'early_game' | 'mid_game' | 'late_game' | 'post_battle';
}

export interface BattleIntro {
  title: string;
  description: string;
  commanderIntro: string;
  battlefieldDescription: string;
}

export interface NarrativeResponse {
  narrative: CommanderNarrative;
  metadata: {
    archetype: CommanderArchetype;
    generatedAt: Date;
    contextHash: string;
  };
}

export class NarrativeGenerationService {
  private llm: LLMIntegration;
  private cache: Map<string, NarrativeResponse> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(config?: LLMConfig) {
    // Default to Google AI (Gemini) if no config provided
    const defaultConfig: LLMConfig = {
      provider: 'google',
      apiKey: config?.apiKey || 
              import.meta.env.VITE_GEMINI_AI_API_KEY || 
              import.meta.env.VITE_GOOGLE_AI_API_KEY,
      model: config?.model || 'gemini-2.0-flash-exp',
      temperature: config?.temperature ?? 0.8, // Higher for creative narratives
      maxTokens: config?.maxTokens ?? 500,
    };

    this.llm = new LLMIntegration(defaultConfig);
  }

  /**
   * Generate battle intro narrative
   */
  async generateBattleIntro(
    commanderProfile: CommanderProfile,
    opponentProfile: CommanderProfile,
    mapTheme: string = 'a strategic battlefield'
  ): Promise<BattleIntro> {
    const cacheKey = `battle_intro_${commanderProfile.archetype}_${opponentProfile.archetype}_${mapTheme}`;
    const cached = this.getCached<NarrativeResponse & { battleIntro: BattleIntro }>(cacheKey);
    if (cached?.battleIntro) {
      return cached.battleIntro;
    }

    const prompt = this.buildBattleIntroPrompt(commanderProfile, opponentProfile, mapTheme);
    
    try {
      const response = await this.llm.generateText(prompt);
      const battleIntro = this.parseBattleIntroResponse(response, commanderProfile);
      this.setCached(cacheKey, { battleIntro, narrative: this.narrativeFromIntro(battleIntro, commanderProfile), metadata: {
        archetype: commanderProfile.archetype,
        generatedAt: new Date(),
        contextHash: cacheKey
      }});
      return battleIntro;
    } catch (error) {
      console.warn('Battle intro generation failed, using fallback', error);
      return this.getFallbackBattleIntro(commanderProfile, opponentProfile, mapTheme);
    }
  }

  /**
   * Generate commander dialogue based on context
   */
  async generateDialogue(context: NarrativeContext): Promise<CommanderNarrative> {
    const cacheKey = this.generateContextHash(context);
    const cached = this.getCached<CommanderNarrative>(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = this.buildDialoguePrompt(context);
    
    try {
      const response = await this.llm.generateText(prompt);
      const narrative = this.parseDialogueResponse(response, context.commanderProfile);
      this.setCached(cacheKey, narrative);
      return narrative;
    } catch (error) {
      console.warn('Dialogue generation failed, using fallback', error);
      return this.getFallbackDialogue(context);
    }
  }

  /**
   * Generate narrative for specific event type
   */
  async generateEventNarrative(
    context: NarrativeContext,
    eventType: CommanderNarrative['type']
  ): Promise<CommanderNarrative> {
    const cacheKey = `${eventType}_${this.generateContextHash(context)}`;
    const cached = this.getCached<CommanderNarrative>(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = this.buildEventPrompt(context, eventType);
    
    try {
      const response = await this.llm.generateText(prompt);
      const narrative = this.parseDialogueResponse(response, context.commanderProfile, eventType);
      this.setCached(cacheKey, narrative);
      return narrative;
    } catch (error) {
      console.warn(`${eventType} narrative generation failed, using fallback`, error);
      return this.getFallbackNarrative(context, eventType);
    }
  }

  /**
   * Generate strategy commentary
   */
  async generateStrategyComment(
    commanderProfile: CommanderProfile,
    strategy: string,
    gameState?: NarrativeContext['gameState']
  ): Promise<CommanderNarrative> {
    const context: NarrativeContext = {
      commanderProfile,
      gameState,
      recentAction: strategy
    };

    return this.generateEventNarrative(context, 'strategy_comment');
  }

  /**
   * Generate taunt based on game state
   */
  async generateTaunt(
    commanderProfile: CommanderProfile,
    advantage: 'military' | 'economic' | 'strategic',
    gameState?: NarrativeContext['gameState']
  ): Promise<CommanderNarrative> {
    const context: NarrativeContext = {
      commanderProfile,
      gameState,
      recentAction: `taunt_${advantage}`
    };

    return this.generateEventNarrative(context, 'taunt');
  }

  /**
   * Generate victory/defeat narrative
   */
  async generateBattleOutcome(
    commanderProfile: CommanderProfile,
    outcome: 'victory' | 'defeat',
    opponentProfile?: CommanderProfile,
    battleDuration?: number
  ): Promise<CommanderNarrative> {
    const context: NarrativeContext = {
      commanderProfile,
      opponentProfile,
      gameState: { unitCount: 0, buildingCount: 0 }
    };

    return this.generateEventNarrative(context, outcome);
  }

  // Private helper methods

  private buildBattleIntroPrompt(
    commander: CommanderProfile,
    opponent: CommanderProfile,
    mapTheme: string
  ): string {
    return `Generate an epic battle intro for a sci-fi RTS game.

Commander "${commander.archetype}" characteristics:
- Personality: ${commander.behavior}
- Voice tone: ${commander.voiceProfile.tone}
- Speech pattern: ${commander.voiceProfile.speechPattern}
- Traits: Aggression ${commander.traits.aggression}, Innovation ${commander.traits.innovation}, Ruthlessness ${commander.traits.ruthlessness}
- Preferred strategies: ${commander.preferredStrategies.join(', ')}
- Catchphrases style: ${commander.voiceProfile.catchphrases.slice(0, 2).join(', ')}

Opponent: "${opponent.archetype}" - ${opponent.behavior}
Battlefield: ${mapTheme}

Generate a dramatic intro in JSON format:
{
  "title": "Brief battle title (5-7 words)",
  "description": "Epic 2-sentence description of the coming battle",
  "commanderIntro": "Commander's opening line reflecting their personality (max 15 words)",
  "battlefieldDescription": "Atmospheric description of the battlefield (max 20 words)"
}

Make it dramatic, immersive, and true to the commander's personality. Use their voice style.`;
  }

  private buildDialoguePrompt(context: NarrativeContext): string {
    const { commanderProfile, gameState, recentAction, gamePhase } = context;
    
    let prompt = `Generate commander dialogue for a sci-fi RTS game.

Commander "${commanderProfile.archetype}":
- Behavior: ${commanderProfile.behavior}
- Voice: ${commanderProfile.voiceProfile.tone}, ${commanderProfile.voiceProfile.speechPattern}
- Traits: Aggression ${commanderProfile.traits.aggression}, Caution ${commanderProfile.traits.caution}
- Catchphrases style: ${commanderProfile.voiceProfile.catchphrases.slice(0, 2).join(', ')}
- Preferred strategies: ${commanderProfile.preferredStrategies.join(', ')}
`;

    if (gamePhase) {
      prompt += `- Game phase: ${gamePhase}\n`;
    }

    if (gameState) {
      prompt += `\nCurrent game state:\n`;
      if (gameState.militaryAdvantage !== undefined) {
        prompt += `- Military advantage: ${gameState.militaryAdvantage > 0 ? 'advantage' : 'disadvantage'}\n`;
      }
      if (gameState.resourceAdvantage !== undefined) {
        prompt += `- Resource advantage: ${gameState.resourceAdvantage > 0 ? 'advantage' : 'disadvantage'}\n`;
      }
      if (gameState.unitCount !== undefined) {
        prompt += `- Units: ${gameState.unitCount}\n`;
      }
    }

    if (recentAction) {
      prompt += `\nRecent action: ${recentAction}\n`;
    }

    prompt += `\nGenerate a brief, natural dialogue comment (max 15 words) that:
- Matches their personality and voice
- Responds to the current situation
- Sounds strategic and immersive
- Uses their speech pattern

Return only the dialogue text, no quotes, no JSON.`;

    return prompt;
  }

  private buildEventPrompt(
    context: NarrativeContext,
    eventType: CommanderNarrative['type']
  ): string {
    const { commanderProfile, gameState, opponentProfile } = context;
    
    let prompt = `Generate ${eventType} narrative for commander "${commanderProfile.archetype}".

Commander profile:
- Behavior: ${commanderProfile.behavior}
- Voice: ${commanderProfile.voiceProfile.tone}, ${commanderProfile.voiceProfile.speechPattern}
- Traits: ${JSON.stringify(commanderProfile.traits)}
- Catchphrases style: ${commanderProfile.voiceProfile.catchphrases.join(', ')}
`;

    if (opponentProfile) {
      prompt += `\nOpponent: ${opponentProfile.archetype} - ${opponentProfile.behavior}\n`;
    }

    if (gameState) {
      prompt += `\nGame state: ${JSON.stringify(gameState)}\n`;
    }

    const eventInstructions: Record<CommanderNarrative['type'], string> = {
      intro: 'Generate an epic battle intro line (max 20 words)',
      dialogue: 'Generate situational dialogue (max 15 words)',
      event: 'Generate narrative for a game event (max 20 words)',
      victory: 'Generate victory declaration matching their personality (max 15 words)',
      defeat: 'Generate defeat acknowledgment matching their personality (max 15 words)',
      taunt: 'Generate a taunt based on their advantage (max 15 words)',
      strategy_comment: 'Generate strategic commentary (max 15 words)'
    };

    prompt += `\n${eventInstructions[eventType]}\n`;
    prompt += `Return only the text, no quotes, no JSON. Match their voice exactly.`;

    return prompt;
  }

  private parseBattleIntroResponse(response: string, commander: CommanderProfile): BattleIntro {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || `Battle: ${commander.archetype}`,
          description: parsed.description || 'Two commanders clash in an epic battle.',
          commanderIntro: parsed.commanderIntro || commander.voiceProfile.catchphrases[0],
          battlefieldDescription: parsed.battlefieldDescription || 'A strategic battlefield awaits.'
        };
      }
    } catch (e) {
      console.warn('Failed to parse battle intro JSON', e);
    }
    
    // Fallback parsing
    return this.getFallbackBattleIntro(commander, commander, 'battlefield');
  }

  private parseDialogueResponse(
    response: string,
    commander: CommanderProfile,
    type: CommanderNarrative['type'] = 'dialogue'
  ): CommanderNarrative {
    const cleaned = response.trim().replace(/^["']|["']$/g, '').trim();
    
    return {
      type,
      text: cleaned || commander.voiceProfile.catchphrases[0],
      tone: commander.voiceProfile.tone,
      timing: 'mid_game' // Default, can be improved with context
    };
  }

  private narrativeFromIntro(intro: BattleIntro, commander: CommanderProfile): CommanderNarrative {
    return {
      type: 'intro',
      text: intro.commanderIntro,
      tone: commander.voiceProfile.tone,
      timing: 'pre_battle'
    };
  }

  private generateContextHash(context: NarrativeContext): string {
    const key = `${context.commanderProfile.archetype}_${context.gamePhase || 'unknown'}_${context.recentAction || 'none'}_${JSON.stringify(context.gameState || {})}`;
    // Browser-compatible base64 encoding
    try {
      const encoded = btoa(unescape(encodeURIComponent(key)));
      return encoded.slice(0, 32);
    } catch (e) {
      // Fallback to simple hash if btoa fails
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(36).slice(0, 32);
    }
  }

  private getCached<T>(key: string): T | null {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() < expiry) {
      const cached = this.cache.get(key);
      if (cached) {
        return cached as T;
      }
    }
    return null;
  }

  private setCached<T>(key: string, value: T): void {
    this.cache.set(key, value as any);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  // Fallback methods

  private getFallbackBattleIntro(
    commander: CommanderProfile,
    opponent: CommanderProfile,
    mapTheme: string
  ): BattleIntro {
    return {
      title: `${commander.archetype} vs ${opponent.archetype}`,
      description: `Two legendary commanders prepare for battle on ${mapTheme}. Only one will emerge victorious.`,
      commanderIntro: commander.voiceProfile.catchphrases[0],
      battlefieldDescription: `The ${mapTheme} awaits the clash of titans.`
    };
  }

  private getFallbackDialogue(context: NarrativeContext): CommanderNarrative {
    const { commanderProfile, gameState } = context;
    
    if (gameState?.militaryAdvantage && gameState.militaryAdvantage > 0.3) {
      return {
        type: 'dialogue',
        text: 'Our forces are strong. Press the advantage.',
        tone: commanderProfile.voiceProfile.tone,
        timing: 'mid_game'
      };
    }
    
    return {
      type: 'dialogue',
      text: commanderProfile.voiceProfile.catchphrases[0],
      tone: commanderProfile.voiceProfile.tone,
      timing: 'mid_game'
    };
  }

  private getFallbackNarrative(
    context: NarrativeContext,
    type: CommanderNarrative['type']
  ): CommanderNarrative {
    const { commanderProfile } = context;
    
    const fallbacks: Record<CommanderNarrative['type'], string> = {
      intro: commanderProfile.voiceProfile.catchphrases[0],
      dialogue: commanderProfile.voiceProfile.catchphrases[1] || commanderProfile.voiceProfile.catchphrases[0],
      event: 'Interesting development. Let us adapt.',
      victory: 'Victory is ours. Well fought.',
      defeat: 'A setback, but not the end.',
      taunt: 'You cannot match my strategy.',
      strategy_comment: 'Let me consider this carefully.'
    };

    return {
      type,
      text: fallbacks[type],
      tone: commanderProfile.voiceProfile.tone,
      timing: 'mid_game'
    };
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

