/**
 * Exciting Moments System
 * Creates moments of discovery, surprise, and excitement
 */

import type { QuaternionState } from '../strategic/QuaternionState';

export interface ExcitingMoment {
  id: string;
  type: 'discovery' | 'surprise' | 'triumph' | 'near_miss' | 'comeback';
  title: string;
  description: string;
  reward?: {
    resources?: Record<string, number>;
    unlock?: string;
    bonus?: number;
  };
  timestamp: number;
}

export interface Discovery {
  id: string;
  name: string;
  description: string;
  location?: { x: number; y: number };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  reward: {
    resources?: Record<string, number>;
    unlock?: string;
  };
}

export class ExcitingMomentsSystem {
  private discoveries: Discovery[] = [];
  private discoveredIds: Set<string> = new Set();
  private recentMoments: ExcitingMoment[] = [];
  private surpriseCooldown: number = 0;

  constructor() {
    this.initializeDiscoveries();
  }

  /**
   * Initialize possible discoveries
   */
  private initializeDiscoveries(): void {
    // Matter discoveries
    this.discoveries.push({
      id: 'ancient_mine',
      name: 'Ancient Mining Complex',
      description: 'An abandoned mining facility discovered. Yields massive Matter reserves.',
      rarity: 'rare',
      reward: { resources: { ore: 500 }, unlock: 'advanced_mining' }
    });

    // Energy discoveries
    this.discoveries.push({
      id: 'energy_nexus',
      name: 'Energy Nexus',
      description: 'A natural energy convergence point. Unlimited Energy potential.',
      rarity: 'epic',
      reward: { resources: { energy: 300 }, unlock: 'nexus_tap' }
    });

    // Life discoveries
    this.discoveries.push({
      id: 'bioluminescent_grove',
      name: 'Bioluminescent Grove',
      description: 'A grove of glowing life forms. Biomass flows freely here.',
      rarity: 'rare',
      reward: { resources: { biomass: 400 } }
    });

    // Knowledge discoveries
    this.discoveries.push({
      id: 'data_archive',
      name: 'Ancient Data Archive',
      description: 'A repository of lost knowledge. Massive Data reserves found.',
      rarity: 'epic',
      reward: { resources: { data: 350 }, unlock: 'archive_access' }
    });

    // Legendary discoveries
    this.discoveries.push({
      id: 'quaternion_core',
      name: 'Quaternion Core Fragment',
      description: 'A fragment of the original Quaternion. All resources boosted!',
      rarity: 'legendary',
      reward: {
        resources: { ore: 200, energy: 200, biomass: 200, data: 200 },
        unlock: 'core_fragment'
      }
    });
  }

  /**
   * Check for exciting moments
   */
  checkExcitingMoments(
    gameState: QuaternionState,
    action: string,
    timeSinceStart: number
  ): ExcitingMoment[] {
    const moments: ExcitingMoment[] = [];

    // Discovery check (random chance, more likely at certain locations)
    const discovery = this.checkDiscovery(timeSinceStart);
    if (discovery) {
      moments.push({
        id: `discovery_${discovery.id}_${Date.now()}`,
        type: 'discovery',
        title: discovery.name,
        description: discovery.description,
        reward: discovery.reward,
        timestamp: Date.now()
      });
      this.discoveredIds.add(discovery.id);
    }

    // Near miss check (instability almost maxed, but recovered)
    const nearMiss = this.checkNearMiss(gameState);
    if (nearMiss) {
      moments.push(nearMiss);
    }

    // Comeback check (recovered from low stability)
    const comeback = this.checkComeback(gameState);
    if (comeback) {
      moments.push(comeback);
    }

    // Triumph check (achieved milestone)
    const triumph = this.checkTriumph(gameState, action);
    if (triumph) {
      moments.push(triumph);
    }

    // Surprise check (unexpected event)
    const surprise = this.checkSurprise(gameState, timeSinceStart);
    if (surprise) {
      moments.push(surprise);
    }

    // Store moments
    moments.forEach(moment => {
      this.recentMoments.push(moment);
      if (this.recentMoments.length > 20) {
        this.recentMoments.shift();
      }
    });

    return moments;
  }

