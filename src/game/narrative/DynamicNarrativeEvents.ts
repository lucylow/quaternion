/**
 * Dynamic Narrative Events System
 * LLM-driven procedural narrative vignettes tied to gameplay state
 * Creates small, varied narrative moments that make players feel, care, and remember
 */

import { LLMIntegration } from '@/ai/integrations/LLMIntegration';

export interface DynamicNarrativeEvent {
  id: string;
  event: string;
  trigger: EventTrigger;
  flavor: string; // The narrative text (1-2 sentences)
  effect: GameplayEffect;
  timestamp: number;
  emotionalTone: 'hopeful' | 'melancholic' | 'tense' | 'triumphant' | 'somber';
  characterReactions?: CharacterReaction[]; // Which characters react and how
}

export interface EventTrigger {
  action?: string; // e.g., 'harvest_attempt', 'research_choice', 'terrain_capture'
  resourceChange?: {
    type: 'biomass' | 'ore' | 'energy' | 'data';
    threshold: 'depleted' | 'low' | 'abundant';
    delta: number;
  };
  techResearched?: string;
  terrainEvent?: string;
  playerChoice?: 'humane' | 'greedy' | 'pragmatic';
  gameTime?: number; // Trigger after X seconds
  condition?: (gameState: GameStateSnapshot) => boolean; // Custom condition
}

export interface GameplayEffect {
  type: 'buff' | 'debuff' | 'resource' | 'narrative' | 'character_relationship';
  duration?: number; // in seconds
  value?: number;
  description: string;
  mechanicalImpact?: string; // e.g., 'increased_aggression_in_wildlife_30s'
}

export interface CharacterReaction {
  characterId: 'LIAN_YAO' | 'DR_MARA_KEST' | 'PATCH';
  reactionText: string;
  emotionalChange: number; // -1 to 1
}

export interface GameStateSnapshot {
  resources: {
    biomass: number;
    ore: number;
    energy: number;
    data: number;
  };
  researchedTechs: string[];
  gameTime: number;
  playerChoices: string[];
  terrainEvents: string[];
  bioSeedState?: 'dormant' | 'stirring' | 'awakening' | 'angered';
  moralAlignment?: number; // -1 (greedy) to 1 (humane)
}

/**
 * Dynamic Narrative Event Generator
 * Uses LLM to generate contextual narrative events based on game state
 */
export class DynamicNarrativeEventGenerator {
  private llm: LLMIntegration;
  private eventHistory: DynamicNarrativeEvent[] = [];
  private readonly maxHistorySize = 50;

  constructor(llmConfig?: any) {
    this.llm = new LLMIntegration({
      provider: llmConfig?.provider || 'google',
      apiKey: llmConfig?.apiKey,
      temperature: 0.8, // Higher creativity for narrative
      maxTokens: 200
    });
  }

