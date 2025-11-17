/**
 * Advisor Tension System - Advisors debate and react to player choices
 * Creates dynamic dialogue and affects available tech based on advisor sentiments
 */

import { COMMANDERS } from '@/data/quaternionData';

export interface AdvisorPersonality {
  id: string;
  name: string;
  baseAggression: number; // 0-1
  baseCaution: number; // 0-1
  resourceBiases: Record<string, number>; // Resource type -> bias multiplier
  debateLines: string[];
  emotionalState: 'calm' | 'concerned' | 'angry' | 'excited';
}

export interface AdvisorDebate {
  advisorA: string;
  advisorB: string;
  intensity: number; // 0-1
  topic: string;
  lines: Array<{ advisor: string; message: string }>;
  startTime: number;
}

export interface StrategicDecision {
  type: 'build' | 'research' | 'attack' | 'defend' | 'resource_focus';
  resourceChanges: Record<string, number>;
  riskLevel: number; // 0-1
  ethicalAlignment: number; // -1 to 1
  immediateEffect: any;
}

export class AdvisorTensionSystem {
  private advisors: Map<string, AdvisorPersonality>;
  private relationshipTension: Map<string, number>; // "advisorA-advisorB" -> tension (0-1)
  private activeDebates: AdvisorDebate[] = [];
  private sentimentHistory: Map<string, number[]> = new Map(); // advisor -> sentiment scores

  constructor() {
    this.advisors = new Map();
    this.relationshipTension = new Map();
    this.initializeAdvisors();
    this.initializeRelationships();
  }

  private initializeAdvisors(): void {
    // Initialize advisor personalities based on COMMANDERS data
    this.advisors.set('LIRA', {
      id: 'LIRA',
      name: 'Lira',
      baseAggression: 0.8,
      baseCaution: 0.2,
      resourceBiases: {
        ore: 1.5,
        energy: 1.2
      },
      debateLines: [
        'Strength through industry! More forges!',
        'We cannot show weakness. Strike first!',
        'Their defenses are paper. Let us test them.',
        'Aggression is the only language they understand!'
      ],
      emotionalState: 'calm'
    });

    this.advisors.set('AUREN', {
      id: 'AUREN',
      name: 'Auren',
      baseAggression: 0.2,
      baseCaution: 0.9,
      resourceBiases: {
        biomass: 2.0,
        ore: 0.5
      },
      debateLines: [
        'Life finds a way. We must preserve it.',
        'The land cries out from your industry!',
        'Balance, commander. Always balance.',
        'Every action has consequences for the ecosystem.'
      ],
      emotionalState: 'calm'
    });

    this.advisors.set('VIREL', {
      id: 'VIREL',
      name: 'Virel',
      baseAggression: 0.3,
      baseCaution: 0.7,
      resourceBiases: {
        data: 2.0,
        energy: 1.3
      },
      debateLines: [
        'Knowledge is our greatest weapon.',
        'Research first, act second.',
        'Understanding precedes victory.',
        'Technology will solve this problem.'
      ],
      emotionalState: 'calm'
    });

    this.advisors.set('CORE', {
      id: 'CORE',
      name: 'Core',
      baseAggression: 0.5,
      baseCaution: 0.5,
      resourceBiases: {
        ore: 1.1,
        energy: 1.1,
        biomass: 1.1,
        data: 1.1
      },
      debateLines: [
        'Optimal efficiency requires balance.',
        'The data suggests a different approach.',
        'Calculating best path forward...',
        'All resources must be considered equally.'
      ],
      emotionalState: 'calm'
    });

    this.advisors.set('KOR', {
      id: 'KOR',
      name: 'Kor',
      baseAggression: 0.7,
      baseCaution: 0.3,
      resourceBiases: {
        energy: 1.4,
        data: 0.8
      },
      debateLines: [
        'Embrace chaos. Order is an illusion.',
        'Rules are meant to be broken!',
        'Predictability is weakness.',
        'Let the chaos flow through you!'
      ],
      emotionalState: 'calm'
    });

    // Initialize sentiment history
    this.advisors.forEach((advisor, id) => {
      this.sentimentHistory.set(id, [0.5]); // Start neutral
    });
  }

