/**
 * 3-Act Demo Narrative Structure
 * Implements the narrative spine for a 3-15 minute demo arc
 * Based on the narrative design playbook
 */

import { CoreNarrativeCharactersManager } from './CoreNarrativeCharacters';
import { DynamicNarrativeEventGenerator, GameStateSnapshot } from './DynamicNarrativeEvents';
import { NarrativeConsequencesManager, ChoiceContext } from './NarrativeConsequencesSystem';

export interface ActStructure {
  actNumber: 1 | 2 | 3;
  name: string;
  startTime: number; // seconds
  endTime: number; // seconds
  objectives: ActObjective[];
  narrativeBeats: NarrativeBeat[];
  completionCriteria: ActCompletionCriteria;
}

export interface ActObjective {
  id: string;
  description: string;
  type: 'arrival' | 'choice' | 'conflict' | 'resolution';
  completed: boolean;
  timestamp?: number;
}

export interface NarrativeBeat {
  id: string;
  time: number; // seconds into act
  type: 'dialogue' | 'event' | 'choice' | 'cinematic';
  description: string;
  characterId?: 'LIAN_YAO' | 'DR_MARA_KEST' | 'PATCH';
  triggerCondition?: (gameState: GameStateSnapshot) => boolean;
  consequence?: string;
}

export interface ActCompletionCriteria {
  type: 'time' | 'objective' | 'choice' | 'hybrid';
  conditions: string[];
  met: boolean;
}

export interface DemoNarrativeState {
  currentAct: 1 | 2 | 3;
  actStartTime: number;
  gameStartTime: number;
  completedObjectives: string[];
  narrativeBeatsPlayed: string[];
  playerAlignment: number;
}

/**
 * 3-Act Demo Narrative Director
 * Manages the narrative arc across the demo experience
 */
export class DemoNarrativeDirector {
  private characterManager: CoreNarrativeCharactersManager;
  private eventGenerator: DynamicNarrativeEventGenerator;
  private consequencesManager: NarrativeConsequencesManager;
  private narrativeState: DemoNarrativeState;
  private acts: ActStructure[];

  constructor(
    characterManager: CoreNarrativeCharactersManager,
    eventGenerator: DynamicNarrativeEventGenerator,
    consequencesManager: NarrativeConsequencesManager
  ) {
    this.characterManager = characterManager;
    this.eventGenerator = eventGenerator;
    this.consequencesManager = consequencesManager;

    this.narrativeState = {
      currentAct: 1,
      actStartTime: Date.now(),
      gameStartTime: Date.now(),
      completedObjectives: [],
      narrativeBeatsPlayed: [],
      playerAlignment: 0
    };

    this.acts = this.initializeActs();
  }

