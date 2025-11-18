/**
 * Dialog Event Manager
 * Connects game events to dialog system triggers
 */

import { AdvisorDialogSystem, type DialogEvent, type AdvisorName } from './AdvisorDialogSystem';
import type { QuaternionState } from '../game/strategic/QuaternionState';

export interface GameEvent {
  type: DialogEvent;
  advisor?: AdvisorName;
  context?: Record<string, any>;
}

export class DialogEventManager {
  private dialogSystem: AdvisorDialogSystem;
  private eventQueue: GameEvent[] = [];
  private isProcessing: boolean = false;
  private lastEventTime: Map<DialogEvent, number> = new Map();
  private eventCooldowns: Map<DialogEvent, number> = new Map();

  constructor(dialogSystem: AdvisorDialogSystem) {
    this.dialogSystem = dialogSystem;
    
    // Set cooldowns for events (prevent spam)
    this.eventCooldowns.set('flavor_ambient', 60000); // 60s
    this.eventCooldowns.set('resource_low', 30000); // 30s
    this.eventCooldowns.set('enemy_spotted', 10000); // 10s
    this.eventCooldowns.set('unit_killed', 5000); // 5s
  }

  /**
   * Queue a dialog event
   */
  queueEvent(event: GameEvent): void {
    // Check cooldown
    const cooldown = this.eventCooldowns.get(event.type);
    if (cooldown) {
      const lastTime = this.lastEventTime.get(event.type) || 0;
      const now = Date.now();
      if (now - lastTime < cooldown) {
        return; // Still on cooldown
      }
    }

    // Add to queue
    this.eventQueue.push(event);
    this.lastEventTime.set(event.type, Date.now());

    // Process if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process event queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const event = this.eventQueue.shift()!;

    try {
      await this.dialogSystem.playDialogForEvent(
        event.type,
        event.advisor,
        { skipRecent: true }
      );
    } catch (error) {
      console.error(`Failed to process dialog event ${event.type}:`, error);
    }

    // Wait a bit before next event
    await new Promise(resolve => setTimeout(resolve, 500));

    // Process next event
    this.isProcessing = false;
    this.processQueue();
  }

  /**
   * Trigger event from game state changes
   */
  onGameStateChange(
    previousState: QuaternionState,
    currentState: QuaternionState
  ): void {
    // Check for resource changes
    const prevResources = this.getTotalResources(previousState);
    const currResources = this.getTotalResources(currentState);

    if (currResources < prevResources * 0.2 && prevResources > 0) {
      this.queueEvent({ type: 'resource_low' });
    } else if (currResources > prevResources * 1.5) {
      this.queueEvent({ type: 'resource_secured' });
    }

    // Check for stability changes (entropy spikes)
    const prevStability = this.calculateStability(previousState);
    const currStability = this.calculateStability(currentState);

    if (currStability < 0.3 && prevStability >= 0.3) {
      // Entered chaos state
      this.queueEvent({ type: 'environmental_hazard', advisor: 'Virel' });
    }
  }

  /**
   * Get total resources from state
   */
  private getTotalResources(state: QuaternionState): number {
    return Math.abs(state.w) + Math.abs(state.x) + 
           Math.abs(state.y) + Math.abs(state.z);
  }

  /**
   * Calculate stability from state
   */
  private calculateStability(state: QuaternionState): number {
    const { w, x, y, z } = state;
    const total = Math.abs(w) + Math.abs(x) + Math.abs(y) + Math.abs(z);
    
    if (total === 0) return 0.5;

    const avg = total / 4;
    const variance = Math.sqrt(
      (Math.pow(Math.abs(w) - avg, 2) +
       Math.pow(Math.abs(x) - avg, 2) +
       Math.pow(Math.abs(y) - avg, 2) +
       Math.pow(Math.abs(z) - avg, 2)) / 4
    );

    return Math.max(0, Math.min(1, 1 - (variance / avg)));
  }

  /**
   * Trigger game start dialog
   */
  onGameStart(): void {
    this.queueEvent({ type: 'game_start', advisor: 'Core' });
    setTimeout(() => {
      this.queueEvent({ type: 'game_start', advisor: 'Auren' });
    }, 2000);
  }

  /**
   * Trigger victory dialog
   */
  onVictory(): void {
    // Play victory lines from all advisors
    const advisors: AdvisorName[] = ['Auren', 'Virel', 'Lira', 'Kor'];
    advisors.forEach((advisor, index) => {
      setTimeout(() => {
        this.queueEvent({ type: 'victory', advisor });
      }, index * 1500);
    });
    
    // Final Core line
    setTimeout(() => {
      this.queueEvent({ type: 'victory', advisor: 'Core' });
    }, advisors.length * 1500 + 1000);
  }

  /**
   * Trigger defeat dialog
   */
  onDefeat(): void {
    this.queueEvent({ type: 'defeat', advisor: 'Core' });
  }

  /**
   * Trigger enemy spotted
   */
  onEnemySpotted(location?: { x: number; y: number }): void {
    this.queueEvent({ 
      type: 'enemy_spotted',
      context: { location }
    });
  }

  /**
   * Trigger unit killed
   */
  onUnitKilled(): void {
    this.queueEvent({ type: 'unit_killed' });
  }

  /**
   * Trigger ultimate ready
   */
  onUltimateReady(advisor?: AdvisorName): void {
    this.queueEvent({ type: 'ultimate_ready', advisor });
  }

  /**
   * Trigger ultimate fired
   */
  onUltimateFired(advisor?: AdvisorName): void {
    this.queueEvent({ type: 'ultimate_fired', advisor });
  }

  /**
   * Trigger tech complete
   */
  onTechComplete(): void {
    this.queueEvent({ type: 'tech_complete' });
  }

  /**
   * Trigger ambient flavor line (random)
   */
  triggerAmbientFlavor(): void {
    this.queueEvent({ type: 'flavor_ambient' });
  }
}

