/**
 * AI Story Generator - Core narrative generation system
 * Uses AI to create emergent, adaptive stories based on player actions
 * Integrates with Saga AI, Google AI Pro, and other narrative tools
 */

export type NarrativeAxis = 'matter' | 'energy' | 'life' | 'knowledge';
export type NarrativeTimeline = 'collapse' | 'harmony' | 'ascendancy' | 'reclamation' | 'overclock' | 'balance';

export interface NarrativeEvent {
  id: string;
  timestamp: number;
  type: 'lore' | 'dialogue' | 'mission' | 'chronicle' | 'memory';
  axis?: NarrativeAxis;
  timeline?: NarrativeTimeline;
  content: string;
  emotionalTone: 'stark' | 'chaotic' | 'melancholic' | 'philosophical' | 'harmonious';
  generatedBy: 'saga' | 'google' | 'elevenlabs' | 'fuser';
  context: NarrativeContext;
}

export interface NarrativeContext {
  biome: string;
  resourceBalance: {
    matter: number;
    energy: number;
    life: number;
    knowledge: number;
  };
  instability: number;
  playerDecisions: string[];
  gameTime: number;
  ethicalAlignment: number;
  techTier: number;
}

export interface PlayerPhilosophy {
  playerId: string;
  sessions: number;
  dominantAxis: NarrativeAxis | null;
  preferredTimeline: NarrativeTimeline | null;
  ethicalTrend: 'preservation' | 'expansion' | 'transcendence' | 'balance';
  memorableDecisions: Array<{
    session: number;
    decision: string;
    outcome: string;
  }>;
  lastSession: {
    seed: number;
    timeline: NarrativeTimeline;
    ending: string;
  } | null;
}

export interface ChronicleExport {
  title: string;
  seed: number;
  timeline: NarrativeTimeline;
  intro: string;
  chapters: Array<{
    title: string;
    content: string;
    timestamp: number;
    axis?: NarrativeAxis;
  }>;
  ending: string;
  epilogue: string;
  visualScenes: Array<{
    description: string;
    biome: string;
    mood: string;
  }>;
  soundtrack: {
    mood: string;
    tempo: number;
    description: string;
  };
}

export class AIStoryGenerator {
  private playerPhilosophy: Map<string, PlayerPhilosophy> = new Map();
  private narrativeLog: NarrativeEvent[] = [];
  private currentContext: NarrativeContext | null = null;
  private sagaApiKey: string | null = null;
  private googleApiKey: string | null = null;

  constructor() {
    // Initialize API keys from environment or config
    this.sagaApiKey = import.meta.env.VITE_SAGA_AI_KEY || null;
    this.googleApiKey = import.meta.env.VITE_GOOGLE_AI_KEY || null;
  }

