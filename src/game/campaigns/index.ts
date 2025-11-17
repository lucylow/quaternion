/**
 * Campaign System Exports
 */

export { CampaignSystem } from './CampaignSystem';
export type {
  CampaignConfig,
  CampaignAct,
  CampaignBeat,
  CampaignChoice,
  CampaignCharacter,
  CampaignState,
  NarrativeEvent
} from './CampaignSystem';

export { NarrativeEventSystem } from './NarrativeEventSystem';
export type { NarrativeEventInput } from './NarrativeEventSystem';

export { VoiceLineManager } from './VoiceLineManager';
export type { VoiceLine } from './VoiceLineManager';

export { CampaignSeedManager } from './CampaignSeedManager';
export type { CampaignSeed } from './CampaignSeedManager';

export { getEpilogue, EPILOGUE_DATA } from './EpilogueData';
export type { EpilogueData } from './EpilogueData';

