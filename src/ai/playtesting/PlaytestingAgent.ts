/**
 * Automated Playtesting Agent
 * 
 * Uses MCTS with procedural personas to playtest games without prior specific knowledge.
 * Based on General Video Game AI (GVGAI) framework principles.
 * 
 * This agent can competently playtest a wide variety of game mechanics and levels
 * by using general game-playing algorithms rather than game-specific knowledge.
 */

import MCTS from '../planner/MCTS.js';
import { ProceduralPersona, PersonaType, PersonaFactory } from './ProceduralPersona';
import { SituationEvaluator } from '../situationEvaluator.js';

export interface PlaytestResult {
  gameId: string;
  personaType: PersonaType;
  outcome: 'win' | 'loss' | 'draw' | 'timeout';
  duration: number; // in ticks
  finalScore: number;
  metrics: PlaytestMetrics;
  actions: PlaytestAction[];
  issues: BalanceIssue[];
}

export interface PlaytestMetrics {
  averageResourceEfficiency: number;
  militaryPowerPeak: number;
  expansionCount: number;
  researchCount: number;
  averageArmySize: number;
  workerCount: number;
  winRate: number;
  difficultySpikes: DifficultySpike[];
}

export interface PlaytestAction {
  tick: number;
  action: any;
  score: number;
  reasoning: string;
}

export interface BalanceIssue {
  type: 'imbalance' | 'exploit' | 'difficulty_spike' | 'unwinnable' | 'trivial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: any;
  tick?: number;
}

export interface DifficultySpike {
  tick: number;
  severity: number; // 0-1, where 1 is maximum spike
  description: string;
  metrics: {
    resourceChange: number;
    militaryChange: number;
    threatChange: number;
  };
}

/**
 * Playtesting Agent that uses MCTS with procedural personas
 */
export class PlaytestingAgent {
  private persona: ProceduralPersona;
  private mcts: MCTS;
  private playerId: number;
  private gameState: any;
  private actionHistory: PlaytestAction[] = [];
  private metrics: PlaytestMetrics;
  private lastSituation: any = null;

  constructor(personaType: PersonaType, playerId: number) {
    this.persona = PersonaFactory.create(personaType);
    this.playerId = playerId;
    
    // Initialize MCTS with persona-specific parameters
    this.mcts = new MCTS({
      rollouts: this.persona.getRolloutCount(),
      explorationConstant: this.persona.getExplorationConstant()
    });

    // Initialize metrics
    this.metrics = {
      averageResourceEfficiency: 0,
      militaryPowerPeak: 0,
      expansionCount: 0,
      researchCount: 0,
      averageArmySize: 0,
      workerCount: 0,
      winRate: 0,
      difficultySpikes: []
    };
  }

  /**
   * Update the agent with current game state
   */
  update(gameState: any): void {
    this.gameState = gameState;
    
    // Update situation evaluation
    if (gameState.tick % 10 === 0) {
      this.lastSituation = SituationEvaluator.evaluate(gameState, this.playerId);
    }

    // Update metrics
    this.updateMetrics(gameState);
  }

  /**
   * Get the best action for this persona
   */
  getBestAction(): any | null {
    if (!this.gameState) return null;

    const legalActions = this.getLegalActions(this.gameState, this.playerId);
    if (legalActions.length === 0) return null;

    // Use persona-modified MCTS evaluation
    const scoredActions = legalActions.map(action => {
      const baseScore = this.mcts.evaluateAction(this.gameState, this.playerId, action);
      const personaScore = this.persona.evaluateAction(
        this.gameState,
        this.playerId,
        action,
        this.lastSituation
      );
      
      // Combine MCTS and persona scores
      const finalScore = (baseScore * 0.6) + (personaScore * 0.4);
      
      return {
        action,
        score: finalScore,
        baseScore,
        personaScore
      };
    });

    // Select best action
    const best = scoredActions.reduce((best, curr) => 
      curr.score > best.score ? curr : best
    );

    // Record action
    this.actionHistory.push({
      tick: this.gameState.tick,
      action: best.action,
      score: best.score,
      reasoning: `${this.persona.name}: base=${best.baseScore.toFixed(2)}, persona=${best.personaScore.toFixed(2)}`
    });

    return best.action;
  }

