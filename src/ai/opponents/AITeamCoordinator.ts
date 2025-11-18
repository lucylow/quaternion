/**
 * AI Team Coordinator - Cooperative AI opponents
 * Coordinates multiple AI commanders working together
 */

import { CommanderProfile } from './AICommanderArchetypes';
import { SeededRandom } from '../../lib/SeededRandom';

export type TeamRole = 
  | 'attacker'
  | 'defender'
  | 'tech_specialist'
  | 'economist'
  | 'scout'
  | 'support';

export type TeamStrategy = 
  | 'aggressive'
  | 'defensive'
  | 'economic'
  | 'balanced'
  | 'rush'
  | 'turtle';

export interface AITeamMember {
  commander: CommanderProfile;
  role: TeamRole;
  assignedTarget?: { x: number; y: number };
  currentTask?: string;
}

export interface TeamPlan {
  strategy: TeamStrategy;
  roles: Map<string, TeamRole>;
  coordination: {
    attackPlan?: {
      attackers: string[];
      support: string[];
      timing: number;
    };
    defensePlan?: {
      defenders: string[];
      locations: Array<{ x: number; y: number }>;
    };
    economicPlan?: {
      economists: string[];
      focus: string;
    };
  };
}

export class AITeamCoordinator {
  private commanders: AITeamMember[];
  private teamStrategy: TeamStrategy;
  private communicationNetwork: Map<string, any>; // Would implement actual communication
  private rng: SeededRandom;
  private coordinationHistory: Array<{
    timestamp: number;
    action: string;
    participants: string[];
    success: boolean;
  }>;

  constructor(seed: number, commanders: CommanderProfile[]) {
    this.rng = new SeededRandom(seed);
    this.commanders = commanders.map(cmd => ({
      commander: cmd,
      role: 'support' // Will be assigned
    }));
    this.teamStrategy = 'balanced';
    this.communicationNetwork = new Map();
    this.coordinationHistory = [];

    // Assign roles based on commander personalities
    this.assignRoles();
  }

  /**
   * Assign specialized roles based on commander personalities
   */
  private assignRoles(): void {
    const rolesAssigned = new Set<string>();
    let rolesAssignedCount = 0;

    // Assign based on personality traits
    for (const member of this.commanders) {
      const traits = member.commander.traits;
      
      if (traits.aggression > 0.8 && !rolesAssigned.has('attacker')) {
        member.role = 'attacker';
        rolesAssigned.add('attacker');
        rolesAssignedCount++;
      } else if (traits.caution > 0.8 && !rolesAssigned.has('defender')) {
        member.role = 'defender';
        rolesAssigned.add('defender');
        rolesAssignedCount++;
      } else if (traits.innovation > 0.8 && !rolesAssigned.has('tech_specialist')) {
        member.role = 'tech_specialist';
        rolesAssigned.add('tech_specialist');
        rolesAssignedCount++;
      } else if (traits.aggression < 0.3 && !rolesAssigned.has('economist')) {
        member.role = 'economist';
        rolesAssigned.add('economist');
        rolesAssignedCount++;
      }
    }

    // Fill remaining roles
    const remaining = this.commanders.length - rolesAssignedCount;
    const availableRoles: TeamRole[] = ['scout', 'support', 'attacker', 'defender'];
    let roleIndex = 0;

    for (const member of this.commanders) {
      if (member.role === 'support') {
        member.role = availableRoles[roleIndex % availableRoles.length];
        roleIndex++;
      }
    }
  }

  /**
   * Coordinate team attack
   */
  public coordinateAttack(target: { x: number; y: number }): TeamPlan {
    const attackers = this.commanders.filter(m => m.role === 'attacker');
    const techSpecialists = this.commanders.filter(m => m.role === 'tech_specialist');
    const support = this.commanders.filter(m => m.role === 'support');

    // Assign targets
    attackers.forEach(attacker => {
      attacker.assignedTarget = target;
      attacker.currentTask = 'attack';
    });

    // Tech specialists provide support
    techSpecialists.forEach(specialist => {
      specialist.assignedTarget = target;
      specialist.currentTask = 'support_attack';
    });

    // Coordinate defense while attacking
    this.coordinateDefense();

    return {
      strategy: 'aggressive',
      roles: new Map(this.commanders.map(m => [m.commander.archetype, m.role])),
      coordination: {
        attackPlan: {
          attackers: attackers.map(a => a.commander.archetype),
          support: techSpecialists.map(s => s.commander.archetype),
          timing: Date.now() + 5000 // 5 seconds
        }
      }
    };
  }

  /**
   * Coordinate defense
   */
  private coordinateDefense(): void {
    const defenders = this.commanders.filter(m => m.role === 'defender');
    const economists = this.commanders.filter(m => m.role === 'economist');

    // Identify critical locations (simplified)
    const keyLocations = this.identifyCriticalLocations();

    // Assign defenders to locations
    defenders.forEach((defender, index) => {
      if (index < keyLocations.length) {
        defender.assignedTarget = keyLocations[index];
        defender.currentTask = 'defend';
      }
    });

    // Economists focus on resource protection
    economists.forEach(economist => {
      economist.currentTask = 'secure_economy';
    });
  }

  /**
   * Identify critical locations to defend
   */
  private identifyCriticalLocations(): Array<{ x: number; y: number }> {
    // Simplified - would analyze actual map
    return [
      { x: 100, y: 100 },
      { x: 500, y: 500 },
      { x: 900, y: 900 }
    ];
  }

  /**
   * Update team strategy based on game state
   */
  public updateTeamStrategy(gameState: any): void {
    const resourceAdvantage = gameState.resourceAdvantage || 0;
    const militaryAdvantage = gameState.militaryAdvantage || 0;
    const threatLevel = gameState.threatLevel || 0;

    if (threatLevel > 0.7) {
      this.teamStrategy = 'defensive';
    } else if (militaryAdvantage > 0.3 && resourceAdvantage > 0.2) {
      this.teamStrategy = 'aggressive';
    } else if (resourceAdvantage < -0.2) {
      this.teamStrategy = 'economic';
    } else {
      this.teamStrategy = 'balanced';
    }
  }

  /**
   * Get team members by role
   */
  public getTeamMembersByRole(role: TeamRole): AITeamMember[] {
    return this.commanders.filter(m => m.role === role);
  }

  /**
   * Get current team strategy
   */
  public getTeamStrategy(): TeamStrategy {
    return this.teamStrategy;
  }

  /**
   * Record coordination outcome
   */
  public recordCoordinationOutcome(action: string, participants: string[], success: boolean): void {
    this.coordinationHistory.push({
      timestamp: Date.now(),
      action,
      participants,
      success
    });
  }

  /**
   * Get coordination history
   */
  public getCoordinationHistory(): typeof this.coordinationHistory {
    return [...this.coordinationHistory];
  }
}

