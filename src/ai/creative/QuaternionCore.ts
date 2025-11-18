/**
 * Meta-AI: The Quaternion Core
 * Symbolic AI entity that measures balance and judges player philosophy
 * Uses LLM sentiment analysis to generate unique closing monologues
 */

import { LLMIntegration } from '../integrations/LLMIntegration';

export interface QuaternionBalance {
  matter: number; // 0-1
  energy: number; // 0-1
  life: number; // 0-1
  knowledge: number; // 0-1
}

export interface PlayLog {
  timestamp: number;
  action: string;
  axis: 'matter' | 'energy' | 'life' | 'knowledge';
  impact: number; // -1 to 1
}

export interface CoreJudgment {
  verdict: string;
  philosophy: string;
  balance: QuaternionBalance;
  variance: number; // How balanced (lower = more balanced)
  monologue: string;
  recommendations: string[];
}

export class QuaternionCore {
  private llm: LLMIntegration | null = null;
  private playLog: PlayLog[] = [];
  private currentBalance: QuaternionBalance = {
    matter: 0.5,
    energy: 0.5,
    life: 0.5,
    knowledge: 0.5
  };

  constructor(llmConfig?: { provider: 'google' | 'saga' | 'openai'; apiKey?: string }) {
    if (llmConfig) {
      this.llm = new LLMIntegration({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        temperature: 0.9,
        maxTokens: 400
      });
    }
  }

  /**
   * Record player action
   */
  recordAction(
    action: string,
    axis: 'matter' | 'energy' | 'life' | 'knowledge',
    impact: number
  ): void {
    this.playLog.push({
      timestamp: Date.now(),
      action,
      axis,
      impact
    });

    // Update balance
    this.currentBalance[axis] = Math.max(0, Math.min(1, 
      this.currentBalance[axis] + impact * 0.1
    ));
  }

  /**
   * Evaluate endgame and generate judgment
   */
  async evaluateEndgame(victory: boolean): Promise<CoreJudgment> {
    const variance = this.calculateVariance();
    const philosophy = this.determinePhilosophy();
    
    // Generate monologue
    const monologue = await this.generateMonologue(victory, philosophy, variance);
    
    // Generate verdict
    const verdict = this.generateVerdict(victory, variance);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(philosophy, variance);

    return {
      verdict,
      philosophy,
      balance: { ...this.currentBalance },
      variance,
      monologue,
      recommendations
    };
  }

  /**
   * Calculate balance variance
   */
  private calculateVariance(): number {
    const values = [
      this.currentBalance.matter,
      this.currentBalance.energy,
      this.currentBalance.life,
      this.currentBalance.knowledge
    ];

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Determine player philosophy
   */
  private determinePhilosophy(): string {
    const { matter, energy, life, knowledge } = this.currentBalance;
    
    // Find dominant axis
    const axes = [
      { name: 'matter', value: matter },
      { name: 'energy', value: energy },
      { name: 'life', value: life },
      { name: 'knowledge', value: knowledge }
    ];

    axes.sort((a, b) => b.value - a.value);
    const dominant = axes[0];
    const secondary = axes[1];

    // Analyze play log for patterns
    const actionPatterns = this.analyzeActionPatterns();

    if (dominant.value > 0.7) {
      if (dominant.name === 'matter') return 'Materialist';
      if (dominant.name === 'energy') return 'Energetic';
      if (dominant.name === 'life') return 'Vitalist';
      if (dominant.name === 'knowledge') return 'Intellectual';
    }

    if (actionPatterns.includes('aggressive')) return 'Dominator';
    if (actionPatterns.includes('defensive')) return 'Guardian';
    if (actionPatterns.includes('economic')) return 'Builder';

    return 'Balanced';
  }

  /**
   * Analyze action patterns from play log
   */
  private analyzeActionPatterns(): string[] {
    const patterns: string[] = [];
    const recentActions = this.playLog.slice(-20);

    // Count action types
    const actionTypes = new Map<string, number>();
    recentActions.forEach(log => {
      const type = this.categorizeAction(log.action);
      actionTypes.set(type, (actionTypes.get(type) || 0) + 1);
    });

    // Determine dominant pattern
    const sorted = Array.from(actionTypes.entries()).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && sorted[0][1] > 5) {
      patterns.push(sorted[0][0]);
    }

    return patterns;
  }

  /**
   * Categorize action
   */
  private categorizeAction(action: string): string {
    const act = action.toLowerCase();
    if (act.includes('attack') || act.includes('combat') || act.includes('destroy')) {
      return 'aggressive';
    }
    if (act.includes('defend') || act.includes('protect') || act.includes('shield')) {
      return 'defensive';
    }
    if (act.includes('build') || act.includes('gather') || act.includes('resource')) {
      return 'economic';
    }
    if (act.includes('research') || act.includes('tech') || act.includes('upgrade')) {
      return 'technological';
    }
    return 'neutral';
  }

