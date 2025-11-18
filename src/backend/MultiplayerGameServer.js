/**
 * MultiplayerGameServer - WebSocket Server with Game Management
 * Complete multiplayer backend for Quaternion RTS game
 */
import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { MultiplayerGameState } from './game/MultiplayerGameState.js';
import { MultiplayerAIController } from './ai/MultiplayerAIController.js';
import { CommandQueue } from './utils/CommandQueue.js';
import { ReplayRecorder } from './utils/ReplayRecorder.js';
import { MatchmakingQueue } from './utils/MatchmakingQueue.js';

class MultiplayerGameServer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.port = options.port || 3000;
    
    // Use existing app/server if provided, otherwise create new ones
    if (options.app && options.server) {
      this.app = options.app;
      this.server = options.server;
    } else {
      this.app = express();
      this.server = http.createServer(this.app);
    }
    
    // Use existing WebSocket server if provided, otherwise create new one
    if (options.wss) {
      this.wss = options.wss;
    } else {
      this.wss = new WebSocketServer({ server: this.server });
    }
    
    this.games = new Map(); // gameId -> GameSession
    this.players = new Map(); // playerId -> PlayerConnection
    this.matchmaking = new MatchmakingQueue();
    
    this.setupRoutes();
    this.setupWebSocketHandlers();
  }

  setupRoutes() {
    // Only add JSON parser if not already added
    if (!this.app._jsonParserAdded) {
      this.app.use(express.json());
      this.app._jsonParserAdded = true;
    }

    // Create new multiplayer game
    this.app.post('/api/multiplayer/create', (req, res) => {
      const { playerId, gameType, mapSize, difficulty } = req.body;

      const gameSession = new GameSession({
        gameId: uuidv4(),
        gameType, // 'pvp', 'pve', 'ffa'
        mapSize,
        maxPlayers: gameType === 'ffa' ? 4 : 2,
        difficulty,
        createdBy: playerId,
        timestamp: Date.now()
      });

      this.games.set(gameSession.gameId, gameSession);

      res.json({
        gameId: gameSession.gameId,
        status: 'created',
        joinCode: gameSession.joinCode
      });
    });

    // Join existing game
    this.app.post('/api/multiplayer/join', (req, res) => {
      const { playerId, gameId } = req.body;
      const gameSession = this.games.get(gameId);

      if (!gameSession) {
        return res.status(404).json({ error: 'Game not found' });
      }

      if (gameSession.players.size >= gameSession.maxPlayers) {
        return res.status(400).json({ error: 'Game is full' });
      }

      gameSession.addPlayer(playerId);
      res.json({
        gameId,
        status: 'joined',
        playerSlot: gameSession.playerSlots.get(playerId)
      });
    });

    // List available games
    this.app.get('/api/multiplayer/games', (req, res) => {
      const availableGames = Array.from(this.games.values())
        .filter(g => !g.started && g.players.size < g.maxPlayers)
        .map(g => ({
          gameId: g.gameId,
          gameType: g.gameType,
          playersCount: g.players.size,
          maxPlayers: g.maxPlayers,
          difficulty: g.difficulty,
          mapSize: g.mapSize
        }));

      res.json(availableGames);
    });

    // Get game state for spectating
    this.app.get('/api/multiplayer/game/:gameId/state', (req, res) => {
      const { gameId } = req.params;
      const gameSession = this.games.get(gameId);

      if (!gameSession) {
        return res.status(404).json({ error: 'Game not found' });
      }

      res.json({
        gameState: gameSession.gameState.getPublicState(),
        players: Array.from(gameSession.players.entries()).map(([id, player]) => ({
          playerId: id,
          slot: gameSession.playerSlots.get(id),
          resources: player.resources,
          supply: player.supply
        }))
      });
    });

    // Get replay data
    this.app.get('/api/multiplayer/game/:gameId/replay', (req, res) => {
      const { gameId } = req.params;
      const gameSession = this.games.get(gameId);

      if (!gameSession || !gameSession.replay) {
        return res.status(404).json({ error: 'Replay not found' });
      }

      res.json(gameSession.replay.getReplayData());
    });

    // Matchmaking endpoint
    this.app.post('/api/multiplayer/matchmake', (req, res) => {
      const { playerId, gameType, difficulty } = req.body;
      this.matchmaking.addPlayer(playerId, gameType, difficulty);

      const match = this.matchmaking.findMatch();
      if (match) {
        const gameSession = new GameSession({
          gameId: uuidv4(),
          gameType,
          maxPlayers: match.players.length,
          difficulty,
          createdBy: match.players[0],
          isMatchmade: true
        });

        match.players.forEach(p => gameSession.addPlayer(p));
        this.games.set(gameSession.gameId, gameSession);

        res.json({
          gameId: gameSession.gameId,
          status: 'matched',
          message: 'Match found'
        });
      } else {
        res.json({
          status: 'queued',
          queuePosition: this.matchmaking.getPosition(playerId)
        });
      }
    });
  }

  setupWebSocketHandlers() {
    this.wss.on('connection', (ws, req) => {
      const connectionId = uuidv4();
      const playerConnection = new PlayerConnection(ws, connectionId);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(playerConnection, message);
        } catch (error) {
          console.error('Message parsing error:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.handlePlayerDisconnect(playerConnection);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  handleMessage(playerConnection, message) {
    try {
      // Validate message structure
      if (!message || typeof message !== 'object') return;
      
      const { type, payload } = message;
      
      // Ignore messages without a valid type
      if (!type || typeof type !== 'string') return;

      // Ignore iframe-pos and other non-game message types silently
      // These are window.postMessage events that shouldn't be sent via WebSocket
      if (type === 'iframe-pos' || type === 'iframe-resize' || type === 'iframe-scroll') {
        return; // Silently ignore - these are DOM-level messages, not game messages
      }

      switch (type) {
        case 'auth':
          this.authenticatePlayer(playerConnection, payload);
          break;
        case 'join_game':
          this.joinGame(playerConnection, payload);
          break;
        case 'command':
          this.processCommand(playerConnection, payload);
          break;
        case 'ping':
          playerConnection.ws.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          // Silently ignore unknown message types to avoid console spam
          // Only log in development mode if needed
          if (process.env.NODE_ENV === 'development') {
            // Throttle warnings to at most once per 5 seconds
            const now = Date.now();
            if (!this._lastMsgWarn || now - this._lastMsgWarn > 5000) {
              console.warn(`[QUAT DEBUG] Unknown message type: ${type}`);
              this._lastMsgWarn = now;
            }
          }
          return;
      }
    } catch (err) {
      console.error('[QUAT DEBUG] message handler error', err);
    }
  }

  authenticatePlayer(playerConnection, payload) {
    const { playerId, token } = payload;
    // TODO: Validate token with auth service
    playerConnection.playerId = playerId;
    playerConnection.authenticated = true;
    this.players.set(playerId, playerConnection);

    playerConnection.send({
      type: 'authenticated',
      playerId,
      message: 'Successfully authenticated'
    });
  }

  joinGame(playerConnection, payload) {
    const { gameId, playerId } = payload;
    const gameSession = this.games.get(gameId);

    if (!gameSession) {
      playerConnection.send({ type: 'error', message: 'Game not found' });
      return;
    }

    gameSession.addPlayer(playerId, playerConnection);
    playerConnection.currentGameId = gameId;

    // Broadcast to all players in game
    gameSession.broadcastToPlayers({
      type: 'player_joined',
      playerId,
      totalPlayers: gameSession.players.size
    });

    // Send initial game state to joining player
    playerConnection.send({
      type: 'game_state_init',
      gameState: gameSession.gameState.getPublicState(),
      yourPlayerId: playerId,
      yourSlot: gameSession.playerSlots.get(playerId)
    });

    // If all players joined, start the game
    if (gameSession.players.size === gameSession.maxPlayers) {
      this.startGame(gameSession);
    }
  }

  processCommand(playerConnection, payload) {
    const gameId = playerConnection.currentGameId;
    const gameSession = this.games.get(gameId);

    if (!gameSession) {
      playerConnection.send({ type: 'error', message: 'Game session not found' });
      return;
    }

    const { commandType, units, target, position, buildingType } = payload;

    // Validate command ownership
    const playerSlot = gameSession.playerSlots.get(playerConnection.playerId);
    if (!playerSlot) {
      playerConnection.send({ type: 'error', message: 'Player not in this game' });
      return;
    }

    // Add command to queue with deterministic ordering
    gameSession.commandQueue.enqueue({
      playerId: playerConnection.playerId,
      tick: gameSession.gameState.currentTick,
      commandType,
      units,
      target,
      position,
      buildingType,
      timestamp: Date.now()
    });
  }

  startGame(gameSession) {
    gameSession.started = true;
    gameSession.startTime = Date.now();

    // Initialize AI players if needed
    if (gameSession.gameType === 'pve') {
      this.initializeAIOpponents(gameSession);
    }

    // Start game loop
    gameSession.startGameLoop();

    // Broadcast game start
    gameSession.broadcastToPlayers({
      type: 'game_started',
      gameStartTime: gameSession.startTime,
      seed: gameSession.mapSeed
    });

    // Start state synchronization
    this.startStateSynchronization(gameSession);
  }

  initializeAIOpponents(gameSession) {
    const humanPlayers = gameSession.players.size;
    const totalPlayers = gameSession.maxPlayers;
    const aiCount = totalPlayers - humanPlayers;

    for (let i = 0; i < aiCount; i++) {
      const aiPlayerId = `ai_player_${gameSession.gameId}_${i}`;
      const aiSlot = humanPlayers + i;

      const aiController = new MultiplayerAIController({
        playerId: aiPlayerId,
        difficulty: gameSession.difficulty,
        slot: aiSlot,
        gameSession: gameSession
      });

      gameSession.aiPlayers.set(aiPlayerId, aiController);
      gameSession.playerSlots.set(aiPlayerId, aiSlot);
    }
  }

  startStateSynchronization(gameSession) {
    const syncInterval = setInterval(() => {
      if (!gameSession.started) {
        clearInterval(syncInterval);
        return;
      }

      // Get all state changes since last sync
      const stateUpdates = gameSession.gameState.getStateDeltas();

      gameSession.broadcastToPlayers({
        type: 'state_update',
        tick: gameSession.gameState.currentTick,
        deltas: stateUpdates,
        aiActions: this.getAIActionsForTick(gameSession)
      });
    }, 1000 / 60); // 60 Hz sync rate

    gameSession.syncInterval = syncInterval;
  }

  getAIActionsForTick(gameSession) {
    const aiActions = [];

    for (const [aiPlayerId, aiController] of gameSession.aiPlayers.entries()) {
      const actions = aiController.getTick(gameSession.gameState);
      aiActions.push({
        playerId: aiPlayerId,
        actions
      });
    }

    return aiActions;
  }

  handlePlayerDisconnect(playerConnection) {
    const gameId = playerConnection.currentGameId;
    if (!gameId) return;

    const gameSession = this.games.get(gameId);
    if (gameSession) {
      gameSession.removePlayer(playerConnection.playerId);

      gameSession.broadcastToPlayers({
        type: 'player_left',
        playerId: playerConnection.playerId,
        remainingPlayers: gameSession.players.size
      });

      // End game if not enough players
      if (gameSession.players.size === 0) {
        this.endGame(gameSession);
      }
    }

    this.players.delete(playerConnection.playerId);
  }

  endGame(gameSession) {
    clearInterval(gameSession.syncInterval);
    if (gameSession.gameLoopInterval) {
      clearInterval(gameSession.gameLoopInterval);
    }
    
    // Finalize replay
    if (gameSession.replay) {
      gameSession.replay.finalize();
    }

    // Calculate final scores
    const finalScores = this.calculateFinalScores(gameSession);

    gameSession.broadcastToPlayers({
      type: 'game_ended',
      finalScores,
      replayId: gameSession.replay?.replayId,
      duration: Date.now() - gameSession.startTime
    });

    gameSession.started = false;
  }

  calculateFinalScores(gameSession) {
    const scores = [];

    for (const [playerId, slot] of gameSession.playerSlots.entries()) {
      const player = gameSession.gameState.getPlayer(slot);
      if (!player) continue;

      scores.push({
        playerId,
        slot,
        finalResources: player.resources,
        unitsKilled: gameSession.players.get(playerId)?.unitsKilled || 0,
        unitsLost: gameSession.players.get(playerId)?.unitsLost || 0,
        buildingsConstructed: gameSession.players.get(playerId)?.buildingsConstructed || 0,
        score: this.calculatePlayerScore(player, gameSession.players.get(playerId))
      });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  calculatePlayerScore(player, playerData) {
    const unitsKilled = playerData?.unitsKilled || 0;
    const buildingsConstructed = playerData?.buildingsConstructed || 0;
    const unitsLost = playerData?.unitsLost || 0;
    
    return (unitsKilled * 100) + 
           (buildingsConstructed * 50) + 
           (player.resources.minerals + player.resources.gas) / 10 - 
           (unitsLost * 30);
  }

  start() {
    // Only start server if we created it ourselves
    if (!this._externalServer) {
      this.server.listen(this.port, () => {
        console.log(`Multiplayer server running on port ${this.port}`);
      });
    } else {
      console.log(`Multiplayer server attached to existing HTTP server`);
    }
  }
}

class GameSession {
  constructor(config) {
    this.gameId = config.gameId;
    this.gameType = config.gameType;
    this.maxPlayers = config.maxPlayers;
    this.difficulty = config.difficulty;
    this.mapSize = config.mapSize || 64;
    this.createdBy = config.createdBy;
    this.joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    this.players = new Map(); // playerId -> PlayerConnection
    this.playerSlots = new Map(); // playerId -> slotIndex
    this.aiPlayers = new Map(); // aiPlayerId -> MultiplayerAIController
    
    this.started = false;
    this.startTime = null;
    this.mapSeed = config.seed || Math.floor(Math.random() * 1000000);
    
    // Initialize game state
    this.gameState = new MultiplayerGameState({
      mapWidth: this.mapSize,
      mapHeight: this.mapSize,
      seed: this.mapSeed,
      maxPlayers: this.maxPlayers
    });

    this.commandQueue = new CommandQueue();
    this.replay = new ReplayRecorder(this.gameId);
    this.syncInterval = null;
    this.gameLoopInterval = null;
  }

  addPlayer(playerId, playerConnection) {
    const slotIndex = this.playerSlots.size;
    this.players.set(playerId, playerConnection);
    this.playerSlots.set(playerId, slotIndex);
    this.gameState.playerSlots.set(playerId, slotIndex);
    this.gameState.initializePlayer(slotIndex);
  }

  removePlayer(playerId) {
    const slot = this.playerSlots.get(playerId);
    this.players.delete(playerId);
    this.playerSlots.delete(playerId);
    if (slot !== undefined) {
      this.gameState.eliminatePlayer(slot);
    }
  }

  broadcastToPlayers(message) {
    for (const [playerId, connection] of this.players.entries()) {
      if (connection && connection.ws.readyState === 1) { // WebSocket.OPEN = 1
        connection.send(message);
      }
    }
  }

  startGameLoop() {
    const tickInterval = setInterval(() => {
      if (!this.started) {
        clearInterval(tickInterval);
        return;
      }

      // Process command queue
      const tick = this.gameState.currentTick;
      const commands = this.commandQueue.getCommandsForTick(tick);
      
      commands.forEach(cmd => {
        this.gameState.executeCommand(cmd);
        this.replay.recordCommand(cmd);
      });

      // Update game state
      this.gameState.update();

      // Process AI actions
      for (const [aiPlayerId, aiController] of this.aiPlayers.entries()) {
        const aiActions = aiController.getTick(this.gameState);
        aiActions.forEach(action => {
          this.gameState.executeCommand({
            playerId: aiPlayerId,
            ...action
          });
          this.replay.recordCommand({
            playerId: aiPlayerId,
            ...action
          });
        });
      }

      this.replay.recordTick(this.gameState.getCurrentSnapshot());
    }, 1000 / 60); // 60 ticks per second

    this.gameLoopInterval = tickInterval;
  }
}

class PlayerConnection {
  constructor(ws, connectionId) {
    this.ws = ws;
    this.connectionId = connectionId;
    this.playerId = null;
    this.authenticated = false;
    this.currentGameId = null;
  }

  send(message) {
    if (this.ws.readyState === 1) { // WebSocket.OPEN = 1
      this.ws.send(JSON.stringify(message));
    }
  }
}

export { MultiplayerGameServer, GameSession };

