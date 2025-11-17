/**
 * Enhanced Situation Evaluator
 * Provides accurate military, economic, and strategic assessments
 */

export class SituationEvaluator {
  /**
   * Evaluate complete game situation
   */
  static evaluate(gameState, playerId) {
    const myPlayer = gameState.players[playerId];
    const enemyPlayers = Object.values(gameState.players).filter(p => p.id !== playerId);
    
    const myUnits = gameState.units.filter(u => u.playerId === playerId);
    const enemyUnits = gameState.units.filter(u => u.playerId !== playerId);
    const myBuildings = gameState.buildings.filter(b => b.playerId === playerId);
    const enemyBuildings = gameState.buildings.filter(b => b.playerId !== playerId);

    return {
      resources: this.evaluateResources(myPlayer, enemyPlayers),
      military: this.evaluateMilitary(myUnits, enemyUnits, myBuildings, enemyBuildings),
      economy: this.evaluateEconomy(myUnits, myBuildings, myPlayer),
      map: this.evaluateMapControl(gameState, playerId),
      threat: this.evaluateThreats(gameState, playerId, myUnits, enemyUnits, myBuildings),
      tech: this.evaluateTech(myPlayer, enemyPlayers),
      timing: this.evaluateTiming(gameState.tick)
    };
  }

  /**
   * Evaluate resource advantage
   */
  static evaluateResources(myPlayer, enemyPlayers) {
    const myTotal = (myPlayer.minerals || 0) + (myPlayer.gas || 0);
    const enemyTotal = enemyPlayers.reduce((sum, p) => 
      sum + (p.minerals || 0) + (p.gas || 0), 0
    ) / Math.max(enemyPlayers.length, 1);

    const advantage = myTotal - enemyTotal;
    const normalized = enemyTotal > 0 ? advantage / (myTotal + enemyTotal) : (myTotal > 0 ? 1 : 0);

    return {
      advantage: normalized,
      myTotal,
      enemyTotal,
      minerals: myPlayer.minerals || 0,
      gas: myPlayer.gas || 0,
      income: this.estimateIncome(myPlayer)
    };
  }

  /**
   * Evaluate military strength
   */
  static evaluateMilitary(myUnits, enemyUnits, myBuildings, enemyBuildings) {
    const myStrength = this.calculateMilitaryStrength(myUnits);
    const enemyStrength = this.calculateMilitaryStrength(enemyUnits);
    
    const myBuildingStrength = this.calculateBuildingStrength(myBuildings);
    const enemyBuildingStrength = this.calculateBuildingStrength(enemyBuildings);

    const totalMy = myStrength + myBuildingStrength * 0.3;
    const totalEnemy = enemyStrength + enemyBuildingStrength * 0.3;

    const advantage = totalEnemy > 0 
      ? (totalMy - totalEnemy) / (totalMy + totalEnemy)
      : (totalMy > 0 ? 1 : 0);

    return {
      advantage,
      myStrength: totalMy,
      enemyStrength: totalEnemy,
      unitCount: myUnits.length,
      enemyUnitCount: enemyUnits.length,
      composition: this.analyzeComposition(myUnits),
      enemyComposition: this.analyzeComposition(enemyUnits)
    };
  }

  /**
   * Calculate military strength of units
   */
  static calculateMilitaryStrength(units) {
    return units.reduce((total, unit) => {
      if (!unit || unit.hp <= 0) return total;
      
      const hpRatio = unit.hp / (unit.maxHp || 1);
      const baseValue = this.getUnitValue(unit.type);
      return total + baseValue * hpRatio;
    }, 0);
  }

  /**
   * Get base value for unit type
   */
  static getUnitValue(unitType) {
    const values = {
      'worker': 5,
      'soldier': 15,
      'tank': 40,
      'air_unit': 25
    };
    return values[unitType] || 10;
  }

  /**
   * Calculate building defensive strength
   */
  static calculateBuildingStrength(buildings) {
    return buildings.reduce((total, building) => {
      if (!building || building.hp <= 0) return total;
      const hpRatio = building.hp / (building.maxHp || 1);
      return total + 20 * hpRatio; // Base building value
    }, 0);
  }

  /**
   * Analyze unit composition
   */
  static analyzeComposition(units) {
    const composition = {
      workers: 0,
      soldiers: 0,
      tanks: 0,
      air: 0,
      total: units.length
    };

    units.forEach(unit => {
      switch (unit.type) {
        case 'worker': composition.workers++; break;
        case 'soldier': composition.soldiers++; break;
        case 'tank': composition.tanks++; break;
        case 'air_unit': composition.air++; break;
      }
    });

    return composition;
  }

  /**
   * Evaluate economic situation
   */
  static evaluateEconomy(myUnits, myBuildings, myPlayer) {
    const workers = myUnits.filter(u => u.type === 'worker');
    const bases = myBuildings.filter(b => b.type === 'base');
    const productionBuildings = myBuildings.filter(b => 
      ['barracks', 'factory', 'airfield'].includes(b.type)
    );

    const workerEfficiency = workers.length / Math.max(bases.length * 8, 1);
    const saturation = Math.min(workerEfficiency, 1);

    return {
      workerCount: workers.length,
      baseCount: bases.length,
      productionCount: productionBuildings.length,
      saturation,
      incomeRate: this.estimateIncome(myPlayer),
      canExpand: (myPlayer.minerals || 0) >= 400 && bases.length < 3
    };
  }

