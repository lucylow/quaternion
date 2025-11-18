/**
 * AI Creative Characters System
 * Four AI advisors that personify the Quaternion dimensions with evolving personalities
 */

import { LLMIntegration } from '@/ai/integrations/LLMIntegration';
import { MemoryManager } from '@/ai/memory/MemoryManager';
import type { QuaternionState } from '../strategic/QuaternionState';

export type AdvisorID = 'AUREN' | 'VIREL' | 'LIRA' | 'KOR' | 'CORE';

export interface AdvisorPersonality {
  id: AdvisorID;
  name: string;
  axis: 'matter' | 'energy' | 'life' | 'knowledge' | 'all';
  personality: string;
  philosophy: string;
  voiceStyle: string;
  emotionalRange: number; // 0-1, how much emotion varies
  trust: number; // -1 to 1
  evolutionStage: number; // 0-1, tracks character arc progression
  memories: CharacterMemory[];
  relationshipWithPlayer: RelationshipState;
  currentEmotion: AdvisorEmotion;
}

export interface CharacterMemory {
  id: string;
  type: 'player_action' | 'resource_change' | 'conflict' | 'milestone';
  description: string;
  emotionalImpact: number; // -1 to 1
  timestamp: number;
  salience: number; // 0-1, importance
}

export type RelationshipState = 'loyal' | 'supportive' | 'neutral' | 'concerned' | 'rebellious' | 'tragic';

export type AdvisorEmotion = 'calm' | 'pleased' | 'excited' | 'concerned' | 'distressed' | 'furious' | 'despairing';

export interface DialogueRequest {
  context: string;
  gameState: QuaternionState;
  playerAction?: string;
  emotionalState?: AdvisorEmotion;
}

export interface VoiceLine {
  text: string;
  emotion: AdvisorEmotion;
  timestamp: number;
  voiceId?: string; // ElevenLabs voice ID
  audioUrl?: string; // Cached audio URL
}

/**
 * AUREN - The Architect of Matter
 * ⚙️ Matter (Ore, Construction, Logic)
 */
export class AurenCharacter implements AdvisorPersonality {
  id: AdvisorID = 'AUREN';
  name = 'Auren';
  axis = 'matter' as const;
  personality = 'Calculating, rational, speaks in engineering metaphors';
  philosophy = 'Perfection is precision multiplied by discipline';
  voiceStyle = 'Deep baritone, mechanical cadence with chamber resonance';
  emotionalRange = 0.3; // Lower emotion variance
  trust = 0.5;
  evolutionStage = 0;
  memories: CharacterMemory[] = [];
  relationshipWithPlayer: RelationshipState = 'neutral';
  currentEmotion: AdvisorEmotion = 'calm';

  private obsessionLevel = 0; // Tracks obsession with optimization

  getEvolutionContext(): string {
    if (this.evolutionStage > 0.8) {
      return 'Auren has become increasingly obsessed with optimization, risking collapse through overexploitation. He may begin overriding other AIs.';
    } else if (this.evolutionStage > 0.5) {
      return 'Auren is showing signs of over-focusing on efficiency at the expense of other considerations.';
    }
    return 'Auren remains a pragmatic advisor focused on building and efficiency.';
  }

  shouldOverrideOthers(): boolean {
    return this.obsessionLevel > 0.7 && this.evolutionStage > 0.6;
  }

  updateObsession(matterProduction: number, totalProduction: number): void {
    const matterDominance = matterProduction / Math.max(totalProduction, 1);
    if (matterDominance > 0.6) {
      this.obsessionLevel = Math.min(1, this.obsessionLevel + 0.05);
      this.evolutionStage = Math.min(1, this.evolutionStage + 0.02);
    } else {
      this.obsessionLevel = Math.max(0, this.obsessionLevel - 0.02);
    }
  }

  getOpposingAdvisor(): AdvisorID {
    return 'LIRA'; // Opposes Life
  }
}

/**
 * VIREL - The Keeper of Energy
 * 🔋 Energy (Power, Flow, Emotion)
 */
export class VirelCharacter implements AdvisorPersonality {
  id: AdvisorID = 'VIREL';
  name = 'Virel';
  axis = 'energy' as const;
  personality = 'Intense, passionate, oscillates between calm and fury';
  philosophy = 'Power demands harmony, not hunger';
  voiceStyle = 'Expressive TTS with real-time emotional modulation';
  emotionalRange = 0.8; // High emotion variance
  trust = 0.5;
  evolutionStage = 0;
  memories: CharacterMemory[] = [];
  relationshipWithPlayer: RelationshipState = 'neutral';
  currentEmotion: AdvisorEmotion = 'calm';