  /**
   * Check for discovery
   */
  private checkDiscovery(timeSinceStart: number): Discovery | null {
    // More discoveries early in game
    const discoveryChance = timeSinceStart < 300 ? 0.005 : 0.001;
    
    if (Math.random() < discoveryChance) {
      // Filter out already discovered
      const available = this.discoveries.filter(d => !this.discoveredIds.has(d.id));
      if (available.length === 0) return null;

      // Weighted by rarity
      const weights = {
        common: 0.6,
        rare: 0.25,
        epic: 0.12,
        legendary: 0.03
      };

      const random = Math.random();
      let cumulative = 0;
      
      for (const discovery of available) {
        cumulative += weights[discovery.rarity];
        if (random <= cumulative) {
          return discovery;
        }
      }

      return available[0];
    }

    return null;
  }

  /**
   * Check for near miss
   */
  private checkNearMiss(gameState: QuaternionState): ExcitingMoment | null {
    // Instability was high (>180) but dropped significantly
    // This would require tracking previous instability
    // For now, check if instability dropped from high to low quickly
    if (gameState.stability > 1.5 && gameState.stability < 1.7) {
      // Recently recovered from low stability
      return {
        id: `near_miss_${Date.now()}`,
        type: 'near_miss',
        title: 'Narrow Escape',
        description: 'System stability recovered just in time! Close call bonus awarded.',
        reward: { bonus: 1.2 },
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Check for comeback
   */
  private checkComeback(gameState: QuaternionState): ExcitingMoment | null {
    // Resources recovered from low to high
    const { ore, energy, biomass, data } = gameState;
    const total = ore + energy + biomass + data;
    
    if (total > 1000 && gameState.stability > 1.6) {
      // Strong recovery
      return {
        id: `comeback_${Date.now()}`,
        type: 'comeback',
        title: 'Amazing Comeback',
        description: 'Resources recovered from the brink! Determination bonus active.',
        reward: { bonus: 1.3 },
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Check for triumph
   */
  private checkTriumph(gameState: QuaternionState, action: string): ExcitingMoment | null {
    // Perfect balance achievement
    const { ore, energy, biomass, data } = gameState;
    const total = ore + energy + biomass + data;
    
    if (total === 0) return null;

    const avg = total / 4;
    const variance = Math.sqrt(
      (Math.pow(ore - avg, 2) + Math.pow(energy - avg, 2) +
       Math.pow(biomass - avg, 2) + Math.pow(data - avg, 2)) / 4
    );

    // Perfect balance (variance < 1% of average)
    if (variance / avg < 0.01 && total > 500) {
      return {
        id: `triumph_balance_${Date.now()}`,
        type: 'triumph',
        title: 'Perfect Balance Achieved!',
        description: 'All resources in perfect harmony. Harmonic resonance unlocked!',
        reward: { bonus: 1.5, unlock: 'harmonic_resonance' },
        timestamp: Date.now()
      };
    }

    // Stability peak
    if (gameState.stability >= 1.9) {
      return {
        id: `triumph_stability_${Date.now()}`,
        type: 'triumph',
        title: 'Supreme Stability',
        description: 'System stability at maximum! All production boosted.',
        reward: { bonus: 1.4 },
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Check for surprise
   */
  private checkSurprise(gameState: QuaternionState, timeSinceStart: number): ExcitingMoment | null {
    const now = Date.now();
    if (now - this.surpriseCooldown < 60000) return null; // 1 minute cooldown

    // Random surprise events
    if (Math.random() < 0.001) { // 0.1% chance per check
      this.surpriseCooldown = now;

      const surprises = [
        {
          title: 'Resource Windfall',
          description: 'Unexpected resource deposit discovered!',
          reward: {
            resources: {
              ore: 100 + Math.random() * 200,
              energy: 100 + Math.random() * 200
            }
          }
        },
        {
          title: 'Tech Breakthrough',
          description: 'Research accelerated by breakthrough!',
          reward: { unlock: 'breakthrough_speed' }
        },
        {
          title: 'Stability Surge',
          description: 'System stability unexpectedly improved!',
          reward: { bonus: 1.25 }
        }
      ];

      const surprise = surprises[Math.floor(Math.random() * surprises.length)];

      return {
        id: `surprise_${Date.now()}`,
        type: 'surprise',
        ...surprise,
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Get recent exciting moments
   */
  getRecentMoments(count: number = 5): ExcitingMoment[] {
    return this.recentMoments.slice(-count).reverse();
  }

  /**
   * Get all discovered items
   */
  getDiscoveries(): Discovery[] {
    return this.discoveries.filter(d => this.discoveredIds.has(d.id));
  }
}

