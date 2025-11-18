/**
 * Lore Generator - Dynamic Lore Generation System
 * Generates creation myths, historical events, and world secrets
 */

import { LLMIntegration } from '../../ai/integrations/LLMIntegration';
import type { WorldLore, HistoricalEvent, WorldImpact, Conflict, Faction, WorldSecret } from './NarrativeManager';

export interface WorldData {
  worldType?: string;
  dominantBiomes?: string[];
  magicLevel?: number;
  techLevel?: number;
  currentEra?: string;
}

export class LoreGenerator {
  constructor(private llm: LLMIntegration) {}

  /**
   * Generate complete world lore
   */
  async generateWorldLore(seed: number, worldData?: WorldData): Promise<WorldLore> {
    const creationMyth = await this.generateCreationMyth(seed, worldData);
    const historicalEvents = await this.generateHistory(seed, 5, worldData);
    const currentConflicts = await this.generateCurrentConflicts(worldData);
    const majorFactions = await this.generateFactionRelationships(worldData);
    const worldSecrets = await this.generateWorldSecrets(3, worldData);

    return {
      creationMyth,
      historicalEvents,
      currentConflicts,
      majorFactions,
      worldSecrets
    };
  }

  /**
   * Generate creation myth for the world
   */
  async generateCreationMyth(seed: number, worldData?: WorldData): Promise<string> {
    const prompt = `
Generate a creation myth for a fantasy world with these characteristics:
- World Type: ${worldData?.worldType || 'fantasy'}
- Dominant Biomes: ${worldData?.dominantBiomes?.join(', ') || 'varied'}
- Magical Level: ${worldData?.magicLevel || 0.5}
- Technology Level: ${worldData?.techLevel || 0.5}

The myth should be 2-3 paragraphs, poetic but coherent.
Include:
1. How the world was born
2. The origin of magic/technology
3. A foundational conflict
4. The role of mortals

Make it feel ancient and mysterious.
Seed: ${seed}
`;

    try {
      const response = await this.llm.generateText(prompt);
      return this.cleanText(response);
    } catch (error) {
      console.warn('Creation myth generation failed, using fallback', error);
      return this.getFallbackCreationMyth(worldData);
    }
  }

  /**
   * Generate historical events
   */
  async generateHistory(seed: number, eventCount: number, worldData?: WorldData): Promise<HistoricalEvent[]> {
    const history: HistoricalEvent[] = [];
    
    // Use seed for deterministic randomness
    const random = this.seededRandom(seed);

    for (let i = 0; i < eventCount; i++) {
      const year = this.calculateHistoricalYear(i, eventCount, worldData);
      const eventName = await this.generateEventName(i, worldData);
      const description = await this.generateEventDescription(i, worldData);
      const involvedFactions = this.getRandomFactions(2, random);
      const impact = await this.generateWorldImpact(i, worldData);
      const evidence = this.generateEvidenceLocations(2, random);

      const historicalEvent: HistoricalEvent = {
        name: eventName,
        year,
        description,
        involvedFactions,
        impactOnWorld: impact,
        archaeologicalEvidence: evidence,
        causedBy: [],
        leadsTo: []
      };

      history.push(historicalEvent);
    }

    // Sort by year and create causal relationships
    history.sort((a, b) => a.year - b.year);
    this.createHistoricalConnections(history);

    return history;
  }

  /**
   * Generate current conflicts
   */
  async generateCurrentConflicts(worldData?: WorldData): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Generate 2-3 current conflicts
    const conflictCount = 2 + Math.floor(Math.random() * 2);

    for (let i = 0; i < conflictCount; i++) {
      const conflict = await this.generateConflict(i, worldData);
      conflicts.push(conflict);
    }

