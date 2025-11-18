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
You are a master storyteller crafting a creation myth for a world that blends technology and nature.

World Characteristics:
- World Type: ${worldData?.worldType || 'fantasy'}
- Dominant Biomes: ${worldData?.dominantBiomes?.join(', ') || 'varied'}
- Magical Level: ${worldData?.magicLevel || 0.5}
- Technology Level: ${worldData?.techLevel || 0.5}

Write a creation myth (2-3 paragraphs) that is:
- Poetic and evocative, with rich imagery
- Ancient and mysterious in tone
- Emotionally resonant
- Thematically consistent with the world's blend of technology and nature

Structure:
1. How the world was born (use vivid, sensory language)
2. The origin of magic/technology (show their interconnectedness)
3. A foundational conflict or tension (create emotional weight)
4. The role of mortals (their purpose and burden)

Use metaphors, personification, and symbolic language. Make readers feel the weight of eons and the wonder of creation.
Avoid generic fantasy tropes—create something unique and memorable.

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
    const prompt = `Generate a historical event name for a ${worldData?.worldType || 'fantasy'} world that blends technology and nature.
    
Requirements:
- Dramatic and memorable (3-6 words)
- Evocative and poetic
- Reflects the event's significance
- Avoid generic names like "The Great War" or "The Fall"
- Use specific, vivid language

Event number ${index + 1} in the world's history.
Examples of good names: "The Rusting of the Green", "When Machines Learned to Dream", "The Archive's First Breath"`;

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
    const prompt = `Describe a major historical event (2-3 sentences) for a ${worldData?.worldType || 'fantasy'} world that blends technology and nature.
    
Requirements:
- Vivid, sensory language (what did people see, hear, feel?)
- Emotional impact (how did it affect those who lived through it?)
- Lasting consequences (what changed because of this event?)
- Show, don't tell (use imagery and metaphor)
- Make it feel significant and memorable

Event number ${index + 1} in the world's history.
Write as if you're a historian recounting a moment that shaped everything that came after.`;

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
    const prompt = `Generate a current conflict for a ${worldData?.worldType || 'fantasy'} world that blends technology and nature.

Requirements:
- Name: Dramatic, specific, memorable (3-6 words)
- Involved factions: 2-3 factions with clear motivations
- Description: 2-3 sentences that explain:
  * What the conflict is about (not just "they fight")
  * Why it matters (stakes and consequences)
  * The emotional/philosophical tension at its core
- Make it feel urgent and meaningful
- Avoid generic conflicts—create something with thematic depth

Return as JSON: {name: string, factions: string[], description: string}`;

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
    const prompt = `Generate a major faction for a ${worldData?.worldType || 'fantasy'} world that blends technology and nature.

Requirements:
- Name: Memorable, evocative (2-4 words that suggest their identity)
- Description: 2-3 sentences covering:
  * Their core philosophy or goal
  * Their relationship to technology and nature
  * What makes them distinct and interesting
  * Their role in the world's conflicts

Make them feel like real organizations with clear motivations, not generic groups.
Avoid clichés—create something unique.

Return as JSON: {name: string, description: string}`;

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
    const prompt = `Generate a world secret for a ${worldData?.worldType || 'fantasy'} world that blends technology and nature.

Requirements:
- Name: Mysterious, intriguing (3-6 words that hint at the secret)
- Description: 2-3 sentences that:
  * Hint at what the secret is without fully revealing it
  * Create intrigue and mystery
  * Suggest why it matters if discovered
  * Use evocative, atmospheric language

Make it feel like discovering this secret would change how players understand the world.
It should be significant, not trivial.

Return as JSON: {name: string, description: string}`;

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
    return `In the beginning, there was only void—a silence so profound it ached. From that void, the first light emerged, not as a single point, but as twin flames: one that dreamed of steel and circuits, one that dreamed of root and leaf. They danced together, and from their dance, the world was born.
    
Magic flowed through the land like rivers, and technology grew from the seeds of knowledge planted in the dark soil. They were never meant to be separate—the first machines hummed with the rhythm of living things, and the first forests learned to remember.
    
Mortals were given the gift of choice, and with that gift came both creation and conflict. For every choice to build, there was a choice to destroy. For every moment of harmony, a moment of discord. The world remembers all of it, and in the quiet spaces between heartbeats, you can still hear the echo of that first dance.`;
  }
}

