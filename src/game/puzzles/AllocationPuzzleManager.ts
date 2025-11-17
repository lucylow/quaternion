/**
 * Allocation Puzzle Manager
 * Generates dynamic resource allocation puzzles with trade-offs
 */

import { ResourceType, ResourceCost } from '../ResourceManager';
import { LLMIntegration } from '@/ai/integrations/LLMIntegration';

export interface AllocationOption {
  optionId: string;
  optionName: string;
  resourceCosts: ResourceCost;
  immediateEffects: Partial<Record<ResourceType, number>>;
  longTermEffects: Partial<Record<ResourceType, number>>;
  strategicRationale: string;
  riskLevel: number; // 0-1 scale
  prerequisiteTech?: string[];
}

export interface AllocationPuzzle {
  puzzleId: string;
  scenarioDescription: string;
  options: AllocationOption[];
  timeLimit?: number; // seconds
  successCondition?: string;
  failureCondition?: string;
  successRewards?: Partial<Record<ResourceType, number>>;
  failurePenalties?: Partial<Record<ResourceType, number>>;
  aiNarrative: string;
  createdAt: number;
}

export interface PuzzleContext {
  currentResources: Record<ResourceType, number>;
  activeEvents: any[];
  techProgress: {
    researchLevel: number;
    researchedTechs: string[];
  };
  playerBehavior: string;
  strategicSituation: string;
}

export class AllocationPuzzleManager {
  private puzzleHistory: AllocationPuzzle[] = [];
  private activePuzzles: AllocationPuzzle[] = [];
  private llmIntegration: LLMIntegration | null = null;

  constructor(llmIntegration?: LLMIntegration) {
    this.llmIntegration = llmIntegration || null;
  }