  /**
   * Generate a narrative event based on game state and trigger
   */
  async generateEvent(
    trigger: EventTrigger,
    gameState: GameStateSnapshot,
    context?: string
  ): Promise<DynamicNarrativeEvent | null> {
    try {
      const prompt = this.buildGenerationPrompt(trigger, gameState, context);
      const response = await this.llm.generate(prompt);

      // Parse LLM response (expecting JSON)
      const parsed = this.parseEventResponse(response);

      if (!parsed) {
        // Fallback to template-based generation
        return this.generateFallbackEvent(trigger, gameState);
      }

      const event: DynamicNarrativeEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        event: parsed.event || 'Untitled Event',
        trigger,
        flavor: parsed.flavor || this.generateFallbackFlavor(trigger, gameState),
        effect: parsed.effect || this.generateFallbackEffect(trigger),
        timestamp: Date.now(),
        emotionalTone: parsed.emotionalTone || this.inferEmotionalTone(trigger, gameState),
        characterReactions: parsed.characterReactions || []
      };

      this.eventHistory.push(event);
      if (this.eventHistory.length > this.maxHistorySize) {
        this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
      }

      return event;
    } catch (error) {
      console.error('Error generating narrative event:', error);
      return this.generateFallbackEvent(trigger, gameState);
    }
  }

  /**
   * Build prompt for LLM to generate narrative event
   */
  private buildGenerationPrompt(
    trigger: EventTrigger,
    gameState: GameStateSnapshot,
    context?: string
  ): string {
    const stateSummary = this.summarizeGameState(gameState);
    const triggerDescription = this.describeTrigger(trigger);

    return `You are a narrative event generator for a sci-fi RTS game called Quaternion. Players must balance resource gathering with protecting an emergent lifeform (Bio-Seed).

Game State:
${stateSummary}

Trigger:
${triggerDescription}

${context ? `Context: ${context}\n` : ''}

Generate a brief, evocative narrative event (1-2 sentences) that:
1. Creates emotional impact (make players feel something)
2. Reflects the consequence of player choices
3. Uses vivid, sensory language
4. Ties directly to the trigger and game state

Respond ONLY with valid JSON in this exact format:
{
  "event": "Short event name",
  "flavor": "1-2 sentence narrative text that makes players feel. Use specific details.",
  "effect": {
    "type": "buff|debuff|resource|narrative|character_relationship",
    "description": "What happens mechanically",
    "mechanicalImpact": "e.g., 'increased_aggression_in_wildlife_30s'",
    "duration": 30
  },
  "emotionalTone": "hopeful|melancholic|tense|triumphant|somber",
  "characterReactions": [
    {
      "characterId": "DR_MARA_KEST",
      "reactionText": "Optional character reaction (1 sentence)",
      "emotionalChange": 0.1
    }
  ]
}`;
  }

  /**
   * Parse LLM response into event structure
   */
  private parseEventResponse(response: string): any | null {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      return null;
    }
  }

  /**
   * Generate fallback event if LLM fails
   */
  private generateFallbackEvent(
    trigger: EventTrigger,
    gameState: GameStateSnapshot
  ): DynamicNarrativeEvent {
    return {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event: 'Bio-Seed Sigh',
      trigger,
      flavor: this.generateFallbackFlavor(trigger, gameState),
      effect: this.generateFallbackEffect(trigger),
      timestamp: Date.now(),
      emotionalTone: this.inferEmotionalTone(trigger, gameState)
    };
  }

  /**
   * Generate fallback flavor text
   */
  private generateFallbackFlavor(trigger: EventTrigger, gameState: GameStateSnapshot): string {
    if (trigger.action === 'harvest_attempt') {
      if (gameState.resources.biomass < 20) {
        return 'A low, wet sound rolls from below. Dr. Mara whispers, "It remembers the old world."';
      }
      return 'The Bio-Seed stirs beneath your harvest site. Something ancient is awakening.';
    }

    if (trigger.resourceChange?.threshold === 'depleted') {
      return 'The terrain grows quiet. Too quiet. Even the ambient life has withdrawn.';
    }

    if (trigger.playerChoice === 'humane') {
      return 'A pulse of warmth spreads through the ground. The Bio-Seed seems to acknowledge your choice.';
    }

    if (trigger.playerChoice === 'greedy') {
      return 'A chill passes through the earth. The cost of progress weighs heavier than expected.';
    }

    return 'Something shifts in the quantum field. The world responds to your choices.';
  }

  /**
   * Generate fallback gameplay effect
   */
  private generateFallbackEffect(trigger: EventTrigger): GameplayEffect {
    if (trigger.action === 'harvest_attempt') {
      return {
        type: 'debuff',
        description: 'Increased aggression in local wildlife',
        mechanicalImpact: 'increased_aggression_in_wildlife_30s',
        duration: 30
      };
    }

    if (trigger.playerChoice === 'humane') {
      return {
        type: 'buff',
        description: 'Bio-Seed provides subtle assistance',
        mechanicalImpact: 'resource_regen_bonus_60s',
        duration: 60
      };
    }

    return {
      type: 'narrative',
      description: 'Narrative consequence'
    };
  }

  /**
   * Infer emotional tone from trigger and state
   */
  private inferEmotionalTone(
    trigger: EventTrigger,
    gameState: GameStateSnapshot
  ): 'hopeful' | 'melancholic' | 'tense' | 'triumphant' | 'somber' {
    if (trigger.playerChoice === 'humane') {
      return gameState.resources.biomass > 50 ? 'hopeful' : 'melancholic';
    }

    if (trigger.playerChoice === 'greedy') {
      return 'somber';
    }

    if (trigger.action === 'harvest_attempt') {
      return 'tense';
    }

    if (gameState.bioSeedState === 'angered') {
      return 'tense';
    }

    return 'melancholic';
  }

  /**
   * Summarize game state for LLM
   */
  private summarizeGameState(gameState: GameStateSnapshot): string {
    const resources = Object.entries(gameState.resources)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    const techs = gameState.researchedTechs.length > 0
      ? gameState.researchedTechs.join(', ')
      : 'none';

    const alignment = gameState.moralAlignment !== undefined
      ? gameState.moralAlignment > 0.3 ? 'humane' : gameState.moralAlignment < -0.3 ? 'greedy' : 'pragmatic'
      : 'unknown';

    return `Resources: ${resources}
Researched Tech: ${techs}
Game Time: ${gameState.gameTime}s
Moral Alignment: ${alignment}
Bio-Seed State: ${gameState.bioSeedState || 'dormant'}
Recent Choices: ${gameState.playerChoices.slice(-3).join(', ') || 'none'}`;
  }

  /**
   * Describe trigger for LLM
   */
  private describeTrigger(trigger: EventTrigger): string {
    const parts: string[] = [];

    if (trigger.action) {
      parts.push(`Action: ${trigger.action}`);
    }

    if (trigger.resourceChange) {
      parts.push(`Resource Change: ${trigger.resourceChange.type} is ${trigger.resourceChange.threshold}`);
    }

    if (trigger.techResearched) {
      parts.push(`Tech Researched: ${trigger.techResearched}`);
    }

    if (trigger.playerChoice) {
      parts.push(`Player Choice: ${trigger.playerChoice}`);
    }

    if (trigger.terrainEvent) {
      parts.push(`Terrain Event: ${trigger.terrainEvent}`);
    }

    return parts.join('\n') || 'General game state change';
  }

  /**
   * Get recent event history
   */
  getRecentEvents(count: number = 10): DynamicNarrativeEvent[] {
    return this.eventHistory.slice(-count);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }
}

