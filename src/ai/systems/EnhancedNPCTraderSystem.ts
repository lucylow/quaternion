/**
 * Enhanced NPC Trader System
 * Uses GenerativeNPC architecture for believable trader behavior
 * Combines memory, reflection, planning, personality, emotions, and relationships
 */

import { GenerativeNPC, GenerativeNPCConfig, OCEANPersonality } from '../generative';
import { LLMIntegration } from '../integrations/LLMIntegration';

export interface EnhancedTrader {
  id: string;
  name: string;
  position: { x: number; y: number };
  inventory: Array<{
    resource: string;
    amount: number;
    price: number;
  }>;
  npc: GenerativeNPC; // The generative NPC instance
}

export interface TradeOffer {
  traderId: string;
  resource: string;
  amount: number;
  price: number;
  dialogue: string;
}

/**
 * Enhanced NPC Trader System
 * Uses GenerativeNPC for believable behavior
 */
export class EnhancedNPCTraderSystem {
  private traders: Map<string, EnhancedTrader> = new Map();
  private llm: LLMIntegration | null = null;

  constructor(llmConfig?: { provider: 'google' | 'saga' | 'openai'; apiKey?: string }) {
    if (llmConfig) {
      this.llm = new LLMIntegration({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        temperature: 0.8,
        maxTokens: 200
      });
    }
  }

  /**
   * Create a new trader with generative behavior
   */
  async createTrader(
    id: string,
    name: string,
    position: { x: number; y: number },
    personality?: OCEANPersonality | string
  ): Promise<EnhancedTrader> {
    // Create generative NPC
    const npcConfig: GenerativeNPCConfig = {
      id,
      name,
      role: 'trader',
      position,
      personality: personality || 'greedy_trader',
      llm: this.llm || undefined,
      initialMemories: [
        `${name} established trading post at position (${position.x}, ${position.y})`,
        `${name} is ready to trade resources with players`
      ]
    };

    const npc = new GenerativeNPC(npcConfig);

    // Create trader
    const trader: EnhancedTrader = {
      id,
      name,
      position,
      inventory: this.generateInitialInventory(),
      npc
    };

    this.traders.set(id, trader);
    return trader;
  }

  /**
   * Generate initial inventory
   */
  private generateInitialInventory(): EnhancedTrader['inventory'] {
    const resources = ['ore', 'energy', 'biomass', 'data'];
    return resources.map(resource => ({
      resource,
      amount: 50 + Math.random() * 100,
      price: 1 + Math.random() * 2
    }));
  }

  /**
   * Update traders (call every game tick)
   */
  async update(gameState: any, currentTime: number = Date.now()): Promise<void> {
    for (const trader of this.traders.values()) {
      // Update generative NPC
      await trader.npc.update(currentTime, gameState);

      // Update trader-specific logic (inventory, prices, etc.)
      await this.updateTraderLogic(trader, gameState);
    }
  }

  /**
   * Update trader-specific logic
   */
  private async updateTraderLogic(trader: EnhancedTrader, gameState: any): Promise<void> {
    // Check if inventory needs restocking
    const lowStock = trader.inventory.some(item => item.amount < 20);
    if (lowStock) {
      await trader.npc.processEvent('Inventory running low, need to restock', undefined, 'npc');
      // Restock logic would go here
    }

    // Check for nearby combat
    const combatNearby = this.checkCombatNearby(trader.position, gameState);
    if (combatNearby) {
      await trader.npc.processEvent('Combat detected nearby, feeling unsafe', undefined, 'npc');
    }
  }

  /**
   * Generate trade offer with generative dialogue
   */
  async generateTradeOffer(
    traderId: string,
    resource: string,
    amount: number,
    playerId: string
  ): Promise<TradeOffer | null> {
    const trader = this.traders.get(traderId);
    if (!trader) return null;

    const item = trader.inventory.find(i => i.resource === resource);
    if (!item || item.amount < amount) return null;

    // Generate dialogue using generative NPC
    const dialogue = await trader.npc.generateDialogue(
      `I want to buy ${amount} ${resource}`,
      playerId,
      {
        trade: true,
        resource,
        amount,
        price: item.price
      }
    );

    return {
      traderId,
      resource,
      amount,
      price: item.price * amount,
      dialogue
    };
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

    // Process event with generative NPC
    const eventType = favorable ? 'successful_trade' : 'completed_trade';
    await trader.npc.processEvent(
      `Completed trade: ${amount} ${resource} for ${price}. Trade was ${favorable ? 'favorable' : 'neutral'}`,
      playerId,
      'player',
      { favorable, resource, amount, price }
    );

    // Generate post-trade dialogue
    const dialogue = await trader.npc.generateDialogue(
      'Trade completed',
      playerId,
      { tradeCompleted: true, favorable }
    );

    return { success: true, dialogue };
  }

  /**
   * Check if combat is nearby
   */
  private checkCombatNearby(
    position: { x: number; y: number },
    gameState: any
  ): boolean {
    // Simplified check - would need actual game state structure
    return false; // Placeholder
  }

  /**
   * Get trader by ID
   */
  getTrader(traderId: string): EnhancedTrader | undefined {
    return this.traders.get(traderId);
  }

  /**
   * Get all traders
   */
  getAllTraders(): EnhancedTrader[] {
    return Array.from(this.traders.values());
  }

  /**
   * Get trader's generative NPC
   */
  getTraderNPC(traderId: string): GenerativeNPC | undefined {
    const trader = this.traders.get(traderId);
    return trader?.npc;
  }
}