  /**
   * Get legal actions for the player
   */
  private getLegalActions(gameState: any, playerId: number): any[] {
    const actions: any[] = [];
    const player = gameState.players?.get?.(playerId) || gameState.players?.[playerId];
    if (!player) return actions;

    const myUnits = (gameState.units || []).filter((u: any) => u.playerId === playerId);
    const myBuildings = (gameState.buildings || []).filter((b: any) => 
      b.playerId === playerId && (b.isComplete !== false)
    );

    // Resource gathering (always available)
    const workers = myUnits.filter((u: any) => u.type === 'WORKER' || u.type === 'Worker');
    if (workers.length > 0) {
      actions.push({ type: 'gather_resources', priority: 0.5 });
    }

    // Worker production
    const hasBase = myBuildings.some((b: any) => 
      b.type === 'BASE' || b.type === 'Base'
    );
    if (hasBase) {
      const resources = this.getResources(player);
      if (resources.ore >= 50 || resources.minerals >= 50) {
        actions.push({ 
          type: 'build_unit', 
          unitType: 'WORKER',
          cost: 50,
          timeHorizon: 'long',
          efficiency: 0.8
        });
      }
    }

    // Military production
    const hasBarracks = myBuildings.some((b: any) => 
      b.type === 'BARRACKS' || b.type === 'Barracks'
    );
    if (hasBarracks) {
      const resources = this.getResources(player);
      if (resources.ore >= 100 || resources.minerals >= 100) {
        actions.push({ 
          type: 'build_unit', 
          unitType: 'SOLDIER',
          cost: 100,
          timeHorizon: 'short',
          riskLevel: 0.3
        });
      }
    }

    const hasFactory = myBuildings.some((b: any) => 
      b.type === 'FACTORY' || b.type === 'Factory'
    );
    if (hasFactory) {
      const resources = this.getResources(player);
      if ((resources.ore >= 150 || resources.minerals >= 150) && 
          (resources.energy >= 100 || resources.gas >= 100)) {
        actions.push({ 
          type: 'build_unit', 
          unitType: 'TANK',
          cost: 250,
          timeHorizon: 'medium',
          riskLevel: 0.2
        });
      }
    }

    // Building construction
    const resources = this.getResources(player);
    if (!hasBarracks && (resources.ore >= 100 || resources.minerals >= 100)) {
      actions.push({ 
        type: 'build_building', 
        buildingType: 'BARRACKS',
        cost: 100,
        timeHorizon: 'medium',
        efficiency: 0.7
      });
    }

    if (!hasFactory && (resources.ore >= 150 || resources.minerals >= 150) && 
        (resources.energy >= 50 || resources.gas >= 50)) {
      actions.push({ 
        type: 'build_building', 
        buildingType: 'FACTORY',
        cost: 200,
        timeHorizon: 'long',
        efficiency: 0.6
      });
    }

    // Expansion
    if (resources.ore >= 400 || resources.minerals >= 400) {
      actions.push({ 
        type: 'build_building', 
        buildingType: 'BASE',
        cost: 400,
        timeHorizon: 'long',
        riskLevel: 0.5,
        novelty: 0.6
      });
    }

    // Army actions
    const armySize = myUnits.filter((u: any) => 
      u.type !== 'WORKER' && u.type !== 'Worker'
    ).length;
    
    if (armySize > 0) {
      actions.push({ 
        type: 'army_action', 
        action: 'attack',
        armySize,
        riskLevel: 0.7,
        timeHorizon: 'short'
      });
      
      actions.push({ 
        type: 'army_action', 
        action: 'defend',
        armySize,
        riskLevel: 0.2,
        timeHorizon: 'short'
      });
    }

    // Research/tech actions (if available)
    if (gameState.techTreeManager || gameState.techTree) {
      actions.push({ 
        type: 'research',
        timeHorizon: 'long',
        efficiency: 0.5,
        novelty: 0.7
      });
    }

    return actions;
  }

