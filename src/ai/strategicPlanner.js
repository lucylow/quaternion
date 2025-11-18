/**
 * Strategic Planning System
 * Provides multi-step planning and goal-oriented decision making
 */

export class StrategicPlanner {
  constructor(playerId) {
    this.playerId = playerId;
    this.currentPlan = null;
    this.planHistory = [];
    this.goals = [];
    this.planHorizon = 50; // Plan ahead 50 ticks
  }

  /**
   * Create a strategic plan based on current situation
   */
  createPlan(situation, gameState) {
    const goals = this.identifyGoals(situation, gameState);
    const plan = this.buildPlan(goals, situation, gameState);
    
    this.currentPlan = plan;
    this.planHistory.push({
      tick: gameState.tick,
      plan: { ...plan },
      situation: { ...situation }
    });

    // Keep only last 10 plans
    if (this.planHistory.length > 10) {
      this.planHistory.shift();
    }

    return plan;
  }

  /**
   * Identify strategic goals based on situation
   */
  identifyGoals(situation, gameState) {
    const goals = [];
    const priority = {
      critical: 1.0,
      high: 0.7,
      medium: 0.5,
      low: 0.3
    };

    // Defense goals
    if (situation.threat.level > 0.6) {
      goals.push({
        type: 'defend',
        priority: priority.critical,
        target: 'base',
        description: 'Defend base from imminent threat'
      });
    }

    // Economic goals
    if (situation.economy.saturation < 0.6) {
      goals.push({
        type: 'economy',
        priority: priority.high,
        target: 'workers',
        count: Math.ceil((situation.economy.baseCount * 12) - situation.economy.workerCount),
        description: 'Build workers to improve economy'
      });
    }

    // Military goals
    if (situation.military.advantage < -0.3) {
      goals.push({
        type: 'military',
        priority: priority.high,
        target: 'units',
        count: 5,
        description: 'Build military units to counter enemy advantage'
      });
    }

    // Expansion goals
    if (situation.economy.canExpand && situation.resources.advantage > 0.2) {
      goals.push({
        type: 'expand',
        priority: priority.medium,
        target: 'base',
        description: 'Expand to new base location'
      });
    }

    // Attack goals
    if (situation.military.advantage > 0.3 && situation.threat.level < 0.3) {
      goals.push({
        type: 'attack',
        priority: priority.medium,
        target: 'enemy_base',
        description: 'Launch offensive with military advantage'
      });
    }

    // Tech goals (if applicable)
    if (situation.tech.advantage < -0.2 && situation.resources.minerals > 300) {
      goals.push({
        type: 'tech',
        priority: priority.low,
        target: 'research',
        description: 'Research technologies to catch up'
      });
    }

    // Sort by priority
    return goals.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Build a plan from goals
   */
  buildPlan(goals, situation, gameState) {
    const plan = {
      goals: goals,
      steps: [],
      estimatedTicks: 0,
      resources: {
        minerals: 0,
        gas: 0
      },
      created: gameState.tick
    };

    // Convert goals to actionable steps
    goals.forEach(goal => {
      const steps = this.goalToSteps(goal, situation, gameState);
      plan.steps.push(...steps);
    });

    // Calculate resource requirements
    plan.resources = this.calculateResourceRequirements(plan.steps);
    plan.estimatedTicks = this.estimatePlanDuration(plan.steps);

    return plan;
  }

  /**
   * Convert goal to actionable steps
   */
  goalToSteps(goal, situation, gameState) {
    const steps = [];

    switch (goal.type) {
      case 'defend':
        steps.push({
          action: 'defend',
          target: 'base',
          priority: goal.priority,
          ticks: 10
        });
        if (situation.military.armySize < 5) {
          steps.push({
            action: 'build_unit',
            unitType: 'soldier',
            count: Math.max(3, 5 - situation.military.armySize),
            priority: goal.priority,
            ticks: 30
          });
        }
        break;

      case 'economy':
        steps.push({
          action: 'build_unit',
          unitType: 'worker',
          count: goal.count || 3,
          priority: goal.priority,
          ticks: 20 * (goal.count || 3)
        });
        break;

      case 'military':
        steps.push({
          action: 'build_unit',
          unitType: 'soldier',
          count: goal.count || 5,
          priority: goal.priority,
          ticks: 30 * (goal.count || 5)
        });
        break;

      case 'expand':
        steps.push({
          action: 'build_building',
          buildingType: 'base',
          priority: goal.priority,
          ticks: 60,
          requires: { minerals: 400 }
        });
        steps.push({
          action: 'build_unit',
          unitType: 'worker',
          count: 4,
          priority: goal.priority * 0.8,
          ticks: 80,
          dependsOn: 'expand'
        });
        break;

      case 'attack':
        steps.push({
          action: 'army_attack',
          target: 'enemy_base',
          priority: goal.priority,
          ticks: 20
        });
        break;

      case 'tech':
        steps.push({
          action: 'research',
          priority: goal.priority,
          ticks: 100,
          requires: { minerals: 200, gas: 100 }
        });
        break;
    }

    return steps;
  }

  /**
   * Calculate resource requirements for plan
   */
  calculateResourceRequirements(steps) {
    return steps.reduce((total, step) => {
      if (step.requires) {
        total.minerals += step.requires.minerals || 0;
        total.gas += step.requires.gas || 0;
      } else if (step.action === 'build_unit') {
        const costs = this.getUnitCost(step.unitType);
        total.minerals += (costs.minerals || 0) * (step.count || 1);
        total.gas += (costs.gas || 0) * (step.count || 1);
      } else if (step.action === 'build_building') {
        const costs = this.getBuildingCost(step.buildingType);
        total.minerals += costs.minerals || 0;
        total.gas += costs.gas || 0;
      }
      return total;
    }, { minerals: 0, gas: 0 });
  }

  /**
   * Get unit cost
   */
  getUnitCost(unitType) {
    const costs = {
      'worker': { minerals: 50, gas: 0 },
      'soldier': { minerals: 100, gas: 0 },
      'tank': { minerals: 150, gas: 100 },
      'air_unit': { minerals: 125, gas: 75 }
    };
    return costs[unitType] || { minerals: 0, gas: 0 };
  }

  /**
   * Get building cost
   */
  getBuildingCost(buildingType) {
    const costs = {
      'base': { minerals: 400, gas: 0 },
      'barracks': { minerals: 100, gas: 0 },
      'factory': { minerals: 150, gas: 50 }
    };
    return costs[buildingType] || { minerals: 0, gas: 0 };
  }

  /**
   * Estimate plan duration
   */
  estimatePlanDuration(steps) {
    return steps.reduce((total, step) => total + (step.ticks || 0), 0);
  }

  /**
   * Get next step from current plan
   */
  getNextStep(gameState) {
    if (!this.currentPlan || this.currentPlan.steps.length === 0) {
      return null;
    }

    // Check if plan is still valid
    const planAge = gameState.tick - this.currentPlan.created;
    if (planAge > this.planHorizon * 2) {
      // Plan is too old, invalidate it
      this.currentPlan = null;
      return null;
    }

    // Find next uncompleted step
    const nextStep = this.currentPlan.steps.find(step => !step.completed);
    return nextStep;
  }

  /**
   * Mark step as completed
   */
  completeStep(stepIndex) {
    if (this.currentPlan && this.currentPlan.steps[stepIndex]) {
      this.currentPlan.steps[stepIndex].completed = true;
    }
  }

  /**
   * Check if plan is complete
   */
  isPlanComplete() {
    if (!this.currentPlan) return true;
    return this.currentPlan.steps.every(step => step.completed);
  }

  /**
   * Update plan based on changing situation
   */
  updatePlan(situation, gameState) {
    if (!this.currentPlan) return;

    // Check if plan needs revision
    const needsRevision = this.shouldRevisePlan(situation, gameState);
    
    if (needsRevision) {
      // Create new plan
      this.createPlan(situation, gameState);
    }
  }

  /**
   * Determine if plan needs revision
   */
  shouldRevisePlan(situation, gameState) {
    if (!this.currentPlan) return true;

    // Revise if critical threat appears
    if (situation.threat.level > 0.7 && 
        !this.currentPlan.goals.some(g => g.type === 'defend')) {
      return true;
    }

    // Revise if resources are insufficient
    const player = gameState.players[this.playerId];
    if (player.minerals < this.currentPlan.resources.minerals * 0.5 &&
        this.currentPlan.steps.some(s => !s.completed && s.requires)) {
      return true;
    }

    // Revise if plan is taking too long
    const planAge = gameState.tick - this.currentPlan.created;
    if (planAge > this.currentPlan.estimatedTicks * 2) {
      return true;
    }

    return false;
  }
}


