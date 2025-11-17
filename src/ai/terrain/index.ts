/**
 * Terrain-Aware AI System
 * Comprehensive AI agent behavior system with terrain awareness, personality-driven decisions,
 * advanced pathfinding, tactical unit management, adaptation, and learning
 */

export { AIPersonality, TerrainAIPersonalityManager, TerrainAIAgent, TerrainAIPersonalityConfig } from './TerrainAIPersonality';
export { AITileEvaluator, TileEvaluation, Tile, GameState } from './AITileEvaluator';
export { AIPathfinding, Path } from './AIPathfinding';
export { AIUnitController, UnitRole, UnitBehavior, AIUnit, UnitTacticalAction } from './AIUnitController';
export { AIAdaptationManager, GameEventType, GameEvent, StrategyEffectiveness, OpponentPattern, AIAction } from './AIAdaptationManager';
export { AILearningSystem, AIDecision, DecisionSignature } from './AILearningSystem';
export { AIDecisionEngine } from './AIDecisionEngine';

