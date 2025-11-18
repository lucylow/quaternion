/**
 * Enhanced GameState for Quaternion strategy game
 * Implements the 4-resource system (Matter, Energy, Life, Knowledge)
 * Now with integrated ResourceManager, UnitManager, TechTreeManager, and MapManager
 */

import { ResourceManager, ResourceType } from './ResourceManager';
import { UnitManager, UnitType } from './UnitManager';
import { TechTreeManager } from './TechTreeManager';
import { MapManager, Faction, NodeType } from './MapManager';
import { EndgameManager, EndgameScenario } from './EndgameManager';
import { VictoryDefeatSystem, VictoryType, DefeatType } from './VictoryDefeatSystem';
import { StrategicDecisionEngine } from './strategic/StrategicDecisionEngine';
import { PersonalityType } from './strategic/AIPersonality';
import { getPuzzle, type PuzzleConstraint } from '@/data/puzzles';
import { ArenaSeedManager, ArenaConfig } from './ArenaSeedManager';
import { AdvisorTensionSystem, StrategicDecision } from './AdvisorTensionSystem';
import { MoralVerdictSystem } from './MoralVerdictSystem';
import { KaijuEventSystem } from './KaijuEventSystem';
import { UnitQuirkSystem } from './UnitQuirkSystem';
import { CinematicCameraSystem } from './CinematicCameraSystem';

export interface Resources {
  ore: number;
  energy: number;
  biomass: number;
  data: number;
}

export interface Player {
  id: number;
  name: string;
  isAI: boolean;
  resources: Resources;
  population: { current: number; max: number };
  researchedTechs: Set<string>;
  moralAlignment: number; // -100 (Conqueror) to +100 (Conservator)
}

export interface GameConfig {
  seed: number;
  mapWidth: number;
  mapHeight: number;
  mapType: string;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  commanderId: string;
  mode?: 'single' | 'multiplayer';
  roomId?: string;
  puzzleId?: string;
}

export interface WinCondition {
  type: 'equilibrium' | 'technological' | 'territorial' | 'moral';
  achieved: boolean;
  progress: number;
}

export class QuaternionGameState {
  public id: string;
  public tick: number;
  public tickRate: number = 60;
  public isRunning: boolean = false;
  public gameTime: number = 0; // in seconds
  
  public config: GameConfig;
  public players: Map<number, Player>;
  public seed: number;
  
  // Game entities
  public units: any[] = [];
  public buildings: any[] = [];
  public resourceNodes: any[] = [];
  
  // Resource stability tracking
  public instability: number = 0;
  public maxInstability: number = 200;
  
  // Perfect balance tracking (for ultimate balance ending)
  private perfectBalanceProgress: number = 0;
  private perfectBalanceRequiredTime: number = 10 * 60; // 10 seconds at 60 FPS
  
  // Win conditions
  public winConditions: Map<string, WinCondition>;
  public winner: number | null = null;
  public gameOver: boolean = false;
  public endgameScenario: EndgameScenario | null = null;
  
  // Events and actions log
  public actionLog: any[] = [];
  public events: any[] = [];
  
  // AI state
  public aiState: any = null;
  
  // Enhanced managers
  public resourceManager: ResourceManager;
  public unitManager: UnitManager;
  public techTreeManager: TechTreeManager;
  public mapManager: MapManager;
  public victoryDefeatSystem: VictoryDefeatSystem;
  public strategicDecisionEngine: StrategicDecisionEngine;
  
  // Fun experience systems
  public arenaSeedManager: ArenaSeedManager;
  public advisorTensionSystem: AdvisorTensionSystem;
  public moralVerdictSystem: MoralVerdictSystem;
  public kaijuEventSystem: KaijuEventSystem;
  public unitQuirkSystem: UnitQuirkSystem;
  public cinematicCameraSystem: CinematicCameraSystem;
  
  // Puzzle system
  public puzzleConfig: any | null = null;
  public puzzleConstraints: PuzzleConstraint[] = [];
  public puzzleStartTime: number = 0;
  
  constructor(config: GameConfig) {
    this.id = this.generateId();
    this.tick = 0;
    this.config = config;
    this.seed = config.seed;
    
    // Initialize enhanced managers
    this.resourceManager = new ResourceManager();
    this.unitManager = new UnitManager(this.resourceManager);
    this.techTreeManager = new TechTreeManager(this.resourceManager, this.unitManager);
    this.mapManager = new MapManager(config.mapWidth || 9, config.mapHeight || 9);
    this.victoryDefeatSystem = new VictoryDefeatSystem();
    
    // Initialize strategic decision engine
    const commanderPersonality = this.getPersonalityFromCommander(config.commanderId || 'AUREN');
    this.strategicDecisionEngine = new StrategicDecisionEngine(
      {
        ore: 250,
        energy: 40,
        biomass: 0,
        data: 10
      },
      commanderPersonality
    );
    
    // Initialize fun experience systems
    this.arenaSeedManager = new ArenaSeedManager();
    this.advisorTensionSystem = new AdvisorTensionSystem();
    this.moralVerdictSystem = new MoralVerdictSystem();
    this.kaijuEventSystem = new KaijuEventSystem();
    this.unitQuirkSystem = new UnitQuirkSystem();
    this.cinematicCameraSystem = new CinematicCameraSystem();
    
    // Initialize puzzle config if puzzleId is provided
    if (config.puzzleId) {
      const puzzle = getPuzzle(config.puzzleId);
      if (puzzle) {
        this.puzzleConfig = puzzle;
        this.puzzleConstraints = puzzle.constraints || [];
      }
    }
    
    // Generate map
    this.mapManager.generateMap(config.seed);
    
    // Initialize players
    this.players = new Map();
    this.initializePlayers();
    
    // Initialize win conditions
    this.winConditions = new Map([
      ['equilibrium', { type: 'equilibrium', achieved: false, progress: 0 }],
      ['technological', { type: 'technological', achieved: false, progress: 0 }],
      ['territorial', { type: 'territorial', achieved: false, progress: 0 }],
      ['moral', { type: 'moral', achieved: false, progress: 0 }]
    ]);
    
    // Set up resource change callbacks
    this.setupResourceCallbacks();
  }
  
