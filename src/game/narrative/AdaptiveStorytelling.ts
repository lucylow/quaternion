/**
 * Adaptive Narrative Branching
 * Creates dynamic story branches that respond to player actions and preferences
 */

import { LLMIntegration } from '@/ai/integrations/LLMIntegration';
import type { WorldModel, PlayerProfile } from './AINarrativeDirector';

export interface StoryBranch {
  branchId: string;
  conditions: StoryCondition[];
  nodes: StoryNode[];
  playerAlignmentWeight: number; // 0-1
  dramaticWeight: number; // 0-1
  title: string;
  description: string;
}

export interface StoryCondition {
  type: 'resource_level' | 'player_choice' | 'narrative_tag' | 'time_elapsed' | 'character_alive';
  parameter: string;
  operator: '>' | '<' | '==' | '>=' | '<=';
  value: any;
}

export interface StoryNode {
  id: string;
  type: 'narrative' | 'choice' | 'combat' | 'discovery';
  content: string;
  transitions: string[]; // IDs of next nodes
}

export class StoryConditionEvaluator {
  /**
   * Check if a condition is met
   */
  static isMet(
    condition: StoryCondition,
    player: PlayerProfile,
    world: WorldModel
  ): boolean {
    switch (condition.type) {
      case 'resource_level':
        // Would need resource values in world model
        return true; // Placeholder
      case 'player_choice':
        return player.recentChoices.includes(condition.value);
      case 'narrative_tag':
        // Would need narrative tags tracking
        return true; // Placeholder
      case 'time_elapsed':
        return world.recentEvents.some(e => 
          Date.now() - e.timestamp > condition.value
        );
      case 'character_alive':
        return world.activeCharacters.includes(condition.value);
      default:
        return true;
    }
  }
}

export class AdaptiveStorytelling {
  private availableBranches: StoryBranch[] = [];
  private activeBranch: StoryBranch | null = null;
  private branchHistory: string[] = [];

  constructor(
    private llm: LLMIntegration,
    private onBranchTransition?: (oldBranch: StoryBranch | null, newBranch: StoryBranch) => void
  ) {}

  /**
   * Evaluate and select next story branch
   */
  async evaluateNextBranch(
    player: PlayerProfile,
    world: WorldModel
  ): Promise<void> {
    // Find all accessible branches
    const accessibleBranches = this.availableBranches.filter(branch =>
      branch.conditions.every(condition =>
        StoryConditionEvaluator.isMet(condition, player, world)
      )
    );

    if (accessibleBranches.length === 0) {
      // Generate new branches if none available
      await this.generateNewBranchesBasedOnPlayerActions(player, world);
      return;
    }

    // Calculate relevance scores
    const branchScores = new Map<StoryBranch, number>();
    for (const branch of accessibleBranches) {
      const score = this.calculateBranchRelevance(branch, player, world);
      branchScores.set(branch, score);
    }

    // Select branch (with variety)
    const selectedBranch = this.selectBranchWithVariety(branchScores);

    if (selectedBranch !== this.activeBranch) {
      await this.transitionToBranch(selectedBranch, player, world);
    }
  }

  /**
   * Calculate branch relevance score
   */
  private calculateBranchRelevance(
    branch: StoryBranch,
    player: PlayerProfile,
    world: WorldModel
  ): number {
    let relevance = 0;

    // Player alignment match
    relevance += this.calculateAlignmentMatch(branch, player) * branch.playerAlignmentWeight;

    // Dramatic appropriateness
    relevance += this.calculateDramaticAppropriateness(branch, world) * branch.dramaticWeight;

    // Recent story coherence
    relevance += this.calculateCoherenceWithRecentEvents(branch, world) * 0.3;

    return relevance;
  }

  /**
   * Calculate alignment match between branch and player
   */
  private calculateAlignmentMatch(
    branch: StoryBranch,
    player: PlayerProfile
  ): number {
    // Simple heuristic: branches with more dramatic weight might appeal to certain archetypes
    if (player.dominantArchetype === 'dramatic' && branch.dramaticWeight > 0.7) {
      return 0.8;
    }
    return 0.5; // Default neutral
  }

