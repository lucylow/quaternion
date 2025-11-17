import express from 'express';
import cors from 'cors';
import { GameState } from './game/GameState.js';
import { AIDifficulty } from './ai/AIController.js';
import logger from './lib/logger.js';
import {
  validate,
  createGameSchema,
  moveCommandSchema,
  attackCommandSchema,
  gatherCommandSchema,
  buildUnitSchema,
  buildBuildingSchema
} from './lib/validation.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory game storage
const games = new Map();

/**
 * API Routes
 */

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Create new game
app.post('/api/game/create', validate(createGameSchema), (req, res) => {
  try {
    const { mapWidth, mapHeight, seed, aiDifficulty } = req.body;
    
    const config = {
      mapWidth: mapWidth || 64,
      mapHeight: mapHeight || 64,
      seed: seed || Date.now(),
      aiDifficulty: aiDifficulty || AIDifficulty.MEDIUM
    };
    
    const game = new GameState(config);
    games.set(game.id, game);
    
    logger.info({ gameId: game.id, config }, 'Game created');
    
    res.json({
      success: true,
      gameId: game.id,
      state: game.getState()
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create game');
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start game
app.post('/api/game/:id/start', (req, res) => {
  try {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    
    game.start();
    
    res.json({
      success: true,
      state: game.getState()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop game
app.post('/api/game/:id/stop', (req, res) => {
  try {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    
    game.stop();
    
    res.json({
      success: true,
      state: game.getState()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get game state
app.get('/api/game/:id/state', (req, res) => {
  try {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    
    const playerId = req.query.playerId ? parseInt(req.query.playerId) : null;
    
    res.json({
      success: true,
      state: game.getState(playerId)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get map data
app.get('/api/game/:id/map', (req, res) => {
  try {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    
    res.json({
      success: true,
      map: game.map
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send command
app.post('/api/game/:id/command', (req, res) => {
  try {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    
    const { type, ...eventData } = req.body;
    game.queueEvent({ type, ...eventData });
    
    res.json({
      success: true,
      message: 'Command queued'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Move units
app.post('/api/game/:id/move', validate(moveCommandSchema), (req, res) => {
  try {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    
    const { unitIds, x, y } = req.body;
    game.queueEvent({ type: 'move', unitIds, x, y });
    
    logger.debug({ gameId: req.params.id, unitIds, x, y }, 'Move command queued');
    
    res.json({
      success: true,
      message: 'Move command queued'
    });
  } catch (error) {
    logger.error({ error: error.message, gameId: req.params.id }, 'Move command failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

// Attack command
app.post('/api/game/:id/attack', validate(attackCommandSchema), (req, res) => {
  try {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    
    const { unitIds, targetId } = req.body;
    game.queueEvent({ type: 'attack', unitIds, targetId });
    
    logger.debug({ gameId: req.params.id, unitIds, targetId }, 'Attack command queued');
    
    res.json({
      success: true,
      message: 'Attack command queued'
    });
  } catch (error) {
    logger.error({ error: error.message, gameId: req.params.id }, 'Attack command failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gather command
app.post('/api/game/:id/gather', validate(gatherCommandSchema), (req, res) => {
  try {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    
    const { unitIds, resourceId } = req.body;
    game.queueEvent({ type: 'gather', unitIds, resourceId });
    
    logger.debug({ gameId: req.params.id, unitIds, resourceId }, 'Gather command queued');
    
    res.json({
      success: true,
      message: 'Gather command queued'
    });
  } catch (error) {
    logger.error({ error: error.message, gameId: req.params.id }, 'Gather command failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

// Build unit
app.post('/api/game/:id/build-unit', validate(buildUnitSchema), (req, res) => {
  try {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    
    const { buildingId, unitType } = req.body;
    game.queueEvent({ type: 'build_unit', buildingId, unitType });
    
    logger.debug({ gameId: req.params.id, buildingId, unitType }, 'Build unit command queued');
    
    res.json({
      success: true,
      message: 'Build unit command queued'
    });
  } catch (error) {
    logger.error({ error: error.message, gameId: req.params.id }, 'Build unit command failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

// Build building
app.post('/api/game/:id/build-building', validate(buildBuildingSchema), (req, res) => {
  try {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    
    const { playerId, buildingType, x, y } = req.body;
    game.queueEvent({ type: 'build_building', playerId, buildingType, x, y });
    
    logger.debug({ gameId: req.params.id, playerId, buildingType, x, y }, 'Build building command queued');
    
    res.json({
      success: true,
      message: 'Build building command queued'
    });
  } catch (error) {
    logger.error({ error: error.message, gameId: req.params.id }, 'Build building command failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all games
app.get('/api/games', (req, res) => {
  try {
    const gameList = Array.from(games.values()).map(game => ({
      id: game.id,
      tick: game.tick,
      isRunning: game.isRunning,
      playerCount: Object.keys(game.players).length
    }));
    
    res.json({
      success: true,
      games: gameList
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete game
app.delete('/api/game/:id', (req, res) => {
  try {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    
    game.stop();
    games.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Game deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info({ port: PORT }, '🎮 Chroma Strategy Game Server running');
  logger.info(`📡 API available at http://localhost:${PORT}/api`);
  logger.info(`💚 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  games.forEach(game => game.stop());
  process.exit(0);
});
