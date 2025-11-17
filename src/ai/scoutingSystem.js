/**
 * Scouting System for Map Awareness
 * Tracks explored areas, enemy positions, and strategic locations
 */

export class ScoutingSystem {
  constructor(playerId, mapWidth = 64, mapHeight = 64) {
    this.playerId = playerId;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.cellSize = 4; // Grid cell size for fog of war
    
    // Fog of war grid
    this.explored = new Set();
    this.lastSeen = new Map(); // position -> tick when last seen
    this.enemyPositions = new Map(); // position -> { tick, unitType, count }
    this.resourceNodes = new Set();
    this.strategicLocations = new Set();
    
    // Scouting targets
    this.scoutTargets = [];
    this.priorityTargets = [];
  }

  /**
   * Update scouting information from current game state
   */
  update(gameState) {
    const myUnits = gameState.units.filter(u => u.playerId === this.playerId);
    const enemyUnits = gameState.units.filter(u => u.playerId !== this.playerId);
    const resources = gameState.map?.resources || [];

    // Update explored areas based on unit vision
    myUnits.forEach(unit => {
      const visionRange = this.getVisionRange(unit.type);
      this.exploreArea(unit.x, unit.y, visionRange, gameState.tick);
    });

    // Track enemy positions
    enemyUnits.forEach(enemy => {
      const key = this.getCellKey(enemy.x, enemy.y);
      this.enemyPositions.set(key, {
        tick: gameState.tick,
        unitType: enemy.type,
        x: enemy.x,
        y: enemy.y,
        count: (this.enemyPositions.get(key)?.count || 0) + 1
      });
    });

    // Track resource nodes
    resources.forEach(resource => {
      if (this.isExplored(resource.x, resource.y)) {
        this.resourceNodes.add(this.getCellKey(resource.x, resource.y));
      }
    });

    // Update strategic locations
    this.updateStrategicLocations(gameState);
  }

  /**
   * Explore area around position
   */
  exploreArea(x, y, radius, tick) {
    const cells = this.getCellsInRadius(x, y, radius);
    cells.forEach(cell => {
      this.explored.add(cell);
      this.lastSeen.set(cell, tick);
    });
  }

  /**
   * Get cells in radius
   */
  getCellsInRadius(x, y, radius) {
    const cells = [];
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const dx = (cx * this.cellSize + this.cellSize / 2) - x;
        const dy = (cy * this.cellSize + this.cellSize / 2) - y;
        if (Math.hypot(dx, dy) <= radius) {
          cells.push(this.getCellKey(cx * this.cellSize, cy * this.cellSize));
        }
      }
    }
    return cells;
  }

  /**
   * Get vision range for unit type
   */
  getVisionRange(unitType) {
    const ranges = {
      'worker': 8,
      'soldier': 10,
      'tank': 12,
      'air_unit': 15
    };
    return ranges[unitType] || 8;
  }

  /**
   * Check if position is explored
   */
  isExplored(x, y) {
    return this.explored.has(this.getCellKey(x, y));
  }

  /**
   * Get cell key for position
   */
  getCellKey(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  /**
   * Get unexplored areas that should be scouted
   */
  getScoutTargets(gameState, maxTargets = 5) {
    const targets = [];
    const myBases = gameState.buildings.filter(b => 
      b.playerId === this.playerId && b.type === 'base'
    );

    if (myBases.length === 0) return targets;

    // Find unexplored areas near bases
    const searchRadius = 30;
    const step = 5;

    myBases.forEach(base => {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        for (let dist = 10; dist <= searchRadius; dist += step) {
          const x = base.x + Math.cos(angle) * dist;
          const y = base.y + Math.sin(angle) * dist;

          if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            if (!this.isExplored(x, y)) {
              const priority = this.calculateScoutPriority(x, y, gameState);
              targets.push({ x, y, priority, distance: dist });
            }
          }
        }
      }
    });

    // Sort by priority and distance
    return targets
      .sort((a, b) => {
        if (Math.abs(a.priority - b.priority) > 0.1) {
          return b.priority - a.priority;
        }
        return a.distance - b.distance;
      })
      .slice(0, maxTargets);
  }

  /**
   * Calculate scout priority for location
   */
  calculateScoutPriority(x, y, gameState) {
    let priority = 0.5;

    // Higher priority for center of map
    const centerX = this.mapWidth / 2;
    const centerY = this.mapHeight / 2;
    const distFromCenter = Math.hypot(x - centerX, y - centerY);
    priority += (1 - distFromCenter / Math.hypot(centerX, centerY)) * 0.3;

    // Higher priority for areas with recent enemy sightings nearby
    const nearbyEnemies = Array.from(this.enemyPositions.values()).filter(e => {
      const dist = Math.hypot(e.x - x, e.y - y);
      return dist < 20 && (gameState.tick - e.tick) < 500;
    });
    priority += nearbyEnemies.length * 0.2;

    // Higher priority for resource-rich areas (if known)
    const nearbyResources = Array.from(this.resourceNodes).filter(key => {
      const [cx, cy] = key.split(',').map(Number);
      const dist = Math.hypot(cx * this.cellSize - x, cy * this.cellSize - y);
      return dist < 15;
    });
    priority += nearbyResources.length * 0.15;

    return Math.min(1, priority);
  }

  /**
   * Get last known enemy positions
   */
  getLastKnownEnemyPositions(currentTick, maxAge = 1000) {
    return Array.from(this.enemyPositions.values())
      .filter(e => (currentTick - e.tick) < maxAge)
      .map(e => ({ x: e.x, y: e.y, unitType: e.unitType, age: currentTick - e.tick }));
  }

  /**
   * Update strategic locations
   */
  updateStrategicLocations(gameState) {
    // Identify chokepoints, high ground, etc.
    // Simplified implementation
    const myBases = gameState.buildings.filter(b => 
      b.playerId === this.playerId && b.type === 'base'
    );

    myBases.forEach(base => {
      // Mark base as strategic
      this.strategicLocations.add(this.getCellKey(base.x, base.y));
    });
  }

  /**
   * Get exploration percentage
   */
  getExplorationPercentage() {
    const totalCells = (this.mapWidth / this.cellSize) * (this.mapHeight / this.cellSize);
    return (this.explored.size / totalCells) * 100;
  }

  /**
   * Check if area needs scouting
   */
  needsScouting(x, y, currentTick, maxAge = 2000) {
    const key = this.getCellKey(x, y);
    if (!this.explored.has(key)) return true;
    
    const lastSeen = this.lastSeen.get(key);
    if (!lastSeen) return true;
    
    return (currentTick - lastSeen) > maxAge;
  }
}

