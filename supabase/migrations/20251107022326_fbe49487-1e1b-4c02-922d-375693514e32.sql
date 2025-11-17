-- Create enum types for game state (check if not exists)
DO $$ BEGIN
  CREATE TYPE game_status AS ENUM ('waiting', 'active', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE commander_archetype AS ENUM ('aggressor', 'architect', 'nomad', 'balanced');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE decision_type AS ENUM ('attack', 'defend', 'build', 'scout', 'research', 'retreat', 'expand');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE intent_type AS ENUM ('aggressive', 'defensive', 'expansionist', 'adaptive', 'evasive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Games table
CREATE TABLE IF NOT EXISTS public.games (
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
CREATE TABLE IF NOT EXISTS public.commander_personalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL,
  archetype commander_archetype NOT NULL DEFAULT 'balanced',
  name TEXT NOT NULL,
  aggressiveness DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (aggressiveness >= 0 AND aggressiveness <= 1),
  risk_tolerance DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (risk_tolerance >= 0 AND risk_tolerance <= 1),
  patience DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (patience >= 0 AND patience <= 1),
  cautiousness DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (cautiousness >= 0 AND cautiousness <= 1),
  innovation_drive DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (innovation_drive >= 0 AND innovation_drive <= 1),
  boldness DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (boldness >= 0 AND boldness <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, player_id)
);

-- AI decision logs table
CREATE TABLE IF NOT EXISTS public.ai_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  commander_id UUID REFERENCES public.commander_personalities(id) ON DELETE CASCADE,
  tick INTEGER NOT NULL,
  decision_type decision_type NOT NULL,
  current_intent intent_type,
  utility_score DECIMAL(5,3),
  chosen BOOLEAN NOT NULL DEFAULT false,
  resources INTEGER,
  military_strength DECIMAL(5,2),
  enemy_military_strength DECIMAL(5,2),
  threat_level DECIMAL(3,2),
  reasoning TEXT,
  target_position JSONB,
  target_entity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Strategic intents table
CREATE TABLE IF NOT EXISTS public.strategic_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  commander_id UUID REFERENCES public.commander_personalities(id) ON DELETE CASCADE,
  tick INTEGER NOT NULL,
  intent intent_type NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  priority_defense DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  priority_offense DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  priority_economy DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  priority_expansion DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  priority_technology DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Game snapshots table
CREATE TABLE IF NOT EXISTS public.game_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  tick INTEGER NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_decision_logs_game_id ON public.ai_decision_logs(game_id);
CREATE INDEX IF NOT EXISTS idx_ai_decision_logs_commander_id ON public.ai_decision_logs(commander_id);
CREATE INDEX IF NOT EXISTS idx_ai_decision_logs_tick ON public.ai_decision_logs(tick);
CREATE INDEX IF NOT EXISTS idx_strategic_intents_game_id ON public.strategic_intents(game_id);
CREATE INDEX IF NOT EXISTS idx_game_snapshots_game_id ON public.game_snapshots(game_id);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commander_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decision_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  CREATE POLICY "Allow public read access to games" ON public.games FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public insert access to games" ON public.games FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public update access to games" ON public.games FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public read access to commander personalities" ON public.commander_personalities FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public insert access to commander personalities" ON public.commander_personalities FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public update access to commander personalities" ON public.commander_personalities FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public read access to ai decision logs" ON public.ai_decision_logs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public insert access to ai decision logs" ON public.ai_decision_logs FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public read access to strategic intents" ON public.strategic_intents FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public insert access to strategic intents" ON public.strategic_intents FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public read access to game snapshots" ON public.game_snapshots FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public insert access to game snapshots" ON public.game_snapshots FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for games table
DROP TRIGGER IF EXISTS update_games_updated_at ON public.games;
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();