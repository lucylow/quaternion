/**
 * AI-Driven Narrative Director
 * Orchestrates all AI narrative systems for dynamic storytelling
 */

import { LLMIntegration } from '@/ai/integrations/LLMIntegration';
import { MemoryManager } from '@/ai/memory/MemoryManager';
import { StoryWeaver } from './StoryWeaver';
import { CharacterAI } from './CharacterAI';

export interface WorldModel {
  currentEra: string;
  activeFactions: string[];
  recentEvents: WorldEvent[];
  globalTension: number; // 0-100
  activeCharacters: string[];
  activeStorylines: ActiveStoryline[];
  activeConflicts: string[];
}

export interface WorldEvent {
  id: string;
  description: string;
  timestamp: number;
  intensity: number; // 0-1
  type: 'combat' | 'discovery' | 'resource' | 'narrative' | 'choice';
}

export interface ActiveStoryline {
  id: string;
  title: string;
  state: 'active' | 'paused' | 'resolved';
  involvedCharacters: string[];
  locations: string[];
  conflict: string;
  emotionalArc: 'sad' | 'hopeful' | 'tense' | 'triumphant' | 'melancholic';
  startTime: number;
}

export interface PlotTwist {
  id: string;
  type: string;
  description: string;
  triggeringCharacter: string;
  emotionalImpact: string;
  newRevelations: string[];
  followupOpportunities: string[];
}

export interface NarrativeTension {
  level: number; // 0-1
  type: 'rising' | 'falling' | 'stable';
  source: string;
}

export interface PlayerProfile {
  dominantArchetype: string;
  preferredPlaystyle: string;
  moralAlignment: number; // -1 to 1
  recentChoices: string[];
  recentActions: string[];
  currentEmotion: EmotionalState;
  activeGoals: string[];
  detectedArchetypes: string[];
}

export interface EmotionalState {
  type: 'neutral' | 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust';
  intensity: number; // 0-1
  getPacingModifier(): number;
}

export class BasicEmotionalState implements EmotionalState {
  type: EmotionalState['type'] = 'neutral';
  intensity: number = 0.5;

  getPacingModifier(): number {
    switch (this.type) {
      case 'joy':
        return 0.2;
      case 'anger':
      case 'fear':
        return -0.3;
      case 'sadness':
        return -0.2;
      default:
        return 0;
    }
  }
}

export class AINarrativeDirector {
  private llm: LLMIntegration;
  private memory: MemoryManager;
  private storyWeaver: StoryWeaver;
  private characterAI: CharacterAI;

  public worldModel: WorldModel;
  public activeStorylines: ActiveStoryline[] = [];
  public pendingTwists: PlotTwist[] = [];
  public currentTension: NarrativeTension;
  public playerProfile: PlayerProfile;

  private plotGenerationInterval: number = 30000; // 30 seconds
  private lastPlotGeneration: number = 0;

  constructor(llmConfig?: any, memoryManager?: MemoryManager) {
    this.llm = new LLMIntegration(llmConfig || {
      provider: 'google',
      temperature: 0.8,
      maxTokens: 1000
    });
    this.memory = memoryManager || new MemoryManager();
    this.storyWeaver = new StoryWeaver(this.llm, this.memory);
    this.characterAI = new CharacterAI(this.llm, this.memory);

    this.worldModel = {
      currentEra: 'exploration',
      activeFactions: [],
      recentEvents: [],
      globalTension: 50,
      activeCharacters: [],
      activeStorylines: [],
      activeConflicts: []
    };

    this.currentTension = {
      level: 0.5,
      type: 'stable',
      source: 'initial'
    };

    this.playerProfile = {
      dominantArchetype: 'balanced',
      preferredPlaystyle: 'strategic',
      moralAlignment: 0,
      recentChoices: [],
      recentActions: [],
      currentEmotion: new BasicEmotionalState(),
      activeGoals: [],
      detectedArchetypes: []
    };
  }

  /**
   * Initialize narrative AI systems
   */
  async initializeNarrativeAI(worldSeed: number): Promise<void> {
    this.worldModel.currentEra = 'exploration';
    this.worldModel.globalTension = 50;
    this.initializePlayerModeling();

    // Start narrative loops
    this.startNarrativeLoops();
  }

  private initializePlayerModeling(): void {
    // Initialize player profile tracking
    this.playerProfile.detectedArchetypes = ['balanced'];
  }

  /**
   * Start background narrative generation loops
   */
  private startNarrativeLoops(): void {
    // These will be called periodically by the game loop
    setInterval(() => {
      this.plotGenerationLoop();
    }, this.plotGenerationInterval);

    setInterval(() => {
      this.characterBehaviorLoop();
    }, 5000); // Every 5 seconds

    setInterval(() => {
      this.tensionManagementLoop();
    }, 10000); // Every 10 seconds
  }

