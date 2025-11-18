/**
 * AI Quest Generator
 * Generates personalized, dynamic quests based on player profile and world state
 */

import { LLMIntegration } from '@/ai/integrations/LLMIntegration';
import { MemoryManager } from '@/ai/memory/MemoryManager';
import type { WorldModel, PlayerProfile } from './AINarrativeDirector';
import type { AICharacter } from './CharacterAI';

export interface Quest {
  id: string;
  title: string;
  giver: string; // character ID
  hook: string;
  objectives: QuestObjective[];
  choicePoints: QuestChoicePoint[];
  reward: QuestReward;
  emotionalArc: 'sad' | 'hopeful' | 'tense' | 'triumphant' | 'melancholic';
  estimatedDuration: number; // minutes
  estimatedDifficulty: number; // 0-1
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'fetch' | 'combat' | 'puzzle' | 'social' | 'explore';
  location: string;
  estimatedTime: number; // minutes
  completed: boolean;
}

export interface QuestChoicePoint {
  id: string;
  situation: string;
  options: QuestChoiceOption[];
}

export interface QuestChoiceOption {
  text: string;
  moralAlignment: 'good' | 'evil' | 'neutral';
  consequences: string[];
}

export interface QuestReward {
  experience: number;
  items: string[];
  reputation: Record<string, number>; // faction -> reputation change
  unlocks: string[];
}

export interface QuestVariant {
  id: string;
  baseQuestId: string;
  variations: {
    giver?: string;
    locations?: string[];
    moralDilemmas?: string;
    rewards?: Partial<QuestReward>;
  };
}

export class AIQuestGenerator {
  private questVariants: Map<string, QuestVariant[]> = new Map();

  constructor(
    private llm: LLMIntegration,
    private memory: MemoryManager
  ) {}

