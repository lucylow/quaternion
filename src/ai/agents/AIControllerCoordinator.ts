/**
 * AI Controller Coordinator - Main system that coordinates all specialized agents
 * This is the master controller that resolves conflicts and makes final strategic decisions
 */

import { AgentType, AgentRecommendation, AgentAction, GameStateSnapshot, AgentPersonality, IAgent } from './AgentBase';
import { EconomicAgent } from './EconomicAgent';
import { MilitaryAgent } from './MilitaryAgent';
import { ResearchAgent } from './ResearchAgent';
import { ScoutingAgent } from './ScoutingAgent';
import { QuaternionGameState } from '../../game/QuaternionGameState';
import { SeededRandom } from '../../lib/SeededRandom';
import { EnhancedCommanderPersonality, CommanderPersonality } from '../EnhancedCommanderPersonality';

export interface StrategicDecision {
  actions: AgentAction[];
  strategicFocus: AgentType;
  narrative: string;
  confidence: number;
  timestamp: number;
}

export class AIControllerCoordinator {
  private agents: Map<AgentType, IAgent> = new Map();
  private personality: AgentPersonality;
  private commanderPersonality: CommanderPersonality;
  private rng: SeededRandom;
  private decisionHistory: StrategicDecision[] = [];
  private maxHistorySize: number = 50;

  // Configuration
  private decisionInterval: number = 120; // 2 seconds at 60 tps
  private lastDecisionTick: number = 0;
  private enableLLMIntegration: boolean = true;
  private llmConfidenceThreshold: number = 0.7;

  constructor(commanderPersonality: CommanderPersonality, seed: number) {
    this.commanderPersonality = commanderPersonality;
    this.rng = new SeededRandom(seed);
    
    // Convert commander personality to agent personality
    this.personality = this.convertCommanderToAgentPersonality(commanderPersonality);
    
    // Initialize all agents
    this.initializeAgents();
  }

  /**
   * Main update function - called each game tick
   */
  public update(gameState: QuaternionGameState, currentTick: number): StrategicDecision | null {
    // Only make strategic decisions at intervals
    if (currentTick - this.lastDecisionTick < this.decisionInterval) {
      return null;
    }

    this.lastDecisionTick = currentTick;

    // Capture game state snapshot
    const gameStateSnapshot = this.captureGameStateSnapshot(gameState);

    // Get recommendations from all agents
    const recommendations = this.collectAgentRecommendations(gameStateSnapshot);

    // Resolve conflicts and make final decision
    const strategicDecision = this.resolveRecommendations(recommendations, gameStateSnapshot);

    // Store decision history
    this.decisionHistory.push(strategicDecision);
    if (this.decisionHistory.length > this.maxHistorySize) {
      this.decisionHistory.shift();
    }

    return strategicDecision;
  }

  /**
   * Initialize all specialized agents
   */
  private initializeAgents(): void {
    // Create agent instances with personality variations
    const economicPersonality = this.createAgentPersonalityVariant('economic');
    const militaryPersonality = this.createAgentPersonalityVariant('military');
    const researchPersonality = this.createAgentPersonalityVariant('research');
    const scoutingPersonality = this.createAgentPersonalityVariant('scouting');

    this.agents.set(AgentType.ECONOMIC, new EconomicAgent(economicPersonality, this.rng.next()));
    this.agents.set(AgentType.MILITARY, new MilitaryAgent(militaryPersonality, this.rng.next()));
    this.agents.set(AgentType.RESEARCH, new ResearchAgent(researchPersonality, this.rng.next()));
    this.agents.set(AgentType.SCOUTING, new ScoutingAgent(scoutingPersonality, this.rng.next()));
  }

