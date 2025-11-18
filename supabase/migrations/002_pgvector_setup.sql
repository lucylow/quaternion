-- Enable extensions (run once, requires superuser privileges)
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;     -- pgvector
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- fast fuzzy text search

-- Create table for embeddings
CREATE TABLE IF NOT EXISTS ai_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,                 -- e.g. "replay:123" or "player:uuid"
  namespace TEXT DEFAULT 'default',
  embedding vector(1536),           -- adjust dims to your model (e.g. 1536 for OpenAI text-embedding-3-large)
  metadata JSONB,
  created_at timestamptz DEFAULT now()
);

-- Create index for nearest neighbor queries
CREATE INDEX IF NOT EXISTS ai_embeddings_idx ON ai_embeddings USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- Create table for AI decisions logging
CREATE TABLE IF NOT EXISTS ai_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text,
  player_id uuid,
  action text,
  created_at timestamptz DEFAULT now(),
  meta jsonb
);

-- Create index for querying decisions
CREATE INDEX IF NOT EXISTS ai_decisions_game_id_idx ON ai_decisions(game_id);
CREATE INDEX IF NOT EXISTS ai_decisions_player_id_idx ON ai_decisions(player_id);
CREATE INDEX IF NOT EXISTS ai_decisions_created_at_idx ON ai_decisions(created_at);

