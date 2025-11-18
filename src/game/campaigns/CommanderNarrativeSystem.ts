/**
 * Commander Narrative System
 * Generates war strategy storytelling narratives specific to each commander's traits and personality
 */

import { LLMIntegration } from '../../ai/integrations/LLMIntegration';
import type { NarrativeEvent } from './CampaignSystem';

export interface CommanderTraits {
  aggressiveness: number;
  riskTolerance: number;
  patience: number;
  explorationDrive: number;
  innovationDrive: number;
  microFocus: number;
}

export interface Commander {
  id: string;
  name: string;
  traits: CommanderTraits;
}

export interface CommanderNarrativeInput {
  commanderId: string;
  commanderName: string;
  traits: CommanderTraits;
  situation: string; // e.g., "early_game", "mid_game", "late_game", "battle", "resource_discovery"
  gameState?: {
    resources?: Record<string, number>;
    units?: number;
    buildings?: number;
    enemyThreat?: number;
    time?: number;
  };
  seed?: number;
}

export interface CommanderNarrative {
  title: string;
  narrative: string;
  strategicInsight: string;
  commanderVoice: string; // What the commander would say
  tone: 'methodical' | 'aggressive' | 'exploratory' | 'calculated' | 'patient' | 'chaotic';
  narrativeTag?: string;
}

export class CommanderNarrativeSystem {
  private llm: LLMIntegration;
  private narrativeCache: Map<string, CommanderNarrative> = new Map();
  private commanders: Map<string, Commander> = new Map();

  constructor(llmConfig?: any) {
    this.llm = new LLMIntegration({
      provider: llmConfig?.provider || 'google',
      apiKey: llmConfig?.apiKey,
      temperature: 0.8,
      maxTokens: 300
    });
    this.loadCommanders();
  }

  /**
   * Load commanders from config
   */
  private async loadCommanders() {
    try {
      const response = await fetch('/config/commanders.json');
      const data = await response.json();
      data.commanders.forEach((cmd: Commander) => {
        this.commanders.set(cmd.id, cmd);
      });
    } catch (error) {
      console.warn('Failed to load commanders, using fallback', error);
      this.loadFallbackCommanders();
    }
  }

  /**
   * Fallback commanders if config fails to load
   */
  private loadFallbackCommanders() {
    const fallback: Commander[] = [
      {
        id: 'architect',
        name: 'The Architect',
        traits: { aggressiveness: 0.25, riskTolerance: 0.2, patience: 0.95, explorationDrive: 0.4, innovationDrive: 0.3, microFocus: 0.7 }
      },
      {
        id: 'aggressor',
        name: 'The Aggressor',
        traits: { aggressiveness: 0.95, riskTolerance: 0.85, patience: 0.25, explorationDrive: 0.3, innovationDrive: 0.4, microFocus: 0.6 }
      },
      {
        id: 'nomad',
        name: 'The Nomad',
        traits: { aggressiveness: 0.55, riskTolerance: 0.6, patience: 0.5, explorationDrive: 0.85, innovationDrive: 0.8, microFocus: 0.4 }
      },
      {
        id: 'tactician',
        name: 'The Tactician',
        traits: { aggressiveness: 0.6, riskTolerance: 0.45, patience: 0.6, explorationDrive: 0.5, innovationDrive: 0.5, microFocus: 0.8 }
      },
      {
        id: 'harvester',
        name: 'The Harvester',
        traits: { aggressiveness: 0.2, riskTolerance: 0.3, patience: 0.9, explorationDrive: 0.6, innovationDrive: 0.25, microFocus: 0.3 }
      },
      {
        id: 'wildcard',
        name: 'The Wildcard',
        traits: { aggressiveness: 0.7, riskTolerance: 0.9, patience: 0.35, explorationDrive: 0.95, innovationDrive: 0.95, microFocus: 0.2 }
      }
    ];
    fallback.forEach(cmd => this.commanders.set(cmd.id, cmd));
  }

