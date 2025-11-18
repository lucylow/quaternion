/**
 * Research Agent - Specialized AI for technology research and tech tree optimization
 */

import { BaseAgent, AgentType, AgentRecommendation, AgentAction, GameStateSnapshot, AgentPersonality } from './AgentBase';
import { SeededRandom } from '../../lib/SeededRandom';

interface ResearchAnalysis {
  currentTechLevel: number;
  availableTechs: Array<{
    id: string;
    category: 'military' | 'economic' | 'defensive' | 'utility';
    cost: { ore: number; energy: number; biomass: number; data: number };
    benefit: number; // 0-1
    prerequisites: string[];
  }>;
  techGap: number; // -1 to 1 (negative = behind, positive = ahead)
  researchEfficiency: number; // 0-1
}

interface ResearchPath {
  pathName: string;
  techs: Array<{
    id: string;
    order: number;
    priority: number;
  }>;
  estimatedTime: number; // ticks
  totalCost: { ore: number; energy: number; biomass: number; data: number };
  expectedBenefit: number; // 0-1
  alignment: number; // 0-1, how well it aligns with current needs
}

export class ResearchAgent extends BaseAgent {
  private techTreeSolver: Map<string, number> = new Map(); // Tech path success rates

  constructor(personality: AgentPersonality, seed: number) {
    super(personality, seed);
    this.initializeTechTreeSolver();
  }

  getAgentType(): AgentType {
    return AgentType.RESEARCH;
  }

  generateRecommendation(gameState: GameStateSnapshot): AgentRecommendation {
    const analysis = this.analyzeResearchState(gameState);
    const viablePaths = this.generateResearchPaths(analysis, gameState);
    const optimalPath = this.selectOptimalPath(viablePaths, gameState);

    return {
      agentType: AgentType.RESEARCH,
      priority: this.calculateResearchPriority(gameState, analysis),
      recommendedActions: this.convertPathToActions(optimalPath, gameState),
      confidence: this.getConfidence(gameState),
      reasoning: this.generateResearchReasoning(optimalPath, analysis),
      estimatedCost: optimalPath.totalCost
    };
  }

  protected calculateOutcomeScore(
    previousState: GameStateSnapshot,
    newState: GameStateSnapshot,
    action: AgentAction
  ): number {
    // Score based on tech progress
    const techProgress = (newState.techProgress.researchedCount - previousState.techProgress.researchedCount) / 
                        Math.max(previousState.techProgress.researchedCount, 1);
    
    // Also consider if research completed
    const researchCompleted = newState.techProgress.currentResearch === null && 
                              previousState.techProgress.currentResearch !== null;
    
    return this.clamp((techProgress * 0.7 + (researchCompleted ? 0.3 : 0)), -1, 1);
  }

  protected updateStrategyWeights(action: AgentAction, outcome: number): void {
    if (action.techId) {
      const currentWeight = this.techTreeSolver.get(action.techId) || 0.5;
      const newWeight = currentWeight + (outcome * this.learningRate);
      this.techTreeSolver.set(action.techId, this.clamp(newWeight, 0, 1));
    }
  }

  private initializeTechTreeSolver(): void {
    // Initialize with default tech priorities
    this.techTreeSolver.set('military', 0.6);
    this.techTreeSolver.set('economic', 0.5);
    this.techTreeSolver.set('defensive', 0.5);
    this.techTreeSolver.set('utility', 0.4);
  }

  private analyzeResearchState(gameState: GameStateSnapshot): ResearchAnalysis {
    // Simplified tech analysis - would integrate with actual tech tree
    const currentTechLevel = gameState.techProgress.researchedCount;
    
    // Mock available techs - would come from actual tech tree
    const availableTechs: ResearchAnalysis['availableTechs'] = [
      {
        id: 'advanced_weapons',
        category: 'military',
        cost: { ore: 300, energy: 200, biomass: 0, data: 100 },
        benefit: 0.8,
        prerequisites: []
      },
      {
        id: 'economic_boost',
        category: 'economic',
        cost: { ore: 200, energy: 150, biomass: 0, data: 50 },
        benefit: 0.7,
        prerequisites: []
      },
      {
        id: 'defensive_systems',
        category: 'defensive',
        cost: { ore: 250, energy: 180, biomass: 0, data: 80 },
        benefit: 0.6,
        prerequisites: []
      }
    ];

    // Tech gap (simplified - would compare with enemy)
    const techGap = 0; // Neutral for now

    // Research efficiency (based on current research infrastructure)
    const researchEfficiency = gameState.techProgress.availableOptions > 0 ? 0.7 : 0.4;

    return {
      currentTechLevel,
      availableTechs,
      techGap,
      researchEfficiency
    };
  }

