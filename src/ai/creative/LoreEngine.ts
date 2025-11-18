/**
 * Dynamic Lore & Event Narration System
 * AI-generated world-building and story events
 * Tracks moral memory across runs
 */

import { LLMIntegration } from '../integrations/LLMIntegration';

export interface LoreEntry {
  id: string;
  content: string;
  type: 'myth' | 'backstory' | 'log' | 'event' | 'reflection';
  timestamp: number;
  context?: string;
  moralAlignment?: 'positive' | 'neutral' | 'negative';
}

export interface MoralMemory {
  playerId: string;
  actions: Array<{
    action: string;
    moralAlignment: 'positive' | 'neutral' | 'negative';
    timestamp: number;
  }>;
  overallAlignment: 'positive' | 'neutral' | 'negative';
  trustLevel: number; // 0-1
}

export interface WorldChronicle {
  seed: number;
  mapType: string;
  lore: LoreEntry[];
  moralMemory: MoralMemory | null;
  generatedAt: number;
}

export class LoreEngine {
  private llm: LLMIntegration | null = null;
  private loreEntries: LoreEntry[] = [];
  private moralMemories: Map<string, MoralMemory> = new Map();
  private worldChronicles: Map<number, WorldChronicle> = new Map();

  constructor(llmConfig?: { provider: 'google' | 'saga' | 'openai'; apiKey?: string }) {
    if (llmConfig) {
      this.llm = new LLMIntegration({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        temperature: 0.9,
        maxTokens: 300
      });
    }
  }

  /**
   * Generate world chronicle for a map seed
   */
  async generateWorldChronicle(
    seed: number,
    mapType: string,
    mapDescription?: string
  ): Promise<WorldChronicle> {
    const cacheKey = seed;
    if (this.worldChronicles.has(cacheKey)) {
      return this.worldChronicles.get(cacheKey)!;
    }

    // Generate initial lore
    const lore: LoreEntry[] = [];

    // Generate myth/backstory
    const myth = await this.generateLoreEntry('myth', mapType, mapDescription);
    if (myth) lore.push(myth);

    // Generate environmental backstory
    const backstory = await this.generateLoreEntry('backstory', mapType, mapDescription);
    if (backstory) lore.push(backstory);

    // Generate scientific log
    const log = await this.generateLoreEntry('log', mapType, mapDescription);
    if (log) lore.push(log);

    const chronicle: WorldChronicle = {
      seed,
      mapType,
      lore,
      moralMemory: null,
      generatedAt: Date.now()
    };

    this.worldChronicles.set(cacheKey, chronicle);
    return chronicle;
  }

