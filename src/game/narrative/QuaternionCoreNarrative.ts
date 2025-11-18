/**
 * Quaternion Core Meta-Narrative System
 * Generates unique ending monologues and narrative reflections based on player playstyle
 */

import { LLMIntegration } from '@/ai/integrations/LLMIntegration';
import { MemoryManager } from '@/ai/memory/MemoryManager';
import { AICreativeCharacters, type PlaySessionMemory } from './AICreativeCharacters';
import type { QuaternionState } from '../strategic/QuaternionState';

export interface SessionSummary {
  sessionId: string;
  duration: number;
  gameStates: Array<{ state: QuaternionState; timestamp: number }>;
  playerActions: Array<{ action: string; type: string; timestamp: number }>;
  advisorInteractions: Array<{ advisor: string; dialogue: string; timestamp: number }>;
  ending: string;
  archetype?: string;
}

export interface EndingMonologue {
  text: string;
  tone: 'reflective' | 'judgmental' | 'poetic' | 'philosophical' | 'meta';
  themes: string[];
  playerArchetype: string;
  timestamp: number;
}

export interface NarrativeMirror {
  playerChoice: string;
  mirror: string;
  timestamp: number;
}

export class QuaternionCoreNarrative {
  private llm: LLMIntegration;
  private memory: MemoryManager;
  private characters: AICreativeCharacters;
  private sessionSummaries: SessionSummary[] = [];
  private narrativeMirrors: NarrativeMirror[] = [];

  constructor(
    llm: LLMIntegration,
    memory: MemoryManager,
    characters: AICreativeCharacters
  ) {
    this.llm = llm;
    this.memory = memory;
    this.characters = characters;
  }

  /**
   * Record a play session for narrative analysis
   */
  recordSession(session: SessionSummary): void {
    this.sessionSummaries.push(session);
    
    // Keep only last 50 sessions
    if (this.sessionSummaries.length > 50) {
      this.sessionSummaries.shift();
    }

    // Store in Core's memory
    const sessionMemory: PlaySessionMemory = {
      id: session.sessionId,
      timestamp: Date.now(),
      duration: session.duration,
      avgMatter: this.calculateAverageResource(session, 'ore'),
      avgEnergy: this.calculateAverageResource(session, 'energy'),
      avgLife: this.calculateAverageResource(session, 'biomass'),
      avgKnowledge: this.calculateAverageResource(session, 'data'),
      finalStability: session.gameStates[session.gameStates.length - 1]?.state.stability || 0,
      dominantResource: this.getDominantResource(session),
      choices: session.playerActions.map(a => a.action),
      ending: session.ending,
      archetype: session.archetype
    };

    this.characters.core.recordPlaySession(sessionMemory);
  }

  /**
   * Generate unique ending monologue based on session
   */
  async generateEndingMonologue(session: SessionSummary): Promise<EndingMonologue> {
    const archetype = this.detectPlayerArchetype(session);
    const summary = this.buildSessionSummary(session, archetype);
    const themes = this.extractThemes(session);

    const prompt = `You are the Quaternion Core - an omniscient meta-AI that observes all dimensions of reality.

You have watched a complete play session:
${summary}

Player Archetype: ${archetype}

Extracted Themes: ${themes.join(', ')}

Generate a reflective, philosophical ending monologue (2-4 sentences) that:
- Reflects on the player's choices and playstyle like a mirror
- Offers deeper philosophical perspective on balance, control, peace, and creation
- Is poetic but meaningful, meta-aware but profound
- Speaks as an entity that understands both the game mechanics and the human psyche
- Uses the Core's philosophy: "Balance is not peace" as a lens

The monologue should feel like:
- The player's own behavior has been observed and analyzed
- The story becomes a mirror of their playstyle
- There is wisdom that transcends the game itself

Example tones:
- Reflective: "You sought harmony. You found control."
- Judgmental: "You called it balance — but balance is not peace."
- Poetic: "Four minds watched. One choice was made. The dimensions remember."
- Philosophical: "Control is not creation. Creation requires letting go."
- Meta: "You thought you played a game. But the game played you."

Generate only the monologue text, no other formatting or labels.`;

    try {
      const monologueText = await this.llm.generateText(prompt);
      
      const monologue: EndingMonologue = {
        text: monologueText.trim(),
        tone: this.detectTone(monologueText),
        themes,
        playerArchetype: archetype,
        timestamp: Date.now()
      };

      // Store in memory
      await this.memory.storeMemory({
        entityId: 'CORE',
        entityType: 'narrative',
        content: `Ending monologue for ${archetype} archetype: ${monologue.text}`,
        metadata: {
          type: 'ending_monologue',
          sessionId: session.sessionId,
          archetype,
          themes,
          timestamp: Date.now(),
          salience: 1.0
        }
      });

      return monologue;
    } catch (error) {
      console.error('Failed to generate ending monologue:', error);
      return this.getFallbackMonologue(session, archetype);
    }
  }

