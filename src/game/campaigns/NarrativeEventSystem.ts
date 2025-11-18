/**
 * Narrative Event System
 * Integrates LLM for generating narrative events during campaigns
 */

import { LLMIntegration } from '../../ai/integrations/LLMIntegration';
import { NARRATIVE_MICRO_EVENT, EPILOGUE_GENERATOR, CHARACTER_DIALOGUE } from '../../ai/promptTemplates';
import type { CampaignState, NarrativeEvent } from './CampaignSystem';
import { CommanderNarrativeSystem, type CommanderNarrativeInput } from './CommanderNarrativeSystem';

export interface NarrativeEventInput {
  campaign: string;
  trigger: string;
  seed: number;
  bioSeedHealth?: number;
  playerResources?: number;
  playerReputation?: number;
  time?: number;
  choice?: string;
  narrativeTag?: string;
}

export class NarrativeEventSystem {
  private llm: LLMIntegration;
  private eventCache: Map<string, NarrativeEvent> = new Map();
  private commanderNarratives: CommanderNarrativeSystem | null = null;

  constructor(llmConfig?: any) {
    this.llm = new LLMIntegration({
      provider: llmConfig?.provider || 'google',
      apiKey: llmConfig?.apiKey,
      temperature: 0.7,
      maxTokens: 200
    });
    
    // Initialize commander narrative system if LLM is available
    if (llmConfig?.apiKey) {
      this.commanderNarratives = new CommanderNarrativeSystem(llmConfig);
    }
  }

  /**
   * Generate a narrative event from game state
   */
  async generateEvent(input: NarrativeEventInput): Promise<NarrativeEvent> {
    // Create cache key
    const cacheKey = this.createCacheKey(input);
    if (this.eventCache.has(cacheKey)) {
      return this.eventCache.get(cacheKey)!;
    }

    try {
      // Build prompt
      const prompt = NARRATIVE_MICRO_EVENT.buildPrompt({
        campaign: input.campaign,
        trigger: input.trigger,
        seed: input.seed,
        bioSeedHealth: input.bioSeedHealth,
        playerResources: input.playerResources,
        time: input.time,
        choice: input.choice
      });

      // Call LLM
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseJSONResponse<NarrativeEvent>(response);

      // Validate and store
      const event: NarrativeEvent = {
        event: parsed.event || input.trigger,
        trigger: input.trigger,
        flavor: parsed.flavor || '',
        effect: parsed.effect || {},
        narrativeTag: input.narrativeTag || parsed.narrativeTag
      };

      this.eventCache.set(cacheKey, event);
      return event;
    } catch (error) {
      console.warn('LLM event generation failed, using fallback', error);
      return this.getFallbackEvent(input);
    }
  }

  /**
   * Generate epilogue based on campaign choices
   */
  async generateEpilogue(
    campaignId: string,
    choices: Map<string, string>,
    finalState: CampaignState
  ): Promise<string> {
    try {
      const choiceArray = Array.from(choices.entries()).map(([id, option]) => ({
        choiceId: id,
        option
      }));

      const outcomes = {
        bioSeedHealth: finalState.bioSeedHealth,
        playerReputation: finalState.playerReputation,
        narrativeTags: Array.from(finalState.narrativeTags)
      };

      const prompt = EPILOGUE_GENERATOR.buildPrompt(choiceArray, outcomes);
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseJSONResponse<{ epilogue: string; tone: string }>(response);

      return parsed.epilogue || this.getFallbackEpilogue(finalState);
    } catch (error) {
      console.warn('LLM epilogue generation failed, using fallback', error);
      return this.getFallbackEpilogue(finalState);
    }
  }