  /**
   * Initialize the 3-act structure
   */
  private initializeActs(): ActStructure[] {
    return [
      // ACT I: Arrival (Setup, 0-3 min)
      {
        actNumber: 1,
        name: 'Arrival',
        startTime: 0,
        endTime: 180, // 3 minutes
        objectives: [
          {
            id: 'arrive_at_tile',
            description: 'Arrive at contested tile',
            type: 'arrival',
            completed: false
          },
          {
            id: 'discover_bio_seed',
            description: 'Discover the sleeping Bio-Seed beneath the ore',
            type: 'arrival',
            completed: false
          },
          {
            id: 'present_choice',
            description: 'Present initial choice: harvest immediately vs invest in BioConserve tech',
            type: 'choice',
            completed: false
          }
        ],
        narrativeBeats: [
          {
            id: 'beat_1_intro',
            time: 0,
            type: 'dialogue',
            description: 'Lian Yao introduces the mission: "This world keeps its secrets in the ground."',
            characterId: 'LIAN_YAO'
          },
          {
            id: 'beat_2_discovery',
            time: 60, // 1 minute in
            type: 'event',
            description: 'Bio-Seed discovered: visual reveal of dormant lifeform beneath terrain',
            triggerCondition: (state) => state.resources.biomass > 50 || state.bioSeedState === 'dormant'
          },
          {
            id: 'beat_3_mara_intro',
            time: 90, // 1.5 minutes in
            type: 'dialogue',
            description: 'Dr. Mara Kest warns: "If you wake it wrong, it will consume everything... but if you nurture it, it may teach us how to heal."',
            characterId: 'DR_MARA_KEST'
          },
          {
            id: 'beat_4_choice_presented',
            time: 120, // 2 minutes in
            type: 'choice',
            description: 'Present choice: Immediate harvest (fast win, greedy) vs BioConserve research (delayed victory, humane)',
            consequence: 'This choice sets player alignment for remainder of demo'
          },
          {
            id: 'beat_5_patch_quip',
            time: 150, // 2.5 minutes in
            type: 'dialogue',
            description: 'Patch comments: "Just so you know, \'sustainable\' was an option. Not judging. Much."',
            characterId: 'PATCH'
          }
        ],
        completionCriteria: {
          type: 'hybrid',
          conditions: [
            'Player makes initial choice (harvest or conserve)',
            'Time reaches 3 minutes OR objective completed'
          ],
          met: false
        }
      },

      // ACT II: Choice & Cost (Conflict, 3-10 min)
      {
        actNumber: 2,
        name: 'Choice & Cost',
        startTime: 180,
        endTime: 600, // 3-10 minutes
        objectives: [
          {
            id: 'execute_choice',
            description: 'Execute chosen path (harvest or conserve)',
            type: 'choice',
            completed: false
          },
          {
            id: 'face_consequences',
            description: 'Experience consequences of choice',
            type: 'conflict',
            completed: false
          },
          {
            id: 'moral_friction',
            description: 'Moral friction escalates as consequences compound',
            type: 'conflict',
            completed: false
          }
        ],
        narrativeBeats: [
          {
            id: 'beat_6_consequence_1',
            time: 240, // 4 minutes in (1 minute into Act II)
            type: 'event',
            description: 'First consequence manifests based on player choice',
            triggerCondition: (state) => state.playerChoices.length > 0
          },
          {
            id: 'beat_7_bio_seed_stirs',
            time: 300, // 5 minutes in
            type: 'event',
            description: 'Bio-Seed begins to stir in response to player actions',
            triggerCondition: (state) => state.bioSeedState === 'stirring' || state.resources.biomass < 40
          },
          {
            id: 'beat_8_character_reaction',
            time: 360, // 6 minutes in
            type: 'dialogue',
            description: 'Character reacts to player choices (Mara if humane, Lian if pragmatic, Patch if greedy)',
            triggerCondition: (state) => Math.abs(state.moralAlignment || 0) > 0.3
          },
          {
            id: 'beat_9_terrain_change',
            time: 420, // 7 minutes in
            type: 'event',
            description: 'Terrain dynamically changes based on player actions (flourishes or degrades)',
            triggerCondition: (state) => state.terrainEvents.length > 0
          },
          {
            id: 'beat_10_escalation',
            time: 480, // 8 minutes in
            type: 'event',
            description: 'Consequences escalate: environmental changes become more pronounced',
            triggerCondition: (state) => (state.resources.biomass < 30 && state.moralAlignment < -0.3) || (state.resources.biomass > 60 && state.moralAlignment > 0.3)
          },
          {
            id: 'beat_11_dynamic_event',
            time: 540, // 9 minutes in
            type: 'event',
            description: 'LLM-generated dynamic event based on player path',
            triggerCondition: (state) => true // Always triggers if reached
          }
        ],
        completionCriteria: {
          type: 'hybrid',
          conditions: [
            'Player has faced at least 2 major consequences',
            'Time reaches 10 minutes OR key objective completed'
          ],
          met: false
        }
      },

      // ACT III: Outcome & Resonance (Closure, 10-15 min)
      {
        actNumber: 3,
        name: 'Outcome & Resonance',
        startTime: 600,
        endTime: 900, // 10-15 minutes
        objectives: [
          {
            id: 'tactical_result',
            description: 'Reach immediate tactical result (win or lose)',
            type: 'resolution',
            completed: false
          },
          {
            id: 'narrative_resonance',
            description: 'Experience narrative resonance of choices',
            type: 'resolution',
            completed: false
          },
          {
            id: 'replay_hook',
            description: 'Present hook for replayability (different outcome possible)',
            type: 'resolution',
            completed: false
          }
        ],
        narrativeBeats: [
          {
            id: 'beat_12_climax',
            time: 660, // 11 minutes in
            type: 'event',
            description: 'Climax: Bio-Seed fully responds to player choices (symbiotic connection or hostile reaction)',
            triggerCondition: (state) => state.bioSeedState === 'awakening' || state.bioSeedState === 'angered'
          },
          {
            id: 'beat_13_final_consequence',
            time: 720, // 12 minutes in
            type: 'cinematic',
            description: 'Short cinematic showing immediate tactical result',
            triggerCondition: (state) => state.resources.biomass < 20 || state.resources.biomass > 70
          },
          {
            id: 'beat_14_character_closing',
            time: 780, // 13 minutes in
            type: 'dialogue',
            description: 'Character closing statement based on player alignment',
            triggerCondition: (state) => true
          },
          {
            id: 'beat_15_scoreboard',
            time: 840, // 14 minutes in
            type: 'cinematic',
            description: 'Scoreboard shows: tactical result + narrative resonance (did you save or slaughter?)',
            triggerCondition: (state) => true
          },
          {
            id: 'beat_16_replay_hook',
            time: 900, // 15 minutes in
            type: 'dialogue',
            description: 'Hook for replay: "Next time, try the other path. The outcome will be different."',
            characterId: 'LIAN_YAO'
          }
        ],
        completionCriteria: {
          type: 'hybrid',
          conditions: [
            'All objectives completed',
            'Time reaches 15 minutes OR game ends'
          ],
          met: false
        }
      }
    ];
  }