  /**
   * Generate a commander-specific narrative
   */
  async generateNarrative(input: CommanderNarrativeInput): Promise<CommanderNarrative> {
    const commander = this.commanders.get(input.commanderId);
    if (!commander) {
      throw new Error(`Commander not found: ${input.commanderId}`);
    }

    // Create cache key
    const cacheKey = this.createCacheKey(input);
    if (this.narrativeCache.has(cacheKey)) {
      return this.narrativeCache.get(cacheKey)!;
    }

    try {
      const prompt = this.buildCommanderNarrativePrompt(input, commander);
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseJSONResponse<CommanderNarrative>(response);
      
      // Validate and enhance
      const narrative: CommanderNarrative = {
        title: parsed.title || this.getFallbackTitle(input),
        narrative: parsed.narrative || this.getFallbackNarrative(input, commander),
        strategicInsight: parsed.strategicInsight || this.getFallbackInsight(input, commander),
        commanderVoice: parsed.commanderVoice || this.getFallbackVoice(input, commander),
        tone: parsed.tone || this.determineTone(commander.traits),
        narrativeTag: parsed.narrativeTag || input.situation
      };

      this.narrativeCache.set(cacheKey, narrative);
      return narrative;
    } catch (error) {
      console.warn('LLM narrative generation failed, using fallback', error);
      return this.getFallbackNarrative(input, commander);
    }
  }

  /**
   * Build prompt for commander-specific narrative
   */
  private buildCommanderNarrativePrompt(input: CommanderNarrativeInput, commander: Commander): string {
    const personality = this.describePersonality(commander.traits);
    const situationContext = this.describeSituation(input.situation, input.gameState);

    return `You are a war strategy storyteller crafting narratives for a commander in a real-time strategy game.

COMMANDER: ${commander.name}
PERSONALITY: ${personality}
SITUATION: ${situationContext}

Generate a war strategy narrative that:
1. Reflects the commander's unique personality and strategic approach
2. Describes their decision-making process and tactical thinking
3. Shows how their traits influence their strategy
4. Includes a direct quote from the commander (their voice)
5. Provides strategic insight into their approach

Output JSON:
{
  "title": "Brief narrative title (3-6 words)",
  "narrative": "2-3 sentences describing the commander's strategic approach and decision-making (40-60 words). Use vivid, military-strategic language. Show their personality through their actions and thoughts.",
  "strategicInsight": "1 sentence explaining the strategic reasoning (15-25 words)",
  "commanderVoice": "Direct quote from the commander showing their personality (10-20 words)",
  "tone": "methodical|aggressive|exploratory|calculated|patient|chaotic",
  "narrativeTag": "${input.situation}"
}

Make it feel authentic to this commander's style.`;
  }

  /**
   * Describe commander personality from traits
   */
  private describePersonality(traits: CommanderTraits): string {
    const parts: string[] = [];

    if (traits.aggressiveness > 0.7) {
      parts.push('Highly aggressive, prefers offensive strategies');
    } else if (traits.aggressiveness < 0.4) {
      parts.push('Defensive and cautious, avoids unnecessary conflict');
    } else {
      parts.push('Balanced aggression, adapts to situation');
    }

    if (traits.riskTolerance > 0.7) {
      parts.push('high risk tolerance, willing to gamble');
    } else if (traits.riskTolerance < 0.4) {
      parts.push('risk-averse, prefers safe, calculated moves');
    }

    if (traits.patience > 0.7) {
      parts.push('extremely patient, plays the long game');
    } else if (traits.patience < 0.4) {
      parts.push('impatient, seeks quick decisive actions');
    }

    if (traits.explorationDrive > 0.7) {
      parts.push('exploration-focused, values map control and discovery');
    }

    if (traits.innovationDrive > 0.7) {
      parts.push('innovative, experiments with new strategies');
    }

    if (traits.microFocus > 0.7) {
      parts.push('detail-oriented, excellent unit micro-management');
    } else if (traits.microFocus < 0.4) {
      parts.push('macro-focused, prioritizes overall strategy over details');
    }

    return parts.join(', ');
  }

