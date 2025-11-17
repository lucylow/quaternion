export const BuildingType = {
  BASE: 'base',
  BARRACKS: 'barracks',
  FACTORY: 'factory',
  AIRFIELD: 'airfield',
  REFINERY: 'refinery'
};

/**
 * Building class
 */
export class Building {
  constructor(id, type, playerId, x, y) {
    this.id = id;
    this.type = type;
    this.playerId = playerId;
    this.x = x;
    this.y = y;
    
    const stats = this.getBaseStats(type);
    this.maxHp = stats.maxHp;
    this.hp = stats.maxHp;
    this.cost = stats.cost;
    this.buildTime = stats.buildTime;
    this.size = stats.size;
    
    this.constructionProgress = 0;
    this.isComplete = false;
    this.productionQueue = [];
    this.rallyPoint = { x: x + 3, y: y + 3 };
  }

  getBaseStats(type) {
    const stats = {
      [BuildingType.BASE]: {
        maxHp: 500,
        cost: { minerals: 400, gas: 0 },
        buildTime: 100,
        size: 3,
        produces: ['worker']
      },
      [BuildingType.BARRACKS]: {
        maxHp: 300,
        cost: { minerals: 150, gas: 0 },
        buildTime: 60,
        size: 2,
        produces: ['soldier']
      },
      [BuildingType.FACTORY]: {
        maxHp: 350,
        cost: { minerals: 200, gas: 100 },
        buildTime: 70,
        size: 3,
        produces: ['tank']
      },
      [BuildingType.AIRFIELD]: {
        maxHp: 300,
        cost: { minerals: 150, gas: 100 },
        buildTime: 80,
        size: 3,
        produces: ['air_unit']
      },
      [BuildingType.REFINERY]: {
        maxHp: 200,
        cost: { minerals: 100, gas: 0 },
        buildTime: 40,
        size: 2,
        produces: []
      }
    };
    return stats[type];
  }

  /**
   * Update building each tick
   */
  update(gameState) {
    // Construction
    if (!this.isComplete) {
      this.constructionProgress++;
      if (this.constructionProgress >= this.buildTime) {
        this.isComplete = true;
      }
      return;
    }

    // Production
    if (this.productionQueue.length > 0) {
      const current = this.productionQueue[0];
      current.progress = (current.progress || 0) + 1;

      if (current.progress >= current.buildTime) {
        // Unit complete
        this.spawnUnit(gameState, current.unitType);
        this.productionQueue.shift();
      }
    }
  }

  /**
   * Add unit to production queue
   */
  produceUnit(unitType, unitStats) {
    this.productionQueue.push({
      unitType,
      buildTime: unitStats.buildTime,
      progress: 0
    });
  }

  /**
   * Spawn completed unit
   */
  spawnUnit(gameState, unitType) {
    const spawnX = this.rallyPoint.x;
    const spawnY = this.rallyPoint.y;
    
    gameState.createUnit(unitType, this.playerId, spawnX, spawnY);
  }

  /**
   * Set rally point for spawned units
   */
  setRallyPoint(x, y) {
    this.rallyPoint = { x, y };
  }

  /**
   * Serialize building
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
      isComplete: this.isComplete,
      constructionProgress: this.constructionProgress,
      buildTime: this.buildTime,
      productionQueue: this.productionQueue.length
    };
  }
}
