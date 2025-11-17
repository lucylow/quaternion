/**
 * Resource Event Generator
 * Creates AI-driven resource events that create dynamic scarcity puzzles
 */

import { ResourceType } from '../ResourceManager';
import { LLMIntegration } from '@/ai/integrations/LLMIntegration';

export interface ResourceEvent {
  eventId: string;
  description: string;
  duration: number; // seconds
  resourceModifiers: Map<ResourceType, number>; // Multipliers (0.5 = 50% production)
  flavorText: string;
  isPositive: boolean;
  triggerCondition?: string;
  startTime: number;
  endTime: number;
}

export interface EventTemplate {
  templateName: string;
  resourceTargets: ResourceType[];
  effectRanges: [number, number]; // Min and max multiplier
  flavorThemes: string[];
  triggerConditions: string[];
}

export class ResourceEventGenerator {
  private eventTemplates: EventTemplate[] = [];
  private activeEvents: ResourceEvent[] = [];
  private llmIntegration: LLMIntegration | null = null;
  private eventFrequency: number = 120; // seconds between events
  private lastEventTime: number = 0;
  private gameStartTime: number = 0;

  constructor(llmIntegration?: LLMIntegration) {
    this.llmIntegration = llmIntegration || null;
    this.initializeEventTemplates();
  }

  private initializeEventTemplates(): void {
    // Scarcity Events
    this.eventTemplates.push({
      templateName: 'Resource Scarcity',
      resourceTargets: [ResourceType.ORE, ResourceType.ENERGY, ResourceType.BIOMASS],
      effectRanges: [0.1, 0.5], // 10-50% reduction
      flavorThemes: ['ion_storm', 'mining_disaster', 'sabotage', 'market_crash'],
      triggerConditions: ['high_production', 'resource_hoarding', 'random']
    });

    // Abundance Events
    this.eventTemplates.push({
      templateName: 'Resource Windfall',
      resourceTargets: [ResourceType.ORE, ResourceType.ENERGY, ResourceType.DATA],
      effectRanges: [1.5, 3.0], // 150-300% increase
      flavorThemes: ['quantum_discovery', 'energy_surge', 'research_breakthrough'],
      triggerConditions: ['low_resources', 'research_completion', 'random']
    });

    // Conversion Events
    this.eventTemplates.push({
      templateName: 'Conversion Opportunity',
      resourceTargets: [ResourceType.ORE, ResourceType.ENERGY, ResourceType.BIOMASS, ResourceType.DATA],
      effectRanges: [1.2, 2.0], // Improved conversion rates
      flavorThemes: ['alchemical_breakthrough', 'quantum_entanglement', 'biological_symbiosis'],
      triggerConditions: ['resource_imbalance', 'tech_unlock', 'random']
    });
  }

  /**
   * Initialize with game start time
   */
  public initialize(gameStartTime: number): void {
    this.gameStartTime = gameStartTime;
    this.lastEventTime = gameStartTime;
    this.activeEvents = [];
  }

  /**
   * Update event generator (call every game tick)
   */
  public update(currentTime: number, gameState: {
    resources: Record<ResourceType, number>;
    playerStrategy?: string;
    threatLevel?: number;
  }): ResourceEvent[] {
    // Remove expired events
    this.activeEvents = this.activeEvents.filter(event => currentTime < event.endTime);

    // Check if it's time for a new event
    if (currentTime - this.lastEventTime >= this.eventFrequency) {
      const newEvent = this.generateEvent(currentTime, gameState);
      if (newEvent) {
        this.activeEvents.push(newEvent);
        this.lastEventTime = currentTime;
      }
    }

    return this.activeEvents;
  }

  /**
   * Generate a new resource event
   */
  private generateEvent(currentTime: number, gameState: any): ResourceEvent | null {
    // Select random template
    const template = this.eventTemplates[Math.floor(Math.random() * this.eventTemplates.length)];

    // Determine affected resources
    const affectedResources: ResourceType[] = [];
    const numAffected = Math.min(2, template.resourceTargets.length);
    const shuffled = [...template.resourceTargets].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numAffected; i++) {
      affectedResources.push(shuffled[i]);
    }

    // Generate effect multiplier
    const [minEffect, maxEffect] = template.effectRanges;
    const effectMultiplier = minEffect + Math.random() * (maxEffect - minEffect);

    // Determine if positive or negative
    const isPositive = effectMultiplier >= 1.0;

    // Generate duration (60-180 seconds)
    const duration = 60 + Math.random() * 120;

    // Create event
    const event: ResourceEvent = {
      eventId: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: this.generateEventDescription(template, affectedResources, effectMultiplier),
      duration,
      resourceModifiers: new Map(),
      flavorText: this.generateFlavorText(template),
      isPositive,
      startTime: currentTime,
      endTime: currentTime + duration
    };

