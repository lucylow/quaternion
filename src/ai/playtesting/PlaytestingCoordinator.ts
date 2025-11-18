/**
 * Playtesting Coordinator
 * 
 * Coordinates multiple procedural personas to playtest games and generate
 * comprehensive balance and exploit reports.
 * 
 * This system can run automated playtests across different personas to:
 * - Identify balance issues rapidly
 * - Detect exploits and vulnerabilities
 * - Analyze difficulty curves
 * - Generate actionable recommendations
 */

import { PlaytestingAgent, PlaytestResult } from './PlaytestingAgent';
import { ProceduralPersona, PersonaType, PersonaFactory } from './ProceduralPersona';
import { BalanceDetector, BalanceReport } from './BalanceDetector';
import { ExploitDetector, ExploitDetection } from './ExploitDetector';
import { QuaternionGameState } from '../../game/QuaternionGameState';

export interface PlaytestConfig {
  personas?: PersonaType[]; // Which personas to use (default: all)
  gamesPerPersona?: number;  // How many games each persona plays (default: 5)
  maxTicks?: number;          // Maximum ticks per game (default: 5000)
  seed?: number;              // Random seed for reproducibility
  parallel?: boolean;         // Run games in parallel (default: false)
}

export interface PlaytestSession {
  sessionId: string;
  config: PlaytestConfig;
  results: PlaytestResult[];
  balanceReport: BalanceReport | null;
  exploitDetections: ExploitDetection[];
  startTime: number;
  endTime: number | null;
  status: 'running' | 'completed' | 'failed';
}

export interface PlaytestSummary {
  sessionId: string;
  totalGames: number;
  totalDuration: number; // in ms
  balanceStatus: BalanceReport['overallBalance'];
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  exploitsFound: number;
  recommendations: string[];
}

/**
 * Playtesting Coordinator
 */
export class PlaytestingCoordinator {
  private balanceDetector: BalanceDetector;
  private exploitDetector: ExploitDetector;
  private activeSessions: Map<string, PlaytestSession> = new Map();

  constructor() {
    this.balanceDetector = new BalanceDetector();
    this.exploitDetector = new ExploitDetector();
  }

  /**
   * Run a playtesting session
   */
  async runPlaytestSession(
    gameStateFactory: (seed: number) => QuaternionGameState,
    config: PlaytestConfig = {}
  ): Promise<PlaytestSession> {
    const sessionId = this.generateSessionId();
    const personas = config.personas || Object.values(PersonaType);
    const gamesPerPersona = config.gamesPerPersona || 5;
    const maxTicks = config.maxTicks || 5000;
    const seed = config.seed || Date.now();

    const session: PlaytestSession = {
      sessionId,
      config,
      results: [],
      balanceReport: null,
      exploitDetections: [],
      startTime: Date.now(),
      endTime: null,
      status: 'running'
    };

    this.activeSessions.set(sessionId, session);

    try {
      // Run playtests for each persona
      const allResults: PlaytestResult[] = [];

      if (config.parallel) {
        // Run in parallel (for faster testing)
        const promises = personas.flatMap(personaType =>
          Array.from({ length: gamesPerPersona }, (_, i) =>
            this.runSinglePlaytest(
              gameStateFactory,
              personaType,
              seed + i,
              maxTicks
            )
          )
        );
        const results = await Promise.all(promises);
        allResults.push(...results);
      } else {
        // Run sequentially (for easier debugging)
        for (const personaType of personas) {
          for (let i = 0; i < gamesPerPersona; i++) {
            const result = await this.runSinglePlaytest(
              gameStateFactory,
              personaType,
              seed + i,
              maxTicks
            );
            allResults.push(result);
            session.results.push(result);
          }
        }
      }

      session.results = allResults;

      // Analyze balance
      this.balanceDetector.addPlaytestResults(allResults);
      session.balanceReport = this.balanceDetector.analyzeBalance();

      // Detect exploits
      session.exploitDetections = this.exploitDetector.analyzeForExploits(allResults);

      session.endTime = Date.now();
      session.status = 'completed';

      return session;
    } catch (error) {
      session.status = 'failed';
      session.endTime = Date.now();
      console.error('Playtest session failed:', error);
      throw error;
    }
  }