  /**
   * Generate a lore entry
   */
  private async generateLoreEntry(
    type: LoreEntry['type'],
    mapType: string,
    context?: string
  ): Promise<LoreEntry | null> {
    if (this.llm) {
      try {
        const prompt = this.buildLorePrompt(type, mapType, context);
        const response = await this.llm.generateText(prompt);
        
        return {
          id: `lore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: response.trim(),
          type,
          timestamp: Date.now(),
          context
        };
      } catch (error) {
        console.warn(`Lore generation failed for type ${type}`, error);
      }
    }

    // Fallback
    return this.getFallbackLore(type, mapType);
  }

  /**
   * Build lore generation prompt
   */
  private buildLorePrompt(
    type: LoreEntry['type'],
    mapType: string,
    context?: string
  ): string {
    const baseContext = context || `a ${mapType} battlefield`;

    switch (type) {
      case 'myth':
        return `Create a short mythical story (2-3 sentences) about ${baseContext} in a sci-fi RTS game. Make it mysterious and evocative.`;
      
      case 'backstory':
        return `Write a brief environmental backstory (2-3 sentences) explaining why ${baseContext} exists. Include scientific or historical context.`;
      
      case 'log':
        return `Generate a scientific log entry (2-3 sentences) about ${baseContext}. Write as if from a researcher studying the anomaly.`;
      
      case 'event':
        return `Describe a dynamic event happening at ${baseContext} (1-2 sentences). Make it feel immediate and impactful.`;
      
      case 'reflection':
        return `Create a reflective observation about ${baseContext} (1-2 sentences). Philosophical or introspective tone.`;
      
      default:
        return `Write a brief narrative about ${baseContext} (2-3 sentences).`;
    }
  }

  /**
   * Generate dynamic event narrative
   */
  async generateEventNarrative(
    eventContext: string,
    gameState?: any
  ): Promise<LoreEntry | null> {
    const entry = await this.generateLoreEntry('event', 'battlefield', eventContext);
    
    if (entry) {
      this.loreEntries.push(entry);
    }

    return entry;
  }

  /**
   * Record player action for moral memory
   */
  recordPlayerAction(
    playerId: string,
    action: string,
    moralAlignment: 'positive' | 'neutral' | 'negative'
  ): void {
    let memory = this.moralMemories.get(playerId);
    
    if (!memory) {
      memory = {
        playerId,
        actions: [],
        overallAlignment: 'neutral',
        trustLevel: 0.5
      };
      this.moralMemories.set(playerId, memory);
    }

    memory.actions.push({
      action,
      moralAlignment,
      timestamp: Date.now()
    });

    // Update overall alignment
    const recentActions = memory.actions.slice(-10);
    const positiveCount = recentActions.filter(a => a.moralAlignment === 'positive').length;
    const negativeCount = recentActions.filter(a => a.moralAlignment === 'negative').length;

    if (positiveCount > negativeCount) {
      memory.overallAlignment = 'positive';
      memory.trustLevel = Math.min(1, memory.trustLevel + 0.1);
    } else if (negativeCount > positiveCount) {
      memory.overallAlignment = 'negative';
      memory.trustLevel = Math.max(0, memory.trustLevel - 0.1);
    } else {
      memory.overallAlignment = 'neutral';
    }
  }

  /**
   * Generate reflection based on moral memory
   */
  async generateMoralReflection(playerId: string): Promise<LoreEntry | null> {
    const memory = this.moralMemories.get(playerId);
    if (!memory || memory.actions.length === 0) {
      return null;
    }

    if (this.llm) {
      try {
        const recentActions = memory.actions.slice(-5).map(a => a.action).join(', ');
        const prompt = `Based on these player actions: ${recentActions}
Overall moral alignment: ${memory.overallAlignment}
Trust level: ${(memory.trustLevel * 100).toFixed(0)}%

Generate a brief philosophical reflection (2-3 sentences) about the player's choices and their impact on the simulation.`;

        const response = await this.llm.generateText(prompt);
        
        return {
          id: `reflection_${Date.now()}`,
          content: response.trim(),
          type: 'reflection',
          timestamp: Date.now(),
          moralAlignment: memory.overallAlignment
        };
      } catch (error) {
        console.warn('Moral reflection generation failed', error);
      }
    }

    return null;
  }

  /**
   * Get fallback lore
   */
  private getFallbackLore(type: LoreEntry['type'], mapType: string): LoreEntry {
    const fallbacks: Record<LoreEntry['type'], string> = {
      myth: `Legends speak of ${mapType}, where ancient forces once clashed.`,
      backstory: `${mapType} was formed through cataclysmic events long ago.`,
      log: `Research log: ${mapType} shows anomalous readings. Further study required.`,
      event: `The terrain shifts, creating new tactical opportunities.`,
      reflection: `In ${mapType}, balance is tested, and choices echo through time.`
    };

    return {
      id: `lore_${Date.now()}`,
      content: fallbacks[type] || `A story about ${mapType}.`,
      type,
      timestamp: Date.now()
    };
  }

  /**
   * Get world chronicle
   */
  getWorldChronicle(seed: number): WorldChronicle | undefined {
    return this.worldChronicles.get(seed);
  }

  /**
   * Get moral memory for player
   */
  getMoralMemory(playerId: string): MoralMemory | undefined {
    return this.moralMemories.get(playerId);
  }

  /**
   * Get all lore entries
   */
  getAllLore(): LoreEntry[] {
    return [...this.loreEntries];
  }

  /**
   * Clear lore
   */
  clearLore(): void {
    this.loreEntries = [];
  }
}

