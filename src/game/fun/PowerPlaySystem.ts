/**
 * Power Play System
 * Creates exciting power plays, combos, and satisfying chain reactions
 */

import type { QuaternionState } from '../strategic/QuaternionState';

export interface PowerPlay {
  id: string;
  type: 'synergy' | 'chain' | 'perfect_timing' | 'combo' | 'milestone';
  name: string;
  description: string;
  bonus: number; // Multiplier or bonus amount
  duration?: number; // If temporary
  unlocked: boolean;
}

export interface SynergyBonus {
  resource1: string;
  resource2: string;
  bonus: number;
  name: string;
}

export class PowerPlaySystem {
  private activePowerPlays: Map<string, PowerPlay> = new Map();
  private synergyBonuses: SynergyBonus[] = [];
  private comboChain: string[] = [];
  private lastActionTime: number = 0;
  private perfectTimings: number = 0;

  constructor() {
    this.initializeSynergies();
  }

  /**
   * Initialize resource synergies
   */
  private initializeSynergies(): void {
    // Matter + Energy = Industrial Synergy
    this.synergyBonuses.push({
      resource1: 'ore',
      resource2: 'energy',
      bonus: 1.15, // 15% boost when both high
      name: 'Industrial Synergy'
    });

    // Life + Knowledge = BioTech Synergy
    this.synergyBonuses.push({
      resource1: 'biomass',
      resource2: 'data',
      bonus: 1.20, // 20% boost
      name: 'BioTech Synergy'
    });

    // All Four Balanced = Harmonic Resonance
    this.synergyBonuses.push({
      resource1: 'balance',
      resource2: 'all',
      bonus: 1.25, // 25% boost for perfect balance
      name: 'Harmonic Resonance'
    });

    // Matter + Life = Synthesis (rare)
    this.synergyBonuses.push({
      resource1: 'ore',
      resource2: 'biomass',
      bonus: 1.10,
      name: 'Synthesis'
    });

    // Energy + Knowledge = Quantum Synergy
    this.synergyBonuses.push({
      resource1: 'energy',
      resource2: 'data',
      bonus: 1.18,
      name: 'Quantum Synergy'
    });
  }

  /**
   * Check for power plays based on game state
   */
  checkPowerPlays(gameState: QuaternionState, action: string): PowerPlay[] {
    const newPowerPlays: PowerPlay[] = [];

    // Check synergies
    const synergy = this.checkSynergies(gameState);
    if (synergy) {
      const powerPlay: PowerPlay = {
        id: `synergy_${synergy.name}_${Date.now()}`,
        type: 'synergy',
        name: synergy.name,
        description: `${synergy.name} activated! Production boosted by ${Math.round((synergy.bonus - 1) * 100)}%`,
        bonus: synergy.bonus,
        unlocked: true
      };
      newPowerPlays.push(powerPlay);
      this.activePowerPlays.set(powerPlay.id, powerPlay);
    }

    // Check combo chain
    const combo = this.checkComboChain(action);
    if (combo) {
      newPowerPlays.push(combo);
      this.activePowerPlays.set(combo.id, combo);
    }

    // Check perfect timing
    const perfect = this.checkPerfectTiming();
    if (perfect) {
      newPowerPlays.push(perfect);
      this.activePowerPlays.set(perfect.id, perfect);
    }

    // Check milestones
    const milestone = this.checkMilestones(gameState);
    if (milestone) {
      newPowerPlays.push(milestone);
      this.activePowerPlays.set(milestone.id, milestone);
    }

    return newPowerPlays;
  }

  /**
   * Check for resource synergies
   */
  private checkSynergies(gameState: QuaternionState): SynergyBonus | null {
    const { ore, energy, biomass, data } = gameState;
    const total = ore + energy + biomass + data;
    
    if (total === 0) return null;

    const oreRatio = ore / total;
    const energyRatio = energy / total;
    const biomassRatio = biomass / total;
    const dataRatio = data / total;

    // Check each synergy
    for (const synergy of this.synergyBonuses) {
      if (synergy.resource1 === 'balance' && synergy.resource2 === 'all') {
        // Harmonic Resonance - all resources within 5% of each other
        const avg = total / 4;
        const variance = Math.sqrt(
          (Math.pow(ore - avg, 2) + Math.pow(energy - avg, 2) +
           Math.pow(biomass - avg, 2) + Math.pow(data - avg, 2)) / 4
        );
        
        if (variance / avg < 0.05) { // Within 5%
          return synergy;
        }
      } else {
        // Pair synergies - both resources above 30% of total
        const r1 = synergy.resource1 === 'ore' ? oreRatio :
                   synergy.resource1 === 'energy' ? energyRatio :
                   synergy.resource1 === 'biomass' ? biomassRatio :
                   dataRatio;
        
        const r2 = synergy.resource2 === 'ore' ? oreRatio :
                   synergy.resource2 === 'energy' ? energyRatio :
                   synergy.resource2 === 'biomass' ? biomassRatio :
                   dataRatio;

        if (r1 > 0.3 && r2 > 0.3) {
          return synergy;
        }
      }
    }

    return null;
  }

