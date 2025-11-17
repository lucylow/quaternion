/**
 * NPC Trader System with Utility AI and Dynamic Dialogue
 * Creates living world agents that respond to player actions
 */

import { LLMIntegration } from '../integrations/LLMIntegration';
import { ElevenLabsIntegration } from '../integrations/ElevenLabsIntegration';

export interface NPCTrader {
  id: string;
  name: string;
  position: { x: number; y: number };
  inventory: Array<{
    resource: string;
    amount: number;
    price: number;
  }>;
  reputation: number; // -1 to 1
  state: 'idle' | 'trading' | 'fleeing' | 'restocking';
  lastTrade: {
    timestamp: number;
    playerId: string;
    favorable: boolean;
  } | null;
}

export interface TradeOffer {
  traderId: string;
  resource: string;
  amount: number;
  price: number;
  dialogue?: string;
}

export class NPCTraderSystem {
  private llm: LLMIntegration | null = null;
  private elevenLabs: ElevenLabsIntegration | null = null;
  private traders: Map<string, NPCTrader> = new Map();
  private tradeHistory: Map<string, Array<{
    timestamp: number;
    traderId: string;
    resource: string;
    amount: number;
    price: number;
  }>> = new Map();

  constructor(
    llmConfig?: { provider: 'google' | 'saga' | 'openai'; apiKey?: string },
    elevenLabsConfig?: { apiKey?: string }
  ) {
    if (llmConfig) {
      this.llm = new LLMIntegration({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        temperature: 0.8,
        maxTokens: 150
      });
    }

    if (elevenLabsConfig) {
      this.elevenLabs = new ElevenLabsIntegration(elevenLabsConfig);
    }
  }

  /**
   * Create a new NPC trader
   */
  createTrader(
    id: string,
    name: string,
    position: { x: number; y: number }
  ): NPCTrader {
    const trader: NPCTrader = {
      id,
      name,
      position,
      inventory: this.generateInitialInventory(),
      reputation: 0,
      state: 'idle',
      lastTrade: null
    };

    this.traders.set(id, trader);
    return trader;
  }

  /**
   * Generate initial inventory
   */
  private generateInitialInventory(): NPCTrader['inventory'] {
    const resources = ['ore', 'energy', 'biomass', 'data'];
    return resources.map(resource => ({
      resource,
      amount: 50 + Math.random() * 100,
      price: 1 + Math.random() * 2
    }));
  }

  /**
   * Update trader AI (call every game tick)
   */
  async update(gameState: any): Promise<void> {
    for (const trader of this.traders.values()) {
      await this.updateTrader(trader, gameState);
    }
  }

  /**
   * Update individual trader
   */
  private async updateTrader(trader: NPCTrader, gameState: any): Promise<void> {
    // Utility AI: Evaluate actions
    const actions = this.evaluateActions(trader, gameState);
    const bestAction = this.selectBestAction(actions);

    // Execute action
    switch (bestAction.type) {
      case 'restock':
        await this.restockTrader(trader);
        break;
      case 'relocate':
        await this.relocateTrader(trader, gameState);
        break;
      case 'adjust_prices':
        this.adjustPrices(trader, gameState);
        break;
      case 'close':
        trader.state = 'idle';
        break;
    }
  }

  /**
   * Evaluate possible actions using Utility AI
   */
  private evaluateActions(
    trader: NPCTrader,
    gameState: any
  ): Array<{ type: string; utility: number; reason: string }> {
    const actions: Array<{ type: string; utility: number; reason: string }> = [];

    // Check inventory levels
    const lowStock = trader.inventory.some(item => item.amount < 20);
    if (lowStock) {
      actions.push({
        type: 'restock',
        utility: 0.8,
        reason: 'Low inventory, need to restock'
      });
    }

    // Check proximity to combat
    const combatNearby = this.checkCombatNearby(trader.position, gameState);
    if (combatNearby) {
      actions.push({
        type: 'relocate',
        utility: 0.9,
        reason: 'Combat nearby, moving to safety'
      });
    }

    // Check player trading patterns
    const playerHistory = this.tradeHistory.get('player') || [];
    const recentTrades = playerHistory.filter(t => Date.now() - t.timestamp < 60000);
    if (recentTrades.length > 5) {
      actions.push({
        type: 'adjust_prices',
        utility: 0.6,
        reason: 'High demand, adjusting prices'
      });
    }

    // Check if trader should close (low resources, high danger)
    if (lowStock && combatNearby) {
      actions.push({
        type: 'close',
        utility: 0.7,
        reason: 'Unsafe conditions, closing shop'
      });
    }

    return actions;
  }

