/**
 * Unit Agent - Advanced utility system for individual unit decision making
 * Enhanced version with personality-driven behaviors
 */

import { SeededRandom } from '../../lib/SeededRandom';

export interface UnitPersonality {
  aggression: number; // 0-1
  courage: number; // 0-1
  discipline: number; // 0-1
  independence: number; // 0-1
  preferredRole: UnitRole;
  roleAdherence: number; // 0-1
  personalityDescription?: string;
  combatStyle?: string;
}

export enum UnitRole {
  ASSAULT = 'assault',
  SUPPORT = 'support',
  RECON = 'recon',
  DEFENSE = 'defense',
  SPECIALIST = 'specialist'
}

export interface SensorData {
  visibleEnemies: Array<{
    unit: any;
    position: { x: number; y: number };
    threatLevel: number;
    lastSeenTime: number;
  }>;
  visibleAllies: Array<{
    unit: any;
    position: { x: number; y: number };
  }>;
  visibleStructures: Array<{
    structure: any;
    position: { x: number; y: number };
  }>;
  audibleEvents: Array<{
    type: string;
    position: { x: number; y: number };
    intensity: number;
  }>;
  terrainFeatures: Array<{
    type: string;
    position: { x: number; y: number };
  }>;
  coverPositions: Array<{ x: number; y: number }>;
  immediateThreats: Array<{
    threat: any;
    dangerLevel: number;
    distance: number;
  }>;
  potentialThreats: Array<{
    threat: any;
    dangerLevel: number;
    distance: number;
  }>;
}

export interface BehaviorEvaluation {
  behavior: UnitBehavior;
  score: number;
  reasoning: string;
}

export abstract class UnitBehavior {
  protected agent: UnitAgent;
  protected behaviorName: string;
  protected basePriority: number;

  constructor(agent: UnitAgent) {
    this.agent = agent;
  }

  abstract getBehaviorType(): BehaviorType;
  abstract evaluate(sensorData: SensorData): number;
  abstract execute(sensorData: SensorData): any;
  
  onEnter(): void {}
  onExit(): void {}
  
  getPersonalityMultiplier(personality: UnitPersonality): number {
    return 1.0;
  }
  
  getEvaluationReasoning(): string {
    return `${this.behaviorName}: Base priority ${this.basePriority}`;
  }
  
  applyPersonality(personality: UnitPersonality): void {}
}

export enum BehaviorType {
  COMBAT = 'combat',
  MOVEMENT = 'movement',
  SURVIVAL = 'survival',
  ABILITY = 'ability',
  COMMUNICATION = 'communication'
}

export class UnitAgent {
  public unitId: string;
  public unitType: string;
  public personality: UnitPersonality;
  public health: number;
  public maxHealth: number;
  public position: { x: number; y: number };
  
  private memory: Array<{ sensorData: SensorData; action: any; outcome: number }> = [];
  private maxMemorySize: number = 20;
  private currentBehavior: UnitBehavior | null = null;
  private availableBehaviors: UnitBehavior[] = [];
  private rng: SeededRandom;
  private decisionInterval: number = 30; // 0.5 seconds at 60 tps
  private lastDecisionTick: number = 0;

  constructor(
    unitId: string,
    unitType: string,
    personality: UnitPersonality,
    seed: number,
    position: { x: number; y: number },
    health: number = 100,
    maxHealth: number = 100
  ) {
    this.unitId = unitId;
    this.unitType = unitType;
    this.personality = personality;
    this.health = health;
    this.maxHealth = maxHealth;
    this.position = position;
    this.rng = new SeededRandom(seed);
    
    this.initializeBehaviors();
  }

  /**
   * Main decision loop
   */
  public update(gameState: any, currentTick: number): any | null {
    if (currentTick - this.lastDecisionTick < this.decisionInterval) {
      return null;
    }

    this.lastDecisionTick = currentTick;

    // Update sensor data
    const sensorData = this.updateSensing(gameState);
    this.memory.push({ sensorData, action: null, outcome: 0 });
    if (this.memory.length > this.maxMemorySize) {
      this.memory.shift();
    }

    // Evaluate all possible behaviors
    const bestBehavior = this.evaluateBehaviors(sensorData);

    // Execute best behavior
    if (bestBehavior.behavior !== this.currentBehavior) {
      this.currentBehavior?.onExit();
      this.currentBehavior = bestBehavior.behavior;
      this.currentBehavior.onEnter();
    }

    return this.currentBehavior.execute(sensorData);
  }

  private initializeBehaviors(): void {
    this.availableBehaviors = [
      new CombatBehavior(this),
      new MovementBehavior(this),
      new SurvivalBehavior(this),
      new AbilityBehavior(this),
      new CommunicationBehavior(this)
    ];

    // Apply personality to behaviors
    this.availableBehaviors.forEach(behavior => {
      behavior.applyPersonality(this.personality);
    });
  }