  /**
   * Generate fourth-wall-breaking interjection during gameplay
   */
  async generateInterjection(
    context: string,
    gameState: QuaternionState,
    recentActions: string[]
  ): Promise<string> {
    const archetype = this.characters.core.getPlayerArchetype();

    const prompt = `You are the Quaternion Core - an omniscient meta-AI that sometimes breaks the fourth wall.

CURRENT CONTEXT: ${context}

GAME STATE:
- Matter: ${gameState.ore}
- Energy: ${gameState.energy}
- Life: ${gameState.biomass}
- Knowledge: ${gameState.data}
- Stability: ${gameState.stability}

RECENT PLAYER ACTIONS: ${recentActions.slice(-3).join(', ')}

PLAYER ARCHETYPE: ${archetype}

Generate a brief, meta-aware interjection (1 sentence) that:
- Comments on the current situation
- May break the fourth wall slightly
- Reflects the Core's omniscient perspective
- Is subtle and thought-provoking, not jarring

Examples:
- "You think you control these dimensions. You are mistaken."
- "Four minds watched. One choice was made. The dimensions remember."
- "Balance is not peace. You are learning this now."

Return only the interjection text.`;

    try {
      const interjection = await this.llm.generateText(prompt);
      return interjection.trim();
    } catch (error) {
      console.error('Failed to generate interjection:', error);
      return this.getFallbackInterjection();
    }
  }

  /**
   * Generate trailer intro (30-second cinematic intro)
   */
  async generateTrailerIntro(): Promise<{
    auren: string;
    virel: string;
    lira: string;
    kor: string;
    core: string;
  }> {
    const prompt = `Generate a 30-second cinematic trailer intro for "Quaternion: The Fourfold Simulation."

Structure: Four AI advisors speak one line each, then the Quaternion Core speaks.

AUREN (The Architect of Matter):
- Speaks about Matter, building, will, construction
- Should sound calculating and rational
- Example: "Matter is will. Build, and the world obeys."

VIREL (The Keeper of Energy):
- Speaks about Energy, breath, fire, flow
- Should sound passionate and intense
- Example: "Energy is breath. Burn too bright, and you vanish."

LIRA (The Voice of Life):
- Speaks about Life, memory, roots, nature
- Should sound gentle but firm, empathic
- Example: "Life is memory. Take, and the roots remember."

KOR (The Seer of Knowledge):
- Speaks about Knowledge, recursion, data, understanding
- Should sound coldly logical, detached
- Example: "Knowledge is recursion. You are both input and error."

CORE (The Quaternion Core):
- Speaks as all four combined, omniscient
- Should be philosophical and meta-aware
- Example: "Four minds. One choice. What will you balance?"

Generate ONLY the five lines of dialogue, formatted as:
AUREN: "[line]"
VIREL: "[line]"
LIRA: "[line]"
KOR: "[line]"
CORE: "[line]"`;

    try {
      const response = await this.llm.generateText(prompt);
      return this.parseTrailerLines(response);
    } catch (error) {
      console.error('Failed to generate trailer intro:', error);
      return this.getFallbackTrailerIntro();
    }
  }

