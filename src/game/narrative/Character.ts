/**
 * Character System with Depth
 * Manages character personalities, relationships, and dialogue
 */

export enum CharacterRace {
  HUMAN = 'human',
  ELF = 'elf',
  DWARF = 'dwarf',
  ORC = 'orc',
  ROBOT = 'robot',
  ALIEN = 'alien',
  OTHER = 'other'
}

export enum CharacterClass {
  WARRIOR = 'warrior',
  MAGE = 'mage',
  ROGUE = 'rogue',
  SCHOLAR = 'scholar',
  MERCHANT = 'merchant',
  LEADER = 'leader',
  OTHER = 'other'
}

export enum CharacterMood {
  HAPPY = 'happy',
  NEUTRAL = 'neutral',
  SAD = 'sad',
  ANGRY = 'angry',
  FEARFUL = 'fearful',
  EXCITED = 'excited'
}

export interface PersonalityMatrix {
  openness: number; // 0-1: Curiosity vs caution
  conscientiousness: number; // 0-1: Organization vs spontaneity
  extraversion: number; // 0-1: Sociability vs solitude
  agreeableness: number; // 0-1: Compassion vs competitiveness
  neuroticism: number; // 0-1: Emotional stability vs sensitivity
}

export interface CharacterMemory {
  id: string;
  type: MemoryType;
  content: string;
  timestamp: number;
  importance: number; // 0-1
}

export enum MemoryType {
  INTERACTION = 'interaction',
  RELATIONSHIP_CHANGE = 'relationship_change',
  WORLD_EVENT = 'world_event',
  PLAYER_ACTION = 'player_action',
  PERSONAL_GOAL = 'personal_goal'
}

export interface CharacterGoal {
  id: string;
  description: string;
  priority: number; // 0-1
  progress: number; // 0-1
  completed: boolean;
}

export interface DialogueTopic {
  id: string;
  name: string;
  unlocked: boolean;
  dialogueTree: DialogueNode[];
}

export interface DialogueNode {
  id: string;
  text: string;
  responses: DialogueResponse[];
  conditions?: DialogueCondition[];
}

export interface DialogueResponse {
  text: string;
  nextNodeId?: string;
  effects?: any;
}

export interface DialogueCondition {
  type: 'relationship' | 'reputation' | 'choice' | 'item';
  value: any;
}

export class Character {
  public characterId: string;
  public characterName: string;
  public race: CharacterRace;
  public class: CharacterClass;
  public primaryFaction: string | null = null;
  public personality: PersonalityMatrix;
  public relationships: Map<string, number> = new Map(); // characterId -> relationship score (-100 to 100)
  public memories: CharacterMemory[] = [];
  public personalGoals: CharacterGoal[] = [];
  public currentMood: CharacterMood = CharacterMood.NEUTRAL;
  public homeLocation: { x: number; y: number } | null = null;
  public dialogueTree: DialogueTopic[] = [];
  public knownTopics: DialogueTopic[] = [];

  constructor(
    characterId: string,
    characterName: string,
    race: CharacterRace,
    characterClass: CharacterClass
  ) {
    this.characterId = characterId;
    this.characterName = characterName;
    this.race = race;
    this.class = characterClass;
    this.personality = this.generatePersonality();
  }

  /**
   * Generate personality matrix
   */
  private generatePersonality(): PersonalityMatrix {
    return {
      openness: Math.random(),
      conscientiousness: Math.random(),
      extraversion: Math.random(),
      agreeableness: Math.random(),
      neuroticism: Math.random()
    };
  }

  /**
   * Get personality description
   */
  getPersonalityDescription(): string {
    const traits: string[] = [];

    if (this.personality.openness > 0.7) traits.push('inquisitive');
    if (this.personality.conscientiousness > 0.7) traits.push('disciplined');
    if (this.personality.extraversion > 0.7) traits.push('outgoing');
    if (this.personality.agreeableness > 0.7) traits.push('compassionate');
    if (this.personality.neuroticism > 0.7) traits.push('sensitive');

    return traits.length > 0 ? traits.join(', ') : 'balanced';
  }

  /**
   * Update relationship with another character
   */
  updateRelationship(characterId: string, change: number, reason: string): void {
    const current = this.relationships.get(characterId) || 0;
    const newRelationship = Math.max(-100, Math.min(100, current + change));
    
    this.relationships.set(characterId, newRelationship);

    // Record memory
    this.addMemory(
      `Relationship with ${characterId} changed because: ${reason}`,
      MemoryType.RELATIONSHIP_CHANGE,
      0.5
    );

    // Affect mood
    if (change > 0) {
      this.improveMood(0.1);
    } else {
      this.worsenMood(0.15);
    }
  }

  /**
   * Get relationship score
   */
  getRelationship(characterId: string): number {
    return this.relationships.get(characterId) || 0;
  }

