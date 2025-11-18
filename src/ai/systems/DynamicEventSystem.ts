/**
 * Dynamic Environmental Events System
 * Generates procedurally-triggered events with AI narratives
 */

import { LLMIntegration, EventNarrative } from '../integrations/LLMIntegration';
import { ElevenLabsIntegration } from '../integrations/ElevenLabsIntegration';

export interface GameEvent {
  id: string;
  type: 'terrain' | 'combat' | 'resource' | 'narrative';
  narrative: EventNarrative;
  timestamp: number;
  impact: 'low' | 'medium' | 'high';
  effects: EventEffect[];
  audioUrl?: string;
}

export interface EventEffect {
  type: 'terrain_modification' | 'resource_boost' | 'unit_spawn' | 'buff' | 'debuff';
  target?: string;
  value?: number;
  description: string;
}

export interface EventTrigger {
  condition: (gameState: any) => boolean;
  cooldown: number;
  lastTriggered: number;
  weight: number;
}

export class DynamicEventSystem {
  private llm: LLMIntegration | null = null;
  private elevenLabs: ElevenLabsIntegration | null = null;
  private events: GameEvent[] = [];
  private triggers: EventTrigger[] = [];
  private eventHistory: GameEvent[] = [];

  constructor(
    llmConfig?: { provider: 'google' | 'saga' | 'openai'; apiKey?: string },
    elevenLabsConfig?: { apiKey?: string }
  ) {
    if (llmConfig) {
      this.llm = new LLMIntegration({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        temperature: 0.8,
        maxTokens: 200
      });
    }

    if (elevenLabsConfig) {
      this.elevenLabs = new ElevenLabsIntegration(elevenLabsConfig);
    }

    this.initializeTriggers();
  }

  /**
   * Initialize event triggers
   */
  private initializeTriggers(): void {
    // Terrain events - every 3-5 minutes
    this.triggers.push({
      condition: (gameState) => {
        const time = gameState.gameTime || 0;
        return time > 180 && time % 300 < 60; // Every ~5 minutes
      },
      cooldown: 300000, // 5 minutes
      lastTriggered: 0,
      weight: 0.3
    });

    // Resource events - when player is low on resources
    this.triggers.push({
      condition: (gameState) => {
        const player = gameState.players?.get(1);
        if (!player) return false;
        const totalResources = Object.values(player.resources || {}).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0) as number;
        return totalResources < 100;
      },
      cooldown: 120000, // 2 minutes
      lastTriggered: 0,
      weight: 0.4
    });

