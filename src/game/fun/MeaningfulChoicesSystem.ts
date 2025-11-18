/**
 * Meaningful Choices System
 * Ensures player decisions have visible, impactful consequences
 */

import type { QuaternionState } from '../strategic/QuaternionState';

export interface PlayerChoice {
  id: string;
  situation: string;
  options: ChoiceOption[];
  selectedOption?: string;
  timestamp: number;
  consequences: ChoiceConsequence[];
}

export interface ChoiceOption {
  id: string;
  text: string;
  shortTermEffect: string;
  longTermEffect: string;
  resourceImpact: {
    ore?: number;
    energy?: number;
    biomass?: number;
    data?: number;
  };
  stabilityImpact: number; // -1 to 1
  moralAlignment: 'good' | 'neutral' | 'evil';
  risk: 'low' | 'medium' | 'high';
}

export interface ChoiceConsequence {
  type: 'resource' | 'stability' | 'unlock' | 'relationship' | 'narrative';
  description: string;
  magnitude: number; // 0-1
  visible: boolean; // Whether player sees it immediately
  delayed: boolean; // Whether effect is delayed
  delayTime?: number; // Seconds until effect
}

export class MeaningfulChoicesSystem {
  private choiceHistory: PlayerChoice[] = [];
  private pendingConsequences: Array<{
    choiceId: string;
    consequence: ChoiceConsequence;
    triggerTime: number;
  }> = [];

  /**
   * Create a meaningful choice
   */
  createChoice(
    situation: string,
    options: Omit<ChoiceOption, 'id'>[]
  ): PlayerChoice {
    const choice: PlayerChoice = {
      id: `choice_${Date.now()}`,
      situation,
      options: options.map((opt, idx) => ({
        ...opt,
        id: `option_${idx}`
      })),
      timestamp: Date.now(),
      consequences: []
    };

    return choice;
  }

  /**
   * Make a choice and apply consequences
   */
  makeChoice(
    choice: PlayerChoice,
    optionId: string,
    gameState: QuaternionState
  ): {
    immediateConsequences: ChoiceConsequence[];
    delayedConsequences: ChoiceConsequence[];
    resourceDelta: { ore: number; energy: number; biomass: number; data: number };
    stabilityDelta: number;
  } {
    const option = choice.options.find(o => o.id === optionId);
    if (!option) {
      throw new Error(`Option ${optionId} not found in choice ${choice.id}`);
    }

    choice.selectedOption = optionId;

    // Calculate consequences
    const immediateConsequences: ChoiceConsequence[] = [];
    const delayedConsequences: ChoiceConsequence[] = [];
    const resourceDelta = {
      ore: option.resourceImpact.ore || 0,
      energy: option.resourceImpact.energy || 0,
      biomass: option.resourceImpact.biomass || 0,
      data: option.resourceImpact.data || 0
    };
    const stabilityDelta = option.stabilityImpact;

    // Immediate resource consequences
    if (option.resourceImpact.ore !== 0 || 
        option.resourceImpact.energy !== 0 ||
        option.resourceImpact.biomass !== 0 ||
        option.resourceImpact.data !== 0) {
      immediateConsequences.push({
        type: 'resource',
        description: option.shortTermEffect,
        magnitude: this.calculateMagnitude(option.resourceImpact),
        visible: true,
        delayed: false
      });
    }

    // Stability consequence
    if (option.stabilityImpact !== 0) {
      immediateConsequences.push({
        type: 'stability',
        description: `Stability ${option.stabilityImpact > 0 ? 'improved' : 'degraded'}`,
        magnitude: Math.abs(option.stabilityImpact),
        visible: true,
        delayed: false
      });
    }

    // Long-term consequences (delayed)
    if (option.longTermEffect) {
      const delayedConsequence: ChoiceConsequence = {
        type: 'narrative',
        description: option.longTermEffect,
        magnitude: option.risk === 'high' ? 0.8 : option.risk === 'medium' ? 0.5 : 0.3,
        visible: false,
        delayed: true,
        delayTime: this.calculateDelayTime(option.risk)
      };

      delayedConsequences.push(delayedConsequence);

      // Schedule delayed consequence
      this.pendingConsequences.push({
        choiceId: choice.id,
        consequence: delayedConsequence,
        triggerTime: Date.now() + (delayedConsequence.delayTime || 0) * 1000
      });
    }

    // Unlock consequences based on choice
    if (option.moralAlignment === 'good' && this.countGoodChoices() >= 5) {
      immediateConsequences.push({
        type: 'unlock',
        description: 'Ethical path unlocked! New options available.',
        magnitude: 1.0,
        visible: true,
        delayed: false
      });
    }

    choice.consequences = [...immediateConsequences, ...delayedConsequences];
    this.choiceHistory.push(choice);

    // Keep only last 100 choices
    if (this.choiceHistory.length > 100) {
      this.choiceHistory.shift();
    }

    return {
      immediateConsequences,
      delayedConsequences,
      resourceDelta,
      stabilityDelta
    };
  }

