/**
 * AI Director System
 * Orchestrates game experience like a dungeon master - creates dramatic moments,
 * manages pacing, and ensures engaging gameplay
 */

import type { QuaternionState } from '../strategic/QuaternionState';
import { WorldEventGenerator, type WorldEvent } from './WorldEventGenerator';
import { AdaptiveDifficultyAI } from './AdaptiveDifficultyAI';
import { AdaptiveCombatAI } from './AdaptiveCombatAI';
import { SquadDynamicsAI } from './SquadDynamicsAI';

export interface PlayerState {
  location: { x: number; y: number };
  resources: { matter: number; energy: number; life: number; knowledge: number };
  timeInCurrentArea: number; // seconds
  recentActivity: PlayerActivity[];
  boredomLevel: number; // 0-1
  overwhelmLevel: number; // 0-1
}

export interface PlayerActivity {
  type: 'combat' | 'exploration' | 'building' | 'idle';
  timestamp: number;
  duration: number;
}

export interface DramaticEncounter {
  id: string;
  location: { x: number; y: number };
  type: 'combat' | 'discovery' | 'dilemma' | 'escape';
  participants: string[]; // unit IDs
  environmentalHazards: string[];
  staging: EncounterStaging;
  resolution?: string;
}

export interface EncounterStaging {
  cameraAngle?: 'low' | 'high' | 'dramatic';
  lighting?: 'dim' | 'bright' | 'dramatic';
  music?: 'tension' | 'action' | 'mystery';
  timing?: 'immediate' | 'delayed';
}

export class AIDirector {
  private worldEvents: WorldEventGenerator;
  private difficultyAI: AdaptiveDifficultyAI;
  private combatAI: AdaptiveCombatAI;
  private squadAI: SquadDynamicsAI;
  
  private playerState: PlayerState;
  private scheduledEvents: WorldEvent[] = [];
  private lastBoredomCheck: number = 0;
  private lastOverwhelmCheck: number = 0;

  constructor() {
    this.worldEvents = new WorldEventGenerator();
    this.difficultyAI = new AdaptiveDifficultyAI();
    this.combatAI = new AdaptiveCombatAI();
    this.squadAI = new SquadDynamicsAI(this.combatAI);
    
    this.playerState = {
      location: { x: 0, y: 0 },
      resources: { matter: 0, energy: 0, life: 0, knowledge: 0 },
      timeInCurrentArea: 0,
      recentActivity: [],
      boredomLevel: 0,
      overwhelmLevel: 0
    };
  }

  /**
   * Main orchestration loop
   */
  orchestrateGameExperience(
    gameState: QuaternionState,
    playerState: Partial<PlayerState>
  ): void {
    // Update player state
    this.playerState = { ...this.playerState, ...playerState };

    // Check for boredom
    if (this.isPlayerBored()) {
      this.scheduleExcitingEvent();
    }

    // Check for overwhelm
    if (this.isPlayerOverwhelmed()) {
      this.provideRespitePeriod();
    }

    // Check if player has been in same area too long
    if (this.playerState.timeInCurrentArea > 300) { // 5 minutes
      this.generateReasonToMove();
    }

    // Create hero moments at interesting locations
    if (this.isInInterestingLocation()) {
      this.setupDramaticEncounter();
    }

    // Generate world events
    this.worldEvents.generateDynamicEvents(
      {
        resources: this.playerState.resources,
        reputation: new Map(),
        currentLocation: this.playerState.location,
        playstyle: {
          prefersStealth: this.detectStealthPlaystyle(),
          prefersAggression: this.detectAggressivePlaystyle(),
          explorationTime: this.getActivityTime('exploration'),
          combatTime: this.getActivityTime('combat')
        }
      },
      gameState
    );
  }

  /**
   * Check if player is bored
   */
  private isPlayerBored(): boolean {
    const now = Date.now();
    
    // Check every 30 seconds
    if (now - this.lastBoredomCheck < 30000) {
      return this.playerState.boredomLevel > 0.7;
    }

    this.lastBoredomCheck = now;

    // Calculate boredom from recent activity
    const recentActivity = this.playerState.recentActivity.filter(
      a => now - a.timestamp < 60000 // Last minute
    );

    if (recentActivity.length === 0) {
      this.playerState.boredomLevel = Math.min(1, this.playerState.boredomLevel + 0.1);
    } else {
      this.playerState.boredomLevel = Math.max(0, this.playerState.boredomLevel - 0.1);
    }

    return this.playerState.boredomLevel > 0.7;
  }

  /**
   * Check if player is overwhelmed
   */
  private isPlayerOverwhelmed(): boolean {
    const now = Date.now();
    
    // Check every 20 seconds
    if (now - this.lastOverwhelmCheck < 20000) {
      return this.playerState.overwhelmLevel > 0.7;
    }

    this.lastOverwhelmCheck = now;

    // Calculate overwhelm from active events and combat
    const activeEvents = this.worldEvents.getActiveEvents();
    const combatActivity = this.getActivityTime('combat');
    
    if (activeEvents.length > 3 || combatActivity > 120) {
      this.playerState.overwhelmLevel = Math.min(1, this.playerState.overwhelmLevel + 0.15);
    } else {
      this.playerState.overwhelmLevel = Math.max(0, this.playerState.overwhelmLevel - 0.1);
    }

    return this.playerState.overwhelmLevel > 0.7;
  }