  /**
   * Get personality type from commander ID
   */
  private getPersonalityFromCommander(commanderId: string): PersonalityType {
    // Map commanders to personalities
    const commanderPersonalityMap: Record<string, PersonalityType> = {
      'AUREN': PersonalityType.BALANCER,
      'VIREL': PersonalityType.TECHNOCRAT,
      'LIRA': PersonalityType.ECOSYMBIOTE,
      'KORVUS': PersonalityType.INDUSTRIALIST
    };
    
    return commanderPersonalityMap[commanderId] || PersonalityType.BALANCER;
  }
  
  private setupResourceCallbacks(): void {
    this.resourceManager.onResourceChange((type, amount) => {
      // Sync with player resources
      const player = this.players.get(1);
      if (player) {
        switch (type) {
          case ResourceType.ORE:
            player.resources.ore = amount;
            break;
          case ResourceType.ENERGY:
            player.resources.energy = amount;
            break;
          case ResourceType.BIOMASS:
            player.resources.biomass = amount;
            break;
          case ResourceType.DATA:
            player.resources.data = amount;
            break;
        }
      }
    });
    
    this.resourceManager.onResourceCriticalLevel((type) => {
      this.logAction('resource_critical', { resource: type, tick: this.tick });
    });
  }
  
  private generateId(): string {
    return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  private initializePlayers(): void {
    // Use puzzle starting resources if in puzzle mode, otherwise use default
    let startingResources: Resources;
    
    if (this.puzzleConfig) {
      startingResources = {
        ore: this.puzzleConfig.startingResources.ore,
        energy: this.puzzleConfig.startingResources.energy,
        biomass: this.puzzleConfig.startingResources.biomass,
        data: this.puzzleConfig.startingResources.data
      };
    } else {
      // Demo Scenario starting resources from spec:
      // Starting resources: Ore 250, Energy 40, Biomass 0, Data 10
      const isQuickStart = this.config.mapWidth <= 30 && this.config.mapHeight <= 20;
      startingResources = isQuickStart 
        ? { ore: 250, energy: 40, biomass: 0, data: 10 } // Demo scenario from spec
        : { ore: 250, energy: 40, biomass: 0, data: 10 }; // Same for consistency
    }
    
    // Set initial resources in ResourceManager
    this.resourceManager.setInitialResources(
      startingResources.ore,
      startingResources.energy,
      startingResources.biomass,
      startingResources.data
    );
    
    // Set initial biomass for morality tracking
    this.victoryDefeatSystem.setInitialBiomass(startingResources.biomass);
    
    // Player 1 (Human)
    this.players.set(1, {
      id: 1,
      name: 'Player',
      isAI: false,
      resources: startingResources,
      population: { current: 8, max: 50 },
      researchedTechs: new Set(),
      moralAlignment: 0
    });
    
    // Player 2 (AI) - Only in non-puzzle modes
    if (this.config.mode !== 'puzzle') {
      this.players.set(2, {
        id: 2,
        name: 'AI Opponent',
        isAI: true,
        resources: startingResources,
        population: { current: 8, max: 50 },
        researchedTechs: new Set(),
        moralAlignment: 0
      });
    }
  }
  
  /**
   * Start the game loop
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.puzzleStartTime = Date.now();
    this.logAction('game_start', { seed: this.seed, config: this.config, puzzleId: this.config.puzzleId });
  }
  
  /**
   * Stop the game loop
   */
  public stop(): void {
    this.isRunning = false;
    this.logAction('game_stop', { tick: this.tick, gameTime: this.gameTime });
  }
  
  /**
   * Main game update (fixed timestep)
   * This should be called with a fixed deltaTime for deterministic behavior
   */
  public update(deltaTime: number): void {
    if (!this.isRunning || this.gameOver) return;
    
    // Validate deltaTime
    if (!deltaTime || deltaTime <= 0 || !isFinite(deltaTime)) {
      console.warn('QuaternionGameState: Invalid deltaTime in update:', deltaTime);
      return;
    }
    
    try {
      this.tick++;
      this.gameTime += deltaTime;
      
      // Process enhanced managers
      this.processManagers();
      
      // Update resources (passive generation and consumption)
      this.updateResources(deltaTime);
      
      // Calculate instability
      this.updateInstability();
      
      // Update fun experience systems
      this.updateFunSystems(deltaTime);
      
      // Update win conditions
      this.checkWinConditions();
      
      // Check lose conditions
      this.checkLoseConditions();
    } catch (error) {
      console.error('QuaternionGameState: Error in update loop:', error);
      // Don't crash the game, but log the error
      // In production, you might want to pause the game or show an error message
    }
  }
  
  /**
   * Process all enhanced managers
   */
  private processManagers(): void {
    // Safety checks for managers
    if (!this.mapManager || !this.resourceManager || !this.unitManager || !this.techTreeManager) {
      console.warn('QuaternionGameState: Managers not initialized, skipping processManagers');
      return;
    }

    // Get resource generation from map nodes
    const resourceGeneration = this.mapManager.getResourceGeneration();
    const controlledNodes = new Map<ResourceType, number>();
    
    // Convert map generation to ResourceType enum
    if (resourceGeneration) {
      resourceGeneration.forEach((amount, nodeType) => {
        switch (nodeType) {
          case 'ore':
            controlledNodes.set(ResourceType.ORE, 
              (controlledNodes.get(ResourceType.ORE) || 0) + 1);
            break;
          case 'energy':
            controlledNodes.set(ResourceType.ENERGY,
              (controlledNodes.get(ResourceType.ENERGY) || 0) + 1);
            break;
          case 'biomass':
            controlledNodes.set(ResourceType.BIOMASS,
              (controlledNodes.get(ResourceType.BIOMASS) || 0) + 1);
            break;
          case 'data':
            controlledNodes.set(ResourceType.DATA,
              (controlledNodes.get(ResourceType.DATA) || 0) + 1);
            break;
        }
      });
    }
    
    // Process resource tick
    this.resourceManager.processResourceTick(controlledNodes, new Map());
    
    // Process unit production
    const completedUnits = this.unitManager.processProductionTicks();
    if (completedUnits && Array.isArray(completedUnits)) {
      completedUnits.forEach(unit => {
        if (unit) {
          this.units.push(unit);
        }
      });
    }
    
    // Process unit ticks
    this.unitManager.processUnitTicks();
    
    // Process research
    this.techTreeManager.processResearchTick();
    
    // Update strategic decision engine with current resources
    const player = this.players.get(1);
    if (player && this.strategicDecisionEngine) {
      this.strategicDecisionEngine.updateStateFromGameResources({
        ore: player.resources.ore,
        energy: player.resources.energy,
        biomass: player.resources.biomass,
        data: player.resources.data
      });
      
      // Process decision cycle periodically (every 2 seconds = 120 ticks)
      if (this.tick % 120 === 0) {
        const gameContext = {
          isUnderAttack: this.checkIfUnderAttack(),
          hasEnemyWeakness: this.checkEnemyWeakness(),
          aiTradeOffer: this.checkAITradeOffer()
        };
        
        const recommendedDecisions = this.strategicDecisionEngine.processDecisionCycle(gameContext);
        // Store recommended decisions for AI suggestions
        this.aiState = {
          recommendedDecisions: recommendedDecisions.map(d => ({
            id: d.decisionID,
            type: d.type,
            description: d.description,
            utilityScore: d.utilityScore
          }))
        };
      }
    }
    
    // Sync researched techs
    if (player) {
      this.techTreeManager.getAllTechNodes().forEach(node => {
        if (node.isResearched && !player.researchedTechs.has(node.nodeId)) {
          player.researchedTechs.add(node.nodeId);
        }
      });
    }
  }
  
  /**
   * Update fun experience systems
   */
  private updateFunSystems(deltaTime: number): void {
    if (!deltaTime || deltaTime <= 0 || !isFinite(deltaTime)) {
      return; // Invalid deltaTime
    }

    try {
      // Update Kaiju events
      if (this.kaijuEventSystem) {
        const kaijuUpdate = this.kaijuEventSystem.update(deltaTime, this);
        if (kaijuUpdate?.spawned) {
          this.logAction('kaiju_spawn', { 
            kaiju: kaijuUpdate.kaiju?.name,
            position: kaijuUpdate.position 
          });
          if (this.events && Array.isArray(this.events)) {
            this.events.push({
              type: 'kaiju_spawn',
              kaiju: kaijuUpdate.kaiju,
              position: kaijuUpdate.position,
              time: this.gameTime
            });
          }
        }
        if (kaijuUpdate?.defeated) {
          this.logAction('kaiju_defeated', { kaiju: kaijuUpdate.kaiju?.name });
          if (this.events && Array.isArray(this.events)) {
            this.events.push({
              type: 'kaiju_defeated',
              kaiju: kaijuUpdate.kaiju,
              time: this.gameTime
            });
          }
        }
      }

      // Update Arena Seed (if active)
      if (this.arenaSeedManager) {
        try {
          const arenaStatus = this.arenaSeedManager.getStatus();
          if (arenaStatus && arenaStatus.isActive) {
            const arenaUpdate = this.arenaSeedManager.update(deltaTime, this);
            if (arenaUpdate?.completed) {
              this.logAction('arena_complete', { 
                victory: arenaUpdate.completed,
                progress: arenaUpdate.progress,
                max: arenaUpdate.max
              });
            }
          }
        } catch (error) {
          console.warn('QuaternionGameState: Error updating arena seed manager', error);
        }
      }
    } catch (error) {
      console.warn('QuaternionGameState: Error in updateFunSystems', error);
    }
  }

  /**
   * Variable update (for non-critical systems that don't need determinism)
   * This can be called with variable deltaTime for smooth animations
   */
  public variableUpdate(deltaTime: number): void {
    if (!this.isRunning || this.gameOver) return;
    
    // Non-critical updates that don't affect game logic
    // For example: particle effects, UI animations, etc.
  }
  
  /**
   * Update resource generation and consumption
   * Note: Resource generation is handled by ResourceManager.processResourceTick()
   * which is called every 30 seconds (1800 ticks at 60 ticks/sec)
   */
  private updateResources(deltaTime: number): void {
    if (!deltaTime || deltaTime <= 0 || !isFinite(deltaTime)) {
      return; // Invalid deltaTime
    }

    this.players.forEach((player, playerId) => {
      if (!player || !player.resources) return;

      // Energy depletes constantly (reduced consumption for faster gameplay)
      player.resources.energy = Math.max(0, player.resources.energy - 0.3 * deltaTime);
      
      // Resource generation from buildings
      if (this.buildings && Array.isArray(this.buildings)) {
        this.buildings
          .filter(b => b && b.playerId === playerId && b.isComplete)
          .forEach(building => {
            if (building.produces && typeof building.produces === 'object') {
              Object.keys(building.produces).forEach(resource => {
                const produceAmount = building.produces[resource];
                if (typeof produceAmount === 'number' && isFinite(produceAmount)) {
                  const resourceKey = resource as keyof Resources;
                  if (player.resources[resourceKey] !== undefined) {
                    player.resources[resourceKey] += produceAmount * deltaTime;
                  }
                }
              });
            }
          });
      }
      
      // Clamp resources
      player.resources.ore = Math.max(0, Math.min(1000, player.resources.ore || 0));
      player.resources.energy = Math.max(0, Math.min(1000, player.resources.energy || 0));
      player.resources.biomass = Math.max(0, Math.min(1000, player.resources.biomass || 0));
      player.resources.data = Math.max(0, Math.min(1000, player.resources.data || 0));
    });
  }
  
  /**
   * Calculate system instability based on resource imbalance
   */
  private updateInstability(): void {
    const player = this.players.get(1);
    if (!player || !player.resources) return;
    
    const { ore, energy, biomass, data } = player.resources;
    const total = (ore || 0) + (energy || 0) + (biomass || 0) + (data || 0);
    
    // Check for critical resources at zero
    if ((ore || 0) === 0 || (energy || 0) === 0 || (biomass || 0) === 0 || (data || 0) === 0) {
      this.instability = this.maxInstability;
      return;
    }
    
    // Avoid division by zero
    if (total === 0) {
      this.instability = this.maxInstability;
      return;
    }
    
    const avg = total / 4;
    
    // Calculate variance from average
    const variance = [(ore || 0), (energy || 0), (biomass || 0), (data || 0)]
      .reduce((sum, val) => sum + Math.abs(val - avg), 0) / 4;
    
    // Instability increases with imbalance (avoid division by zero)
    if (avg > 0) {
      this.instability = Math.min(this.maxInstability, (variance / avg) * 100);
    } else {
      this.instability = this.maxInstability;
    }
  }
  
  /**
   * Check all win conditions using VictoryDefeatSystem
   * In puzzle mode, uses puzzle-specific win conditions
   */
  private checkWinConditions(): void {
    const player = this.players.get(1);
    if (!player) return;
    
    // Safety check for mapManager
    if (!this.mapManager) {
      console.warn('QuaternionGameState: mapManager not initialized in checkWinConditions');
      return;
    }
    
    // Check puzzle constraints first (failures)
    if (this.puzzleConfig && this.checkPuzzleConstraints(player) === false) {
      // Constraint violated - puzzle failed
      return;
    }
    
    // Check puzzle win condition if in puzzle mode
    if (this.puzzleConfig) {
      const puzzleWin = this.checkPuzzleWinCondition(player);
      if (puzzleWin && puzzleWin.won) {
        this.endGame(1, `Puzzle Complete: ${this.puzzleConfig.winCondition?.description || 'Puzzle completed'}`, undefined);
        return;
      }
    }
    
    const centralNodeControlled = this.mapManager.isCentralNodeControlledByPlayer();
    const centralNodeUnderAttack = this.checkCentralNodeUnderAttack();
    
    const enemyNodes = this.mapManager.getNodesByFaction(Faction.ENEMY);
    const allNodes = this.mapManager.getAllNodes();
    const enemyNodeCount = enemyNodes ? enemyNodes.length : 0;
    const totalNodeCount = allNodes ? allNodes.length : 0;
    const enemyNodeControl = totalNodeCount > 0 ? enemyNodeCount / totalNodeCount : 0;
    
    // Check victory conditions (for non-puzzle modes)
    if (!this.puzzleConfig) {
      const victoryType = this.victoryDefeatSystem.checkVictoryConditions(
        player.resources,
        player.researchedTechs,
        centralNodeControlled,
        centralNodeUnderAttack,
        this.gameTime
      );
      
      if (victoryType !== VictoryType.NONE) {
        const analysis = this.victoryDefeatSystem.generatePostGameAnalysis(
          victoryType,
          DefeatType.NONE,
          this.seed,
          player.resources,
          player.researchedTechs,
          1 - enemyNodeControl
        );
        
        this.endGame(1, this.getVictoryReason(victoryType), undefined, analysis);
        return;
      }
    }
    
    // Update win condition progress for UI
    this.updateWinConditionProgress();
  }
  
  /**
   * Check puzzle constraints (failures)
   */
  private checkPuzzleConstraints(player: Player): boolean {
    if (!this.puzzleConfig) return true;
    
    for (const constraint of this.puzzleConstraints) {
      switch (constraint.type) {
        case 'resource_min':
          if (constraint.resource) {
            const resourceValue = player.resources[constraint.resource as keyof Resources] || 0;
            if (resourceValue < constraint.value) {
              // Resource too low - fail puzzle
              this.endGame(2, `Puzzle Failed: ${constraint.resource} dropped below ${constraint.value}`, undefined);
              return false;
            }
          }
          break;
        case 'resource_max':
          if (constraint.resource) {
            const resourceValueMax = player.resources[constraint.resource as keyof Resources] || 0;
            if (resourceValueMax > constraint.value) {
              // Resource too high - fail puzzle
              this.endGame(2, `Puzzle Failed: ${constraint.resource} exceeded ${constraint.value}`, undefined);
              return false;
            }
          }
          break;
        case 'time_limit':
          if (this.gameTime > constraint.value) {
            // Time exceeded - fail puzzle
            this.endGame(2, `Puzzle Failed: Time limit exceeded (${constraint.value}s)`, undefined);
            return false;
          }
          break;
      }
    }
    return true;
  }
  
  /**
   * Check puzzle win condition
   */
  private checkPuzzleWinCondition(player: Player): { won: boolean; progress: number; max: number } {
    if (!this.puzzleConfig) return { won: false, progress: 0, max: 0 };
    
    const winCond = this.puzzleConfig.winCondition;
    
    switch (winCond.type) {
      case 'equilibrium':
        // Check if resources are balanced
        const { ore, energy, biomass, data } = player.resources;
        const avg = (ore + energy + biomass + data) / 4;
        const maxDeviation = Math.max(
          Math.abs(ore - avg),
          Math.abs(energy - avg),
          Math.abs(biomass - avg),
          Math.abs(data - avg)
        );
        const threshold = avg * 0.15; // 15% deviation for equilibrium
        
        if (maxDeviation <= threshold && avg > 50) {
          // Check duration requirement
          const durationRequired = (winCond.duration || 15) * 60; // Convert to ticks
          const winCondKey = `puzzle_equilibrium_${this.puzzleConfig.id}`;
          const winCondition = this.winConditions.get(winCondKey);
          
          if (!winCondition) {
            this.winConditions.set(winCondKey, { type: 'equilibrium', achieved: false, progress: 0 });
          }
          
          const currentProgress = (this.winConditions.get(winCondKey)?.progress || 0) + 1;
          this.winConditions.set(winCondKey, { type: 'equilibrium', achieved: currentProgress >= durationRequired, progress: currentProgress });
          
          if (currentProgress >= durationRequired) {
            return { won: true, progress: durationRequired, max: durationRequired };
          }
          
          return { won: false, progress: currentProgress, max: durationRequired };
        } else {
          // Reset progress if not balanced
          const winCondKey = `puzzle_equilibrium_${this.puzzleConfig.id}`;
          this.winConditions.set(winCondKey, { type: 'equilibrium', achieved: false, progress: 0 });
          return { won: false, progress: 0, max: (winCond.duration || 15) * 60 };
        }
        
      case 'technological':
        if (player.researchedTechs.has(winCond.techId || 'quantum_ascendancy')) {
          return { won: true, progress: 1, max: 1 };
        }
        return { won: false, progress: 0, max: 1 };
        
      case 'resource_target':
        const targetResource = player.resources[(winCond.target as any) || 'ore'] || 0;
        const targetValue = winCond.target || 0;
        if (targetResource >= targetValue) {
          return { won: true, progress: targetValue, max: targetValue };
        }
        return { won: false, progress: targetResource, max: targetValue };
        
      case 'survival':
        const survivalTime = (winCond.duration || 420) * 60; // Convert to ticks
        if (this.gameTime >= survivalTime) {
          return { won: true, progress: survivalTime, max: survivalTime };
        }
        return { won: false, progress: this.gameTime * 60, max: survivalTime };
        
      case 'territorial':
        const centralNodeControlled = this.mapManager.isCentralNodeControlledByPlayer();
        if (centralNodeControlled) {
          const durationRequired = (winCond.duration || 30) * 60;
          const winCondKey = `puzzle_territorial_${this.puzzleConfig.id}`;
          const winCondition = this.winConditions.get(winCondKey);
          const currentProgress = (winCondition?.progress || 0) + 1;
          this.winConditions.set(winCondKey, { type: 'territorial', achieved: currentProgress >= durationRequired, progress: currentProgress });
          
          if (currentProgress >= durationRequired) {
            return { won: true, progress: durationRequired, max: durationRequired };
          }
          return { won: false, progress: currentProgress, max: durationRequired };
        } else {
          const winCondKey = `puzzle_territorial_${this.puzzleConfig.id}`;
          this.winConditions.set(winCondKey, { type: 'territorial', achieved: false, progress: 0 });
          return { won: false, progress: 0, max: (winCond.duration || 30) * 60 };
        }
        
      default:
        return { won: false, progress: 0, max: 0 };
    }
  }
  
  /**
   * Check if central node is under attack
   */
  private checkCentralNodeUnderAttack(): boolean {
    if (!this.mapManager) return false;
    
    // Simplified: check if enemy units are near central node
    // In full implementation, this would check actual unit positions
    const enemyNodes = this.mapManager.getNodesByFaction(Faction.ENEMY);
    return enemyNodes && enemyNodes.length > 0; // Simplified check
  }
  
  /**
   * Check if player is under attack
   */
  private checkIfUnderAttack(): boolean {
    if (!this.units || !Array.isArray(this.units)) {
      return false;
    }

    // Check if any enemy units are attacking player units or buildings
    const playerUnits = this.units.filter(u => {
      if (!u) return false;
      const player = this.players.get(1);
      return player && u.playerId === 1;
    });
    
    // Simplified: check if there are enemy units near player units
    const enemyUnits = this.units.filter(u => {
      if (!u) return false;
      const player = this.players.get(2);
      return player && u.playerId === 2;
    });
    
    // Check if any enemy units are in combat state
    return enemyUnits.some(unit => unit && (unit.state === 'attacking' || unit.inCombat));
  }
  
  /**
   * Check if enemy has weakness
   */
  private checkEnemyWeakness(): boolean {
    const enemyPlayer = this.players.get(2);
    if (!enemyPlayer || !enemyPlayer.resources) return false;
    
    // Check if enemy has low resources
    const totalResources = (enemyPlayer.resources.ore || 0) + (enemyPlayer.resources.energy || 0) + 
                          (enemyPlayer.resources.biomass || 0) + (enemyPlayer.resources.data || 0);
    if (totalResources < 100) return true;
    
    // Check if enemy has few units
    if (this.units && Array.isArray(this.units)) {
      const enemyUnits = this.units.filter(u => u && u.playerId === 2);
      if (enemyUnits.length < 3) return true;
    }
    
    return false;
  }
  
  /**
   * Check if AI has trade offer
   */
  private checkAITradeOffer(): any | null {
    // Simplified: return null for now
    // In full implementation, this would check if AI wants to trade resources
    return null;
  }
  
  /**
   * Update win condition progress for UI display
   */
  private updateWinConditionProgress(): void {
    const victoryProgress = this.victoryDefeatSystem.getVictoryProgress();
    
    victoryProgress.forEach((condition, type) => {
      const winCondition = this.winConditions.get(this.getWinConditionKey(type));
      if (winCondition) {
        winCondition.progress = condition.progress;
      }
    });
  }
  
  private getWinConditionKey(victoryType: VictoryType): string {
    switch (victoryType) {
      case VictoryType.EQUILIBRIUM: return 'equilibrium';
      case VictoryType.TECHNOLOGICAL: return 'technological';
      case VictoryType.TERRITORIAL: return 'territorial';
      case VictoryType.MORAL: return 'moral';
      default: return 'equilibrium';
    }
  }
  
  private getVictoryReason(victoryType: VictoryType): string {
    switch (victoryType) {
      case VictoryType.EQUILIBRIUM: return 'equilibrium_victory';
      case VictoryType.TECHNOLOGICAL: return 'technological_victory';
      case VictoryType.TERRITORIAL: return 'territorial_victory';
      case VictoryType.MORAL: return 'moral_victory';
      default: return 'victory';
    }
  }
  
  /**
   * Detect win scenarios (excludes collapse)
   */
  private detectWinScenario(
    resources: Resources,
    researchedTechs: Set<string>,
    gameTime: number
  ): EndgameScenario | null {
    const { ore, energy, biomass, data } = resources;
    const avg = (ore + energy + biomass + data) / 4;
    const maxDeviation = Math.max(
      Math.abs(ore - avg),
      Math.abs(energy - avg),
      Math.abs(biomass - avg),
      Math.abs(data - avg)
    );
    
    // Check for perfect balance (Ultimate Balance - Fifth Ending)
    const perfectBalanceThreshold = avg * 0.02; // 2% deviation
    if (maxDeviation <= perfectBalanceThreshold && avg > 200) {
      return 'ultimate_balance';
    }
    
    // Check for equilibrium/harmony (within ±15%)
    const harmonyThreshold = avg * 0.15; // 15% deviation
    if (maxDeviation <= harmonyThreshold && avg > 150) {
      return 'harmony';
    }
    
    // Check for Ascendancy (Data/Technology victory)
    if (researchedTechs.has('quantum_ascendancy') || 
        data > avg * 1.5 && data > 500) {
      return 'ascendancy';
    }
    
    // Check for Reclamation (Biomass focus)
    if (biomass > avg * 1.5 && biomass > 500 && 
        biomass > ore * 1.3 && biomass > energy * 1.3 && biomass > data * 1.3) {
      return 'reclamation';
    }
    
    // Check for Overclock (Energy maximized)
    if (energy > avg * 1.5 && energy > 500 &&
        energy > ore * 1.3 && energy > biomass * 1.3 && energy > data * 1.3) {
      return 'overclock';
    }
    
    return null;
  }
  
  /**
   * Check lose conditions using VictoryDefeatSystem
   */
  private checkLoseConditions(): void {
    const player = this.players.get(1);
    if (!player) return;
    
    // Safety check for mapManager and victoryDefeatSystem
    if (!this.mapManager || !this.victoryDefeatSystem) {
      console.warn('QuaternionGameState: mapManager or victoryDefeatSystem not initialized in checkLoseConditions');
      return;
    }
    
    const deltaTime = 1 / this.tickRate; // Time per tick
    
    const centralNodeControlled = this.mapManager.isCentralNodeControlledByPlayer();
    
    const enemyNodes = this.mapManager.getNodesByFaction(Faction.ENEMY);
    const allNodes = this.mapManager.getAllNodes();
    const enemyNodeCount = enemyNodes ? enemyNodes.length : 0;
    const totalNodeCount = allNodes ? allNodes.length : 0;
    const enemyNodeControl = totalNodeCount > 0 ? enemyNodeCount / totalNodeCount : 0;
    
    // Baseline resources (starting values)
    const baselineResources = {
      ore: 250,
      energy: 40,
      biomass: 0,
      data: 10
    };
    
    // Check defeat conditions
    const defeatType = this.victoryDefeatSystem.checkDefeatConditions(
      player.resources,
      this.instability,
      this.maxInstability,
      centralNodeControlled,
      enemyNodeControl,
      baselineResources,
      deltaTime
    );
    
    if (defeatType !== DefeatType.NONE) {
      const analysis = this.victoryDefeatSystem.generatePostGameAnalysis(
        VictoryType.NONE,
        defeatType,
        this.seed,
        player.resources,
        player.researchedTechs,
        1 - enemyNodeControl
      );
      
      this.endGame(2, this.getDefeatReason(defeatType), undefined, analysis);
      return;
    }
  }
  
  private getDefeatReason(defeatType: DefeatType): string {
    switch (defeatType) {
      case DefeatType.RESOURCE_COLLAPSE: return 'resource_collapse';
      case DefeatType.INSTABILITY_OVERFLOW: return 'instability_overflow';
      case DefeatType.CORE_NODE_LOST: return 'core_node_lost';
      case DefeatType.MORALITY_COLLAPSE: return 'morality_collapse';
      case DefeatType.AI_OVERRUN: return 'ai_overrun';
      default: return 'defeat';
    }
  }
  
  /**
   * End the game
   */
  private endGame(winnerId: number, reason: string, scenario?: EndgameScenario, analysis?: any): void {
    this.gameOver = true;
    this.winner = winnerId;
    this.isRunning = false;
    this.endgameScenario = scenario || null;
    
    const endData: any = { winner: winnerId, reason, scenario, tick: this.tick };
    if (analysis) {
      endData.analysis = analysis;
      endData.replayCode = analysis.replayCode;
    }
    
    this.logAction('game_end', endData);
  }
  
  /**
   * Get post-game analysis
   */
  public getPostGameAnalysis(): any {
    const player = this.players.get(1);
    if (!player) return null;
    
    const victoryType = this.winner === 1 ? 
      (this.endgameScenario === 'harmony' ? VictoryType.EQUILIBRIUM :
       this.endgameScenario === 'ascendancy' ? VictoryType.TECHNOLOGICAL :
       this.endgameScenario === 'reclamation' ? VictoryType.MORAL :
       VictoryType.NONE) : VictoryType.NONE;
    
    const defeatType = this.winner === 2 ?
      (this.endgameScenario === 'collapse' ? DefeatType.RESOURCE_COLLAPSE :
       DefeatType.NONE) : DefeatType.NONE;
    
    const enemyNodeCount = this.mapManager.getNodesByFaction(Faction.ENEMY).length;
    const totalNodeCount = this.mapManager.getAllNodes().length;
    const nodeControl = totalNodeCount > 0 ? 1 - (enemyNodeCount / totalNodeCount) : 0;
    
    return this.victoryDefeatSystem.generatePostGameAnalysis(
      victoryType,
      defeatType,
      this.seed,
      player.resources,
      player.researchedTechs,
      nodeControl
    );
  }
  
  /**
   * Log an action for replay
   */
  public logAction(type: string, data: any): void {
    this.actionLog.push({
      tick: this.tick,
      time: this.gameTime,
      type,
      data
    });
  }
  
  /**
   * Build a unit
   */
  public buildUnit(unitType: string, playerId: number): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;
    
    // Check costs and build
    this.logAction('build_unit', { unitType, playerId, tick: this.tick });
    return true;
  }
  
