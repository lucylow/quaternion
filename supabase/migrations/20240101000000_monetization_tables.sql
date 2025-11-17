-- Monetization system database tables
-- Run this migration to set up all monetization-related tables

-- Player cosmetics inventory
CREATE TABLE IF NOT EXISTS player_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  cosmetic_id TEXT NOT NULL,
  slot_type TEXT,
  active BOOLEAN DEFAULT false,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, cosmetic_id)
);

CREATE INDEX IF NOT EXISTS idx_player_cosmetics_player_id ON player_cosmetics(player_id);
CREATE INDEX IF NOT EXISTS idx_player_cosmetics_active ON player_cosmetics(player_id, active);

-- Battle passes
CREATE TABLE IF NOT EXISTS battle_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  pass_type TEXT NOT NULL,
  total_rewards INTEGER NOT NULL,
  current_level INTEGER DEFAULT 1,
  progress INTEGER DEFAULT 0,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_battle_passes_player_id ON battle_passes(player_id);
CREATE INDEX IF NOT EXISTS idx_battle_passes_active ON battle_passes(player_id, active);

-- Battle pass rewards
CREATE TABLE IF NOT EXISTS battle_pass_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_pass_id UUID REFERENCES battle_passes(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  reward_id TEXT NOT NULL,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(battle_pass_id, level)
);

CREATE INDEX IF NOT EXISTS idx_battle_pass_rewards_pass_id ON battle_pass_rewards(battle_pass_id);
CREATE INDEX IF NOT EXISTS idx_battle_pass_rewards_claimed ON battle_pass_rewards(battle_pass_id, claimed);

-- Seasonal rankings
CREATE TABLE IF NOT EXISTS seasonal_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  season TEXT NOT NULL,
  rating INTEGER DEFAULT 1200,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, season)
);

CREATE INDEX IF NOT EXISTS idx_seasonal_rankings_season ON seasonal_rankings(season);
CREATE INDEX IF NOT EXISTS idx_seasonal_rankings_rating ON seasonal_rankings(season, rating DESC);

-- Seasonal NFT badges
CREATE TABLE IF NOT EXISTS seasonal_nft_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  season TEXT NOT NULL,
  contract_address TEXT,
  token_id TEXT NOT NULL,
  wallet_address TEXT,
  metadata JSONB,
  transaction_hash TEXT,
  minted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, season)
);

CREATE INDEX IF NOT EXISTS idx_seasonal_nft_badges_player_id ON seasonal_nft_badges(player_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_nft_badges_season ON seasonal_nft_badges(season);

-- Coaching bookings
CREATE TABLE IF NOT EXISTS coaching_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  coach_id TEXT NOT NULL,
  package TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  video_room_id TEXT,
  status TEXT DEFAULT 'scheduled',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_bookings_player_id ON coaching_bookings(player_id);
CREATE INDEX IF NOT EXISTS idx_coaching_bookings_coach_id ON coaching_bookings(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_bookings_status ON coaching_bookings(status);

-- Coaches table (optional - can be populated separately)
CREATE TABLE IF NOT EXISTS coaches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rating DECIMAL(3,2) DEFAULT 5.0,
  active BOOLEAN DEFAULT true,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coach notifications
CREATE TABLE IF NOT EXISTS coach_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id TEXT NOT NULL,
  booking_id UUID REFERENCES coaching_bookings(id) ON DELETE CASCADE,
  player_name TEXT,
  scheduled_at TIMESTAMPTZ,
  package TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournament registrations
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  status TEXT DEFAULT 'registered',
  seed INTEGER,
  bracket JSONB,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_player ON tournament_registrations(player_id);

-- Tournament matches
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id TEXT NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id TEXT,
  player2_id TEXT,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  winner_id TEXT,
  round INTEGER NOT NULL,
  bracket TEXT,
  status TEXT DEFAULT 'pending',
  stats JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches(tournament_id, round);

-- Tournaments table (optional)
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  bracket_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prize distributions
CREATE TABLE IF NOT EXISTS prize_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prize_distributions_tournament ON prize_distributions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_prize_distributions_player ON prize_distributions(player_id);

-- Player currency (for premium currency)
CREATE TABLE IF NOT EXISTS player_currency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT PRIMARY KEY,
  premium_currency INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player boosters (XP boosters, etc.)
CREATE TABLE IF NOT EXISTS player_boosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  booster_type TEXT NOT NULL,
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  duration_hours INTEGER NOT NULL,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_player_boosters_player_id ON player_boosters(player_id);
CREATE INDEX IF NOT EXISTS idx_player_boosters_expires ON player_boosters(expires_at);