  private updateSensing(gameState: any): SensorData {
    // Simplified sensor update - would use actual game state
    const visibleEnemies: SensorData['visibleEnemies'] = [];
    const visibleAllies: SensorData['visibleAllies'] = [];
    const visibleStructures: SensorData['visibleStructures'] = [];
    
    // Mock data - would come from actual game state
    if (gameState && gameState.units) {
      gameState.units.forEach((unit: any) => {
        if (unit.playerId !== this.unitId) {
          visibleEnemies.push({
            unit,
            position: { x: unit.x || 0, y: unit.y || 0 },
            threatLevel: 0.5,
            lastSeenTime: Date.now()
          });
        } else {
          visibleAllies.push({
            unit,
            position: { x: unit.x || 0, y: unit.y || 0 }
          });
        }
      });
    }

    return {
      visibleEnemies,
      visibleAllies,
      visibleStructures,
      audibleEvents: [],
      terrainFeatures: [],
      coverPositions: [],
      immediateThreats: visibleEnemies.map(e => ({
        threat: e.unit,
        dangerLevel: e.threatLevel,
        distance: this.calculateDistance(this.position, e.position)
      })),
      potentialThreats: []
    };
  }

  private evaluateBehaviors(sensorData: SensorData): BehaviorEvaluation {
    let bestEvaluation: BehaviorEvaluation = {
      behavior: this.availableBehaviors[0],
      score: -Infinity,
      reasoning: ''
    };

    for (const behavior of this.availableBehaviors) {
      let score = behavior.evaluate(sensorData);
      
      // Apply personality modifiers
      score *= behavior.getPersonalityMultiplier(this.personality);
      
      // Add small randomness for variety
      score += this.rng.nextFloat(-0.05, 0.05);
      
      if (score > bestEvaluation.score) {
        bestEvaluation = {
          behavior,
          score,
          reasoning: behavior.getEvaluationReasoning()
        };
      }
    }

    return bestEvaluation;
  }

  public calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Action methods (to be implemented based on game engine)
  public attack(target: any): any {
    return { type: 'attack', target: target.id || target };
  }

  public moveTo(position: { x: number; y: number }): any {
    return { type: 'move', position };
  }

  public requestSupport(reason: string): any {
    return { type: 'request_support', reason };
  }
}

// Behavior Implementations

class CombatBehavior extends UnitBehavior {
  private aggressionMultiplier: number = 1.0;
  private combatStyle: 'aggressive' | 'strategic' | 'support' = 'strategic';

  constructor(agent: UnitAgent) {
    super(agent);
    this.behaviorName = 'Combat';
    this.basePriority = 0.7;
  }

  getBehaviorType(): BehaviorType {
    return BehaviorType.COMBAT;
  }

  evaluate(sensorData: SensorData): number {
    if (sensorData.visibleEnemies.length === 0) {
      return 0.0;
    }

    let score = this.basePriority;

    // Threat-based scoring
    const totalThreat = sensorData.visibleEnemies.reduce((sum, e) => sum + e.threatLevel, 0);
    score += totalThreat * 0.3;

    // Health consideration
    const healthRatio = this.agent.health / this.agent.maxHealth;
    score *= healthRatio;

    // Distance to nearest enemy
    if (sensorData.visibleEnemies.length > 0) {
      const nearest = sensorData.visibleEnemies.reduce((nearest, enemy) => {
        const dist1 = this.agent.calculateDistance(this.agent.position, nearest.position);
        const dist2 = this.agent.calculateDistance(this.agent.position, enemy.position);
        return dist2 < dist1 ? enemy : nearest;
      });
      const distance = this.agent.calculateDistance(this.agent.position, nearest.position);
      score += (1 - Math.min(distance / 20, 1)) * 0.4;
    }

    // Apply aggression multiplier
    score *= this.aggressionMultiplier;

    return Math.max(0, Math.min(1, score));
  }

  execute(sensorData: SensorData): any {
    if (sensorData.visibleEnemies.length === 0) {
      return null;
    }

    // Select target based on combat style
    const target = this.selectTarget(sensorData.visibleEnemies);

    if (target) {
      // Use cover if available and health is low
      if (this.agent.health < this.agent.maxHealth * 0.3 && sensorData.coverPositions.length > 0) {
        const coverPosition = sensorData.coverPositions[0];
        this.agent.moveTo(coverPosition);
      }

      return this.agent.attack(target.unit);
    }

    return null;
  }

  private selectTarget(enemies: SensorData['visibleEnemies']): SensorData['visibleEnemies'][0] | null {
    if (enemies.length === 0) return null;

    switch (this.combatStyle) {
      case 'aggressive':
        // Target highest threat
        return enemies.reduce((max, e) => e.threatLevel > max.threatLevel ? e : max, enemies[0]);
      case 'strategic':
        // Target weakest (simplified - would check actual health)
        return enemies[0];
      case 'support':
        // Target support units first (simplified)
        return enemies[0];
      default:
        return enemies[0];
    }
  }

