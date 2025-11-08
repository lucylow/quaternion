import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../src/game/GameState.js';
import { MapGenerator } from '../src/map/MapGenerator.js';
import { Unit, UnitType } from '../src/units/Unit.js';

describe('GameState', () => {
  let game;

  beforeEach(() => {
    game = new GameState({
      mapWidth: 32,
      mapHeight: 32,
      seed: 12345
    });
  });

  it('should initialize correctly', () => {
    expect(game.id).toBeDefined();
    expect(game.tick).toBe(0);
    expect(game.isRunning).toBe(false);
    expect(game.map.width).toBe(32);
    expect(game.map.height).toBe(32);
  });

  it('should start with correct initial units', () => {
    const player1Units = game.units.filter(u => u.playerId === 1);
    const player1Buildings = game.buildings.filter(b => b.playerId === 1);
    
    expect(player1Units.length).toBe(4);
    expect(player1Buildings.length).toBe(1);
  });

  it('should serialize state correctly', () => {
    const state = game.serialize();
    expect(state).toHaveProperty('tick');
    expect(state).toHaveProperty('players');
    expect(state).toHaveProperty('units');
    expect(state).toHaveProperty('buildings');
  });
});

describe('MapGenerator', () => {
  it('should generate deterministic maps with same seed', () => {
    const seed = 42;
    const gen1 = new MapGenerator(32, 32, seed);
    const gen2 = new MapGenerator(32, 32, seed);
    
    const map1 = gen1.generate();
    const map2 = gen2.generate();
    
    expect(map1.width).toBe(map2.width);
    expect(map1.height).toBe(map2.height);
    expect(map1.tiles[0][0].type).toBe(map2.tiles[0][0].type);
  });

  it('should create valid terrain', () => {
    const mapGen = new MapGenerator(32, 32, 12345);
    const map = mapGen.generate();
    
    expect(map.width).toBe(32);
    expect(map.height).toBe(32);
    expect(map.tiles.length).toBe(32 * 32);
    expect(map.resources.length).toBeGreaterThan(0);
    expect(map.startPositions.length).toBe(2);
  });

  it('should create passable tiles', () => {
    const gen = new MapGenerator(16, 16, 123);
    const map = gen.generate();
    
    const passableTiles = map.tiles.flat().filter(t => t.passable);
    expect(passableTiles.length).toBeGreaterThan(0);
  });
});

describe('Unit', () => {
  it('should create with correct properties', () => {
    const unit = new Unit('test_1', UnitType.WORKER, 1, 10, 10);
    
    expect(unit.id).toBe('test_1');
    expect(unit.type).toBe(UnitType.WORKER);
    expect(unit.playerId).toBe(1);
    expect(unit.x).toBe(10);
    expect(unit.y).toBe(10);
    expect(unit.hp).toBe(50);
    expect(unit.maxHp).toBe(50);
  });

  it('should handle movement commands', () => {
    const unit = new Unit('test_1', UnitType.WORKER, 1, 0, 0);
    unit.moveToPosition(10, 10);
    
    expect(unit.state).toBe('moving');
    expect(unit.targetX).toBe(10);
    expect(unit.targetY).toBe(10);
  });
});
