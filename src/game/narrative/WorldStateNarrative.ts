/**
 * World-State Narrative System
 * Manages dynamic world events, faction relationships, and global tensions
 */

import { LLMIntegration } from '../../ai/integrations/LLMIntegration';
import type { Faction } from './NarrativeManager';

export interface WorldState {
  globalTension: number; // 0-1
  factionStates: Map<string, FactionState>;
  activeEvents: WorldStateEvent[];
  currentEra: string;
}

export interface FactionState {
  factionId: string;
  relationships: Map<string, number>; // factionId -> relationship score
  power: number; // 0-1
  influence: number; // 0-1
  goals: string[];
}

export interface WorldStateEvent {
  id: string;
  type: WorldEventType;
  name: string;
  description: string;
  startTime: number;
  endTime?: number;
  involvedFactions: string[];
  impact: number; // 0-1
}

export enum WorldEventType {
  WAR = 'war',
  ALLIANCE = 'alliance',
  TRADE_AGREEMENT = 'trade_agreement',
  DISASTER = 'disaster',
  DISCOVERY = 'discovery',
  FESTIVAL = 'festival',
  CONFLICT = 'conflict'
}

export interface WarEvent extends WorldStateEvent {
  type: WorldEventType.WAR;
  aggressor: string; // factionId
  defender: string; // factionId
  warProgress: number; // -100 to 100
  warGoals: string[];
  currentBattles: Battle[];
}

export interface AllianceEvent extends WorldStateEvent {
  type: WorldEventType.ALLIANCE;
  factions: string[];
  allianceTerms: string[];
}

export interface Battle {
  id: string;
  location: { x: number; y: number };
  participants: string[];
  progress: number; // 0-1
}

export enum InterventionType {
  SUPPORT_AGGRESSOR = 'support_aggressor',
  SUPPORT_DEFENDER = 'support_defender',
  MEDIATE = 'mediate',
  EXPLOIT = 'exploit'
}

export class WorldStateNarrative {
  private llm: LLMIntegration;
  public currentWorldState: WorldState;
  public activeEvents: WorldStateEvent[] = [];
  private eventCheckInterval: number = 60; // seconds
  private lastEventCheck: number = 0;

  constructor(llm: LLMIntegration) {
    this.llm = llm;
    this.currentWorldState = {
      globalTension: 0.5,
      factionStates: new Map(),
      activeEvents: [],
      currentEra: 'modern'
    };
  }

  /**
   * Initialize world state narrative
   */
  async initialize(worldData: any): Promise<void> {
    // Initialize faction states
    // This would be populated from world data
    this.currentWorldState.currentEra = worldData?.currentEra || 'modern';
  }

  /**
   * Update world state
   */
  async updateWorldState(deltaTime: number): Promise<void> {
    this.lastEventCheck += deltaTime;

    if (this.lastEventCheck >= this.eventCheckInterval) {
      // Update faction relationships
      this.updateFactionRelationships();

      // Check for emerging conflicts
      this.checkForEmergingConflicts();

      // Update global tensions
      this.updateGlobalTension();

      // Generate world events based on state
      await this.generateWorldEvents();

      this.lastEventCheck = 0;
    }
  }

  /**
   * Update faction relationships
   */
  private updateFactionRelationships(): void {
    for (const [factionIdA, stateA] of this.currentWorldState.factionStates) {
      for (const [factionIdB, stateB] of this.currentWorldState.factionStates) {
        if (factionIdA !== factionIdB) {
          const relationshipChange = this.calculateRelationshipChange(stateA, stateB);
          const currentRelationship = stateA.relationships.get(factionIdB) || 0;
          const newRelationship = Math.max(-100, Math.min(100, currentRelationship + relationshipChange));
          
          stateA.relationships.set(factionIdB, newRelationship);

          // Check for relationship thresholds
          this.checkRelationshipThreshold(factionIdA, factionIdB, newRelationship);
        }
      }
    }
  }

  /**
   * Calculate relationship change
   */
  private calculateRelationshipChange(stateA: FactionState, stateB: FactionState): number {
    // Simple calculation - can be more sophisticated
    // Factors: power balance, goals alignment, recent events
    const powerDifference = Math.abs(stateA.power - stateB.power);
    const change = (Math.random() - 0.5) * 0.1; // Small random change
    
    return change;
  }

  /**
   * Check relationship threshold
   */
  private checkRelationshipThreshold(factionIdA: string, factionIdB: string, relationship: number): void {
    if (relationship <= -80 && !this.hasActiveWar(factionIdA, factionIdB)) {
      // Start a war
      this.startWar(factionIdA, factionIdB);
    } else if (relationship >= 80 && !this.hasActiveAlliance(factionIdA, factionIdB)) {
      // Form an alliance
      this.formAlliance(factionIdA, factionIdB);
    }
  }

  /**
   * Check if active war exists
   */
  private hasActiveWar(factionIdA: string, factionIdB: string): boolean {
    return this.activeEvents.some(event => {
      if (event.type === WorldEventType.WAR) {
        const warEvent = event as WarEvent;
        return (warEvent.aggressor === factionIdA && warEvent.defender === factionIdB) ||
               (warEvent.aggressor === factionIdB && warEvent.defender === factionIdA);
      }
      return false;
    });
  }

  /**
   * Check if active alliance exists
   */
  private hasActiveAlliance(factionIdA: string, factionIdB: string): boolean {
    return this.activeEvents.some(event => {
      if (event.type === WorldEventType.ALLIANCE) {
        const allianceEvent = event as AllianceEvent;
        return allianceEvent.factions.includes(factionIdA) && 
               allianceEvent.factions.includes(factionIdB);
      }
      return false;
    });
  }

