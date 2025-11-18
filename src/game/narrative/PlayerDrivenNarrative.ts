/**
 * Player-Driven Narrative System
 * Tracks player legacy, reputation, and generates emergent stories
 */

import { LLMIntegration } from '../../ai/integrations/LLMIntegration';
import type { Faction } from './NarrativeManager';
import { StoryArc, StoryArcType } from './StoryArc';

export enum PlayerActionType {
  FACTION_BETRAYAL = 'faction_betrayal',
  MAJOR_DISCOVERY = 'major_discovery',
  WORLD_CHANGING_EVENT = 'world_changing_event',
  UNIQUE_ACHIEVEMENT = 'unique_achievement',
  CHOICE = 'choice'
}

export interface PlayerAction {
  type: PlayerActionType;
  choiceId?: string;
  option?: string;
  location?: { x: number; y: number };
  timestamp: number;
  description: string;
  impactMagnitude: number; // 0-1
  affectedFactions: string[];
  moralWeight?: number; // -1 to 1
}

export interface PlayerLegacyEvent {
  actionType: PlayerActionType;
  location?: { x: number; y: number };
  timestamp: number;
  witnesses: string[]; // character IDs
  consequences: string[];
  worldImpact: number; // 0-1
}

export class PlayerDrivenNarrative {
  private llm: LLMIntegration;
  public legacyEvents: PlayerLegacyEvent[] = [];
  public playerGeneratedArcs: StoryArc[] = [];
  private playerInfluenceThreshold: number = 0.3;

  constructor(llm: LLMIntegration) {
    this.llm = llm;
  }

  /**
   * On player major action
   */
  async onPlayerMajorAction(action: PlayerAction): Promise<void> {
    // Record for legacy system
    this.recordLegacyEvent(action);

    // Check for story generation triggers
    await this.checkForEmergentStory(action);

    // Update world response to player
    this.updateWorldResponseToPlayer(action);

    // Generate narrative consequences
    await this.generateConsequences(action);
  }

  /**
   * Record legacy event
   */
  private recordLegacyEvent(action: PlayerAction): void {
    const legacyEvent: PlayerLegacyEvent = {
      actionType: action.type,
      location: action.location,
      timestamp: action.timestamp,
      witnesses: [], // Would be populated from game state
      consequences: [],
      worldImpact: action.impactMagnitude
    };

    this.legacyEvents.push(legacyEvent);

    // NPCs remember player actions
    // This would integrate with character system
    console.log(`Legacy event recorded: ${action.description}`);
  }

  /**
   * Check for emergent story
   */
  private async checkForEmergentStory(action: PlayerAction): Promise<void> {
    if (action.impactMagnitude > this.playerInfluenceThreshold) {
      const newArc = await this.generateEmergentArc(action);
      if (newArc) {
        this.playerGeneratedArcs.push(newArc);
        // This would activate the arc in the narrative manager
        console.log(`Emergent story arc generated: ${newArc.arcName}`);
      }
    }
  }

  /**
   * Generate emergent arc
   */
  private async generateEmergentArc(action: PlayerAction): Promise<StoryArc | null> {
    switch (action.type) {
      case PlayerActionType.FACTION_BETRAYAL:
        return await this.generateBetrayalConsequencesArc(action);
      case PlayerActionType.MAJOR_DISCOVERY:
        return await this.generateDiscoveryFollowUpArc(action);
      case PlayerActionType.WORLD_CHANGING_EVENT:
        return await this.generateWorldResponseArc(action);
      case PlayerActionType.UNIQUE_ACHIEVEMENT:
        return await this.generateLegendArc(action);
      default:
        return null;
    }
  }

  /**
   * Generate betrayal consequences arc
   */
  private async generateBetrayalConsequencesArc(action: PlayerAction): Promise<StoryArc | null> {
    const prompt = `
Generate a story arc about the consequences of betraying a faction.
The player has betrayed a faction, and now faces the repercussions.

Create a compelling arc with:
- 3-5 story nodes
- Meaningful choices
- Consequences of the betrayal
- Potential redemption or escalation paths

Respond in JSON format matching StoryArc structure.
`;

    try {
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseJSONResponse<any>(response);
      
      // Convert to StoryArc
      return await StoryArc.generateArc(
        this.llm,
        `betrayal_${Date.now()}`,
        Date.now(),
        {} as any // Would pass world lore
      );
    } catch (error) {
      console.warn('Failed to generate betrayal arc', error);
      return null;
    }
  }

  /**
   * Generate discovery follow-up arc
   */
  private async generateDiscoveryFollowUpArc(action: PlayerAction): Promise<StoryArc | null> {
    // Similar to betrayal arc but focused on discovery consequences
    return null;
  }

  /**
   * Generate world response arc
   */
  private async generateWorldResponseArc(action: PlayerAction): Promise<StoryArc | null> {
    // Arc about how the world responds to player's world-changing action
    return null;
  }

  /**
   * Generate legend arc
   */
  private async generateLegendArc(action: PlayerAction): Promise<StoryArc | null> {
    // Arc about player becoming a legend
    return null;
  }

  /**
   * Update world response to player
   */
  private updateWorldResponseToPlayer(action: PlayerAction): void {
    // Update faction relationships, spawn events, etc.
    console.log(`World responding to player action: ${action.description}`);
  }

  /**
   * Generate consequences
   */
  private async generateConsequences(action: PlayerAction): Promise<void> {
    // Immediate consequences
    this.applyImmediateConsequences(action);

    // Delayed consequences would be scheduled
    // This would integrate with time/event system
  }

  /**
   * Apply immediate consequences
   */
  private applyImmediateConsequences(action: PlayerAction): void {
    // Apply immediate effects based on action
    console.log(`Applying immediate consequences for: ${action.description}`);
  }

  /**
   * Unlock hero status
   */
  unlockHeroStatus(faction: Faction): void {
    // Grant hero benefits, trigger recognition events
    console.log(`Player became hero of ${faction.name}`);
  }

  /**
   * Become faction enemy
   */
  becomeFactionEnemy(faction: Faction): void {
    // Apply enemy penalties, spawn hostile NPCs
    console.log(`Player became enemy of ${faction.name}`);
  }

  /**
   * Become permanent enemy
   */
  becomePermanentEnemy(faction: Faction): void {
    // Permanent enemy status, bounty hunters, etc.
    console.log(`Player became permanent enemy of ${faction.name}`);
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
}

