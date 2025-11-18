/**
 * AI Creative Gameplay Systems
 * Exports all creative AI gameplay components
 */

export { EmergentDiplomacyAI } from './EmergentDiplomacyAI';
export type {
  AIFaction,
  Alliance,
  BetrayalOpportunity
} from './EmergentDiplomacyAI';

export { LivingWorldEvents } from './LivingWorldEvents';
export type {
  WorldEvent,
  EventTrigger,
  EventEffect,
  FactionTrait
} from './LivingWorldEvents';

export { ProceduralPuzzleGenerator } from './ProceduralPuzzleGenerator';
export type {
  TerrainPuzzle,
  TerrainLayout,
  PuzzleTile,
  StrategicPoint,
  PuzzleReward,
  PlayerSkillProfile
} from './ProceduralPuzzleGenerator';

export { AIDungeonMaster } from './AIDungeonMaster';
export type {
  DramaticArc,
  ArcTrigger,
  DynamicTile,
  HeroicMoment
} from './AIDungeonMaster';

export { AlternativeVictoryConditions } from './AlternativeVictoryConditions';
export type {
  VictoryConditionType,
  VictoryCondition,
  EcologicalVictoryData,
  CulturalVictoryData,
  TechnologicalVictoryData,
  DiplomaticVictoryData
} from './AlternativeVictoryConditions';

export { SymbioticGameplay } from './SymbioticGameplay';
export type {
  AIOffer,
  CooperativePower
} from './SymbioticGameplay';

export { AdaptiveLearningAI } from './AdaptiveLearningAI';
export type {
  PlayerStyleProfile,
  PlayHistoryEntry,
  AIApprentice
} from './AdaptiveLearningAI';

export { DynamicTechTree } from './DynamicTechTree';
export type {
  TerrainInfluencedTech,
  TechRequirement
} from './DynamicTechTree';