  /**
   * Schedule exciting event
   */
  private scheduleExcitingEvent(): void {
    // Generate combat encounter or discovery
    const eventType = Math.random() < 0.6 ? 'combat' : 'discovery';
    
    if (eventType === 'combat') {
      this.createCombatEncounter();
    } else {
      this.createDiscoveryEvent();
    }

    this.playerState.boredomLevel = 0; // Reset boredom
  }

  /**
   * Provide respite period
   */
  private provideRespitePeriod(): void {
    // Reduce active events, lower difficulty temporarily
    const activeEvents = this.worldEvents.getActiveEvents();
    
    // Deactivate some events
    activeEvents.slice(0, Math.floor(activeEvents.length / 2)).forEach(event => {
      this.worldEvents.deactivateEvent(event.id);
    });

    // Temporarily lower challenge
    // This would integrate with difficulty system

    this.playerState.overwhelmLevel = 0.3; // Reduce overwhelm
  }

  /**
   * Generate reason to move
   */
  private generateReasonToMove(): void {
    // Create event that encourages movement
    const event: WorldEvent = {
      id: `event_move_${Date.now()}`,
      type: 'discovery' as any,
      location: this.findDistantLocation(),
      description: 'Unusual activity detected in a new area. Investigate?',
      active: true
    };

    // Activate event through world events system
    this.worldEvents.activateEvent(event);
    this.playerState.timeInCurrentArea = 0; // Reset timer
  }

  /**
   * Setup dramatic encounter
   */
  private setupDramaticEncounter(): void {
    const encounter: DramaticEncounter = {
      id: `encounter_${Date.now()}`,
      location: this.playerState.location,
      type: this.selectEncounterType(),
      participants: [], // Would populate with actual units
      environmentalHazards: [],
      staging: {
        cameraAngle: 'dramatic',
        lighting: 'dramatic',
        music: 'tension',
        timing: 'immediate'
      }
    };

    this.activateDramaticEncounter(encounter);
  }

  /**
   * Select encounter type
   */
  private selectEncounterType(): DramaticEncounter['type'] {
    const types: DramaticEncounter['type'][] = ['combat', 'discovery', 'dilemma', 'escape'];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Activate dramatic encounter
   */
  private activateDramaticEncounter(encounter: DramaticEncounter): void {
    // This would trigger cinematic camera, music, etc.
    console.log(`Dramatic encounter activated: ${encounter.type} at ${encounter.location.x}, ${encounter.location.y}`);
    
    // Dispatch event for game systems to handle
    const event = new CustomEvent('dramatic-encounter', {
      detail: encounter
    });
    window.dispatchEvent(event);
  }

  /**
   * Create combat encounter
   */
  private createCombatEncounter(): void {
    const encounter: DramaticEncounter = {
      id: `combat_${Date.now()}`,
      location: this.findNearbyLocation(),
      type: 'combat',
      participants: [],
      environmentalHazards: [],
      staging: {
        cameraAngle: 'dramatic',
        lighting: 'bright',
        music: 'action',
        timing: 'immediate'
      }
    };

    this.activateDramaticEncounter(encounter);
  }

  /**
   * Create discovery event
   */
  private createDiscoveryEvent(): void {
    // Would create a discovery/exploration event
    console.log('Discovery event created');
  }

  /**
   * Detect stealth playstyle
   */
  private detectStealthPlaystyle(): boolean {
    const combatTime = this.getActivityTime('combat');
    const explorationTime = this.getActivityTime('exploration');
    return explorationTime > combatTime * 2;
  }

  /**
   * Detect aggressive playstyle
   */
  private detectAggressivePlaystyle(): boolean {
    const combatTime = this.getActivityTime('combat');
    return combatTime > 180; // More than 3 minutes of combat
  }

  /**
   * Get activity time for type
   */
  private getActivityTime(type: PlayerActivity['type']): number {
    const now = Date.now();
    return this.playerState.recentActivity
      .filter(a => a.type === type && now - a.timestamp < 300000) // Last 5 minutes
      .reduce((sum, a) => sum + a.duration, 0);
  }

  /**
   * Check if in interesting location
   */
  private isInInterestingLocation(): boolean {
    // Would check terrain features, proximity to objectives, etc.
    return Math.random() < 0.1; // 10% chance
  }

  /**
   * Find nearby location
   */
  private findNearbyLocation(): { x: number; y: number } {
    return {
      x: this.playerState.location.x + (Math.random() - 0.5) * 200,
      y: this.playerState.location.y + (Math.random() - 0.5) * 200
    };
  }

  /**
   * Find distant location
   */
  private findDistantLocation(): { x: number; y: number } {
    return {
      x: this.playerState.location.x + (Math.random() - 0.5) * 1000,
      y: this.playerState.location.y + (Math.random() - 0.5) * 1000
    };
  }

  /**
   * Record player activity
   */
  recordActivity(activity: PlayerActivity): void {
    this.playerState.recentActivity.push(activity);
    
    // Keep last 50 activities
    if (this.playerState.recentActivity.length > 50) {
      this.playerState.recentActivity.shift();
    }
  }

  /**
   * Get AI systems
   */
  getCombatAI(): AdaptiveCombatAI {
    return this.combatAI;
  }

  getSquadAI(): SquadDynamicsAI {
    return this.squadAI;
  }

  getDifficultyAI(): AdaptiveDifficultyAI {
    return this.difficultyAI;
  }

  getWorldEvents(): WorldEventGenerator {
    return this.worldEvents;
  }
}