/**
 * Pre-defined event templates for quick generation
 */
export const NARRATIVE_EVENT_TEMPLATES: Partial<DynamicNarrativeEvent>[] = [
  {
    event: 'Bio-Seed Sigh',
    trigger: { action: 'harvest_attempt' },
    flavor: 'A low, wet sound rolls from below. Dr. Mara whispers, "It remembers the old world."',
    effect: {
      type: 'debuff',
      description: 'Increased aggression in local wildlife',
      mechanicalImpact: 'increased_aggression_in_wildlife_30s',
      duration: 30
    },
    emotionalTone: 'tense'
  },
  {
    event: 'Symbiotic Recognition',
    trigger: { playerChoice: 'humane', techResearched: 'bio_conserve' },
    flavor: 'The Bio-Seed pulses with warmth. Veins of light spread through the soil, connecting to your structures.',
    effect: {
      type: 'buff',
      description: 'Bio-Seed provides resource regeneration',
      mechanicalImpact: 'resource_regen_bonus_60s',
      duration: 60
    },
    emotionalTone: 'hopeful'
  },
  {
    event: 'Terrain Lament',
    trigger: { resourceChange: { type: 'biomass', threshold: 'depleted', delta: -50 } },
    flavor: 'The ground grows cold and lifeless. Where vibrant flora once thrived, only barren earth remains.',
    effect: {
      type: 'debuff',
      description: 'Reduced resource regeneration in area',
      mechanicalImpact: 'reduced_resource_regen_120s',
      duration: 120
    },
    emotionalTone: 'somber'
  }
];

