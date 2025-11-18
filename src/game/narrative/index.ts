/**
 * Narrative System Exports
 */

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