  /**
   * Start war
   */
  private startWar(aggressorId: string, defenderId: string): void {
    const war: WarEvent = {
      id: `war_${Date.now()}`,
      type: WorldEventType.WAR,
      name: `War between ${aggressorId} and ${defenderId}`,
      description: `A war has broken out between ${aggressorId} and ${defenderId}.`,
      startTime: Date.now(),
      involvedFactions: [aggressorId, defenderId],
      impact: 0.8,
      aggressor: aggressorId,
      defender: defenderId,
      warProgress: 0,
      warGoals: ['Territory', 'Resources', 'Ideology'],
      currentBattles: []
    };

    this.activeEvents.push(war);
    this.currentWorldState.activeEvents.push(war);

    // Notify players and NPCs
    this.broadcastWarDeclaration(war);

    // Spawn military units and battles
    this.spawnWarElements(war);
  }

  /**
   * Form alliance
   */
  private formAlliance(factionIdA: string, factionIdB: string): void {
    const alliance: AllianceEvent = {
      id: `alliance_${Date.now()}`,
      type: WorldEventType.ALLIANCE,
      name: `Alliance between ${factionIdA} and ${factionIdB}`,
      description: `${factionIdA} and ${factionIdB} have formed an alliance.`,
      startTime: Date.now(),
      involvedFactions: [factionIdA, factionIdB],
      impact: 0.5,
      factions: [factionIdA, factionIdB],
      allianceTerms: ['Mutual defense', 'Trade agreements', 'Shared resources']
    };

    this.activeEvents.push(alliance);
    this.currentWorldState.activeEvents.push(alliance);

    // Notify players and NPCs
    this.broadcastAllianceFormation(alliance);
  }

  /**
   * Broadcast war declaration
   */
  private broadcastWarDeclaration(war: WarEvent): void {
    // This would trigger UI notifications, NPC reactions, etc.
    console.log(`War declared: ${war.name}`);
  }

  /**
   * Broadcast alliance formation
   */
  private broadcastAllianceFormation(alliance: AllianceEvent): void {
    console.log(`Alliance formed: ${alliance.name}`);
  }

  /**
   * Spawn war elements
   */
  private spawnWarElements(war: WarEvent): void {
    // Spawn military units, battles, etc.
    console.log(`Spawning war elements for: ${war.name}`);
  }

  /**
   * Check for emerging conflicts
   */
  private checkForEmergingConflicts(): void {
    // Check for conditions that might lead to new conflicts
    // This could use LLM to generate conflict scenarios
  }

  /**
   * Update global tension
   */
  private updateGlobalTension(): void {
    let totalTension = 0;
    let count = 0;

    // Calculate average relationship tension
    for (const state of this.currentWorldState.factionStates.values()) {
      for (const relationship of state.relationships.values()) {
        // Negative relationships contribute to tension
        if (relationship < 0) {
          totalTension += Math.abs(relationship) / 100;
          count++;
        }
      }
    }

    // Factor in active wars
    const warCount = this.activeEvents.filter(e => e.type === WorldEventType.WAR).length;
    totalTension += warCount * 0.2;
    count += warCount;

    if (count > 0) {
      this.currentWorldState.globalTension = Math.min(1, totalTension / count);
    }
  }

  /**
   * Generate world events
   */
  private async generateWorldEvents(): Promise<void> {
    // Generate events based on world state
    // This could use LLM to create dynamic events
    if (this.currentWorldState.globalTension > 0.7 && Math.random() < 0.1) {
      // High tension might trigger additional events
      await this.generateTensionEvent();
    }
  }

  /**
   * Generate tension event
   */
  private async generateTensionEvent(): Promise<void> {
    // Generate a random event that increases tension
    console.log('Generating tension event');
  }

  /**
   * Player intervenes in war
   */
  onPlayerIntervenesInWar(warId: string, intervention: InterventionType, playerId: string): void {
    const war = this.activeEvents.find(e => e.id === warId) as WarEvent | undefined;
    if (!war || war.type !== WorldEventType.WAR) return;

    const impact = this.calculatePlayerInterventionImpact(intervention);

    // Modify war progress
    war.warProgress = Math.max(-100, Math.min(100, war.warProgress + impact));

    // Update faction opinions of player
    // This would integrate with reputation system
    console.log(`Player intervention in war: ${intervention}, impact: ${impact}`);

    // Check for war resolution
    if (Math.abs(war.warProgress) >= 100) {
      this.resolveWar(war);
    }
  }

  /**
   * Calculate player intervention impact
   */
  private calculatePlayerInterventionImpact(intervention: InterventionType): number {
    // Different interventions have different impacts
    switch (intervention) {
      case InterventionType.SUPPORT_AGGRESSOR:
        return 20;
      case InterventionType.SUPPORT_DEFENDER:
        return -20;
      case InterventionType.MEDIATE:
        return -10; // Reduces war progress
      case InterventionType.EXPLOIT:
        return 0; // No direct impact but might have other effects
      default:
        return 0;
    }
  }

  /**
   * Resolve war
   */
  private resolveWar(war: WarEvent): void {
    const winner = war.warProgress > 0 ? war.aggressor : war.defender;
    console.log(`War resolved: ${winner} wins`);

    // Remove from active events
    this.activeEvents = this.activeEvents.filter(e => e.id !== war.id);
    this.currentWorldState.activeEvents = this.currentWorldState.activeEvents.filter(e => e.id !== war.id);

    // Update world state
    war.endTime = Date.now();
  }

  /**
   * Get current world state
   */
  getCurrentWorldState(): WorldState {
    return this.currentWorldState;
  }

  /**
   * Get active events
   */
  getActiveEvents(): WorldStateEvent[] {
    return this.activeEvents;
  }
}