    // Set modifiers for affected resources
    affectedResources.forEach(resource => {
      event.resourceModifiers.set(resource, effectMultiplier);
    });

    // Try to enhance with LLM if available
    if (this.llmIntegration) {
      this.enhanceEventWithLLM(event, template, gameState).catch(err => {
        console.warn('LLM event enhancement failed:', err);
      });
    }

    return event;
  }

  private generateEventDescription(
    template: EventTemplate,
    affectedResources: ResourceType[],
    multiplier: number
  ): string {
    const resourceNames = affectedResources.map(r => ResourceType[r]).join(' and ');
    const effect = multiplier < 1.0 
      ? `${Math.round((1 - multiplier) * 100)}% reduction`
      : `${Math.round((multiplier - 1) * 100)}% increase`;
    
    return `${template.templateName}: ${resourceNames} production ${effect}`;
  }

  private generateFlavorText(template: EventTemplate): string {
    const theme = template.flavorThemes[Math.floor(Math.random() * template.flavorThemes.length)];
    
    const flavorTexts: Record<string, string[]> = {
      'ion_storm': [
        'Ion storm detected! Quantum interference disrupting resource extraction.',
        'Electromagnetic anomalies detected. Resource collectors operating at reduced efficiency.'
      ],
      'mining_disaster': [
        'Mining operation compromised. Structural instability detected.',
        'Resource vein collapse. Extraction temporarily halted.'
      ],
      'sabotage': [
        'Security breach detected. Possible sabotage of resource infrastructure.',
        'Unauthorized access to resource systems. Investigation underway.'
      ],
      'market_crash': [
        'Market volatility detected. Resource values fluctuating wildly.',
        'Economic instability. Resource trading disrupted.'
      ],
      'quantum_discovery': [
        'Major quantum deposit discovered! Extraction efficiency increased.',
        'New resource vein located. Production surge expected.'
      ],
      'energy_surge': [
        'Energy wave detected. Power systems operating at peak efficiency.',
        'Quantum energy surge. All systems boosted.'
      ],
      'research_breakthrough': [
        'Research breakthrough! New extraction methods discovered.',
        'Scientific discovery improves resource processing.'
      ],
      'alchemical_breakthrough': [
        'Conversion technology breakthrough! Resource transmutation efficiency increased.',
        'New alchemical process discovered. Conversion rates improved.'
      ],
      'quantum_entanglement': [
        'Quantum entanglement field detected. Resource conversion enhanced.',
        'Stable quantum field established. Conversion processes optimized.'
      ],
      'biological_symbiosis': [
        'Biological symbiosis discovered. Organic resource processing improved.',
        'New biological process enhances resource conversion.'
      ]
    };

    const texts = flavorTexts[theme] || ['Resource event detected.'];
    return texts[Math.floor(Math.random() * texts.length)];
  }

  private async enhanceEventWithLLM(
    event: ResourceEvent,
    template: EventTemplate,
    gameState: any
  ): Promise<void> {
    if (!this.llmIntegration) return;

    try {
      const prompt = `Generate a resource management event for sci-fi RTS game.

TEMPLATE: ${template.templateName}
CURRENT GAME STATE: ${JSON.stringify(gameState)}
FLAVOR THEMES: ${template.flavorThemes.join(', ')}

Requirements:
- Create engaging narrative description (2-3 sentences)
- Affect 1-2 specific resources
- Duration: 60-180 seconds
- Include strategic implications
- Format as JSON: {"description":"...","flavorText":"...","duration":0}

Output:`;

      const response = await this.llmIntegration['callLLM'](prompt);
      const enhanced = this.parseLLMResponse(response);
      
      if (enhanced) {
        if (enhanced.description) event.description = enhanced.description;
        if (enhanced.flavorText) event.flavorText = enhanced.flavorText;
        if (enhanced.duration) event.duration = enhanced.duration;
      }
    } catch (error) {
      // Silently fail - use generated event as-is
      console.warn('LLM enhancement failed, using generated event');
    }
  }

  private parseLLMResponse(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Ignore parse errors
    }
    return null;
  }

  /**
   * Get active events
   */
  public getActiveEvents(): ResourceEvent[] {
    return this.activeEvents;
  }

  /**
   * Get resource modifier for a specific resource type
   */
  public getResourceModifier(resourceType: ResourceType): number {
    let modifier = 1.0;
    this.activeEvents.forEach(event => {
      const eventModifier = event.resourceModifiers.get(resourceType);
      if (eventModifier !== undefined) {
        modifier *= eventModifier;
      }
    });
    return modifier;
  }

  /**
   * Set event frequency (seconds between events)
   */
  public setEventFrequency(frequency: number): void {
    this.eventFrequency = frequency;
  }
}