  private initializeRelationships(): void {
    // Initialize tension between advisor pairs
    const advisorIds = Array.from(this.advisors.keys());
    
    for (let i = 0; i < advisorIds.length; i++) {
      for (let j = i + 1; j < advisorIds.length; j++) {
        const idA = advisorIds[i];
        const idB = advisorIds[j];
        const key = `${idA}-${idB}`;
        
        // Calculate base tension based on personality differences
        const advisorA = this.advisors.get(idA)!;
        const advisorB = this.advisors.get(idB)!;
        
        const aggressionDiff = Math.abs(advisorA.baseAggression - advisorB.baseAggression);
        const cautionDiff = Math.abs(advisorA.baseCaution - advisorB.baseCaution);
        const baseTension = (aggressionDiff + cautionDiff) / 2;
        
        this.relationshipTension.set(key, baseTension);
      }
    }
  }

  /**
   * Process a player decision and update advisor sentiments
   */
  onPlayerDecision(decision: StrategicDecision): {
    advisorReactions: Array<{ advisor: string; message: string; sentiment: number }>;
    debates: AdvisorDebate[];
    techModifiers: Record<string, number>; // techId -> cost modifier
  } {
    const reactions: Array<{ advisor: string; message: string; sentiment: number }> = [];
    const techModifiers: Record<string, number> = {};

    // Calculate how each advisor feels about this decision
    this.advisors.forEach((advisor, id) => {
      const approval = this.calculateAdvisorApproval(advisor, decision);
      this.updateAdvisorSentiment(id, approval);
      
      // Update emotional state based on sentiment
      const currentSentiment = this.getCurrentSentiment(id);
      if (currentSentiment < 0.3) {
        advisor.emotionalState = 'angry';
      } else if (currentSentiment < 0.5) {
        advisor.emotionalState = 'concerned';
      } else if (currentSentiment > 0.7) {
        advisor.emotionalState = 'excited';
      } else {
        advisor.emotionalState = 'calm';
      }

      // Generate reaction message
      const message = this.generateReactionMessage(advisor, decision, approval);
      reactions.push({
        advisor: id,
        message,
        sentiment: currentSentiment
      });

      // Calculate tech cost modifiers based on sentiment
      // Advisors with high sentiment reduce costs for their preferred techs
      if (currentSentiment > 0.6) {
        // Reduce costs for techs aligned with this advisor
        if (id === 'VIREL') {
          techModifiers['neural_network'] = 0.9;
          techModifiers['quantum_computing'] = 0.85;
        } else if (id === 'LIRA') {
          techModifiers['quantum_core'] = 0.9;
        } else if (id === 'AUREN') {
          techModifiers['bioconserve'] = 0.9;
          techModifiers['genetic_enhancement'] = 0.85;
        }
      } else if (currentSentiment < 0.4) {
        // Increase costs for techs opposed by this advisor
        if (id === 'AUREN') {
          techModifiers['quantum_core'] = 1.2; // Auren opposes heavy industry
        } else if (id === 'LIRA') {
          techModifiers['bioconserve'] = 1.2; // Lira opposes conservation
        }
      }
    });

    // Check for debates between conflicting advisors
    const debates = this.checkForAdvisorDebates();

    return {
      advisorReactions: reactions,
      debates,
      techModifiers
    };
  }

  private calculateAdvisorApproval(advisor: AdvisorPersonality, decision: StrategicDecision): number {
    let approval = 0.5; // Start neutral

    // Resource changes alignment
    Object.entries(decision.resourceChanges).forEach(([resource, change]) => {
      const bias = advisor.resourceBiases[resource] || 1.0;
      approval += (change > 0 ? 0.1 : -0.1) * bias;
    });

    // Risk tolerance alignment
    if (decision.riskLevel > 0.5) {
      approval += (advisor.baseAggression - 0.5) * 0.3;
    } else {
      approval += (advisor.baseCaution - 0.5) * 0.3;
    }

    // Ethical alignment (Auren cares most)
    if (advisor.id === 'AUREN') {
      approval += decision.ethicalAlignment * 0.4;
    }

    // Clamp to 0-1
    return Math.max(0, Math.min(1, approval));
  }

