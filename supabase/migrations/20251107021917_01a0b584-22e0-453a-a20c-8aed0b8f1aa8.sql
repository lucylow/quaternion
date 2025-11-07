-- Create enum types for game state
CREATE TYPE game_status AS ENUM ('waiting', 'active', 'completed');
CREATE TYPE commander_archetype AS ENUM ('aggressor', 'architect', 'nomad', 'balanced');
CREATE TYPE decision_type AS ENUM ('attack', 'defend', 'build', 'scout', 'research', 'retreat', 'expand');
CREATE TYPE intent_type AS ENUM ('aggressive', 'defensive', 'expansionist', 'adaptive', 'evasive');

-- Games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status game_status NOT NULL DEFAULT 'waiting',
  map_seed BIGINT NOT NULL,
  map_width INTEGER NOT NULL DEFAULT 64,
  map_height INTEGER NOT NULL DEFAULT 64,
  tick INTEGER NOT NULL DEFAULT 0,
  winner_player_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Commander personalities table
CREATE TABLE public.commander_personalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL,
  archetype commander_archetype NOT NULL DEFAULT 'balanced',
  name TEXT NOT NULL,
  
  -- Personality traits (0.0 - 1.0)
  aggressiveness DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (aggressiveness >= 0 AND aggressiveness <= 1),
  risk_tolerance DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (risk_tolerance >= 0 AND risk_tolerance <= 1),
  patience DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (patience >= 0 AND patience <= 1),
  cautiousness DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (cautiousness >= 0 AND cautiousness <= 1),
  innovation_drive DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (innovation_drive >= 0 AND innovation_drive <= 1),
  boldness DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (boldness >= 0 AND boldness <= 1),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(game_id, player_id)
);

-- AI decision logs table (for transparency and judge review)
CREATE TABLE public.ai_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  commander_id UUID REFERENCES public.commander_personalities(id) ON DELETE CASCADE,
  tick INTEGER NOT NULL,
  
  -- Decision details
  decision_type decision_type NOT NULL,
  current_intent intent_type,
  utility_score DECIMAL(5,3),
  chosen BOOLEAN NOT NULL DEFAULT false,
  
  -- Context at decision time
  resources INTEGER,
  military_strength DECIMAL(5,2),
  enemy_military_strength DECIMAL(5,2),
  threat_level DECIMAL(3,2),
  
  -- Decision explanation
  reasoning TEXT,
  target_position JSONB, -- {x, y}
  target_entity_id TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Strategic intents table (track AI's high-level goals over time)
CREATE TABLE public.strategic_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  commander_id UUID REFERENCES public.commander_personalities(id) ON DELETE CASCADE,
  tick INTEGER NOT NULL,
  
  intent intent_type NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  
  -- Priority scores
  priority_defense DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  priority_offense DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  priority_economy DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  priority_expansion DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  priority_technology DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Game snapshots (periodic saves of full game state)
CREATE TABLE public.game_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  tick INTEGER NOT NULL,
  
  -- Full game state as JSON
  state JSONB NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ai_decision_logs_game_id ON public.ai_decision_logs(game_id);
CREATE INDEX idx_ai_decision_logs_commander_id ON public.ai_decision_logs(commander_id);
CREATE INDEX idx_ai_decision_logs_tick ON public.ai_decision_logs(tick);
CREATE INDEX idx_strategic_intents_game_id ON public.strategic_intents(game_id);
CREATE INDEX idx_game_snapshots_game_id ON public.game_snapshots(game_id);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commander_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decision_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read for now, can be restricted later)
CREATE POLICY "Allow public read access to games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to games" ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to games" ON public.games FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to commander personalities" ON public.commander_personalities FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to commander personalities" ON public.commander_personalities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to commander personalities" ON public.commander_personalities FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to ai decision logs" ON public.ai_decision_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to ai decision logs" ON public.ai_decision_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to strategic intents" ON public.strategic_intents FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to strategic intents" ON public.strategic_intents FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to game snapshots" ON public.game_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to game snapshots" ON public.game_snapshots FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for games table
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();