  getPersonalityMultiplier(personality: UnitPersonality): number {
    return personality.aggression;
  }

  applyPersonality(personality: UnitPersonality): void {
    this.aggressionMultiplier = personality.aggression;
    
    if (personality.aggression > 0.8) {
      this.combatStyle = 'aggressive';
    } else if (personality.discipline > 0.7) {
      this.combatStyle = 'strategic';
    } else {
      this.combatStyle = 'support';
    }
  }
}

class MovementBehavior extends UnitBehavior {
  constructor(agent: UnitAgent) {
    super(agent);
    this.behaviorName = 'Movement';
    this.basePriority = 0.4;
  }

  getBehaviorType(): BehaviorType {
    return BehaviorType.MOVEMENT;
  }

  evaluate(sensorData: SensorData): number {
    // Movement is fallback when no combat or survival needs
    if (sensorData.visibleEnemies.length > 0) {
      return 0.2; // Lower priority if enemies present
    }

    return this.basePriority;
  }

  execute(sensorData: SensorData): any {
    // Would move toward objective or follow squad orders
    return { type: 'move', position: { x: this.agent.position.x + 10, y: this.agent.position.y } };
  }
}

class SurvivalBehavior extends UnitBehavior {
  private selfPreservationMultiplier: number = 1.0;

  constructor(agent: UnitAgent) {
    super(agent);
    this.behaviorName = 'Survival';
    this.basePriority = 0.3;
  }

  getBehaviorType(): BehaviorType {
    return BehaviorType.SURVIVAL;
  }

  evaluate(sensorData: SensorData): number {
    let score = 0.0;

    // Health-based urgency
    const healthRatio = this.agent.health / this.agent.maxHealth;
    if (healthRatio < 0.3) {
      score += (1 - healthRatio) * 0.8;
    }

    // Threat-based urgency
    if (sensorData.immediateThreats.length > 0) {
      const avgThreat = sensorData.immediateThreats.reduce((sum, t) => sum + t.dangerLevel, 0) / sensorData.immediateThreats.length;
      score += avgThreat * 0.6;
    }

    // Apply self-preservation multiplier
    score *= this.selfPreservationMultiplier;

    return Math.max(0, Math.min(1, score));
  }

  execute(sensorData: SensorData): any {
    if (this.agent.health < this.agent.maxHealth * 0.3) {
      // Find safe retreat position
      const retreatPosition = this.findRetreatPosition(sensorData);
      this.agent.moveTo(retreatPosition);
      this.agent.requestSupport('LowHealthRetreat');
      return { type: 'retreat', position: retreatPosition };
    }

    return null;
  }

  private findRetreatPosition(sensorData: SensorData): { x: number; y: number } {
    // Move away from nearest threat
    if (sensorData.immediateThreats.length > 0) {
      const nearestThreat = sensorData.immediateThreats.reduce((nearest, threat) => 
        threat.distance < nearest.distance ? threat : nearest
      );
      
      const dx = this.agent.position.x - nearestThreat.threat.x;
      const dy = this.agent.position.y - nearestThreat.threat.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        return {
          x: this.agent.position.x + (dx / distance) * 20,
          y: this.agent.position.y + (dy / distance) * 20
        };
      }
    }

    return { x: this.agent.position.x - 20, y: this.agent.position.y - 20 };
  }

  getPersonalityMultiplier(personality: UnitPersonality): number {
    return 1.0 - personality.courage; // Higher courage = less self-preservation
  }

  applyPersonality(personality: UnitPersonality): void {
    this.selfPreservationMultiplier = 1.0 - personality.courage;
  }
}

class AbilityBehavior extends UnitBehavior {
  constructor(agent: UnitAgent) {
    super(agent);
    this.behaviorName = 'Ability';
    this.basePriority = 0.5;
  }

  getBehaviorType(): BehaviorType {
    return BehaviorType.ABILITY;
  }

  evaluate(sensorData: SensorData): number {
    // Would check if unit has abilities and if they're ready
    return 0.3;
  }

  execute(sensorData: SensorData): any {
    return { type: 'ability' };
  }
}

class CommunicationBehavior extends UnitBehavior {
  constructor(agent: UnitAgent) {
    super(agent);
    this.behaviorName = 'Communication';
    this.basePriority = 0.2;
  }

  getBehaviorType(): BehaviorType {
    return BehaviorType.COMMUNICATION;
  }

  evaluate(sensorData: SensorData): number {
    // Communication is low priority but always available
    return this.basePriority;
  }

  execute(sensorData: SensorData): any {
    return { type: 'communicate' };
  }
}

