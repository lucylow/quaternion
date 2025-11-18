/**
 * Terrain-Aware AI System
 * Comprehensive AI agent behavior system with terrain awareness, personality-driven decisions,
 * advanced pathfinding, tactical unit management, adaptation, and learning
 */

export { AIPersonality, TerrainAIPersonalityManager, TerrainAIAgent } from './TerrainAIPersonality';
export type { type TerrainAIPersonalityConfig } from './TerrainAIPersonality';
export { AITileEvaluator } from './AITileEvaluator';
export type { TileEvaluation, Tile, GameState } from './AITileEvaluator';
export { AIPathfinding } from './AIPathfinding';
export type { Path } from './AIPathfinding';
export { AIUnitController } from './AIUnitController';
export type { UnitRole, UnitBehavior, AIUnit, UnitTacticalAction } from './AIUnitController';
export { AIAdaptationManager } from './AIAdaptationManager';
export type { GameEventType, GameEvent, StrategyEffectiveness, OpponentPattern, AIAction } from './AIAdaptationManager';
export { AILearningSystem } from './AILearningSystem';
export type { AIDecision, DecisionSignature } from './AILearningSystem';
export { AIDecisionEngine } from './AIDecisionEngine';