  /**
   * Select best action based on utility scores
   */
  private selectBestAction(
    actions: Array<{ type: string; utility: number; reason: string }>
  ): { type: string; utility: number; reason: string } {
    if (actions.length === 0) {
      return { type: 'idle', utility: 0, reason: 'No actions available' };
    }

    return actions.reduce((best, current) =>
      current.utility > best.utility ? current : best
    );
  }

  /**
   * Check if combat is nearby
   */
  private checkCombatNearby(
    position: { x: number; y: number },
    gameState: any
  ): boolean {
    const player = gameState.players?.get(1);
    const ai = gameState.players?.get(2);

    if (!player || !ai) return false;

    const playerUnits = player.units || [];
    const aiUnits = ai.units || [];

    const nearbyUnits = [...playerUnits, ...aiUnits].filter((unit: any) => {
      const dist = Math.sqrt(
        (unit.x - position.x) ** 2 + (unit.y - position.y) ** 2
      );
      return dist < 200; // Within 200 units
    });

    return nearbyUnits.length > 0;
  }

  /**
   * Restock trader inventory
   */
  private async restockTrader(trader: NPCTrader): Promise<void> {
    trader.state = 'restocking';
    trader.inventory = this.generateInitialInventory();
    trader.state = 'idle';
  }

  /**
   * Relocate trader away from danger
   */
  private async relocateTrader(trader: NPCTrader, gameState: any): Promise<void> {
    trader.state = 'fleeing';
    
    // Find safe location
    const safeX = Math.random() * (gameState.mapWidth || 1000);
    const safeY = Math.random() * (gameState.mapHeight || 1000);
    
    trader.position = { x: safeX, y: safeY };
    trader.state = 'idle';
  }

  /**
   * Adjust prices based on market conditions
   */
  private adjustPrices(trader: NPCTrader, gameState: any): void {
    const playerHistory = this.tradeHistory.get('player') || [];
    const recentTrades = playerHistory.filter(t => Date.now() - t.timestamp < 60000);

    // Increase prices if high demand
    if (recentTrades.length > 5) {
      trader.inventory.forEach(item => {
        item.price *= 1.2; // 20% increase
      });
    }

    // Decrease prices if low demand
    if (recentTrades.length === 0) {
      trader.inventory.forEach(item => {
        item.price *= 0.9; // 10% decrease
      });
    }
  }

  /**
   * Generate trade offer with dynamic dialogue
   */
  async generateTradeOffer(
    traderId: string,
    resource: string,
    amount: number
  ): Promise<TradeOffer | null> {
    const trader = this.traders.get(traderId);
    if (!trader) return null;

    const item = trader.inventory.find(i => i.resource === resource);
    if (!item || item.amount < amount) return null;

    // Generate dialogue using LLM
    let dialogue: string | undefined;
    if (this.llm) {
      try {
        dialogue = await this.generateTradeDialogue(trader, resource, amount);
      } catch (error) {
        console.warn('Trade dialogue generation failed', error);
        dialogue = this.getFallbackDialogue(trader, resource);
      }
    } else {
      dialogue = this.getFallbackDialogue(trader, resource);
    }

    return {
      traderId,
      resource,
      amount,
      price: item.price * amount,
      dialogue
    };
  }

