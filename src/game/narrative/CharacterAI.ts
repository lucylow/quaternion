/**
 * AI Character Behavior System
 * Manages character personalities, memories, relationships, and decision-making
 */

import { LLMIntegration } from '@/ai/integrations/LLMIntegration';
import { MemoryManager } from '@/ai/memory/MemoryManager';
import type { WorldModel, PlayerProfile } from './AINarrativeDirector';

export interface AICharacter {
  characterId: string;
  personality: PersonalityMatrix;
  relationships: Map<string, number>; // characterId -> relationship score (-1 to 1)
  memories: CharacterMemory[];
  activeGoals: Goal[];
  emotionalState: CharacterEmotionalState;
  trust: number; // -1 to 1, mapped to 0-1
}

export interface PersonalityMatrix {
  openness: number; // 0-1
  conscientiousness: number; // 0-1
  extraversion: number; // 0-1
  agreeableness: number; // 0-1
  neuroticism: number; // 0-1
  curiosity: number; // 0-1
  ambition: number; // 0-1
  loyalty: number; // 0-1

  calculateActionAlignment(action: AIAction): number;
  getDescription(): string;
}

export interface CharacterMemory {
  id: string;
  type: 'player_interaction' | 'world_event' | 'character_interaction';
  description: string;
  emotionalWeight: number;
  timestamp: number;
}

export interface Goal {
  id: string;
  description: string;
  priority: number; // 0-1
  progress: number; // 0-1
  type: 'social' | 'exploration' | 'ambition' | 'loyalty';
}

export interface CharacterEmotionalState {
  type: 'calm' | 'concerned' | 'angry' | 'elated' | 'melancholic';
  intensity: number; // 0-1

  calculateActionPreference(action: AIAction): number;
}

export interface AIAction {
  id: string;
  type: 'social_interaction' | 'exploration' | 'ambition_pursuit' | 'loyalty_demonstration';
  description: string;
  targetCharacter?: string;
  location?: string;
}

export interface DialogueResponse {
  text: string;
  emotionalState: CharacterEmotionalState;
  tone: string;
}

export class CharacterAI {
  private characters: Map<string, AICharacter> = new Map();

  constructor(
    private llm: LLMIntegration,
    private memory: MemoryManager
  ) {}

  /**
   * Create a new AI character
   */
  createCharacter(
    characterId: string,
    personality: Partial<PersonalityMatrix>
  ): AICharacter {
    const fullPersonality: PersonalityMatrix = {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5,
      curiosity: 0.5,
      ambition: 0.5,
      loyalty: 0.5,
      ...personality,
      calculateActionAlignment: function(action: AIAction): number {
        let alignment = 0;
        
        switch (action.type) {
          case 'social_interaction':
            alignment += this.extraversion * 0.5;
            alignment += this.agreeableness * 0.5;
            break;
          case 'exploration':
            alignment += this.openness * 0.7;
            alignment += this.curiosity * 0.3;
            break;
          case 'ambition_pursuit':
            alignment += this.ambition * 1.0;
            break;
          case 'loyalty_demonstration':
            alignment += this.loyalty * 1.0;
            break;
        }
        
        return alignment;
      },
      getDescription: function(): string {
        const traits: string[] = [];
        
        if (this.openness > 0.7) traits.push('curious');
        if (this.conscientiousness > 0.7) traits.push('disciplined');
        if (this.extraversion > 0.7) traits.push('outgoing');
        if (this.agreeableness > 0.7) traits.push('compassionate');
        if (this.neuroticism > 0.7) traits.push('sensitive');
        if (this.curiosity > 0.7) traits.push('inquisitive');
        if (this.ambition > 0.7) traits.push('ambitious');
        if (this.loyalty > 0.7) traits.push('loyal');
        
        return traits.join(', ') || 'balanced';
      }
    };

    const character: AICharacter = {
      characterId,
      personality: fullPersonality,
      relationships: new Map(),
      memories: [],
      activeGoals: [],
      emotionalState: {
        type: 'calm',
        intensity: 0.5,
        calculateActionPreference: (action: AIAction) => 0.5
      },
      trust: 0
    };

    this.characters.set(characterId, character);
    return character;
  }