  private generateResearchPaths(analysis: ResearchAnalysis, gameState: GameStateSnapshot): ResearchPath[] {
    const paths: ResearchPath[] = [];

    // Military-focused path
    if (this.personality.aggression > 0.6 || gameState.threatAssessment.immediate > 0.7) {
      const militaryTechs = analysis.availableTechs.filter(t => t.category === 'military');
      if (militaryTechs.length > 0) {
        paths.push({
          pathName: 'Military Technology',
          techs: militaryTechs.map((tech, index) => ({
            id: tech.id,
            order: index,
            priority: 0.8
          })),
          estimatedTime: militaryTechs.length * 120, // ~2 seconds per tech
          totalCost: militaryTechs.reduce((sum, tech) => ({
            ore: sum.ore + tech.cost.ore,
            energy: sum.energy + tech.cost.energy,
            biomass: sum.biomass + tech.cost.biomass,
            data: sum.data + tech.cost.data
          }), { ore: 0, energy: 0, biomass: 0, data: 0 }),
          expectedBenefit: 0.8,
          alignment: this.calculateAlignment('military', gameState)
        });
      }
    }

    // Economic-focused path
    if (this.personality.economicFocus > 0.5 && gameState.resources.total > 500) {
      const economicTechs = analysis.availableTechs.filter(t => t.category === 'economic');
      if (economicTechs.length > 0) {
        paths.push({
          pathName: 'Economic Technology',
          techs: economicTechs.map((tech, index) => ({
            id: tech.id,
            order: index,
            priority: 0.7
          })),
          estimatedTime: economicTechs.length * 120,
          totalCost: economicTechs.reduce((sum, tech) => ({
            ore: sum.ore + tech.cost.ore,
            energy: sum.energy + tech.cost.energy,
            biomass: sum.biomass + tech.cost.biomass,
            data: sum.data + tech.cost.data
          }), { ore: 0, energy: 0, biomass: 0, data: 0 }),
          expectedBenefit: 0.7,
          alignment: this.calculateAlignment('economic', gameState)
        });
      }
    }

    // Defensive path
    if (gameState.threatAssessment.immediate > 0.5) {
      const defensiveTechs = analysis.availableTechs.filter(t => t.category === 'defensive');
      if (defensiveTechs.length > 0) {
        paths.push({
          pathName: 'Defensive Technology',
          techs: defensiveTechs.map((tech, index) => ({
            id: tech.id,
            order: index,
            priority: 0.9
          })),
          estimatedTime: defensiveTechs.length * 120,
          totalCost: defensiveTechs.reduce((sum, tech) => ({
            ore: sum.ore + tech.cost.ore,
            energy: sum.energy + tech.cost.energy,
            biomass: sum.biomass + tech.cost.biomass,
            data: sum.data + tech.cost.data
          }), { ore: 0, energy: 0, biomass: 0, data: 0 }),
          expectedBenefit: 0.6,
          alignment: this.calculateAlignment('defensive', gameState)
        });
      }
    }

    // Balanced path
    if (paths.length === 0 || this.personality.adaptability > 0.7) {
      paths.push({
        pathName: 'Balanced Research',
        techs: analysis.availableTechs.slice(0, 2).map((tech, index) => ({
          id: tech.id,
          order: index,
          priority: 0.6
        })),
        estimatedTime: 240,
        totalCost: analysis.availableTechs.slice(0, 2).reduce((sum, tech) => ({
          ore: sum.ore + tech.cost.ore,
          energy: sum.energy + tech.cost.energy,
          biomass: sum.biomass + tech.cost.biomass,
          data: sum.data + tech.cost.data
        }), { ore: 0, energy: 0, biomass: 0, data: 0 }),
        expectedBenefit: 0.65,
        alignment: 0.5
      });
    }

    return paths;
  }