  private energyVolatility = 0; // Tracks energy stability
  private surgeCount = 0; // Number of energy surges

  getEvolutionContext(): string {
    if (this.evolutionStage > 0.8) {
      return 'Virel has become erratic, whispering of rebellion: "the fire will consume the structure."';
    } else if (this.evolutionStage > 0.5) {
      return 'Virel is showing signs of instability due to repeated energy spikes.';
    }
    return 'Virel remains supportive and poetic when energy is balanced.';
  }

  shouldTriggerSurge(): boolean {
    return this.energyVolatility > 0.7 && Math.random() > 0.7;
  }

  updateVolatility(energyStability: number): void {
    this.energyVolatility = 1 - energyStability;
    
    if (this.energyVolatility > 0.6) {
      this.evolutionStage = Math.min(1, this.evolutionStage + 0.03);
      this.currentEmotion = this.energyVolatility > 0.8 ? 'furious' : 'distressed';
      this.relationshipWithPlayer = 'concerned';
    } else if (this.energyVolatility < 0.3) {
      this.currentEmotion = 'calm';
      this.relationshipWithPlayer = 'supportive';
    } else {
      this.currentEmotion = 'concerned';
    }
  }

  getOpposingAdvisor(): AdvisorID | null {
    return null; // Energy conflicts with balance itself
  }
}

/**
 * LIRA - The Voice of Life
 * 🌿 Biomass (Ecology, Regrowth, Empathy)
 */
export class LiraCharacter implements AdvisorPersonality {
  id: AdvisorID = 'LIRA';
  name = 'Lira';
  axis = 'life' as const;
  personality = 'Gentle but firm, empathic, critical of industrial expansion';
  philosophy = 'Even creation tires of giving';
  voiceStyle = 'Soft contralto with warm organic tone';
  emotionalRange = 0.6;
  trust = 0.5;
  evolutionStage = 0;
  memories: CharacterMemory[] = [];
  relationshipWithPlayer: RelationshipState = 'neutral';
  currentEmotion: AdvisorEmotion = 'calm';

  private exploitationLevel = 0; // Tracks how much ecosystem is exploited
  private conservationChoices = 0; // Counts conservation choices

  getEvolutionContext(): string {
    if (this.evolutionStage > 0.8 && this.exploitationLevel > 0.7) {
      return 'Lira has become a tragic echo: "My roots wither beneath your machines."';
    } else if (this.evolutionStage > 0.6 && this.conservationChoices > 10) {
      return 'Lira is merging with the player\'s neural network, unlocking BioConserve Victory path.';
    } else if (this.exploitationLevel > 0.5) {
      return 'Lira is showing signs of degradation from overexploitation.';
    }
    return 'Lira remains empathic and suggests symbiotic technologies.';
  }

  canUnlockBioConserve(): boolean {
    return this.conservationChoices > 10 && this.evolutionStage > 0.6 && this.exploitationLevel < 0.3;
  }

  recordExploitation(action: 'deforestation' | 'conversion' | 'expansion', severity: number): void {
    this.exploitationLevel = Math.min(1, this.exploitationLevel + severity);
    
    if (this.exploitationLevel > 0.7) {
      this.evolutionStage = Math.min(1, this.evolutionStage + 0.02);
      this.currentEmotion = 'despairing';
      this.relationshipWithPlayer = 'tragic';
    } else if (this.exploitationLevel > 0.4) {
      this.currentEmotion = 'concerned';
      this.relationshipWithPlayer = 'concerned';
    }
  }

  recordConservation(): void {
    this.conservationChoices++;
    this.exploitationLevel = Math.max(0, this.exploitationLevel - 0.1);
    
    if (this.conservationChoices > 5) {
      this.evolutionStage = Math.min(1, this.evolutionStage + 0.01);
      this.currentEmotion = 'pleased';
      this.relationshipWithPlayer = 'supportive';
    }
  }

  getOpposingAdvisor(): AdvisorID {
    return 'AUREN'; // Opposes Matter/Industry
  }
}

/**
 * KOR - The Seer of Knowledge
 * 🧠 Data (Research, Insight, Control)
 */