  /**
   * Update pending consequences
   */
  update(gameTime: number): ChoiceConsequence[] {
    const triggered: ChoiceConsequence[] = [];
    const now = Date.now();

    for (let i = this.pendingConsequences.length - 1; i >= 0; i--) {
      const pending = this.pendingConsequences[i];
      
      if (now >= pending.triggerTime) {
        triggered.push(pending.consequence);
        this.pendingConsequences.splice(i, 1);
      }
    }

    return triggered;
  }

  /**
   * Calculate magnitude of resource impact
   */
  private calculateMagnitude(impact: ChoiceOption['resourceImpact']): number {
    const total = Math.abs(impact.ore || 0) + 
                  Math.abs(impact.energy || 0) + 
                  Math.abs(impact.biomass || 0) + 
                  Math.abs(impact.data || 0);
    
    // Normalize to 0-1 (assuming max impact around 500)
    return Math.min(1, total / 500);
  }

  /**
   * Calculate delay time based on risk
   */
  private calculateDelayTime(risk: ChoiceOption['risk']): number {
    switch (risk) {
      case 'low':
        return 30; // 30 seconds
      case 'medium':
        return 60; // 1 minute
      case 'high':
        return 120; // 2 minutes
      default:
        return 60;
    }
  }

  /**
   * Count good choices
   */
  private countGoodChoices(): number {
    return this.choiceHistory.filter(c => {
      const option = c.options.find(o => o.id === c.selectedOption);
      return option?.moralAlignment === 'good';
    }).length;
  }

  /**
   * Get choice history
   */
  getChoiceHistory(): PlayerChoice[] {
    return [...this.choiceHistory];
  }

  /**
   * Get pending consequences
   */
  getPendingConsequences(): Array<{ choiceId: string; consequence: ChoiceConsequence; triggerTime: number }> {
    return [...this.pendingConsequences];
  }

  /**
   * Create example meaningful choice
   */
  createExampleChoice(): PlayerChoice {
    return this.createChoice(
      'An ancient Bio-Seed is discovered. It contains massive life energy, but harvesting it will destroy the ecosystem.',
      [
        {
          text: 'Harvest the Bio-Seed',
          shortTermEffect: 'Gained 500 Biomass immediately',
          longTermEffect: 'Ecosystem begins to degrade. Biomass generation reduced.',
          resourceImpact: { biomass: 500 },
          stabilityImpact: -0.3,
          moralAlignment: 'evil',
          risk: 'high'
        },
        {
          text: 'Preserve the Bio-Seed',
          shortTermEffect: 'No immediate gain',
          longTermEffect: 'Ecosystem flourishes. Biomass generation increased permanently.',
          resourceImpact: { biomass: -50 }, // Small cost
          stabilityImpact: 0.2,
          moralAlignment: 'good',
          risk: 'low'
        },
        {
          text: 'Study the Bio-Seed carefully',
          shortTermEffect: 'Gained 200 Knowledge',
          longTermEffect: 'Unlocked BioTech research. Can harvest safely later.',
          resourceImpact: { data: 200, biomass: -20 },
          stabilityImpact: 0.1,
          moralAlignment: 'neutral',
          risk: 'medium'
        }
      ]
    );
  }
}

