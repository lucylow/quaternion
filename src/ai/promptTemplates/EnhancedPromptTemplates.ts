/**
 * Enhanced Prompt Templates with Memory Injection
 * Based on research: strong prompt scaffolding, structured output, memory integration
 */

export interface PromptContext {
  memoryContext?: string;
  conversationHistory?: string;
  personality?: {
    traits: string[];
    background?: string;
    speechStyle?: string;
  };
  gameState?: any;
  playerInfo?: {
    name?: string;
    reputation?: number;
    relationship?: number;
  };
}

export interface StructuredOutputSchema {
  narrative?: boolean;
  dialogue?: boolean;
  choices?: boolean;
  stateChanges?: boolean;
  metadata?: boolean;
}

/**
 * Enhanced NPC Dialogue Template
 * Includes memory, personality, and structured output
 */
export class EnhancedNPCDialogueTemplate {
  static buildPrompt(
    npcName: string,
    context: PromptContext,
    playerInput?: string
  ): string {
    const personalitySection = context.personality
      ? this.buildPersonalitySection(context.personality)
      : '';

    const memorySection = context.memoryContext
      ? `## Memory Context\n${context.memoryContext}\n`
      : '';

    const conversationSection = context.conversationHistory
      ? `## Previous Conversation\n${context.conversationHistory}\n`
      : '';

    const playerSection = context.playerInfo
      ? this.buildPlayerSection(context.playerInfo)
      : '';

    const inputSection = playerInput
      ? `## Player Input\n${playerInput}\n`
      : '';

    return `You are "${npcName}", an NPC in a sci-fi RTS game.

${personalitySection}
${playerSection}
${memorySection}
${conversationSection}
${inputSection}

Generate a response that:
- Matches your personality and speech style
- References past interactions if relevant (from memory)
- Responds appropriately to the player's input
- Feels natural and in-character
- Is concise (max 30 words)

Output only the dialogue text, no JSON or formatting.`;
  }

  private static buildPersonalitySection(personality: PromptContext['personality']): string {
    if (!personality) return '';

    const parts: string[] = [];
    parts.push(`## Personality`);
    
    if (personality.traits && personality.traits.length > 0) {
      parts.push(`Traits: ${personality.traits.join(', ')}`);
    }
    
    if (personality.background) {
      parts.push(`Background: ${personality.background}`);
    }
    
    if (personality.speechStyle) {
      parts.push(`Speech Style: ${personality.speechStyle}`);
    }

    return parts.join('\n') + '\n';
  }

  private static buildPlayerSection(playerInfo: PromptContext['playerInfo']): string {
    if (!playerInfo) return '';

    const parts: string[] = [];
    parts.push(`## Player Relationship`);
    
    if (playerInfo.name) {
      parts.push(`Player name: ${playerInfo.name}`);
    }
    
    if (playerInfo.reputation !== undefined) {
      const repDesc = playerInfo.reputation > 0.5 
        ? 'positive' 
        : playerInfo.reputation < -0.5 
        ? 'negative' 
        : 'neutral';
      parts.push(`Reputation: ${playerInfo.reputation.toFixed(2)} (${repDesc})`);
    }
    
    if (playerInfo.relationship !== undefined) {
      parts.push(`Relationship score: ${playerInfo.relationship.toFixed(2)}`);
    }

    return parts.join('\n') + '\n';
  }
}

/**
 * Enhanced Narrative Event Template
 * With structured output and memory awareness
 */
export class EnhancedNarrativeEventTemplate {
  static buildPrompt(
    eventType: string,
    context: PromptContext,
    schema: StructuredOutputSchema = {
      narrative: true,
      stateChanges: true
    }
  ): string {
    const memorySection = context.memoryContext
      ? `## Narrative Memory\n${context.memoryContext}\n`
      : '';

    const gameStateSection = context.gameState
      ? `## Current Game State\n${JSON.stringify(context.gameState, null, 2)}\n`
      : '';

    const outputFormat = this.buildOutputFormat(schema);

    return `You are a narrative event generator for a sci-fi RTS game.

${memorySection}
${gameStateSection}

Generate a narrative event of type: "${eventType}"

Requirements:
- Create a compelling event description (max 50 words)
- Ensure consistency with previous narrative events (from memory)
- Include appropriate game state changes if needed
- Keep tone somber/poetic, no graphic descriptions

${outputFormat}

OUTPUT:`;
  }

