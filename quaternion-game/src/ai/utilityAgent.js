/**
 * Utility-based AI Agent for unit-level decision making
 * Deterministic, fast, and debuggable
 */

export class UtilityAgent {
  constructor(unit, gameState) {
    this.unit = unit;
    this.gameState = gameState;
    this.actions = this.getAvailableActions();
  }

  /**
   * Get all possible actions for this unit
   */
  getAvailableActions() {
    return [
      { type: 'attack', execute: this.attack.bind(this) },
      { type: 'move', execute: this.move.bind(this) },
      { type: 'retreat', execute: this.retreat.bind(this) },
      { type: 'ability', execute: this.useAbility.bind(this) },
      { type: 'idle', execute: this.idle.bind(this) }
    ];
  }

  /**
   * Main decision loop - evaluate and execute best action
   */
  tick() {
    const scored = this.actions.map(action => ({
      action,
      score: this.evaluate(action)
    }));

    // Find best action
    const best = scored.reduce((max, curr) => 
      curr.score > max.score ? curr : max
    );

    // Log decision for debugging
    console.log(`Unit ${this.unit.id} chose ${best.action.type} (score: ${best.score.toFixed(2)})`);

    // Execute
    return best.action.execute();
  }

  /**
   * Evaluate an action using utility heuristics
   */
  evaluate(action) {
    let score = 0;

    switch (action.type) {
      case 'attack':
        score = this.attackScore();
        break;
      case 'move':
        score = this.moveScore();
        break;
      case 'retreat':
        score = this.retreatScore();
        break;
      case 'ability':
        score = this.abilityScore();
        break;
      case 'idle':
        score = 0.1; // Low baseline
        break;
    }

    // Add small random factor for variety (deterministic if seeded)
    const epsilon = (Math.random() - 0.5) * 0.05;
    return Math.max(0, score + epsilon);
  }

  /**
   * Attack scoring heuristic
   */
  attackScore() {
    const nearestEnemy = this.findNearestEnemy();
    if (!nearestEnemy) return 0;

    let score = 0.5; // Base score

    // Distance factor - closer is better
    const distance = this.distance(this.unit.position, nearestEnemy.position);
    score += (1 - Math.min(distance / 100, 1)) * 0.3;

    // Target HP factor - prefer low HP targets
    score += (1 - nearestEnemy.hp / nearestEnemy.maxHp) * 0.2;

    // Our HP factor - only attack if we're healthy
    score += (this.unit.hp / this.unit.maxHp) * 0.2;

    // Friendly support nearby
    const friendliesNearby = this.countFriendliesInRange(50);
    score += Math.min(friendliesNearby * 0.1, 0.3);

    return score;
  }

  /**
   * Move scoring heuristic
   */
  moveScore() {
    const objective = this.findBestObjective();
    if (!objective) return 0.2;

    let score = 0.4;

    // Distance to objective
    const distance = this.distance(this.unit.position, objective.position);
    score += (1 - Math.min(distance / 150, 1)) * 0.3;

    // Objective value
    score += objective.value * 0.2;

    return score;
  }

  /**
   * Retreat scoring heuristic
   */
  retreatScore() {
    let score = 0;

    // Low HP - retreat!
    const hpRatio = this.unit.hp / this.unit.maxHp;
    if (hpRatio < 0.3) {
      score += 0.8;
    }

    // Outnumbered
    const enemiesNearby = this.countEnemiesInRange(50);
    const friendliesNearby = this.countFriendliesInRange(50);
    
    if (enemiesNearby > friendliesNearby * 1.5) {
      score += 0.5;
    }

    // Under heavy fire
    if (this.unit.damageThisTurn > this.unit.maxHp * 0.3) {
      score += 0.6;
    }

    return score;
  }

  /**
   * Ability usage scoring
   */
  abilityScore() {
    if (!this.unit.ability || !this.unit.ability.ready) return 0;

    let score = 0.3;

    // High value if many enemies in AOE
    if (this.unit.ability.type === 'aoe') {
      const enemiesInRange = this.countEnemiesInRange(this.unit.ability.radius);
      score += enemiesInRange * 0.2;
    }

    // Healing ability - use when hurt
    if (this.unit.ability.type === 'heal') {
      const hpRatio = this.unit.hp / this.unit.maxHp;
      score += (1 - hpRatio) * 0.6;
    }

    return score;
  }

  // Helper methods
  findNearestEnemy() {
    const enemies = this.gameState.getEnemyUnits(this.unit.playerId);
    if (!enemies.length) return null;

    return enemies.reduce((nearest, enemy) => {
      const dist = this.distance(this.unit.position, enemy.position);
      return !nearest || dist < this.distance(this.unit.position, nearest.position)
        ? enemy
        : nearest;
    }, null);
  }

  findBestObjective() {
    const objectives = this.gameState.getObjectives();
    // Simple: pick closest high-value objective
    return objectives.sort((a, b) => {
      const distA = this.distance(this.unit.position, a.position);
      const distB = this.distance(this.unit.position, b.position);
      return (distA / (a.value + 1)) - (distB / (b.value + 1));
    })[0];
  }

