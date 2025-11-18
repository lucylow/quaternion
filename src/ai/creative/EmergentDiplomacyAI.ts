/**
 * Emergent Diplomacy AI System
 * Creates dynamic faction relationships based on terrain threats and resource scarcity
 */

export interface AIFaction {
  id: string;
  name: string;
  baseLocation: { x: number; y: number };
  controlledTiles: string[];
  resources: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  };
  alliances: string[];
  enemies: string[];
  traits: string[];
  personality: 'aggressive' | 'defensive' | 'diplomatic' | 'expansionist';
}

export interface Alliance {
  id: string;
  type: 'survival' | 'resource' | 'territorial' | 'technological';
  members: string[];
  reason: string;
  duration: number;
  expiresAt: number;
}

export interface BetrayalOpportunity {
  factionId: string;
  targetId: string;
  reason: string;
  benefit: number;
  risk: number;
  chance: number;
}

export class EmergentDiplomacyAI {
  private factions: Map<string, AIFaction> = new Map();
  private alliances: Map<string, Alliance> = new Map();
  private worldEvents: WorldEvent[] = [];
  private playerId: string;

  constructor(playerId: string) {
    this.playerId = playerId;
  }

  /**
   * Generate terrain-driven alliances based on threats
   */
  generateTerrainDrivenAlliances(gameState: any): Alliance[] {
    const newAlliances: Alliance[] = [];
    
    // Check for imminent threats
    const threats = this.detectThreats(gameState);
    
    // Lava eruption threat
    if (threats.lavaEruption) {
      const affectedFactions = this.getFactionsInDangerZone(gameState, threats.lavaEruption.zone);
      
      if (affectedFactions.length >= 2) {
        const alliance: Alliance = {
          id: `alliance_${Date.now()}`,
          type: 'survival',
          members: affectedFactions.map(f => f.id),
          reason: 'Survival Pact vs Volcanic Threat',
          duration: 300000, // 5 minutes
          expiresAt: Date.now() + 300000
        };
        
        newAlliances.push(alliance);
        this.alliances.set(alliance.id, alliance);
        
        // Update faction relationships
        affectedFactions.forEach(faction => {
          affectedFactions.forEach(other => {
            if (faction.id !== other.id && !faction.alliances.includes(other.id)) {
              faction.alliances.push(other.id);
            }
          });
        });
      }
    }
    
    // Resource scarcity creates cooperation or conflict
    const globalResourceLevel = this.calculateGlobalResourceLevel(gameState);
    if (globalResourceLevel < 0.3) {
      const resourceAlliance = this.createResourceSharingAlliance(gameState);
      if (resourceAlliance) {
        newAlliances.push(resourceAlliance);
      } else {
        // Trigger resource war instead
        this.triggerResourceWarEvents(gameState);
      }
    }
    
    return newAlliances;
  }

  /**
   * Create betrayal opportunities for AI factions
   */
  createBetrayalOpportunities(gameState: any, playerControls: any): BetrayalOpportunity[] {
    const opportunities: BetrayalOpportunity[] = [];
    
    this.factions.forEach((faction, factionId) => {
      if (faction.personality === 'aggressive' || faction.personality === 'expansionist') {
        // Check if player controls key chokepoint
        const keyChokepoint = this.findKeyChokepoint(gameState);
        if (keyChokepoint && playerControls[keyChokepoint.id]) {
          const aiForces = this.calculateFactionForces(faction);
          const playerForces = this.calculatePlayerForces(gameState);
          
          if (aiForces > playerForces * 1.2) {
            const benefit = this.calculateBetrayalBenefit(faction, keyChokepoint);
            const risk = this.calculateBetrayalRisk(faction, gameState);
            
            if (benefit > 0.7 && risk < 0.4) {
              opportunities.push({
                factionId,
                targetId: this.playerId,
                reason: 'Chokepoint Ambush - Strategic Advantage',
                benefit,
                risk,
                chance: benefit - risk
              });
            }
          }
        }
        
        // Check for alliance betrayal opportunities
        faction.alliances.forEach(allyId => {
          const ally = this.factions.get(allyId);
          if (ally && this.shouldBetrayAlly(faction, ally, gameState)) {
            opportunities.push({
              factionId,
              targetId: allyId,
              reason: 'Alliance Betrayal - Resource Opportunity',
              benefit: this.calculateBetrayalBenefit(faction, null),
              risk: this.calculateBetrayalRisk(faction, gameState),
              chance: 0.6
            });
          }
        });
      }
    });
    
    return opportunities;
  }

  /**
   * Execute betrayal if opportunity is good enough
   */
  executeBetrayal(opportunity: BetrayalOpportunity, gameState: any): boolean {
    if (Math.random() < opportunity.chance) {
      const faction = this.factions.get(opportunity.factionId);
      if (!faction) return false;
      
      // Remove alliance
      const allianceIndex = faction.alliances.indexOf(opportunity.targetId);
      if (allianceIndex > -1) {
        faction.alliances.splice(allianceIndex, 1);
        faction.enemies.push(opportunity.targetId);
      }
      
      // Remove from alliance groups
      this.alliances.forEach((alliance, id) => {
        if (alliance.members.includes(opportunity.factionId) && 
            alliance.members.includes(opportunity.targetId)) {
          this.alliances.delete(id);
        }
      });
      
      return true;
    }
    return false;
  }

