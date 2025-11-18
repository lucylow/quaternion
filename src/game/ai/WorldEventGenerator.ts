/**
 * World Event Generator
 * Creates dynamic, procedural events based on player behavior and game state
 */

import type { QuaternionState } from '../strategic/QuaternionState';

export enum EventType {
  RESOURCE_OPPORTUNITY = 'resource_opportunity',
  HUNTER_BECOMES_HUNTED = 'hunter_becomes_hunted',
  BOUNTY_HUNTER = 'bounty_hunter',
  MYSTERY = 'mystery',
  FACTION_CONFLICT = 'faction_conflict',
  ENVIRONMENTAL_HAZARD = 'environmental_hazard',
  DISCOVERY = 'discovery'
}

export interface WorldEvent {
  id: string;
  type: EventType;
  location: { x: number; y: number };
  description: string;
  duration?: number; // seconds, undefined = permanent
  rewards?: EventReward[];
  requirements?: EventRequirement[];
  active: boolean;
}

export interface EventReward {
  type: 'resource' | 'item' | 'reputation' | 'knowledge';
  value: any;
  description: string;
}

export interface EventRequirement {
  type: 'resource' | 'reputation' | 'location' | 'time';
  value: any;
}

export interface MysteryEvent extends WorldEvent {
  type: EventType.MYSTERY;
  mysteryType: MysteryType;
  clues: MysteryClue[];
  solution?: string;
}

export enum MysteryType {
  MISSING_PERSONS = 'missing_persons',
  SCIENTIFIC_EXPERIMENT = 'scientific_experiment',
  FACTION_CONFLICT = 'faction_conflict',
  SUPERNATURAL_EVENT = 'supernatural_event'
}

export interface MysteryClue {
  id: string;
  description: string;
  location: { x: number; y: number };
  discovered: boolean;
}

export interface PlayerStatus {
  resources: { matter: number; energy: number; life: number; knowledge: number };
  reputation: Map<string, number>; // faction -> reputation
  currentLocation: { x: number; y: number };
  playstyle: PlayerPlaystyle;
  bounty?: number;
}

export interface PlayerPlaystyle {
  prefersStealth: boolean;
  prefersAggression: boolean;
  explorationTime: number; // time spent exploring
  combatTime: number; // time spent in combat
}

export class WorldEventGenerator {
  private activeEvents: Map<string, WorldEvent> = new Map();
  private eventHistory: WorldEvent[] = [];
  private lastEventGeneration: number = 0;
  private eventGenerationInterval: number = 60000; // 60 seconds

  /**
   * Generate dynamic events based on player status
   */
  generateDynamicEvents(playerStatus: PlayerStatus, gameState: QuaternionState): void {
    const now = Date.now();
    
    // Throttle event generation
    if (now - this.lastEventGeneration < this.eventGenerationInterval) {
      return;
    }

    this.lastEventGeneration = now;

    // Check for resource opportunities
    if (this.isLowOnResources(playerStatus)) {
      this.generateResourceOpportunityEvent(playerStatus);
    }

    // Check for stealth counter-events
    if (playerStatus.playstyle.prefersStealth && 
        playerStatus.playstyle.combatTime < playerStatus.playstyle.explorationTime * 0.3) {
      this.generateHunterBecomesHuntedEvent(playerStatus);
    }

    // Check for bounty hunter events
    if (playerStatus.bounty && playerStatus.bounty > 50) {
      this.generateBountyHunterEvent(playerStatus);
    }

    // Random mystery events
    if (Math.random() < 0.3) {
      this.generateMysteryEvent(playerStatus.currentLocation);
    }

    // Environmental hazards based on game state
    if (this.isUnstable(gameState)) {
      this.generateEnvironmentalHazard(playerStatus.currentLocation);
    }
  }

  /**
   * Check if player is low on resources
   */
  private isLowOnResources(playerStatus: PlayerStatus): boolean {
    const total = playerStatus.resources.matter + 
                  playerStatus.resources.energy +
                  playerStatus.resources.life +
                  playerStatus.resources.knowledge;
    return total < 50; // Threshold
  }

  /**
   * Generate resource opportunity event
   */
  private generateResourceOpportunityEvent(playerStatus: PlayerStatus): void {
    const event: WorldEvent = {
      id: `event_resource_${Date.now()}`,
      type: EventType.RESOURCE_OPPORTUNITY,
      location: this.findNearbyLocation(playerStatus.currentLocation, 500),
      description: 'A resource cache has been discovered nearby. Investigate?',
      rewards: [
        {
          type: 'resource',
          value: { matter: 20, energy: 20, life: 20, knowledge: 20 },
          description: 'Resource cache'
        }
      ],
      active: true
    };

    this.activateEvent(event);
  }

  /**
   * Generate hunter becomes hunted event
   */
  private generateHunterBecomesHuntedEvent(playerStatus: PlayerStatus): void {
    const event: WorldEvent = {
      id: `event_hunter_${Date.now()}`,
      type: EventType.HUNTER_BECOMES_HUNTED,
      location: playerStatus.currentLocation,
      description: 'Specialized counter-stealth units have been deployed to track you.',
      active: true,
      duration: 300000 // 5 minutes
    };

    this.activateEvent(event);
    console.log('Hunter becomes hunted event activated - stealth counter units deployed');
  }

  /**
   * Generate bounty hunter event
   */
  private generateBountyHunterEvent(playerStatus: PlayerStatus): void {
    const event: WorldEvent = {
      id: `event_bounty_${Date.now()}`,
      type: EventType.BOUNTY_HUNTER,
      location: this.findNearbyLocation(playerStatus.currentLocation, 300),
      description: `Bounty hunters are closing in. Your bounty: ${playerStatus.bounty}`,
      active: true,
      duration: 600000 // 10 minutes
    };

    this.activateEvent(event);
  }