  /**
   * Create personality variant for specific agent type
   */
  private createAgentPersonalityVariant(agentType: string): AgentPersonality {
    const base = this.personality;
    
    // Adjust personality based on agent specialization
    const variant: AgentPersonality = {
      personalityName: `${base.personalityName}_${agentType}`,
      aggression: agentType === 'military' ? base.aggression * 1.2 : base.aggression * 0.9,
      adaptability: base.adaptability,
      riskTolerance: base.riskTolerance,
      economicFocus: agentType === 'economic' ? base.economicFocus * 1.3 : base.economicFocus * 0.8,
      strategicPatience: agentType === 'research' ? base.strategicPatience * 1.2 : base.strategicPatience,
      backstory: base.backstory,
      preferredTactics: base.preferredTactics,
      weakness: base.weakness
    };

    // Clamp values
    variant.aggression = this.clamp(0, 1, variant.aggression);
    variant.economicFocus = this.clamp(0, 1, variant.economicFocus);
    variant.strategicPatience = this.clamp(0, 1, variant.strategicPatience);

    return variant;
  }

  /**
   * Convert commander personality to agent personality
   */
  private convertCommanderToAgentPersonality(commander: CommanderPersonality): AgentPersonality {
    return {
      personalityName: commander.name,
      aggression: commander.traits.aggression,
      adaptability: commander.traits.adaptability,
      riskTolerance: commander.traits.riskTolerance,
      economicFocus: commander.traits.strategicFocus === 'econ' ? 0.8 : 
                     commander.traits.strategicFocus === 'military' ? 0.3 : 0.5,
      strategicPatience: commander.traits.patience,
      backstory: `Commander ${commander.name} (${commander.archetype})`,
      preferredTactics: commander.traits.strategicFocus,
      weakness: 'Adaptive opponent' // Would be generated by LLM
    };
  }

  /**
   * Capture game state snapshot for AI decision making
   */
  private captureGameStateSnapshot(gameState: QuaternionGameState): GameStateSnapshot {
    const aiPlayer = Array.from(gameState.players.values()).find(p => p.isAI);
    const humanPlayer = Array.from(gameState.players.values()).find(p => !p.isAI);

    if (!aiPlayer) {
      throw new Error('AI player not found in game state');
    }

    // Calculate resources
    const resources = aiPlayer.resources;
    const totalResources = resources.ore + resources.energy + resources.biomass + resources.data;

    // Calculate unit composition (simplified - would use actual unit manager)
    const units = gameState.units.filter(u => u.playerId === aiPlayer.id);
    const offensiveUnits = units.filter(u => u.type === 'soldier' || u.type === 'tank').length;
    const defensiveUnits = units.filter(u => u.type === 'defender').length;
    const workers = units.filter(u => u.type === 'worker').length;

    // Calculate tech progress
    const researchedCount = aiPlayer.researchedTechs.size;
    const currentResearch = null; // Would come from tech tree manager

    // Calculate map control (simplified)
    const controlledArea = 0.5; // Would calculate from actual map
    const chokepointsHeld = 1; // Would calculate from map
    const expansionSites = 2; // Would calculate from map

    // Enemy visibility (simplified)
    const enemyUnits = gameState.units.filter(u => u.playerId !== aiPlayer.id);
    const enemyVisibility = {
      units: enemyUnits.map(u => ({
        position: { x: u.x || 0, y: u.y || 0 },
        type: u.type,
        health: u.health || 100
      })),
      structures: [], // Would come from buildings
      lastSeen: new Map<string, number>()
    };

    // Threat assessment (simplified)
    const immediateThreat = enemyUnits.length > 5 ? 0.7 : enemyUnits.length > 0 ? 0.4 : 0.1;
    const potentialThreat = 0.5; // Would calculate from game state

    return {
      gameTime: gameState.gameTime,
      tick: gameState.tick,
      resources: {
        ore: resources.ore,
        energy: resources.energy,
        biomass: resources.biomass,
        data: resources.data,
        total: totalResources
      },
      unitComposition: {
        offensiveUnits,
        defensiveUnits,
        workers,
        total: units.length
      },
      techProgress: {
        researchedCount,
        availableOptions: 5, // Would come from tech tree
        currentResearch
      },
      mapControl: {
        controlledArea,
        chokepointsHeld,
        expansionSites
      },
      enemyVisibility,
      threatAssessment: {
        immediate: immediateThreat,
        potential: potentialThreat,
        timeline: immediateThreat > 0.5 ? 60 : 300
      }
    };
  }