  /**
   * Add memory
   */
  addMemory(content: string, type: MemoryType, importance: number = 0.5): void {
    const memory: CharacterMemory = {
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: Date.now(),
      importance
    };

    this.memories.push(memory);

    // Keep only most important memories (limit to 50)
    if (this.memories.length > 50) {
      this.memories.sort((a, b) => b.importance - a.importance);
      this.memories = this.memories.slice(0, 50);
    }
  }

  /**
   * Improve mood
   */
  improveMood(amount: number): void {
    // Simple mood improvement - can be more sophisticated
    if (this.currentMood === CharacterMood.SAD && Math.random() < amount) {
      this.currentMood = CharacterMood.NEUTRAL;
    } else if (this.currentMood === CharacterMood.NEUTRAL && Math.random() < amount) {
      this.currentMood = CharacterMood.HAPPY;
    }
  }

  /**
   * Worsen mood
   */
  worsenMood(amount: number): void {
    if (this.currentMood === CharacterMood.HAPPY && Math.random() < amount) {
      this.currentMood = CharacterMood.NEUTRAL;
    } else if (this.currentMood === CharacterMood.NEUTRAL && Math.random() < amount) {
      this.currentMood = CharacterMood.SAD;
    }
  }

  /**
   * Check if character will help player
   */
  willHelpPlayer(playerId: string, helpType: string): boolean {
    let baseChance = 0.5;

    // Modify based on personality
    baseChance += this.personality.agreeableness * 0.3;
    baseChance += (1 - this.personality.neuroticism) * 0.2;

    // Relationship modifier
    const relationship = this.getRelationship(playerId);
    const relationshipMod = relationship / 100;
    baseChance += relationshipMod * 0.3;

    return Math.random() < baseChance;
  }

  /**
   * Get dialogue response
   */
  getDialogueResponse(topic: string, playerRelationship: number, playerReputation: number): DialogueResponse | null {
    // Find topic in dialogue tree
    const topicNode = this.dialogueTree.find(t => t.name === topic);
    if (!topicNode || !topicNode.unlocked) {
      return null;
    }

    // Get response based on relationship and reputation
    // This is simplified - real implementation would traverse dialogue tree
    const node = topicNode.dialogueTree[0];
    if (!node) return null;

    // Filter responses based on conditions
    const availableResponses = node.responses.filter(response => {
      // Check conditions if any
      return true; // Simplified
    });

    if (availableResponses.length === 0) return null;

    // Select response (could be based on relationship/reputation)
    return availableResponses[0];
  }

  /**
   * React to world event
   */
  onWorldEvent(event: { type: string; location: { x: number; y: number }; description: string }): void {
    const personalRelevance = this.calculateEventRelevance(event);

    if (personalRelevance > 0.7) {
      // Strong reaction
      this.addMemory(
        `Witnessed world event: ${event.description}`,
        MemoryType.WORLD_EVENT,
        0.8
      );

      // Update mood based on event
      this.updateMoodBasedOnEvent(event);
    }
  }

  /**
   * Calculate event relevance
   */
  private calculateEventRelevance(event: any): number {
    // Simple calculation - can be more sophisticated
    let relevance = 0.3;

    // Increase relevance if event is near home
    if (this.homeLocation) {
      const distance = Math.sqrt(
        Math.pow(event.location.x - this.homeLocation.x, 2) +
        Math.pow(event.location.y - this.homeLocation.y, 2)
      );
      if (distance < 100) {
        relevance += 0.4;
      }
    }

    // Increase relevance based on personality
    if (event.type === 'conflict' && this.personality.neuroticism > 0.7) {
      relevance += 0.2;
    }

    return Math.min(1, relevance);
  }

  /**
   * Update mood based on event
   */
  private updateMoodBasedOnEvent(event: any): void {
    if (event.type === 'conflict' || event.type === 'disaster') {
      this.worsenMood(0.3);
    } else if (event.type === 'celebration' || event.type === 'discovery') {
      this.improveMood(0.3);
    }
  }

  /**
   * Unlock dialogue topic
   */
  unlockDialogueTopic(topicName: string): void {
    const topic = this.dialogueTree.find(t => t.name === topicName);
    if (topic) {
      topic.unlocked = true;
      this.knownTopics.push(topic);
    }
  }

  /**
   * Remember player action
   */
  rememberPlayerAction(action: { type: string; description: string; moralAlignment?: string }): void {
    const importance = action.moralAlignment === 'evil' ? 0.9 : 0.6;
    
    this.addMemory(
      `Player action: ${action.description}`,
      MemoryType.PLAYER_ACTION,
      importance
    );

    // Update relationship based on action
    if (action.moralAlignment === 'good') {
      this.updateRelationship('player', 5, action.description);
    } else if (action.moralAlignment === 'evil') {
      this.updateRelationship('player', -10, action.description);
    }
  }
}

