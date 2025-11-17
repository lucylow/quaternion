export const UnitType = {
  WORKER: 'worker',
  SOLDIER: 'soldier',
  TANK: 'tank',
  AIR_UNIT: 'air_unit'
};

export const UnitState = {
  IDLE: 'idle',
  MOVING: 'moving',
  ATTACKING: 'attacking',
  GATHERING: 'gathering',
  BUILDING: 'building'
};

/**
 * Base unit class
 */
export class Unit {
  constructor(id, type, playerId, x, y) {
    this.id = id;
    this.type = type;
    this.playerId = playerId;
    this.x = x;
    this.y = y;
    this.state = UnitState.IDLE;
    
    // Stats based on type
    const stats = this.getBaseStats(type);
    this.maxHp = stats.maxHp;
    this.hp = stats.maxHp;
    this.attack = stats.attack;
    this.defense = stats.defense;
    this.speed = stats.speed;
    this.range = stats.range;
    this.cost = stats.cost;
    this.buildTime = stats.buildTime;
    
    // Movement and targeting
    this.targetX = x;
    this.targetY = y;
    this.targetUnit = null;
    this.path = [];
    this.commandQueue = [];
    
    // Resources (for workers)
    this.carrying = 0;
    this.carryCapacity = type === UnitType.WORKER ? 10 : 0;
    this.gatherTarget = null;
  }

  getBaseStats(type) {
    const stats = {
      [UnitType.WORKER]: {
        maxHp: 50,
        attack: 5,
        defense: 0,
        speed: 2.5,
        range: 1,
        cost: { minerals: 50, gas: 0 },
        buildTime: 20
      },
      [UnitType.SOLDIER]: {
        maxHp: 100,
        attack: 15,
        defense: 5,
        speed: 3.0,
        range: 1,
        cost: { minerals: 100, gas: 0 },
        buildTime: 30
      },
      [UnitType.TANK]: {
        maxHp: 200,
        attack: 35,
        defense: 15,
        speed: 1.5,
        range: 5,
        cost: { minerals: 150, gas: 100 },
        buildTime: 50
      },
      [UnitType.AIR_UNIT]: {
        maxHp: 120,
        attack: 25,
        defense: 5,
        speed: 4.0,
        range: 4,
        cost: { minerals: 125, gas: 75 },
        buildTime: 40
      }
    };
    return stats[type];
  }

  /**
   * Update unit state each tick
   */
  update(gameState) {
    switch (this.state) {
      case UnitState.MOVING:
        this.updateMovement(gameState);
        break;
      case UnitState.ATTACKING:
        this.updateAttack(gameState);
        break;
      case UnitState.GATHERING:
        this.updateGathering(gameState);
        break;
    }
  }

  /**
   * Move towards target position
   */
  updateMovement(gameState) {
    if (this.path.length === 0) {
      if (Math.abs(this.x - this.targetX) < 0.1 && Math.abs(this.y - this.targetY) < 0.1) {
        this.state = UnitState.IDLE;
        return;
      }
    }

    // Simple movement (pathfinding happens when command is issued)
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.1) {
      const moveAmount = Math.min(this.speed / 60, dist); // 60 ticks per second
      this.x += (dx / dist) * moveAmount;
      this.y += (dy / dist) * moveAmount;
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
      this.state = UnitState.IDLE;
    }
  }

  /**
   * Attack target unit
   */
  updateAttack(gameState) {
    if (!this.targetUnit || this.targetUnit.hp <= 0) {
      this.state = UnitState.IDLE;
      this.targetUnit = null;
      return;
    }

    const dx = this.targetUnit.x - this.x;
    const dy = this.targetUnit.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.range) {
      // Move closer
      this.targetX = this.targetUnit.x;
      this.targetY = this.targetY;
      this.updateMovement(gameState);
    } else {
      // In range, attack every second
      if (!this.lastAttackTick || gameState.tick - this.lastAttackTick >= 60) {
        this.performAttack(this.targetUnit);
        this.lastAttackTick = gameState.tick;
      }
    }
  }

  /**
   * Perform attack on target
   */
  performAttack(target) {
    const damage = Math.max(1, this.attack - target.defense);
    target.hp -= damage;
    
    if (target.hp <= 0) {
      target.hp = 0;
      this.targetUnit = null;
      this.state = UnitState.IDLE;
    }
  }

  /**
   * Gather resources
   */
  updateGathering(gameState) {
    if (!this.gatherTarget) {
      this.state = UnitState.IDLE;
      return;
    }

    if (this.carrying >= this.carryCapacity) {
      // Return to base
      const base = this.findNearestBase(gameState);
      if (base) {
        this.moveToPosition(base.x, base.y);
        // Deposit when close
        if (this.distanceTo(base.x, base.y) < 2) {
          this.depositResources(gameState);
        }
      }
    } else {
      // Move to resource and gather
      if (this.distanceTo(this.gatherTarget.x, this.gatherTarget.y) < 2) {
        // Gather
        if (!this.lastGatherTick || gameState.tick - this.lastGatherTick >= 30) {
          const gathered = Math.min(5, this.gatherTarget.amount, this.carryCapacity - this.carrying);
          this.carrying += gathered;
          this.gatherTarget.amount -= gathered;
          this.lastGatherTick = gameState.tick;
        }
      } else {
        this.moveToPosition(this.gatherTarget.x, this.gatherTarget.y);
        this.updateMovement(gameState);
      }
    }
  }

  /**
   * Deposit resources at base
   */
  depositResources(gameState) {
    const player = gameState.players[this.playerId];
    if (player && this.gatherTarget) {
      if (this.gatherTarget.type === 'mineral') {
        player.minerals += this.carrying;
      } else if (this.gatherTarget.type === 'gas') {
        player.gas += this.carrying;
      }
      this.carrying = 0;
    }
  }

  /**
   * Find nearest base for this player
   */
  findNearestBase(gameState) {
    const buildings = gameState.buildings.filter(b => b.playerId === this.playerId && b.type === 'base');
    if (buildings.length === 0) return null;
    
    return buildings.reduce((nearest, building) => {
      const dist = this.distanceTo(building.x, building.y);
      const nearestDist = this.distanceTo(nearest.x, nearest.y);
      return dist < nearestDist ? building : nearest;
    });
  }

  /**
   * Calculate distance to position
   */
  distanceTo(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Issue move command
   */
  moveToPosition(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.state = UnitState.MOVING;
  }

  /**
   * Issue attack command
   */
  attackUnit(unit) {
    this.targetUnit = unit;
    this.state = UnitState.ATTACKING;
  }

  /**
   * Issue gather command
   */
  gatherResource(resource) {
    if (this.type !== UnitType.WORKER) return;
    this.gatherTarget = resource;
    this.state = UnitState.GATHERING;
  }

  /**
   * Serialize unit for network transfer
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      playerId: this.playerId,
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHp: this.maxHp,
      state: this.state,
      carrying: this.carrying
    };
  }
}
