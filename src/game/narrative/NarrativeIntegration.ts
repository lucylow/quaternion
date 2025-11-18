/**
 * Narrative Integration
 * Integrates AI narrative systems with existing Quaternion game systems
 */

import { AINarrativeDirector } from './AINarrativeDirector';
import { LLMIntegration } from '@/ai/integrations/LLMIntegration';
import { MemoryManager } from '@/ai/memory/MemoryManager';
import type { QuaternionGameState } from '@/game/QuaternionGameState';
import type { AdvisorTensionSystem } from '@/game/AdvisorTensionSystem';

export class NarrativeIntegration {
  private narrativeDirector: AINarrativeDirector;
  private updateInterval: number = 1000; // Update every second
  private intervalHandle?: number;

  constructor(
    gameState: QuaternionGameState,
    llmConfig?: any,
    memoryManager?: MemoryManager
  ) {
    // Initialize narrative director
    this.narrativeDirector = new AINarrativeDirector(llmConfig, memoryManager);

    // Connect with game state
    this.connectWithGameState(gameState);
  }

  /**
   * Initialize narrative systems with game seed
   */
  async initialize(worldSeed: number): Promise<void> {
    await this.narrativeDirector.initializeNarrativeAI(worldSeed);

    // Start update loop
    this.startUpdateLoop();
  }

  /**
   * Connect narrative system with game state
   */
  private connectWithGameState(gameState: QuaternionGameState): void {
    // Update world model when game state changes
    // This would be called from game loop updates

    // Example: Listen to resource changes
    if (gameState.resourceManager) {
      // Monitor resource changes for narrative events
    }

    // Example: Listen to advisor system
    if (gameState.advisorTensionSystem) {
      // Connect advisor reactions to narrative system
    }
  }

  /**
   * Start update loop
   */
  private startUpdateLoop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }

    this.intervalHandle = window.setInterval(() => {
      this.updateNarrative();
    }, this.updateInterval);
  }

  /**
   * Update narrative systems
   */
  private updateNarrative(): void {
    // Update world model from game state
    // This would pull from actual game state
    this.narrativeDirector.updateWorldModel({
      globalTension: this.calculateWorldTension()
    });
  }

  /**
   * Calculate world tension from game state
   */
  private calculateWorldTension(): number {
    // Example calculation - would use actual game state
    // Could be based on resource instability, conflicts, etc.
    return 50; // Placeholder
  }

  /**
   * Record player action for narrative tracking
   */
  recordPlayerAction(action: string, choice?: string): void {
    this.narrativeDirector.recordPlayerAction(action, choice);
  }

  /**
   * Get current narrative state for UI
   */
  getNarrativeState() {
    return this.narrativeDirector.getNarrativeState();
  }

  /**
   * Cleanup on shutdown
   */
  cleanup(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }
}

/**
 * Factory function to create narrative integration
 */
export function createNarrativeIntegration(
  gameState: QuaternionGameState,
  llmConfig?: any
): NarrativeIntegration {
  const memoryManager = new MemoryManager();
  return new NarrativeIntegration(gameState, llmConfig, memoryManager);
}

