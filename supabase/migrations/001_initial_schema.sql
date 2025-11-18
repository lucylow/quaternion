-- Initial Database Schema for Quaternion Game
-- Supabase PostgreSQL Database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  philosophy JSONB DEFAULT '{}',
  play_history JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '{}'
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id TEXT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  game_config JSONB NOT NULL,
  game_state JSONB,
  narrative_events JSONB DEFAULT '[]',
  chronicle JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration INTEGER, -- in seconds
  outcome TEXT CHECK (outcome IN ('win', 'loss', 'abandoned')),
  victory_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multiplayer rooms table
CREATE TABLE IF NOT EXISTS multiplayer_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  players INTEGER DEFAULT 1,
  max_players INTEGER DEFAULT 4,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'starting', 'in-progress', 'completed')),
  map_type TEXT NOT NULL,
  map_width INTEGER DEFAULT 40,
  map_height INTEGER DEFAULT 30,
  cooperative_mode BOOLEAN DEFAULT FALSE,
  seed INTEGER NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  players_list JSONB DEFAULT '[]',
  assigned_axes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Memory table
CREATE TABLE IF NOT EXISTS ai_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  content TEXT NOT NULL,
  importance NUMERIC(3, 2) DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chronicles table
CREATE TABLE IF NOT EXISTS chronicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL REFERENCES game_sessions(session_id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  timeline TEXT NOT NULL,
  exported_format TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_player_id ON players(player_id);
CREATE INDEX IF NOT EXISTS idx_sessions_player_id ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON game_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_id ON multiplayer_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON multiplayer_rooms(status);
CREATE INDEX IF NOT EXISTS idx_memory_entity ON ai_memory(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_chronicles_player ON chronicles(player_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_session ON chronicles(session_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON multiplayer_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memory_updated_at
  BEFORE UPDATE ON ai_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (adjust based on your security needs)
CREATE POLICY "Allow public access" ON players FOR ALL USING (true);
CREATE POLICY "Allow public access" ON game_sessions FOR ALL USING (true);
CREATE POLICY "Allow public access" ON multiplayer_rooms FOR ALL USING (true);
CREATE POLICY "Allow public access" ON ai_memory FOR ALL USING (true);
CREATE POLICY "Allow public access" ON chronicles FOR ALL USING (true);

