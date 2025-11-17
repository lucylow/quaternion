/**
 * Scouting Agent - Specialized AI for reconnaissance and intelligence gathering
 */

import { BaseAgent, AgentType, AgentRecommendation, AgentAction, GameStateSnapshot, AgentPersonality } from './AgentBase';
import { SeededRandom } from '../../lib/SeededRandom';

interface ScoutingAnalysis {
  knownAreas: number; // 0-1
  unknownAreas: Array<{
    position: { x: number; y: number };
    priority: number;
    estimatedValue: number;
  }>;
  enemyActivity: Array<{
    position: { x: number; y: number };
    lastSeen: number;
    activityLevel: number;
  }>;
  intelligenceGaps: Array<{
    area: string;
    importance: number;
  }>;
}

export class ScoutingAgent extends BaseAgent {
  private scoutingPriorities: Map<string, number> = new Map();

  constructor(personality: AgentPersonality, seed: number) {
    super(personality, seed);
    this.initializeScoutingPriorities();
  }

  getAgentType(): AgentType {
    return AgentType.SCOUTING;
  }

  generateRecommendation(gameState: GameStateSnapshot): AgentRecommendation {
    const analysis = this.analyzeScoutingState(gameState);
    const scoutingTargets = this.identifyScoutingTargets(analysis, gameState);
    const actions = this.generateScoutingActions(scoutingTargets, gameState);

    return {
      agentType: AgentType.SCOUTING,
      priority: this.calculateScoutingPriority(gameState, analysis),
      recommendedActions: actions,
      confidence: this.getConfidence(gameState),
      reasoning: this.generateScoutingReasoning(analysis, scoutingTargets),
      estimatedCost: { ore: 0, energy: 50, biomass: 0, data: 0 } // Scouting is relatively cheap
    };
  }

  protected calculateOutcomeScore(
    previousState: GameStateSnapshot,
    newState: GameStateSnapshot,
    action: AgentAction
  ): number {
    // Score based on new intelligence gathered
    const newEnemyInfo = newState.enemyVisibility.units.length - previousState.enemyVisibility.units.length;
    const newStructureInfo = newState.enemyVisibility.structures.length - previousState.enemyVisibility.structures.length;
    
    // Positive outcome if we discovered new information
    return this.clamp((newEnemyInfo * 0.1 + newStructureInfo * 0.15), -1, 1);
  }

  protected updateStrategyWeights(action: AgentAction, outcome: number): void {
    const areaKey = action.position ? `${action.position.x}_${action.position.y}` : 'general';
    const currentWeight = this.scoutingPriorities.get(areaKey) || 0.5;
    const newWeight = currentWeight + (outcome * this.learningRate);
    this.scoutingPriorities.set(areaKey, this.clamp(newWeight, 0, 1));
  }

  private initializeScoutingPriorities(): void {
    this.scoutingPriorities.set('enemy_base', 0.9);
    this.scoutingPriorities.set('resource_nodes', 0.7);
    this.scoutingPriorities.set('chokepoints', 0.8);
    this.scoutingPriorities.set('expansion_sites', 0.6);
  }

  private analyzeScoutingState(gameState: GameStateSnapshot): ScoutingAnalysis {
    // Calculate known areas (simplified)
    const knownAreas = gameState.mapControl.controlledArea;

    // Identify unknown areas (simplified - would use actual map data)
    const unknownAreas: ScoutingAnalysis['unknownAreas'] = [];
    if (gameState.mapControl.expansionSites > 0) {
      // Mock unknown areas
      for (let i = 0; i < gameState.mapControl.expansionSites; i++) {
        unknownAreas.push({
          position: { x: i * 100, y: i * 100 },
          priority: 0.7,
          estimatedValue: 0.6
        });
      }
    }

    // Analyze enemy activity
    const enemyActivity: ScoutingAnalysis['enemyActivity'] = gameState.enemyVisibility.units.map(unit => ({
      position: unit.position,
      lastSeen: Date.now(), // Simplified
      activityLevel: 0.7
    }));

    // Intelligence gaps
    const intelligenceGaps: ScoutingAnalysis['intelligenceGaps'] = [];
    if (gameState.enemyVisibility.units.length < 3) {
      intelligenceGaps.push({
        area: 'enemy_military',
        importance: 0.9
      });
    }
    if (gameState.enemyVisibility.structures.length === 0) {
      intelligenceGaps.push({
        area: 'enemy_base',
        importance: 0.8
      });
    }

    return {
      knownAreas,
      unknownAreas,
      enemyActivity,
      intelligenceGaps
    };
  }