    return conflicts;
  }

  /**
   * Generate faction relationships
   */
  async generateFactionRelationships(worldData?: WorldData): Promise<Faction[]> {
    const factions: Faction[] = [];

    // Generate 3-5 major factions
    const factionCount = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < factionCount; i++) {
      const faction = await this.generateFaction(i, worldData);
      factions.push(faction);
    }

    return factions;
  }

  /**
   * Generate world secrets
   */
  async generateWorldSecrets(count: number, worldData?: WorldData): Promise<WorldSecret[]> {
    const secrets: WorldSecret[] = [];

    for (let i = 0; i < count; i++) {
      const secret = await this.generateSecret(i, worldData);
      secrets.push(secret);
    }

    return secrets;
  }

  /**
   * Generate event name
   */
  private async generateEventName(index: number, worldData?: WorldData): Promise<string> {
    const prompt = `Generate a historical event name for a ${worldData?.worldType || 'fantasy'} world. 
    Make it dramatic and memorable. Event number ${index + 1}.`;

    try {
      const response = await this.llm.generateText(prompt);
      return this.cleanText(response).substring(0, 50);
    } catch (error) {
      return `The Great Event ${index + 1}`;
    }
  }

  /**
   * Generate event description
   */
  private async generateEventDescription(index: number, worldData?: WorldData): Promise<string> {
    const prompt = `Describe a major historical event in 2-3 sentences for a ${worldData?.worldType || 'fantasy'} world. 
    Event number ${index + 1}. Make it impactful and memorable.`;

    try {
      const response = await this.llm.generateText(prompt);
      return this.cleanText(response);
    } catch (error) {
      return `A significant event occurred that shaped the world.`;
    }
  }

  /**
   * Generate world impact
   */
  private async generateWorldImpact(index: number, worldData?: WorldData): Promise<WorldImpact> {
    const significance = 0.3 + Math.random() * 0.5; // 0.3 to 0.8

    return {
      significance,
      description: `This event had a ${significance > 0.6 ? 'major' : 'significant'} impact on the world.`,
      unlockedAbility: significance > 0.7 ? `Event_${index}_Ability` : undefined
    };
  }

  /**
   * Generate evidence locations
   */
  private generateEvidenceLocations(count: number, random: () => number): Array<{ x: number; y: number }> {
    const locations: Array<{ x: number; y: number }> = [];
    
    for (let i = 0; i < count; i++) {
      locations.push({
        x: Math.floor(random() * 1000),
        y: Math.floor(random() * 1000)
      });
    }

    return locations;
  }

  /**
   * Get random factions (placeholder - would use actual faction list)
   */
  private getRandomFactions(count: number, random: () => number): string[] {
    const factions = ['Faction_A', 'Faction_B', 'Faction_C', 'Faction_D'];
    const selected: string[] = [];
    
    while (selected.length < count && selected.length < factions.length) {
      const faction = factions[Math.floor(random() * factions.length)];
      if (!selected.includes(faction)) {
        selected.push(faction);
      }
    }

    return selected;
  }

  /**
   * Create historical connections between events
   */
  private createHistoricalConnections(history: HistoricalEvent[]): void {
    for (let i = 1; i < history.length; i++) {
      history[i].causedBy = [history[i - 1].name];
      history[i - 1].leadsTo = [history[i].name];
    }
  }

  /**
   * Calculate historical year
   */
  private calculateHistoricalYear(index: number, total: number, worldData?: WorldData): number {
    const baseYear = worldData?.currentEra ? 1000 : 0;
    const yearsPerEvent = 500;
    return baseYear + (index * yearsPerEvent);
  }

  /**
   * Generate conflict
   */
  private async generateConflict(index: number, worldData?: WorldData): Promise<Conflict> {
    const prompt = `Generate a current conflict for a ${worldData?.worldType || 'fantasy'} world. 
    Include name, involved factions, and description.`;

    try {
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseJSONResponse<Conflict>(response);
      parsed.id = `conflict_${index}`;
      parsed.tension = 0.3 + Math.random() * 0.4;
      return parsed;
    } catch (error) {
      return {
        id: `conflict_${index}`,
        name: `The ${index === 0 ? 'Great' : 'Second'} Conflict`,
        factions: ['Faction_A', 'Faction_B'],
        description: 'A major conflict between factions.',
        tension: 0.5
      };
    }
  }

  /**
   * Generate faction
   */
  private async generateFaction(index: number, worldData?: WorldData): Promise<Faction> {
    const prompt = `Generate a major faction for a ${worldData?.worldType || 'fantasy'} world. 
    Include name and description.`;

    try {
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseJSONResponse<{ name: string; description: string }>(response);
      return {
        id: `faction_${index}`,
        name: parsed.name || `Faction ${index + 1}`,
        description: parsed.description || 'A major faction in the world.',
        relationships: new Map(),
        members: []
      };
    } catch (error) {
      return {
        id: `faction_${index}`,
        name: `Faction ${index + 1}`,
        description: 'A major faction in the world.',
        relationships: new Map(),
        members: []
      };
    }
  }

  /**
   * Generate secret
   */
  private async generateSecret(index: number, worldData?: WorldData): Promise<WorldSecret> {
    const prompt = `Generate a world secret for a ${worldData?.worldType || 'fantasy'} world. 
    Something mysterious and significant that players can discover.`;

    try {
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseJSONResponse<{ name: string; description: string }>(response);
      return {
        id: `secret_${index}`,
        name: parsed.name || `Secret ${index + 1}`,
        description: parsed.description || 'A mysterious secret.',
        revealed: false,
        discoveryConditions: [`condition_${index}_1`, `condition_${index}_2`]
      };
    } catch (error) {
      return {
        id: `secret_${index}`,
        name: `Secret ${index + 1}`,
        description: 'A mysterious secret waiting to be discovered.',
        revealed: false,
        discoveryConditions: [`condition_${index}_1`]
      };
    }
  }

  /**
   * Seeded random number generator
   */
  private seededRandom(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
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
   * Fallback creation myth
   */
  private getFallbackCreationMyth(worldData?: WorldData): string {
    return `In the beginning, there was only void. From the void emerged the first light, 
    and from that light, the world was born. Magic flowed through the land like rivers, 
    and technology grew from the seeds of knowledge. Mortals were given the gift of choice, 
    and with that gift came both creation and conflict.`;
  }
}

