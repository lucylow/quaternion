/**
 * AI Integration Manager
 * Central coordinator for all AI systems in Quaternion
 */

import { LLMIntegration } from './integrations/LLMIntegration';
import { ElevenLabsIntegration } from './integrations/ElevenLabsIntegration';
import { MusicIntegration } from './integrations/MusicIntegration';
import { ProceduralGenerationSystem } from './systems/ProceduralGenerationSystem';
import { EnhancedCommanderSystem } from './systems/EnhancedCommanderSystem';
import { DynamicEventSystem } from './systems/DynamicEventSystem';
import { DataLogger } from './systems/DataLogger';

export interface AIConfig {
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
  enabled: {
    proceduralGeneration: boolean;
    commanderAI: boolean;
    voiceNarration: boolean;
    adaptiveMusic: boolean;
    dynamicEvents: boolean;
  };
}

export class AIIntegrationManager {
  private config: AIConfig;
  private llm: LLMIntegration | null = null;
  private elevenLabs: ElevenLabsIntegration | null = null;
  private music: MusicIntegration | null = null;
  private proceduralGen: ProceduralGenerationSystem | null = null;
  private commanderSystem: EnhancedCommanderSystem | null = null;
  private eventSystem: DynamicEventSystem | null = null;
  private dataLogger: DataLogger;

  constructor(config: AIConfig) {
    this.config = config;
    this.dataLogger = new DataLogger();

    // Initialize LLM
    if (config.llm && config.enabled.proceduralGeneration) {
      this.llm = new LLMIntegration({
        provider: config.llm.provider,
        apiKey: config.llm.apiKey,
        temperature: 0.7,
        maxTokens: 500
      });
    }

    // Initialize ElevenLabs
    if (config.elevenLabs && config.enabled.voiceNarration) {
      this.elevenLabs = new ElevenLabsIntegration(config.elevenLabs);
    }

    // Initialize Music
    if (config.music && config.enabled.adaptiveMusic) {
      this.music = new MusicIntegration({
        provider: config.music.provider,
        apiKey: config.music.apiKey
      });
    }

    // Initialize systems
    if (config.enabled.proceduralGeneration) {
      this.proceduralGen = new ProceduralGenerationSystem(config.llm);
    }

    if (config.enabled.commanderAI) {
      this.commanderSystem = new EnhancedCommanderSystem(config.llm);
    }

    if (config.enabled.dynamicEvents) {
      this.eventSystem = new DynamicEventSystem(config.llm, config.elevenLabs);
    }
  }

  /**
   * Generate procedural map with AI enhancement
   */
  async generateMap(
    seed: number,
    width: number,
    height: number,
    mapType: string
  ) {
    if (!this.proceduralGen) {
      throw new Error('Procedural generation not enabled');
    }

    const startTime = Date.now();
    try {
      const result = await this.proceduralGen.generateMap({
        seed,
        width,
        height,
        mapType,
        useAI: this.config.enabled.proceduralGeneration && this.llm !== null,
        llmConfig: this.config.llm
      });

      const latency = Date.now() - startTime;
      this.dataLogger.logAICall(
        'ProceduralGeneration',
        { seed, width, height, mapType },
        { theme: result.theme },
        latency,
        true
      );

      return result;
    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.dataLogger.logAICall(
        'ProceduralGeneration',
        { seed, width, height, mapType },
        null,
        latency,
        false,
        error.message
      );
      throw error;
    }
  }

  /**
   * Create AI commander
   */
  async createCommander(
    archetype: string,
    seed: number,
    difficulty: 'easy' | 'medium' | 'hard'
  ) {
    if (!this.commanderSystem) {
      throw new Error('Commander AI not enabled');
    }

    const startTime = Date.now();
    try {
      const commander = await this.commanderSystem.createCommander(
        archetype,
        seed,
        difficulty
      );

      const latency = Date.now() - startTime;
      this.dataLogger.logAICall(
        'CommanderGeneration',
        { archetype, seed, difficulty },
        { personality: commander.personality },
        latency,
        true
      );

      return commander;
    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.dataLogger.logAICall(
        'CommanderGeneration',
        { archetype, seed, difficulty },
        null,
        latency,
        false,
        error.message
      );
      throw error;
    }
  }