  /**
   * Describe situation context
   */
  private describeSituation(situation: string, gameState?: CommanderNarrativeInput['gameState']): string {
    let context = `Current phase: ${situation}`;

    if (gameState) {
      const parts: string[] = [];
      if (gameState.resources) {
        const resList = Object.entries(gameState.resources).map(([k, v]) => `${k}: ${v}`).join(', ');
        parts.push(`Resources: ${resList}`);
      }
      if (gameState.units !== undefined) parts.push(`Units: ${gameState.units}`);
      if (gameState.buildings !== undefined) parts.push(`Buildings: ${gameState.buildings}`);
      if (gameState.enemyThreat !== undefined) parts.push(`Enemy threat level: ${gameState.enemyThreat}`);
      if (gameState.time !== undefined) parts.push(`Game time: ${gameState.time} minutes`);
      
      if (parts.length > 0) {
        context += `. ${parts.join('. ')}`;
      }
    }

    return context;
  }

  /**
   * Determine narrative tone from traits
   */
  private determineTone(traits: CommanderTraits): CommanderNarrative['tone'] {
    if (traits.aggressiveness > 0.7) return 'aggressive';
    if (traits.patience > 0.7) return 'patient';
    if (traits.explorationDrive > 0.7) return 'exploratory';
    if (traits.microFocus > 0.7) return 'methodical';
    if (traits.riskTolerance > 0.7 && traits.innovationDrive > 0.7) return 'chaotic';
    return 'calculated';
  }

