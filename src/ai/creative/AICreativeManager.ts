/**
 * AI Creative Manager
 * Central coordinator for all AI creative features
 * Integrates world generation, commanders, voice, music, lore, and core
 */

import { AIWorldGenerator, WorldPrompt, GeneratedWorld } from './AIWorldGenerator';
import { AdaptiveCommanderAI, QuaternionAxis } from './AdaptiveCommanderAI';
import { AIVoiceController, VoiceTone } from './AIVoiceController';
import { AdaptiveMusicMixer, GameStateMetrics } from './AdaptiveMusicMixer';
import { LoreEngine, WorldChronicle } from './LoreEngine';
import { QuaternionCore, CoreJudgment } from './QuaternionCore';

export interface AICreativeConfig {
  llm?: {
    provider: 'google' | 'saga' | 'openai';
    apiKey?: string;
  };
  elevenLabs?: {
    apiKey?: string;
  };
  music?: {
    provider: 'fuser' | 'custom';
    apiKey?: string;
  };
}

export interface GameState {
  gameTime: number;
  players: Map<number, any>;
  resources: Record<string, number>;
  units: any[];
  buildings: any[];
  mapTheme?: string;
}

/**
 * AI Creative Manager
 * Orchestrates all creative AI systems
 */
export class AICreativeManager {
  private worldGenerator: AIWorldGenerator;
  private commanders: Map<string, AdaptiveCommanderAI> = new Map();
  private voiceController: AIVoiceController;
  private musicMixer: AdaptiveMusicMixer;
  private loreEngine: LoreEngine;
  private quaternionCore: QuaternionCore;
  private currentWorld: GeneratedWorld | null = null;
  private currentChronicle: WorldChronicle | null = null;

  constructor(config: AICreativeConfig = {}) {
    // Initialize all systems
    this.worldGenerator = new AIWorldGenerator(config.llm);
    this.voiceController = new AIVoiceController(config.elevenLabs);
    this.musicMixer = new AdaptiveMusicMixer(config.music || { provider: 'custom' });
    this.loreEngine = new LoreEngine(config.llm);
    this.quaternionCore = new QuaternionCore(config.llm);
  }

  /**
   * Generate complete game world from prompt
   */
  async generateWorld(prompt: WorldPrompt): Promise<GeneratedWorld> {
    console.log('🌍 Generating AI world...');
    
    this.currentWorld = await this.worldGenerator.generateWorld(prompt);
    
    // Generate world chronicle
    this.currentChronicle = await this.loreEngine.generateWorldChronicle(
      prompt.seed,
      prompt.descriptor,
      this.currentWorld.metadata.strategicPersonality
    );

    // Generate map music
    await this.musicMixer.generateMapMusic(
      prompt.descriptor,
      prompt.seed
    );

    // Narrate world creation
    if (this.currentChronicle.lore.length > 0) {
      const loreText = this.currentChronicle.lore[0].content;
      await this.voiceController.speak(
        loreText,
        'narrator',
        VoiceTone.Calm
      );
    }

    return this.currentWorld;
  }

  /**
   * Create adaptive commander
   */
  createCommander(
    name: string,
    initialWeights?: number[]
  ): AdaptiveCommanderAI {
    const commander = new AdaptiveCommanderAI(
      name,
      initialWeights,
      { provider: 'google', apiKey: process.env.GOOGLE_AI_API_KEY }
    );

    this.commanders.set(name, commander);
    return commander;
  }

  /**
   * Update game state (call every tick)
   */
  async updateGameState(gameState: GameState): Promise<void> {
    // Update music based on game state
    const metrics = this.calculateGameMetrics(gameState);
    await this.musicMixer.updateState(metrics);

    // Update voice tone based on state
    const tone = this.determineVoiceTone(metrics);
    this.voiceController.setTone(tone);

    // Generate dynamic events
    if (gameState.mapTheme) {
      const events = await this.loreEngine.generateEventNarrative(
        `Game state: ${JSON.stringify(metrics)}`,
        gameState
      );

      if (events) {
        // Narrate event
        await this.voiceController.speak(
          events.content,
          'narrator',
          this.getToneForEvent(events.type)
        );
      }
    }

    // Update Quaternion Core
    // (In production, you'd track player actions and update core)
  }