  /**
   * Get resources from player object (handles different formats)
   */
  private getResources(player: any): { ore: number; minerals: number; energy: number; gas: number } {
    if (player.resources) {
      return {
        ore: player.resources.ore || 0,
        minerals: player.resources.minerals || player.resources.ore || 0,
        energy: player.resources.energy || 0,
        gas: player.resources.gas || player.resources.energy || 0
      };
    }
    
    return {
      ore: player.minerals || 0,
      minerals: player.minerals || 0,
      energy: player.gas || 0,
      gas: player.gas || 0
    };
  }

  /**
   * Update metrics during playtest
   */
  private updateMetrics(gameState: any): void {
    const player = gameState.players?.get?.(this.playerId) || gameState.players?.[this.playerId];
    if (!player) return;

    const myUnits = (gameState.units || []).filter((u: any) => u.playerId === this.playerId);
    const workers = myUnits.filter((u: any) => 
      u.type === 'WORKER' || u.type === 'Worker'
    );
    const army = myUnits.filter((u: any) => 
      u.type !== 'WORKER' && u.type !== 'Worker'
    );

    // Update worker count
    this.metrics.workerCount = workers.length;

    // Update average army size
    const totalArmySize = this.metrics.averageArmySize * (this.actionHistory.length - 1) + army.length;
    this.metrics.averageArmySize = totalArmySize / this.actionHistory.length;

    // Update military power peak
    const militaryPower = army.reduce((sum: number, u: any) => 
      sum + (u.attack || 0) + (u.defense || 0), 0
    );
    this.metrics.militaryPowerPeak = Math.max(this.metrics.militaryPowerPeak, militaryPower);

    // Detect difficulty spikes
    this.detectDifficultySpikes(gameState);
  }

  /**
   * Detect difficulty spikes in the game
   */
  private detectDifficultySpikes(gameState: any): void {
    if (!this.lastSituation) return;

    const currentSituation = SituationEvaluator.evaluate(gameState, this.playerId);
    
    // Calculate change in threat level
    const threatChange = currentSituation.threat.level - (this.lastSituation?.threat?.level || 0);
    
    // Calculate resource change rate
    const player = gameState.players?.get?.(this.playerId) || gameState.players?.[this.playerId];
    const resources = this.getResources(player);
    const totalResources = resources.ore + resources.energy;
    const lastTotalResources = this.lastSituation?.resources?.total || totalResources;
    const resourceChange = (totalResources - lastTotalResources) / Math.max(1, gameState.tick - (this.lastSituation?.tick || 0));

    // Calculate military change
    const myUnits = (gameState.units || []).filter((u: any) => u.playerId === this.playerId);
    const armySize = myUnits.filter((u: any) => 
      u.type !== 'WORKER' && u.type !== 'Worker'
    ).length;
    const lastArmySize = this.lastSituation?.military?.size || armySize;
    const militaryChange = armySize - lastArmySize;

    // Detect spike if threat increases significantly
    if (threatChange > 0.3 && gameState.tick > 100) {
      const severity = Math.min(1, threatChange * 2);
      
      this.metrics.difficultySpikes.push({
        tick: gameState.tick,
        severity,
        description: `Threat level increased by ${(threatChange * 100).toFixed(0)}%`,
        metrics: {
          resourceChange,
          militaryChange,
          threatChange
        }
      });
    }
  }

  /**
   * Get playtest result
   */
  getPlaytestResult(outcome: 'win' | 'loss' | 'draw' | 'timeout', finalScore: number): PlaytestResult {
    return {
      gameId: this.gameState?.id || 'unknown',
      personaType: this.persona.type,
      outcome,
      duration: this.gameState?.tick || 0,
      finalScore,
      metrics: { ...this.metrics },
      actions: [...this.actionHistory],
      issues: [] // Will be populated by balance detection system
    };
  }

  /**
   * Get persona information
   */
  getPersona(): ProceduralPersona {
    return this.persona;
  }
}

