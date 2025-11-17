/**
 * Resource Advisor System
 * AI-powered advisor with personality-driven recommendations
 */

import { ResourceType } from '../ResourceManager';
import { LLMIntegration } from '@/ai/integrations/LLMIntegration';

export enum AdvisorStyle {
  CONSERVATIVE = 'conservative',
  AGGRESSIVE = 'aggressive',
  INNOVATIVE = 'innovative',
  ADAPTIVE = 'adaptive'
}

export interface AdvisorPersonality {
  name: string;
  style: AdvisorStyle;
  riskTolerance: number; // 0-1
  planningHorizon: number; // 0-1 (short vs long-term focus)
  voiceProfile: string;
}

export interface AdvisorResponse {
  adviceText: string;
  confidence: number; // 0-1
  reasoning: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface ResourceState {
  resources: Record<ResourceType, number>;
  maxCapacities: Record<ResourceType, number>;
  generationRates: Record<ResourceType, number>;
  activeEvents: any[];
  recentDecisions: string[];
}

export class ResourceAdvisor {
  private currentAdvisor: AdvisorPersonality;
  private llmIntegration: LLMIntegration | null = null;
  private adviceCooldown: number = 30; // seconds
  private lastAdviceTime: number = 0;
  private confidenceThreshold: number = 0.7;

  private advisorPersonalities: AdvisorPersonality[] = [
    {
      name: 'Auren',
      style: AdvisorStyle.CONSERVATIVE,
      riskTolerance: 0.3,
      planningHorizon: 0.8,
      voiceProfile: 'calm_analyst'
    },
    {
      name: 'Lira',
      style: AdvisorStyle.AGGRESSIVE,
      riskTolerance: 0.8,
      planningHorizon: 0.3,
      voiceProfile: 'bold_commander'
    },
    {
      name: 'Virel',
      style: AdvisorStyle.INNOVATIVE,
      riskTolerance: 0.6,
      planningHorizon: 0.7,
      voiceProfile: 'tech_specialist'
    },
    {
      name: 'Kael',
      style: AdvisorStyle.ADAPTIVE,
      riskTolerance: 0.5,
      planningHorizon: 0.5,
      voiceProfile: 'flexible_strategist'
    }
  ];

  constructor(llmIntegration?: LLMIntegration, advisorName?: string) {
    this.llmIntegration = llmIntegration || null;
    
    // Select advisor
    if (advisorName) {
      const advisor = this.advisorPersonalities.find(a => a.name === advisorName);
      this.currentAdvisor = advisor || this.advisorPersonalities[0];
    } else {
      this.currentAdvisor = this.advisorPersonalities[0];
    }
  }

  /**
   * Set advisor personality
   */
  public setAdvisor(advisorName: string): void {
    const advisor = this.advisorPersonalities.find(a => a.name === advisorName);
    if (advisor) {
      this.currentAdvisor = advisor;
    }
  }

  /**
   * Generate advice based on current resource state
   */
  public async generateAdvice(
    situation: string,
    resourceState: ResourceState,
    currentTime: number
  ): Promise<AdvisorResponse | null> {
    // Check cooldown
    if (currentTime - this.lastAdviceTime < this.adviceCooldown * 1000) {
      return null;
    }

    try {
      const context = this.buildAdvisorContext(resourceState, situation);
      const prompt = this.buildAdvisorPrompt(context, situation);

      if (this.llmIntegration) {
        const response = await this.generateLLMAdvice(prompt);
        if (response && response.confidence >= this.confidenceThreshold) {
          this.lastAdviceTime = currentTime;
          return response;
        }
      }

      // Fallback to rule-based advice
      const fallbackAdvice = this.generateFallbackAdvice(situation, resourceState);
      if (fallbackAdvice) {
        this.lastAdviceTime = currentTime;
        return fallbackAdvice;
      }
    } catch (error) {
      console.warn('Advisor advice generation failed:', error);
    }

    return null;
  }

  private buildAdvisorContext(resourceState: ResourceState, situation: string): string {
    const resourceSummary = Object.entries(resourceState.resources)
      .map(([type, amount]) => `${ResourceType[type as keyof typeof ResourceType]}: ${amount}`)
      .join(', ');

    return `
ADVISOR PERSONALITY: ${this.currentAdvisor.name} (${this.currentAdvisor.style})
CURRENT SITUATION: ${situation}
RESOURCES: ${resourceSummary}
ACTIVE EVENTS: ${resourceState.activeEvents.length}
PLAYER BEHAVIOR: ${this.analyzePlayerBehavior(resourceState.recentDecisions)}
`;
  }