  /**
   * Calculate game state metrics
   */
  private calculateGameMetrics(gameState: GameState): GameStateMetrics {
    const resources = gameState.resources || {};
    const totalResources = Object.values(resources).reduce((a: number, b: any) => 
      a + (typeof b === 'number' ? b : 0), 0
    );

    // Calculate equilibrium (how balanced resources are)
    const resourceValues = Object.values(resources).map((v: any) => typeof v === 'number' ? v : 0);
    const mean = resourceValues.reduce((a, b) => a + b, 0) / Math.max(resourceValues.length, 1);
    const variance = resourceValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / Math.max(resourceValues.length, 1);
    const equilibrium = 1 - Math.min(1, variance / (mean * mean + 1));

    // Calculate chaos (instability)
    const chaos = 1 - equilibrium;

    // Calculate tension (combat intensity)
    const totalUnits = (gameState.units?.length || 0);
    const tension = Math.min(1, totalUnits / 50);

    return {
      equilibrium,
      chaos,
      tension,
      energyCrisis: (resources.energy || 0) < 20,
      biomassGrowth: (resources.biomass || 0) > 100,
      imbalance: equilibrium < 0.3
    };
  }

  /**
   * Determine voice tone from metrics
   */
  private determineVoiceTone(metrics: GameStateMetrics): VoiceTone {
    if (metrics.chaos > 0.7) return VoiceTone.Panicked;
    if (metrics.energyCrisis) return VoiceTone.Worried;
    if (metrics.equilibrium > 0.7) return VoiceTone.Calm;
    if (metrics.tension > 0.7) return VoiceTone.Excited;
    return VoiceTone.Neutral;
  }

  /**
   * Get tone for event type
   */
  private getToneForEvent(type: string): VoiceTone {
    switch (type) {
      case 'myth':
      case 'backstory':
        return VoiceTone.Calm;
      case 'event':
        return VoiceTone.Excited;
      case 'reflection':
        return VoiceTone.Neutral;
      default:
        return VoiceTone.Neutral;
    }
  }

  /**
   * Record player action
   */
  recordPlayerAction(
    action: string,
    axis: 'matter' | 'energy' | 'life' | 'knowledge',
    impact: number,
    moralAlignment?: 'positive' | 'neutral' | 'negative'
  ): void {
    // Update Quaternion Core
    this.quaternionCore.recordAction(action, axis, impact);

    // Update moral memory
    if (moralAlignment) {
      const playerId = localStorage.getItem('playerId') || 'default';
      this.loreEngine.recordPlayerAction(playerId, action, moralAlignment);
    }
  }

  /**
   * Evaluate endgame
   */
  async evaluateEndgame(victory: boolean): Promise<CoreJudgment> {
    const judgment = await this.quaternionCore.evaluateEndgame(victory);

    // Generate moral reflection
    const playerId = localStorage.getItem('playerId') || 'default';
    const reflection = await this.loreEngine.generateMoralReflection(playerId);

    if (reflection) {
      // Narrate reflection
      await this.voiceController.speak(
        reflection.content,
        'narrator',
        VoiceTone.Neutral
      );
    }

    // Narrate core judgment
    await this.voiceController.speak(
      judgment.monologue,
      'narrator',
      victory ? VoiceTone.Triumphant : VoiceTone.Neutral
    );

    // Play victory/defeat theme
    await this.musicMixer.playVictoryTheme(victory);

    return judgment;
  }

  /**
   * Get commander tactical comment
   */
  async getCommanderComment(
    commanderName: string,
    context: { currentState: string; playerActions: string[]; axisBalance: number[] }
  ): Promise<string> {
    const commander = this.commanders.get(commanderName);
    if (!commander) {
      return '';
    }

    const comment = await commander.getTacticalComment(context);
    
    // Narrate comment
    await this.voiceController.speak(
      comment.text,
      'economist', // Use appropriate voice profile
      VoiceTone.Neutral
    );

    return comment.text;
  }

  /**
   * Get current world
   */
  getCurrentWorld(): GeneratedWorld | null {
    return this.currentWorld;
  }

  /**
   * Get current chronicle
   */
  getCurrentChronicle(): WorldChronicle | null {
    return this.currentChronicle;
  }

  /**
   * Get all commanders
   */
  getCommanders(): AdaptiveCommanderAI[] {
    return Array.from(this.commanders.values());
  }

  /**
   * Stop all systems
   */
  stopAll(): void {
    this.voiceController.stop();
    this.musicMixer.stopAll();
  }
}

