/**
 * Build strategic decision prompt from game state
 */
export function buildStrategyPrompt(gameState, playerId) {
  const player = gameState.players[playerId];
  const myUnits = gameState.units.filter(u => u.playerId === playerId);
  const myBuildings = gameState.buildings.filter(b => b.playerId === playerId);
  const enemyUnits = gameState.units.filter(u => u.playerId !== playerId);
  const enemyBuildings = gameState.buildings.filter(b => b.playerId !== playerId);

  const summary = {
    tick: gameState.tick,
    resources: {
      minerals: player.minerals,
      gas: player.gas
    },
    army: {
      workers: myUnits.filter(u => u.type === 'worker').length,
      soldiers: myUnits.filter(u => u.type === 'soldier').length,
      tanks: myUnits.filter(u => u.type === 'tank').length,
      total: myUnits.length
    },
    buildings: {
      bases: myBuildings.filter(b => b.type === 'base').length,
      barracks: myBuildings.filter(b => b.type === 'barracks').length,
      factories: myBuildings.filter(b => b.type === 'factory').length,
      total: myBuildings.length
    },
    enemies: {
      units: enemyUnits.length,
      buildings: enemyBuildings.length,
      nearestThreat: findNearestThreat(myBuildings[0], enemyUnits)
    }
  };

  return `GAME STATE (Tick ${summary.tick}):
Resources: ${summary.resources.minerals} minerals, ${summary.resources.gas} gas
Army: ${summary.army.workers} workers, ${summary.army.soldiers} soldiers, ${summary.army.tanks} tanks
Buildings: ${summary.buildings.bases} bases, ${summary.buildings.barracks} barracks, ${summary.buildings.factories} factories
Enemy: ${summary.enemies.units} units, ${summary.enemies.buildings} buildings
Threat distance: ${summary.enemies.nearestThreat}

Recommend ONE high-level strategic action. Consider:
- Economy: Build workers if < 12
- Military: Build soldiers (100 minerals) or tanks (150 minerals, 100 gas)
- Expansion: Build new base if resources > 400
- Defense: Focus defense if enemy units nearby
- Attack: Launch attack if army size > 5`;
}

function findNearestThreat(base, enemyUnits) {
  if (!base || enemyUnits.length === 0) return 'none';
  const nearest = enemyUnits.reduce((min, u) => {
    const dist = Math.hypot(u.x - base.x, u.y - base.y);
    return dist < min ? dist : min;
  }, Infinity);
  return nearest === Infinity ? 'none' : Math.round(nearest);
}