  /**
   * Generate trade dialogue using LLM
   */
  private async generateTradeDialogue(
    trader: NPCTrader,
    resource: string,
    amount: number
  ): Promise<string> {
    if (!this.llm) return this.getFallbackDialogue(trader, resource);

    const prompt = `NPC trader "${trader.name}" with reputation ${trader.reputation.toFixed(2)}
Player wants to buy ${amount} ${resource} for ${trader.inventory.find(i => i.resource === resource)?.price || 1} each.

Generate a brief merchant dialogue (max 30 words) that:
- Matches the trader's reputation (positive/negative)
- Responds to the trade offer
- Feels natural and in-character`;

    try {
      const response = await this.llm.generateText(prompt);
      return response.trim();
    } catch (error) {
      return this.getFallbackDialogue(trader, resource);
    }
  }

  /**
   * Get fallback dialogue
   */
  private getFallbackDialogue(trader: NPCTrader, resource: string): string {
    if (trader.reputation > 0.5) {
      return `Excellent choice, commander. ${resource} is in high demand.`;
    } else if (trader.reputation < -0.5) {
      return `Hmm, ${resource}... I suppose we can make a deal.`;
    }
    return `I can offer you ${resource} at a fair price.`;
  }

  /**
   * Execute trade
   */
  async executeTrade(
    traderId: string,
    playerId: string,
    resource: string,
    amount: number,
    price: number
  ): Promise<{ success: boolean; dialogue?: string }> {
    const trader = this.traders.get(traderId);
    if (!trader) {
      return { success: false };
    }

    const item = trader.inventory.find(i => i.resource === resource);
    if (!item || item.amount < amount) {
      return { success: false };
    }

    // Execute trade
    item.amount -= amount;
    const favorable = price <= item.price * amount * 0.9; // 10% discount or better

    // Update reputation
    if (favorable) {
      trader.reputation += 0.1;
    } else {
      trader.reputation -= 0.05;
    }

    trader.lastTrade = {
      timestamp: Date.now(),
      playerId,
      favorable
    };

    // Record trade history
    if (!this.tradeHistory.has(playerId)) {
      this.tradeHistory.set(playerId, []);
    }
    this.tradeHistory.get(playerId)!.push({
      timestamp: Date.now(),
      traderId,
      resource,
      amount,
      price
    });

    // Generate post-trade dialogue
    let dialogue: string | undefined;
    if (this.llm) {
      try {
        dialogue = await this.generatePostTradeDialogue(trader, favorable);
      } catch (error) {
        dialogue = this.getFallbackPostTradeDialogue(trader, favorable);
      }
    } else {
      dialogue = this.getFallbackPostTradeDialogue(trader, favorable);
    }

    return { success: true, dialogue };
  }

  /**
   * Generate post-trade dialogue
   */
  private async generatePostTradeDialogue(
    trader: NPCTrader,
    favorable: boolean
  ): Promise<string> {
    if (!this.llm) return this.getFallbackPostTradeDialogue(trader, favorable);

    const prompt = `NPC trader "${trader.name}" just completed a trade.
The trade was ${favorable ? 'favorable' : 'unfavorable'} for the trader.
Reputation: ${trader.reputation.toFixed(2)}

Generate a brief post-trade comment (max 20 words) that:
- Reflects the trade outcome
- Matches the trader's personality
- Feels natural`;

    try {
      const response = await this.llm.generateText(prompt);
      return response.trim();
    } catch (error) {
      return this.getFallbackPostTradeDialogue(trader, favorable);
    }
  }

  /**
   * Get fallback post-trade dialogue
   */
  private getFallbackPostTradeDialogue(trader: NPCTrader, favorable: boolean): string {
    if (favorable) {
      return 'Pleasure doing business with you, commander.';
    }
    return 'Until next time, commander.';
  }

  /**
   * Get trader by ID
   */
  getTrader(traderId: string): NPCTrader | undefined {
    return this.traders.get(traderId);
  }

  /**
   * Get all traders
   */
  getAllTraders(): NPCTrader[] {
    return Array.from(this.traders.values());
  }
}

