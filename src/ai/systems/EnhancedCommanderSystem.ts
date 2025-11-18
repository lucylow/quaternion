/**
 * Enhanced AI Commander System with Personality-Driven Behavior
 * Integrates LLM for personality generation and behavior trees
 */

import { LLMIntegration, CommanderPersonality } from '../integrations/LLMIntegration';
import { AIController, AIDecision } from '../AIController';
import { MemoryManager, ContextCompressor } from '../memory';

export interface CommanderBehavior {
  personality: CommanderPersonality;
  behaviorTree: BehaviorNode;
  adaptationHistory: Array<{
    tick: number;
    playerAction: string;
    response: string;
    effectiveness: number;
  }>;
}

export interface BehaviorNode {
  type: 'sequence' | 'selector' | 'action' | 'condition';
  name: string;
  children?: BehaviorNode[];
  action?: (gameState: any, personality: CommanderPersonality) => AIDecision | null;
  condition?: (gameState: any, personality: CommanderPersonality) => boolean;
}

export class EnhancedCommanderSystem {
  private llm: LLMIntegration | null = null;
  private commanders: Map<string, CommanderBehavior> = new Map();
  private aiControllers: Map<string, AIController> = new Map();
  private memoryManager: MemoryManager;
  private contextCompressor: ContextCompressor;

  constructor(llmConfig?: { provider: 'google' | 'saga' | 'openai'; apiKey?: string }) {
    if (llmConfig) {
      this.llm = new LLMIntegration({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        temperature: 0.8,
        maxTokens: 300
      });
    }

    // Initialize memory systems
    this.memoryManager = new MemoryManager();
    this.contextCompressor = new ContextCompressor(llmConfig);
  }

