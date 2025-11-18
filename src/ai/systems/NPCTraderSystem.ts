/**
 * NPC Trader System with Utility AI and Dynamic Dialogue
 * Creates living world agents that respond to player actions
 * Enhanced with persistent memory and relationship tracking
 */

import { LLMIntegration } from '../integrations/LLMIntegration';
import { ElevenLabsIntegration } from '../integrations/ElevenLabsIntegration';
import { MemoryManager, ContextCompressor, StructuredOutputParser } from '../memory';

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
  personality?: {
    traits: string[];
    background: string;
    speechStyle: string;
  };
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
  private memoryManager: MemoryManager;
  private contextCompressor: ContextCompressor;
  private outputParser: StructuredOutputParser;
  private conversationHistory: Map<string, Array<{
    role: 'player' | 'npc' | 'system';
    content: string;
    timestamp: number;
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
        maxTokens: 200
      });
    }

    if (elevenLabsConfig) {
      this.elevenLabs = new ElevenLabsIntegration(elevenLabsConfig);
    }

    // Initialize memory systems
    this.memoryManager = new MemoryManager();
    this.contextCompressor = new ContextCompressor(llmConfig);
    this.outputParser = new StructuredOutputParser();
  }

  /**
   * Create a new NPC trader with personality
   */
  async createTrader(
    id: string,
    name: string,
    position: { x: number; y: number },
    personality?: NPCTrader['personality']
  ): Promise<NPCTrader> {
    // Generate personality if not provided
    let traderPersonality = personality;
    if (!traderPersonality && this.llm) {
      try {
        traderPersonality = await this.generatePersonality(name);
      } catch (error) {
        console.warn('Personality generation failed, using default', error);
        traderPersonality = this.getDefaultPersonality();
      }
    } else if (!traderPersonality) {
      traderPersonality = this.getDefaultPersonality();
    }

    const trader: NPCTrader = {
      id,
      name,
      position,
      inventory: this.generateInitialInventory(),
      reputation: 0,
      state: 'idle',
      lastTrade: null,
      personality: traderPersonality
    };

    this.traders.set(id, trader);

    // Store initial memory about trader creation
    await this.memoryManager.storeMemory({
      entityId: id,
      entityType: 'npc',
      content: `Trader ${name} established at position (${position.x}, ${position.y})`,
      metadata: {
        timestamp: Date.now(),
        importance: 0.5,
        tags: ['creation', 'setup']
      }
    });

    return trader;
  }

  /**
   * Generate personality for trader using LLM
   */
  private async generatePersonality(name: string): Promise<NPCTrader['personality']> {
    if (!this.llm) return this.getDefaultPersonality();

    const prompt = `Generate a personality profile for a sci-fi RTS game trader named "${name}".
Include:
- 3-4 personality traits (e.g., "greedy", "honest", "cautious", "charismatic")
- A brief background (1 sentence)
- Speech style description (e.g., "formal", "casual", "sarcastic", "enthusiastic")

Format as JSON:
{
  "traits": ["trait1", "trait2", "trait3"],
  "background": "brief background",
  "speechStyle": "style description"
}`;

    try {
      const response = await this.llm.generateText(prompt);
      const parsed = this.outputParser.parseJSON<NPCTrader['personality']>(response);
      if (parsed.success && parsed.data) {
        return parsed.data;
      }
    } catch (error) {
      console.warn('Personality generation failed', error);
    }

    return this.getDefaultPersonality();
  }

  /**
   * Get default personality
   */
  private getDefaultPersonality(): NPCTrader['personality'] {
    return {
      traits: ['pragmatic', 'opportunistic'],
      background: 'A seasoned trader who has seen many battles',
      speechStyle: 'professional and direct'
    };
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

    // Generate dialogue using LLM with memory
    let dialogue: string | undefined;
    if (this.llm) {
      try {
        dialogue = await this.generateTradeDialogue(trader, resource, amount, 'player');
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
   * Generate trade dialogue using LLM with memory context
   */
  private async generateTradeDialogue(
    trader: NPCTrader,
    resource: string,
    amount: number,
    playerId?: string
  ): Promise<string> {
    if (!this.llm) return this.getFallbackDialogue(trader, resource);

    // Get compressed context from memory
    const memoryContext = await this.memoryManager.getCompressedContext(
      trader.id,
      'npc',
      500
    );

    // Get conversation history
    const conversationKey = `${trader.id}_${playerId || 'default'}`;
    const history = this.conversationHistory.get(conversationKey) || [];
    const compressedHistory = await this.contextCompressor.compressConversation(history, 300);
    const historyText = this.contextCompressor.formatContext(compressedHistory);

    // Build enhanced prompt with memory
    const personalityInfo = trader.personality 
      ? `Personality: ${trader.personality.traits.join(', ')}. Background: ${trader.personality.background}. Speech style: ${trader.personality.speechStyle}.`
      : '';

    const prompt = `You are "${trader.name}", a trader in a sci-fi RTS game.

${personalityInfo}
Reputation with player: ${trader.reputation.toFixed(2)} (range: -1 to 1)

${memoryContext ? `## Memory Context\n${memoryContext}\n` : ''}
${historyText ? `## Previous Conversation\n${historyText}\n` : ''}

Player wants to buy ${amount} ${resource} for ${trader.inventory.find(i => i.resource === resource)?.price || 1} each.

Generate a brief merchant dialogue (max 30 words) that:
- Matches your personality and speech style
- Reflects your relationship with the player (reputation: ${trader.reputation.toFixed(2)})
- References past interactions if relevant
- Feels natural and in-character

Output only the dialogue text, no JSON or formatting.`;

    try {
      const response = await this.llm.generateText(prompt);
      const dialogue = this.outputParser.cleanResponse(response);

      // Store in conversation history
      if (playerId) {
        if (!this.conversationHistory.has(conversationKey)) {
          this.conversationHistory.set(conversationKey, []);
        }
        this.conversationHistory.get(conversationKey)!.push({
          role: 'npc',
          content: dialogue,
          timestamp: Date.now()
        });
      }

      // Store memory
      await this.memoryManager.storeMemory({
        entityId: trader.id,
        entityType: 'npc',
        content: `Offered ${amount} ${resource} to player. Dialogue: "${dialogue}"`,
        metadata: {
          timestamp: Date.now(),
          importance: 0.6,
          tags: ['trade', 'dialogue', resource],
          playerId
        }
      });

      return dialogue;
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

    // Store memory of trade
    await this.memoryManager.storeMemory({
      entityId: traderId,
      entityType: 'npc',
      content: `Completed trade with player: ${amount} ${resource} for ${price}. Trade was ${favorable ? 'favorable' : 'unfavorable'} for trader.`,
      metadata: {
        timestamp: Date.now(),
        importance: favorable ? 0.8 : 0.5,
        tags: ['trade', 'completed', resource, favorable ? 'positive' : 'neutral'],
        playerId
      }
    });

    // Generate post-trade dialogue with memory
    let dialogue: string | undefined;
    if (this.llm) {
      try {
        dialogue = await this.generatePostTradeDialogue(trader, favorable, playerId);
      } catch (error) {
        dialogue = this.getFallbackPostTradeDialogue(trader, favorable);
      }
    } else {
      dialogue = this.getFallbackPostTradeDialogue(trader, favorable);
    }

    return { success: true, dialogue };
  }

  /**
   * Generate post-trade dialogue with memory context
   */
  private async generatePostTradeDialogue(
    trader: NPCTrader,
    favorable: boolean,
    playerId?: string
  ): Promise<string> {
    if (!this.llm) return this.getFallbackPostTradeDialogue(trader, favorable);

    // Get memory context
    const memoryContext = await this.memoryManager.getCompressedContext(
      trader.id,
      'npc',
      400
    );

    const personalityInfo = trader.personality 
      ? `Personality: ${trader.personality.traits.join(', ')}. Speech style: ${trader.personality.speechStyle}.`
      : '';

    const prompt = `You are "${trader.name}", a trader who just completed a trade.

${personalityInfo}
The trade was ${favorable ? 'favorable' : 'unfavorable'} for you.
Current reputation with player: ${trader.reputation.toFixed(2)} (range: -1 to 1)

${memoryContext ? `## Your Memory\n${memoryContext}\n` : ''}

Generate a brief post-trade comment (max 20 words) that:
- Reflects how you feel about this trade
- References past interactions if relevant (from memory)
- Matches your personality and speech style
- Feels natural

Output only the dialogue text.`;

    try {
      const response = await this.llm.generateText(prompt);
      const dialogue = this.outputParser.cleanResponse(response);

      // Store in conversation history
      if (playerId) {
        const conversationKey = `${trader.id}_${playerId}`;
        if (!this.conversationHistory.has(conversationKey)) {
          this.conversationHistory.set(conversationKey, []);
        }
        this.conversationHistory.get(conversationKey)!.push({
          role: 'npc',
          content: dialogue,
          timestamp: Date.now()
        });
      }

      return dialogue;
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

  /**
   * Get memory summary for a trader
   */
  async getTraderMemory(traderId: string): Promise<string> {
    return await this.memoryManager.getCompressedContext(traderId, 'npc', 1000);
  }

  /**
   * Add player dialogue to conversation history
   */
  recordPlayerDialogue(traderId: string, playerId: string, content: string): void {
    const conversationKey = `${traderId}_${playerId}`;
    if (!this.conversationHistory.has(conversationKey)) {
      this.conversationHistory.set(conversationKey, []);
    }
    this.conversationHistory.get(conversationKey)!.push({
      role: 'player',
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Export memory data for persistence
   */
  exportMemory(): any {
    return this.memoryManager.exportMemories();
  }

  /**
   * Import memory data from persistence
   */
  importMemory(data: any): void {
    this.memoryManager.importMemories(data);
  }
}