  /**
   * Update narrative director with game state
   */
  async update(gameState: GameStateSnapshot): Promise<void> {
    const currentTime = (Date.now() - this.narrativeState.gameStartTime) / 1000;
    const currentAct = this.acts[this.narrativeState.currentAct - 1];

    if (!currentAct) return;

    // Check if we should progress to next act
    if (currentTime >= currentAct.endTime && this.narrativeState.currentAct < 3) {
      await this.progressToNextAct();
    }

    // Process narrative beats for current act
    await this.processNarrativeBeats(currentAct, gameState, currentTime);

    // Check objectives
    this.checkObjectives(currentAct, gameState);

    // Update player alignment
    this.narrativeState.playerAlignment = this.consequencesManager.getPlayerAlignment();
  }

  /**
   * Progress to next act
   */
  private async progressToNextAct(): Promise<void> {
    if (this.narrativeState.currentAct < 3) {
      const previousAct = this.acts[this.narrativeState.currentAct - 1];
      previousAct.completionCriteria.met = true;

      this.narrativeState.currentAct = (this.narrativeState.currentAct + 1) as 1 | 2 | 3;
      this.narrativeState.actStartTime = Date.now();

      // Trigger act transition
      await this.triggerActTransition(this.narrativeState.currentAct);
    }
  }

  /**
   * Trigger act transition
   */
  private async triggerActTransition(actNumber: 1 | 2 | 3): Promise<void> {
    const act = this.acts[actNumber - 1];
    if (!act) return;

    // Generate transition event
    const transitionEvent = await this.eventGenerator.generateEvent(
      {
        action: `act_transition_${actNumber}`,
        gameTime: act.startTime
      },
      {
        resources: { biomass: 50, ore: 50, energy: 50, data: 50 },
        researchedTechs: [],
        gameTime: act.startTime,
        playerChoices: [],
        terrainEvents: [],
        moralAlignment: this.narrativeState.playerAlignment
      },
      `Transitioning to Act ${actNumber}: ${act.name}`
    );

    // Trigger appropriate character line
    let characterId: 'LIAN_YAO' | 'DR_MARA_KEST' | 'PATCH' = 'LIAN_YAO';
    let context = '';

    if (actNumber === 2) {
      context = 'Act II begins - choices have consequences';
    } else if (actNumber === 3) {
      context = 'Act III begins - resolution approaches';
      characterId = 'PATCH';
    }

    const voiceLine = this.characterManager.getVoiceLine(characterId, context);
    // Play voice line if available
  }