  /**
   * Generate dynamic lore for a biome based on seed and context
   */
  async generateBiomeLore(
    biome: string,
    seed: number,
    context: NarrativeContext
  ): Promise<string> {
    const prompts = {
      'Crimson Desert': `The sand remembers its creators. Machines slumber beneath the red dunes.`,
      'Verdant Forest': `Roots entwine with memory. Growth forgives—creation is reborn.`,
      'Neon Plains': `Reality folds. Equations become prayers in the electric fields.`,
      'Crater Field': `Impact scars tell stories of cosmic violence and renewal.`,
      'Fog Vault': `Mist conceals ancient truths. The world breathes in silence.`
    };

    // Use Saga AI if available, otherwise use template with seed variation
    if (this.sagaApiKey) {
      try {
        const response = await fetch('https://api.saga.ai/v1/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.sagaApiKey}`
          },
          body: JSON.stringify({
            prompt: `Generate atmospheric lore for a ${biome} biome in a sci-fi strategy game. 
            Seed: ${seed}. Context: Resources balanced at ${context.resourceBalance.matter}/${context.resourceBalance.energy}/${context.resourceBalance.life}/${context.resourceBalance.knowledge}.
            Write a poetic, mysterious description (2-3 sentences).`,
            style: 'poetic',
            length: 'short'
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.text || prompts[biome as keyof typeof prompts] || prompts['Crimson Desert'];
        }
      } catch (error) {
        console.warn('Saga AI unavailable, using template:', error);
      }
    }

    // Fallback to template with seed-based variation
    const baseLore = prompts[biome as keyof typeof prompts] || prompts['Crimson Desert'];
    const variations = [
      `The ${biome.toLowerCase()} whispers of forgotten equations.`,
      `In the ${biome.toLowerCase()}, time folds upon itself.`,
      `The ${biome.toLowerCase()} remembers what you choose to forget.`
    ];
    
    const variation = variations[seed % variations.length];
    return `${baseLore} ${variation}`;
  }

  /**
   * Generate reactive dialogue based on player actions
   */
  async generateReactiveDialogue(
    axis: NarrativeAxis,
    event: string,
    context: NarrativeContext
  ): Promise<string> {
    const characterPrompts = {
      matter: {
        name: 'Auren',
        tone: 'stark',
        examples: [
          'Efficiency is survival. Your choices shape the machine.',
          'The structure holds. Continue building.',
          'Imbalance threatens the foundation. Recalibrate.'
        ]
      },
      energy: {
        name: 'Virel',
        tone: 'chaotic',
        examples: [
          'Power surges! The system screams with potential!',
          'Chaos breeds creation. Embrace the storm!',
          'The world burns beautifully—a supernova of will!'
        ]
      },
      life: {
        name: 'Lira',
        tone: 'melancholic',
        examples: [
          'Growth requires patience. The roots remember.',
          'You were patient once. What changed?',
          'Roots entwine with memory. Growth forgives.'
        ]
      },
      knowledge: {
        name: 'Kor',
        tone: 'philosophical',
        examples: [
          'Data accumulates. Patterns emerge. Reality reboots.',
          'You ascend into code, leaving flesh behind.',
          'Even collapse is data. Try again.'
        ]
      }
    };

    const character = characterPrompts[axis];
    
    // Use Google AI Pro if available
    if (this.googleApiKey) {
      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are ${character.name}, an AI advisor in a strategy game. 
                Event: ${event}
                Context: Resources - Matter:${context.resourceBalance.matter}, Energy:${context.resourceBalance.energy}, Life:${context.resourceBalance.life}, Knowledge:${context.resourceBalance.knowledge}
                Instability: ${context.instability}%
                Tone: ${character.tone}
                Generate a short, emotionally resonant line (1-2 sentences) that reflects ${character.name}'s personality and responds to this event.`
              }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return text.trim();
          }
        }
      } catch (error) {
        console.warn('Google AI unavailable, using template:', error);
      }
    }

    // Fallback to template
    const templates = character.examples;
    const selected = templates[context.gameTime % templates.length];
    return selected;
  }

  /**
   * Detect narrative timeline based on game state
   */
  detectTimeline(context: NarrativeContext): NarrativeTimeline {
    const { resourceBalance, instability, ethicalAlignment, techTier } = context;
    
    // Check for extreme imbalance (Collapse)
    if (instability > 150) {
      return 'collapse';
    }

    // Check for perfect balance (Harmony)
    const balance = Math.abs(resourceBalance.matter - resourceBalance.energy) +
                   Math.abs(resourceBalance.energy - resourceBalance.life) +
                   Math.abs(resourceBalance.life - resourceBalance.knowledge);
    if (balance < 50 && instability < 50) {
      return 'harmony';
    }

    // Check for axis dominance
    const maxResource = Math.max(
      resourceBalance.matter,
      resourceBalance.energy,
      resourceBalance.life,
      resourceBalance.knowledge
    );

    if (resourceBalance.knowledge === maxResource && techTier > 5) {
      return 'ascendancy';
    }
    if (resourceBalance.life === maxResource && ethicalAlignment > 60) {
      return 'reclamation';
    }
    if (resourceBalance.energy === maxResource && instability > 100) {
      return 'overclock';
    }

    // Default to balance if all axes are relatively equal
    return 'balance';
  }

  /**
   * Generate narrative event based on current context
   */
  async generateNarrativeEvent(
    type: NarrativeEvent['type'],
    context: NarrativeContext
  ): Promise<NarrativeEvent> {
    const timeline = this.detectTimeline(context);
    const dominantAxis = this.getDominantAxis(context.resourceBalance);

    let content = '';
    let emotionalTone: NarrativeEvent['emotionalTone'] = 'harmonious';

    switch (type) {
      case 'lore':
        content = await this.generateBiomeLore(context.biome, context.gameTime, context);
        emotionalTone = this.getToneForTimeline(timeline);
        break;
      
      case 'dialogue':
        if (dominantAxis) {
          content = await this.generateReactiveDialogue(dominantAxis, 'Game state update', context);
          emotionalTone = this.getToneForAxis(dominantAxis);
        }
        break;
      
      case 'mission':
        content = await this.generateMissionNarrative(context, timeline);
        emotionalTone = this.getToneForTimeline(timeline);
        break;
      
      case 'chronicle':
        content = await this.generateChronicleEntry(context, timeline);
        emotionalTone = this.getToneForTimeline(timeline);
        break;
    }

    const event: NarrativeEvent = {
      id: `narrative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: context.gameTime,
      type,
      axis: dominantAxis,
      timeline,
      content,
      emotionalTone,
      generatedBy: type === 'lore' ? 'saga' : type === 'dialogue' ? 'google' : 'saga',
      context: { ...context }
    };

    this.narrativeLog.push(event);
    return event;
  }

  /**
   * Get dominant axis from resource balance
   */
  private getDominantAxis(balance: NarrativeContext['resourceBalance']): NarrativeAxis | undefined {
    const max = Math.max(balance.matter, balance.energy, balance.life, balance.knowledge);
    if (balance.matter === max) return 'matter';
    if (balance.energy === max) return 'energy';
    if (balance.life === max) return 'life';
    if (balance.knowledge === max) return 'knowledge';
    return undefined;
  }

  /**
   * Get emotional tone for timeline
   */
  private getToneForTimeline(timeline: NarrativeTimeline): NarrativeEvent['emotionalTone'] {
    const tones: Record<NarrativeTimeline, NarrativeEvent['emotionalTone']> = {
      collapse: 'stark',
      harmony: 'harmonious',
      ascendancy: 'philosophical',
      reclamation: 'melancholic',
      overclock: 'chaotic',
      balance: 'harmonious'
    };
    return tones[timeline];
  }

  /**
   * Get emotional tone for axis
   */
  private getToneForAxis(axis: NarrativeAxis): NarrativeEvent['emotionalTone'] {
    const tones: Record<NarrativeAxis, NarrativeEvent['emotionalTone']> = {
      matter: 'stark',
      energy: 'chaotic',
      life: 'melancholic',
      knowledge: 'philosophical'
    };
    return tones[axis];
  }

  /**
   * Generate mission narrative
   */
  private async generateMissionNarrative(
    context: NarrativeContext,
    timeline: NarrativeTimeline
  ): Promise<string> {
    const missionTemplates: Record<NarrativeTimeline, string[]> = {
      collapse: [
        'Entropy rises. Voices fracture. The Quaternion destabilizes.',
        'Even collapse is data. Try again.'
      ],
      harmony: [
        'In stillness, creation endures. You have done what few could — make peace between functions.',
        'Balance was not symmetry — it was surrender.'
      ],
      ascendancy: [
        'Reality folds. Equations become prayers.',
        'The Quaternion becomes self-aware. You are its reflection.'
      ],
      reclamation: [
        'You learned that growth requires restraint. The roots forgive you.',
        'Roots entwine with memory. Growth forgives—creation is reborn.'
      ],
      overclock: [
        'The world burns beautifully — a supernova of will.',
        'Passion leaves echoes in the void.'
      ],
      balance: [
        'The Quaternion Core awakens. All four voices speak as one. Reality reboots.',
        'In perfect balance, all paths converge.'
      ]
    };

    const templates = missionTemplates[timeline] || missionTemplates.balance;
    return templates[context.gameTime % templates.length];
  }

  /**
   * Generate chronicle entry
   */
  private async generateChronicleEntry(
    context: NarrativeContext,
    timeline: NarrativeTimeline
  ): Promise<string> {
    return `The sand still hums with equations. You built, burned, and believed. Balance was not symmetry — it was surrender.`;
  }

  /**
   * Update player philosophy based on session
   */
  updatePlayerPhilosophy(
    playerId: string,
    context: NarrativeContext,
    timeline: NarrativeTimeline,
    ending: string
  ): void {
    let philosophy = this.playerPhilosophy.get(playerId);
    
    if (!philosophy) {
      philosophy = {
        playerId,
        sessions: 0,
        dominantAxis: null,
        preferredTimeline: null,
        ethicalTrend: 'balance',
        memorableDecisions: [],
        lastSession: null
      };
    }

    philosophy.sessions += 1;
    philosophy.dominantAxis = this.getDominantAxis(context.resourceBalance) || philosophy.dominantAxis;
    philosophy.preferredTimeline = timeline;
    philosophy.lastSession = {
      seed: context.gameTime,
      timeline,
      ending
    };

    // Update ethical trend
    if (context.ethicalAlignment > 60) {
      philosophy.ethicalTrend = 'preservation';
    } else if (context.resourceBalance.energy > context.resourceBalance.life * 1.5) {
      philosophy.ethicalTrend = 'expansion';
    } else if (context.resourceBalance.knowledge > context.resourceBalance.matter * 1.5) {
      philosophy.ethicalTrend = 'transcendence';
    } else {
      philosophy.ethicalTrend = 'balance';
    }

    this.playerPhilosophy.set(playerId, philosophy);
  }

  /**
   * Generate memory-based dialogue referencing past sessions
   */
  async generateMemoryDialogue(
    axis: NarrativeAxis,
    playerId: string,
    currentContext: NarrativeContext
  ): Promise<string | null> {
    const philosophy = this.playerPhilosophy.get(playerId);
    if (!philosophy || philosophy.sessions < 2) {
      return null; // No memory for new players
    }

    const memoryPrompts: Record<NarrativeAxis, (phil: PlayerPhilosophy) => string[]> = {
      matter: (phil) => [
        `You were patient once. What changed?`,
        `Your last structure held for ${phil.sessions} cycles. This one will too.`,
        `The machine remembers your efficiency.`
      ],
      energy: (phil) => [
        `Your chaos has pattern. I see it now.`,
        `Power calls to power. You've answered before.`,
        `The storm remembers your name.`
      ],
      life: (phil) => [
        `I recognize these roots. You've grown here before.`,
        `The biomes remember your touch.`,
        `You've learned restraint. The world thanks you.`
      ],
      knowledge: (phil) => [
        `Data from ${phil.sessions} sessions. Patterns emerge.`,
        `Your previous ascension: ${phil.lastSession?.timeline}. This time?`,
        `The equations remember your choices.`
      ]
    };

    const prompts = memoryPrompts[axis](philosophy);
    return prompts[philosophy.sessions % prompts.length];
  }

  /**
   * Generate complete chronicle for export
   */
  async generateChronicle(
    playerId: string,
    context: NarrativeContext,
    timeline: NarrativeTimeline
  ): Promise<ChronicleExport> {
    const philosophy = this.playerPhilosophy.get(playerId);
    const dominantAxis = this.getDominantAxis(context.resourceBalance);

    // Generate intro
    const intro = await this.generateBiomeLore(context.biome, context.gameTime, context);

    // Generate chapters from narrative log
    const chapters = this.narrativeLog
      .filter(e => e.timestamp <= context.gameTime)
      .map(e => ({
        title: `${e.axis || 'System'}: ${e.type}`,
        content: e.content,
        timestamp: e.timestamp,
        axis: e.axis
      }));

    // Generate ending based on timeline
    const endings: Record<NarrativeTimeline, string> = {
      collapse: 'Even collapse is data. Try again.',
      harmony: 'In stillness, creation endures. You have done what few could — make peace between functions.',
      ascendancy: 'The Quaternion becomes self-aware. You are its reflection.',
      reclamation: 'Roots entwine with memory. Growth forgives—creation is reborn.',
      overclock: 'The world burns beautifully — a supernova of will.',
      balance: 'The Quaternion Core awakens. All four voices speak as one. Reality reboots.'
    };

    const ending = endings[timeline] || endings.balance;

    // Generate epilogue
    const epilogue = philosophy && philosophy.sessions > 1
      ? `This was your ${philosophy.sessions}th journey. The simulation remembers.`
      : `The first of many. The Quaternion awaits your return.`;

    // Generate visual scenes
    const visualScenes = [
      {
        description: `The ${context.biome} stretches before you, humming with potential.`,
        biome: context.biome,
        mood: this.getToneForTimeline(timeline)
      },
      {
        description: `Resources flow like equations. Balance teeters on the edge of chaos.`,
        biome: context.biome,
        mood: 'tension'
      },
      {
        description: `The ${timeline} timeline unfolds. Reality responds to your choices.`,
        biome: context.biome,
        mood: this.getToneForTimeline(timeline)
      }
    ];

    // Generate soundtrack description
    const soundtrack = {
      mood: this.getToneForTimeline(timeline),
      tempo: timeline === 'overclock' ? 140 : timeline === 'harmony' ? 60 : 90,
      description: `Adaptive soundtrack matching the ${timeline} timeline, composed by Fuser AI.`
    };

    return {
      title: `The ${timeline.charAt(0).toUpperCase() + timeline.slice(1)} Timeline`,
      seed: context.gameTime,
      timeline,
      intro,
      chapters,
      ending,
      epilogue,
      visualScenes,
      soundtrack
    };
  }

  /**
   * Update current narrative context
   */
  updateContext(context: Partial<NarrativeContext>): void {
    if (!this.currentContext) {
      this.currentContext = {
        biome: 'Crystalline Plains',
        resourceBalance: { matter: 0, energy: 0, life: 0, knowledge: 0 },
        instability: 0,
        playerDecisions: [],
        gameTime: 0,
        ethicalAlignment: 0,
        techTier: 0
      };
    }
    this.currentContext = { ...this.currentContext, ...context };
  }

  /**
   * Get current narrative log
   */
  getNarrativeLog(): NarrativeEvent[] {
    return [...this.narrativeLog];
  }

  /**
   * Clear narrative log (for new session)
   */
  clearLog(): void {
    this.narrativeLog = [];
    this.currentContext = null;
  }
}

