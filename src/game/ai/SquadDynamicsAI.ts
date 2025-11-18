/**
 * Squad Dynamics AI System
 * Units form squads with emergent leadership and coordinated tactics
 */

import type { UnitInstance } from '../UnitManager';
import { AdaptiveCombatAI, type CombatTraits } from './AdaptiveCombatAI';

export enum SquadPersonality {
  AGGRESSIVE = 'aggressive',
  METHODICAL = 'methodical',
  ADAPTIVE = 'adaptive',
  DEFENSIVE = 'defensive'
}

export interface SquadMember {
  unitId: string;
  unit: UnitInstance;
  leadershipScore: number;
  combatTraits: CombatTraits;
  role: SquadRole;
}

export enum SquadRole {
  LEADER = 'leader',
  SUPPORT = 'support',
  ASSAULT = 'assault',
  RECON = 'recon',
  MEDIC = 'medic'
}

export interface Squad {
  id: string;
  members: SquadMember[];
  leader: SquadMember | null;
  personality: SquadPersonality;
  formation: SquadFormation;
  currentObjective: SquadObjective | null;
  cohesion: number; // 0-1, how well squad works together
}

export enum SquadFormation {
  LINE = 'line',
  WEDGE = 'wedge',
  CIRCLE = 'circle',
  COLUMN = 'column',
  SCATTER = 'scatter'
}

export interface SquadObjective {
  type: 'attack' | 'defend' | 'patrol' | 'retreat' | 'flank';
  target?: { x: number; y: number };
  targetUnitId?: string;
  priority: number;
}

export class SquadDynamicsAI {
  private squads: Map<string, Squad> = new Map();
  private unitToSquad: Map<string, string> = new Map();
  private combatAI: AdaptiveCombatAI;

  constructor(combatAI: AdaptiveCombatAI) {
    this.combatAI = combatAI;
  }

