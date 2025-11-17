/**
 * AI Agents System - Main Export
 * Centralized exports for all AI agent components
 */

// Base classes and interfaces
export * from './AgentBase';

// Specialized agents
export { EconomicAgent } from './EconomicAgent';
export { MilitaryAgent } from './MilitaryAgent';
export { ResearchAgent } from './ResearchAgent';
export { ScoutingAgent } from './ScoutingAgent';

// Coordination system
export { AIControllerCoordinator, StrategicDecision } from './AIControllerCoordinator';

// Unit-level agents
export { UnitAgent, UnitPersonality, UnitRole, SensorData, BehaviorType } from './UnitAgent';

// Safety and validation
export { LLMSafetyManager, HeuristicFallback, ValidationType, LLMResponse } from './LLMSafetyManager';