  /**
   * Get a character by ID
   */
  getCharacter(characterId: string): AICharacter | undefined {
    return this.characters.get(characterId);
  }

  /**
   * Update character behavior based on world state
   */
  async updateCharacterBehavior(
    characterId: string,
    world: WorldModel,
    player: PlayerProfile
  ): Promise<void> {
    const character = this.characters.get(characterId);
    if (!character) return;

    // Update emotional state based on recent memories
    this.updateEmotionalState(character, world);

    // Update goals based on world state
    this.updateGoals(character, world);
  }

  /**
   * Generate dialogue for a character
   */
  async generateDialogue(
    characterId: string,
    topic: string,
    world: WorldModel,
    player: PlayerProfile
  ): Promise<DialogueResponse> {
    const character = this.characters.get(characterId);
    if (!character) {
      return {
        text: '...',
        emotionalState: { type: 'calm', intensity: 0.5, calculateActionPreference: () => 0.5 },
        tone: 'neutral'
      };
    }

    const context = this.buildDialogueContext(character, topic, world, player);
    
    const prompt = `Generate dialogue for ${characterId}:

CONTEXT:
${context}

TOPIC: ${topic}

Respond as the character would speak. Consider:
- Personality: ${character.personality.getDescription()}
- Current Emotion: ${character.emotionalState.type}
- Relationship with Player: ${this.getRelationshipWithPlayer(character)}
- Recent Events: ${character.memories.slice(-3).map(m => m.description).join(', ')}

Keep response under 2 sentences. Be authentic to the character.`;

    try {
      const dialogue = await this.llm.generateText(prompt);
      return {
        text: dialogue.trim(),
        emotionalState: character.emotionalState,
        tone: character.emotionalState.type
      };
    } catch (error) {
      console.error('Dialogue generation failed:', error);
      return {
        text: this.getFallbackDialogue(character, topic),
        emotionalState: character.emotionalState,
        tone: character.emotionalState.type
      };
    }
  }

  /**
   * Process player interaction with character
   */
  processPlayerInteraction(
    characterId: string,
    action: PlayerAction
  ): void {
    const character = this.characters.get(characterId);
    if (!character) return;

    // Update relationship based on interaction
    const relationshipChange = this.calculateRelationshipChange(action, character);
    this.updateRelationshipWithPlayer(character, relationshipChange);

    // Form memory of interaction
    const memory: CharacterMemory = {
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'player_interaction',
      description: `Player ${action.description}`,
      emotionalWeight: action.emotionalImpact,
      timestamp: Date.now()
    };
    character.memories.push(memory);

    // Keep only last 100 memories
    if (character.memories.length > 100) {
      character.memories.shift();
    }

    // Update emotional state
    this.processInteractionEmotionalState(character, action);

    // Potentially update goals
    this.updateGoalsBasedOnInteraction(character, action);
  }

  private buildDialogueContext(
    character: AICharacter,
    topic: string,
    world: WorldModel,
    player: PlayerProfile
  ): string {
    return `
CHARACTER: ${character.characterId}
PERSONALITY: ${character.personality.getDescription()}
CURRENT EMOTION: ${character.emotionalState.type}
TRUST WITH PLAYER: ${character.trust}

WORLD STATE:
- Recent Events: ${world.recentEvents.slice(-3).map(e => e.description).join(', ')}
- Global Tension: ${world.globalTension}/100

PLAYER STATE:
- Recent Actions: ${player.recentActions.slice(-3).join(', ')}
- Moral Alignment: ${player.moralAlignment}
`;
  }

