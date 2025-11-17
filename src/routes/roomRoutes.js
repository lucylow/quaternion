/**
 * Room management API routes for multiplayer lobbies
 */

const express = require('express');
const router = express.Router();

// In-memory room storage (in production, use Redis or database)
const rooms = new Map();
const roomPlayers = new Map(); // roomId -> Set of playerIds

// Generate unique room ID
function generateRoomId() {
  return 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate unique player ID
function generatePlayerId() {
  return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Clean up old rooms (older than 1 hour)
function cleanupOldRooms() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [roomId, room] of rooms.entries()) {
    if (new Date(room.createdAt).getTime() < oneHourAgo) {
      rooms.delete(roomId);
      roomPlayers.delete(roomId);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldRooms, 5 * 60 * 1000);

/**
 * GET /api/rooms
 * Get list of available rooms
 */
router.get('/', (req, res) => {
  try {
    const availableRooms = Array.from(rooms.values())
      .filter(room => room.status === 'waiting' && room.players < room.maxPlayers)
      .map(room => ({
        id: room.id,
        name: room.name,
        host: room.host,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status,
        mapType: room.mapType,
        createdAt: room.createdAt
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ rooms: availableRooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

/**
 * POST /api/rooms
 * Create a new room
 */
router.post('/', (req, res) => {
  try {
    const { name, mapType, mapWidth, mapHeight, commanderId } = req.body;

    if (!name || !mapType) {
      return res.status(400).json({ error: 'Room name and map type are required' });
    }

    const roomId = generateRoomId();
    const playerId = generatePlayerId();

    const room = {
      id: roomId,
      name: name.trim(),
      host: playerId,
      players: 1,
      maxPlayers: 4, // Support up to 4 players
      status: 'waiting',
      mapType: mapType || 'crystalline_plains',
      mapWidth: mapWidth || 40,
      mapHeight: mapHeight || 30,
      commanderId: commanderId || 'AUREN',
      createdAt: new Date().toISOString(),
      playersList: [{
        id: playerId,
        commanderId: commanderId || 'AUREN',
        joinedAt: new Date().toISOString()
      }]
    };

    rooms.set(roomId, room);
    roomPlayers.set(roomId, new Set([playerId]));

    res.json({
      roomId,
      playerId,
      room: {
        id: room.id,
        name: room.name,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status,
        mapType: room.mapType
      }
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

/**
 * GET /api/rooms/:roomId
 * Get room details
 */
router.get('/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const room = rooms.get(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      id: room.id,
      name: room.name,
      host: room.host,
      players: room.players,
      maxPlayers: room.maxPlayers,
      status: room.status,
      mapType: room.mapType,
      mapWidth: room.mapWidth,
      mapHeight: room.mapHeight,
      createdAt: room.createdAt,
      playersList: room.playersList || []
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

/**
 * POST /api/rooms/:roomId/join
 * Join an existing room
 */
router.post('/:roomId/join', (req, res) => {
  try {
    const { roomId } = req.params;
    const { commanderId } = req.body;

    const room = rooms.get(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Room is not accepting new players' });
    }

    if (room.players >= room.maxPlayers) {
      return res.status(400).json({ error: 'Room is full' });
    }

    const playerId = generatePlayerId();
    const players = roomPlayers.get(roomId) || new Set();

    if (players.has(playerId)) {
      return res.status(400).json({ error: 'Already in room' });
    }

    players.add(playerId);
    roomPlayers.set(roomId, players);

    room.players = players.size;
    if (!room.playersList) {
      room.playersList = [];
    }
    room.playersList.push({
      id: playerId,
      commanderId: commanderId || 'AUREN',
      joinedAt: new Date().toISOString()
    });

    // Auto-start if room is full
    if (room.players >= room.maxPlayers) {
      room.status = 'starting';
    }

    res.json({
      roomId,
      playerId,
      room: {
        id: room.id,
        name: room.name,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status,
        mapType: room.mapType
      }
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

/**
 * POST /api/rooms/:roomId/leave
 * Leave a room
 */
router.post('/:roomId/leave', (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const players = roomPlayers.get(roomId);
    if (players && players.has(playerId)) {
      players.delete(playerId);
      room.players = players.size;

      // Remove from players list
      if (room.playersList) {
        room.playersList = room.playersList.filter(p => p.id !== playerId);
      }

      // If host left, assign new host or delete room
      if (room.host === playerId) {
        if (room.playersList && room.playersList.length > 0) {
          room.host = room.playersList[0].id;
        } else {
          // No players left, delete room
          rooms.delete(roomId);
          roomPlayers.delete(roomId);
          return res.json({ message: 'Room deleted' });
        }
      }

      // If room becomes empty, delete it
      if (room.players === 0) {
        rooms.delete(roomId);
        roomPlayers.delete(roomId);
        return res.json({ message: 'Room deleted' });
      }

      // Reset status if room was starting
      if (room.status === 'starting' && room.players < room.maxPlayers) {
        room.status = 'waiting';
      }
    }

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

/**
 * POST /api/rooms/:roomId/start
 * Start the game (host only)
 */
router.post('/:roomId/start', (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.host !== playerId) {
      return res.status(403).json({ error: 'Only the host can start the game' });
    }

    if (room.players < 2) {
      return res.status(400).json({ error: 'Need at least 2 players to start' });
    }

    room.status = 'in-progress';
    room.startedAt = new Date().toISOString();

    res.json({
      roomId,
      room: {
        id: room.id,
        name: room.name,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status,
        mapType: room.mapType,
        mapWidth: room.mapWidth,
        mapHeight: room.mapHeight,
        seed: room.seed || Math.floor(Math.random() * 1000000),
        playersList: room.playersList
      }
    });
  } catch (error) {
    console.error('Error starting room:', error);
    res.status(500).json({ error: 'Failed to start room' });
  }
});

module.exports = router;

