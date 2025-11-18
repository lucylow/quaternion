/**
 * Player Experience Modeling & Adaptive Difficulty
 * 
 * Comprehensive system for modeling player experience and adapting difficulty
 * to maintain optimal flow state and engagement.
 */

export * from './PlayerExperienceModel';
export * from './FlowStateCalculator';
export * from './EmotionRecognition';
export * from './AdaptiveDifficultyAgent';
export * from './StealthAdaptation';

export { 
  PlayerExperienceModel,
  type PlayerModel,
  type SkillMetrics,
  type BehavioralPatterns,
  type EmotionalState,
  type GameplayData
} from './PlayerExperienceModel';

export {
  FlowStateCalculator,
  FlowState,
  type FlowChannel
} from './FlowStateCalculator';

export {
  EmotionRecognition,
  type EmotionInferenceResult
} from './EmotionRecognition';

export {
  AdaptiveDifficultyAgent,
  type DifficultyAction,
  type AdaptationState,
  type AdaptationReward
} from './AdaptiveDifficultyAgent';

export {
  StealthAdaptation,
  type StealthAdjustment,
  type ResourceBalance,
  type EnemyBehavior
} from './StealthAdaptation';