  /**
   * Generate a personalized quest
   */
  async generatePersonalizedQuest(
    player: PlayerProfile,
    world: WorldModel,
    availableCharacters: AICharacter[]
  ): Promise<Quest> {
    const context = this.buildQuestGenerationContext(player, world, availableCharacters);

    const prompt = `Generate a personalized quest for this player:

${context}

Create a quest that:
1. Matches player's archetype: ${player.dominantArchetype}
2. Uses their preferred playstyle: ${player.preferredPlaystyle}
3. Connects to their recent actions: ${player.recentActions.slice(-3).join(', ')}
4. Offers meaningful moral choices
5. Lasts 20-40 minutes

Quest Structure:
- Hook: Engaging reason to care
- 3-5 objectives with variety
- At least one major choice point
- Emotional payoff
- Connection to larger world

Respond in JSON:
{
  "title": "Quest Title",
  "giver": "character_name",
  "hook": "Why player should care",
  "objectives": [
    {
      "description": "Objective text",
      "type": "fetch/combat/puzzle/social",
      "location": "location_name",
      "estimatedTime": 5
    }
  ],
  "choicePoints": [
    {
      "situation": "Choice context",
      "options": [
        {
          "text": "Option text",
          "moralAlignment": "good/evil/neutral",
          "consequences": ["consequence1"]
        }
      ]
    }
  ],
  "reward": {
    "experience": 100,
    "items": ["item1"],
    "reputation": {"faction": 10},
    "unlocks": ["ability1"]
  },
  "emotionalArc": "sad/hopeful/tense"
}`;

    try {
      const response = await this.llm.generateText(prompt);
      const quest = this.parseQuestFromJSON(response);
      quest.id = `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      quest.estimatedDuration = quest.objectives.reduce((sum, obj) => sum + obj.estimatedTime, 0);
      
      // Initialize objectives
      quest.objectives.forEach((obj, idx) => {
        obj.id = `obj_${quest.id}_${idx}`;
        obj.completed = false;
      });

      // Initialize choice points
      quest.choicePoints.forEach((cp, idx) => {
        cp.id = `choice_${quest.id}_${idx}`;
      });

      return quest;
    } catch (error) {
      console.error('Quest generation failed:', error);
      return this.getFallbackQuest(player, world, availableCharacters);
    }
  }

  /**
   * Generate quest variants
   */
  async generateQuestVariants(
    baseQuest: Quest,
    variantCount: number = 3
  ): Promise<QuestVariant[]> {
    const variants: QuestVariant[] = [];

    for (let i = 0; i < variantCount; i++) {
      const prompt = `Create a variant of this quest with different elements:

BASE QUEST:
${JSON.stringify(baseQuest, null, 2)}

Create variant #${i + 1} that changes:
- Different quest giver with new motivations
- Different locations but similar gameplay
- Different moral dilemmas but same emotional weight
- Different rewards but equivalent value

Keep the same core structure and estimated completion time.

Respond with JSON containing only the variations:
{
  "giver": "different_character",
  "locations": ["new_location1", "new_location2"],
  "moralDilemmas": "different moral situation",
  "rewards": {
    "items": ["different_item1"],
    "unlocks": ["different_ability1"]
  }
}`;

      try {
        const response = await this.llm.generateText(prompt);
        const variations = this.parseJSONResponse<QuestVariant['variations']>(response);
        
        variants.push({
          id: `variant_${baseQuest.id}_${i}`,
          baseQuestId: baseQuest.id,
          variations
        });
      } catch (error) {
        console.error(`Failed to generate variant ${i}:`, error);
      }
    }

    this.questVariants.set(baseQuest.id, variants);
    return variants;
  }

  /**
   * Adjust quest difficulty for player skill
   */
  async adjustQuestDifficulty(
    quest: Quest,
    player: PlayerProfile
  ): Promise<Quest> {
    const playerSkill = this.calculatePlayerSkill(player);
    const questDifficulty = quest.estimatedDifficulty;

    if (Math.abs(playerSkill - questDifficulty) > 0.3) {
      const prompt = `Adjust this quest difficulty for player skill level:

PLAYER SKILL: ${playerSkill.toFixed(2)}/1.0
CURRENT QUEST DIFFICULTY: ${questDifficulty.toFixed(2)}/1.0

QUEST:
${JSON.stringify(quest, null, 2)}

Adjust objectives to better match player skill while keeping:
- Core narrative intact
- Emotional impact
- Estimated completion time

Make it ${playerSkill < questDifficulty ? 'easier' : 'more challenging'}.

Respond with adjusted quest JSON.`;

      try {
        const response = await this.llm.generateText(prompt);
        const adjusted = this.parseQuestFromJSON(response);
        
        // Preserve ID and structure
        adjusted.id = quest.id;
        adjusted.objectives.forEach((obj, idx) => {
          obj.id = quest.objectives[idx]?.id || `obj_${quest.id}_${idx}`;
          obj.completed = quest.objectives[idx]?.completed || false;
        });
        
        return adjusted;
      } catch (error) {
        console.error('Difficulty adjustment failed:', error);
        return quest;
      }
    }

    return quest;
  }

  private buildQuestGenerationContext(
    player: PlayerProfile,
    world: WorldModel,
    availableCharacters: AICharacter[]
  ): string {
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
- Active Goals: ${player.activeGoals.join(', ')}

AVAILABLE CHARACTERS:
${availableCharacters.map(char => `- ${char.characterId}: ${char.personality.getDescription()}`).join('\n')}
`;
  }

  private calculatePlayerSkill(player: PlayerProfile): number {
    // Simple skill calculation based on player profile
    // Could be expanded with actual game statistics
    let skill = 0.5;

    // Archetype-based skill adjustment
    if (player.dominantArchetype === 'veteran') skill += 0.2;
    if (player.dominantArchetype === 'beginner') skill -= 0.2;

    // Recent choices suggest learning
    if (player.recentChoices.length > 10) skill += 0.1;

    return Math.max(0, Math.min(1, skill));
  }

  private parseQuestFromJSON(text: string): Quest {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Ensure required fields have defaults
        return {
          id: '',
          title: parsed.title || 'Quest',
          giver: parsed.giver || 'Unknown',
          hook: parsed.hook || 'A quest awaits.',
          objectives: parsed.objectives || [],
          choicePoints: parsed.choicePoints || [],
          reward: parsed.reward || {
            experience: 0,
            items: [],
            reputation: {},
            unlocks: []
          },
          emotionalArc: parsed.emotionalArc || 'tense',
          estimatedDuration: 0,
          estimatedDifficulty: parsed.estimatedDifficulty || 0.5
        };
      }
    } catch (error) {
      console.error('Failed to parse quest JSON:', error);
    }
    throw new Error('No valid quest JSON found in response');
  }

  private parseJSONResponse<T>(text: string): T {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
    } catch (error) {
      console.error('Failed to parse JSON:', error);
    }
    throw new Error('No valid JSON found in response');
  }

  private getFallbackQuest(
    player: PlayerProfile,
    world: WorldModel,
    availableCharacters: AICharacter[]
  ): Quest {
    const giver = availableCharacters[0]?.characterId || 'Unknown';
    
    return {
      id: `fallback_quest_${Date.now()}`,
      title: 'A New Opportunity',
      giver,
      hook: 'A situation requires your attention.',
      objectives: [
        {
          id: 'obj_1',
          description: 'Investigate the situation',
          type: 'explore',
          location: 'Current Location',
          estimatedTime: 10,
          completed: false
        },
        {
          id: 'obj_2',
          description: 'Complete the task',
          type: 'puzzle',
          location: 'Task Location',
          estimatedTime: 15,
          completed: false
        }
      ],
      choicePoints: [],
      reward: {
        experience: 50,
        items: [],
        reputation: {},
        unlocks: []
      },
      emotionalArc: 'tense',
      estimatedDuration: 25,
      estimatedDifficulty: 0.5
    };
  }

  /**
   * Get quest variants for a quest
   */
  getQuestVariants(questId: string): QuestVariant[] {
    return this.questVariants.get(questId) || [];
  }
}


