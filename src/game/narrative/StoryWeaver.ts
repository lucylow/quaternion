/**
 * Story Weaver - Dynamic Story Generation System
 * Uses LLM to generate emergent storylines, plot twists, and narrative content
 */

import { LLMIntegration } from '@/ai/integrations/LLMIntegration';
import { MemoryManager } from '@/ai/memory/MemoryManager';
import type { WorldModel, PlayerProfile, ActiveStoryline, PlotTwist } from './AINarrativeDirector';

export interface Storyline {
  id: string;
  title: string;
  hook: string;
  characters: string[];
  locations: string[];
  conflict: string;
  choices: StorylineChoice[];
  resolution: string;
  emotionalArc: 'sad' | 'hopeful' | 'tense' | 'triumphant' | 'melancholic';
}

export interface StorylineChoice {
  description: string;
  moralAlignment: 'good' | 'evil' | 'neutral';
  consequences: string[];
}

export class StoryWeaver {
  constructor(
    private llm: LLMIntegration,
    private memory: MemoryManager
  ) {}

  /**
   * Generate an emergent storyline based on world and player context
   */
  async generateEmergentStoryline(
    world: WorldModel,
    player: PlayerProfile
  ): Promise<Storyline> {
    const context = this.buildStoryGenerationContext(world, player);
    
    const prompt = `Generate an emergent storyline for a player in this world context:

${context}

Create a compelling mini-arc that:
1. Connects to player's recent actions
2. Uses existing world elements
3. Offers meaningful choices
4. Has emotional resonance
5. Lasts 15-30 minutes gameplay

Respond in JSON format:
{
  "title": "Storyline title",
  "hook": "Engaging opening",
  "characters": ["character1", "character2"],
  "locations": ["location1", "location2"],
  "conflict": "Central conflict description",
  "choices": [
    {
      "description": "Choice text",
      "moralAlignment": "good/evil/neutral",
      "consequences": ["consequence1", "consequence2"]
    }
  ],
  "resolution": "How it can be resolved",
  "emotionalArc": "sad/hopeful/tense"
}`;

    try {
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseJSONResponse<Storyline>(response);
      
      // Generate unique ID
      parsed.id = `storyline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return parsed;
    } catch (error) {
      console.error('Story generation failed, using fallback:', error);
      return this.getFallbackStoryline(world, player);
    }
  }

  /**
   * Generate a plot twist for an existing storyline
   */
  async generatePlotTwist(
    storyline: ActiveStoryline,
    world: WorldModel
  ): Promise<PlotTwist> {
    const prompt = `Generate a plot twist for this storyline:

Title: ${storyline.title}
Current State: ${storyline.state}
Involved Characters: ${storyline.involvedCharacters.join(', ')}

Create a twist that:
1. Is surprising but believable
2. Changes player perspective
3. Creates new dramatic opportunities
4. Connects to established lore

Twist ideas:
- Betrayal by trusted character
- Hidden identity revelation
- Unexpected alliance
- Moral dilemma
- Secret connection to larger conflict

Respond with JSON:
{
  "type": "twist_type",
  "description": "Twist description",
  "triggeringCharacter": "character_name",
  "emotionalImpact": "shock/sadness/anger",
  "newRevelations": ["revelation1", "revelation2"],
  "followupOpportunities": ["opportunity1", "opportunity2"]
}`;

    try {
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseJSONResponse<PlotTwist>(response);
      parsed.id = `twist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return parsed;
    } catch (error) {
      console.error('Plot twist generation failed:', error);
      return this.getFallbackPlotTwist(storyline);
    }
  }

  private buildStoryGenerationContext(world: WorldModel, player: PlayerProfile): string {
    return `
WORLD STATE:
- Current Era: ${world.currentEra}
- Major Factions: ${world.activeFactions.join(', ')}
- Recent Events: ${world.recentEvents.slice(-3).map(e => e.description).join(', ')}
- World Tension: ${world.globalTension}/100

PLAYER PROFILE:
- Archetype: ${player.dominantArchetype}
- Playstyle: ${player.preferredPlaystyle}
- Moral Alignment: ${player.moralAlignment}
- Recent Choices: ${player.recentChoices.slice(-5).join(', ')}
- Emotional State: ${player.currentEmotion.type}

ACTIVE CHARACTERS:
${this.buildCharactersContext(world.activeCharacters)}

UNRESOLVED PLOT THREADS:
${this.buildPlotThreadsContext(world.activeStorylines)}
`;
  }

  private buildCharactersContext(characters: string[]): string {
    if (characters.length === 0) return '- No active characters';
    return characters.map(char => `- ${char}`).join('\n');
  }

  private buildPlotThreadsContext(storylines: ActiveStoryline[]): string {
    if (storylines.length === 0) return '- No unresolved threads';
    return storylines
      .filter(s => s.state === 'active')
      .map(s => `- ${s.title}: ${s.conflict}`)
      .join('\n');
  }

  private parseJSONResponse<T>(text: string): T {
    // Try to extract JSON from response
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

  private getFallbackStoryline(world: WorldModel, player: PlayerProfile): Storyline {
    return {
      id: `fallback_${Date.now()}`,
      title: 'Emergent Opportunity',
      hook: 'A new situation arises that requires your attention.',
      characters: world.activeCharacters.slice(0, 2),
      locations: ['Current Location'],
      conflict: 'A conflict emerges from recent events.',
      choices: [
        {
          description: 'Take action',
          moralAlignment: 'neutral',
          consequences: ['Moves story forward']
        }
      ],
      resolution: 'The situation will resolve based on your choices.',
      emotionalArc: 'tense'
    };
  }

  private getFallbackPlotTwist(storyline: ActiveStoryline): PlotTwist {
    return {
      id: `fallback_twist_${Date.now()}`,
      type: 'revelation',
      description: 'A new revelation changes the situation.',
      triggeringCharacter: storyline.involvedCharacters[0] || 'Unknown',
      emotionalImpact: 'surprise',
      newRevelations: ['Hidden information revealed'],
      followupOpportunities: ['New story paths open']
    };
  }
}

