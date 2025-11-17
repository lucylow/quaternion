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

export interface Resources {
  matter: number;
  energy: number;
  life: number;
  knowledge: number;
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
  
  private setupResourceCallbacks(): void {
    this.resourceManager.onResourceChange((type, amount) => {
      // Sync with player resources
      const player = this.players.get(1);
      if (player) {
        switch (type) {
          case ResourceType.MATTER:
            player.resources.matter = amount;
            break;
          case ResourceType.ENERGY:
            player.resources.energy = amount;
            break;
          case ResourceType.LIFE:
            player.resources.life = amount;
            break;
          case ResourceType.KNOWLEDGE:
            player.resources.knowledge = amount;
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
    // Adjust starting resources based on map size (smaller maps = faster games)
    const isQuickStart = this.config.mapWidth <= 30 && this.config.mapHeight <= 20;
    const startingResources = isQuickStart 
      ? { matter: 800, energy: 400, life: 200, knowledge: 100 } // More resources for quick start
      : { matter: 700, energy: 350, life: 150, knowledge: 75 }; // Increased for faster progression
    
    // Set initial resources in ResourceManager
    this.resourceManager.setInitialResources(
      startingResources.matter,
      startingResources.energy,
      startingResources.life,
      startingResources.knowledge
    );
    
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
    
    // Player 2 (AI)
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
  
  /**
   * Start the game loop
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logAction('game_start', { seed: this.seed, config: this.config });
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
    
    this.tick++;
    this.gameTime += deltaTime;
    
    // Process enhanced managers
    this.processManagers();
    
    // Update resources (passive generation and consumption)
    this.updateResources(deltaTime);
    
    // Calculate instability
    this.updateInstability();
    
    // Update win conditions
    this.checkWinConditions();
    
    // Check lose conditions
    this.checkLoseConditions();
  }
  
  /**
   * Process all enhanced managers
   */
  private processManagers(): void {
    // Get resource generation from map nodes
    const resourceGeneration = this.mapManager.getResourceGeneration();
    const controlledNodes = new Map<ResourceType, number>();
    
    // Convert map generation to ResourceType enum
    resourceGeneration.forEach((amount, nodeType) => {
      switch (nodeType) {
        case 'matter':
          controlledNodes.set(ResourceType.MATTER, 
            (controlledNodes.get(ResourceType.MATTER) || 0) + 1);
          break;
        case 'energy':
          controlledNodes.set(ResourceType.ENERGY,
            (controlledNodes.get(ResourceType.ENERGY) || 0) + 1);
          break;
        case 'life':
          controlledNodes.set(ResourceType.LIFE,
            (controlledNodes.get(ResourceType.LIFE) || 0) + 1);
          break;
        case 'knowledge':
          controlledNodes.set(ResourceType.KNOWLEDGE,
            (controlledNodes.get(ResourceType.KNOWLEDGE) || 0) + 1);
          break;
      }
    });
    
    // Process resource tick
    this.resourceManager.processResourceTick(controlledNodes, new Map());
    
    // Process unit production
    const completedUnits = this.unitManager.processProductionTicks();
    completedUnits.forEach(unit => {
      this.units.push(unit);
    });
    
    // Process unit ticks
    this.unitManager.processUnitTicks();
    
    // Process research
    this.techTreeManager.processResearchTick();
    
    // Sync researched techs
    const player = this.players.get(1);
    if (player) {
      this.techTreeManager.getAllTechNodes().forEach(node => {
        if (node.isResearched && !player.researchedTechs.has(node.nodeId)) {
          player.researchedTechs.add(node.nodeId);
        }
      });
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
   */
  private updateResources(deltaTime: number): void {
    this.players.forEach((player, playerId) => {
      // Energy depletes constantly (reduced consumption for faster gameplay)
      player.resources.energy -= 0.3 * deltaTime; // Reduced from 0.5 to 0.3
      
      // Resource generation from buildings
      this.buildings
        .filter(b => b.playerId === playerId && b.isComplete)
        .forEach(building => {
          if (building.produces) {
            Object.keys(building.produces).forEach(resource => {
              player.resources[resource as keyof Resources] += 
                building.produces[resource] * deltaTime;
            });
          }
        });
      
      // Clamp resources
      player.resources.matter = Math.max(0, Math.min(1000, player.resources.matter));
      player.resources.energy = Math.max(0, Math.min(1000, player.resources.energy));
      player.resources.life = Math.max(0, Math.min(1000, player.resources.life));
      player.resources.knowledge = Math.max(0, Math.min(1000, player.resources.knowledge));
    });
  }
  
  /**
   * Calculate system instability based on resource imbalance
   */
  private updateInstability(): void {
    const player = this.players.get(1);
    if (!player) return;
    
    const { matter, energy, life, knowledge } = player.resources;
    const avg = (matter + energy + life + knowledge) / 4;
    
    // Calculate variance from average
    const variance = [matter, energy, life, knowledge]
      .reduce((sum, val) => sum + Math.abs(val - avg), 0) / 4;
    
    // Instability increases with imbalance
    this.instability = (variance / avg) * 100;
    
    // Check for critical resources at zero
    if (matter === 0 || energy === 0 || life === 0 || knowledge === 0) {
      this.instability = this.maxInstability;
    }
  }
  
  /**
   * Check all win conditions using EndgameManager
   */
  private checkWinConditions(): void {
    const player = this.players.get(1);
    if (!player) return;
    
    const { matter, energy, life, knowledge } = player.resources;
    const avg = (matter + energy + life + knowledge) / 4;
    
    // Detect endgame scenario using EndgameManager
    const scenario = EndgameManager.detectScenario(
      player.resources,
      this.instability,
      this.maxInstability,
      player.researchedTechs,
      player.moralAlignment,
      this.gameTime
    );
    
    if (!scenario) {
      // Reset perfect balance progress if not in perfect balance
      this.perfectBalanceProgress = 0;
      return;
    }
    
    // Handle perfect balance (Ultimate Balance ending)
    if (scenario === 'ultimate_balance') {
      const maxDeviation = Math.max(
        Math.abs(matter - avg),
        Math.abs(energy - avg),
        Math.abs(life - avg),
        Math.abs(knowledge - avg)
      );
      const perfectBalanceThreshold = avg * 0.02; // 2% deviation
      
      if (maxDeviation <= perfectBalanceThreshold && avg > 200) {
        this.perfectBalanceProgress += 1;
        if (this.perfectBalanceProgress >= this.perfectBalanceRequiredTime) {
          this.endGame(1, 'ultimate_balance', scenario);
          return;
        }
      } else {
        this.perfectBalanceProgress = 0;
      }
    }
    
    // Handle Harmony (Equilibrium)
    if (scenario === 'harmony') {
      const equilibrium = this.winConditions.get('equilibrium')!;
      const maxDeviation = Math.max(
        Math.abs(matter - avg),
        Math.abs(energy - avg),
        Math.abs(life - avg),
        Math.abs(knowledge - avg)
      );
      
      const isQuickStart = this.config.mapWidth <= 30 && this.config.mapHeight <= 20;
      const requiredTime = isQuickStart ? 10 * this.tickRate : 15 * this.tickRate;
      
      if (maxDeviation / avg <= 0.15) {
        equilibrium.progress += 1;
        if (equilibrium.progress >= requiredTime) {
          equilibrium.achieved = true;
          this.endGame(1, 'harmony', scenario);
          return;
        }
      } else {
        equilibrium.progress = 0;
      }
    }
    
    // Handle Ascendancy (Tech victory)
    if (scenario === 'ascendancy' && player.researchedTechs.has('quantum_ascendancy')) {
      const tech = this.winConditions.get('technological')!;
      tech.achieved = true;
      this.endGame(1, 'ascendancy', scenario);
      return;
    }
    
    // Handle Reclamation (Life focus)
    if (scenario === 'reclamation') {
      // Check if life is significantly higher and maintained
      if (life > avg * 1.5 && life > 500 && 
          life > matter * 1.3 && life > energy * 1.3 && life > knowledge * 1.3) {
        const isQuickStart = this.config.mapWidth <= 30 && this.config.mapHeight <= 20;
        const requiredTime = isQuickStart ? 10 * this.tickRate : 15 * this.tickRate;
        
        // Track progress for reclamation
        const reclamationCondition = this.winConditions.get('moral')!; // Reuse moral for tracking
        reclamationCondition.progress += 1;
        if (reclamationCondition.progress >= requiredTime) {
          this.endGame(1, 'reclamation', scenario);
          return;
        }
      } else {
        this.winConditions.get('moral')!.progress = 0;
      }
    }
    
    // Handle Overclock (Energy maximized)
    if (scenario === 'overclock') {
      // Check if energy is significantly higher and maintained
      if (energy > avg * 1.5 && energy > 500 &&
          energy > matter * 1.3 && energy > life * 1.3 && energy > knowledge * 1.3) {
        const isQuickStart = this.config.mapWidth <= 30 && this.config.mapHeight <= 20;
        const requiredTime = isQuickStart ? 10 * this.tickRate : 15 * this.tickRate;
        
        // Track progress for overclock
        const territorial = this.winConditions.get('territorial')!; // Reuse territorial for tracking
        territorial.progress += 1;
        if (territorial.progress >= requiredTime) {
          this.endGame(1, 'overclock', scenario);
          return;
        }
      } else {
        this.winConditions.get('territorial')!.progress = 0;
      }
    }
  }
  
  /**
   * Check lose conditions (Collapse Timeline)
   */
  private checkLoseConditions(): void {
    const player = this.players.get(1);
    if (!player) return;
    
    // Detect collapse scenario using EndgameManager
    const scenario = EndgameManager.detectScenario(
      player.resources,
      this.instability,
      this.maxInstability,
      player.researchedTechs,
      player.moralAlignment,
      this.gameTime
    );
    
    // Any resource reaches 0 or instability exceeds maximum
    if (scenario === 'collapse') {
      let reason = 'instability_meltdown';
      if (player.resources.matter === 0 || 
          player.resources.energy === 0 || 
          player.resources.life === 0 || 
          player.resources.knowledge === 0) {
        reason = 'resource_collapse';
      }
      this.endGame(2, reason, 'collapse');
      return;
    }
  }
  
  /**
   * End the game
   */
  private endGame(winnerId: number, reason: string, scenario?: EndgameScenario): void {
    this.gameOver = true;
    this.winner = winnerId;
    this.isRunning = false;
    this.endgameScenario = scenario || null;
    this.logAction('game_end', { winner: winnerId, reason, scenario, tick: this.tick });
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