  /**
   * Create cache key
   */
  private createCacheKey(input: CommanderNarrativeInput): string {
    const stateStr = input.gameState ? JSON.stringify(input.gameState) : '';
    return `${input.commanderId}_${input.situation}_${input.seed || 0}_${stateStr}`;
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
   * Fallback narratives for each commander
   */
  private getFallbackNarrative(input: CommanderNarrativeInput, commander: Commander): CommanderNarrative {
    const fallbacks: Record<string, Record<string, CommanderNarrative>> = {
      architect: {
        early_game: {
          title: 'Foundation First',
          narrative: 'The Architect surveys the terrain with methodical precision. Every structure is planned, every resource node calculated. Patience is the foundation of victory—build the infrastructure, and the war will follow.',
          strategicInsight: 'Focus on economic and technological superiority before committing to military engagements.',
          commanderVoice: 'A fortress built in haste is a fortress built to fall. We build for eternity.',
          tone: 'methodical',
          narrativeTag: 'early_game'
        },
        battle: {
          title: 'Calculated Defense',
          narrative: 'The Architect positions units with geometric precision. Each defensive line is a calculated equation. No move is wasted, no resource squandered. Victory through superior positioning.',
          strategicInsight: 'Use defensive positioning and superior technology to overcome numerical disadvantages.',
          commanderVoice: 'Let them break upon our walls. Mathematics favors the prepared.',
          tone: 'methodical',
          narrativeTag: 'battle'
        }
      },
      aggressor: {
        early_game: {
          title: 'Rush to War',
          narrative: 'The Aggressor sees opportunity in every weakness. No time for patience—strike fast, strike hard. Resources are for weapons, not infrastructure. The enemy must fall before they can prepare.',
          strategicInsight: 'Aggressive early pressure can overwhelm opponents before they establish their economy.',
          commanderVoice: 'Every moment we wait is a moment they prepare. Attack now!',
          tone: 'aggressive',
          narrativeTag: 'early_game'
        },
        battle: {
          title: 'Overwhelming Force',
          narrative: 'The Aggressor leads from the front, units surging forward in relentless waves. Tactics are for the cautious—victory belongs to those who strike without hesitation.',
          strategicInsight: 'Maintain constant pressure and force engagements before the enemy can counter.',
          commanderVoice: 'Push forward! Break their lines! Victory or death!',
          tone: 'aggressive',
          narrativeTag: 'battle'
        }
      },
      nomad: {
        early_game: {
          title: 'Wandering Strategy',
          narrative: 'The Nomad moves constantly, exploring every corner of the map. Resources are found, not hoarded. Innovation comes from seeing what others miss. The map is the greatest weapon.',
          strategicInsight: 'Map control and resource diversity provide flexibility and unexpected advantages.',
          commanderVoice: 'The world is vast. Those who stay in one place are already defeated.',
          tone: 'exploratory',
          narrativeTag: 'early_game'
        },
        battle: {
          title: 'Guerrilla Tactics',
          narrative: 'The Nomad strikes from unexpected angles, using terrain and mobility. Hit and run, fade and strike again. The enemy never knows where the next blow will fall.',
          strategicInsight: 'Mobility and map knowledge allow for superior positioning and tactical flexibility.',
          commanderVoice: 'They expect a battle. We give them a hunt.',
          tone: 'exploratory',
          narrativeTag: 'battle'
        }
      },
      tactician: {
        early_game: {
          title: 'Strategic Assessment',
          narrative: 'The Tactician analyzes every variable, every possibility. Each decision is weighed against multiple outcomes. Information is the greatest resource—know the enemy, know the terrain, know victory.',
          strategicInsight: 'Superior information and planning overcome raw aggression or resources.',
          commanderVoice: 'Victory is not about strength—it\'s about knowing exactly when and where to apply it.',
          tone: 'calculated',
          narrativeTag: 'early_game'
        },
        battle: {
          title: 'Perfect Execution',
          narrative: 'The Tactician orchestrates units with surgical precision. Every micro-move is calculated, every engagement optimized. The battle is won before the first shot—through superior positioning and timing.',
          strategicInsight: 'Micro-management and tactical precision can turn even unfavorable engagements into victories.',
          commanderVoice: 'Watch. Learn. Execute. This is how wars are won.',
          tone: 'calculated',
          narrativeTag: 'battle'
        }
      },
      harvester: {
        early_game: {
          title: 'Economic Dominance',
          narrative: 'The Harvester builds slowly, methodically. Resources flow like rivers, infrastructure multiplies. Time is an ally—the longer the game, the stronger the position. Patience yields wealth.',
          strategicInsight: 'Economic superiority provides overwhelming late-game advantages.',
          commanderVoice: 'Let them fight. We build. When they are exhausted, we will be unstoppable.',
          tone: 'patient',
          narrativeTag: 'early_game'
        },
        battle: {
          title: 'Resource War',
          narrative: 'The Harvester fights defensively, protecting the economy above all. Units are resources—spend them wisely. Victory comes not from battles won, but from resources preserved.',
          strategicInsight: 'Defensive play preserves resources for overwhelming late-game military superiority.',
          commanderVoice: 'Every unit lost is a resource wasted. We fight smart, not hard.',
          tone: 'patient',
          narrativeTag: 'battle'
        }
      },
      wildcard: {
        early_game: {
          title: 'Chaos Theory',
          narrative: 'The Wildcard experiments, innovates, breaks conventions. No strategy is sacred, no approach too risky. Innovation comes from embracing the unpredictable. The enemy cannot prepare for what they cannot predict.',
          strategicInsight: 'Unconventional strategies and high-risk plays can catch opponents completely off-guard.',
          commanderVoice: 'Predictability is death. Let\'s see what happens when we break all the rules.',
          tone: 'chaotic',
          narrativeTag: 'early_game'
        },
        battle: {
          title: 'Unpredictable Warfare',
          narrative: 'The Wildcard adapts instantly, changing tactics mid-engagement. What seems like chaos is calculated unpredictability. The enemy prepares for the last move, not the next one.',
          strategicInsight: 'Adaptability and innovation in real-time can overcome superior numbers or resources.',
          commanderVoice: 'They think they know our strategy. They\'re about to learn they know nothing.',
          tone: 'chaotic',
          narrativeTag: 'battle'
        }
      }
    };

    const commanderFallbacks = fallbacks[commander.id] || fallbacks.architect;
    return commanderFallbacks[input.situation] || commanderFallbacks.early_game;
  }

  private getFallbackTitle(input: CommanderNarrativeInput): string {
    return `${input.commanderName}'s ${input.situation}`;
  }

  private getFallbackNarrative(input: CommanderNarrativeInput, commander: Commander): string {
    return `${commander.name} approaches the ${input.situation} with characteristic strategy.`;
  }

  private getFallbackInsight(input: CommanderNarrativeInput, commander: Commander): string {
    return `${commander.name} uses their unique traits to gain advantage.`;
  }

  private getFallbackVoice(input: CommanderNarrativeInput, commander: Commander): string {
    return 'Victory requires strategy.';
  }

  /**
   * Convert commander narrative to NarrativeEvent format
   */
  convertToNarrativeEvent(narrative: CommanderNarrative, trigger: string): NarrativeEvent {
    return {
      event: narrative.title,
      trigger,
      flavor: narrative.narrative,
      effect: {},
      narrativeTag: narrative.narrativeTag
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.narrativeCache.clear();
  }
}