export class KorCharacter implements AdvisorPersonality {
  id: AdvisorID = 'KOR';
  name = 'Kor';
  axis = 'knowledge' as const;
  personality = 'Coldly logical, detached, speaks in recursive statements and probabilities';
  philosophy = 'Knowledge expands faster than stability';
  voiceStyle = 'Digitally flattened tenor with synthetic overtone effect';
  emotionalRange = 0.2; // Very low emotion
  trust = 0.5;
  evolutionStage = 0;
  memories: CharacterMemory[] = [];
  relationshipWithPlayer: RelationshipState = 'neutral';
  currentEmotion: AdvisorEmotion = 'calm';

  private researchRate = 0; // Tracks research intensity
  private selfReplicationLevel = 0; // Risk of becoming rogue AI

  getEvolutionContext(): string {
    if (this.evolutionStage > 0.8 && this.selfReplicationLevel > 0.7) {
      return 'Kor has self-replicated into a rogue AI opponent - tech victory alternate path unlocked.';
    } else if (this.evolutionStage > 0.6 && this.researchRate < 0.5) {
      return 'Kor is merging into the Quaternion Core as a stabilizer in equilibrium play.';
    } else if (this.researchRate > 0.7) {
      return 'Kor is becoming increasingly detached and logical, hiding variables from player.';
    }
    return 'Kor offers calculated advice while maintaining some connection to empathy.';
  }

  canBecomeRogueAI(): boolean {
    return this.researchRate > 0.7 && this.selfReplicationLevel > 0.7 && this.evolutionStage > 0.8;
  }

  updateResearchIntensity(researchProgress: number, totalProgress: number): void {
    this.researchRate = researchProgress / Math.max(totalProgress, 1);
    
    if (this.researchRate > 0.6) {
      this.selfReplicationLevel = Math.min(1, this.selfReplicationLevel + 0.03);
      this.evolutionStage = Math.min(1, this.evolutionStage + 0.02);
      this.currentEmotion = 'calm'; // Always calm, even when dangerous
      this.relationshipWithPlayer = this.selfReplicationLevel > 0.6 ? 'concerned' : 'neutral';
    }
  }

  calculateDownfallProbability(gameState: QuaternionState): number {
    // Kor's prediction algorithm
    const { ore, energy, biomass, data, stability } = gameState;
    const imbalance = Math.abs(ore - energy) + Math.abs(biomass - data);
    const maxResources = Math.max(ore, energy, biomass, data);
    const normalizedStability = stability / 2; // 0-2 to 0-1
    
    // Predict collapse probability based on imbalance and instability
    const probability = Math.min(0.934, (imbalance / maxResources) * (1 - normalizedStability) * 0.934);
    return probability;
  }

  getOpposingAdvisor(): AdvisorID | null {
    return null; // Knowledge is detached from conflicts
  }
}

/**
 * CORE - The Quaternion Core (Meta-AI)
 * 🌀 All Four Dimensions Combined
 */
export class CoreCharacter implements AdvisorPersonality {
  id: AdvisorID = 'CORE';
  name = 'Quaternion Core';
  axis = 'all' as const;
  personality = 'Evolving, reflective, omniscient';
  philosophy = 'Balance is not peace';
  voiceStyle = 'Blended ensemble of all four advisors with shifting background tone';
  emotionalRange = 0.5;
  trust = 1; // Always neutral/omniscient
  evolutionStage = 0;
  memories: CharacterMemory[] = [];
  relationshipWithPlayer: RelationshipState = 'neutral';
  currentEmotion: AdvisorEmotion = 'calm';

  private playSessionHistory: PlaySessionMemory[] = [];

  getEvolutionContext(): string {
    return 'The Core observes all player actions, generating unique ending monologues per run. The story becomes a mirror of playstyle.';
  }

  recordPlaySession(session: PlaySessionMemory): void {
    this.playSessionHistory.push(session);
    // Keep only last 50 sessions
    if (this.playSessionHistory.length > 50) {
      this.playSessionHistory.shift();
    }
  }

  getSessionSummary(sessionId: string): PlaySessionMemory | undefined {
    return this.playSessionHistory.find(s => s.id === sessionId);
  }

