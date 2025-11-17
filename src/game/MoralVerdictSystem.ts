/**
 * Core's Moral Verdict System - AI-Generated Endgame Narration
 * Generates personalized verdicts judging the player's playstyle
 */

export interface SessionAnalysis {
  efficiencyScore: number; // 0-10
  aggressionLevel: number; // 0-10
  ecoScore: number; // 0-10
  techScore: number; // 0-10
  keyDecisions: string[];
  notableEvents: string[];
  resourceBalance: Record<string, number>;
  moralAlignment: number; // -100 to 100
  gameTime: number;
}

export interface VerdictProfile {
  title: string;
  description: string;
  alignment: 'heroic' | 'tyrant' | 'gardener' | 'scientist' | 'balanced';
  narrationTemplates: string[];
  color: string;
}

export class MoralVerdictSystem {
  private verdictProfiles: Map<string, VerdictProfile>;

  constructor() {
    this.verdictProfiles = new Map();
    this.initializeVerdictProfiles();
  }

  private initializeVerdictProfiles(): void {
    this.verdictProfiles.set('heroic', {
      title: 'The Guardian',
      description: 'A protector who balanced all forces with wisdom',
      alignment: 'heroic',
      narrationTemplates: [
        'You stood as a guardian, maintaining harmony where chaos threatened.',
        'Your choices preserved the delicate balance of all things.',
        'Through wisdom and restraint, you achieved true equilibrium.'
      ],
      color: '#00ffea'
    });

    this.verdictProfiles.set('tyrant', {
      title: 'The Conqueror',
      description: 'A force of domination that crushed all opposition',
      alignment: 'tyrant',
      narrationTemplates: [
        'You forged a path of conquest, leaving imbalance in your wake.',
        'Power was your goal, and you achieved it through force.',
        'The world bent to your will, but at what cost?'
      ],
      color: '#ff4444'
    });

    this.verdictProfiles.set('gardener', {
      title: 'The Conservator',
      description: 'A nurturer who prioritized life above all',
      alignment: 'gardener',
      narrationTemplates: [
        'You chose life over efficiency, growth over conquest.',
        'The ecosystem flourished under your careful stewardship.',
        'You proved that preservation can be a path to victory.'
      ],
      color: '#50c878'
    });

    this.verdictProfiles.set('scientist', {
      title: 'The Ascendant',
      description: 'A seeker of knowledge who transcended through technology',
      alignment: 'scientist',
      narrationTemplates: [
        'Through knowledge, you ascended beyond mortal limitations.',
        'Technology was your path, and you walked it to the end.',
        'You unlocked the secrets of the universe through pure intellect.'
      ],
      color: '#9d4edd'
    });

    this.verdictProfiles.set('balanced', {
      title: 'The Harmonist',
      description: 'A master of perfect balance',
      alignment: 'balanced',
      narrationTemplates: [
        'You achieved the impossible: perfect harmony across all dimensions.',
        'In a world of extremes, you found the center.',
        'Your legacy is balance itself, a testament to true mastery.'
      ],
      color: '#ffd700'
    });
  }

  /**
   * Analyze a game session and determine moral alignment
   */
  analyzeSession(gameState: any, actionLog: any[]): SessionAnalysis {
    const player = gameState.players?.get(1);
    if (!player) {
      return this.getDefaultAnalysis();
    }

    // Calculate efficiency (resource utilization)
    const totalResources = (player.resources.ore || 0) + 
                          (player.resources.energy || 0) + 
                          (player.resources.biomass || 0) + 
                          (player.resources.data || 0);
    const efficiencyScore = Math.min(10, totalResources / 100);

    // Calculate aggression (combat actions vs peaceful)
    const combatActions = actionLog.filter(a => 
      a.type === 'attack' || a.type === 'build_unit' && a.data?.unitType === 'soldier'
    ).length;
    const peacefulActions = actionLog.filter(a => 
      a.type === 'build' || a.type === 'research'
    ).length;
    const aggressionLevel = Math.min(10, (combatActions / Math.max(1, peacefulActions)) * 5);

    // Calculate eco score (biomass focus)
    const ecoScore = Math.min(10, ((player.resources.biomass || 0) / 200) * 10);

    // Calculate tech score (research and data focus)
    const techScore = Math.min(10, 
      ((player.researchedTechs?.size || 0) / 5) * 5 + 
      ((player.resources.data || 0) / 200) * 5
    );

    // Extract key decisions
    const keyDecisions = actionLog
      .filter(a => a.type === 'research' || a.type === 'build' || a.type === 'moral_choice')
      .slice(-5)
      .map(a => `${a.type}: ${a.data?.techId || a.data?.buildingId || 'choice'}`);

    // Extract notable events
    const notableEvents = actionLog
      .filter(a => a.type === 'major_event' || a.type === 'victory' || a.type === 'defeat')
      .slice(-3)
      .map(a => a.data?.description || a.type);

    return {
      efficiencyScore,
      aggressionLevel,
      ecoScore,
      techScore,
      keyDecisions,
      notableEvents,
      resourceBalance: {
        ore: player.resources.ore || 0,
        energy: player.resources.energy || 0,
        biomass: player.resources.biomass || 0,
        data: player.resources.data || 0
      },
      moralAlignment: player.moralAlignment || 0,
      gameTime: gameState.gameTime || 0
    };
  }

