-- users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- creators
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  payment_address TEXT, -- e.g. stripe account id or wallet
  created_at TIMESTAMPTZ DEFAULT now()
);

-- creator_codes (simple referral code mapping)
CREATE TABLE IF NOT EXISTS creator_codes (
  code TEXT PRIMARY KEY,
  creator_id UUID REFERENCES creators(id),
  pct_share NUMERIC DEFAULT 0.30, -- e.g. 0.30 == 30%
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- items (cosmetics, battle pass etc)
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_cents INT NOT NULL,
  currency TEXT DEFAULT 'usd',
  type TEXT NOT NULL, -- 'cosmetic'|'battlepass'|'currency' etc
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- purchases (records)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  item_id UUID REFERENCES items(id),
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL,
  stripe_session_id TEXT,
  creator_code TEXT REFERENCES creator_codes(code),
  creator_share_cents INT DEFAULT 0,
  platform_fee_cents INT DEFAULT 0,
  net_revenue_cents INT DEFAULT 0,
  purchased_at TIMESTAMPTZ DEFAULT now()
);

-- subscriptions (basic)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  stripe_subscription_id TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
);

-- entitlements (what the user owns)
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  item_id UUID REFERENCES items(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  source TEXT -- 'purchase'|'promo'|'battlepass'
);

-- battlepass_progress
CREATE TABLE IF NOT EXISTS battlepass_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) PRIMARY KEY,
  xp INT DEFAULT 0,
  level INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- revenue_records (for accounting & payouts)
CREATE TABLE IF NOT EXISTS revenue_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id),
  creator_id UUID REFERENCES creators(id),
  gross_cents INT NOT NULL,
  creator_cents INT DEFAULT 0,
  platform_cents INT DEFAULT 0,
  studio_cents INT DEFAULT 0,
  record_at TIMESTAMPTZ DEFAULT now()
);

-- Tip: enable pgcrypto for gen_random_uuid() or use uuid-ossp.
-- If gen_random_uuid() doesn't work, use: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