  /**
   * Generate character dialogue
   */
  async generateDialogue(
    character: { name: string; personality: string },
    context: any
  ): Promise<string> {
    try {
      const prompt = CHARACTER_DIALOGUE.buildPrompt(character, context);
      const response = await this.llm.generateText(prompt);
      return this.cleanText(response);
    } catch (error) {
      console.warn('LLM dialogue generation failed, using fallback', error);
      return this.getFallbackDialogue(character, context);
    }
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
   * Clean text response
   */
  private cleanText(text: string): string {
    return text.trim().replace(/^["']|["']$/g, '').trim();
  }

  /**
   * Create cache key from input
   */
  private createCacheKey(input: NarrativeEventInput): string {
    return `${input.campaign}_${input.trigger}_${input.seed}_${input.choice || ''}`;
  }

  /**
   * Fallback event generator
   */
  private getFallbackEvent(input: NarrativeEventInput): NarrativeEvent {
    const fallbacks: Record<string, NarrativeEvent> = {
      'archive_breach': {
        event: 'Archive Breach',
        trigger: 'archive_breach',
        flavor: 'Ancient seals crack like old bones. The archive opens—not with a whisper, but with a sigh that has waited millennia to escape. Dust motes dance in the stale air, and something stirs in the depths.',
        effect: { resourceNode: 'archive_gate' },
        narrativeTag: 'discovery'
      },
      'bio_seed_found': {
        event: 'The Sleeping Seed',
        trigger: 'bio_seed_found',
        flavor: 'There, in the heart of the archive, it pulses—a slow, rhythmic thrum that seems to echo your own heartbeat. The Bio-Seed sleeps, but its dreams are vast. You can feel the weight of eons in its presence.',
        effect: { bioSeedHealth: 85 },
        narrativeTag: 'wonder'
      },
      'harvest_attempt': {
        event: 'Bio-Seed Stir',
        trigger: 'harvest_attempt',
        flavor: 'A low hum rises beneath your boots; the ground answers your greed. The Bio-Seed\'s pulse quickens—not in fear, but in recognition. It knows what you\'re about to do.',
        effect: { wildlifeAggression: 0.15, localYieldBoost: 0.30 },
        narrativeTag: 'unease'
      },
      'preserve_action': {
        event: 'Conserve Investment',
        trigger: 'preserve_action',
        flavor: 'You seal the excavation and bind the roots in light. The Bio-Seed\'s breathing slows, content. In the darkness, something ancient and patient settles back into its long slumber, grateful.',
        effect: { bioSeedHealthDelta: 12, longTermYieldMultiplier: 0.2 },
        narrativeTag: 'hope'
      },
      'harvest_confirmed': {
        event: 'Immediate Gain, Lingering Cost',
        trigger: 'harvest_confirmed',
        flavor: 'Ore pours into the crates—and something beneath grows quiet. The Bio-Seed\'s pulse weakens. The archive, once alive with possibility, now feels like a tomb. You got what you came for. The question is: was it worth the silence?',
        effect: { resourceGain: 60, bioSeedHealthDelta: -25 },
        narrativeTag: 'guilt'
      },
      'choice_consequence': {
        event: 'Consequences Unfold',
        trigger: 'choice_consequence',
        flavor: 'Time moves forward, and your choice ripples through the world. The archive remembers. The land remembers. And somewhere, in the quiet spaces between heartbeats, you remember too.',
        effect: {},
        narrativeTag: 'reflection'
      },
      'final_reckoning': {
        event: 'The Reckoning',
        trigger: 'final_reckoning',
        flavor: 'The moment of truth arrives not with fanfare, but with the weight of inevitability. Every choice you made has led here. The archive holds its breath, waiting to see what you\'ve become.',
        effect: {},
        narrativeTag: 'climax'
      },
      'epilogue': {
        event: 'Epilogue',
        trigger: 'epilogue',
        flavor: 'The story ends, but the world continues. Your choices echo in the silence, shaping what comes next. The archive will remember. The land will remember. And perhaps, in time, you will too.',
        effect: {},
        narrativeTag: 'resolution'
      }
    };

    return fallbacks[input.trigger] || {
      event: input.trigger,
      trigger: input.trigger,
      flavor: 'The moment passes, leaving only echoes. Something shifts in the world, subtle but permanent. You feel it in your bones: this mattered.',
      effect: {},
      narrativeTag: 'neutral'
    };
  }

  /**
   * Fallback epilogue generator
   */
  private getFallbackEpilogue(state: CampaignState): string {
    if (state.bioSeedHealth && state.bioSeedHealth < 30) {
      return 'The machines hummed with stolen life. We extracted what we needed, and the archive fell silent—a tomb we had emptied ourselves. Years later, when the last resource ran dry, we looked back and understood: we had traded tomorrow for today, and tomorrow never came.';
    } else if (state.bioSeedHealth && state.bioSeedHealth > 70) {
      return 'We sealed the chamber and walked away, leaving the Bio-Seed to its slow awakening. Generations passed. When our descendants returned, they found not an empty vault, but a garden—a living testament to the choice we made. The land had remembered our mercy, and it repaid us a thousandfold.';
    }
    return 'We took what we needed to survive, then sealed what remained. A compromise carved from necessity. The archive stands divided—one half hollowed, one half healing. The land remembers both our hunger and our restraint. Perhaps that balance is enough.';
  }

  /**
   * Fallback dialogue generator
   */
  private getFallbackDialogue(character: { name: string }, context: any): string {
    if (character.name === 'Dr. Mara Kest') {
      return 'Please — listen. It remembers more than we do.';
    } else if (character.name === 'Commander Lian') {
      return 'We move when I say we move.';
    }
    return 'Scanning... nothing helpful. Sending passive judgement.';
  }

  /**
   * Generate commander-specific narrative event
   */
  async generateCommanderNarrative(
    input: CommanderNarrativeInput
  ): Promise<NarrativeEvent> {
    if (!this.commanderNarratives) {
      // Fallback if commander narratives not initialized
      return this.generateEvent({
        campaign: 'commander',
        trigger: input.situation,
        seed: input.seed || 0,
        narrativeTag: `commander_${input.commanderId}`
      });
    }

    try {
      const narrative = await this.commanderNarratives.generateNarrative(input);
      return this.commanderNarratives.convertToNarrativeEvent(narrative, input.situation);
    } catch (error) {
      console.warn('Commander narrative generation failed, using fallback', error);
      return this.generateEvent({
        campaign: 'commander',
        trigger: input.situation,
        seed: input.seed || 0,
        narrativeTag: `commander_${input.commanderId}`
      });
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.eventCache.clear();
    if (this.commanderNarratives) {
      this.commanderNarratives.clearCache();
    }
  }
}


