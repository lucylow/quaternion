/**
 * Story Arc System - Interactive Story Arcs with Nodes
 * Manages story progression, choices, and consequences
 */

import { LLMIntegration } from '../../ai/integrations/LLMIntegration';
import type { WorldLore } from './NarrativeManager';
import type { StoryNode, StoryChoice } from './NarrativeManager';

export enum StoryArcType {
  MAIN_QUEST = 'main_quest',
  SIDE_QUEST = 'side_quest',
  CHARACTER_ARC = 'character_arc',
  MYSTERY = 'mystery',
  EMERGENT = 'emergent'
}

export interface StoryCondition {
  type: 'reputation' | 'choice' | 'item' | 'location' | 'time';
  value: any;
  operator: 'equals' | 'greater' | 'less' | 'contains';
}

export interface StoryReward {
  type: 'reputation' | 'item' | 'ability' | 'resource' | 'knowledge';
  value: any;
  description: string;
}

export class StoryArc {
  public arcName: string;
  public type: StoryArcType;
  public progress: number = 0; // 0-1 completion
  public nodes: StoryNode[] = [];
  public startConditions: StoryCondition[] = [];
  public completionRewards: StoryReward[] = [];
  public currentNode: StoryNode | null = null;
  public arcFlags: Map<string, boolean> = new Map();

  constructor(
    arcName: string,
    type: StoryArcType,
    nodes: StoryNode[],
    startConditions: StoryCondition[] = [],
    completionRewards: StoryReward[] = []
  ) {
    this.arcName = arcName;
    this.type = type;
    this.nodes = nodes;
    this.startConditions = startConditions;
    this.completionRewards = completionRewards;
  }

  /**
   * Generate a story arc using LLM
   */
  static async generateArc(
    llm: LLMIntegration,
    arcId: string,
    seed: number,
    worldLore: WorldLore
  ): Promise<StoryArc> {
    const prompt = `
Generate a story arc for a game campaign. The arc should have:
- A compelling name
- 3-5 story nodes with progression
- Meaningful choices
- Connection to world lore

World Context:
- Creation Myth: ${worldLore.creationMyth.substring(0, 200)}...
- Current Conflicts: ${worldLore.currentConflicts.map(c => c.name).join(', ')}
- Major Factions: ${worldLore.majorFactions.map(f => f.name).join(', ')}

Respond in JSON format:
{
  "arcName": "Arc name",
  "type": "main_quest|side_quest|character_arc|mystery",
  "nodes": [
    {
      "nodeId": "node_1",
      "title": "Node title",
      "description": "Node description",
      "type": "dialogue|combat|exploration|choice|discovery",
      "availableChoices": [
        {
          "choiceText": "Choice text",
          "moralAlignment": "good|evil|neutral",
          "nextNodeId": "node_2"
        }
      ],
      "completionConditions": ["condition1", "condition2"]
    }
  ]
}
`;

    try {
      const response = await llm.generateText(prompt);
      const parsed = this.parseJSONResponse<any>(response);
      
      const nodes: StoryNode[] = parsed.nodes.map((n: any) => ({
        nodeId: n.nodeId,
        title: n.title,
        description: n.description,
        type: n.type || 'dialogue',
        availableChoices: (n.availableChoices || []).map((c: any) => ({
          choiceText: c.choiceText,
          immediateConsequence: {},
          longTermConsequence: {},
          nextNodeId: c.nextNodeId,
          moralAlignment: c.moralAlignment || 'neutral',
          visibilityConditions: []
        })),
        completionConditions: n.completionConditions || [],
        isArcCompletionNode: false
      }));

      // Mark last node as completion node
      if (nodes.length > 0) {
        nodes[nodes.length - 1].isArcCompletionNode = true;
      }

      return new StoryArc(
        parsed.arcName || `Arc ${arcId}`,
        parsed.type || StoryArcType.SIDE_QUEST,
        nodes,
        [],
        []
      );
    } catch (error) {
      console.warn('Story arc generation failed, using fallback', error);
      return this.getFallbackArc(arcId);
    }
  }

  /**
   * Start the story arc
   */
  startArc(): void {
    if (this.nodes.length === 0) return;

    this.currentNode = this.nodes[0];
    this.progress = 0;

    // Trigger opening events
    this.onArcStarted();
  }

  /**
   * Advance to next node
   */
  advanceToNode(nodeId: string): boolean {
    const nextNode = this.nodes.find(n => n.nodeId === nodeId);
    if (!nextNode || !this.canAdvanceTo(nextNode)) {
      return false;
    }

    // Complete current node
    if (this.currentNode) {
      this.onNodeComplete(this.currentNode);
    }

    // Advance to next node
    this.currentNode = nextNode;
    this.onNodeStart(nextNode);

    // Update progress
    this.progress = this.calculateArcProgress();

    // Check for arc completion
    if (nextNode.isArcCompletionNode) {
      this.completeArc();
      return true;
    }

    return true;
  }

  /**
   * Complete the story arc
   */
  completeArc(): void {
    this.progress = 1.0;

    // Award completion rewards
    for (const reward of this.completionRewards) {
      this.grantReward(reward);
    }

    // Trigger completion events
    this.onArcCompleted();
  }

  /**
   * Check if can advance to node
   */
  private canAdvanceTo(node: StoryNode): boolean {
    // Check completion conditions
    for (const condition of node.completionConditions) {
      if (!this.checkCondition(condition)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if condition is met
   */
  private checkCondition(condition: string): boolean {
    // Simple condition checking - can be expanded
    return this.arcFlags.get(condition) === true;
  }

  /**
   * Calculate arc progress
   */
  private calculateArcProgress(): number {
    if (this.nodes.length === 0) return 0;
    
    const currentNodeIndex = this.nodes.findIndex(n => n === this.currentNode);
    if (currentNodeIndex === -1) return 0;

    return currentNodeIndex / this.nodes.length;
  }

  /**
   * Grant reward to player
   */
  private grantReward(reward: StoryReward): void {
    // This would integrate with player system
    console.log(`Granting reward: ${reward.description}`);
  }

  /**
   * Arc started callback
   */
  private onArcStarted(): void {
    // Trigger cinematic, notifications, etc.
    console.log(`Story arc started: ${this.arcName}`);
  }

  /**
   * Node started callback
   */
  private onNodeStart(node: StoryNode): void {
    // Spawn NPCs, update quest log, play audio
    console.log(`Story node started: ${node.title}`);
  }

  /**
   * Node completed callback
   */
  private onNodeComplete(node: StoryNode): void {
    // Clean up, record completion, grant rewards
    console.log(`Story node completed: ${node.title}`);
  }

  /**
   * Arc completed callback
   */
  private onArcCompleted(): void {
    // Update world state, generate follow-up arcs
    console.log(`Story arc completed: ${this.arcName}`);
  }

  /**
   * Parse JSON from LLM response
   */
  private static parseJSONResponse<T>(text: string): T {
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
   * Get fallback arc
   */
  private static getFallbackArc(arcId: string): StoryArc {
    return new StoryArc(
      `Arc ${arcId}`,
      StoryArcType.SIDE_QUEST,
      [
        {
          nodeId: 'node_1',
          title: 'Beginning',
          description: 'The story begins.',
          type: 'dialogue',
          availableChoices: [],
          completionConditions: [],
          isArcCompletionNode: false
        },
        {
          nodeId: 'node_2',
          title: 'Ending',
          description: 'The story concludes.',
          type: 'dialogue',
          availableChoices: [],
          completionConditions: [],
          isArcCompletionNode: true
        }
      ]
    );
  }
}