  /**
   * Generate a new allocation puzzle based on current game state
   */
  public async generatePuzzle(context: PuzzleContext): Promise<AllocationPuzzle | null> {
    try {
      // Analyze context to determine puzzle type
      const puzzleType = this.analyzePuzzleType(context);

      // Generate puzzle options
      const options = this.generatePuzzleOptions(context, puzzleType);

      // Generate narrative
      const narrative = await this.generateNarrative(context, puzzleType);

      const puzzle: AllocationPuzzle = {
        puzzleId: `puzzle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scenarioDescription: this.generateScenarioDescription(context, puzzleType),
        options,
        aiNarrative: narrative,
        createdAt: Date.now()
      };

      this.activePuzzles.push(puzzle);
      return puzzle;
    } catch (error) {
      console.error('Failed to generate allocation puzzle:', error);
      return null;
    }
  }

  private analyzePuzzleType(context: PuzzleContext): string {
    const { currentResources, activeEvents, techProgress } = context;

    // Check resource balance
    const totalResources = Object.values(currentResources).reduce((a, b) => a + b, 0);
    const avgResource = totalResources / 4;
    const imbalances = Object.values(currentResources).filter(r => Math.abs(r - avgResource) > avgResource * 0.3);

    if (imbalances.length > 2) {
      return 'resource_imbalance';
    }

    if (activeEvents.length > 0) {
      return 'crisis_response';
    }

    if (techProgress.researchLevel > 5) {
      return 'strategic_choice';
    }

    return 'standard_allocation';
  }

  private generatePuzzleOptions(context: PuzzleContext, puzzleType: string): AllocationOption[] {
    const { currentResources } = context;
    const totalResources = Object.values(currentResources).reduce((a, b) => a + b, 0);

    const options: AllocationOption[] = [];

    // Option 1: Aggressive Expansion
    const expansionCost = Math.floor(totalResources * 0.4);
    options.push({
      optionId: 'expansion',
      optionName: 'Aggressive Expansion',
      resourceCosts: {
        ore: expansionCost * 0.5,
        energy: expansionCost * 0.3,
        biomass: expansionCost * 0.1,
        data: expansionCost * 0.1
      },
      immediateEffects: {
        [ResourceType.ORE]: -expansionCost * 0.5,
        [ResourceType.ENERGY]: -expansionCost * 0.3
      },
      longTermEffects: {
        [ResourceType.ORE]: expansionCost * 0.3, // Future income
        [ResourceType.ENERGY]: expansionCost * 0.2
      },
      strategicRationale: 'High risk, high reward. Expand territory to secure more resource nodes.',
      riskLevel: 0.7
    });

    // Option 2: Defensive Consolidation
    const defenseCost = Math.floor(totalResources * 0.3);
    options.push({
      optionId: 'defense',
      optionName: 'Defensive Consolidation',
      resourceCosts: {
        ore: defenseCost * 0.4,
        energy: defenseCost * 0.3,
        biomass: defenseCost * 0.2,
        data: defenseCost * 0.1
      },
      immediateEffects: {
        [ResourceType.ORE]: -defenseCost * 0.4,
        [ResourceType.ENERGY]: -defenseCost * 0.3
      },
      longTermEffects: {
        [ResourceType.ORE]: defenseCost * 0.1, // Steady income
        [ResourceType.ENERGY]: defenseCost * 0.1
      },
      strategicRationale: 'Low risk, steady growth. Fortify existing positions.',
      riskLevel: 0.2
    });

    // Option 3: Technological Breakthrough
    const techCost = Math.floor(totalResources * 0.5);
    options.push({
      optionId: 'technology',
      optionName: 'Technological Breakthrough',
      resourceCosts: {
        ore: techCost * 0.2,
        energy: techCost * 0.2,
        biomass: techCost * 0.1,
        data: techCost * 0.5
      },
      immediateEffects: {
        [ResourceType.DATA]: -techCost * 0.5,
        [ResourceType.ORE]: -techCost * 0.2
      },
      longTermEffects: {
        [ResourceType.ORE]: techCost * 0.4, // Tech unlocks better income
        [ResourceType.ENERGY]: techCost * 0.3,
        [ResourceType.DATA]: techCost * 0.2
      },
      strategicRationale: 'Delayed but powerful. Research unlocks future advantages.',
      riskLevel: 0.5
    });

    // Option 4: Economic Optimization
    const econCost = Math.floor(totalResources * 0.35);
    options.push({
      optionId: 'economy',
      optionName: 'Economic Optimization',
      resourceCosts: {
        ore: econCost * 0.4,
        energy: econCost * 0.3,
        biomass: econCost * 0.2,
        data: econCost * 0.1
      },
      immediateEffects: {
        [ResourceType.ORE]: -econCost * 0.4
      },
      longTermEffects: {
        [ResourceType.ORE]: econCost * 0.25, // Efficiency gains
        [ResourceType.ENERGY]: econCost * 0.2,
        [ResourceType.BIOMASS]: econCost * 0.15
      },
      strategicRationale: 'Efficiency focus. Optimize existing infrastructure.',
      riskLevel: 0.3
    });

    return options;
  }

  private generateScenarioDescription(context: PuzzleContext, puzzleType: string): string {
    const scenarios: Record<string, string[]> = {
      'resource_imbalance': [
        'Your resources are imbalanced. Critical decisions must be made to restore equilibrium.',
        'Resource allocation crisis detected. Strategic reallocation required.'
      ],
      'crisis_response': [
        'A crisis has emerged. How will you allocate your limited resources?',
        'Emergency situation detected. Resource allocation decisions needed immediately.'
      ],
      'strategic_choice': [
        'A strategic crossroads approaches. Choose your path wisely.',
        'Multiple strategic options present themselves. Each has consequences.'
      ],
      'standard_allocation': [
        'You have resources to allocate. Choose your strategic focus.',
        'Resource allocation opportunity. Plan your next move carefully.'
      ]
    };

    const texts = scenarios[puzzleType] || scenarios['standard_allocation'];
    return texts[Math.floor(Math.random() * texts.length)];
  }

  private async generateNarrative(context: PuzzleContext, puzzleType: string): Promise<string> {
    if (this.llmIntegration) {
      try {
        const prompt = `Generate a brief narrative (2 sentences max) for a resource allocation puzzle in a sci-fi RTS game.

Context: ${JSON.stringify(context)}
Puzzle Type: ${puzzleType}

Make it engaging and strategic.`;

        const response = await this.llmIntegration['callLLM'](prompt);
        return this.cleanText(response);
      } catch (error) {
        console.warn('LLM narrative generation failed:', error);
      }
    }

    // Fallback narrative
    return 'Your commanders await your decision. The fate of your operation hangs in the balance.';
  }

  private cleanText(text: string): string {
    return text.trim().replace(/^["']|["']$/g, '').trim();
  }

  /**
   * Execute an allocation decision
   */
  public executeDecision(puzzleId: string, optionId: string): {
    success: boolean;
    puzzle?: AllocationPuzzle;
    option?: AllocationOption;
  } {
    const puzzle = this.activePuzzles.find(p => p.puzzleId === puzzleId);
    if (!puzzle) {
      return { success: false };
    }

    const option = puzzle.options.find(o => o.optionId === optionId);
    if (!option) {
      return { success: false };
    }

    // Remove puzzle from active list
    this.activePuzzles = this.activePuzzles.filter(p => p.puzzleId !== puzzleId);
    this.puzzleHistory.push(puzzle);

    return { success: true, puzzle, option };
  }

  /**
   * Get active puzzles
   */
  public getActivePuzzles(): AllocationPuzzle[] {
    return this.activePuzzles;
  }

  /**
   * Clear expired puzzles
   */
  public clearExpiredPuzzles(currentTime: number, maxAge: number = 300000): void {
    this.activePuzzles = this.activePuzzles.filter(
      puzzle => currentTime - puzzle.createdAt < maxAge
    );
  }
}

