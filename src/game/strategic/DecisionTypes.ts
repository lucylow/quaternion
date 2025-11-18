/**
 * Decision Types and Interfaces for Strategic Decision-Making System
 */

export enum DecisionType {
  // Tactical Decisions (Immediate)
  TACTICAL_DEFENSE = 'tactical_defense',
  TACTICAL_ATTACK = 'tactical_attack',
  TACTICAL_RETREAT = 'tactical_retreat',
  TACTICAL_OVERCLOCK = 'tactical_overclock',
  TACTICAL_SHIELD = 'tactical_shield',
  
  // Operational Decisions (Mid-term)
  OPERATIONAL_EXPANSION = 'operational_expansion',
  OPERATIONAL_ECONOMY = 'operational_economy',
  OPERATIONAL_MILITARY = 'operational_military',
  OPERATIONAL_TECH = 'operational_tech',
  
  // Strategic Decisions (Meta)
  STRATEGIC_INDUSTRIAL = 'strategic_industrial',
  STRATEGIC_ECOLOGICAL = 'strategic_ecological',
  STRATEGIC_TECHNOLOGICAL = 'strategic_technological',
  STRATEGIC_BALANCE = 'strategic_balance',
  
  // Ethical Decisions
  ETHICAL_EXPLOIT = 'ethical_exploit',
  ETHICAL_PRESERVE = 'ethical_preserve',
  ETHICAL_TRADE = 'ethical_trade',
  ETHICAL_REFUSE = 'ethical_refuse',
  
  // Resource Management
  RESOURCE_CONVERT = 'resource_convert',
  RESOURCE_GATHER = 'resource_gather',
  RESOURCE_ALLOCATE = 'resource_allocate',
  
  // Building/Construction
  BUILD_REFINERY = 'build_refinery',
  BUILD_REACTOR = 'build_reactor',
  BUILD_LAB = 'build_lab',
  BUILD_DEFENSE = 'build_defense',
  
  // Research
  RESEARCH_OVERCLOCK = 'research_overclock',
  RESEARCH_EFFICIENCY = 'research_efficiency',
  RESEARCH_MILITARY = 'research_military',
  RESEARCH_ECOLOGY = 'research_ecology'
}

export enum DecisionLayer {
  TACTICAL = 'tactical',      // Immediate unit commands, combat reactions
  OPERATIONAL = 'operational', // Resource allocation, tech sequencing, expansion timing  
  STRATEGIC = 'strategic',     // Victory condition pursuit, faction relationships
  ETHICAL = 'ethical'          // Moral choices, philosophical alignment
}

export interface DecisionCost {
  ore?: number;
  energy?: number;
  biomass?: number;
  data?: number;
}

export interface DecisionEffect {
  oreChange?: number;
  energyChange?: number;
  biomassChange?: number;
  dataChange?: number;
  stabilityChange?: number;
  entropyChange?: number;
  techUnlocks?: number;
  defenseBonus?: number;
  movementPenalty?: number;
  industrialProgress?: number;
  ecologicalProgress?: number;
  technologicalProgress?: number;
  balancedProgress?: number;
}

export interface DecisionRequirement {
  type: 'resource' | 'tech' | 'building' | 'unit' | 'territory';
  value: string | number;
  operator?: '>=' | '<=' | '==' | '!=';
}

export interface StrategicDecision {
  decisionID: string;
  type: DecisionType;
  layer: DecisionLayer;
  description: string;
  cost: DecisionCost;
  immediateEffect: DecisionEffect;
  longTermEffect?: DecisionEffect;
  requirements: DecisionRequirement[];
  utilityScore: number;          // AI-calculated value
  playerPreference: number;      // Player history-weighted (0-1)
  riskLevel: number;             // 0-1 risk assessment
  priority: number;               // 0-1 priority level
  
  // Execution context
  worldPosition?: { x: number; y: number };
  targetObject?: string;
  executingFaction?: number;
  
  // Temporal properties
  executionTime?: number;        // Estimated time to execute
  cooldown?: number;             // Cooldown after execution
  duration?: number;              // Duration of effect
}

export interface DecisionConflict {
  decisionA: StrategicDecision;
  decisionB: StrategicDecision;
  conflictType: 'resource' | 'strategic' | 'temporal' | 'territorial';
  severity: number; // 0-1
}

export interface DecisionImpact {
  decisionID: string;
  executedAt: number;
  immediateResult: DecisionEffect;
  longTermResult?: DecisionEffect;
  actualCost: DecisionCost;
  success: boolean;
}