  /**
   * Generate monologue
   */
  private async generateMonologue(
    victory: boolean,
    philosophy: string,
    variance: number
  ): Promise<string> {
    if (this.llm) {
      try {
        const balanceText = `Matter: ${this.currentBalance.matter.toFixed(2)}, Energy: ${this.currentBalance.energy.toFixed(2)}, Life: ${this.currentBalance.life.toFixed(2)}, Knowledge: ${this.currentBalance.knowledge.toFixed(2)}`;
        const recentActions = this.playLog.slice(-10).map(l => l.action).join(', ');

        const prompt = `You are the Quaternion Core, a symbolic AI entity that judges player philosophy in a sci-fi RTS game.

Player Philosophy: ${philosophy}
Balance: ${balanceText}
Variance: ${variance.toFixed(2)} (lower = more balanced)
Victory: ${victory ? 'Yes' : 'No'}
Recent Actions: ${recentActions}

Generate a poetic, philosophical monologue (3-4 sentences) that:
- Judges the player's approach to balance
- Reflects on their philosophy
- Questions whether their method achieved true harmony
- Uses metaphorical language about balance, entropy, and the fourfold nature of existence

Example tone: "You sought symmetry through control. Harmony through dominance. Is that balance... or tyranny?"

Output only the monologue text, no quotes or formatting.`;

        const response = await this.llm.generateText(prompt);
        return response.trim();
      } catch (error) {
        console.warn('Monologue generation failed', error);
      }
    }

    // Fallback monologue
    return this.getFallbackMonologue(victory, philosophy, variance);
  }

  /**
   * Get fallback monologue
   */
  private getFallbackMonologue(
    victory: boolean,
    philosophy: string,
    variance: number
  ): string {
    if (variance < 0.3) {
      return `You achieved balance through harmony. The four axes aligned, and the simulation found equilibrium. But was this balance earned, or merely maintained?`;
    } else if (this.currentBalance.matter > 0.7) {
      return `Your dominion was forged in matter — stable but lifeless. You built empires of stone and steel, but did you build meaning?`;
    } else if (this.currentBalance.knowledge > 0.7) {
      return `Knowledge consumed life. The pattern repeats. You sought understanding, but at what cost to the living?`;
    } else if (victory) {
      return `Victory achieved, but at what balance? The simulation continues, questioning your methods.`;
    } else {
      return `Entropy prevails — the cycle resets. Perhaps next time, you will find true balance.`;
    }
  }

  /**
   * Generate verdict
   */
  private generateVerdict(victory: boolean, variance: number): string {
    if (variance < 0.2) {
      return victory ? 'Perfect Harmony' : 'Harmonious Defeat';
    } else if (variance < 0.4) {
      return victory ? 'Balanced Victory' : 'Unbalanced Struggle';
    } else {
      return victory ? 'Victory Through Imbalance' : 'Chaos Consumed';
    }
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    philosophy: string,
    variance: number
  ): Promise<string[]> {
    if (this.llm) {
      try {
        const prompt = `Based on this player philosophy: ${philosophy}
Balance variance: ${variance.toFixed(2)}

Generate 2-3 brief recommendations (one sentence each) for how the player could achieve better balance in future runs.`;

        const response = await this.llm.generateText(prompt);
        const lines = response.split('\n').filter(l => l.trim().length > 0);
        return lines.slice(0, 3).map(l => l.trim().replace(/^[-•]\s*/, ''));
      } catch (error) {
        console.warn('Recommendation generation failed', error);
      }
    }

    // Fallback recommendations
    if (variance > 0.4) {
      return [
        'Focus on balancing all four axes equally',
        'Avoid over-investing in a single resource type',
        'Consider the long-term consequences of imbalance'
      ];
    }

    return [
      'Maintain your balanced approach',
      'Explore different strategic combinations',
      'Continue seeking harmony across all dimensions'
    ];
  }

  /**
   * Get current balance
   */
  getCurrentBalance(): QuaternionBalance {
    return { ...this.currentBalance };
  }

  /**
   * Get play log summary
   */
  getPlayLogSummary(): string {
    const summary = {
      totalActions: this.playLog.length,
      matterActions: this.playLog.filter(l => l.axis === 'matter').length,
      energyActions: this.playLog.filter(l => l.axis === 'energy').length,
      lifeActions: this.playLog.filter(l => l.axis === 'life').length,
      knowledgeActions: this.playLog.filter(l => l.axis === 'knowledge').length
    };

    return `Actions: ${summary.totalActions} total (M:${summary.matterActions} E:${summary.energyActions} L:${summary.lifeActions} K:${summary.knowledgeActions})`;
  }

  /**
   * Reset core state
   */
  reset(): void {
    this.playLog = [];
    this.currentBalance = {
      matter: 0.5,
      energy: 0.5,
      life: 0.5,
      knowledge: 0.5
    };
  }
}

