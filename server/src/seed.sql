-- seed.sql - Example seed data for development/testing
-- Run this after applying models.sql

-- Insert example items
INSERT INTO items (sku, name, price_cents, currency, type, metadata) VALUES
  ('cosmetic_skin_001', 'Epic Commander Skin', 999, 'usd', 'cosmetic', '{"rarity": "epic", "category": "skin"}'),
  ('cosmetic_emote_001', 'Victory Dance', 499, 'usd', 'cosmetic', '{"rarity": "common", "category": "emote"}'),
  ('battlepass_season1', 'Season 1 Battle Pass', 1999, 'usd', 'battlepass', '{"season": 1, "tiers": 100}'),
  ('currency_gems_100', '100 Gems', 999, 'usd', 'currency', '{"amount": 100}'),
  ('currency_gems_500', '500 Gems', 3999, 'usd', 'currency', '{"amount": 500}'),
  ('currency_gems_1000', '1000 Gems', 6999, 'usd', 'currency', '{"amount": 1000}')
ON CONFLICT (sku) DO NOTHING;

-- Insert example creators
INSERT INTO creators (name, payment_address) VALUES
  ('Gaming Pro', 'acct_test_creator1'),
  ('Content Creator', 'acct_test_creator2'),
  ('Streamer Name', 'acct_test_creator3')
ON CONFLICT DO NOTHING;

-- Insert creator codes (link to first creator)
INSERT INTO creator_codes (code, creator_id, pct_share, metadata) VALUES
  ('GAMINGPRO', (SELECT id FROM creators WHERE name = 'Gaming Pro' LIMIT 1), 0.30, '{"active": true}'),
  ('CREATOR', (SELECT id FROM creators WHERE name = 'Content Creator' LIMIT 1), 0.30, '{"active": true}'),
  ('STREAMER', (SELECT id FROM creators WHERE name = 'Streamer Name' LIMIT 1), 0.25, '{"active": true}')
ON CONFLICT (code) DO NOTHING;

-- Insert battle pass reward items (linked to levels via metadata)
INSERT INTO items (sku, name, price_cents, currency, type, metadata) VALUES
  ('bp_reward_lvl5', 'Battle Pass Level 5 Reward', 0, 'usd', 'cosmetic', '{"battlepass_level": 5, "rarity": "common"}'),
  ('bp_reward_lvl10', 'Battle Pass Level 10 Reward', 0, 'usd', 'cosmetic', '{"battlepass_level": 10, "rarity": "rare"}'),
  ('bp_reward_lvl20', 'Battle Pass Level 20 Reward', 0, 'usd', 'cosmetic', '{"battlepass_level": 20, "rarity": "epic"}'),
  ('bp_reward_lvl50', 'Battle Pass Level 50 Reward', 0, 'usd', 'cosmetic', '{"battlepass_level": 50, "rarity": "legendary"}')
ON CONFLICT (sku) DO NOTHING;