  /**
   * Main plot generation loop
   */
  private async plotGenerationLoop(): Promise<void> {
    if (!this.shouldGenerateNewPlot()) return;

    try {
      await this.generateEmergentPlot();
    } catch (error) {
      console.warn('Plot generation failed:', error);
    }

    if (this.shouldResolvePlot()) {
      await this.resolvePendingPlot();
    }
  }

  /**
   * Character behavior loop
   */
  private async characterBehaviorLoop(): Promise<void> {
    // Update character behaviors based on world state
    const characters = this.worldModel.activeCharacters;
    for (const charId of characters) {
      await this.characterAI.updateCharacterBehavior(charId, this.worldModel, this.playerProfile);
    }
  }

  /**
   * Tension management loop
   */
  private tensionManagementLoop(): void {
    // Calculate and update narrative tension
    const recentIntensity = this.worldModel.recentEvents
      .slice(-5)
      .reduce((sum, e) => sum + e.intensity, 0) / 5;

    const oldTension = this.currentTension.level;
    this.currentTension.level = Math.min(1, Math.max(0, 
      0.7 * oldTension + 0.3 * recentIntensity
    ));

    if (this.currentTension.level > oldTension + 0.1) {
      this.currentTension.type = 'rising';
    } else if (this.currentTension.level < oldTension - 0.1) {
      this.currentTension.type = 'falling';
    } else {
      this.currentTension.type = 'stable';
    }
  }

  private shouldGenerateNewPlot(): boolean {
    // Generate if we have less than 2 active storylines
    // or if the last one was generated more than 30 seconds ago
    const timeSinceLastPlot = Date.now() - this.lastPlotGeneration;
    return this.activeStorylines.length < 2 || timeSinceLastPlot > this.plotGenerationInterval;
  }

  private shouldResolvePlot(): boolean {
    // Resolve a plot if it's been active for more than 5 minutes
    return this.activeStorylines.some(
      story => Date.now() - story.startTime > 300000
    );
  }

  /**
   * Generate a new emergent storyline
   */
  async generateEmergentPlot(): Promise<void> {
    try {
      const storyline = await this.storyWeaver.generateEmergentStoryline(
        this.worldModel,
        this.playerProfile
      );

      this.activeStorylines.push({
        ...storyline,
        state: 'active',
        startTime: Date.now()
      });

      this.worldModel.activeStorylines.push({
        ...storyline,
        state: 'active',
        startTime: Date.now()
      });

      this.lastPlotGeneration = Date.now();

      // Log the event
      this.worldModel.recentEvents.push({
        id: `storyline_${Date.now()}`,
        description: `New storyline: ${storyline.title}`,
        timestamp: Date.now(),
        intensity: 0.4,
        type: 'narrative'
      });
    } catch (error) {
      console.error('Failed to generate emergent plot:', error);
    }
  }

  /**
   * Resolve a pending plot
   */
  async resolvePendingPlot(): Promise<void> {
    const plotToResolve = this.activeStorylines.find(
      story => Date.now() - story.startTime > 300000
    );

    if (!plotToResolve) return;

    plotToResolve.state = 'resolved';
    this.activeStorylines = this.activeStorylines.filter(s => s.id !== plotToResolve.id);

    // Possibly generate a plot twist
    if (Math.random() > 0.5) {
      const twist = await this.storyWeaver.generatePlotTwist(
        plotToResolve,
        this.worldModel
      );
      this.pendingTwists.push(twist);
    }
  }

  /**
   * Update world model with game state
   */
  updateWorldModel(update: Partial<WorldModel>): void {
    this.worldModel = { ...this.worldModel, ...update };
  }

  /**
   * Record player action and update player profile
   */
  recordPlayerAction(action: string, choice?: string): void {
    this.playerProfile.recentActions.push(action);
    if (choice) {
      this.playerProfile.recentChoices.push(choice);
    }

    // Keep only recent actions (last 10)
    if (this.playerProfile.recentActions.length > 10) {
      this.playerProfile.recentActions.shift();
    }
    if (this.playerProfile.recentChoices.length > 10) {
      this.playerProfile.recentChoices.shift();
    }

    // Update world events
    this.worldModel.recentEvents.push({
      id: `action_${Date.now()}`,
      description: action,
      timestamp: Date.now(),
      intensity: 0.3,
      type: 'choice'
    });

    // Limit recent events
    if (this.worldModel.recentEvents.length > 20) {
      this.worldModel.recentEvents.shift();
    }
  }

  /**
   * Get current narrative state for UI
   */
  getNarrativeState() {
    return {
      activeStorylines: this.activeStorylines,
      currentTension: this.currentTension,
      pendingTwists: this.pendingTwists,
      worldModel: this.worldModel
    };
  }
}