  private updateAdvisorSentiment(advisorId: string, approval: number): void {
    const history = this.sentimentHistory.get(advisorId) || [0.5];
    // Weighted average: 70% current, 30% new approval
    const newSentiment = history[history.length - 1] * 0.7 + approval * 0.3;
    history.push(newSentiment);
    
    // Keep only last 10 sentiments
    if (history.length > 10) {
      history.shift();
    }
    
    this.sentimentHistory.set(advisorId, history);
  }

  private getCurrentSentiment(advisorId: string): number {
    const history = this.sentimentHistory.get(advisorId) || [0.5];
    return history[history.length - 1];
  }

  private generateReactionMessage(
    advisor: AdvisorPersonality,
    decision: StrategicDecision,
    approval: number
  ): string {
    if (approval > 0.7) {
      return advisor.debateLines[Math.floor(Math.random() * advisor.debateLines.length)] + 
             ' Excellent decision, commander!';
    } else if (approval < 0.3) {
      return `I must object, commander. ${advisor.debateLines[Math.floor(Math.random() * advisor.debateLines.length)]}`;
    } else {
      return 'I see your reasoning, commander. Proceed with caution.';
    }
  }

  private checkForAdvisorDebates(): AdvisorDebate[] {
    const newDebates: AdvisorDebate[] = [];
    const advisorIds = Array.from(this.advisors.keys());

    for (let i = 0; i < advisorIds.length; i++) {
      for (let j = i + 1; j < advisorIds.length; j++) {
        const idA = advisorIds[i];
        const idB = advisorIds[j];
        const key = `${idA}-${idB}`;
        
        const tension = this.relationshipTension.get(key) || 0;
        const sentimentA = this.getCurrentSentiment(idA);
        const sentimentB = this.getCurrentSentiment(idB);
        
        // Start debate if tension is high and sentiments differ significantly
        if (tension > 0.6 && Math.abs(sentimentA - sentimentB) > 0.4) {
          const advisorA = this.advisors.get(idA)!;
          const advisorB = this.advisors.get(idB)!;
          
          const debate: AdvisorDebate = {
            advisorA: idA,
            advisorB: idB,
            intensity: tension,
            topic: this.generateDebateTopic(advisorA, advisorB),
            lines: [
              {
                advisor: idA,
                message: advisorA.debateLines[Math.floor(Math.random() * advisorA.debateLines.length)]
              },
              {
                advisor: idB,
                message: advisorB.debateLines[Math.floor(Math.random() * advisorB.debateLines.length)]
              }
            ],
            startTime: Date.now()
          };
          
          newDebates.push(debate);
          this.activeDebates.push(debate);
        }
      }
    }

    // Remove old debates (older than 30 seconds)
    this.activeDebates = this.activeDebates.filter(
      debate => Date.now() - debate.startTime < 30000
    );

    return newDebates;
  }

  private generateDebateTopic(advisorA: AdvisorPersonality, advisorB: AdvisorPersonality): string {
    const topics = [
      'Resource allocation strategy',
      'Combat approach',
      'Research priorities',
      'Ethical considerations',
      'Risk assessment'
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  }

  /**
   * Get current advisor states
   */
  getAdvisorStates(): Map<string, { sentiment: number; emotionalState: string }> {
    const states = new Map();
    this.advisors.forEach((advisor, id) => {
      states.set(id, {
        sentiment: this.getCurrentSentiment(id),
        emotionalState: advisor.emotionalState
      });
    });
    return states;
  }

  /**
   * Get active debates
   */
  getActiveDebates(): AdvisorDebate[] {
    return this.activeDebates;
  }
}