  /**
   * Create a new squad from units
   */
  createSquad(unitIds: string[], units: Map<string, UnitInstance>): Squad {
    const squadId = `squad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const members: SquadMember[] = unitIds.map(unitId => {
      const unit = units.get(unitId);
      if (!unit) throw new Error(`Unit ${unitId} not found`);

      const traits = this.combatAI.getUnitTraits(unitId) || {
        aggression: 0.5,
        cautious: 0.5,
        tactical: 0.5,
        creative: 0.5
      };

      return {
        unitId,
        unit,
        leadershipScore: this.calculateInitialLeadership(unit, traits),
        combatTraits: traits,
        role: SquadRole.ASSAULT
      };
    });

    // Determine initial leader
    const leader = members.reduce((best, current) =>
      current.leadershipScore > best.leadershipScore ? current : best
    );

    const squad: Squad = {
      id: squadId,
      members,
      leader,
      personality: SquadPersonality.ADAPTIVE,
      formation: SquadFormation.LINE,
      currentObjective: null,
      cohesion: 0.7
    };

    // Assign roles based on unit types and traits
    this.assignSquadRoles(squad);

    // Develop squad personality
    this.developSquadPersonality(squad);

    this.squads.set(squadId, squad);
    
    // Map units to squad
    unitIds.forEach(unitId => {
      this.unitToSquad.set(unitId, squadId);
    });

    return squad;
  }

  /**
   * Update squad dynamics
   */
  updateSquadDynamics(squadId: string, combatSituation: any): void {
    const squad = this.squads.get(squadId);
    if (!squad) return;

    // Update leadership scores based on performance
    this.updateLeadershipScores(squad, combatSituation);

    // Check for leadership transfer
    this.checkLeadershipTransfer(squad);

    // Update squad cohesion
    this.updateSquadCohesion(squad);

    // Update formation based on situation
    this.updateSquadFormation(squad, combatSituation);
  }

  /**
   * Calculate initial leadership score
   */
  private calculateInitialLeadership(unit: UnitInstance, traits: CombatTraits): number {
    let score = 0.5; // Base score

    // Tactical units make better leaders
    score += traits.tactical * 0.3;

    // Healthier units are better leaders
    score += (unit.health / unit.definition.maxHealth) * 0.2;

    // Unit type bonuses
    if (unit.definition.unitType === 'soldier') {
      score += 0.1; // Infantry make good leaders
    }

    return Math.min(1, score);
  }

  /**
   * Update leadership scores based on performance
   */
  private updateLeadershipScores(squad: Squad, combatSituation: any): void {
    squad.members.forEach(member => {
      // Increase leadership if unit performs well
      const performance = this.calculatePerformance(member, combatSituation);
      member.leadershipScore = Math.min(1, member.leadershipScore + performance * 0.1);
    });
  }

  /**
   * Calculate unit performance
   */
  private calculatePerformance(member: SquadMember, combatSituation: any): number {
    // Factors: damage dealt, damage avoided, objectives completed
    // Simplified for now
    return 0.5; // Would calculate from actual combat data
  }

  /**
   * Check for leadership transfer
   */
  private checkLeadershipTransfer(squad: Squad): void {
    if (!squad.leader) return;

    const currentLeaderScore = squad.leader.leadershipScore;
    const bestMember = squad.members.reduce((best, current) =>
      current.leadershipScore > best.leadershipScore ? current : best
    );

    // Transfer leadership if someone is significantly better
    if (bestMember.leadershipScore > currentLeaderScore + 0.2) {
      this.executeLeadershipTransfer(squad, bestMember);
    }
  }

  /**
   * Execute leadership transfer
   */
  private executeLeadershipTransfer(squad: Squad, newLeader: SquadMember): void {
    const oldLeader = squad.leader;
    squad.leader = newLeader;
    
    // Update roles
    if (oldLeader) {
      oldLeader.role = this.determineNewRole(oldLeader);
    }
    newLeader.role = SquadRole.LEADER;

    // Squad cohesion may decrease temporarily
    squad.cohesion = Math.max(0.3, squad.cohesion - 0.2);

    console.log(`Squad ${squad.id}: Leadership transferred from ${oldLeader?.unitId} to ${newLeader.unitId}`);
  }

  /**
   * Determine new role for former leader
   */
  private determineNewRole(member: SquadMember): SquadRole {
    const traits = member.combatTraits;
    
    if (traits.tactical > 0.7) {
      return SquadRole.SUPPORT;
    } else if (traits.aggression > 0.7) {
      return SquadRole.ASSAULT;
    } else {
      return SquadRole.SUPPORT;
    }
  }

  /**
   * Assign roles to squad members
   */
  private assignSquadRoles(squad: Squad): void {
    // Leader is already assigned
    const nonLeaders = squad.members.filter(m => m.role !== SquadRole.LEADER);

    nonLeaders.forEach(member => {
      const traits = member.combatTraits;
      const unitType = member.unit.definition.unitType;

      if (unitType === 'scout') {
        member.role = SquadRole.RECON;
      } else if (traits.aggression > 0.7) {
        member.role = SquadRole.ASSAULT;
      } else if (traits.tactical > 0.6) {
        member.role = SquadRole.SUPPORT;
      } else {
        member.role = SquadRole.ASSAULT;
      }
    });
  }

  /**
   * Develop squad personality
   */
  private developSquadPersonality(squad: Squad): void {
    const aggressiveCount = squad.members.filter(
      m => m.combatTraits.aggression > 0.7
    ).length;

    const tacticalCount = squad.members.filter(
      m => m.combatTraits.tactical > 0.7
    ).length;

    const cautiousCount = squad.members.filter(
      m => m.combatTraits.cautious > 0.7
    ).length;

    if (aggressiveCount > squad.members.length / 2) {
      squad.personality = SquadPersonality.AGGRESSIVE;
      this.developAggressiveTactics(squad);
    } else if (tacticalCount > squad.members.length / 2) {
      squad.personality = SquadPersonality.METHODICAL;
      this.developSystematicTactics(squad);
    } else if (cautiousCount > squad.members.length / 2) {
      squad.personality = SquadPersonality.DEFENSIVE;
      this.developDefensiveTactics(squad);
    } else {
      squad.personality = SquadPersonality.ADAPTIVE;
      this.developFlexibleTactics(squad);
    }
  }

  /**
   * Develop aggressive tactics
   */
  private developAggressiveTactics(squad: Squad): void {
    // Aggressive squads prefer frontal assault, wedge formation
    squad.formation = SquadFormation.WEDGE;
    console.log(`Squad ${squad.id} developed aggressive tactics`);
  }

  /**
   * Develop systematic tactics
   */
  private developSystematicTactics(squad: Squad): void {
    // Methodical squads prefer line formation, coordinated attacks
    squad.formation = SquadFormation.LINE;
    console.log(`Squad ${squad.id} developed systematic tactics`);
  }

  /**
   * Develop defensive tactics
   */
  private developDefensiveTactics(squad: Squad): void {
    // Defensive squads prefer circle formation, holding positions
    squad.formation = SquadFormation.CIRCLE;
    console.log(`Squad ${squad.id} developed defensive tactics`);
  }

  /**
   * Develop flexible tactics
   */
  private developFlexibleTactics(squad: Squad): void {
    // Adaptive squads change formation based on situation
    squad.formation = SquadFormation.LINE;
    console.log(`Squad ${squad.id} developed flexible tactics`);
  }

  /**
   * Update squad cohesion
   */
  private updateSquadCohesion(squad: Squad): void {
    // Cohesion increases when squad works together well
    // Decreases when members are separated or leader changes
    const baseCohesion = 0.7;
    const leaderBonus = squad.leader ? 0.1 : 0;
    const formationBonus = 0.1; // If formation is maintained

    squad.cohesion = Math.min(1, baseCohesion + leaderBonus + formationBonus);
  }

  /**
   * Update squad formation based on situation
   */
  private updateSquadFormation(squad: Squad, combatSituation: any): void {
    if (squad.personality === SquadPersonality.ADAPTIVE) {
      // Adaptive squads change formation
      if (combatSituation.enemyCount > squad.members.length) {
        squad.formation = SquadFormation.CIRCLE; // Defensive
      } else if (combatSituation.terrainAdvantage > 0.7) {
        squad.formation = SquadFormation.WEDGE; // Aggressive
      } else {
        squad.formation = SquadFormation.LINE; // Balanced
      }
    }
  }

  /**
   * Get squad for unit
   */
  getSquadForUnit(unitId: string): Squad | null {
    const squadId = this.unitToSquad.get(unitId);
    if (!squadId) return null;
    return this.squads.get(squadId) || null;
  }

  /**
   * Get all squads
   */
  getAllSquads(): Squad[] {
    return Array.from(this.squads.values());
  }

  /**
   * Set squad objective
   */
  setSquadObjective(squadId: string, objective: SquadObjective): void {
    const squad = this.squads.get(squadId);
    if (squad) {
      squad.currentObjective = objective;
    }
  }
}

