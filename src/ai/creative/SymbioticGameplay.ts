/**
 * Symbiotic Gameplay System
 * Creates mutual benefit opportunities between player and AI
 */

export interface AIOffer {
  id: string;
  type: 'resource_symbiosis' | 'territorial' | 'technological' | 'defensive';
  terms: string;
  duration: number; // milliseconds
  mutualBenefit: boolean;
  fromFaction: string;
  toFaction: string;
  resourceOffer?: {
    give: { ore?: number; energy?: number; biomass?: number; data?: number };
    receive: { ore?: number; energy?: number; biomass?: number; data?: number };
  };
  territorialOffer?: {
    protectArea: { x: number; y: number; radius: number };
    inExchangeFor: string;
  };
  technologicalOffer?: {
    shareTech: string;
    inExchangeFor: string;
  };
  expiresAt: number;
  accepted: boolean;
}

export interface CooperativePower {
  id: string;
  name: string;
  description: string;
  requiredPlayers: number;
  effect: string;
  unlocked: boolean;
}

export class SymbioticGameplay {
  private offers: Map<string, AIOffer> = new Map();
  private cooperativePowers: Map<string, CooperativePower> = new Map();
  private activeAgreements: Map<string, AIOffer> = new Map();

  constructor() {
    this.initializeCooperativePowers();
  }

  /**
   * Create player-AI symbiosis opportunities
   */
  createPlayerAISymbiosis(gameState: any, playerId: string): AIOffer[] {
    const newOffers: AIOffer[] = [];

    // Check if player is struggling with resources
    if (gameState.players && gameState.players.length > 0) {
      const player = gameState.players[0];
      
      // Resource symbiosis
      if (player.resources.ore < 200) {
        const offer = this.createResourceSymbiosisOffer(player, 'ore', gameState);
        if (offer) newOffers.push(offer);
      }
      
      if (player.resources.energy < 100) {
        const offer = this.createResourceSymbiosisOffer(player, 'energy', gameState);
        if (offer) newOffers.push(offer);
      }

      // Defensive symbiosis
      if (this.isPlayerBaseThreatened(gameState)) {
        const offer = this.createDefensiveSymbiosisOffer(player, gameState);
        if (offer) newOffers.push(offer);
      }
    }

    return newOffers;
  }

  /**
   * Create resource symbiosis offer
   */
  private createResourceSymbiosisOffer(
    player: any,
    resourceType: string,
    gameState: any
  ): AIOffer | null {
    // Find AI faction that has excess of this resource
    const aiFaction = this.findResourceRichFaction(resourceType, gameState);
    if (!aiFaction) return null;

    const offer: AIOffer = {
      id: `offer_${Date.now()}`,
      type: 'resource_symbiosis',
      terms: `I give you ${resourceType}, you protect my western flank`,
      duration: 120000, // 2 minutes
      mutualBenefit: true,
      fromFaction: aiFaction.id,
      toFaction: 'player',
      resourceOffer: {
        give: { [resourceType]: 500 },
        receive: { [this.getPlayerExcessResource(player)]: 300 }
      },
      expiresAt: Date.now() + 60000, // 1 minute to accept
      accepted: false
    };

    this.offers.set(offer.id, offer);
    return offer;
  }

  /**
   * Create defensive symbiosis offer
   */
  private createDefensiveSymbiosisOffer(player: any, gameState: any): AIOffer | null {
    const aiFaction = this.findNearestFriendlyFaction(gameState);
    if (!aiFaction) return null;

    const offer: AIOffer = {
      id: `offer_${Date.now()}`,
      type: 'defensive',
      terms: 'Mutual defense pact - we protect each other\'s bases',
      duration: 300000, // 5 minutes
      mutualBenefit: true,
      fromFaction: aiFaction.id,
      toFaction: 'player',
      territorialOffer: {
        protectArea: { x: 150, y: 350, radius: 150 }, // Player base area
        inExchangeFor: 'Protection of AI base'
      },
      expiresAt: Date.now() + 120000,
      accepted: false
    };

    this.offers.set(offer.id, offer);
    return offer;
  }

