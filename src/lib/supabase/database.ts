/**
 * Database Service Layer
 * Provides easy-to-use functions for database operations
 */

import { supabase } from './client';

/**
 * Player Profile Operations
 */
export const playerService = {
  /**
   * Get or create player profile
   */
  async getOrCreatePlayer(playerId: string) {
    try {
      // Try to get existing player
      const { data: existing, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('player_id', playerId)
        .single();

      if (existing && !fetchError) {
        return { data: existing, error: null };
      }

      // Create new player
      const { data, error } = await supabase
        .from('players')
        .insert({
          player_id: playerId,
          philosophy: {},
          play_history: [],
          preferences: {},
        })
        .select()
        .single();

      return { data, error };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Update player philosophy
   */
  async updatePhilosophy(playerId: string, philosophy: any) {
    const { data, error } = await supabase
      .from('players')
      .update({
        philosophy,
        updated_at: new Date().toISOString(),
      })
      .eq('player_id', playerId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Add play history entry
   */
  async addPlayHistory(playerId: string, entry: any) {
    const { data: player } = await supabase
      .from('players')
      .select('play_history')
      .eq('player_id', playerId)
      .single();

    const history = player?.play_history || [];
    history.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });

    const { data, error } = await supabase
      .from('players')
      .update({
        play_history: history,
        updated_at: new Date().toISOString(),
      })
      .eq('player_id', playerId)
      .select()
      .single();

    return { data, error };
  },
};

/**
 * Game Session Operations
 */
export const sessionService = {
  /**
   * Create new game session
   */
  async createSession(playerId: string, sessionId: string, gameConfig: any) {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        player_id: playerId,
        session_id: sessionId,
        game_config: gameConfig,
        game_state: null,
        narrative_events: [],
        chronicle: null,
        started_at: new Date().toISOString(),
        outcome: null,
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Update game session state
   */
  async updateSession(sessionId: string, updates: any) {
    const { data, error } = await supabase
      .from('game_sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Add narrative event to session
   */
  async addNarrativeEvent(sessionId: string, event: any) {
    const { data: session } = await supabase
      .from('game_sessions')
      .select('narrative_events')
      .eq('session_id', sessionId)
      .single();

    const events = session?.narrative_events || [];
    events.push(event);

    const { data, error } = await supabase
      .from('game_sessions')
      .update({ narrative_events: events })
      .eq('session_id', sessionId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Finalize session
   */
  async finalizeSession(sessionId: string, outcome: 'win' | 'loss' | 'abandoned', victoryType?: string) {
    const { data: session } = await supabase
      .from('game_sessions')
      .select('started_at')
      .eq('session_id', sessionId)
      .single();

    const startedAt = new Date(session?.started_at || Date.now());
    const endedAt = new Date();
    const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    const { data, error } = await supabase
      .from('game_sessions')
      .update({
        ended_at: endedAt.toISOString(),
        duration,
        outcome,
        victory_type: victoryType || null,
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get player's game history
   */
  async getPlayerHistory(playerId: string, limit = 10) {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('player_id', playerId)
      .order('started_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },
};

/**
 * Multiplayer Room Operations
 */
export const roomService = {
  /**
   * Create new room
   */
  async createRoom(roomData: any) {
    const { data, error } = await supabase
      .from('multiplayer_rooms')
      .insert({
        room_id: roomData.id,
        name: roomData.name,
        host: roomData.host,
        players: roomData.players || 1,
        max_players: roomData.maxPlayers || 4,
        status: 'waiting',
        map_type: roomData.mapType,
        map_width: roomData.mapWidth || 40,
        map_height: roomData.mapHeight || 30,
        cooperative_mode: roomData.cooperativeMode || false,
        seed: roomData.seed,
        difficulty: roomData.difficulty || 'medium',
        players_list: roomData.playersList || [],
        assigned_axes: roomData.assignedAxes || {},
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get room by ID
   */
  async getRoom(roomId: string) {
    const { data, error } = await supabase
      .from('multiplayer_rooms')
      .select('*')
      .eq('room_id', roomId)
      .single();

    return { data, error };
  },

  /**
   * Get all available rooms
   */
  async getAvailableRooms() {
    const { data, error } = await supabase
      .from('multiplayer_rooms')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  /**
   * Update room
   */
  async updateRoom(roomId: string, updates: any) {
    const { data, error } = await supabase
      .from('multiplayer_rooms')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('room_id', roomId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Delete room
   */
  async deleteRoom(roomId: string) {
    const { error } = await supabase
      .from('multiplayer_rooms')
      .delete()
      .eq('room_id', roomId);

    return { error };
  },
};

/**
 * AI Memory Operations
 */
export const memoryService = {
  /**
   * Store memory
   */
  async storeMemory(memory: any) {
    const { data, error } = await supabase
      .from('ai_memory')
      .insert({
        entity_id: memory.entityId,
        entity_type: memory.entityType,
        content: memory.content,
        importance: memory.importance || 0.5,
        tags: memory.tags || [],
        metadata: memory.metadata || {},
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get memories for entity
   */
  async getMemories(entityId: string, entityType?: string) {
    let query = supabase
      .from('ai_memory')
      .select('*')
      .eq('entity_id', entityId);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query.order('importance', { ascending: false });

    return { data, error };
  },

  /**
   * Delete old memories
   */
  async deleteMemories(entityId: string, beforeDate: string) {
    const { error } = await supabase
      .from('ai_memory')
      .delete()
      .eq('entity_id', entityId)
      .lt('created_at', beforeDate);

    return { error };
  },
};

/**
 * Chronicle Operations
 */
export const chronicleService = {
  /**
   * Save chronicle
   */
  async saveChronicle(chronicle: any) {
    const { data, error } = await supabase
      .from('chronicles')
      .insert({
        session_id: chronicle.sessionId,
        player_id: chronicle.playerId,
        title: chronicle.title,
        content: chronicle.content,
        timeline: chronicle.timeline,
        exported_format: chronicle.exportedFormat || null,
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get player's chronicles
   */
  async getPlayerChronicles(playerId: string) {
    const { data, error } = await supabase
      .from('chronicles')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });

    return { data, error };
  },
};

