/**
 * Campaign System for Quaternion
 * Manages narrative campaigns, choices, and story progression
 */

export interface CampaignConfig {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number; // minutes
  acts: CampaignAct[];
  characters: CampaignCharacter[];
  seed?: number;
}

export interface CampaignAct {
  id: string;
  name: string;
  duration: number; // seconds
  beats: CampaignBeat[];
  objectives: string[];
}

export interface CampaignBeat {
  id: string;
  type: 'choice' | 'combat' | 'discovery' | 'narrative' | 'environmental';
  trigger: string;
  prompt?: string; // LLM prompt template
  choices?: CampaignChoice[];
  effects?: Record<string, any>;
}

export interface CampaignChoice {
  id: string;
  label: string;
  description: string;
  effects: Record<string, any>;
  narrativeTag?: string;
}

export interface CampaignCharacter {
  id: string;
  name: string;
  role: string;
  voiceId?: string;
  personality: string;
}

export interface NarrativeEvent {
  event: string;
  trigger: string;
  flavor: string;
  effect: Record<string, any>;
  narrativeTag?: string;
}

export interface CampaignState {
  campaignId: string;
  actIndex: number;
  beatIndex: number;
  choices: Map<string, string>; // choiceId -> selected option
  narrativeTags: Set<string>;
  resources: Record<string, number>;
  bioSeedHealth?: number;
  playerReputation?: number;
  time: number;
  seed: number;
}

export class CampaignSystem {
  private campaigns: Map<string, CampaignConfig> = new Map();
  private currentState: CampaignState | null = null;
  private narrativeEvents: NarrativeEvent[] = [];

  constructor() {
    this.initializeCampaigns();
  }

  /**
   * Initialize all campaign configurations
   */
  private initializeCampaigns() {
    // The Archive Campaign
    this.campaigns.set('archive', {
      id: 'archive',
      name: 'The Archive',
      description: 'An ancient archive contains sleeping Bio-Seeds. Harvest for resources or preserve for the future?',
      estimatedDuration: 12,
      seed: 913027,
      acts: [
        {
          id: 'act1',
          name: 'Descent',
          duration: 180, // 3 minutes
          objectives: ['Breach the archive', 'Assess the Bio-Seed'],
          beats: [
            {
              id: 'breach',
              type: 'combat',
              trigger: 'archive_breach',
              effects: { resourceNode: 'archive_gate' }
            },
            {
              id: 'discovery',
              type: 'discovery',
              trigger: 'bio_seed_found',
              prompt: 'NARRATIVE_MICRO_EVENT',
              effects: { bioSeedHealth: 85 }
            }
          ]
        },
        {
          id: 'act2',
          name: 'Consequence',
          duration: 300, // 5 minutes
          objectives: ['Make your choice', 'Face the consequences'],
          beats: [
            {
              id: 'choice',
              type: 'choice',
              trigger: 'harvest_or_preserve',
              prompt: 'NARRATIVE_MICRO_EVENT',
              choices: [
                {
                  id: 'harvest',
                  label: 'Harvest Now',
                  description: 'Extract resources immediately for tactical advantage',
                  effects: { resourceGain: 60, bioSeedHealthDelta: -25 },
                  narrativeTag: 'greed'
                },
                {
                  id: 'preserve',
                  label: 'Preserve',
                  description: 'Protect the Bio-Seed for long-term benefits',
                  effects: { bioSeedHealthDelta: 12, longTermYieldMultiplier: 0.2 },
                  narrativeTag: 'hope'
                }
              ]
            },
            {
              id: 'consequence',
              type: 'environmental',
              trigger: 'choice_consequence',
              prompt: 'NARRATIVE_MICRO_EVENT',
              effects: {}
            }
          ]
        },
        {
          id: 'act3',
          name: 'Reckoning',
          duration: 240, // 4 minutes
          objectives: ['Face the outcome', 'Survive the aftermath'],
          beats: [
            {
              id: 'reckoning',
              type: 'narrative',
              trigger: 'final_reckoning',
              prompt: 'NARRATIVE_MICRO_EVENT',
              effects: {}
            },
            {
              id: 'epilogue',
              type: 'narrative',
              trigger: 'epilogue',
              prompt: 'EPILOGUE_GENERATOR',
              effects: {}
            }
          ]
        }
      ],
      characters: [
        {
          id: 'mara',
          name: 'Dr. Mara Kest',
          role: 'Biologist',
          personality: 'pleading, ethical',
          voiceId: 'mara'
        },
        {
          id: 'lian',
          name: 'Commander Lian',
          role: 'Commander',
          personality: 'pragmatic, cold',
          voiceId: 'lian'
        },
        {
          id: 'patch',
          name: 'Patch',
          role: 'Drone',
          personality: 'wry, humorous',
          voiceId: 'patch'
        }
      ]
    });

    // Add more campaigns here...
  }