  /**
   * Research technology
   */
  public researchTech(techId: string, playerId: number): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;
    
    // Use TechTreeManager to start research
    const success = this.techTreeManager.startResearch(techId);
    if (success) {
      this.logAction('research_tech', { techId, playerId, tick: this.tick });
    }
    return success;
  }
  
  /**
   * Queue unit production
   */
  public queueUnitProduction(
    unitType: UnitType,
    spawnPosition: { x: number; y: number },
    playerId: number
  ): boolean {
    const success = this.unitManager.queueUnitProduction(unitType, spawnPosition, playerId);
    if (success) {
      this.logAction('queue_unit', { unitType, playerId, tick: this.tick });
    }
    return success;
  }
  
  /**
   * Start node capture
   */
  public startNodeCapture(nodeId: string, faction: Faction = Faction.PLAYER): boolean {
    return this.mapManager.startNodeCapture(nodeId, faction);
  }
  
  /**
   * Process node capture
   */
  public processNodeCapture(nodeId: string, faction: Faction = Faction.PLAYER): boolean {
    return this.mapManager.processNodeCapture(nodeId, faction);
  }
  
  /**
   * PATCHED BY CURSOR - 2024-12-19 - safe bootstrap & debug
   * Ensure demo state is created if world is empty.
   * Creates a base, 2 workers, 1 soldier, 1 resource node, and one objective.
   * This function should be no-op if real game already has state.
   */
  public ensureDemoState(): void {
    // Check if we already have entities
    if (this.units.length > 0 || this.buildings.length > 0 || this.resourceNodes.length > 0) {
      console.log('[QUAT DEBUG] ensureDemoState: world already has entities, skipping');
      return;
    }

    console.log('[QUAT DEBUG] ensureDemoState: creating demo state');

    // Ensure player exists
    if (!this.players.has(1)) {
      this.initializePlayers();
    }

    const player = this.players.get(1);
    if (!player) {
      console.warn('[QUAT DEBUG] ensureDemoState: player 1 not found');
      return;
    }

    // Create a base building
    try {
      const baseId = 'demo_base_1';
      const baseBuilding = {
        id: baseId,
        type: 'base',
        playerId: 1,
        x: this.mapManager.width / 2,
        y: this.mapManager.height / 2,
        health: 100,
        maxHealth: 100,
      };
      this.buildings.push(baseBuilding);
      console.log('[QUAT DEBUG] ensureDemoState: created base', baseId);
    } catch (e) {
      console.warn('[QUAT DEBUG] ensureDemoState: failed to create base', e);
    }

    // Create 2 workers
    try {
      for (let i = 0; i < 2; i++) {
        const workerId = `demo_worker_${i + 1}`;
        const worker = {
          id: workerId,
          type: 'worker',
          playerId: 1,
          x: (this.mapManager.width / 2) + (i * 2),
          y: (this.mapManager.height / 2) + 1,
          health: 50,
          maxHealth: 50,
        };
        this.units.push(worker);
        console.log('[QUAT DEBUG] ensureDemoState: created worker', workerId);
      }
    } catch (e) {
      console.warn('[QUAT DEBUG] ensureDemoState: failed to create workers', e);
    }

    // Create 1 soldier
    try {
      const soldierId = 'demo_soldier_1';
      const soldier = {
        id: soldierId,
        type: 'soldier',
        playerId: 1,
        x: (this.mapManager.width / 2) - 2,
        y: (this.mapManager.height / 2),
        health: 100,
        maxHealth: 100,
      };
      this.units.push(soldier);
      console.log('[QUAT DEBUG] ensureDemoState: created soldier', soldierId);
    } catch (e) {
      console.warn('[QUAT DEBUG] ensureDemoState: failed to create soldier', e);
    }

    // Create 1 resource node
    try {
      const nodeId = 'demo_resource_1';
      const resourceNode = {
        id: nodeId,
        type: 'ore',
        x: (this.mapManager.width / 2) + 5,
        y: (this.mapManager.height / 2),
        resources: { ore: 1000 },
        captured: false,
      };
      this.resourceNodes.push(resourceNode);
      console.log('[QUAT DEBUG] ensureDemoState: created resource node', nodeId);
    } catch (e) {
      console.warn('[QUAT DEBUG] ensureDemoState: failed to create resource node', e);
    }

    // Create one objective (if objectives system exists)
    try {
      // This is a placeholder - adjust based on actual objective system
      console.log('[QUAT DEBUG] ensureDemoState: objective creation skipped (system may not exist)');
    } catch (e) {
      console.warn('[QUAT DEBUG] ensureDemoState: failed to create objective', e);
    }

    console.log('[QUAT DEBUG] ensureDemoState: demo state created', {
      units: this.units.length,
      buildings: this.buildings.length,
      resourceNodes: this.resourceNodes.length,
    });
  }

  /**
   * Get current game state for UI
   */
  public getState() {
    return {
      id: this.id,
      tick: this.tick,
      gameTime: this.gameTime,
      isRunning: this.isRunning,
      gameOver: this.gameOver,
      winner: this.winner,
      endgameScenario: this.endgameScenario,
      players: Array.from(this.players.values()),
      instability: this.instability,
      winConditions: Array.from(this.winConditions.values()),
      units: this.units,
      buildings: this.buildings,
      resourceNodes: this.resourceNodes
    };
  }
  
  /**
   * Serialize for replay
   */
  public serialize() {
    return {
      id: this.id,
      config: this.config,
      seed: this.seed,
      finalTick: this.tick,
      gameTime: this.gameTime,
      winner: this.winner,
      actionLog: this.actionLog,
      events: this.events
    };
  }
}