  /**
   * Enable cooperative terrain manipulation
   */
  enableCooperativeTerrainManipulation(gameState: any): CooperativePower[] {
    const unlocked: CooperativePower[] = [];

    // Check if multiple players researched same tech
    const researchedTechs = this.getCollectiveResearchedTechs(gameState);
    
    researchedTechs.forEach((tech, count) => {
      if (Number(count) >= 2) {
        // Unlock cooperative power
        const power = this.cooperativePowers.get(`coop_${tech}`);
        if (power && !power.unlocked) {
          power.unlocked = true;
          unlocked.push({ ...power });
        }
      }
    });

    return unlocked;
  }

  /**
   * Get collective researched techs
   */
  private getCollectiveResearchedTechs(gameState: any): Map<string, number> {
    const techCounts = new Map<string, number>();
    
    if (gameState.players) {
      gameState.players.forEach((player: any) => {
        if (player.researchedTechs) {
          player.researchedTechs.forEach((tech: string) => {
            techCounts.set(tech, (techCounts.get(tech) || 0) + 1);
          });
        }
      });
    }

    return techCounts;
  }

  /**
   * Initialize cooperative powers
   */
  private initializeCooperativePowers(): void {
    this.cooperativePowers.set('coop_terraforming', {
      id: 'coop_terraforming',
      name: 'Cooperative Terraforming',
      description: 'Multiple players can work together to transform large areas of terrain',
      requiredPlayers: 2,
      effect: 'Terraform 3x larger area, 2x faster',
      unlocked: false
    });

    this.cooperativePowers.set('coop_research', {
      id: 'coop_research',
      name: 'Shared Research Network',
      description: 'Research benefits are shared between cooperating players',
      requiredPlayers: 2,
      effect: 'Research speed +50%, shared tech tree access',
      unlocked: false
    });

    this.cooperativePowers.set('coop_defense', {
      id: 'coop_defense',
      name: 'Allied Defense Grid',
      description: 'Defensive structures provide bonuses to allied players',
      requiredPlayers: 2,
      effect: '+25% defense for all allied units in range',
      unlocked: false
    });
  }

  /**
   * Accept offer
   */
  acceptOffer(offerId: string): boolean {
    const offer = this.offers.get(offerId);
    if (!offer || offer.accepted || Date.now() > offer.expiresAt) {
      return false;
    }

    offer.accepted = true;
    this.activeAgreements.set(offerId, offer);
    
    // Set expiration
    setTimeout(() => {
      this.activeAgreements.delete(offerId);
    }, offer.duration);

    return true;
  }

  /**
   * Reject offer
   */
  rejectOffer(offerId: string): void {
    this.offers.delete(offerId);
  }

  /**
   * Get active offers
   */
  getActiveOffers(): AIOffer[] {
    const now = Date.now();
    return Array.from(this.offers.values())
      .filter(offer => !offer.accepted && now < offer.expiresAt);
  }

  /**
   * Get active agreements
   */
  getActiveAgreements(): AIOffer[] {
    return Array.from(this.activeAgreements.values());
  }

  /**
   * Find resource-rich faction
   */
  private findResourceRichFaction(resourceType: string, gameState: any): any {
    // Simplified - would search actual AI factions
    return {
      id: 'ai_faction_1',
      name: 'Allied Faction',
      resources: { [resourceType]: 5000 }
    };
  }

  /**
   * Get player excess resource
   */
  private getPlayerExcessResource(player: any): string {
    const resources = player.resources;
    const max = Math.max(resources.ore, resources.energy, resources.biomass, resources.data);
    
    if (resources.ore === max) return 'ore';
    if (resources.energy === max) return 'energy';
    if (resources.biomass === max) return 'biomass';
    return 'data';
  }

  /**
   * Is player base threatened
   */
  private isPlayerBaseThreatened(gameState: any): boolean {
    // Simplified check
    return gameState.instability > 100;
  }

  /**
   * Find nearest friendly faction
   */
  private findNearestFriendlyFaction(gameState: any): any {
    // Simplified
    return {
      id: 'ai_faction_1',
      name: 'Neutral Faction',
      baseLocation: { x: 600, y: 350 }
    };
  }
}

