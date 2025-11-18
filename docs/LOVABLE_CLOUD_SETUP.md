# Lovable Cloud Setup Guide

This guide explains how to configure database, secrets, and edge functions for your Quaternion game in Lovable Cloud.

## Overview

The Quaternion game uses:
- **Supabase** for database and storage
- **Lovable AI Gateway** for LLM-powered AI decisions
- **Edge Functions** for serverless backend operations
- **Secrets Management** for secure API keys and credentials

## Quick Start

1. **Set up Supabase** (if not already done)
2. **Configure Secrets in Lovable Cloud**
3. **Deploy Edge Functions to Supabase**
4. **Test the integration**

## Step 1: Supabase Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and API keys:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: Found in Settings → API → Project API keys
   - **Service Role Key**: Found in Settings → API → Project API keys (⚠️ Keep secret!)

### Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `replays`
3. Set it to **Public** if you want replays to be publicly accessible, or **Private** for authenticated access only

### Optional: Create Database Tables

The edge functions will work without these tables, but they enable analytics and better data management:

#### AI Decisions Table

```sql
CREATE TABLE IF NOT EXISTS ai_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commander_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  tick INTEGER NOT NULL,
  order TEXT NOT NULL,
  target TEXT,
  unit_qty INTEGER,
  reason TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  used_llm BOOLEAN DEFAULT false,
  fallback BOOLEAN DEFAULT false,
  game_state JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_decisions_commander ON ai_decisions(commander_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_created ON ai_decisions(created_at);
```

#### Replay Metadata Table

```sql
CREATE TABLE IF NOT EXISTS replay_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replay_id TEXT UNIQUE NOT NULL,
  seed INTEGER NOT NULL,
  commander_id TEXT NOT NULL,
  map_config JSONB,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_sec INTEGER NOT NULL,
  final_outcome TEXT NOT NULL CHECK (final_outcome IN ('victory', 'defeat', 'draw')),
  summary TEXT,
  ai_highlights JSONB,
  partial BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_replay_metadata_commander ON replay_metadata(commander_id);
CREATE INDEX IF NOT EXISTS idx_replay_metadata_seed ON replay_metadata(seed);
CREATE INDEX IF NOT EXISTS idx_replay_metadata_created ON replay_metadata(created_at);
```

## Step 2: Configure Secrets in Lovable Cloud

### Required Secrets

In your Lovable Cloud project settings, add these environment variables:

#### Supabase Configuration (Required)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Alternative names** (also supported):
- `VITE_SUPABASE_URL` (for frontend)
- `SUPABASE_PROJECT_URL`
- `SUPABASE_SERVICE_KEY`

#### Lovable AI Gateway (Optional - for AI features)

```
LOVABLE_API_KEY=your-lovable-api-key-here
LOVABLE_API_URL=https://ai.gateway.lovable.dev/v1/chat/completions
```

**Note**: If `LOVABLE_API_KEY` is not set, the AI will use deterministic fallback decisions.

#### TTS Configuration (Optional - for text-to-speech)

Choose one provider:

**ElevenLabs:**
```
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your-elevenlabs-key
```

**Google Cloud TTS:**
```
TTS_PROVIDER=google
GOOGLE_TTS_KEY=base64-encoded-service-account-json
```

**AWS Polly:**
```
TTS_PROVIDER=polly
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

#### Feature Flags (Optional)

```
MOCK_MODE=false          # Set to true to disable external APIs
TTS_MOCK=false           # Set to true to disable TTS
EDGE_MOCK=false          # Set to true to disable all edge features
```

### How to Add Secrets in Lovable Cloud

1. Go to your Lovable project dashboard
2. Navigate to **Settings** → **Environment Variables** or **Secrets**
3. Click **Add Secret** or **Add Environment Variable**
4. Enter the key and value
5. Save and redeploy your project

## Step 3: Configure Supabase Edge Functions

### Deploy Edge Functions

The edge functions are located in `supabase/functions/`:

- `ai-strategy` - Handles AI decision-making
- `replay-handler` - Manages game replays

#### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Set secrets for edge functions
supabase secrets set LOVABLE_API_KEY=your-key-here
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Deploy functions
supabase functions deploy ai-strategy
supabase functions deploy replay-handler
```

#### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions**
3. For each function:
   - Click **Deploy** or **Create Function**
   - Upload the function code from `supabase/functions/[function-name]/`
   - Set environment variables in the function settings

### Edge Function Environment Variables

For each edge function, set these environment variables:

**Required:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key

**Optional:**
- `LOVABLE_API_KEY` - For AI features
- `LOVABLE_API_URL` - Custom API URL (defaults to Lovable gateway)
- TTS provider keys (if using TTS)

## Step 4: Frontend Configuration

### Environment Variables for Frontend

In your Lovable Cloud project, also set these for the frontend:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

These are used by the frontend Supabase client in `src/integrations/supabase/client.ts`.

## Step 5: Testing

### Test Database Connection

```bash
# Run the seed script to test database connection
node scripts/seed-database.js
```

### Test Edge Functions

#### Test AI Strategy Function

```bash
curl -X POST https://your-project.supabase.co/functions/v1/ai-strategy \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "gameState": {
      "ore": 500,
      "energy": 200,
      "units": {"worker": 5, "infantry": 3},
      "buildings": {"ore_extractor": 2},
      "enemyVisible": {"infantry": 2},
      "mapFeatures": ["ore_rich"],
      "tick": 100,
      "commanderId": "auren"
    },
    "agentType": "commander"
  }'
```

#### Test Replay Handler

```bash
curl -X POST https://your-project.supabase.co/functions/v1/replay-handler/generate \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "seed": 12345,
    "mapConfig": {"size": 1000, "type": "standard"},
    "commanderId": "auren"
  }'
```

## Troubleshooting

### Edge Function Errors

**Error: "LOVABLE_API_KEY not configured"**
- Solution: Set `LOVABLE_API_KEY` in Supabase Edge Function secrets or Lovable Cloud secrets

**Error: "Supabase credentials not configured"**
- Solution: Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in edge function environment variables

**Error: "Database connection failed"**
- Solution: Check that your Supabase project is active and the service role key is correct

### Database Errors

**Error: "Table does not exist"**
- Solution: The edge functions will work without optional tables. Create them using the SQL above if you want analytics.

**Error: "Storage bucket not found"**
- Solution: Create a `replays` bucket in Supabase Storage

### Frontend Errors

**Error: "Supabase environment variables are missing"**
- Solution: Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Lovable Cloud environment variables

## Architecture

### Secrets Flow

```
Lovable Cloud Secrets
    ↓
Frontend (VITE_* variables)
    ↓
Browser → Supabase Client
    ↓
Supabase Edge Functions
    ↓
Shared Config Module (_shared/config.ts)
    ↓
Database/API Calls
```

### Edge Function Structure

```
supabase/functions/
├── _shared/
│   ├── config.ts      # Centralized secrets management
│   └── database.ts    # Database client with retry logic
├── ai-strategy/
│   └── index.ts       # AI decision-making function
└── replay-handler/
    └── index.ts       # Replay management function
```

## Best Practices

1. **Never commit secrets** - Use environment variables or secrets management
2. **Use service role key only in edge functions** - Never expose it to the frontend
3. **Enable RLS (Row Level Security)** - If using public tables, set up proper security policies
4. **Monitor edge function logs** - Check Supabase dashboard for errors
5. **Use feature flags** - Enable/disable features based on environment

## Security Notes

- **Service Role Key**: Has full database access. Only use in edge functions, never in frontend code.
- **Anon Key**: Safe for frontend use, but should have RLS policies enabled.
- **API Keys**: Store in Lovable Cloud secrets, never in code or version control.

## Next Steps

- [ ] Set up Supabase project
- [ ] Configure all required secrets
- [ ] Deploy edge functions
- [ ] Test database connection
- [ ] Test edge functions
- [ ] Set up optional database tables for analytics
- [ ] Configure storage buckets

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Lovable Cloud Documentation](https://docs.lovable.dev)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Project README](../README.md)