  /**
   * Calculate dramatic appropriateness
   */
  private calculateDramaticAppropriateness(
    branch: StoryBranch,
    world: WorldModel
  ): number {
    // Higher tension worlds benefit from dramatic branches
    const tensionNormalized = world.globalTension / 100;
    return Math.abs(branch.dramaticWeight - tensionNormalized) < 0.3 ? 0.8 : 0.5;
  }

  /**
   * Calculate coherence with recent events
   */
  private calculateCoherenceWithRecentEvents(
    branch: StoryBranch,
    world: WorldModel
  ): number {
    // Simple check: if branch mentions recent events, it's more coherent
    const recentEventTexts = world.recentEvents.slice(-3).map(e => e.description).join(' ').toLowerCase();
    const branchText = branch.description.toLowerCase();
    
    // Check for keyword overlap
    const overlap = recentEventTexts.split(' ').filter(word =>
      branchText.includes(word)
    ).length;
    
    return Math.min(1, overlap / 5); // Normalize to 0-1
  }

  /**
   * Select branch with variety (not always highest score)
   */
  private selectBranchWithVariety(
    branchScores: Map<StoryBranch, number>
  ): StoryBranch {
    // Weighted random selection based on scores
    const branches = Array.from(branchScores.entries());
    const totalScore = branches.reduce((sum, [, score]) => sum + score, 0);
    
    // Add some randomness (80% score-based, 20% random)
    const random = Math.random();
    if (random < 0.2) {
      // 20% chance to pick a random branch (for variety)
      return branches[Math.floor(Math.random() * branches.length)][0];
    }

    // 80% chance: weighted selection based on scores
    let cumulative = 0;
    const target = Math.random() * totalScore;
    
    for (const [branch, score] of branches) {
      cumulative += score;
      if (target <= cumulative) {
        return branch;
      }
    }

    // Fallback: highest score
    return branches.reduce((best, [branch, score]) =>
      score > best[1] ? [branch, score] : best,
      branches[0]
    )[0];
  }

  /**
   * Transition to a new branch
   */
  private async transitionToBranch(
    newBranch: StoryBranch,
    player: PlayerProfile,
    world: WorldModel
  ): Promise<void> {
    const oldBranch = this.activeBranch;

    // Complete current branch
    if (oldBranch) {
      this.onBranchComplete(oldBranch);
    }

    // Start new branch
    this.activeBranch = newBranch;
    this.branchHistory.push(newBranch.branchId);
    this.onBranchStart(newBranch);

    // Generate transition content
    await this.generateBranchTransition(oldBranch, newBranch, player, world);

    // Update available branches
    this.updateAvailableBranches();
  }

  /**
   * Generate transition content between branches
   */
  private async generateBranchTransition(
    oldBranch: StoryBranch | null,
    newBranch: StoryBranch,
    player: PlayerProfile,
    world: WorldModel
  ): Promise<void> {
    const prompt = `Generate transition content for moving to new story branch:

OLD BRANCH: ${oldBranch?.title || 'Introduction'}
NEW BRANCH: ${newBranch.title}

PLAYER CONTEXT:
- Recent Choices: ${player.recentChoices.slice(-3).join(', ')}
- Current Goals: ${player.activeGoals.join(', ')}
- Moral Alignment: ${player.moralAlignment}

WORLD CONTEXT:
- Recent Events: ${world.recentEvents.slice(-3).map(e => e.description).join(', ')}
- Active Conflicts: ${world.activeConflicts.length}

Create a smooth transition that:
1. Acknowledges player's recent actions
2. Sets up new dramatic situation
3. Feels organic, not abrupt
4. Maintains emotional continuity

Provide:
- Opening narration (2-3 sentences)
- Character reactions (1-2 characters)
- New immediate objective

Respond in JSON:
{
  "narration": "transition narration",
  "characterReactions": [
    {"character": "character_id", "reaction": "reaction text"}
  ],
  "objective": "new immediate objective"
}`;

    try {
      const response = await this.llm.generateText(prompt);
      const transition = this.parseJSONResponse<{
        narration: string;
        characterReactions: Array<{ character: string; reaction: string }>;
        objective: string;
      }>(response);

      // Execute transition content
      this.executeTransitionContent(transition);
    } catch (error) {
      console.error('Failed to generate branch transition:', error);
      // Use fallback transition
      this.executeFallbackTransition(newBranch);
    }
  }

