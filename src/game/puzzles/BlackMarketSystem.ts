/**
 * Black Market System
 * Risky trade offers with hidden consequences
 */

import { ResourceType, ResourceCost } from '../ResourceManager';
import { LLMIntegration } from '@/ai/integrations/LLMIntegration';

export interface MarketOffer {
  offerId: string;
  resourceCosts: ResourceCost;
  resourceRewards: Partial<Record<ResourceType, number>>;
  nonResourceRewards: {
    attackBoost?: number; // Percentage
    productionBoost?: number;
    techUnlock?: string;
    duration?: number; // seconds
  };
  riskLevel: number; // 0-1, hidden from player initially
  description: string;
  traderPersonality: string;
  hiddenConditions: string[];
  timesAccepted: number;
  createdAt: number;
  expiresAt: number;
}

export class BlackMarketSystem {
  private currentOffers: MarketOffer[] = [];
  private offerAcceptanceHistory: Map<string, number> = new Map();
  private offerRegenerationTime: number = 180; // seconds
  private riskIncreasePerAccept: number = 0.1;
  private maxRiskLevel: number = 0.9;
  private lastOfferGeneration: number = 0;
  private llmIntegration: LLMIntegration | null = null;

  private traderPersonalities = [
    'Risky Innovator',
    'Cautious Economist',
    'Aggressive Capitalist',
    'Mysterious Benefactor',
    'Desperate Merchant'
  ];

  constructor(llmIntegration?: LLMIntegration) {
    this.llmIntegration = llmIntegration || null;
  }

  /**
   * Initialize with game start time
   */
  public initialize(gameStartTime: number): void {
    this.lastOfferGeneration = gameStartTime;
    this.generateInitialOffers();
  }

  /**
   * Update market system (call every game tick)
   */
  public update(currentTime: number, playerResources: Record<ResourceType, number>): void {
    // Remove expired offers
    this.currentOffers = this.currentOffers.filter(offer => currentTime < offer.expiresAt);

    // Generate new offers if needed
    if (currentTime - this.lastOfferGeneration >= this.offerRegenerationTime) {
      if (this.currentOffers.length < 3) {
        this.generateMarketOffer(currentTime, playerResources);
        this.lastOfferGeneration = currentTime;
      }
    }

    // Adjust market conditions based on player behavior
    this.adjustMarketConditions();
  }