  countEnemiesInRange(range) {
    const enemies = this.gameState.getEnemyUnits(this.unit.playerId);
    return enemies.filter(e => 
      this.distance(this.unit.position, e.position) <= range
    ).length;
  }

  countFriendliesInRange(range) {
    const friendlies = this.gameState.getFriendlyUnits(this.unit.playerId);
    return friendlies.filter(f => 
      f.id !== this.unit.id && 
      this.distance(this.unit.position, f.position) <= range
    ).length;
  }

  distance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Action executors (to be implemented based on your game engine)
  attack() {
    const target = this.findNearestEnemy();
    if (target) {
      return { type: 'attack', target: target.id };
    }
    return { type: 'idle' };
  }

  move() {
    const objective = this.findBestObjective();
    if (objective) {
      return { type: 'move', position: objective.position };
    }
    return { type: 'idle' };
  }

  retreat() {
    // Move away from nearest enemy
    const enemy = this.findNearestEnemy();
    if (enemy) {
      const dx = this.unit.position.x - enemy.position.x;
      const dy = this.unit.position.y - enemy.position.y;
      const retreatPos = {
        x: this.unit.position.x + dx,
        y: this.unit.position.y + dy
      };
      return { type: 'move', position: retreatPos, retreat: true };
    }
    return { type: 'idle' };
  }

  useAbility() {
    if (this.unit.ability && this.unit.ability.ready) {
      return { type: 'ability', abilityId: this.unit.ability.id };
    }
    return { type: 'idle' };
  }

  idle() {
    return { type: 'idle' };
  }
}

/**
 * Squad-level coordinator
 */
export class SquadAgent {
  constructor(units, gameState) {
    this.units = units;
    this.gameState = gameState;
    this.state = 'idle'; // idle, hold, attack, flank, retreat
  }

  tick() {
    this.updateState();
    this.executeState();
  }

  updateState() {
    const enemiesVisible = this.gameState.getVisibleEnemies();
    const squadStrength = this.calculateStrength(this.units);
    const enemyStrength = this.calculateStrength(enemiesVisible);

    // State transitions
    if (enemiesVisible.length === 0) {
      this.state = 'idle';
    } else if (squadStrength > enemyStrength * 1.5) {
      this.state = 'attack';
    } else if (squadStrength < enemyStrength * 0.7) {
      this.state = 'retreat';
    } else if (this.hasFlankingOpportunity()) {
      this.state = 'flank';
    } else {
      this.state = 'hold';
    }
  }

  executeState() {
    switch (this.state) {
      case 'attack':
        this.issueAttackOrders();
        break;
      case 'retreat':
        this.issueRetreatOrders();
        break;
      case 'flank':
        this.issueFlankOrders();
        break;
      case 'hold':
        this.issueHoldOrders();
        break;
      default:
        // idle - let unit agents decide
        break;
    }
  }

  calculateStrength(units) {
    return units.reduce((total, unit) => {
      return total + (unit.attack || 1) * (unit.hp / unit.maxHp);
    }, 0);
  }

  hasFlankingOpportunity() {
    // Simple check: are there enemies with exposed flanks?
    const enemies = this.gameState.getVisibleEnemies();
    // Implementation depends on your map/positioning system
    return enemies.length > 2 && Math.random() > 0.7;
  }

  issueAttackOrders() {
    const target = this.gameState.getPriorityTarget();
    this.units.forEach(unit => {
      unit.setGoal({ type: 'attack', target });
    });
  }

  issueRetreatOrders() {
    const rallyPoint = this.gameState.getSafeRallyPoint();
    this.units.forEach(unit => {
      unit.setGoal({ type: 'retreat', position: rallyPoint });
    });
  }

  issueFlankOrders() {
    const flankPosition = this.gameState.getFlankPosition();
    this.units.forEach((unit, i) => {
      const offset = this.calculateFormationOffset(i, this.units.length);
      unit.setGoal({ 
        type: 'move', 
        position: { 
          x: flankPosition.x + offset.x, 
          y: flankPosition.y + offset.y 
        }
      });
    });
  }

  issueHoldOrders() {
    const holdPosition = this.calculateSquadCenter();
    this.units.forEach(unit => {
      unit.setGoal({ type: 'hold', position: holdPosition });
    });
  }

  calculateSquadCenter() {
    const sum = this.units.reduce((acc, unit) => ({
      x: acc.x + unit.position.x,
      y: acc.y + unit.position.y
    }), { x: 0, y: 0 });

    return {
      x: sum.x / this.units.length,
      y: sum.y / this.units.length
    };
  }

  calculateFormationOffset(index, total) {
    // Simple line formation
    const spacing = 20;
    const centerOffset = (total - 1) * spacing / 2;
    return {
      x: (index * spacing) - centerOffset,
      y: 0
    };
  }
}