  private identifyScoutingTargets(analysis: ScoutingAnalysis, gameState: GameStateSnapshot): Array<{
    position: { x: number; y: number };
    priority: number;
    reason: string;
  }> {
    const targets: Array<{ position: { x: number; y: number }; priority: number; reason: string }> = [];

    // High priority: enemy base location (if unknown)
    if (gameState.enemyVisibility.structures.length === 0) {
      targets.push({
        position: { x: 500, y: 500 }, // Would be calculated from map
        priority: 0.9,
        reason: 'Locate enemy base'
      });
    }

    // Medium priority: unknown resource areas
    analysis.unknownAreas.forEach(area => {
      targets.push({
        position: area.position,
        priority: area.priority,
        reason: 'Scout potential resource sites'
      });
    });

    // High priority: areas with enemy activity
    analysis.enemyActivity.forEach(activity => {
      targets.push({
        position: activity.position,
        priority: 0.8,
        reason: 'Monitor enemy activity'
      });
    });

    // Sort by priority
    return targets.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }

  private generateScoutingActions(
    targets: Array<{ position: { x: number; y: number }; priority: number; reason: string }>,
    gameState: GameStateSnapshot
  ): AgentAction[] {
    const actions: AgentAction[] = [];

    // Only scout if we have scout units or can build them
    if (targets.length > 0) {
      // Check if we need to build scout units
      const hasScouts = gameState.unitComposition.total > 0; // Simplified
      
      if (!hasScouts && gameState.resources.ore >= 100) {
        actions.push({
          type: 'train',
          unitType: 'scout',
          count: 1,
          priority: 0.7,
          reasoning: 'Building scout unit for reconnaissance'
        });
      }

      // Add scouting actions for top targets
      targets.slice(0, 3).forEach(target => {
        actions.push({
          type: 'scout',
          position: target.position,
          priority: target.priority,
          reasoning: target.reason
        });
      });
    }

    return actions;
  }

  private calculateScoutingPriority(gameState: GameStateSnapshot, analysis: ScoutingAnalysis): number {
    let priority = 0.4; // Base scouting priority is lower than other agents
    
    // High priority if we know very little
    if (analysis.knownAreas < 0.3) {
      priority = 0.8;
    }
    
    // High priority if intelligence gaps exist
    if (analysis.intelligenceGaps.length > 0) {
      priority = Math.max(priority, 0.7);
    }
    
    // Lower priority if we're under immediate threat
    if (gameState.threatAssessment.immediate > 0.7) {
      priority *= 0.6;
    }
    
    // Adjust by personality (exploration drive)
    priority *= (0.5 + this.personality.adaptability * 0.5);
    
    return this.clamp(priority, 0, 1);
  }

  private generateScoutingReasoning(
    analysis: ScoutingAnalysis,
    targets: Array<{ position: { x: number; y: number }; priority: number; reason: string }>
  ): string {
    if (targets.length === 0) {
      return 'No immediate scouting needs. Maintaining current intelligence.';
    }

    const topTarget = targets[0];
    const reasons = [
      `Gathering intelligence: ${topTarget.reason}`,
      `Scouting ${topTarget.reason.toLowerCase()} for strategic advantage`,
      `Intelligence gathering mission: ${topTarget.reason}`,
      `Reconnaissance needed: ${topTarget.reason}`
    ];

    return this.rng.choice(reasons);
  }
}

