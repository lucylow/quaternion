/**
 * Enhanced AI Opponents - Export hub
 * All AI opponent systems and components
 */

// Core systems
export { AIPersonalityMatrix } from './AIPersonalityMatrix';
export type { PersonalityTraits } from './AIPersonalityMatrix';
export { AICommanderArchetypes } from './AICommanderArchetypes';
export type { CommanderProfile, CommanderArchetype } from './AICommanderArchetypes';
export { AIStrategyLearner } from './AIStrategyLearner';

// Psychological warfare
export { DeceptionAI } from './DeceptionAI';
export type { DeceptionTactic, DeceptionPlan } from './DeceptionAI';
export { EmotionalManipulator } from './EmotionalManipulator';
export type { PlayerEmotion, Taunt } from './EmotionalManipulator';

// Specialized AI types
export { AsymmetricAI } from './AsymmetricAI';
export type { AlienSpecies, AlienThoughtPattern } from './AsymmetricAI';
export { EvolvingAI } from './EvolvingAI';
export type { EvolutionStage, EvolutionStageConfig } from './EvolvingAI';
export { AITeamCoordinator } from './AITeamCoordinator';
export type { TeamRole, TeamStrategy, AITeamMember, TeamPlan } from './AITeamCoordinator';
export { EnvironmentalStrategist } from './EnvironmentalStrategist';
export type { TerrainExploitation, EnvironmentalTrap } from './EnvironmentalStrategist';
export { PersistentAI } from './PersistentAI';
export type { EncounterData, PlayerTendency } from './PersistentAI';
export { ChaoticAI } from './ChaoticAI';
export type { ChaoticDecision } from './ChaoticAI';
export { QuirkyAI } from './QuirkyAI';
export type { Quirk, QuirkProfile } from './QuirkyAI';

// Main integration
export { EnhancedAIOpponent } from './EnhancedAIOpponent';
export type { EnhancedAIOpponentConfig, AIDecision } from './EnhancedAIOpponent';

