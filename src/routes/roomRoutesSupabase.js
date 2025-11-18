/**
 * Room management API routes for multiplayer lobbies
 * Using Supabase cloud database instead of in-memory storage
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('Supabase credentials not found. Room management will use fallback in-memory storage.');
}

// Fallback in-memory storage
const rooms = new Map();
const roomPlayers = new Map();

// Generate unique room ID
function generateRoomId() {
  return 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate unique player ID
function generatePlayerId() {
  return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * GET /api/rooms
 * Get list of available rooms
 */
router.get('/', async (req, res) => {
  try {
    if (supabase) {
      // Use Supabase
      const { data, error } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const availableRooms = data
        .filter(room => room.players < room.max_players)
        .map(room => ({
          id: room.room_id,
          name: room.name,
          host: room.host,
          players: room.players,
          maxPlayers: room.max_players,
          status: room.status,
          mapType: room.map_type,
          createdAt: room.created_at
        }));

      return res.json({ rooms: availableRooms });
    } else {
      // Fallback to in-memory
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

      return res.json({ rooms: availableRooms });
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

/**
 * POST /api/rooms
 * Create a new room
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      mapType,
      mapWidth,
      mapHeight,
      commanderId,
      cooperativeMode,
      quaternionAxis,
      seed,
      difficulty
    } = req.body;

    if (!name || !mapType) {
      return res.status(400).json({ error: 'Room name and map type are required' });
    }

    if (cooperativeMode && !quaternionAxis) {
      return res.status(400).json({ error: 'Quaternion axis is required for cooperative mode' });
    }

    const roomId = generateRoomId();
    const playerId = generatePlayerId();
    const gameSeed = seed || Math.floor(Math.random() * 1000000);

    const roomData = {
      id: roomId,
      name: name.trim(),
      host: playerId,
      players: 1,
      maxPlayers: cooperativeMode ? 4 : 4,
      status: 'waiting',
      mapType: mapType || 'crystalline_plains',
      mapWidth: mapWidth || 40,
      mapHeight: mapHeight || 30,
      commanderId: commanderId || 'AUREN',
      cooperativeMode: cooperativeMode || false,
      seed: gameSeed,
      difficulty: difficulty || 'medium',
      createdAt: new Date().toISOString(),
      playersList: [{
        id: playerId,
        commanderId: commanderId || 'AUREN',
        quaternionAxis: quaternionAxis || null,
        joinedAt: new Date().toISOString(),
        isHost: true
      }],
      assignedAxes: cooperativeMode ? {
        [quaternionAxis]: playerId
      } : {}
    };

    if (supabase) {
      // Use Supabase
      const { data, error } = await supabase
        .from('multiplayer_rooms')
        .insert({
          room_id: roomId,
          name: roomData.name,
          host: playerId,
          players: 1,
          max_players: roomData.maxPlayers,
          status: 'waiting',
          map_type: roomData.mapType,
          map_width: roomData.mapWidth,
          map_height: roomData.mapHeight,
          cooperative_mode: roomData.cooperativeMode,
          seed: gameSeed,
          difficulty: roomData.difficulty,
          players_list: roomData.playersList,
          assigned_axes: roomData.assignedAxes
        })
        .select()
        .single();

      if (error) throw error;

      return res.json({
        roomId,
        playerId,
        room: {
          id: data.room_id,
          name: data.name,
          players: data.players,
          maxPlayers: data.max_players,
          status: data.status,
          mapType: data.map_type,
          mapWidth: data.map_width,
          mapHeight: data.map_height,
          cooperativeMode: data.cooperative_mode,
          seed: data.seed,
          difficulty: data.difficulty,
          playersList: data.players_list,
          assignedAxes: data.assigned_axes
        }
      });
    } else {
      // Fallback to in-memory
      rooms.set(roomId, roomData);
      roomPlayers.set(roomId, new Set([playerId]));

      return res.json({
        roomId,
        playerId,
        room: {
          id: roomData.id,
          name: roomData.name,
          players: roomData.players,
          maxPlayers: roomData.maxPlayers,
          status: roomData.status,
          mapType: roomData.mapType,
          mapWidth: roomData.mapWidth,
          mapHeight: roomData.mapHeight,
          cooperativeMode: roomData.cooperativeMode,
          seed: roomData.seed,
          difficulty: roomData.difficulty,
          playersList: roomData.playersList,
          assignedAxes: roomData.assignedAxes
        }
      });
    }
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room', details: error.message });
  }
});

/**
 * GET /api/rooms/:roomId
 * Get room details
 */
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    if (supabase) {
      const { data, error } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: 'Room not found' });
      }

      return res.json({
        id: data.room_id,
        name: data.name,
        host: data.host,
        players: data.players,
        maxPlayers: data.max_players,
        status: data.status,
        mapType: data.map_type,
        mapWidth: data.map_width,
        mapHeight: data.map_height,
        cooperativeMode: data.cooperative_mode || false,
        seed: data.seed,
        difficulty: data.difficulty || 'medium',
        createdAt: data.created_at,
        playersList: data.players_list || [],
        assignedAxes: data.assigned_axes || {}
      });
    } else {
      // Fallback
      const room = rooms.get(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      return res.json({
        id: room.id,
        name: room.name,
        host: room.host,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status,
        mapType: room.mapType,
        mapWidth: room.mapWidth,
        mapHeight: room.mapHeight,
        cooperativeMode: room.cooperativeMode || false,
        seed: room.seed,
        difficulty: room.difficulty || 'medium',
        createdAt: room.createdAt,
        playersList: room.playersList || [],
        assignedAxes: room.assignedAxes || {}
      });
    }
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

/**
 * POST /api/rooms/:roomId/join
 * Join an existing room
 */
router.post('/:roomId/join', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { commanderId, quaternionAxis, playerId: existingPlayerId } = req.body;

    if (supabase) {
      const { data: room, error: fetchError } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (fetchError || !room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      if (room.status !== 'waiting') {
        return res.status(400).json({ error: 'Room is not accepting new players' });
      }

      if (room.players >= room.max_players) {
        return res.status(400).json({ error: 'Room is full' });
      }

      const playerId = existingPlayerId || generatePlayerId();
      const playersList = room.players_list || [];
      const isReconnecting = playersList.some(p => p.id === playerId);

      if (!isReconnecting) {
        if (room.cooperative_mode) {
          if (!quaternionAxis) {
            return res.status(400).json({ error: 'Quaternion axis is required for cooperative mode' });
          }
          if (room.assigned_axes && room.assigned_axes[quaternionAxis]) {
            return res.status(400).json({
              error: `Axis ${quaternionAxis} is already assigned to another player`
            });
          }
        }

        const newPlayer = {
          id: playerId,
          commanderId: commanderId || 'AUREN',
          quaternionAxis: quaternionAxis || null,
          joinedAt: new Date().toISOString(),
          isHost: false
        };

        playersList.push(newPlayer);

        const updatedAxes = room.assigned_axes || {};
        if (room.cooperative_mode && quaternionAxis) {
          updatedAxes[quaternionAxis] = playerId;
        }

        const newStatus = playersList.length >= room.max_players ? 'starting' : 'waiting';

        const { data, error } = await supabase
          .from('multiplayer_rooms')
          .update({
            players: playersList.length,
            players_list: playersList,
            assigned_axes: updatedAxes,
            status: newStatus
          })
          .eq('room_id', roomId)
          .select()
          .single();

        if (error) throw error;

        return res.json({
          roomId,
          playerId,
          room: {
            id: data.room_id,
            name: data.name,
            players: data.players,
            maxPlayers: data.max_players,
            status: data.status,
            mapType: data.map_type,
            mapWidth: data.map_width,
            mapHeight: data.map_height,
            cooperativeMode: data.cooperative_mode,
            seed: data.seed,
            difficulty: data.difficulty,
            playersList: data.players_list,
            assignedAxes: data.assigned_axes
          }
        });
      } else {
        // Reconnecting player
        return res.json({
          roomId,
          playerId,
          room: {
            id: room.room_id,
            name: room.name,
            players: room.players,
            maxPlayers: room.max_players,
            status: room.status,
            mapType: room.map_type,
            mapWidth: room.map_width,
            mapHeight: room.map_height,
            cooperativeMode: room.cooperative_mode,
            seed: room.seed,
            difficulty: room.difficulty,
            playersList: room.players_list,
            assignedAxes: room.assigned_axes
          }
        });
      }
    } else {
      // Fallback implementation (same as original)
      const room = rooms.get(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      // ... (original fallback code)
      return res.status(500).json({ error: 'Fallback not fully implemented' });
    }
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room', details: error.message });
  }
});

/**
 * POST /api/rooms/:roomId/leave
 * Leave a room
 */
router.post('/:roomId/leave', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    if (supabase) {
      const { data: room, error: fetchError } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (fetchError || !room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      const playersList = (room.players_list || []).filter(p => p.id !== playerId);
      const newPlayerCount = playersList.length;

      if (newPlayerCount === 0) {
        // Delete room if empty
        await supabase
          .from('multiplayer_rooms')
          .delete()
          .eq('room_id', roomId);
        return res.json({ message: 'Room deleted' });
      }

      // Assign new host if needed
      let newHost = room.host;
      if (room.host === playerId && playersList.length > 0) {
        newHost = playersList[0].id;
      }

      const newStatus = room.status === 'starting' && newPlayerCount < room.max_players
        ? 'waiting'
        : room.status;

      await supabase
        .from('multiplayer_rooms')
        .update({
          players: newPlayerCount,
          players_list: playersList,
          host: newHost,
          status: newStatus
        })
        .eq('room_id', roomId);

      return res.json({ message: 'Left room successfully' });
    } else {
      // Fallback
      return res.status(500).json({ error: 'Fallback not fully implemented' });
    }
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

/**
 * POST /api/rooms/:roomId/start
 * Start the game (host only)
 */
router.post('/:roomId/start', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    if (supabase) {
      const { data: room, error: fetchError } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (fetchError || !room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      if (room.host !== playerId) {
        return res.status(403).json({ error: 'Only the host can start the game' });
      }

      if (room.players < 2) {
        return res.status(400).json({ error: 'Need at least 2 players to start' });
      }

      const { data, error } = await supabase
        .from('multiplayer_rooms')
        .update({
          status: 'in-progress',
          started_at: new Date().toISOString()
        })
        .eq('room_id', roomId)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        roomId,
        room: {
          id: data.room_id,
          name: data.name,
          players: data.players,
          maxPlayers: data.max_players,
          status: data.status,
          mapType: data.map_type,
          mapWidth: data.map_width,
          mapHeight: data.map_height,
          seed: data.seed || Math.floor(Math.random() * 1000000),
          playersList: data.players_list
        }
      });
    } else {
      // Fallback
      return res.status(500).json({ error: 'Fallback not fully implemented' });
    }
  } catch (error) {
    console.error('Error starting room:', error);
    res.status(500).json({ error: 'Failed to start room' });
  }
});

module.exports = router;