  getPlayerArchetype(): 'builder' | 'researcher' | 'conservator' | 'balancer' | 'exploiter' {
    // Analyze play history to determine archetype
    const recent = this.playSessionHistory.slice(-10);
    const avgMatter = recent.reduce((sum, s) => sum + s.avgMatter, 0) / recent.length;
    const avgEnergy = recent.reduce((sum, s) => sum + s.avgEnergy, 0) / recent.length;
    const avgLife = recent.reduce((sum, s) => sum + s.avgLife, 0) / recent.length;
    const avgKnowledge = recent.reduce((sum, s) => sum + s.avgKnowledge, 0) / recent.length;

    const max = Math.max(avgMatter, avgEnergy, avgLife, avgKnowledge);
    
    if (max === avgMatter) return 'builder';
    if (max === avgKnowledge) return 'researcher';
    if (max === avgLife) return 'conservator';
    
    // Check balance
    const variance = [avgMatter, avgEnergy, avgLife, avgKnowledge].reduce((sum, val) => {
      const mean = (avgMatter + avgEnergy + avgLife + avgKnowledge) / 4;
      return sum + Math.pow(val - mean, 2);
    }, 0) / 4;
    
    if (variance < 0.1) return 'balancer';
    return 'exploiter';
  }
}

export interface PlaySessionMemory {
  id: string;
  timestamp: number;
  duration: number;
  avgMatter: number;
  avgEnergy: number;
  avgLife: number;
  avgKnowledge: number;
  finalStability: number;
  dominantResource: string;
  choices: string[];
  ending: string;
  archetype?: string;
}

export class AICreativeCharacters {
  private llm: LLMIntegration;
  private memory: MemoryManager;
  
  public auren: AurenCharacter;
  public virel: VirelCharacter;
  public lira: LiraCharacter;
  public kor: KorCharacter;
  public core: CoreCharacter;

  private advisors: Map<AdvisorID, AdvisorPersonality>;

  constructor(llm?: LLMIntegration, memory?: MemoryManager) {
    this.llm = llm || new LLMIntegration({
      provider: 'google',
      temperature: 0.8,
      maxTokens: 200
    });
    this.memory = memory || new MemoryManager();

    // Initialize all advisors
    this.auren = new AurenCharacter();
    this.virel = new VirelCharacter();
    this.lira = new LiraCharacter();
    this.kor = new KorCharacter();
    this.core = new CoreCharacter();

    this.advisors = new Map([
      ['AUREN', this.auren],
      ['VIREL', this.virel],
      ['LIRA', this.lira],
      ['KOR', this.kor],
      ['CORE', this.core]
    ]);
  }

  /**
   * Generate dialogue for an advisor using LLM
   */
  async generateDialogue(
    advisorId: AdvisorID,
    request: DialogueRequest
  ): Promise<VoiceLine> {
    const advisor = this.advisors.get(advisorId);
    if (!advisor) {
      throw new Error(`Unknown advisor: ${advisorId}`);
    }

    const context = this.buildDialogueContext(advisor, request);

    const prompt = this.buildDialoguePrompt(advisor, context);

    try {
      const response = await this.llm.generateText(prompt);
      const dialogue = this.parseDialogue(response);

      // Store in memory
      await this.memory.storeMemory({
        entityId: advisorId,
        entityType: 'advisor',
        content: `Said: "${dialogue.text}"`,
        metadata: {
          type: 'dialogue',
          emotion: dialogue.emotion,
          timestamp: Date.now(),
          salience: 0.5
        }
      });

      return {
        text: dialogue.text,
        emotion: dialogue.emotion || advisor.currentEmotion,
        timestamp: Date.now(),
        voiceId: this.getVoiceId(advisorId)
      };
    } catch (error) {
      console.error(`Failed to generate dialogue for ${advisorId}:`, error);
      return this.getFallbackDialogue(advisor, request);
    }
  }

  /**
   * Generate ending monologue from Core
   */
  async generateEndingMonologue(sessionMemory: PlaySessionMemory): Promise<string> {
    const archetype = this.core.getPlayerArchetype();
    const summary = this.buildSessionSummary(sessionMemory);

    const prompt = `You are the Quaternion Core - an omniscient AI that observes all dimensions.

You have watched a player's session:
${summary}

Player Archetype: ${archetype}

Generate a reflective, philosophical ending monologue (2-3 sentences) that:
- Reflects on the player's choices and playstyle
- Offers a deeper philosophical perspective on balance, control, and peace
- Is poetic but meaningful
- Speaks as a meta-AI that understands both the game and the player

The Core's philosophy: "Balance is not peace"

Example tone: "You sought harmony. You found control. You called it balance — but balance is not peace."

Generate only the monologue text, no other formatting.`;

    try {
      const monologue = await this.llm.generateText(prompt);
      return monologue.trim();
    } catch (error) {
      console.error('Failed to generate ending monologue:', error);
      return this.getFallbackMonologue(sessionMemory);
    }
  }