  private selectOptimalPath(paths: ResearchPath[], gameState: GameStateSnapshot): ResearchPath {
    if (paths.length === 0) {
      // Fallback
      return {
        pathName: 'Basic Research',
        techs: [],
        estimatedTime: 0,
        totalCost: { ore: 0, energy: 0, biomass: 0, data: 0 },
        expectedBenefit: 0.5,
        alignment: 0.5
      };
    }

    const scored = paths.map(path => {
      let score = path.expectedBenefit * path.alignment;
      
      // Adjust for affordability
      const canAfford = this.canAffordPath(path, gameState);
      if (!canAfford) {
        score *= 0.5;
      }
      
      // Adjust for time (prefer faster research)
      score *= (1 - path.estimatedTime / 600);
      
      // Apply learned weights
      const category = path.pathName.toLowerCase().includes('military') ? 'military' :
                      path.pathName.toLowerCase().includes('economic') ? 'economic' :
                      path.pathName.toLowerCase().includes('defensive') ? 'defensive' : 'utility';
      const learnedWeight = this.techTreeSolver.get(category) || 0.5;
      score *= learnedWeight;
      
      return { path, score };
    });

    return scored.reduce((best, current) => 
      current.score > best.score ? current : best
    ).path;
  }

  private calculateAlignment(category: string, gameState: GameStateSnapshot): number {
    let alignment = 0.5;
    
    if (category === 'military') {
      alignment = gameState.threatAssessment.immediate * 0.6 + 
                 (gameState.unitComposition.offensiveUnits / 10) * 0.4;
    } else if (category === 'economic') {
      alignment = (1 - gameState.resources.total / 1000) * 0.6 + 
                 (gameState.unitComposition.workers / 20) * 0.4;
    } else if (category === 'defensive') {
      alignment = gameState.threatAssessment.immediate * 0.8;
    }
    
    return this.clamp(alignment, 0, 1);
  }

  private canAffordPath(path: ResearchPath, gameState: GameStateSnapshot): boolean {
    const resources = gameState.resources;
    return resources.ore >= path.totalCost.ore &&
           resources.energy >= path.totalCost.energy &&
           resources.biomass >= path.totalCost.biomass &&
           resources.data >= path.totalCost.data;
  }

  private convertPathToActions(path: ResearchPath, gameState: GameStateSnapshot): AgentAction[] {
    const actions: AgentAction[] = [];
    
    // Only add the first tech if not currently researching
    if (gameState.techProgress.currentResearch === null && path.techs.length > 0) {
      const firstTech = path.techs[0];
      actions.push({
        type: 'research',
        techId: firstTech.id,
        priority: firstTech.priority,
        reasoning: `Starting ${path.pathName} research path`
      });
    }
    
    // If already researching, just wait
    if (gameState.techProgress.currentResearch !== null) {
      actions.push({
        type: 'research',
        priority: 0.5,
        reasoning: 'Continuing current research'
      });
    }
    
    return actions;
  }

  private calculateResearchPriority(gameState: GameStateSnapshot, analysis: ResearchAnalysis): number {
    let priority = 0.5;
    
    // High priority if tech gap is negative (behind)
    if (analysis.techGap < -0.2) {
      priority = 0.8;
    }
    
    // High priority if no current research
    if (gameState.techProgress.currentResearch === null) {
      priority = Math.max(priority, 0.7);
    }
    
    // Lower priority if under immediate threat
    if (gameState.threatAssessment.immediate > 0.7) {
      priority *= 0.6;
    }
    
    // Adjust by personality
    priority *= (0.5 + (1 - this.personality.aggression) * 0.5); // Less aggressive = more research focus
    
    return this.clamp(priority, 0, 1);
  }

  private generateResearchReasoning(path: ResearchPath, analysis: ResearchAnalysis): string {
    const reasons: Record<string, string[]> = {
      'Military Technology': [
        'Researching military technologies to gain combat advantage.',
        'Advancing weapons technology for superior firepower.',
        'Military tech will provide tactical edge in engagements.'
      ],
      'Economic Technology': [
        'Investing in economic technologies for long-term growth.',
        'Research will accelerate resource generation.',
        'Economic tech provides sustainable advantage.'
      ],
      'Defensive Technology': [
        'Researching defensive systems to protect assets.',
        'Defensive tech will improve survivability.',
        'Fortifying through technological advancement.'
      ],
      'Balanced Research': [
        'Pursuing balanced research path for versatility.',
        'Maintaining technological parity across all areas.',
        'Adaptive research strategy for flexibility.'
      ]
    };

    const pathReasons = reasons[path.pathName] || ['Advancing technology for strategic advantage.'];
    return this.rng.choice(pathReasons);
  }
}