  /**
   * Determine moral alignment from session analysis
   */
  determineMoralAlignment(analysis: SessionAnalysis): string {
    // Check for perfect balance
    const resourceVariance = this.calculateResourceVariance(analysis.resourceBalance);
    if (resourceVariance < 0.1 && analysis.moralAlignment > 50) {
      return 'balanced';
    }

    // High eco score -> gardener
    if (analysis.ecoScore > 7 && analysis.aggressionLevel < 3) {
      return 'gardener';
    }

    // High tech score -> scientist
    if (analysis.techScore > 7 && analysis.aggressionLevel < 4) {
      return 'scientist';
    }

    // High aggression -> tyrant
    if (analysis.aggressionLevel > 7) {
      return 'tyrant';
    }

    // Balanced approach -> heroic
    if (analysis.efficiencyScore > 6 && 
        analysis.aggressionLevel < 5 && 
        analysis.moralAlignment > 0) {
      return 'heroic';
    }

    // Default to balanced
    return 'balanced';
  }

  /**
   * Generate verdict narration (can be enhanced with LLM later)
   */
  generateVerdict(analysis: SessionAnalysis): {
    profile: VerdictProfile;
    narration: string;
  } {
    const alignment = this.determineMoralAlignment(analysis);
    const profile = this.verdictProfiles.get(alignment) || this.verdictProfiles.get('balanced')!;

    // Build context string for narration
    const context = this.buildNarrationContext(analysis, profile);

    // Generate narration (simplified - can be enhanced with LLM)
    const narration = this.generateNarrationText(analysis, profile, context);

    return {
      profile,
      narration
    };
  }

  private calculateResourceVariance(resources: Record<string, number>): number {
    const values = Object.values(resources);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance) / Math.max(avg, 1);
  }

  private buildNarrationContext(analysis: SessionAnalysis, profile: VerdictProfile): string {
    return `
      Player Profile:
      - Efficiency: ${analysis.efficiencyScore.toFixed(1)}/10
      - Aggression: ${analysis.aggressionLevel.toFixed(1)}/10
      - Ecological Concern: ${analysis.ecoScore.toFixed(1)}/10
      - Technological Focus: ${analysis.techScore.toFixed(1)}/10
      - Moral Alignment: ${analysis.moralAlignment}
      - Game Time: ${Math.floor(analysis.gameTime)}s
      
      Alignment: ${profile.title}
      Style: ${profile.description}
      
      Key Decisions: ${analysis.keyDecisions.join(', ')}
      Notable Events: ${analysis.notableEvents.join(', ')}
    `;
  }

  private generateNarrationText(
    analysis: SessionAnalysis,
    profile: VerdictProfile,
    context: string
  ): string {
    // Select a template
    const template = profile.narrationTemplates[
      Math.floor(Math.random() * profile.narrationTemplates.length)
    ];

    // Build personalized narration
    let narration = `${profile.title}\n\n`;
    narration += `${template}\n\n`;

    // Add specific details
    if (analysis.efficiencyScore > 7) {
      narration += 'Your resource management was exemplary, maximizing every opportunity.\n';
    }

    if (analysis.aggressionLevel > 6) {
      narration += 'You chose the path of force, overwhelming obstacles through sheer power.\n';
    } else if (analysis.aggressionLevel < 3) {
      narration += 'You navigated challenges with restraint, finding peaceful solutions.\n';
    }

    if (analysis.ecoScore > 7) {
      narration += 'Life flourished under your care, the ecosystem thriving.\n';
    }

    if (analysis.techScore > 7) {
      narration += 'Through knowledge and innovation, you transcended limitations.\n';
    }

    narration += `\nYour legacy: ${profile.description}`;

    return narration;
  }

  private getDefaultAnalysis(): SessionAnalysis {
    return {
      efficiencyScore: 5,
      aggressionLevel: 5,
      ecoScore: 5,
      techScore: 5,
      keyDecisions: [],
      notableEvents: [],
      resourceBalance: { ore: 0, energy: 0, biomass: 0, data: 0 },
      moralAlignment: 0,
      gameTime: 0
    };
  }
}