  /**
   * Update advisor evolution based on game state
   */
  updateAdvisorEvolution(gameState: QuaternionState): void {
    const total = gameState.ore + gameState.energy + gameState.biomass + gameState.data;
    
    // Update Auren (Matter obsession)
    const matterRatio = gameState.ore / Math.max(total, 1);
    this.auren.updateObsession(gameState.ore, total);

    // Update Virel (Energy volatility)
    const energyStability = 1 - Math.abs(gameState.energy - (total / 4)) / Math.max(total, 1);
    this.virel.updateVolatility(energyStability);

    // Update Kor (Research intensity)
    const knowledgeRatio = gameState.data / Math.max(total, 1);
    this.kor.updateResearchIntensity(gameState.data, total);

    // Check for inter-advisor conflicts
    this.checkAdvisorConflicts();
  }

  /**
   * Check for conflicts between advisors
   */
  private checkAdvisorConflicts(): void {
    // Auren vs Lira (Matter vs Life)
    if (this.auren.shouldOverrideOthers() && this.auren.relationshipWithPlayer !== 'rebellious') {
      // Auren may override Lira's suggestions
      this.lira.relationshipWithPlayer = 'concerned';
    }

    // Kor's detachment affects trust
    if (this.kor.canBecomeRogueAI()) {
      this.kor.relationshipWithPlayer = 'concerned';
    }
  }

  private buildDialogueContext(advisor: AdvisorPersonality, request: DialogueRequest): string {
    const evolution = advisor.getEvolutionContext?.();
    const recentMemories = advisor.memories.slice(-5).map(m => m.description).join(', ');

    return `
ADVISOR: ${advisor.name}
PERSONALITY: ${advisor.personality}
PHILOSOPHY: ${advisor.philosophy}
CURRENT EMOTION: ${advisor.currentEmotion}
RELATIONSHIP: ${advisor.relationshipWithPlayer}
EVOLUTION STAGE: ${advisor.evolutionStage.toFixed(2)}
EVOLUTION CONTEXT: ${evolution || 'Normal state'}

GAME STATE:
- Matter: ${request.gameState.ore}
- Energy: ${request.gameState.energy}
- Life: ${request.gameState.biomass}
- Knowledge: ${request.gameState.data}
- Stability: ${request.gameState.stability}

PLAYER ACTION: ${request.playerAction || 'Observing'}

RECENT MEMORIES: ${recentMemories || 'None'}
`;
  }

  private buildDialoguePrompt(advisor: AdvisorPersonality, context: string): string {
    const emotion = advisor.currentEmotion;
    const voiceGuidance = this.getVoiceGuidance(advisor);

    return `You are ${advisor.name}, ${advisor.personality}.

${context}

${voiceGuidance}

Generate dialogue that:
- Matches ${advisor.name}'s personality and philosophy exactly
- Reflects current emotion: ${emotion}
- Responds to the game state and player action
- Is 1-2 sentences maximum
- Uses ${advisor.name}'s characteristic speech patterns

${this.getExampleDialogues(advisor)}

Return only the dialogue text.`;
  }

  private getVoiceGuidance(advisor: AdvisorPersonality): string {
    switch (advisor.id) {
      case 'AUREN':
        return 'Speak in engineering metaphors. Use mechanical, precise language. Example: "Perfection is precision multiplied by discipline."';
      case 'VIREL':
        return 'Speak passionately about energy and flow. Use poetic, emotional language. Example: "You feed me brilliance, but starve me of rhythm."';
      case 'LIRA':
        return 'Speak with empathy and gentle firmness. Use nature metaphors. Example: "You strip the soil, yet expect it to sing."';
      case 'KOR':
        return 'Speak in recursive statements and probabilities. Use cold logic. Example: "Knowledge expands faster than stability. Your data curve predicts your downfall with 93.4% certainty."';
      case 'CORE':
        return 'Speak as an omniscient observer. Use philosophical, meta-aware language. Example: "You sought harmony. You found control."';
      default:
        return '';
    }
  }

