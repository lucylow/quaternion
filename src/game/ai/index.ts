/**
 * AI Systems Exports
 * Advanced AI systems for adaptive gameplay
 */

export { AdaptiveCombatAI } from './AdaptiveCombatAI';
export type {
  CombatTraits,
  PlayerBehaviorProfile,
  CombatSituation,
  CombatDecision
} from './AdaptiveCombatAI';

export { SquadDynamicsAI } from './SquadDynamicsAI';
export type {
  Squad,
  SquadMember,
  SquadObjective,
  SquadPersonality,
  SquadRole,
  SquadFormation
} from './SquadDynamicsAI';

export { AdaptiveDifficultyAI } from './AdaptiveDifficultyAI';
export type {
  PlayerSkillProfile,
  ChallengeAdjustments
} from './AdaptiveDifficultyAI';

export { WorldEventGenerator } from './WorldEventGenerator';
export type {
  WorldEvent,
  MysteryEvent,
  MysteryType,
  EventType,
  PlayerStatus,
  PlayerPlaystyle
} from './WorldEventGenerator';

export { AIDirector } from './AIDirector';
export type {
  PlayerState,
  PlayerActivity,
  DramaticEncounter
} from './AIDirector';

