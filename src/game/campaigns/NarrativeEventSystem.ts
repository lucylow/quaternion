/**
 * Narrative Event System
 * Integrates LLM for generating narrative events during campaigns
 */

import { LLMIntegration } from '../../ai/integrations/LLMIntegration';
import { NARRATIVE_MICRO_EVENT, EPILOGUE_GENERATOR, CHARACTER_DIALOGUE } from '../../ai/promptTemplates';
import type { CampaignState, NarrativeEvent } from './CampaignSystem';

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

  constructor(llmConfig?: any) {
    this.llm = new LLMIntegration({
      provider: llmConfig?.provider || 'google',
      apiKey: llmConfig?.apiKey,
      temperature: 0.7,
      maxTokens: 200
    });
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
      'harvest_attempt': {
        event: 'Bio-Seed Stir',
        trigger: 'harvest_attempt',
        flavor: 'A low hum rises beneath your boots; the ground answers your greed.',
        effect: { wildlifeAggression: 0.15, localYieldBoost: 0.30 },
        narrativeTag: 'unease'
      },
      'preserve_action': {
        event: 'Conserve Investment',
        trigger: 'preserve_action',
        flavor: 'You seal the excavation and bind the roots in light.',
        effect: { bioSeedHealthDelta: 12, longTermYieldMultiplier: 0.2 },
        narrativeTag: 'hope'
      },
      'harvest_confirmed': {
        event: 'Immediate Gain, Lingering Cost',
        trigger: 'harvest_confirmed',
        flavor: 'Ore pours into the crates — and something beneath grows quiet.',
        effect: { resourceGain: 60, bioSeedHealthDelta: -25 },
        narrativeTag: 'guilt'
      }
    };

    return fallbacks[input.trigger] || {
      event: input.trigger,
      trigger: input.trigger,
      flavor: 'The moment passes, leaving only echoes.',
      effect: {},
      narrativeTag: 'neutral'
    };
  }

  /**
   * Fallback epilogue generator
   */
  private getFallbackEpilogue(state: CampaignState): string {
    if (state.bioSeedHealth && state.bioSeedHealth < 30) {
      return 'Cities rose like glass, humming with stolen nights. We had power enough to forget the river\'s taste.';
    } else if (state.bioSeedHealth && state.bioSeedHealth > 70) {
      return 'Green light stitched the ruins back together. The land taught us patience; the people learned to wait.';
    }
    return 'We burned bright to survive, then learned to plant again. Steel met sap; scars healed into scaffolds.';
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
   * Clear cache
   */
  clearCache(): void {
    this.eventCache.clear();
  }
}