  private static buildOutputFormat(schema: StructuredOutputSchema): string {
    const formatParts: string[] = [];

    if (schema.narrative) {
      formatParts.push('- "narrative": "event description text"');
    }

    if (schema.dialogue) {
      formatParts.push('- "dialogue": "character dialogue if applicable"');
    }

    if (schema.choices) {
      formatParts.push('- "choices": ["option1", "option2", ...]');
    }

    if (schema.stateChanges) {
      formatParts.push('- "stateChanges": { "key": "value", ... }');
    }

    if (schema.metadata) {
      formatParts.push('- "metadata": { "tags": [...], "importance": 0.0-1.0 }');
    }

    return `Output format (JSON):\n{\n  ${formatParts.join(',\n  ')}\n}`;
  }
}

/**
 * Enhanced Commander Dialogue Template
 * For AI commander personalities
 */
export class EnhancedCommanderDialogueTemplate {
  static buildPrompt(
    commanderName: string,
    personality: any,
    gameState: any,
    context?: PromptContext
  ): string {
    const memorySection = context?.memoryContext
      ? `## Strategic Memory\n${context.memoryContext}\n`
      : '';

    const personalitySection = personality
      ? `Personality traits: ${JSON.stringify(personality.traits || {})}\n`
      : '';

    const gameStateSection = this.compressGameState(gameState);

    return `You are "${commanderName}", an AI commander in a sci-fi RTS game.

${personalitySection}
${memorySection}
## Current Situation
${gameStateSection}

Generate a brief strategic comment (max 15 words) that:
- Reflects your personality and strategic style
- Responds to the current game situation
- References past strategic decisions if relevant
- Feels natural and tactical

Output only the dialogue text.`;
  }

  private static compressGameState(gameState: any): string {
    const parts: string[] = [];

    if (gameState.resourceAdvantage !== undefined) {
      parts.push(`Resource advantage: ${gameState.resourceAdvantage.toFixed(2)}`);
    }

    if (gameState.militaryAdvantage !== undefined) {
      parts.push(`Military advantage: ${gameState.militaryAdvantage.toFixed(2)}`);
    }

    if (gameState.recentAction) {
      parts.push(`Recent action: ${gameState.recentAction}`);
    }

    return parts.join('\n') || 'Game state: Active';
  }
}

/**
 * Dynamic Story Generation Template
 * For evolving narratives based on player actions
 */
export class DynamicStoryTemplate {
  static buildPrompt(
    storyContext: {
      currentState: string;
      playerAction: string;
      previousEvents: string[];
    },
    memoryContext?: string
  ): string {
    const memorySection = memoryContext
      ? `## Story Memory\n${memoryContext}\n`
      : '';

    const previousEventsSection = storyContext.previousEvents.length > 0
      ? `## Previous Events\n${storyContext.previousEvents.slice(-5).join('\n')}\n`
      : '';

    return `You are a dynamic story generator for a sci-fi RTS game.

${memorySection}
${previousEventsSection}
## Current Story State
${storyContext.currentState}

## Player Action
${storyContext.playerAction}

Generate the next story segment that:
- Evolves naturally from the player's action
- Maintains consistency with previous events
- Creates new narrative opportunities
- Is concise (max 100 words)

Output format (JSON):
{
  "narrative": "story text",
  "choices": ["option1", "option2", "option3"],
  "stateChanges": { "key": "value" },
  "tags": ["tag1", "tag2"]
}

OUTPUT:`;
  }
}

/**
 * Memory-Aware Prompt Builder
 * Utility to inject memory into any prompt
 */
export class MemoryAwarePromptBuilder {
  static injectMemory(
    basePrompt: string,
    memoryContext?: string,
    conversationHistory?: string
  ): string {
    let enhanced = basePrompt;

    if (memoryContext) {
      enhanced = `## Memory Context\n${memoryContext}\n\n${enhanced}`;
    }

    if (conversationHistory) {
      enhanced = `## Conversation History\n${conversationHistory}\n\n${enhanced}`;
    }

    return enhanced;
  }

  static addStructuredOutputInstructions(
    prompt: string,
    schema: StructuredOutputSchema
  ): string {
    const format = EnhancedNarrativeEventTemplate['buildOutputFormat'](schema);
    return `${prompt}\n\n${format}`;
  }

  static addPersonalityInstructions(
    prompt: string,
    personality: PromptContext['personality']
  ): string {
    if (!personality) return prompt;

    const personalityText = EnhancedNPCDialogueTemplate['buildPersonalitySection'](personality);
    return `${personalityText}\n${prompt}`;
  }
}

