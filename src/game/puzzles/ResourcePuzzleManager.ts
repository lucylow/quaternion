/**
 * Resource Puzzle Manager
 * Coordinates all resource puzzle systems
 */

import { ResourceEventGenerator, ResourceEvent } from './ResourceEventGenerator';
import { AllocationPuzzleManager, AllocationPuzzle } from './AllocationPuzzleManager';
import { ConversionPuzzleSystem } from './ConversionPuzzleSystem';
import { BlackMarketSystem, MarketOffer } from './BlackMarketSystem';
import { ResourceAdvisor, AdvisorResponse, ResourceState } from './ResourceAdvisor';
import { ResourceManager, ResourceType } from '../ResourceManager';
import { LLMIntegration } from '@/ai/integrations/LLMIntegration';

export class ResourcePuzzleManager {
  private eventGenerator: ResourceEventGenerator;
  private allocationPuzzleManager: AllocationPuzzleManager;
  private conversionSystem: ConversionPuzzleSystem;
  private blackMarket: BlackMarketSystem;
  private advisor: ResourceAdvisor;
  private resourceManager: ResourceManager;

  private gameStartTime: number = 0;
  private lastUpdateTime: number = 0;

  constructor(resourceManager: ResourceManager, llmIntegration?: LLMIntegration) {
    this.resourceManager = resourceManager;
    this.eventGenerator = new ResourceEventGenerator(llmIntegration);
    this.allocationPuzzleManager = new AllocationPuzzleManager(llmIntegration);
    this.conversionSystem = new ConversionPuzzleSystem();
    this.blackMarket = new BlackMarketSystem(llmIntegration);
    this.advisor = new ResourceAdvisor(llmIntegration);
  }

  /**
   * Initialize puzzle systems
   */
  public initialize(gameStartTime: number): void {
    this.gameStartTime = gameStartTime;
    this.lastUpdateTime = gameStartTime;
    this.eventGenerator.initialize(gameStartTime);
    this.blackMarket.initialize(gameStartTime);
  }

  /**
   * Update all puzzle systems (call every game tick)
   */
  public update(
    currentTime: number,
    gameState: {
      resources: Record<ResourceType, number>;
      maxCapacities: Record<ResourceType, number>;
      generationRates: Record<ResourceType, number>;
      activeEvents?: any[];
      researchedTechs?: string[];
      playerBehavior?: string[];
    }
  ): void {
    // Update event generator
    const activeEvents = this.eventGenerator.update(currentTime, {
      resources: gameState.resources,
      playerStrategy: gameState.playerBehavior?.join(', ') || 'balanced',
      threatLevel: 0.5
    });

    // Apply event modifiers to resource manager
    this.resourceManager.clearAllEventModifiers();
    activeEvents.forEach(event => {
      event.resourceModifiers.forEach((modifier, resourceType) => {
        this.resourceManager.setEventModifier(resourceType, modifier);
      });
    });

    // Update black market
    this.blackMarket.update(currentTime, gameState.resources);

    // Check for allocation puzzle generation (every 2-3 minutes)
    if (currentTime - this.lastUpdateTime > 120000) {
      this.checkForAllocationPuzzle(currentTime, gameState);
      this.lastUpdateTime = currentTime;
    }

    // Clear expired puzzles
    this.allocationPuzzleManager.clearExpiredPuzzles(currentTime);
  }

  private async checkForAllocationPuzzle(
    currentTime: number,
    gameState: any
  ): Promise<void> {
    // 30% chance to generate a puzzle
    if (Math.random() > 0.3) return;

    const context = {
      currentResources: gameState.resources,
      activeEvents: gameState.activeEvents || [],
      techProgress: {
        researchLevel: (gameState.researchedTechs || []).length,
        researchedTechs: gameState.researchedTechs || []
      },
      playerBehavior: gameState.playerBehavior?.join(', ') || 'balanced',
      strategicSituation: 'standard'
    };

    await this.allocationPuzzleManager.generatePuzzle(context);
  }

  /**
   * Get active events
   */
  public getActiveEvents(): ResourceEvent[] {
    return this.eventGenerator.getActiveEvents();
  }

  /**
   * Get active allocation puzzles
   */
  public getActivePuzzles(): AllocationPuzzle[] {
    return this.allocationPuzzleManager.getActivePuzzles();
  }

  /**
   * Get black market offers
   */
  public getMarketOffers(): MarketOffer[] {
    return this.blackMarket.getCurrentOffers();
  }

  /**
   * Get conversion system
   */
  public getConversionSystem(): ConversionPuzzleSystem {
    return this.conversionSystem;
  }

  /**
   * Get advisor
   */
  public getAdvisor(): ResourceAdvisor {
    return this.advisor;
  }

  /**
   * Execute allocation puzzle decision
   */
  public executeAllocationDecision(puzzleId: string, optionId: string): {
    success: boolean;
    puzzle?: AllocationPuzzle;
    option?: any;
  } {
    return this.allocationPuzzleManager.executeDecision(puzzleId, optionId);
  }

  /**
   * Accept black market offer
   */
  public acceptMarketOffer(offerId: string): {
    success: boolean;
    offer?: MarketOffer;
    riskTriggered: boolean;
    penalties?: any;
  } {
    return this.blackMarket.acceptOffer(offerId);
  }

  /**
   * Convert resources
   */
  public convertResources(
    conversionId: string,
    amount: number,
    currentResources: Map<ResourceType, number>
  ) {
    return this.conversionSystem.convertResources(conversionId, amount, currentResources);
  }

  /**
   * Generate advisor advice
   */
  public async generateAdvisorAdvice(
    situation: string,
    resourceState: ResourceState,
    currentTime: number
  ): Promise<AdvisorResponse | null> {
    return await this.advisor.generateAdvice(situation, resourceState, currentTime);
  }
}


