-- Create table for AI decision history
CREATE TABLE public.ai_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  tick INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  commander_id TEXT,
  prompt_hash TEXT,
  prompt TEXT,
  model_response TEXT,
  action_taken JSONB,
  decision_latency_ms INTEGER,
  tokens_used INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  fallback_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for querying by game
CREATE INDEX idx_ai_decisions_game_id ON public.ai_decisions(game_id);
CREATE INDEX idx_ai_decisions_created_at ON public.ai_decisions(created_at DESC);

-- Create table for AI performance metrics
CREATE TABLE public.ai_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for metrics
CREATE INDEX idx_ai_metrics_game_id ON public.ai_metrics(game_id);
CREATE INDEX idx_ai_metrics_type ON public.ai_metrics(metric_type);

-- Enable RLS
ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_metrics ENABLE ROW LEVEL SECURITY;

-- Public read access for analysis
CREATE POLICY "AI decisions viewable by everyone" 
ON public.ai_decisions 
FOR SELECT 
USING (true);

CREATE POLICY "AI metrics viewable by everyone" 
ON public.ai_metrics 
FOR SELECT 
USING (true);

-- Insert-only for server/system
CREATE POLICY "AI decisions insertable by service role" 
ON public.ai_decisions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "AI metrics insertable by service role" 
ON public.ai_metrics 
FOR INSERT 
WITH CHECK (true);