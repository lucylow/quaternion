/**
 * Planning System
 * Hierarchical action planning for NPCs
 * Based on Stanford Generative Agents research
 * 
 * Generates sequences of future actions with hierarchical decomposition:
 * - High-level goals (e.g., "Have a productive work day")
 * - Hourly plans ("9-10am: work on project")
 * - 15-minute action granularities
 */

import { LLMIntegration } from '../integrations/LLMIntegration';
import { EnhancedMemoryStream, MemoryObservation } from './EnhancedMemoryStream';
import { ReflectionSystem, Reflection } from './ReflectionSystem';

export interface Plan {
  id: string;
  goal: string; // High-level goal
  startTime: number; // Timestamp
  endTime: number; // Timestamp
  actions: PlannedAction[];
  priority: number; // 0-1
  status: 'pending' | 'active' | 'completed' | 'cancelled';
}

export interface PlannedAction {
  id: string;
  description: string;
  startTime: number;
  duration: number; // minutes
  location?: string;
  requiredResources?: string[];
  status: 'pending' | 'active' | 'completed' | 'cancelled';
}

export interface PlanningContext {
  currentTime: number;
  location: string;
  currentState: string; // Summary of current situation
  availableResources: string[];
  recentMemories: MemoryObservation[];
  reflections: Reflection[];
  personality?: any; // Personality traits
}

/**
 * Planning System
 * Generates hierarchical action plans for NPCs
 */
export class PlanningSystem {
  private llm: LLMIntegration | null = null;
  private memoryStream: EnhancedMemoryStream;
  private reflectionSystem: ReflectionSystem;
  private activePlans: Plan[] = [];
  private planHistory: Plan[] = [];
  private replanningThreshold = 0.7; // Re-plan if plan relevance drops below this

  constructor(
    memoryStream: EnhancedMemoryStream,
    reflectionSystem: ReflectionSystem,
    llm?: LLMIntegration
  ) {
    this.memoryStream = memoryStream;
    this.reflectionSystem = reflectionSystem;
    this.llm = llm || null;
  }

  /**
   * Generate a new plan based on current context
   */
  async generatePlan(
    context: PlanningContext,
    timeHorizon: number = 8 // hours
  ): Promise<Plan> {
    // Get relevant context
    const summary = await this.generateSummary(context);
    const goals = await this.generateGoals(context, summary);
    
    if (goals.length === 0) {
      // Fallback: default daily routine
      return this.createDefaultPlan(context, timeHorizon);
    }

    // Select primary goal
    const primaryGoal = goals[0];

    // Generate hierarchical plan
    const plan = await this.decomposeGoal(primaryGoal, context, timeHorizon);

    this.activePlans.push(plan);
    return plan;
  }

  /**
   * Generate summary of current state
   */
  private async generateSummary(context: PlanningContext): Promise<string> {
    const memoryText = context.recentMemories
      .slice(0, 5)
      .map(m => `- ${m.content}`)
      .join('\n');

    const reflectionText = context.reflections
      .slice(0, 2)
      .map(r => `- ${r.content}`)
      .join('\n');

    return `Current location: ${context.location}
Current state: ${context.currentState}
Recent memories:
${memoryText}
${reflectionText ? `Reflections:\n${reflectionText}` : ''}`;
  }

  /**
   * Generate goals based on context
   */
  private async generateGoals(
    context: PlanningContext,
    summary: string
  ): Promise<string[]> {
    if (!this.llm) {
      // Fallback: default goals
      return [
        'Maintain trading operations',
        'Interact with players',
        'Manage inventory'
      ];
    }

    try {
      const personalityText = context.personality
        ? `Personality: ${JSON.stringify(context.personality)}`
        : '';

      const prompt = `You are an NPC in a sci-fi RTS game. Based on your current situation, generate 2-3 high-level goals for the next 8 hours.

${summary}
${personalityText}

Goals should be:
- Specific and actionable
- Aligned with your role (trader, commander, etc.)
- Realistic for the time frame
- Reflective of your personality and current needs

Respond with ONLY the goals, one per line, no numbering.`;

      const response = await this.llm.generateText(prompt);
      const goals = response
        .split('\n')
        .map(g => g.trim())
        .filter(g => g.length > 0)
        .slice(0, 3);

      return goals.length > 0 ? goals : ['Maintain daily operations'];
    } catch (error) {
      console.warn('Goal generation failed', error);
      return ['Maintain daily operations'];
    }
  }