  private getRelationshipWithPlayer(character: AICharacter): string {
    if (character.trust > 0.7) return 'very trusting';
    if (character.trust > 0.3) return 'trusting';
    if (character.trust > -0.3) return 'neutral';
    if (character.trust > -0.7) return 'distrustful';
    return 'hostile';
  }

  private calculateRelationshipChange(
    action: PlayerAction,
    character: AICharacter
  ): number {
    // Base change from emotional impact
    let change = action.emotionalImpact * 0.1;

    // Modify based on personality alignment
    if (action.type === 'helpful' && character.personality.agreeableness > 0.7) {
      change += 0.2;
    }
    if (action.type === 'harmful' && character.personality.loyalty > 0.7) {
      change -= 0.3;
    }

    return Math.max(-1, Math.min(1, change));
  }

  private updateRelationshipWithPlayer(
    character: AICharacter,
    change: number
  ): void {
    // Weighted average: 70% current, 30% new change
    character.trust = character.trust * 0.7 + change * 0.3;
    character.trust = Math.max(-1, Math.min(1, character.trust));
  }

  private updateEmotionalState(
    character: AICharacter,
    world: WorldModel
  ): void {
    // Update based on recent memories and world tension
    const recentMemories = character.memories.slice(-5);
    const avgEmotionalWeight = recentMemories.length > 0
      ? recentMemories.reduce((sum, m) => sum + m.emotionalWeight, 0) / recentMemories.length
      : 0.5;

    // Tension affects emotions
    const tensionEffect = (world.globalTension / 100 - 0.5) * 0.3;

    if (avgEmotionalWeight > 0.7 || tensionEffect > 0.2) {
      character.emotionalState.type = 'concerned';
      character.emotionalState.intensity = Math.min(1, avgEmotionalWeight + tensionEffect);
    } else if (avgEmotionalWeight < 0.3 && tensionEffect < -0.2) {
      character.emotionalState.type = 'elated';
      character.emotionalState.intensity = Math.min(1, 0.5 + Math.abs(tensionEffect));
    } else {
      character.emotionalState.type = 'calm';
      character.emotionalState.intensity = 0.5;
    }
  }

  private processInteractionEmotionalState(
    character: AICharacter,
    action: PlayerAction
  ): void {
    // Update emotional state based on interaction
    if (action.emotionalImpact > 0.7) {
      character.emotionalState.type = 'elated';
      character.emotionalState.intensity = action.emotionalImpact;
    } else if (action.emotionalImpact < 0.3) {
      character.emotionalState.type = 'angry';
      character.emotionalState.intensity = 1 - action.emotionalImpact;
    }
  }

  private updateGoals(character: AICharacter, world: WorldModel): void {
    // Simple goal management - could be expanded
    if (character.activeGoals.length === 0) {
      character.activeGoals.push({
        id: `goal_${Date.now()}`,
        description: 'Adapt to current situation',
        priority: 0.5,
        progress: 0,
        type: 'exploration'
      });
    }
  }

  private updateGoalsBasedOnInteraction(
    character: AICharacter,
    action: PlayerAction
  ): void {
    // Update goals based on player interactions
    // This can trigger new goals or update existing ones
  }

  private getFallbackDialogue(character: AICharacter, topic: string): string {
    const responses: Record<string, string[]> = {
      calm: ['I see.', 'Understood.', 'Very well.'],
      concerned: ['I\'m worried about this.', 'This is concerning.', 'We should be careful.'],
      angry: ['I don\'t like this.', 'This is unacceptable.', 'I strongly disagree.'],
      elated: ['Excellent!', 'This is great news!', 'I\'m pleased.'],
      melancholic: ['How sad.', 'This weighs on me.', 'I feel the weight of this.']
    };

    const options = responses[character.emotionalState.type] || responses.calm;
    return options[Math.floor(Math.random() * options.length)];
  }
}

export interface PlayerAction {
  description: string;
  emotionalImpact: number; // 0-1
  type: 'helpful' | 'harmful' | 'neutral';
}