  /**
   * Start a campaign
   */
  startCampaign(campaignId: string, seed?: number): CampaignState {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    this.currentState = {
      campaignId,
      actIndex: 0,
      beatIndex: 0,
      choices: new Map(),
      narrativeTags: new Set(),
      resources: { ore: 80, energy: 40, biomass: 0, data: 10 },
      bioSeedHealth: 85,
      playerReputation: 0.3,
      time: 0,
      seed: seed || campaign.seed || Math.floor(Math.random() * 1000000)
    };

    this.narrativeEvents = [];
    return this.currentState;
  }

  /**
   * Get current campaign state
   */
  getCurrentState(): CampaignState | null {
    return this.currentState;
  }

  /**
   * Get current campaign config
   */
  getCurrentCampaign(): CampaignConfig | null {
    if (!this.currentState) return null;
    return this.campaigns.get(this.currentState.campaignId) || null;
  }

  /**
   * Get current act
   */
  getCurrentAct(): CampaignAct | null {
    const campaign = this.getCurrentCampaign();
    if (!campaign || !this.currentState) return null;
    return campaign.acts[this.currentState.actIndex] || null;
  }

  /**
   * Get current beat
   */
  getCurrentBeat(): CampaignBeat | null {
    const act = this.getCurrentAct();
    if (!act || !this.currentState) return null;
    return act.beats[this.currentState.beatIndex] || null;
  }

  /**
   * Make a choice in the campaign
   */
  makeChoice(choiceId: string, optionId: string): void {
    if (!this.currentState) return;

    const beat = this.getCurrentBeat();
    if (!beat || beat.type !== 'choice') return;

    const choice = beat.choices?.find(c => c.id === choiceId);
    if (!choice) return;

    this.currentState.choices.set(choiceId, optionId);
    if (choice.narrativeTag) {
      this.currentState.narrativeTags.add(choice.narrativeTag);
    }

    // Apply effects
    Object.entries(choice.effects).forEach(([key, value]) => {
      if (key === 'bioSeedHealthDelta' && this.currentState.bioSeedHealth !== undefined) {
        this.currentState.bioSeedHealth = Math.max(0, Math.min(100, 
          this.currentState.bioSeedHealth + (value as number)));
      } else if (key === 'resourceGain') {
        this.currentState.resources.ore += value as number;
      } else {
        (this.currentState as any)[key] = value;
      }
    });
  }

  /**
   * Trigger a narrative event
   */
  triggerEvent(triggerId: string): NarrativeEvent | null {
    if (!this.currentState) return null;

    const beat = this.getCurrentBeat();
    if (!beat || beat.trigger !== triggerId) return null;

    // This will be populated by LLM integration
    const event: NarrativeEvent = {
      event: beat.id,
      trigger: triggerId,
      flavor: '',
      effect: beat.effects || {},
      narrativeTag: this.currentState.narrativeTags.has('greed') ? 'guilt' : 'hope'
    };

    this.narrativeEvents.push(event);
    return event;
  }

  /**
   * Advance to next beat
   */
  advanceBeat(): boolean {
    if (!this.currentState) return false;

    const act = this.getCurrentAct();
    if (!act) return false;

    this.currentState.beatIndex++;
    if (this.currentState.beatIndex >= act.beats.length) {
      this.currentState.actIndex++;
      this.currentState.beatIndex = 0;

      const campaign = this.getCurrentCampaign();
      if (!campaign || this.currentState.actIndex >= campaign.acts.length) {
        return false; // Campaign complete
      }
    }

    return true;
  }

  /**
   * Get all campaigns
   */
  getCampaigns(): CampaignConfig[] {
    return Array.from(this.campaigns.values());
  }

  /**
   * Get narrative events
   */
  getNarrativeEvents(): NarrativeEvent[] {
    return this.narrativeEvents;
  }

  /**
   * Get campaign by ID
   */
  getCampaign(campaignId: string): CampaignConfig | undefined {
    return this.campaigns.get(campaignId);
  }
}