  /**
   * Check for combo chain
   */
  private checkComboChain(action: string): PowerPlay | null {
    const now = Date.now();
    const timeSinceLast = now - this.lastActionTime;

    // Add to chain if within 1 second
    if (timeSinceLast < 1000) {
      this.comboChain.push(action);
    } else {
      this.comboChain = [action];
    }

    this.lastActionTime = now;

    // Combo rewards
    if (this.comboChain.length >= 5) {
      return {
        id: `combo_${Date.now()}`,
        type: 'combo',
        name: 'Action Chain',
        description: `${this.comboChain.length} actions in quick succession! Efficiency bonus active.`,
        bonus: 1.0 + (this.comboChain.length - 4) * 0.05, // 5% per action over 4
        duration: 5000, // 5 seconds
        unlocked: true
      };
    }

    return null;
  }

  /**
   * Check for perfect timing (actions at optimal moments)
   */
  private checkPerfectTiming(): PowerPlay | null {
    // Track timing - if action happens right when resource hits threshold
    this.perfectTimings++;

    if (this.perfectTimings >= 3) {
      return {
        id: `perfect_${Date.now()}`,
        type: 'perfect_timing',
        name: 'Perfect Timing',
        description: 'Perfect resource management! Bonus resources awarded.',
        bonus: 1.5,
        duration: 10000,
        unlocked: true
      };
    }

    return null;
  }

  /**
   * Check for milestones
   */
  private checkMilestones(gameState: QuaternionState): PowerPlay | null {
    const { ore, energy, biomass, data } = gameState;

    // Resource milestones (100, 500, 1000, etc.)
    const milestones = [100, 500, 1000, 2000];
    
    for (const milestone of milestones) {
      const resources = [ore, energy, biomass, data];
      const reachedCount = resources.filter(r => r >= milestone).length;

      if (reachedCount === 4 && !this.isMilestoneUnlocked(`all_${milestone}`)) {
        return {
          id: `milestone_all_${milestone}`,
          type: 'milestone',
          name: 'Perfect Balance',
          description: `All resources reached ${milestone}! Harmonic bonus unlocked.`,
          bonus: 1.3,
          duration: 30000,
          unlocked: true
        };
      }
    }

    // Stability milestone
    if (gameState.stability >= 1.8 && !this.isMilestoneUnlocked('stability_high')) {
      return {
        id: 'milestone_stability_high',
        type: 'milestone',
        name: 'Supreme Stability',
        description: 'Achieved near-perfect stability! Production surge active.',
        bonus: 1.4,
        duration: 20000,
        unlocked: true
      };
    }

    return null;
  }

  /**
   * Check if milestone already unlocked
   */
  private isMilestoneUnlocked(id: string): boolean {
    return Array.from(this.activePowerPlays.values())
      .some(pp => pp.id === id);
  }

  /**
   * Get active power play bonuses
   */
  getActiveBonuses(): {
    productionBonus: number;
    efficiencyBonus: number;
    resourceBonus: number;
  } {
    let productionBonus = 1.0;
    let efficiencyBonus = 1.0;
    let resourceBonus = 1.0;

    for (const powerPlay of this.activePowerPlays.values()) {
      if (powerPlay.type === 'synergy' || powerPlay.type === 'milestone') {
        productionBonus *= powerPlay.bonus;
      } else if (powerPlay.type === 'combo') {
        efficiencyBonus *= powerPlay.bonus;
      } else if (powerPlay.type === 'perfect_timing') {
        resourceBonus *= powerPlay.bonus;
      }

      // Remove expired power plays
      if (powerPlay.duration !== undefined) {
        // Duration tracking would happen in update loop
      }
    }

    return {
      productionBonus,
      efficiencyBonus,
      resourceBonus
    };
  }

  /**
   * Update power plays (remove expired)
   */
  update(deltaTime: number): void {
    const now = Date.now();
    
    for (const [id, powerPlay] of this.activePowerPlays.entries()) {
      if (powerPlay.duration !== undefined) {
        // Duration tracking would be handled by game loop
        // For now, power plays are tracked until manually removed
      }

      // Reset combo chain if too much time passed
      if (powerPlay.type === 'combo') {
        const timeSinceLast = now - this.lastActionTime;
        if (timeSinceLast > 2000) {
          this.activePowerPlays.delete(id);
        }
      }
    }
  }

  /**
   * Get active power plays for UI
   */
  getActivePowerPlays(): PowerPlay[] {
    return Array.from(this.activePowerPlays.values());
  }

  /**
   * Reset power plays
   */
  reset(): void {
    this.activePowerPlays.clear();
    this.comboChain = [];
    this.perfectTimings = 0;
    this.lastActionTime = 0;
  }
}

