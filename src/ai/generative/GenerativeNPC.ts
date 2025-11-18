/**
 * Generative NPC System
 * Complete integration of memory, reflection, planning, personality, emotions, and relationships
 * Based on Stanford Generative Agents research
 * 
 * Creates NPCs that:
 * - Remember past interactions
 * - Form opinions and relationships
 * - Have dynamic goals and schedules
 * - Exhibit human-like behavior
 */

import { LLMIntegration } from '../integrations/LLMIntegration';
import { EnhancedMemoryStream, MemoryObservation } from './EnhancedMemoryStream';
import { ReflectionSystem, Reflection } from './ReflectionSystem';
import { PlanningSystem, Plan, PlanningContext, PlannedAction } from './PlanningSystem';
import { OCEANPersonality, OCEANPersonalitySystem, PersonalityProfile } from './OCEANPersonality';
import { EmotionalModel, Emotion, Mood } from './EmotionalModel';
import { RelationshipSystem, Relationship, RelationshipSummary } from './RelationshipSystem';

export interface GenerativeNPCConfig {
  id: string;
  name: string;
  role: string; // 'trader', 'commander', 'quest_giver', etc.
  position?: { x: number; y: number };
  personality?: OCEANPersonality | string; // OCEAN scores or archetype string
  llm?: LLMIntegration;
  initialMemories?: string[];
}

export interface NPCState {
  id: string;
  name: string;
  role: string;
  position: { x: number; y: number };
  currentAction?: string;
  location: string;
  status: 'idle' | 'active' | 'planning' | 'interacting';
}

/**
 * Generative NPC
 * Complete cognitive architecture for believable NPCs
 */
export class GenerativeNPC {
  // Core identity
  public readonly id: string;
  public readonly name: string;
  public readonly role: string;
  public position: { x: number; y: number };
  public status: NPCState['status'] = 'idle';

  // Cognitive systems
  private memoryStream: EnhancedMemoryStream;
  private reflectionSystem: ReflectionSystem;
  private planningSystem: PlanningSystem;
  private personality: OCEANPersonality;
  private personalityProfile: PersonalityProfile;
  private emotionalModel: EmotionalModel;
  private relationshipSystem: RelationshipSystem;

  // LLM integration
  private llm: LLMIntegration | null = null;

  // Current state
  private currentPlan: Plan | null = null;
  private currentAction: PlannedAction | null = null;
  private location: string = 'unknown';

  constructor(config: GenerativeNPCConfig) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.position = config.position || { x: 0, y: 0 };
    this.llm = config.llm || null;

    // Initialize personality
    if (typeof config.personality === 'string') {
      this.personality = OCEANPersonalitySystem.fromArchetype(config.personality);
    } else if (config.personality) {
      this.personality = config.personality;
    } else {
      this.personality = OCEANPersonalitySystem.fromArchetype('default');
    }

    this.personalityProfile = {
      ocean: this.personality,
      traits: OCEANPersonalitySystem.getTraits(this.personality),
      background: `${this.name} is a ${this.role} in the game world`,
      speechStyle: OCEANPersonalitySystem.getSpeechStyle(this.personality),
      values: this.generateValues()
    };

    // Initialize cognitive systems
    this.memoryStream = new EnhancedMemoryStream(this.llm || undefined);
    this.reflectionSystem = new ReflectionSystem(this.memoryStream, this.llm || undefined);
    this.planningSystem = new PlanningSystem(
      this.memoryStream,
      this.reflectionSystem,
      this.llm || undefined
    );
    this.emotionalModel = new EmotionalModel(this.personality);
    this.relationshipSystem = new RelationshipSystem();

