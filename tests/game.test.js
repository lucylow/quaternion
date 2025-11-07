import { test } from 'node:test';
import assert from 'node:assert';
import { GameState } from '../src/game/GameState.js';
import { MapGenerator } from '../src/map/MapGenerator.js';
import { Unit, UnitType } from '../src/units/Unit.js';

test('GameState initializes correctly', () => {
  const game = new GameState({ mapWidth: 32, mapHeight: 32 });
  
  assert.ok(game.id);
  assert.strictEqual(game.tick, 0);
  assert.strictEqual(game.isRunning, false);
  assert.strictEqual(game.map.width, 32);
  assert.strictEqual(game.map.height, 32);
});

test('Map generation creates valid terrain', () => {
  const mapGen = new MapGenerator(32, 32, 12345);
  const map = mapGen.generate();
  
  assert.strictEqual(map.width, 32);
  assert.strictEqual(map.height, 32);
  assert.strictEqual(map.tiles.length, 32 * 32);
  assert.ok(map.resources.length > 0);
  assert.strictEqual(map.startPositions.length, 2);
});

test('Unit creation works correctly', () => {
  const unit = new Unit('test_1', UnitType.WORKER, 1, 10, 10);
  
  assert.strictEqual(unit.id, 'test_1');
  assert.strictEqual(unit.type, UnitType.WORKER);
  assert.strictEqual(unit.playerId, 1);
  assert.strictEqual(unit.x, 10);
  assert.strictEqual(unit.y, 10);
  assert.strictEqual(unit.hp, 50);
  assert.strictEqual(unit.maxHp, 50);
});

test('Unit movement updates position', () => {
  const unit = new Unit('test_1', UnitType.WORKER, 1, 0, 0);
  unit.moveToPosition(10, 10);
  
  assert.strictEqual(unit.state, 'moving');
  assert.strictEqual(unit.targetX, 10);
  assert.strictEqual(unit.targetY, 10);
});

test('Game starts with correct initial units', () => {
  const game = new GameState({ mapWidth: 32, mapHeight: 32 });
  
  // Each player should have 4 workers and 1 base
  const player1Units = game.units.filter(u => u.playerId === 1);
  const player1Buildings = game.buildings.filter(b => b.playerId === 1);
  
  assert.strictEqual(player1Units.length, 4);
  assert.strictEqual(player1Buildings.length, 1);
});

console.log('✅ All tests passed!');