  /**
   * Detect world threats
   */
  private detectThreats(gameState: any): {
    lavaEruption?: { zone: { x: number; y: number; radius: number } };
    resourceScarcity?: boolean;
    environmentalHazard?: string;
  } {
    const threats: any = {};
    
    // Check for lava eruption (simplified - check for high energy/instability)
    if (gameState.instability > 120) {
      const dangerZone = this.findHighInstabilityZone(gameState);
      if (dangerZone) {
        threats.lavaEruption = { zone: dangerZone };
      }
    }
    
    // Check resource scarcity
    const globalLevel = this.calculateGlobalResourceLevel(gameState);
    if (globalLevel < 0.3) {
      threats.resourceScarcity = true;
    }
    
    return threats;
  }

  /**
   * Get factions in danger zone
   */
  private getFactionsInDangerZone(gameState: any, zone: { x: number; y: number; radius: number }): AIFaction[] {
    const affected: AIFaction[] = [];
    
    this.factions.forEach(faction => {
      const distance = Math.sqrt(
        Math.pow(faction.baseLocation.x - zone.x, 2) + 
        Math.pow(faction.baseLocation.y - zone.y, 2)
      );
      
      if (distance < zone.radius) {
        affected.push(faction);
      }
    });
    
    return affected;
  }

  /**
   * Calculate global resource level
   */
  private calculateGlobalResourceLevel(gameState: any): number {
    let totalResources = 0;
    let maxResources = 0;
    
    this.factions.forEach(faction => {
      const factionTotal = Object.values(faction.resources).reduce((a, b) => a + b, 0);
      totalResources += factionTotal;
      maxResources += 10000; // Assuming max per resource
    });
    
    return totalResources / maxResources;
  }

  /**
   * Create resource sharing alliance
   */
  private createResourceSharingAlliance(gameState: any): Alliance | null {
    const resourceRichFactions = Array.from(this.factions.values())
      .filter(f => {
        const total = Object.values(f.resources).reduce((a, b) => a + b, 0);
        return total > 5000;
      });
    
    const resourcePoorFactions = Array.from(this.factions.values())
      .filter(f => {
        const total = Object.values(f.resources).reduce((a, b) => a + b, 0);
        return total < 2000;
      });
    
    if (resourceRichFactions.length > 0 && resourcePoorFactions.length > 0) {
      // Match rich with poor for mutual benefit
      const rich = resourceRichFactions[0];
      const poor = resourcePoorFactions[0];
      
      return {
        id: `alliance_${Date.now()}`,
        type: 'resource',
        members: [rich.id, poor.id],
        reason: 'Resource Sharing Pact',
        duration: 600000, // 10 minutes
        expiresAt: Date.now() + 600000
      };
    }
    
    return null;
  }

  /**
   * Trigger resource war events
   */
  private triggerResourceWarEvents(gameState: any): void {
    // Create conflict between resource-hungry factions
    const factions = Array.from(this.factions.values());
    
    for (let i = 0; i < factions.length; i++) {
      for (let j = i + 1; j < factions.length; j++) {
        const f1 = factions[i];
        const f2 = factions[j];
        
        if (!f1.alliances.includes(f2.id) && !f1.enemies.includes(f2.id)) {
          // 30% chance of conflict
          if (Math.random() < 0.3) {
            f1.enemies.push(f2.id);
            f2.enemies.push(f1.id);
          }
        }
      }
    }
  }

  /**
   * Find key chokepoint
   */
  private findKeyChokepoint(gameState: any): any {
    // Simplified - find narrow passage between major areas
    return { id: 'chokepoint_1', strategic: true };
  }

  /**
   * Calculate faction forces
   */
  private calculateFactionForces(faction: AIFaction): number {
    return Object.values(faction.resources).reduce((a, b) => a + b, 0) / 100;
  }

  /**
   * Calculate player forces
   */
  private calculatePlayerForces(gameState: any): number {
    if (gameState.players && gameState.players.length > 0) {
      const player = gameState.players[0];
      return (player.resources.ore + player.resources.energy + 
              player.resources.biomass + player.resources.data) / 100;
    }
    return 0;
  }

  /**
   * Calculate betrayal benefit
   */
  private calculateBetrayalBenefit(faction: AIFaction, target: any): number {
    // Simplified calculation
    return 0.5 + Math.random() * 0.3;
  }

  /**
   * Calculate betrayal risk
   */
  private calculateBetrayalRisk(faction: AIFaction, gameState: any): number {
    // Risk increases with number of enemies
    return Math.min(faction.enemies.length * 0.1, 0.8);
  }

  /**
   * Should betray ally
   */
  private shouldBetrayAlly(faction: AIFaction, ally: AIFaction, gameState: any): boolean {
    if (faction.personality !== 'aggressive') return false;
    
    const allyResources = Object.values(ally.resources).reduce((a, b) => a + b, 0);
    const myResources = Object.values(faction.resources).reduce((a, b) => a + b, 0);
    
    // Betray if ally is weaker and has good resources
    return allyResources < myResources * 0.7 && allyResources > 3000;
  }

  /**
   * Find high instability zone
   */
  private findHighInstabilityZone(gameState: any): { x: number; y: number; radius: number } | null {
    // Simplified - return center of map with high radius
    return { x: 600, y: 350, radius: 200 };
  }

  /**
   * Add faction
   */
  addFaction(faction: AIFaction): void {
    this.factions.set(faction.id, faction);
  }

  /**
   * Get all alliances
   */
  getAlliances(): Alliance[] {
    return Array.from(this.alliances.values());
  }

  /**
   * Get faction
   */
  getFaction(id: string): AIFaction | undefined {
    return this.factions.get(id);
  }

  /**
   * Update faction
   */
  updateFaction(id: string, updates: Partial<AIFaction>): void {
    const faction = this.factions.get(id);
    if (faction) {
      Object.assign(faction, updates);
    }
  }
}

interface WorldEvent {
  id: string;
  type: string;
  description: string;
  effects: any;
}