    // Combat events - during intense battles
    this.triggers.push({
      condition: (gameState) => {
        const player = gameState.players?.get(1);
        const ai = gameState.players?.get(2);
        if (!player || !ai) return false;
        const totalUnits = (player.units?.length || 0) + (ai.units?.length || 0);
        return totalUnits > 20;
      },
      cooldown: 180000, // 3 minutes
      lastTriggered: 0,
      weight: 0.3
    });
  }

  /**
   * Update event system (call every game tick)
   */
  async update(gameState: any, mapTheme: string): Promise<GameEvent[]> {
    const newEvents: GameEvent[] = [];
    const currentTime = Date.now();

    // Check triggers
    for (const trigger of this.triggers) {
      if (trigger.condition(gameState)) {
        if (currentTime - trigger.lastTriggered >= trigger.cooldown) {
          const event = await this.generateEvent(gameState, mapTheme, trigger);
          if (event) {
            newEvents.push(event);
            trigger.lastTriggered = currentTime;
          }
        }
      }
    }

    // Add new events
    this.events.push(...newEvents);
    this.eventHistory.push(...newEvents);

    // Remove old events (keep last 10)
    if (this.events.length > 10) {
      this.events = this.events.slice(-10);
    }

    return newEvents;
  }

  /**
   * Generate a new event
   */
  private async generateEvent(
    gameState: any,
    mapTheme: string,
    trigger: EventTrigger
  ): Promise<GameEvent | null> {
    const player = gameState.players?.get(1);
    if (!player) return null;

    // Generate narrative using LLM
    let narrative: EventNarrative;
    if (this.llm) {
      try {
        narrative = await this.llm.generateEventNarrative(
          mapTheme,
          gameState.gameTime || 0,
          {
            resources: player.resources || {},
            units: player.units?.length || 0,
            buildings: player.buildings?.length || 0
          }
        );
      } catch (error) {
        console.warn('LLM event generation failed, using fallback', error);
        narrative = this.getFallbackEvent();
      }
    } else {
      narrative = this.getFallbackEvent();
    }

    // Generate voice narration
    let audioUrl: string | undefined;
    if (this.elevenLabs && narrative.text) {
      try {
        audioUrl = await this.elevenLabs.generateBattleNarration(narrative.text);
      } catch (error) {
        console.warn('ElevenLabs narration failed', error);
      }
    }

    // Create event effects based on narrative
    const effects = this.generateEventEffects(narrative, gameState);

    const event: GameEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: narrative.type,
      narrative,
      timestamp: Date.now(),
      impact: narrative.impact,
      effects,
      audioUrl
    };

    return event;
  }

  /**
   * Generate event effects from narrative
   */
  private generateEventEffects(
    narrative: EventNarrative,
    gameState: any
  ): EventEffect[] {
    const effects: EventEffect[] = [];

    // Parse narrative text for effects
    const text = narrative.text.toLowerCase();

    // Terrain modifications
    if (text.includes('fracture') || text.includes('collapse') || text.includes('opens')) {
      effects.push({
        type: 'terrain_modification',
        description: 'Terrain shifts, creating new passage',
        value: 1
      });
    }

    // Resource boosts
    if (text.includes('deposit') || text.includes('vein') || text.includes('discover')) {
      effects.push({
        type: 'resource_boost',
        description: 'New resource deposit discovered',
        value: 50
      });
    }

    // Unit spawns
    if (text.includes('reinforce') || text.includes('arrive') || text.includes('emerges')) {
      effects.push({
        type: 'unit_spawn',
        description: 'Reinforcements arrive',
        value: 3
      });
    }

    // Buffs/debuffs
    if (text.includes('boost') || text.includes('enhance')) {
      effects.push({
        type: 'buff',
        description: 'Temporary combat boost',
        value: 0.2
      });
    }

    if (text.includes('weaken') || text.includes('damage') || text.includes('hazard')) {
      effects.push({
        type: 'debuff',
        description: 'Environmental hazard',
        value: -0.1
      });
    }

    return effects;
  }

  /**
   * Apply event effects to game state
   */
  applyEventEffects(event: GameEvent, gameState: any): void {
    event.effects.forEach(effect => {
      switch (effect.type) {
        case 'terrain_modification':
          // Modify terrain (implementation depends on terrain system)
          this.modifyTerrain(gameState, effect);
          break;

        case 'resource_boost': {
          // Add resources to player
          const player = gameState.players?.get(1);
          if (player && player.resources) {
            // Distribute boost across resources
            const resourceTypes = Object.keys(player.resources);
            resourceTypes.forEach(type => {
              player.resources[type] = (player.resources[type] || 0) + (effect.value || 0) / resourceTypes.length;
            });
          }
          break;
        }

        case 'unit_spawn':
          // Spawn units (implementation depends on unit system)
          this.spawnUnits(gameState, effect);
          break;

        case 'buff':
        case 'debuff':
          // Apply temporary modifier
          this.applyModifier(gameState, effect);
          break;
      }
    });
  }

  /**
   * Modify terrain (placeholder - integrate with actual terrain system)
   */
  private modifyTerrain(gameState: any, effect: EventEffect): void {
    // This would integrate with the actual terrain modification system
    console.log('Terrain modification:', effect.description);
  }

  /**
   * Spawn units (placeholder - integrate with actual unit system)
   */
  private spawnUnits(gameState: any, effect: EventEffect): void {
    // This would integrate with the actual unit spawning system
    console.log('Unit spawn:', effect.description);
  }

  /**
   * Apply modifier (placeholder - integrate with actual modifier system)
   */
  private applyModifier(gameState: any, effect: EventEffect): void {
    // This would integrate with the actual modifier system
    console.log('Modifier applied:', effect.description);
  }

  /**
   * Get fallback event
   */
  private getFallbackEvent(): EventNarrative {
    const fallbacks: EventNarrative[] = [
      {
        text: 'The terrain shifts, creating new tactical opportunities.',
        type: 'terrain',
        impact: 'medium'
      },
      {
        text: 'A resource deposit is discovered nearby.',
        type: 'resource',
        impact: 'low'
      },
      {
        text: 'The battlefield trembles with new possibilities.',
        type: 'narrative',
        impact: 'low'
      }
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 5): GameEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Get event history
   */
  getEventHistory(): GameEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Clear events
   */
  clearEvents(): void {
    this.events = [];
    this.eventHistory = [];
  }
}