  /**
   * Decompose goal into hierarchical actions
   */
  private async decomposeGoal(
    goal: string,
    context: PlanningContext,
    timeHorizon: number
  ): Promise<Plan> {
    const startTime = context.currentTime;
    const endTime = startTime + (timeHorizon * 60 * 60 * 1000); // Convert hours to ms

    // Generate hourly breakdown
    const hourlyActions = await this.generateHourlyActions(goal, context, timeHorizon);
    
    // Further decompose into 15-minute actions
    const detailedActions: PlannedAction[] = [];
    for (const hourlyAction of hourlyActions) {
      const subActions = await this.decomposeAction(hourlyAction, context);
      detailedActions.push(...subActions);
    }

    return {
      id: this.generateId(),
      goal,
      startTime,
      endTime,
      actions: detailedActions,
      priority: 0.7,
      status: 'pending'
    };
  }

  /**
   * Generate hourly action breakdown
   */
  private async generateHourlyActions(
    goal: string,
    context: PlanningContext,
    hours: number
  ): Promise<PlannedAction[]> {
    if (!this.llm) {
      // Fallback: simple hourly schedule
      const actions: PlannedAction[] = [];
      for (let i = 0; i < hours; i++) {
        actions.push({
          id: this.generateId(),
          description: `Work on ${goal}`,
          startTime: context.currentTime + (i * 60 * 60 * 1000),
          duration: 60,
          status: 'pending'
        });
      }
      return actions;
    }

    try {
      const prompt = `Break down this goal into hourly actions for the next ${hours} hours:

Goal: ${goal}
Current time: ${new Date(context.currentTime).toLocaleTimeString()}
Location: ${context.location}

Generate ${hours} hourly actions that:
- Progress toward the goal
- Are specific and actionable
- Include time slots (e.g., "9-10am: Work on project")
- Are realistic for the time frame

Respond with ONLY the actions, one per line, format: "HH:MM-HH:MM: Description"`;

      const response = await this.llm.generateText(prompt);
      const lines = response.split('\n').filter(l => l.trim().length > 0);
      
      const actions: PlannedAction[] = [];
      let currentHour = 0;

      for (const line of lines.slice(0, hours)) {
        const description = line.replace(/^\d+:\d+-\d+:\d+:\s*/, '').trim();
        if (description) {
          actions.push({
            id: this.generateId(),
            description,
            startTime: context.currentTime + (currentHour * 60 * 60 * 1000),
            duration: 60,
            status: 'pending'
          });
          currentHour++;
        }
      }

      return actions.length > 0 ? actions : this.generateFallbackHourlyActions(goal, context, hours);
    } catch (error) {
      console.warn('Hourly action generation failed', error);
      return this.generateFallbackHourlyActions(goal, context, hours);
    }
  }

  /**
   * Decompose action into 15-minute sub-actions
   */
  private async decomposeAction(
    action: PlannedAction,
    context: PlanningContext
  ): Promise<PlannedAction[]> {
    // Simple decomposition: split 60-minute action into 4 x 15-minute actions
    const subActions: PlannedAction[] = [];
    const subDuration = 15; // minutes
    const numSubActions = Math.floor(action.duration / subDuration);

    for (let i = 0; i < numSubActions; i++) {
      subActions.push({
        id: this.generateId(),
        description: `${action.description} (part ${i + 1}/${numSubActions})`,
        startTime: action.startTime + (i * subDuration * 60 * 1000),
        duration: subDuration,
        status: 'pending'
      });
    }

    return subActions.length > 0 ? subActions : [action];
  }