  /**
   * Generate new branches based on player actions
   */
  async generateNewBranchesBasedOnPlayerActions(
    player: PlayerProfile,
    world: WorldModel
  ): Promise<void> {
    const prompt = `Generate new story branches based on player's recent actions:

PLAYER'S RECENT ACTIONS:
${player.recentActions.slice(-5).join('\n')}

CURRENT WORLD STATE:
${this.getWorldSummary(world)}

Create 2-3 new story branches that:
- Are logical consequences of player's actions
- Offer different moral alignments
- Provide varied gameplay experiences
- Connect to established characters/locations

Each branch should have:
- Unique central conflict
- 3-5 potential outcomes
- Different emotional tones
- Estimated 20-40 minute completion

Respond in JSON array:
[
  {
    "branchId": "branch_id",
    "title": "Branch Title",
    "description": "Branch description",
    "conditions": [
      {"type": "player_choice", "parameter": "choice_id", "operator": "==", "value": "selected"}
    ],
    "playerAlignmentWeight": 0.7,
    "dramaticWeight": 0.6,
    "nodes": [
      {"id": "node1", "type": "narrative", "content": "Node content", "transitions": ["node2"]}
    ]
  }
]`;

    try {
      const response = await this.llm.generateText(prompt);
      const branches = this.parseBranchesFromJSON(response);
      
      for (const branch of branches) {
        branch.branchId = branch.branchId || `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.availableBranches.push(branch);
      }
    } catch (error) {
      console.error('Failed to generate new branches:', error);
      // Add fallback branches
      this.addFallbackBranches(player, world);
    }
  }

  /**
   * Get world summary for prompts
   */
  private getWorldSummary(world: WorldModel): string {
    return `
- Current Era: ${world.currentEra}
- Active Factions: ${world.activeFactions.join(', ')}
- Recent Events: ${world.recentEvents.slice(-3).map(e => e.description).join(', ')}
- Global Tension: ${world.globalTension}/100
- Active Characters: ${world.activeCharacters.join(', ')}
- Active Conflicts: ${world.activeConflicts.length}
`;
  }

  /**
   * Execute transition content
   */
  private executeTransitionContent(transition: {
    narration: string;
    characterReactions: Array<{ character: string; reaction: string }>;
    objective: string;
  }): void {
    // This would trigger UI updates, narration playback, etc.
    console.log('Transition narration:', transition.narration);
    console.log('Character reactions:', transition.characterReactions);
    console.log('New objective:', transition.objective);

    // In actual implementation, this would:
    // - Play narration audio
    // - Show character reactions in UI
    // - Update quest log with new objective
  }

  private executeFallbackTransition(newBranch: StoryBranch): void {
    this.executeTransitionContent({
      narration: `The situation evolves. ${newBranch.description}`,
      characterReactions: [],
      objective: `Continue with ${newBranch.title}`
    });
  }

  private onBranchComplete(branch: StoryBranch): void {
    // Handle branch completion
    console.log(`Branch completed: ${branch.title}`);
  }

  private onBranchStart(branch: StoryBranch): void {
    // Handle branch start
    console.log(`Branch started: ${branch.title}`);
  }

  private updateAvailableBranches(): void {
    // Update available branches based on current state
    // Remove branches that are no longer accessible
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

  private parseBranchesFromJSON(text: string): StoryBranch[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as StoryBranch[];
      }
    } catch (error) {
      console.error('Failed to parse branches JSON:', error);
    }
    return [];
  }

  private addFallbackBranches(player: PlayerProfile, world: WorldModel): void {
    // Add simple fallback branches
    this.availableBranches.push({
      branchId: `fallback_${Date.now()}`,
      title: 'Exploration Path',
      description: 'Continue exploring the world.',
      conditions: [],
      nodes: [{
        id: 'node1',
        type: 'narrative',
        content: 'You continue your journey.',
        transitions: []
      }],
      playerAlignmentWeight: 0.5,
      dramaticWeight: 0.5
    });
  }

  /**
   * Get current branch state
   */
  getCurrentBranch(): StoryBranch | null {
    return this.activeBranch;
  }

  /**
   * Get branch history
   */
  getBranchHistory(): string[] {
    return [...this.branchHistory];
  }

  /**
   * Add a branch manually
   */
  addBranch(branch: StoryBranch): void {
    this.availableBranches.push(branch);
  }
}