  /**
   * Generate mystery event
   */
  private generateMysteryEvent(location: { x: number; y: number }): void {
    const mysteryTypes = Object.values(MysteryType);
    const mysteryType = mysteryTypes[Math.floor(Math.random() * mysteryTypes.length)];

    const clues = this.generateClueChain(mysteryType, location);

    const mystery: MysteryEvent = {
      id: `event_mystery_${Date.now()}`,
      type: EventType.MYSTERY,
      mysteryType,
      location: this.findInterestingLocationNear(location),
      description: this.getMysteryDescription(mysteryType),
      clues,
      active: true
    };

    this.activateEvent(mystery);
  }

  /**
   * Generate clue chain for mystery
   */
  private generateClueChain(mysteryType: MysteryType, baseLocation: { x: number; y: number }): MysteryClue[] {
    const clueCount = 3 + Math.floor(Math.random() * 3); // 3-5 clues
    const clues: MysteryClue[] = [];

    for (let i = 0; i < clueCount; i++) {
      clues.push({
        id: `clue_${i}`,
        description: this.generateClueDescription(mysteryType, i),
        location: this.findNearbyLocation(baseLocation, 200 + i * 100),
        discovered: false
      });
    }

    return clues;
  }

  /**
   * Generate clue description
   */
  private generateClueDescription(mysteryType: MysteryType, index: number): string {
    const descriptions: Record<MysteryType, string[]> = {
      [MysteryType.MISSING_PERSONS]: [
        'Abandoned personal belongings',
        'Disturbed ground',
        'Faded distress signal',
        'Last known location marker',
        'Witness testimony fragment'
      ],
      [MysteryType.SCIENTIFIC_EXPERIMENT]: [
        'Strange energy readings',
        'Experimental equipment',
        'Research notes',
        'Containment breach evidence',
        'Anomalous readings'
      ],
      [MysteryType.FACTION_CONFLICT]: [
        'Weapon casings from multiple factions',
        'Encrypted communication logs',
        'Territory dispute markers',
        'Witness accounts',
        'Strategic positioning evidence'
      ],
      [MysteryType.SUPERNATURAL_EVENT]: [
        'Unexplained energy signatures',
        'Reality distortion markers',
        'Temporal anomalies',
        'Dimensional rifts',
        'Paranormal activity reports'
      ]
    };

    const options = descriptions[mysteryType] || descriptions[MysteryType.MISSING_PERSONS];
    return options[index % options.length];
  }

  /**
   * Get mystery description
   */
  private getMysteryDescription(mysteryType: MysteryType): string {
    const descriptions: Record<MysteryType, string> = {
      [MysteryType.MISSING_PERSONS]: 'Several people have gone missing in this area. Investigate?',
      [MysteryType.SCIENTIFIC_EXPERIMENT]: 'Strange scientific activity detected. What experiments were conducted here?',
      [MysteryType.FACTION_CONFLICT]: 'Evidence of a major conflict between factions. Discover the truth?',
      [MysteryType.SUPERNATURAL_EVENT]: 'Unexplained phenomena reported. Investigate the anomaly?'
    };

    return descriptions[mysteryType] || 'A mystery has been discovered.';
  }

  /**
   * Generate environmental hazard
   */
  private generateEnvironmentalHazard(location: { x: number; y: number }): void {
    const event: WorldEvent = {
      id: `event_hazard_${Date.now()}`,
      type: EventType.ENVIRONMENTAL_HAZARD,
      location,
      description: 'Environmental instability detected. Hazardous conditions ahead.',
      active: true,
      duration: 180000 // 3 minutes
    };

    this.activateEvent(event);
  }

  /**
   * Check if game state is unstable
   */
  private isUnstable(gameState: QuaternionState): boolean {
    const { w, x, y, z } = gameState;
    const total = Math.abs(w) + Math.abs(x) + Math.abs(y) + Math.abs(z);
    
    if (total === 0) return false;

    const avg = total / 4;
    const variance = Math.sqrt(
      (Math.pow(Math.abs(w) - avg, 2) +
       Math.pow(Math.abs(x) - avg, 2) +
       Math.pow(Math.abs(y) - avg, 2) +
       Math.pow(Math.abs(z) - avg, 2)) / 4
    );

    return variance / avg > 0.5; // High variance = unstable
  }

  /**
   * Find nearby location
   */
  private findNearbyLocation(base: { x: number; y: number }, radius: number): { x: number; y: number } {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    
    return {
      x: base.x + Math.cos(angle) * distance,
      y: base.y + Math.sin(angle) * distance
    };
  }

  /**
   * Find interesting location near base
   */
  private findInterestingLocationNear(base: { x: number; y: number }): { x: number; y: number } {
    // Would integrate with terrain system to find interesting locations
    return this.findNearbyLocation(base, 400);
  }

  /**
   * Activate event
   */
  activateEvent(event: WorldEvent): void {
    this.activeEvents.set(event.id, event);
    this.eventHistory.push(event);

    // Auto-remove after duration
    if (event.duration) {
      setTimeout(() => {
        this.deactivateEvent(event.id);
      }, event.duration);
    }
  }

  /**
   * Deactivate event
   */
  deactivateEvent(eventId: string): void {
    const event = this.activeEvents.get(eventId);
    if (event) {
      event.active = false;
      this.activeEvents.delete(eventId);
    }
  }

  /**
   * Get active events
   */
  getActiveEvents(): WorldEvent[] {
    return Array.from(this.activeEvents.values()).filter(e => e.active);
  }

  /**
   * Get event by ID
   */
  getEvent(eventId: string): WorldEvent | undefined {
    return this.activeEvents.get(eventId);
  }
}