  private generateInitialOffers(): void {
    // Generate 1-2 initial offers
    const numOffers = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numOffers; i++) {
      this.generateMarketOffer(Date.now(), {
        [ResourceType.ORE]: 500,
        [ResourceType.ENERGY]: 300,
        [ResourceType.BIOMASS]: 200,
        [ResourceType.DATA]: 100
      });
    }
  }

  private async generateMarketOffer(
    currentTime: number,
    playerResources: Record<ResourceType, number>
  ): Promise<void> {
    const traderPersonality = this.traderPersonalities[
      Math.floor(Math.random() * this.traderPersonalities.length)
    ];

    // Determine offer type
    const offerType = this.determineOfferType(playerResources);

    // Generate offer based on type
    const offer = this.createOffer(offerType, traderPersonality, playerResources, currentTime);

    // Try to enhance with LLM
    if (this.llmIntegration) {
      try {
        await this.enhanceOfferWithLLM(offer, playerResources);
      } catch (error) {
        console.warn('LLM offer enhancement failed:', error);
      }
    }

    this.currentOffers.push(offer);
  }

  private determineOfferType(playerResources: Record<ResourceType, number>): string {
    const totalResources = Object.values(playerResources).reduce((a, b) => a + b, 0);
    
    if (totalResources < 500) {
      return 'desperate_boost'; // Player is low on resources
    } else if (totalResources > 2000) {
      return 'high_risk_high_reward'; // Player has resources to spare
    } else {
      return 'balanced_trade';
    }
  }

  private createOffer(
    offerType: string,
    traderPersonality: string,
    playerResources: Record<ResourceType, number>,
    currentTime: number
  ): MarketOffer {
    const totalResources = Object.values(playerResources).reduce((a, b) => a + b, 0);
    const baseCost = totalResources * (0.2 + Math.random() * 0.3); // 20-50% of resources

    let offer: MarketOffer;

    switch (offerType) {
      case 'desperate_boost':
        offer = {
          offerId: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          resourceCosts: {
            ore: baseCost * 0.4,
            energy: baseCost * 0.3,
            biomass: baseCost * 0.2,
            data: baseCost * 0.1
          },
          resourceRewards: {
            [ResourceType.ORE]: baseCost * 0.6, // Slight gain
            [ResourceType.ENERGY]: baseCost * 0.4
          },
          nonResourceRewards: {
            attackBoost: 20,
            duration: 60
          },
          riskLevel: 0.4,
          description: 'Quick power boost. Limited time offer.',
          traderPersonality,
          hiddenConditions: ['inflation'],
          timesAccepted: 0,
          createdAt: currentTime,
          expiresAt: currentTime + 120 // 2 minutes
        };
        break;

      case 'high_risk_high_reward':
        offer = {
          offerId: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          resourceCosts: {
            ore: baseCost * 0.5,
            energy: baseCost * 0.3,
            data: baseCost * 0.2
          },
          resourceRewards: {
            [ResourceType.ORE]: baseCost * 1.5, // Big gain
            [ResourceType.ENERGY]: baseCost * 1.2
          },
          nonResourceRewards: {
            attackBoost: 50,
            productionBoost: 30,
            duration: 90
          },
          riskLevel: 0.7,
          description: 'Massive power surge. Too good to be true?',
          traderPersonality,
          hiddenConditions: ['resource_contamination', 'tech_sabotage'],
          timesAccepted: 0,
          createdAt: currentTime,
          expiresAt: currentTime + 180
        };
        break;

      default: // balanced_trade
        offer = {
          offerId: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          resourceCosts: {
            ore: baseCost * 0.3,
            energy: baseCost * 0.3,
            biomass: baseCost * 0.2,
            data: baseCost * 0.2
          },
          resourceRewards: {
            [ResourceType.ORE]: baseCost * 0.4,
            [ResourceType.ENERGY]: baseCost * 0.35
          },
          nonResourceRewards: {
            productionBoost: 15,
            duration: 120
          },
          riskLevel: 0.3,
          description: 'Fair trade. Moderate benefits.',
          traderPersonality,
          hiddenConditions: [],
          timesAccepted: 0,
          createdAt: currentTime,
          expiresAt: currentTime + 150
        };
    }

    return offer;
  }

  private async enhanceOfferWithLLM(
    offer: MarketOffer,
    playerResources: Record<ResourceType, number>
  ): Promise<void> {
    if (!this.llmIntegration) return;

    try {
      const prompt = `Generate black market offer for RTS game.

PLAYER RESOURCES: ${JSON.stringify(playerResources)}
TRADER PERSONALITY: ${offer.traderPersonality}
OFFER TYPE: ${offer.description}

REQUIREMENTS:
- Create compelling but risky trade offer description (1-2 sentences)
- Balance short-term gain vs long-term cost
- Include personality-driven flavor text
- Format as JSON: {"description":"...","traderPersonality":"..."}

OUTPUT:`;

      const response = await this.llmIntegration['callLLM'](prompt);
      const enhanced = this.parseLLMResponse(response);

      if (enhanced) {
        if (enhanced.description) offer.description = enhanced.description;
        if (enhanced.traderPersonality) offer.traderPersonality = enhanced.traderPersonality;
      }
    } catch (error) {
      // Silently fail
    }
  }

  private parseLLMResponse(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }

  /**
   * Accept a market offer
   */
  public acceptOffer(offerId: string): {
    success: boolean;
    offer?: MarketOffer;
    riskTriggered: boolean;
    penalties?: any;
  } {
    const offer = this.currentOffers.find(o => o.offerId === offerId);
    if (!offer) {
      return { success: false, riskTriggered: false };
    }

    // Check for risk trigger
    const riskTriggered = this.checkForRiskTrigger(offer);

    // Update acceptance history
    const historyKey = offer.traderPersonality;
    const timesUsed = this.offerAcceptanceHistory.get(historyKey) || 0;
    this.offerAcceptanceHistory.set(historyKey, timesUsed + 1);
    offer.timesAccepted++;

    // Remove offer
    this.currentOffers = this.currentOffers.filter(o => o.offerId !== offerId);

    let penalties: any = null;
    if (riskTriggered) {
      penalties = this.applyHiddenPenalties(offer);
    }

    return {
      success: true,
      offer,
      riskTriggered,
      penalties
    };
  }

  private checkForRiskTrigger(offer: MarketOffer): boolean {
    // Risk increases with repeated acceptances
    let actualRisk = offer.riskLevel;
    const historyKey = offer.traderPersonality;
    const timesUsed = this.offerAcceptanceHistory.get(historyKey) || 0;
    actualRisk = Math.min(this.maxRiskLevel, offer.riskLevel + (timesUsed * this.riskIncreasePerAccept));

    return Math.random() < actualRisk;
  }

  private applyHiddenPenalties(offer: MarketOffer): any {
    const penalties: any = {
      resourcePenalties: {},
      effects: []
    };

    offer.hiddenConditions.forEach(condition => {
      switch (condition) {
        case 'inflation':
          penalties.effects.push('Resource costs increased by 20% for 60 seconds');
          break;
        case 'resource_contamination':
          penalties.resourcePenalties[ResourceType.ORE] = -50;
          penalties.resourcePenalties[ResourceType.ENERGY] = -30;
          penalties.effects.push('Resource contamination detected. Production reduced.');
          break;
        case 'tech_sabotage':
          penalties.effects.push('Technology sabotage detected. Research progress slowed.');
          break;
        case 'market_collapse':
          penalties.effects.push('Market collapse! All resource generation reduced by 30% for 90 seconds');
          break;
      }
    });

    return penalties;
  }

  private adjustMarketConditions(): void {
    // Adjust offer frequency based on player behavior
    // More risky trades if player accepts frequently
    const totalAcceptances = Array.from(this.offerAcceptanceHistory.values())
      .reduce((a, b) => a + b, 0);

    if (totalAcceptances > 5) {
      this.offerRegenerationTime = Math.max(90, this.offerRegenerationTime - 10);
    }
  }

  /**
   * Get current offers
   */
  public getCurrentOffers(): MarketOffer[] {
    return this.currentOffers;
  }

  /**
   * Check if player can afford an offer
   */
  public canAffordOffer(offerId: string, playerResources: Record<ResourceType, number>): boolean {
    const offer = this.currentOffers.find(o => o.offerId === offerId);
    if (!offer) return false;

    const costs = offer.resourceCosts;
    if (costs.ore && (playerResources[ResourceType.ORE] || 0) < costs.ore) return false;
    if (costs.energy && (playerResources[ResourceType.ENERGY] || 0) < costs.energy) return false;
    if (costs.biomass && (playerResources[ResourceType.BIOMASS] || 0) < costs.biomass) return false;
    if (costs.data && (playerResources[ResourceType.DATA] || 0) < costs.data) return false;

    return true;
  }
}

