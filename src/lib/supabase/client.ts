/**
 * Supabase Client Configuration
 * Cloud database for persistent game data
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using fallback storage.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're not using auth, just database
    autoRefreshToken: false,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          player_id: string;
          created_at: string;
          updated_at: string;
          philosophy: any;
          play_history: any;
          preferences: any;
        };
        Insert: {
          id?: string;
          player_id: string;
          created_at?: string;
          updated_at?: string;
          philosophy?: any;
          play_history?: any;
          preferences?: any;
        };
        Update: {
          id?: string;
          player_id?: string;
          created_at?: string;
          updated_at?: string;
          philosophy?: any;
          play_history?: any;
          preferences?: any;
        };
      };
      game_sessions: {
        Row: {
          id: string;
          player_id: string;
          session_id: string;
          game_config: any;
          game_state: any;
          narrative_events: any;
          chronicle: any;
          started_at: string;
          ended_at: string | null;
          duration: number | null;
          outcome: 'win' | 'loss' | 'abandoned' | null;
          victory_type: string | null;
        };
        Insert: {
          id?: string;
          player_id: string;
          session_id: string;
          game_config: any;
          game_state?: any;
          narrative_events?: any;
          chronicle?: any;
          started_at?: string;
          ended_at?: string | null;
          duration?: number | null;
          outcome?: 'win' | 'loss' | 'abandoned' | null;
          victory_type?: string | null;
        };
        Update: {
          id?: string;
          player_id?: string;
          session_id?: string;
          game_config?: any;
          game_state?: any;
          narrative_events?: any;
          chronicle?: any;
          started_at?: string;
          ended_at?: string | null;
          duration?: number | null;
          outcome?: 'win' | 'loss' | 'abandoned' | null;
          victory_type?: string | null;
        };
      };
      multiplayer_rooms: {
        Row: {
          id: string;
          room_id: string;
          name: string;
          host: string;
          players: number;
          max_players: number;
          status: 'waiting' | 'starting' | 'in-progress' | 'completed';
          map_type: string;
          map_width: number;
          map_height: number;
          cooperative_mode: boolean;
          seed: number;
          difficulty: string;
          players_list: any;
          assigned_axes: any;
          created_at: string;
          started_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          name: string;
          host: string;
          players?: number;
          max_players?: number;
          status?: 'waiting' | 'starting' | 'in-progress' | 'completed';
          map_type: string;
          map_width?: number;
          map_height?: number;
          cooperative_mode?: boolean;
          seed: number;
          difficulty?: string;
          players_list?: any;
          assigned_axes?: any;
          created_at?: string;
          started_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          name?: string;
          host?: string;
          players?: number;
          max_players?: number;
          status?: 'waiting' | 'starting' | 'in-progress' | 'completed';
          map_type?: string;
          map_width?: number;
          map_height?: number;
          cooperative_mode?: boolean;
          seed?: number;
          difficulty?: string;
          players_list?: any;
          assigned_axes?: any;
          created_at?: string;
          started_at?: string | null;
          updated_at?: string;
        };
      };
      ai_memory: {
        Row: {
          id: string;
          entity_id: string;
          entity_type: string;
          content: string;
          importance: number;
          tags: string[];
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entity_id: string;
          entity_type: string;
          content: string;
          importance?: number;
          tags?: string[];
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          entity_id?: string;
          entity_type?: string;
          content?: string;
          importance?: number;
          tags?: string[];
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      chronicles: {
        Row: {
          id: string;
          session_id: string;
          player_id: string;
          title: string;
          content: any;
          timeline: string;
          exported_format: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          player_id: string;
          title: string;
          content: any;
          timeline: string;
          exported_format?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          player_id?: string;
          title?: string;
          content?: any;
          timeline?: string;
          exported_format?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

