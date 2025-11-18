/**
 * Narrative Manager - Core Narrative Architecture
 * Manages dynamic stories, characters, and world lore
 */

import { LLMIntegration } from '../../ai/integrations/LLMIntegration';
import { LoreGenerator } from './LoreGenerator';
import { StoryArc } from './StoryArc';
import { Character } from './Character';
import { MysterySystem } from './MysterySystem';
import { PlayerDrivenNarrative } from './PlayerDrivenNarrative';
import { EmotionalBeatSystem } from './EmotionalBeatSystem';
import { WorldStateNarrative } from './WorldStateNarrative';

export interface WorldLore {
  creationMyth: string;
  historicalEvents: HistoricalEvent[];
  currentConflicts: Conflict[];
  majorFactions: Faction[];
  worldSecrets: WorldSecret[];
}

export interface HistoricalEvent {
  name: string;
  year: number;
  description: string;
  involvedFactions: string[];
  impactOnWorld: WorldImpact;
  archaeologicalEvidence: Array<{ x: number; y: number }>;
  causedBy: string[];
  leadsTo: string[];
}

export interface WorldImpact {
  significance: number; // 0-1
  unlockedAbility?: string;
  description: string;
}

export interface Conflict {
  id: string;
  name: string;
  factions: string[];
  description: string;
  tension: number; // 0-1
}

export interface Faction {
  id: string;
  name: string;
  description: string;
  relationships: Map<string, number>; // factionId -> relationship score
  members: string[]; // character IDs
}

export interface WorldSecret {
  id: string;
  name: string;
  description: string;
  revealed: boolean;
  discoveryConditions: string[];
}

export interface PlayerReputation {
  factionReputations: Map<string, number>; // factionId -> reputation (-100 to 100)
  moralAlignment: Map<string, number>; // alignment -> score
  reputationHistory: ReputationEvent[];
}

export interface ReputationEvent {
  faction: string;
  change: number;
  reason: string;
  timestamp: number;
}

export interface PlayerChoice {
  id: string;
  choiceId: string;
  option: string;
  timestamp: number;
  consequences: string[];
}

export class NarrativeManager {
  private llm: LLMIntegration;
  private loreGenerator: LoreGenerator;
  private mysterySystem: MysterySystem;
  private playerNarrative: PlayerDrivenNarrative;
  private emotionalBeats: EmotionalBeatSystem;
  private worldState: WorldStateNarrative;

  public worldLore: WorldLore | null = null;
  public activeArcs: StoryArc[] = [];
  public factions: Map<string, Faction> = new Map();
  public characters: Map<string, Character> = new Map();
  public storyNodes: Map<string, StoryNode> = new Map();
  public history: Map<string, HistoricalEvent> = new Map();
  public playerReputation: PlayerReputation;
  public majorChoices: PlayerChoice[] = [];
  public worldStateTension: number = 0.5;

  constructor(llmConfig?: any) {
    this.llm = new LLMIntegration({
      provider: llmConfig?.provider || 'google',
      apiKey: llmConfig?.apiKey,
      temperature: 0.7,
      maxTokens: 500
    });

    this.loreGenerator = new LoreGenerator(this.llm);
    this.mysterySystem = new MysterySystem(this.llm);
    this.playerNarrative = new PlayerDrivenNarrative(this.llm);
    this.emotionalBeats = new EmotionalBeatSystem();
    this.worldState = new WorldStateNarrative(this.llm);

    this.playerReputation = {
      factionReputations: new Map(),
      moralAlignment: new Map(),
      reputationHistory: []
    };
  }

  /**
   * Initialize narrative system with world seed
   */
  async initializeNarrative(worldSeed: number, worldData?: any): Promise<void> {
    // Generate world lore
    this.worldLore = await this.loreGenerator.generateWorldLore(worldSeed, worldData);

    // Initialize factions
    await this.initializeFactions();

    // Generate starting story arcs
    await this.generateStartingStoryArcs(worldSeed);

    // Place story elements in world
    this.placeStoryElementsInWorld();

    // Initialize mysteries
    await this.mysterySystem.generateWorldMysteries(worldData || {});

    // Initialize world state narrative
    await this.worldState.initialize(worldData || {});
  }