  /**
   * Process narrative beats for current act
   */
  private async processNarrativeBeats(
    act: ActStructure,
    gameState: GameStateSnapshot,
    currentTime: number
  ): Promise<void> {
    const actElapsedTime = currentTime - act.startTime;

    for (const beat of act.narrativeBeats) {
      // Skip if already played
      if (this.narrativeState.narrativeBeatsPlayed.includes(beat.id)) {
        continue;
      }

      // Check if beat should trigger
      if (actElapsedTime >= beat.time) {
        // Check trigger condition if present
        if (beat.triggerCondition && !beat.triggerCondition(gameState)) {
          continue;
        }

        // Trigger beat
        await this.triggerBeat(beat, gameState);

        // Mark as played
        this.narrativeState.narrativeBeatsPlayed.push(beat.id);
      }
    }
  }

  /**
   * Trigger a narrative beat
   */
  private async triggerBeat(
    beat: NarrativeBeat,
    gameState: GameStateSnapshot
  ): Promise<void> {
    switch (beat.type) {
      case 'dialogue':
        if (beat.characterId) {
          const voiceLine = this.characterManager.getVoiceLine(
            beat.characterId,
            beat.description
          );
          // Play voice line if available
          if (voiceLine) {
            // Trigger voice playback (integrate with audio system)
          }
        }
        break;

      case 'event': {
        const event = await this.eventGenerator.generateEvent(
          {
            action: `beat_${beat.id}`,
            gameTime: Date.now() - this.narrativeState.gameStartTime
          },
          gameState,
          beat.description
        );
        // Display event (integrate with UI)
        break;
      }

      case 'choice':
        // Present choice to player (integrate with choice system)
        break;

      case 'cinematic':
        // Trigger cinematic (integrate with cinematic system)
        break;
    }
  }

  /**
   * Check act objectives
   */
  private checkObjectives(act: ActStructure, gameState: GameStateSnapshot): void {
    for (const objective of act.objectives) {
      if (objective.completed) continue;

      // Check objective completion based on type
      if (objective.type === 'arrival' && gameState.terrainEvents.length > 0) {
        objective.completed = true;
        objective.timestamp = Date.now();
        this.narrativeState.completedObjectives.push(objective.id);
      }

      if (objective.type === 'choice' && gameState.playerChoices.length > 0) {
        objective.completed = true;
        objective.timestamp = Date.now();
        this.narrativeState.completedObjectives.push(objective.id);
      }

      if (objective.type === 'conflict' && gameState.bioSeedState === 'stirring') {
        objective.completed = true;
        objective.timestamp = Date.now();
        this.narrativeState.completedObjectives.push(objective.id);
      }

      if (objective.type === 'resolution' && act.actNumber === 3) {
        // Resolution objectives checked at act end
        if (this.narrativeState.completedObjectives.length >= act.objectives.length - 1) {
          objective.completed = true;
          objective.timestamp = Date.now();
          this.narrativeState.completedObjectives.push(objective.id);
        }
      }
    }
  }

  /**
   * Get current act
   */
  getCurrentAct(): ActStructure | null {
    return this.acts[this.narrativeState.currentAct - 1] || null;
  }

  /**
   * Get narrative state
   */
  getNarrativeState(): DemoNarrativeState {
    return { ...this.narrativeState };
  }

  /**
   * Process player choice in context of demo narrative
   */
  async processPlayerChoice(context: ChoiceContext): Promise<void> {
    // Process through consequences manager
    const consequence = await this.consequencesManager.processChoice(context);

    // Check if choice triggers act objectives
    const currentAct = this.getCurrentAct();
    if (currentAct) {
      for (const objective of currentAct.objectives) {
        if (objective.type === 'choice' && !objective.completed) {
          objective.completed = true;
          objective.timestamp = Date.now();
          this.narrativeState.completedObjectives.push(objective.id);
        }
      }
    }

    // Update game state choices
    // (This should be handled by the game state manager)
  }
}

/**
 * One-line premise for Quaternion
 */
export const QUATERNION_PREMISE = 
  "In a fractured archived world of quantum battlefields, you command rebuilding — but every resource you take chips away at an emergent lifeform's chance to survive. How far will you go to win?";