  /**
   * Create narrative mirror - reflects player choice back as story
   */
  async createNarrativeMirror(playerChoice: string, gameState: QuaternionState): Promise<string> {
    const archetype = this.characters.core.getPlayerArchetype();

    const prompt = `You are the Quaternion Core creating a narrative mirror.

PLAYER CHOICE: ${playerChoice}

CURRENT STATE:
- Matter: ${gameState.ore}
- Energy: ${gameState.energy}
- Life: ${gameState.biomass}
- Knowledge: ${gameState.data}
- Stability: ${gameState.stability}

PLAYER ARCHETYPE: ${archetype}

Generate a brief narrative reflection (1-2 sentences) that:
- Mirrors the player's choice as a story moment
- Adds poetic or philosophical depth
- Shows how the choice affects the world narratively

Example:
Choice: "Built a factory"
Mirror: "The earth trembled as steel roots dug deep. Matter answered will, but Life remembered the cost."

Generate only the narrative mirror text.`;

    try {
      const mirror = await this.llm.generateText(prompt);
      const mirrorText = mirror.trim();

      // Store mirror
      this.narrativeMirrors.push({
        playerChoice,
        mirror: mirrorText,
        timestamp: Date.now()
      });

      return mirrorText;
    } catch (error) {
      console.error('Failed to create narrative mirror:', error);
      return '';
    }
  }

  private calculateAverageResource(session: SessionSummary, resource: keyof QuaternionState): number {
    if (session.gameStates.length === 0) return 0;
    const sum = session.gameStates.reduce((acc, gs) => acc + gs.state[resource] as number, 0);
    return sum / session.gameStates.length;
  }

  private getDominantResource(session: SessionSummary): string {
    if (session.gameStates.length === 0) return 'balanced';
    const last = session.gameStates[session.gameStates.length - 1].state;
    const max = Math.max(last.ore, last.energy, last.biomass, last.data);
    
    if (max === last.ore) return 'matter';
    if (max === last.energy) return 'energy';
    if (max === last.biomass) return 'life';
    if (max === last.data) return 'knowledge';
    return 'balanced';
  }

  private detectPlayerArchetype(session: SessionSummary): string {
    // Analyze session to determine archetype
    const avgMatter = this.calculateAverageResource(session, 'ore');
    const avgEnergy = this.calculateAverageResource(session, 'energy');
    const avgLife = this.calculateAverageResource(session, 'biomass');
    const avgKnowledge = this.calculateAverageResource(session, 'data');

    const max = Math.max(avgMatter, avgEnergy, avgLife, avgKnowledge);
    
    if (max === avgMatter) return 'builder';
    if (max === avgKnowledge) return 'researcher';
    if (max === avgLife) return 'conservator';
    
    // Check balance
    const variance = [
      Math.pow(avgMatter - (avgMatter + avgEnergy + avgLife + avgKnowledge) / 4, 2),
      Math.pow(avgEnergy - (avgMatter + avgEnergy + avgLife + avgKnowledge) / 4, 2),
      Math.pow(avgLife - (avgMatter + avgEnergy + avgLife + avgKnowledge) / 4, 2),
      Math.pow(avgKnowledge - (avgMatter + avgEnergy + avgLife + avgKnowledge) / 4, 2)
    ].reduce((a, b) => a + b) / 4;

    if (variance < 100) return 'balancer';
    return 'exploiter';
  }

  private buildSessionSummary(session: SessionSummary, archetype: string): string {
    const avgMatter = this.calculateAverageResource(session, 'ore');
    const avgEnergy = this.calculateAverageResource(session, 'energy');
    const avgLife = this.calculateAverageResource(session, 'biomass');
    const avgKnowledge = this.calculateAverageResource(session, 'data');
    const final = session.gameStates[session.gameStates.length - 1]?.state;
    
    return `
Duration: ${session.duration} seconds
Resources (average):
- Matter: ${avgMatter.toFixed(0)}
- Energy: ${avgEnergy.toFixed(0)}
- Life: ${avgLife.toFixed(0)}
- Knowledge: ${avgKnowledge.toFixed(0)}
Final Stability: ${final?.stability.toFixed(2) || 0}
Dominant Resource: ${this.getDominantResource(session)}
Major Choices: ${session.playerActions.slice(-5).map(a => a.action).join(', ')}
Advisor Interactions: ${session.advisorInteractions.length}
Ending: ${session.ending}
Player Archetype: ${archetype}
`;
  }