  /**
   * Collect recommendations from all agents
   */
  private collectAgentRecommendations(gameStateSnapshot: GameStateSnapshot): Map<AgentType, AgentRecommendation> {
    const recommendations = new Map<AgentType, AgentRecommendation>();

    for (const [agentType, agent] of this.agents.entries()) {
      try {
        const recommendation = agent.generateRecommendation(gameStateSnapshot);
        recommendations.set(agentType, recommendation);
      } catch (error) {
        console.error(`Error getting recommendation from ${agentType} agent:`, error);
      }
    }

    return recommendations;
  }

  /**
   * Resolve conflicts between agent recommendations and make final decision
   */
  private resolveRecommendations(
    recommendations: Map<AgentType, AgentRecommendation>,
    gameState: GameStateSnapshot
  ): StrategicDecision {
    // Calculate priority scores
    const priorityScores = new Map<AgentType, number>();
    for (const [agentType, rec] of recommendations.entries()) {
      priorityScores.set(agentType, this.calculatePriorityScore(rec, gameState));
    }

    // Resolve action conflicts
    const finalActions = this.resolveActionConflicts(recommendations, priorityScores, gameState);

    // Determine strategic focus
    const strategicFocus = this.determineStrategicFocus(priorityScores);

    // Generate strategic narrative
    const narrative = this.generateStrategicNarrative(recommendations, finalActions, gameState);

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(recommendations);

    return {
      actions: finalActions,
      strategicFocus,
      narrative,
      confidence,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate priority score for a recommendation
   */
  private calculatePriorityScore(recommendation: AgentRecommendation, gameState: GameStateSnapshot): number {
    let score = recommendation.priority;
    
    // Boost score based on confidence
    score *= (0.7 + recommendation.confidence * 0.3);
    
    // Adjust based on current game state
    if (recommendation.agentType === AgentType.MILITARY && gameState.threatAssessment.immediate > 0.7) {
      score *= 1.3;
    }
    
    if (recommendation.agentType === AgentType.ECONOMIC && gameState.resources.total < 200) {
      score *= 1.2;
    }
    
    return this.clamp(0, 1, score);
  }

  /**
   * Resolve conflicts between competing actions
   */
  private resolveActionConflicts(
    recommendations: Map<AgentType, AgentRecommendation>,
    priorities: Map<AgentType, number>,
    gameState: GameStateSnapshot
  ): AgentAction[] {
    const finalActions: AgentAction[] = [];
    const availableResources = { ...gameState.resources };
    
    // Sort recommendations by priority
    const sortedRecommendations = Array.from(recommendations.entries())
      .sort((a, b) => (priorities.get(b[0]) || 0) - (priorities.get(a[0]) || 0));

    for (const [agentType, recommendation] of sortedRecommendations) {
      for (const action of recommendation.recommendedActions) {
        if (this.canExecuteAction(action, availableResources)) {
          finalActions.push(action);
          this.deductActionCost(action, availableResources);
        } else if ((priorities.get(agentType) || 0) > 0.8) {
          // High priority action - try to find compromise
          const modifiedAction = this.modifyActionToFitResources(action, availableResources);
          if (modifiedAction) {
            finalActions.push(modifiedAction);
            this.deductActionCost(modifiedAction, availableResources);
          }
        }
      }
    }

    return finalActions;
  }

  /**
   * Check if action can be executed with available resources
   */
  private canExecuteAction(action: AgentAction, resources: GameStateSnapshot['resources']): boolean {
    if (!action.requiredResources) return true;
    
    return resources.ore >= action.requiredResources.ore &&
           resources.energy >= action.requiredResources.energy &&
           resources.biomass >= action.requiredResources.biomass &&
           resources.data >= action.requiredResources.data;
  }

  /**
   * Deduct action cost from available resources
   */
  private deductActionCost(action: AgentAction, resources: GameStateSnapshot['resources']): void {
    if (!action.requiredResources) return;
    
    resources.ore -= action.requiredResources.ore;
    resources.energy -= action.requiredResources.energy;
    resources.biomass -= action.requiredResources.biomass;
    resources.data -= action.requiredResources.data;
    resources.total = resources.ore + resources.energy + resources.biomass + resources.data;
  }

  /**
   * Modify action to fit available resources
   */
  private modifyActionToFitResources(
    action: AgentAction,
    availableResources: GameStateSnapshot['resources']
  ): AgentAction | null {
    if (!action.requiredResources) return action;
    
    // Try reducing count if applicable
    if (action.count && action.count > 1) {
      const reducedCount = Math.max(1, Math.floor(
        action.count * Math.min(
          availableResources.ore / action.requiredResources.ore,
          availableResources.energy / action.requiredResources.energy,
          1
        )
      ));
      
      if (reducedCount < action.count) {
        const modified = { ...action };
        modified.count = reducedCount;
        if (modified.requiredResources) {
          modified.requiredResources = {
            ore: modified.requiredResources.ore * (reducedCount / action.count),
            energy: modified.requiredResources.energy * (reducedCount / action.count),
            biomass: modified.requiredResources.biomass * (reducedCount / action.count),
            data: modified.requiredResources.data * (reducedCount / action.count)
          };
        }
        return modified;
      }
    }
    
    return null;
  }

  /**
   * Determine overall strategic focus
   */
  private determineStrategicFocus(priorities: Map<AgentType, number>): AgentType {
    let maxPriority = 0;
    let focus: AgentType = AgentType.ECONOMIC;
    
    for (const [agentType, priority] of priorities.entries()) {
      if (priority > maxPriority) {
        maxPriority = priority;
        focus = agentType;
      }
    }
    
    return focus;
  }

  /**
   * Generate strategic narrative
   */
  private generateStrategicNarrative(
    recommendations: Map<AgentType, AgentRecommendation>,
    finalActions: AgentAction[],
    gameState: GameStateSnapshot
  ): string {
    const summary: string[] = [];
    
    for (const [agentType, rec] of recommendations.entries()) {
      summary.push(`${agentType}: ${rec.reasoning}`);
    }
    
    const actionTypes = finalActions.map(a => a.type).join(', ');
    return `Strategic focus: ${actionTypes}. ${summary.join(' ')}`;
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(recommendations: Map<AgentType, AgentRecommendation>): number {
    if (recommendations.size === 0) return 0.5;
    
    const confidences = Array.from(recommendations.values()).map(r => r.confidence);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    
    // Boost confidence if agents agree
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length;
    const agreementBonus = (1 - Math.min(variance, 0.5)) * 0.2;
    
    return this.clamp(0, 1, avgConfidence + agreementBonus);
  }

  /**
   * Learn from decision outcome
   */
  public learnFromOutcome(
    decision: StrategicDecision,
    previousState: GameStateSnapshot,
    newState: GameStateSnapshot
  ): void {
    // Update all agents with outcome
    for (const action of decision.actions) {
      // Find which agent recommended this action
      for (const [agentType, agent] of this.agents.entries()) {
        // Simplified - would track which agent recommended which action
        agent.learnFromOutcome(action, previousState, newState);
      }
    }
  }

  private clamp(min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Get current strategic state
   */
  public getStrategicState(): {
    focus: AgentType;
    confidence: number;
    recentDecisions: number;
  } {
    return {
      focus: this.decisionHistory.length > 0 
        ? this.decisionHistory[this.decisionHistory.length - 1].strategicFocus
        : AgentType.ECONOMIC,
      confidence: this.decisionHistory.length > 0
        ? this.decisionHistory[this.decisionHistory.length - 1].confidence
        : 0.5,
      recentDecisions: this.decisionHistory.length
    };
  }
}