  /**
   * Create a new commander with AI-generated personality
   */
  async createCommander(
    archetype: string,
    seed: number,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<CommanderBehavior> {
    const commanderId = `${archetype}_${seed}`;

    // Check if already exists
    if (this.commanders.has(commanderId)) {
      return this.commanders.get(commanderId)!;
    }

    // Generate personality using LLM
    let personality: CommanderPersonality;
    if (this.llm) {
      try {
        personality = await this.llm.generateCommanderPersonality(archetype, seed);
      } catch (error) {
        console.warn('LLM personality generation failed, using fallback', error);
        personality = this.getFallbackPersonality(archetype);
      }
    } else {
      personality = this.getFallbackPersonality(archetype);
    }

    // Create behavior tree based on personality
    const behaviorTree = this.createBehaviorTree(personality, difficulty);

    // Create AI controller
    const aiController = new AIController(difficulty, seed);

    const commander: CommanderBehavior = {
      personality,
      behaviorTree,
      adaptationHistory: []
    };

    this.commanders.set(commanderId, commander);
    this.aiControllers.set(commanderId, aiController);

    // Store initial memory about commander
    await this.memoryManager.storeMemory({
      entityId: commanderId,
      entityType: 'commander',
      content: `Commander ${personality.name} (${archetype}) created with personality traits: ${JSON.stringify(personality.traits)}`,
      metadata: {
        timestamp: Date.now(),
        importance: 0.7,
        tags: ['creation', 'commander', archetype]
      }
    });

    return commander;
  }

  /**
   * Create behavior tree based on personality
   */
  private createBehaviorTree(
    personality: CommanderPersonality,
    difficulty: 'easy' | 'medium' | 'hard'
  ): BehaviorNode {
    return {
      type: 'selector',
      name: 'root',
      children: [
        // Assess situation
        {
          type: 'sequence',
          name: 'assess',
          children: [
            {
              type: 'condition',
              name: 'check_threat',
              condition: (gameState, personality) => {
                const threat = this.calculateThreatLevel(gameState);
                return threat > (1 - personality.traits.riskTolerance);
              }
            },
            {
              type: 'selector',
              name: 'threat_response',
              children: [
                {
                  type: 'action',
                  name: 'defend',
                  action: (gameState, personality) => ({
                    type: 'defend',
                    priority: 0.9 * personality.traits.riskTolerance,
                    reason: 'High threat detected, prioritizing defense'
                  })
                }
              ]
            }
          ]
        },
        // Strategic focus
        {
          type: 'sequence',
          name: 'strategic',
          children: [
            {
              type: 'condition',
              name: 'check_strategic_opportunity',
              condition: (gameState, personality) => {
                return Number(personality.traits.strategicFocus) > 0.6;
              }
            },
            {
              type: 'action',
              name: 'invest_in_tech',
              action: (gameState, personality) => ({
                type: 'research',
                priority: 0.8 * Number(personality.traits.strategicFocus),
                reason: 'Strategic focus: investing in technology'
              })
            }
          ]
        },
        // Aggression
        {
          type: 'sequence',
          name: 'aggression',
          children: [
            {
              type: 'condition',
              name: 'check_aggression_opportunity',
              condition: (gameState, personality) => {
                const advantage = this.calculateMilitaryAdvantage(gameState);
                return personality.traits.aggression > 0.6 && advantage > 0.2;
              }
            },
            {
              type: 'action',
              name: 'attack',
              action: (gameState, personality) => ({
                type: 'attack',
                priority: 0.7 * personality.traits.aggression,
                reason: 'Aggressive commander seizing opportunity'
              })
            }
          ]
        },
        // Default: expansion
        {
          type: 'action',
          name: 'expand',
          action: (gameState, personality) => ({
            type: 'expand',
            priority: 0.6,
            reason: 'Default expansion strategy'
          })
        }
      ]
    };
  }

  /**
   * Make decision for commander
   */
  async makeDecision(
    commanderId: string,
    gameState: any
  ): Promise<AIDecision[]> {
    const commander = this.commanders.get(commanderId);
    if (!commander) {
      throw new Error(`Commander not found: ${commanderId}`);
    }

    // Execute behavior tree
    const decisions: AIDecision[] = [];
    this.executeBehaviorTree(commander.behaviorTree, gameState, commander.personality, decisions);

    // If no decisions from behavior tree, use AI controller fallback
    if (decisions.length === 0) {
      const aiController = this.aiControllers.get(commanderId);
      if (aiController) {
        const fallbackDecisions = aiController.update(gameState);
        decisions.push(...fallbackDecisions);
      }
    }

    return decisions;
  }

  /**
   * Execute behavior tree node
   */
  private executeBehaviorTree(
    node: BehaviorNode,
    gameState: any,
    personality: CommanderPersonality,
    decisions: AIDecision[]
  ): boolean {
    switch (node.type) {
      case 'sequence':
        // All children must succeed
        if (node.children) {
          for (const child of node.children) {
            if (!this.executeBehaviorTree(child, gameState, personality, decisions)) {
              return false;
            }
          }
          return true;
        }
        return false;

      case 'selector':
        // First successful child wins
        if (node.children) {
          for (const child of node.children) {
            if (this.executeBehaviorTree(child, gameState, personality, decisions)) {
              return true;
            }
          }
        }
        return false;

      case 'condition':
        if (node.condition) {
          return node.condition(gameState, personality);
        }
        return false;

      case 'action':
        if (node.action) {
          const decision = node.action(gameState, personality);
          if (decision) {
            decisions.push(decision);
            return true;
          }
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Adapt to player tactics
   */
  adaptToPlayer(
    commanderId: string,
    playerAction: string,
    effectiveness: number
  ): void {
    const commander = this.commanders.get(commanderId);
    if (!commander) return;

    // Record adaptation
    commander.adaptationHistory.push({
      tick: Date.now(),
      playerAction,
      response: 'adapting',
      effectiveness
    });

    // Modify behavior tree based on repeated tactics
    if (this.isRepeatedStrategy(commander.adaptationHistory, playerAction)) {
      this.modifyBehaviorTree(commander.behaviorTree, playerAction);
    }
  }

  /**
   * Check if strategy is repeated
   */
  private isRepeatedStrategy(
    history: CommanderBehavior['adaptationHistory'],
    action: string
  ): boolean {
    const recent = history.slice(-5);
    const count = recent.filter(h => h.playerAction === action).length;
    return count >= 3;
  }

  /**
   * Modify behavior tree to counter repeated strategy
   */
  private modifyBehaviorTree(node: BehaviorNode, counteredAction: string): void {
    // Add counter-strategy nodes
    if (node.type === 'selector' && node.children) {
      // Add counter node at the beginning
      const counterNode: BehaviorNode = {
        type: 'action',
        name: `counter_${counteredAction}`,
        action: (gameState, personality) => ({
          type: counteredAction === 'rush' ? 'defend' : 'attack',
          priority: 0.9,
          reason: `Countering repeated ${counteredAction} strategy`
        })
      };

      node.children.unshift(counterNode);
    }

    // Recursively modify children
    if (node.children) {
      node.children.forEach(child => this.modifyBehaviorTree(child, counteredAction));
    }
  }

  /**
   * Calculate threat level
   */
  private calculateThreatLevel(gameState: any): number {
    // Simplified threat calculation
    const aiPlayer = gameState.players?.get(2);
    const humanPlayer = gameState.players?.get(1);

    if (!aiPlayer || !humanPlayer) return 0;

    const enemyUnits = humanPlayer.units?.length || 0;
    const ourUnits = aiPlayer.units?.length || 0;
    const distanceToBase = 0.5; // Simplified

    return Math.min(1, (enemyUnits / Math.max(ourUnits, 1)) * distanceToBase);
  }

  /**
   * Calculate military advantage
   */
  private calculateMilitaryAdvantage(gameState: any): number {
    const aiPlayer = gameState.players?.get(2);
    const humanPlayer = gameState.players?.get(1);

    if (!aiPlayer || !humanPlayer) return 0;

    const aiStrength = aiPlayer.units?.length || 0;
    const humanStrength = humanPlayer.units?.length || 0;
    const total = aiStrength + humanStrength;

    if (total === 0) return 0;
    return (aiStrength - humanStrength) / total;
  }

  /**
   * Get fallback personality
   */
  private getFallbackPersonality(archetype: string): CommanderPersonality {
    const archetypes: Record<string, CommanderPersonality> = {
      'the_architect': {
        name: 'The Architect',
        archetype: 'architect' as const,
        focus: 'tech' as const,
        aggressiveness: 0.3,
        economyFocus: 0.7,
        techFocus: 0.8,
        adaptability: 0.6,
        riskTolerance: 0.2
      },
      'the_aggressor': {
        name: 'The Aggressor',
        archetype: 'aggressor' as const,
        focus: 'military' as const,
        aggressiveness: 0.9,
        economyFocus: 0.3,
        techFocus: 0.2,
        adaptability: 0.4,
        riskTolerance: 0.8
      },
      'the_guardian': {
        name: 'The Guardian',
        archetype: 'balanced' as const,
        focus: 'balanced' as const,
        aggressiveness: 0.2,
        economyFocus: 0.6,
        techFocus: 0.5,
        adaptability: 0.7,
        riskTolerance: 0.3
      }
    };

    return archetypes[archetype.toLowerCase()] || {
      name: `Commander ${archetype}`,
      archetype: 'balanced' as const,
      focus: 'balanced' as const,
      aggressiveness: 0.5,
      economyFocus: 0.5,
      techFocus: 0.5,
      adaptability: 0.5,
      riskTolerance: 0.5
    };
  }

  /**
   * Get commander by ID
   */
  getCommander(commanderId: string): CommanderBehavior | undefined {
    return this.commanders.get(commanderId);
  }
}