  /**
   * Fallback hourly actions
   */
  private generateFallbackHourlyActions(
    goal: string,
    context: PlanningContext,
    hours: number
  ): PlannedAction[] {
    const actions: PlannedAction[] = [];
    for (let i = 0; i < hours; i++) {
      actions.push({
        id: this.generateId(),
        description: `Work on ${goal}`,
        startTime: context.currentTime + (i * 60 * 60 * 1000),
        duration: 60,
        status: 'pending'
      });
    }
    return actions;
  }

  /**
   * Create default plan
   */
  private createDefaultPlan(
    context: PlanningContext,
    timeHorizon: number
  ): Plan {
    const startTime = context.currentTime;
    const endTime = startTime + (timeHorizon * 60 * 60 * 1000);

    const actions: PlannedAction[] = [];
    for (let i = 0; i < timeHorizon; i++) {
      actions.push({
        id: this.generateId(),
        description: 'Maintain daily routine',
        startTime: startTime + (i * 60 * 60 * 1000),
        duration: 60,
        status: 'pending'
      });
    }

    return {
      id: this.generateId(),
      goal: 'Maintain daily operations',
      startTime,
      endTime,
      actions,
      priority: 0.5,
      status: 'pending'
    };
  }

  /**
   * Update plans based on current time and events
   */
  async updatePlans(currentTime: number, significantEvent?: string): Promise<void> {
    // Check if re-planning is needed
    if (significantEvent) {
      const shouldReplan = await this.shouldReplan(significantEvent);
      if (shouldReplan) {
        // Cancel current plans and generate new ones
        this.activePlans.forEach(plan => {
          plan.status = 'cancelled';
          this.planHistory.push(plan);
        });
        this.activePlans = [];
        return;
      }
    }

    // Update action statuses based on time
    for (const plan of this.activePlans) {
      if (plan.status === 'pending' && currentTime >= plan.startTime) {
        plan.status = 'active';
      }

      for (const action of plan.actions) {
        if (action.status === 'pending' && currentTime >= action.startTime) {
          action.status = 'active';
        } else if (action.status === 'active' && currentTime >= action.startTime + (action.duration * 60 * 1000)) {
          action.status = 'completed';
        }
      }

      // Check if plan is complete
      if (plan.actions.every(a => a.status === 'completed')) {
        plan.status = 'completed';
        this.planHistory.push(plan);
        this.activePlans = this.activePlans.filter(p => p.id !== plan.id);
      }
    }
  }

  /**
   * Determine if re-planning is needed due to significant event
   */
  private async shouldReplan(event: string): Promise<boolean> {
    // Simple heuristic: re-plan if event is significant
    const significantKeywords = ['combat', 'emergency', 'crisis', 'opportunity', 'quest'];
    const eventLower = event.toLowerCase();
    return significantKeywords.some(keyword => eventLower.includes(keyword));
  }

  /**
   * Get current active plan
   */
  getCurrentPlan(): Plan | null {
    const active = this.activePlans.find(p => p.status === 'active');
    return active || this.activePlans.find(p => p.status === 'pending') || null;
  }

  /**
   * Get next action to execute
   */
  getNextAction(currentTime: number): PlannedAction | null {
    for (const plan of this.activePlans) {
      const nextAction = plan.actions.find(
        a => a.status === 'pending' && a.startTime <= currentTime
      );
      if (nextAction) {
        return nextAction;
      }
    }
    return null;
  }

  /**
   * Cancel a plan
   */
  cancelPlan(planId: string): void {
    const plan = this.activePlans.find(p => p.id === planId);
    if (plan) {
      plan.status = 'cancelled';
      plan.actions.forEach(a => a.status = 'cancelled');
      this.planHistory.push(plan);
      this.activePlans = this.activePlans.filter(p => p.id !== planId);
    }
  }

  /**
   * Get all active plans
   */
  getActivePlans(): Plan[] {
    return [...this.activePlans];
  }

  /**
   * Get plan history
   */
  getPlanHistory(limit: number = 10): Plan[] {
    return this.planHistory
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  private generateId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

