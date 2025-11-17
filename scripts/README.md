# Database Seeding Script

This directory contains scripts for populating the Supabase database with sample data.

## Prerequisites

1. **Environment Variables**: You need to set up your Supabase credentials:
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

   Or create a `.env` file in the project root:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Get Your Supabase Credentials**:
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "Project URL" (for `SUPABASE_URL`)
   - Copy the "service_role" key (for `SUPABASE_SERVICE_ROLE_KEY`)
   - ⚠️ **Important**: The service role key bypasses Row Level Security. Keep it secret!

## Usage

### Option 1: Using npm script (recommended)

```bash
npm run seed
```

### Option 2: Direct execution

```bash
node scripts/seed-database.js
```

### Option 3: With dotenv (if you have a .env file)

First install dotenv:
```bash
npm install dotenv
```

Then modify the script to load dotenv, or run:
```bash
node -r dotenv/config scripts/seed-database.js
```

## What Gets Created

The seeding script populates all database tables with realistic sample data:

- **Games**: 4 sample games (completed, active, waiting)
- **Commander Personalities**: 2 commanders per game (8 total)
- **Strategic Intents**: AI strategy decisions over time
- **AI Decision Logs**: Detailed decision-making logs
- **AI Decisions**: Model responses and actions
- **AI Metrics**: Performance metrics per game
- **Game Snapshots**: Periodic game state saves

## Verifying the Data

After running the seed script, you can verify the data in your Supabase dashboard:

1. Go to your Supabase project
2. Navigate to Table Editor
3. Check each table to see the seeded data

## Troubleshooting

### "Missing required environment variables"
- Make sure you've set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check that your `.env` file is in the project root (if using dotenv)

### "Failed to insert games"
- Check that your Supabase project is active
- Verify your service role key is correct
- Ensure all migrations have been run

### "Row Level Security" errors
- The service role key should bypass RLS, but if you see errors, check your RLS policies
- You may need to temporarily disable RLS for seeding, or adjust policies

## Resetting the Database

To start fresh, you can:

1. **Delete all data** (via Supabase dashboard):
   - Go to Table Editor
   - Delete rows from each table (or truncate tables)

2. **Or use SQL** (in Supabase SQL Editor):
   ```sql
   TRUNCATE TABLE 
     ai_decision_logs,
     ai_decisions,
     ai_metrics,
     strategic_intents,
     game_snapshots,
     commander_personalities,
     games
   CASCADE;
   ```

Then run the seed script again.