    // Initialize with initial memories
    if (config.initialMemories) {
      this.initializeMemories(config.initialMemories);
    }
  }

  /**
   * Initialize with starting memories
   */
  private async initializeMemories(memories: string[]): Promise<void> {
    for (const memory of memories) {
      await this.memoryStream.addObservation(memory, ['initial', 'setup']);
    }
  }

  /**
   * Generate values based on personality
   */
  private generateValues(): string[] {
    const values: string[] = [];

    if (this.personality.conscientiousness > 0.7) {
      values.push('reliability', 'organization');
    }
    if (this.personality.agreeableness > 0.7) {
      values.push('cooperation', 'harmony');
    }
    if (this.personality.openness > 0.7) {
      values.push('innovation', 'creativity');
    }
    if (this.personality.extraversion > 0.7) {
      values.push('social connection', 'communication');
    }

    return values.length > 0 ? values : ['survival', 'adaptation'];
  }

  /**
   * Process an event (observation, interaction, etc.)
   */
  async processEvent(
    event: string,
    entityId?: string,
    entityType: 'player' | 'npc' = 'player',
    context?: any
  ): Promise<void> {
    // Store in memory
    const memoryId = await this.memoryStream.addObservation(
      event,
      ['event', this.role],
      entityId
    );

    // Process emotion
    await this.emotionalModel.processEvent(event, context);

    // Update relationship if entity involved
    if (entityId) {
      const impact = this.calculateRelationshipImpact(event, context);
      this.relationshipSystem.recordInteraction(
        entityId,
        {
          type: impact > 0 ? 'positive' : impact < 0 ? 'negative' : 'neutral',
          description: event,
          impact,
          context: JSON.stringify(context)
        },
        entityType
      );
    }

    // Trigger reflection if threshold reached
    const memory = this.memoryStream.getAllMemories().find(m => m.id === memoryId);
    if (memory) {
      await this.reflectionSystem.processObservation(memory);
    }
  }

  /**
   * Calculate relationship impact from event
   */
  private calculateRelationshipImpact(event: string, context?: any): number {
    const eventLower = event.toLowerCase();
    let impact = 0;

    // Positive events
    if (eventLower.includes('help') || eventLower.includes('gift') || eventLower.includes('favor')) {
      impact = 5;
    } else if (eventLower.includes('trade') && context?.favorable) {
      impact = 3;
    } else if (eventLower.includes('compliment') || eventLower.includes('praise')) {
      impact = 4;
    }
    // Negative events
    else if (eventLower.includes('insult') || eventLower.includes('attack') || eventLower.includes('betray')) {
      impact = -8;
    } else if (eventLower.includes('refuse') || eventLower.includes('reject')) {
      impact = -3;
    } else if (eventLower.includes('threat')) {
      impact = -5;
    }

    // Personality modifies impact
    if (this.personality.agreeableness > 0.7 && impact < 0) {
      impact *= 0.8; // More forgiving
    } else if (this.personality.agreeableness < 0.3 && impact > 0) {
      impact *= 0.9; // Less trusting
    }

    return impact;
  }

  /**
   * Generate dialogue response
   */
  async generateDialogue(
    playerInput: string,
    playerId: string,
    context?: any
  ): Promise<string> {
    // Get relevant memories
    const memories = await this.memoryStream.retrieveMemories({
      query: playerInput,
      limit: 5,
      recencyWeight: 0.3,
      relevanceWeight: 0.4,
      importanceWeight: 0.3
    });

    // Get relationship info
    const relationship = this.relationshipSystem.getSummary(playerId, 'player');
    const relationshipContext = this.formatRelationshipContext(relationship);

    // Get reflections
    const reflections = this.reflectionSystem.getRecentReflections(2);
    const reflectionText = reflections.map(r => r.content).join('; ');

    // Get current mood
    const mood = this.emotionalModel.getMood();
    const moodContext = this.formatMoodContext(mood);

    // Get memory context
    const memoryText = memories.map(m => m.content).join('\n');

    // Build prompt
    const prompt = this.buildDialoguePrompt(
      playerInput,
      memoryText,
      relationshipContext,
      reflectionText,
      moodContext,
      context
    );

    if (this.llm) {
      try {
        const response = await this.llm.generateText(prompt);
        const dialogue = this.cleanDialogue(response);

        // Store interaction in memory
        await this.processEvent(
          `Player said: "${playerInput}". I responded: "${dialogue}"`,
          playerId,
          'player',
          context
        );

        return dialogue;
      } catch (error) {
        console.warn('Dialogue generation failed', error);
      }
    }

    // Fallback dialogue
    return this.generateFallbackDialogue(playerInput, relationship);
  }

  /**
   * Build dialogue prompt
   */
  private buildDialoguePrompt(
    playerInput: string,
    memoryContext: string,
    relationshipContext: string,
    reflectionContext: string,
    moodContext: string,
    gameContext?: any
  ): string {
    return `You are "${this.name}", a ${this.role} in a sci-fi RTS game.

Personality: ${this.personalityProfile.traits.join(', ')}
Speech Style: ${this.personalityProfile.speechStyle}
Background: ${this.personalityProfile.background}

${relationshipContext}
${moodContext}
${reflectionContext ? `Recent Reflections: ${reflectionContext}` : ''}

Your memories:
${memoryContext || 'No specific memories'}

Player says: "${playerInput}"

Generate a response (max 30 words) that:
- Matches your personality and speech style
- Reflects your relationship with the player
- References relevant memories if appropriate
- Feels natural and in-character
- Responds to the player's input

Output only the dialogue text, no JSON or formatting.`;
  }

  /**
   * Format relationship context for prompt
   */
  private formatRelationshipContext(relationship: RelationshipSummary): string {
    return `Relationship with player:
- Strength: ${relationship.relationship.strength}/100
- Sentiment: ${relationship.sentiment}
- Trust: ${relationship.trustLevel}
- Familiarity: ${relationship.familiarity}
- Interactions: ${relationship.relationship.interactionCount}`;
  }

  /**
   * Format mood context for prompt
   */
  private formatMoodContext(mood: Mood): string {
    const moodDesc = mood.valence > 0.3 ? 'positive' :
                    mood.valence < -0.3 ? 'negative' : 'neutral';
    return `Current mood: ${moodDesc} (${mood.dominantEmotion}), intensity: ${(mood.intensity * 100).toFixed(0)}%`;
  }

  /**
   * Clean dialogue response
   */
  private cleanDialogue(text: string): string {
    return text
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\n/g, ' ')
      .substring(0, 200); // Limit length
  }

  /**
   * Generate fallback dialogue
   */
  private generateFallbackDialogue(
    playerInput: string,
    relationship: RelationshipSummary
  ): string {
    if (relationship.relationship.strength > 70) {
      return `Hello! Good to see you again. How can I help?`;
    } else if (relationship.relationship.strength < 30) {
      return `What do you want?`;
    }
    return `I see. How can I assist you?`;
  }

  /**
   * Update NPC (call every game tick)
   */
  async update(currentTime: number, gameState?: any): Promise<void> {
    // Update plans
    await this.planningSystem.updatePlans(currentTime);

    // Get current/next action
    this.currentAction = this.planningSystem.getNextAction(currentTime);
    this.currentPlan = this.planningSystem.getCurrentPlan();

    // If no plan, generate one
    if (!this.currentPlan) {
      await this.generatePlan(currentTime, gameState);
    }

    // Update status
    if (this.currentAction) {
      this.status = 'active';
    } else {
      this.status = 'idle';
    }
  }

  /**
   * Generate a new plan
   */
  private async generatePlan(currentTime: number, gameState?: any): Promise<void> {
    const recentMemories = this.memoryStream.getRecentMemories(24, 10);
    const reflections = this.reflectionSystem.getRecentReflections(3);

    const context: PlanningContext = {
      currentTime,
      location: this.location,
      currentState: this.getCurrentStateSummary(),
      availableResources: gameState?.resources || [],
      recentMemories,
      reflections,
      personality: this.personality
    };

    this.currentPlan = await this.planningSystem.generatePlan(context, 8);
    this.status = 'planning';
  }

  /**
   * Get current state summary
   */
  private getCurrentStateSummary(): string {
    const mood = this.emotionalModel.getMood();
    const relationships = this.relationshipSystem.getAllRelationships();
    
    return `${this.name} is a ${this.role} at ${this.location}. Current mood: ${mood.dominantEmotion}. Has ${relationships.length} relationships.`;
  }

  /**
   * Get NPC state
   */
  getState(): NPCState {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      position: this.position,
      currentAction: this.currentAction?.description,
      location: this.location,
      status: this.status
    };
  }

  /**
   * Get personality profile
   */
  getPersonality(): PersonalityProfile {
    return { ...this.personalityProfile };
  }

  /**
   * Get current mood
   */
  getMood(): Mood {
    return this.emotionalModel.getMood();
  }

  /**
   * Get relationship with entity
   */
  getRelationship(entityId: string, entityType: 'player' | 'npc' = 'player'): RelationshipSummary {
    return this.relationshipSystem.getSummary(entityId, entityType);
  }

  /**
   * Get memory summary
   */
  async getMemorySummary(limit: number = 10): Promise<string> {
    const memories = await this.memoryStream.retrieveMemories({ limit });
    return memories.map(m => m.content).join('\n');
  }

  /**
   * Export NPC state for persistence
   */
  export(): any {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      position: this.position,
      personality: this.personality,
      memories: this.memoryStream.export(),
      relationships: this.relationshipSystem.export(),
      location: this.location
    };
  }

  /**
   * Import NPC state from persistence
   */
  import(data: any): void {
    if (data.memories) {
      this.memoryStream.import(data.memories);
    }
    if (data.relationships) {
      this.relationshipSystem.import(data.relationships);
    }
    if (data.position) {
      this.position = data.position;
    }
    if (data.location) {
      this.location = data.location;
    }
  }
}