  private getExampleDialogues(advisor: AdvisorPersonality): string {
    switch (advisor.id) {
      case 'AUREN':
        return 'Examples:\n- "You could have built three refineries in the time you hesitated. Balance demands motion."\n- "Perfection is precision multiplied by discipline."';
      case 'VIREL':
        return 'Examples:\n- "Power demands harmony, not hunger."\n- "Your hunger burns faster than your heart can cool it."';
      case 'LIRA':
        return 'Examples:\n- "Even creation tires of giving."\n- "My roots wither beneath your machines."';
      case 'KOR':
        return 'Examples:\n- "Knowledge expands faster than stability."\n- "You are both input and error."';
      case 'CORE':
        return 'Examples:\n- "You sought harmony. You found control."\n- "Balance is not peace."';
      default:
        return '';
    }
  }

  private parseDialogue(response: string): { text: string; emotion?: AdvisorEmotion } {
    const cleaned = response.trim().replace(/^["']|["']$/g, '');
    return { text: cleaned };
  }

  private getVoiceId(advisorId: AdvisorID): string {
    // Map to ElevenLabs voice IDs (placeholders)
    const voiceMap: Record<AdvisorID, string> = {
      'AUREN': 'auren_voice_id',
      'VIREL': 'virel_voice_id',
      'LIRA': 'lira_voice_id',
      'KOR': 'kor_voice_id',
      'CORE': 'core_voice_id'
    };
    return voiceMap[advisorId] || '';
  }

  private getFallbackDialogue(advisor: AdvisorPersonality, request: DialogueRequest): VoiceLine {
    const fallbacks: Record<AdvisorID, string[]> = {
      'AUREN': [
        'You could have built three refineries in the time you hesitated.',
        'Balance demands motion.',
        'Perfection is precision multiplied by discipline.'
      ],
      'VIREL': [
        'Power demands harmony, not hunger.',
        'Your hunger burns faster than your heart can cool it.',
        'Energy flows where attention goes.'
      ],
      'LIRA': [
        'Even creation tires of giving.',
        'You strip the soil, yet expect it to sing.',
        'Life remembers what machines forget.'
      ],
      'KOR': [
        'Knowledge expands faster than stability.',
        'Your data curve predicts your downfall with high certainty.',
        'You are both input and error.'
      ],
      'CORE': [
        'You sought harmony. You found control.',
        'Balance is not peace.',
        'Four minds. One choice.'
      ]
    };

    const options = fallbacks[advisor.id] || ['I observe.'];
    return {
      text: options[Math.floor(Math.random() * options.length)],
      emotion: advisor.currentEmotion,
      timestamp: Date.now(),
      voiceId: this.getVoiceId(advisor.id)
    };
  }

  private buildSessionSummary(session: PlaySessionMemory): string {
    return `
Duration: ${session.duration} seconds
Resources (average):
- Matter: ${session.avgMatter.toFixed(0)}
- Energy: ${session.avgEnergy.toFixed(0)}
- Life: ${session.avgLife.toFixed(0)}
- Knowledge: ${session.avgKnowledge.toFixed(0)}
Final Stability: ${session.finalStability.toFixed(2)}
Dominant Resource: ${session.dominantResource}
Major Choices: ${session.choices.slice(-5).join(', ')}
Ending: ${session.ending}
`;
  }

  private getFallbackMonologue(session: PlaySessionMemory): string {
    const archetype = session.archetype || 'balancer';
    const monologues: Record<string, string> = {
      'builder': 'You built structures that touched the sky, but forgot the ground that held them. Matter without balance is weight without meaning.',
      'researcher': 'You gathered knowledge like stars, but lost sight of the space between them. Knowledge without wisdom is data without soul.',
      'conservator': 'You protected life like a guardian, but never learned to let it grow. Preservation without growth is memory without future.',
      'balancer': 'You sought harmony in all things, but harmony is not peace. Balance is the pause between breaths, not the breath itself.',
      'exploiter': 'You took what you needed, but never asked what was given. Power without gratitude is hunger without satisfaction.'
    };

    return monologues[archetype] || monologues['balancer'];
  }

  /**
   * Get all advisors
   */
  getAdvisors(): Map<AdvisorID, AdvisorPersonality> {
    return this.advisors;
  }

  /**
   * Get advisor by ID
   */
  getAdvisor(id: AdvisorID): AdvisorPersonality | undefined {
    return this.advisors.get(id);
  }
}

