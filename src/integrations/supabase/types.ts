export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_decision_logs: {
        Row: {
          chosen: boolean
          commander_id: string | null
          created_at: string
          current_intent: Database["public"]["Enums"]["intent_type"] | null
          decision_type: Database["public"]["Enums"]["decision_type"]
          enemy_military_strength: number | null
          game_id: string | null
          id: string
          military_strength: number | null
          reasoning: string | null
          resources: number | null
          target_entity_id: string | null
          target_position: Json | null
          threat_level: number | null
          tick: number
          utility_score: number | null
        }
        Insert: {
          chosen?: boolean
          commander_id?: string | null
          created_at?: string
          current_intent?: Database["public"]["Enums"]["intent_type"] | null
          decision_type: Database["public"]["Enums"]["decision_type"]
          enemy_military_strength?: number | null
          game_id?: string | null
          id?: string
          military_strength?: number | null
          reasoning?: string | null
          resources?: number | null
          target_entity_id?: string | null
          target_position?: Json | null
          threat_level?: number | null
          tick: number
          utility_score?: number | null
        }
        Update: {
          chosen?: boolean
          commander_id?: string | null
          created_at?: string
          current_intent?: Database["public"]["Enums"]["intent_type"] | null
          decision_type?: Database["public"]["Enums"]["decision_type"]
          enemy_military_strength?: number | null
          game_id?: string | null
          id?: string
          military_strength?: number | null
          reasoning?: string | null
          resources?: number | null
          target_entity_id?: string | null
          target_position?: Json | null
          threat_level?: number | null
          tick?: number
          utility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_decision_logs_commander_id_fkey"
            columns: ["commander_id"]
            isOneToOne: false
            referencedRelation: "commander_personalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decision_logs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_decisions: {
        Row: {
          action_taken: Json | null
          cache_hit: boolean | null
          commander_id: string | null
          created_at: string
          decision_latency_ms: number | null
          fallback_used: boolean | null
          game_id: string
          id: string
          model_response: string | null
          player_id: number
          prompt: string | null
          prompt_hash: string | null
          tick: number
          tokens_used: number | null
        }
        Insert: {
          action_taken?: Json | null
          cache_hit?: boolean | null
          commander_id?: string | null
          created_at?: string
          decision_latency_ms?: number | null
          fallback_used?: boolean | null
          game_id: string
          id?: string
          model_response?: string | null
          player_id: number
          prompt?: string | null
          prompt_hash?: string | null
          tick: number
          tokens_used?: number | null
        }
        Update: {
          action_taken?: Json | null
          cache_hit?: boolean | null
          commander_id?: string | null
          created_at?: string
          decision_latency_ms?: number | null
          fallback_used?: boolean | null
          game_id?: string
          id?: string
          model_response?: string | null
          player_id?: number
          prompt?: string | null
          prompt_hash?: string | null
          tick?: number
          tokens_used?: number | null
        }
        Relationships: []
      }
      ai_metrics: {
        Row: {
          game_id: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          recorded_at: string
        }
        Insert: {
          game_id: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          recorded_at?: string
        }
        Update: {
          game_id?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          recorded_at?: string
        }
        Relationships: []
      }
      commander_personalities: {
        Row: {
          aggressiveness: number
          archetype: Database["public"]["Enums"]["commander_archetype"]
          boldness: number
          cautiousness: number
          created_at: string
          game_id: string | null
          id: string
          innovation_drive: number
          name: string
          patience: number
          player_id: number
          risk_tolerance: number
        }
        Insert: {
          aggressiveness?: number
          archetype?: Database["public"]["Enums"]["commander_archetype"]
          boldness?: number
          cautiousness?: number
          created_at?: string
          game_id?: string | null
          id?: string
          innovation_drive?: number
          name: string
          patience?: number
          player_id: number
          risk_tolerance?: number
        }
        Update: {
          aggressiveness?: number
          archetype?: Database["public"]["Enums"]["commander_archetype"]
          boldness?: number
          cautiousness?: number
          created_at?: string
          game_id?: string | null
          id?: string
          innovation_drive?: number
          name?: string
          patience?: number
          player_id?: number
          risk_tolerance?: number
        }
        Relationships: [
          {
            foreignKeyName: "commander_personalities_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_snapshots: {
        Row: {
          created_at: string
          game_id: string | null
          id: string
          state: Json
          tick: number
        }
        Insert: {
          created_at?: string
          game_id?: string | null
          id?: string
          state: Json
          tick: number
        }
        Update: {
          created_at?: string
          game_id?: string | null
          id?: string
          state?: Json
          tick?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_snapshots_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          map_height: number
          map_seed: number
          map_width: number
          status: Database["public"]["Enums"]["game_status"]
          tick: number
          updated_at: string
          winner_player_id: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          map_height?: number
          map_seed: number
          map_width?: number
          status?: Database["public"]["Enums"]["game_status"]
          tick?: number
          updated_at?: string
          winner_player_id?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          map_height?: number
          map_seed?: number
          map_width?: number
          status?: Database["public"]["Enums"]["game_status"]
          tick?: number
          updated_at?: string
          winner_player_id?: number | null
        }
        Relationships: []
      }
      strategic_intents: {
        Row: {
          commander_id: string | null
          confidence: number
          created_at: string
          game_id: string | null
          id: string
          intent: Database["public"]["Enums"]["intent_type"]
          priority_defense: number
          priority_economy: number
          priority_expansion: number
          priority_offense: number
          priority_technology: number
          tick: number
        }
        Insert: {
          commander_id?: string | null
          confidence: number
          created_at?: string
          game_id?: string | null
          id?: string
          intent: Database["public"]["Enums"]["intent_type"]
          priority_defense?: number
          priority_economy?: number
          priority_expansion?: number
          priority_offense?: number
          priority_technology?: number
          tick: number
        }
        Update: {
          commander_id?: string | null
          confidence?: number
          created_at?: string
          game_id?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["intent_type"]
          priority_defense?: number
          priority_economy?: number
          priority_expansion?: number
          priority_offense?: number
          priority_technology?: number
          tick?: number
        }
        Relationships: [
          {
            foreignKeyName: "strategic_intents_commander_id_fkey"
            columns: ["commander_id"]
            isOneToOne: false
            referencedRelation: "commander_personalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_intents_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      commander_archetype: "aggressor" | "architect" | "nomad" | "balanced"
      decision_type:
        | "attack"
        | "defend"
        | "build"
        | "scout"
        | "research"
        | "retreat"
        | "expand"
      game_status: "waiting" | "active" | "completed"
      intent_type:
        | "aggressive"
        | "defensive"
        | "expansionist"
        | "adaptive"
        | "evasive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      commander_archetype: ["aggressor", "architect", "nomad", "balanced"],
      decision_type: [
        "attack",
        "defend",
        "build",
        "scout",
        "research",
        "retreat",
        "expand",
      ],
      game_status: ["waiting", "active", "completed"],
      intent_type: [
        "aggressive",
        "defensive",
        "expansionist",
        "adaptive",
        "evasive",
      ],
    },
  },
} as const
