/**
 * Narrative System Exports
 */

// AI Creative Characters System
export * from './AICreativeCharacters';
export * from './CharacterEvolutionSystem';
export * from './QuaternionCoreNarrative';
export * from './VoiceSynthesisIntegration';

// Legacy narrative systems
export { NarrativeManager } from './NarrativeManager';
export type {
  WorldLore,
  HistoricalEvent,
  WorldImpact,
  Conflict,
  Faction,
  WorldSecret,
  PlayerReputation,
  ReputationEvent,
  PlayerChoice,
  StoryNode,
  StoryChoice
} from './NarrativeManager';

export { LoreGenerator } from './LoreGenerator';
export type { WorldData } from './LoreGenerator';

export { StoryArc, StoryArcType } from './StoryArc';
export type { StoryCondition, StoryReward } from './StoryArc';

export { Character } from './Character';
export type {
  PersonalityMatrix,
  CharacterMemory,
  MemoryType,
  CharacterGoal,
  DialogueTopic,
  DialogueNode,
  DialogueResponse,
  DialogueCondition
} from './Character';
export { CharacterRace, CharacterClass, CharacterMood } from './Character';

export { MysterySystem } from './MysterySystem';
export type {
  Mystery,
  MysteryClue,
  MysteryReward,
  MysteryTemplate
} from './MysterySystem';
export { MysteryDifficulty, ClueType } from './MysterySystem';

export { PlayerDrivenNarrative } from './PlayerDrivenNarrative';
export type {
  PlayerAction,
  PlayerLegacyEvent
} from './PlayerDrivenNarrative';
export { PlayerActionType } from './PlayerDrivenNarrative';

export { EmotionalBeatSystem } from './EmotionalBeatSystem';
export type { EmotionalBeat } from './EmotionalBeatSystem';
export { EmotionalState, EmotionalBeatType } from './EmotionalBeatSystem';

export { WorldStateNarrative } from './WorldStateNarrative';
export type {
  WorldState,
  FactionState,
  WorldStateEvent,
  WarEvent,
  AllianceEvent,
  Battle
} from './WorldStateNarrative';
export { WorldEventType, InterventionType } from './WorldStateNarrative';

export { AIStoryGenerator } from './AIStoryGenerator';
export type {
  NarrativeAxis,
  NarrativeTimeline,
  NarrativeEvent,
  NarrativeContext,
  PlayerPhilosophy,
  ChronicleExport
} from './AIStoryGenerator';

// Enhanced Narrative Systems for Chroma Awards
export { WorldBuilder } from './WorldBuilder';
export type {
  WorldBackstory,
  FactionLore,
  LocationLore,
  ArtifactLore,
  TimelineEvent
} from './WorldBuilder';

export { EnvironmentalStorytelling } from './EnvironmentalStorytelling';
export type {
  EnvironmentalDetail,
  TerrainStory
} from './EnvironmentalStorytelling';

export { EnhancedNarrativeSystem } from './EnhancedNarrativeSystem';
export type {
  NarrativeEvent as EnhancedNarrativeEvent,
  NarrativeChoice,
  NarrativeConsequence,
  FactionDialogue
} from './EnhancedNarrativeSystem';