  /**
   * Run a single playtest game
   */
  private async runSinglePlaytest(
    gameStateFactory: (seed: number) => QuaternionGameState,
    personaType: PersonaType,
    seed: number,
    maxTicks: number
  ): Promise<PlaytestResult> {
    // Create game state
    const gameState = gameStateFactory(seed);
    
    // Create playtesting agent
    const agent = new PlaytestingAgent(personaType, 2); // Player 2 is AI

    // Run game loop
    let tick = 0;
    const startTime = Date.now();
    const maxTime = 60000; // 60 seconds max

    while (tick < maxTicks && !gameState.gameOver && Date.now() - startTime < maxTime) {
      // Update game state
      gameState.tick++;
      tick = gameState.tick;

      // Update agent
      agent.update(gameState);

      // Get agent action
      const action = agent.getBestAction();
      if (action) {
        // Execute action (simplified - would need proper game command execution)
        this.executeAction(gameState, action, 2);
      }

      // Update game state (simulate one tick)
      this.simulateGameTick(gameState);

      // Check win conditions
      if (gameState.winner !== null || gameState.gameOver) {
        break;
      }

      // Small delay to prevent blocking (can be removed for faster testing)
      if (tick % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    // Determine outcome
    let outcome: 'win' | 'loss' | 'draw' | 'timeout';
    if (gameState.winner === 2) {
      outcome = 'win';
    } else if (gameState.winner === 1) {
      outcome = 'loss';
    } else if (gameState.winner === null && gameState.gameOver) {
      outcome = 'draw';
    } else {
      outcome = 'timeout';
    }

    // Calculate final score
    const player = gameState.players.get(2) || gameState.players[2];
    const finalScore = this.calculateScore(gameState, player);

    // Get playtest result
    return agent.getPlaytestResult(outcome, finalScore);
  }

  /**
   * Execute an action in the game state
   */
  private executeAction(gameState: QuaternionGameState, action: any, playerId: number): void {
    // This is a simplified execution - would need to integrate with actual game command system
    const player = gameState.players.get(playerId) || gameState.players[playerId];
    if (!player) return;

    try {
      switch (action.type) {
        case 'build_unit':
          // Would call gameState.createUnit or similar
          break;
        case 'build_building':
          // Would call gameState.createBuilding or similar
          break;
        case 'army_action':
          // Would command army units
          break;
        case 'gather_resources':
          // Would command workers to gather
          break;
        case 'research':
          // Would initiate research
          break;
      }
    } catch (error) {
      console.warn('Failed to execute action:', action, error);
    }
  }

  /**
   * Simulate one game tick
   */
  private simulateGameTick(gameState: QuaternionGameState): void {
    // This would call the actual game state update logic
    // For now, we'll just increment tick
    // In a real implementation, this would update units, buildings, resources, etc.
  }

  /**
   * Calculate final score for a player
   */
  private calculateScore(gameState: QuaternionGameState, player: any): number {
    if (!player) return 0;

    const units = (gameState.units || []).filter((u: any) => u.playerId === player.id);
    const buildings = (gameState.buildings || []).filter((b: any) => b.playerId === player.id);
    
    const unitValue = units.reduce((sum: number, u: any) => sum + (u.cost?.minerals || 0) + (u.cost?.gas || 0), 0);
    const buildingValue = buildings.reduce((sum: number, b: any) => sum + (b.cost?.minerals || 0) + (b.cost?.gas || 0), 0);
    const resources = this.getTotalResources(player.resources || {});

    return unitValue + buildingValue + resources * 0.5;
  }

  /**
   * Get total resources
   */
  private getTotalResources(resources: any): number {
    return (resources.ore || 0) + (resources.minerals || 0) + 
           (resources.energy || 0) + (resources.gas || 0) +
           (resources.biomass || 0) + (resources.data || 0);
  }

  /**
   * Generate summary of playtest session
   */
  generateSummary(session: PlaytestSession): PlaytestSummary {
    const balanceReport = session.balanceReport;
    const exploits = session.exploitDetections;

    const criticalIssues = (balanceReport?.issues || []).filter(i => i.severity === 'critical').length +
                           exploits.filter(e => e.severity === 'critical').length;
    const highIssues = (balanceReport?.issues || []).filter(i => i.severity === 'high').length +
                       exploits.filter(e => e.severity === 'high').length;
    const mediumIssues = (balanceReport?.issues || []).filter(i => i.severity === 'medium').length +
                         exploits.filter(e => e.severity === 'medium').length;

    return {
      sessionId: session.sessionId,
      totalGames: session.results.length,
      totalDuration: (session.endTime || Date.now()) - session.startTime,
      balanceStatus: balanceReport?.overallBalance || 'balanced',
      criticalIssues,
      highIssues,
      mediumIssues,
      exploitsFound: exploits.length,
      recommendations: balanceReport?.recommendations || []
    };
  }

  /**
   * Get active session
   */
  getSession(sessionId: string): PlaytestSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `playtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all sessions
   */
  getAllSessions(): PlaytestSession[] {
    return Array.from(this.activeSessions.values());
  }
}