  /**
   * Generate battle narration
   */
  async generateBattleNarration(
    text: string,
    voiceType: 'narrator' | 'commander' = 'narrator',
    commanderName?: string
  ): Promise<string | null> {
    if (!this.elevenLabs) {
      return null;
    }

    const startTime = Date.now();
    try {
      let audioUrl: string;
      if (voiceType === 'commander' && commanderName) {
        audioUrl = await this.elevenLabs.generateCommanderDialogue(text, commanderName);
      } else {
        audioUrl = await this.elevenLabs.generateBattleNarration(text);
      }

      const latency = Date.now() - startTime;
      this.dataLogger.logAICall(
        'ElevenLabs',
        { text, voiceType, commanderName },
        { audioUrl: audioUrl.substring(0, 50) + '...' },
        latency,
        true
      );

      return audioUrl;
    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.dataLogger.logAICall(
        'ElevenLabs',
        { text, voiceType, commanderName },
        null,
        latency,
        false,
        error.message
      );
      return null;
    }
  }

  /**
   * Generate battle intro
   */
  async generateBattleIntro(
    mapTheme: string,
    commander1: string,
    commander2: string
  ): Promise<{ text: string; audioUrl?: string }> {
    if (!this.llm) {
      return {
        text: `Two commanders meet on ${mapTheme}—only one will rise.`
      };
    }

    const startTime = Date.now();
    try {
      const text = await this.llm.generateBattleIntro(mapTheme, commander1, commander2);
      
      let audioUrl: string | undefined;
      if (this.elevenLabs) {
        audioUrl = await this.generateBattleNarration(text, 'narrator');
      }

      const latency = Date.now() - startTime;
      this.dataLogger.logAICall(
        'BattleIntro',
        { mapTheme, commander1, commander2 },
        { text },
        latency,
        true
      );

      return { text, audioUrl };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.dataLogger.logAICall(
        'BattleIntro',
        { mapTheme, commander1, commander2 },
        null,
        latency,
        false,
        error.message
      );

      return {
        text: `Two commanders meet on ${mapTheme}—only one will rise.`
      };
    }
  }

  /**
   * Update dynamic events
   */
  async updateEvents(gameState: any, mapTheme: string) {
    if (!this.eventSystem) {
      return [];
    }

    try {
      const events = await this.eventSystem.update(gameState, mapTheme);
      
      events.forEach(event => {
        this.dataLogger.logEvent(event.id, event.type, event.narrative.text);
      });

      return events;
    } catch (error) {
      console.warn('Event system update failed', error);
      return [];
    }
  }

  /**
   * Update adaptive music
   */
  updateMusic(state: { tension: number; intensity: number; mood: 'peaceful' | 'tense' | 'battle' | 'victory' | 'defeat' }) {
    if (this.music) {
      this.music.updateMusic(state);
    }
  }

  /**
   * Start match logging
   */
  startMatch(seed: number, mapTheme?: string, commanders?: string[]): string {
    return this.dataLogger.startMatch(seed, mapTheme, commanders);
  }

  /**
   * End match logging
   */
  endMatch(playerWin: boolean, durationSeconds: number) {
    return this.dataLogger.endMatch(playerWin, durationSeconds);
  }

  /**
   * Get match log
   */
  getMatchLog() {
    return this.dataLogger.getMatchLog();
  }

  /**
   * Export match log
   */
  exportMatchLog() {
    return this.dataLogger.exportMatchLog();
  }

  /**
   * Download match log
   */
  downloadMatchLog(filename?: string) {
    this.dataLogger.downloadMatchLog(filename);
  }

  /**
   * Get AI statistics
   */
  getAIStats() {
    return this.dataLogger.getAIStats();
  }

  /**
   * Get enabled features
   */
  getEnabledFeatures() {
    return { ...this.config.enabled };
  }

  /**
   * Check if AI feature is available
   */
  isFeatureEnabled(feature: keyof AIConfig['enabled']): boolean {
    return this.config.enabled[feature];
  }
}

/**
 * Create default AI integration manager
 * Uses environment variables for API keys
 */
export function createDefaultAIManager(): AIIntegrationManager {
  return new AIIntegrationManager({
    llm: {
      provider: (process.env.LLM_PROVIDER as any) || 'google',
      apiKey: (import.meta?.env?.VITE_Gemini_AI_API_key) ||
              (import.meta?.env?.VITE_GOOGLE_AI_API_KEY) ||
              process.env.GOOGLE_AI_API_KEY || 
              process.env.SAGA_AI_API_KEY
    },
    elevenLabs: {
      apiKey: process.env.ElevenLabs_API_key
    },
    music: {
      provider: 'fuser',
      apiKey: process.env.FUSER_API_KEY
    },
    enabled: {
      proceduralGeneration: true,
      commanderAI: true,
      voiceNarration: true,
      adaptiveMusic: true,
      dynamicEvents: true
    }
  });
}