  /**
   * Estimate resource income per tick
   */
  static estimateIncome(player) {
    // Rough estimate: workers generate ~2 minerals per tick
    // This is simplified - adjust based on actual game mechanics
    return 2;
  }

  /**
   * Evaluate map control
   */
  static evaluateMapControl(gameState, playerId) {
    if (!gameState.map) return { control: 0.5, chokepoints: 0 };

    const myUnits = gameState.units.filter(u => u.playerId === playerId);
    const enemyUnits = gameState.units.filter(u => u.playerId !== playerId);

    // Calculate control based on unit positions
    const mapWidth = gameState.map.width || 64;
    const mapHeight = gameState.map.height || 64;
    
    // Simple control calculation based on unit distribution
    const myPositions = myUnits.map(u => ({ x: u.x, y: u.y }));
    const enemyPositions = enemyUnits.map(u => ({ x: u.x, y: u.y }));

    // Control score based on unit spread
    const mySpread = this.calculateSpread(myPositions, mapWidth, mapHeight);
    const enemySpread = this.calculateSpread(enemyPositions, mapWidth, mapHeight);
    
    const totalSpread = mySpread + enemySpread;
    const control = totalSpread > 0 ? mySpread / totalSpread : 0.5;

    return {
      control,
      mySpread,
      enemySpread,
      expansionOpportunities: this.findExpansionOpportunities(gameState, playerId)
    };
  }

  /**
   * Calculate spatial spread of units
   */
  static calculateSpread(positions, mapWidth, mapHeight) {
    if (positions.length === 0) return 0;
    
    // Calculate bounding box area
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    
    return Math.sqrt(width * height) * positions.length;
  }

  /**
   * Find expansion opportunities
   */
  static findExpansionOpportunities(gameState, playerId) {
    const myBuildings = gameState.buildings.filter(b => b.playerId === playerId);
    const bases = myBuildings.filter(b => b.type === 'base');
    
    // Simple: return number of potential expansion sites
    // In a real implementation, this would analyze the map
    return Math.max(0, 3 - bases.length);
  }

  /**
   * Evaluate threats
   */
  static evaluateThreats(gameState, playerId, myUnits, enemyUnits, myBuildings) {
    const threats = [];
    const myBases = myBuildings.filter(b => b.type === 'base');

    // Check for nearby enemy units
    myBases.forEach(base => {
      const nearbyEnemies = enemyUnits.filter(enemy => {
        const dist = Math.hypot(enemy.x - base.x, enemy.y - base.y);
        return dist < 30; // Threat radius
      });

      if (nearbyEnemies.length > 0) {
        const threatStrength = nearbyEnemies.reduce((sum, e) => 
          sum + this.getUnitValue(e.type), 0
        );
        
        threats.push({
          type: 'base_under_attack',
          location: { x: base.x, y: base.y },
          strength: threatStrength,
          unitCount: nearbyEnemies.length,
          distance: Math.min(...nearbyEnemies.map(e => 
            Math.hypot(e.x - base.x, e.y - base.y)
          ))
        });
      }
    });

    // Check for large enemy army
    const enemyArmySize = enemyUnits.filter(u => u.type !== 'worker').length;
    const myArmySize = myUnits.filter(u => u.type !== 'worker').length;
    
    if (enemyArmySize > myArmySize * 1.5) {
      threats.push({
        type: 'army_disadvantage',
        strength: enemyArmySize - myArmySize,
        ratio: enemyArmySize / Math.max(myArmySize, 1)
      });
    }

    // Calculate overall threat level
    const threatLevel = threats.length > 0
      ? Math.min(1, threats.reduce((sum, t) => sum + t.strength, 0) / 100)
      : 0;

    return {
      level: threatLevel,
      threats,
      immediate: threats.filter(t => t.distance && t.distance < 20),
      strategic: threats.filter(t => !t.distance || t.distance >= 20)
    };
  }

  /**
   * Evaluate technology/research
   */
  static evaluateTech(myPlayer, enemyPlayers) {
    // Simplified - adjust based on actual tech system
    const myTech = myPlayer.researchedTechs?.size || 0;
    const enemyTech = Math.max(...enemyPlayers.map(p => p.researchedTechs?.size || 0));

    const advantage = (myTech - enemyTech) / Math.max(myTech + enemyTech, 1);
    
    return {
      advantage,
      myTech,
      enemyTech,
      canResearch: (myPlayer.minerals || 0) >= 200 && (myPlayer.gas || 0) >= 100
    };
  }

  /**
   * Evaluate game timing
   */
  static evaluateTiming(tick) {
    return {
      tick,
      phase: tick < 1000 ? 'early' : (tick < 5000 ? 'mid' : 'late'),
      gameProgress: Math.min(tick / 10000, 1)
    };
  }
}