  /**
   * Initialize factions with relationships
   */
  private async initializeFactions(): Promise<void> {
    if (!this.worldLore) return;

    for (const factionData of this.worldLore.majorFactions) {
      const faction: Faction = {
        id: factionData.id,
        name: factionData.name,
        description: factionData.description,
        relationships: new Map(),
        members: []
      };

      // Initialize relationships with other factions
      for (const otherFaction of this.worldLore.majorFactions) {
        if (otherFaction.id !== faction.id) {
          // Random initial relationship between -50 and 50
          faction.relationships.set(
            otherFaction.id,
            Math.random() * 100 - 50
          );
        }
      }

      this.factions.set(faction.id, faction);
    }
  }

  /**
   * Generate starting story arcs
   */
  private async generateStartingStoryArcs(seed: number): Promise<void> {
    // Generate 2-3 initial story arcs
    const arcCount = 2 + Math.floor(Math.random() * 2);

    for (let i = 0; i < arcCount; i++) {
      const arc = await StoryArc.generateArc(
        this.llm,
        `initial_arc_${i}`,
        seed + i,
        this.worldLore!
      );
      this.activeArcs.push(arc);
    }
  }

  /**
   * Place story elements in the world
   */
  private placeStoryElementsInWorld(): void {
    // This would integrate with the world/map system
    // For now, we'll just mark story nodes as placed
    for (const arc of this.activeArcs) {
      for (const node of arc.nodes) {
        this.storyNodes.set(node.nodeId, node);
      }
    }
  }

  /**
   * Get active story arcs
   */
  getActiveArcs(): StoryArc[] {
    return this.activeArcs.filter(arc => arc.progress < 1.0);
  }

  /**
   * Get character by ID
   */
  getCharacter(characterId: string): Character | undefined {
    return this.characters.get(characterId);
  }

  /**
   * Add character to narrative system
   */
  addCharacter(character: Character): void {
    this.characters.set(character.characterId, character);
    
    // Add to faction if applicable
    if (character.primaryFaction) {
      const faction = this.factions.get(character.primaryFaction);
      if (faction) {
        faction.members.push(character.characterId);
      }
    }
  }

  /**
   * Update world state tension
   */
  updateWorldTension(delta: number): void {
    this.worldStateTension = Math.max(0, Math.min(1, this.worldStateTension + delta));
    
    // Trigger emotional beats based on tension
    if (this.worldStateTension > 0.8) {
      this.emotionalBeats.triggerTensionBeat('high_tension');
    }
  }

  /**
   * Record player choice
   */
  recordPlayerChoice(choice: PlayerChoice): void {
    this.majorChoices.push(choice);
    this.playerNarrative.onPlayerMajorAction({
      type: 'choice',
      choiceId: choice.choiceId,
      option: choice.option,
      timestamp: choice.timestamp
    });
  }

  /**
   * Update player reputation with faction
   */
  updateReputation(factionId: string, change: number, reason: string): void {
    const current = this.playerReputation.factionReputations.get(factionId) || 0;
    const newReputation = Math.max(-100, Math.min(100, current + change));
    
    this.playerReputation.factionReputations.set(factionId, newReputation);
    this.playerReputation.reputationHistory.push({
      faction: factionId,
      change,
      reason,
      timestamp: Date.now()
    });

    // Check for reputation thresholds
    this.checkReputationThresholds(factionId, newReputation);
  }

  /**
   * Check reputation thresholds for special status
   */
  private checkReputationThresholds(factionId: string, reputation: number): void {
    const faction = this.factions.get(factionId);
    if (!faction) return;

    if (reputation >= 80) {
      // Hero status
      this.playerNarrative.unlockHeroStatus(faction);
    } else if (reputation <= -50) {
      // Enemy status
      this.playerNarrative.becomeFactionEnemy(faction);
    } else if (reputation <= -100) {
      // Permanent enemy
      this.playerNarrative.becomePermanentEnemy(faction);
    }
  }

  /**
   * Get current emotional state
   */
  getCurrentEmotionalState(): { emotion: string; tension: number } {
    return this.emotionalBeats.getCurrentState();
  }

  /**
   * Trigger next emotional beat
   */
  triggerEmotionalBeat(): void {
    this.emotionalBeats.triggerNextBeat();
  }
}

// Re-export StoryNode for convenience
export interface StoryNode {
  nodeId: string;
  title: string;
  description: string;
  type: 'dialogue' | 'combat' | 'exploration' | 'choice' | 'discovery';
  worldLocation?: { x: number; y: number };
  availableChoices: StoryChoice[];
  completionConditions: string[];
  isArcCompletionNode: boolean;
}

export interface StoryChoice {
  choiceText: string;
  immediateConsequence: any;
  longTermConsequence: any;
  nextNodeId?: string;
  moralAlignment: 'good' | 'evil' | 'neutral';
  visibilityConditions: string[];
}