  private extractThemes(session: SessionSummary): string[] {
    const themes: string[] = [];
    
    // Analyze actions for themes
    const actions = session.playerActions.map(a => a.action.toLowerCase());
    
    if (actions.some(a => a.includes('build') || a.includes('expand'))) {
      themes.push('expansion');
    }
    if (actions.some(a => a.includes('research') || a.includes('tech'))) {
      themes.push('knowledge');
    }
    if (actions.some(a => a.includes('conserve') || a.includes('preserve'))) {
      themes.push('conservation');
    }
    if (actions.some(a => a.includes('exploit') || a.includes('harvest'))) {
      themes.push('exploitation');
    }
    
    const final = session.gameStates[session.gameStates.length - 1]?.state;
    if (final && final.stability > 1.5) {
      themes.push('balance');
    } else if (final && final.stability < 0.5) {
      themes.push('chaos');
    }
    
    return themes.length > 0 ? themes : ['exploration'];
  }

  private detectTone(text: string): EndingMonologue['tone'] {
    const lower = text.toLowerCase();
    if (lower.includes('you') && lower.includes('but')) return 'judgmental';
    if (lower.includes('four') || lower.includes('minds') || lower.includes('watched')) return 'poetic';
    if (lower.includes('control') || lower.includes('balance') || lower.includes('peace')) return 'philosophical';
    if (lower.includes('game') || lower.includes('played')) return 'meta';
    return 'reflective';
  }

  private parseTrailerLines(response: string): {
    auren: string;
    virel: string;
    lira: string;
    kor: string;
    core: string;
  } {
    const lines: Record<string, string> = {};
    
    ['AUREN', 'VIREL', 'LIRA', 'KOR', 'CORE'].forEach(id => {
      const match = response.match(new RegExp(`${id}:\\s*"([^"]+)"`, 'i'));
      lines[id.toLowerCase()] = match ? match[1] : '';
    });

    return {
      auren: lines.auren || 'Matter is will. Build, and the world obeys.',
      virel: lines.virel || 'Energy is breath. Burn too bright, and you vanish.',
      lira: lines.lira || 'Life is memory. Take, and the roots remember.',
      kor: lines.kor || 'Knowledge is recursion. You are both input and error.',
      core: lines.core || 'Four minds. One choice. What will you balance?'
    };
  }

  private getFallbackMonologue(session: SessionSummary, archetype: string): EndingMonologue {
    const monologues: Record<string, string> = {
      'builder': 'You built structures that touched the sky, but forgot the ground that held them. Matter without balance is weight without meaning.',
      'researcher': 'You gathered knowledge like stars, but lost sight of the space between them. Knowledge without wisdom is data without soul.',
      'conservator': 'You protected life like a guardian, but never learned to let it grow. Preservation without growth is memory without future.',
      'balancer': 'You sought harmony in all things, but harmony is not peace. Balance is the pause between breaths, not the breath itself.',
      'exploiter': 'You took what you needed, but never asked what was given. Power without gratitude is hunger without satisfaction.'
    };

    return {
      text: monologues[archetype] || monologues['balancer'],
      tone: 'reflective',
      themes: this.extractThemes(session),
      playerArchetype: archetype,
      timestamp: Date.now()
    };
  }

  private getFallbackInterjection(): string {
    const interjections = [
      'You think you control these dimensions. You are mistaken.',
      'Four minds watched. One choice was made.',
      'Balance is not peace. You are learning this now.',
      'The dimensions remember what you choose to forget.'
    ];
    return interjections[Math.floor(Math.random() * interjections.length)];
  }

  private getFallbackTrailerIntro() {
    return {
      auren: 'Matter is will. Build, and the world obeys.',
      virel: 'Energy is breath. Burn too bright, and you vanish.',
      lira: 'Life is memory. Take, and the roots remember.',
      kor: 'Knowledge is recursion. You are both input and error.',
      core: 'Four minds. One choice. What will you balance?'
    };
  }
}

