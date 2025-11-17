/**
 * Arena Seed System - Fast 3-8 minute matches with deterministic seeds
 * Perfect for quick, replayable sessions
 */

export interface ArenaObjective {
  id: string;
  name: string;
  description: string;
  type: 'territory' | 'resource_race' | 'boss_rush' | 'survival' | 'puzzle_defense';
  timeLimit: number; // in seconds
  checkCompletion: (gameState: any) => { completed: boolean; progress: number; max: number };
}

export interface ArenaConfig {
  seed: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in seconds (3-8 minutes)
  objective: ArenaObjective;
  modifiers: string[];
}

export class ArenaSeedManager {
  private currentArena: ArenaObjective | null = null;
  private arenaStartTime: number = 0;
  private arenaTimer: number = 0;
  private isActive: boolean = false;

  /**
   * Generate daily arena seed (deterministic based on date)
   */
  static generateDailySeed(): number {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate arena configuration from seed
   */
  static generateArenaFromSeed(seed: number): ArenaConfig {
    // Use seed for deterministic generation
    const rng = this.seededRandom(seed);
    
    const objectives: ArenaObjective[] = [
      {
        id: 'territory_control',
        name: 'Territory Control',
        description: 'Control 5 resource nodes for 60 seconds',
        type: 'territory',
        timeLimit: 300,
        checkCompletion: (gameState) => {
          const controlledNodes = gameState.mapManager?.getControlledNodes(1) || 0;
          return {
            completed: controlledNodes >= 5,
            progress: controlledNodes,
            max: 5
          };
        }
      },
      {
        id: 'resource_race',
        name: 'Resource Race',
        description: 'Accumulate 1000 total resources in 5 minutes',
        type: 'resource_race',
        timeLimit: 300,
        checkCompletion: (gameState) => {
          const player = gameState.players?.get(1);
          if (!player) return { completed: false, progress: 0, max: 1000 };
          const total = (player.resources.ore || 0) + 
                       (player.resources.energy || 0) + 
                       (player.resources.biomass || 0) + 
                       (player.resources.data || 0);
          return {
            completed: total >= 1000,
            progress: total,
            max: 1000
          };
        }
      },
      {
        id: 'survival',
        name: 'Survival',
        description: 'Survive 5 minutes against waves of enemies',
        type: 'survival',
        timeLimit: 300,
        checkCompletion: (gameState) => {
          const elapsed = gameState.gameTime || 0;
          return {
            completed: elapsed >= 300,
            progress: elapsed,
            max: 300
          };
        }
      },
      {
        id: 'puzzle_defense',
        name: 'Puzzle Defense',
        description: 'Hold 3 chokepoints for 90 seconds',
        type: 'puzzle_defense',
        timeLimit: 480,
        checkCompletion: (gameState) => {
          // Simplified - would check actual chokepoint control
          const heldPoints = 0; // TODO: Implement chokepoint tracking
          return {
            completed: heldPoints >= 3,
            progress: heldPoints,
            max: 3
          };
        }
      }
    ];

    const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
    const modifiers = ['fast_resources', 'double_damage', 'reduced_costs', 'speed_boost'];

    const objective = objectives[Math.floor(rng() * objectives.length)];
    const difficulty = difficulties[Math.floor(rng() * difficulties.length)];
    const selectedModifiers: string[] = [];
    
    // Select 1-2 random modifiers
    const numModifiers = Math.floor(rng() * 2) + 1;
    for (let i = 0; i < numModifiers; i++) {
      const mod = modifiers[Math.floor(rng() * modifiers.length)];
      if (!selectedModifiers.includes(mod)) {
        selectedModifiers.push(mod);
      }
    }

    return {
      seed,
      difficulty,
      timeLimit: objective.timeLimit,
      objective,
      modifiers: selectedModifiers
    };
  }

  /**
   * Seeded random number generator
   */
  private static seededRandom(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }

  /**
   * Start an arena run
   */
  startArena(config: ArenaConfig): void {
    this.currentArena = config.objective;
    this.arenaStartTime = Date.now();
    this.arenaTimer = config.timeLimit;
    this.isActive = true;
  }

  /**
   * Update arena timer and check completion
   */
  update(deltaTime: number, gameState: any): { completed: boolean; progress?: number; max?: number; timeRemaining: number } | null {
    if (!this.isActive || !this.currentArena) return null;

    this.arenaTimer -= deltaTime;

    // Check objective completion
    const result = this.currentArena.checkCompletion(gameState);
    if (result.completed) {
      this.isActive = false;
      return {
        completed: true,
        progress: result.progress,
        max: result.max,
        timeRemaining: this.arenaTimer
      };
    }

    // Check timeout
    if (this.arenaTimer <= 0) {
      this.isActive = false;
      return {
        completed: false,
        timeRemaining: 0
      };
    }

    return {
      completed: false,
      progress: result.progress,
      max: result.max,
      timeRemaining: this.arenaTimer
    };
  }

  /**
   * Get current arena status
   */
  getStatus(): { objective: ArenaObjective | null; timeRemaining: number; isActive: boolean } {
    return {
      objective: this.currentArena,
      timeRemaining: this.arenaTimer,
      isActive: this.isActive
    };
  }

  /**
   * Stop current arena
   */
  stop(): void {
    this.isActive = false;
    this.currentArena = null;
    this.arenaTimer = 0;
  }
}