  private buildAdvisorPrompt(context: string, situation: string): string {
    return `
${context}

Generate strategic advice for the player.

REQUIREMENTS:
- Maximum 2 sentences
- Align with advisor personality style (${this.currentAdvisor.style})
- Provide concrete, actionable advice
- Consider current game situation
- Format as JSON: {"adviceText":"...","confidence":0.0,"reasoning":"...","urgency":"low|medium|high"}

SITUATION: ${situation}
`;
  }

  private async generateLLMAdvice(prompt: string): Promise<AdvisorResponse | null> {
    if (!this.llmIntegration) return null;

    try {
      const response = await (this.llmIntegration as any).generateEventNarrative?.(
        'advisor_advice',
        Date.now(),
        { resources: resourceState.resources, units: 0, buildings: 0 }
      ) || '';
      const parsed = this.parseLLMResponse(response);
      
      if (parsed && parsed.adviceText) {
        return {
          adviceText: parsed.adviceText,
          confidence: parsed.confidence || 0.7,
          reasoning: parsed.reasoning || '',
          urgency: parsed.urgency || 'medium'
        };
      }
    } catch (error) {
      console.warn('LLM advice generation failed:', error);
    }

    return null;
  }

  private parseLLMResponse(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }

  private generateFallbackAdvice(
    situation: string,
    resourceState: ResourceState
  ): AdvisorResponse | null {
    const { resources, maxCapacities } = resourceState;

    // Check for critical resources
    for (const [type, amount] of Object.entries(resources)) {
      const maxCapacity = maxCapacities[type as ResourceType] || 1000;
      const percentage = amount / maxCapacity;

      if (percentage < 0.2 && amount > 0) {
        const resourceName = ResourceType[type as keyof typeof ResourceType];
        return {
          adviceText: `Commander, ${resourceName} reserves are critically low. Prioritize ${resourceName} generation immediately.`,
          confidence: 0.9,
          reasoning: `Resource at ${Math.round(percentage * 100)}% capacity`,
          urgency: 'high'
        };
      }

      if (percentage > 0.9) {
        const resourceName = ResourceType[type as keyof typeof ResourceType];
        return {
          adviceText: `${resourceName} storage near capacity. Consider spending or converting excess resources.`,
          confidence: 0.8,
          reasoning: `Resource at ${Math.round(percentage * 100)}% capacity`,
          urgency: 'medium'
        };
      }
    }

    // Check for active events
    if (resourceState.activeEvents.length > 0) {
      return {
        adviceText: 'Active events detected. Monitor resource production carefully.',
        confidence: 0.7,
        reasoning: `${resourceState.activeEvents.length} active events`,
        urgency: 'medium'
      };
    }

    // Default advice based on advisor style
    switch (this.currentAdvisor.style) {
      case AdvisorStyle.CONSERVATIVE:
        return {
          adviceText: 'Maintain balanced resource allocation. Steady growth is key.',
          confidence: 0.6,
          reasoning: 'Conservative strategy recommendation',
          urgency: 'low'
        };
      case AdvisorStyle.AGGRESSIVE:
        return {
          adviceText: 'Press the advantage. Aggressive expansion recommended.',
          confidence: 0.6,
          reasoning: 'Aggressive strategy recommendation',
          urgency: 'medium'
        };
      case AdvisorStyle.INNOVATIVE:
        return {
          adviceText: 'Consider investing in research. Technology unlocks future advantages.',
          confidence: 0.6,
          reasoning: 'Innovative strategy recommendation',
          urgency: 'low'
        };
      default:
        return null;
    }
  }

  private analyzePlayerBehavior(recentDecisions: string[]): string {
    if (recentDecisions.length === 0) return 'cautious';

    const aggressiveActions = recentDecisions.filter(d => 
      d.includes('attack') || d.includes('expand') || d.includes('rush')
    ).length;
    const defensiveActions = recentDecisions.filter(d => 
      d.includes('defend') || d.includes('fortify') || d.includes('consolidate')
    ).length;

    if (aggressiveActions > defensiveActions) return 'aggressive';
    if (defensiveActions > aggressiveActions) return 'defensive';
    return 'balanced';
  }

  /**
   * Get current advisor
   */
  public getCurrentAdvisor(): AdvisorPersonality {
    return this.currentAdvisor;
  }

  /**
   * Get all available advisors
   */
  public getAvailableAdvisors(): AdvisorPersonality[] {
    return this.advisorPersonalities;
  }
}

