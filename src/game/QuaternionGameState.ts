/**
 * Enhanced GameState for Quaternion strategy game
 * Implements the 4-resource system (Matter, Energy, Life, Knowledge)
 */

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
  
  // Win conditions
  public winConditions: Map<string, WinCondition>;
  public winner: number | null = null;
  public gameOver: boolean = false;
  
  // Events and actions log
  public actionLog: any[] = [];
  public events: any[] = [];
  
  // AI state
  public aiState: any = null;
  
  constructor(config: GameConfig) {
    this.id = this.generateId();
    this.tick = 0;
    this.config = config;
    this.seed = config.seed;
    
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
   * Check all win conditions
   */
  private checkWinConditions(): void {
    const player = this.players.get(1);
    if (!player) return;
    
    // Equilibrium Victory: All resources within ±15% for 15 seconds (10 seconds for quick start)
    const equilibrium = this.winConditions.get('equilibrium')!;
    const { matter, energy, life, knowledge } = player.resources;
    const avg = (matter + energy + life + knowledge) / 4;
    const maxDeviation = Math.max(
      Math.abs(matter - avg),
      Math.abs(energy - avg),
      Math.abs(life - avg),
      Math.abs(knowledge - avg)
    );
    
    // Adjust time requirement for quick start mode - much faster for 30-min games
    const isQuickStart = this.config.mapWidth <= 30 && this.config.mapHeight <= 20;
    const requiredTime = isQuickStart ? 10 * this.tickRate : 15 * this.tickRate;
    
    if (maxDeviation / avg <= 0.15) {
      equilibrium.progress += 1;
      if (equilibrium.progress >= requiredTime) {
        equilibrium.achieved = true;
        this.endGame(1, 'equilibrium');
      }
    } else {
      equilibrium.progress = 0;
    }
    
    // Technological Victory: Unlock terminal technology
    const tech = this.winConditions.get('technological')!;
    if (player.researchedTechs.has('quantum_ascendancy')) {
      tech.achieved = true;
      this.endGame(1, 'technological');
    }
    
    // Territorial Victory: Hold central node for 20 seconds (15 seconds for quick start)
    const territorial = this.winConditions.get('territorial')!;
    const isQuickStart = this.config.mapWidth <= 30 && this.config.mapHeight <= 20;
    // This would check if player controls the central node
    // For now, we'll track progress but not implement full territorial control
    if (territorial.progress > 0) {
      const requiredTime = isQuickStart ? 15 * this.tickRate : 20 * this.tickRate;
      if (territorial.progress >= requiredTime) {
        territorial.achieved = true;
        this.endGame(1, 'territorial');
      }
    }
    
    // Moral Victory: Make ethical choices over 3 key events (reduced from 4)
    const moral = this.winConditions.get('moral')!;
    if (player.moralAlignment >= 60) { // Reduced from 80 to 60
      moral.achieved = true;
      this.endGame(1, 'moral');
    }
  }
  
  /**
   * Check lose conditions
   */
  private checkLoseConditions(): void {
    const player = this.players.get(1);
    if (!player) return;
    
    // Any resource reaches 0
    if (player.resources.matter === 0 || 
        player.resources.energy === 0 || 
        player.resources.life === 0 || 
        player.resources.knowledge === 0) {
      this.endGame(2, 'resource_collapse');
      return;
    }
    
    // Instability exceeds maximum
    if (this.instability >= this.maxInstability) {
      this.endGame(2, 'instability_meltdown');
      return;
    }
  }
  
  /**
   * End the game
   */
  private endGame(winnerId: number, reason: string): void {
    this.gameOver = true;
    this.winner = winnerId;
    this.isRunning = false;
    this.logAction('game_end', { winner: winnerId, reason, tick: this.tick });
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
    
    player.researchedTechs.add(techId);
    this.logAction('research_tech', { techId, playerId, tick: this.tick });
    return true;
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
