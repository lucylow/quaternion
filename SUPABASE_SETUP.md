# Supabase Cloud Database Setup

## Overview

Quaternion now uses Supabase as its cloud database for persistent storage of:
- Player profiles and philosophy
- Game sessions and history
- Multiplayer rooms
- AI memory and learning data
- Chronicles and narrative events

## Setup Instructions

### 1. Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: `quaternion-game`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
5. Wait for project to be created (~2 minutes)

### 2. Get API Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 3. Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" to execute the migration
5. Verify tables were created in **Table Editor**

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

3. For server-side (if using Node.js backend):
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   ```

### 5. Install Dependencies

Supabase client is already in `package.json`, but verify:
```bash
npm install
```

### 6. Update Room Routes (Optional)

If you want to use Supabase for room management instead of in-memory storage:

1. Replace `src/routes/roomRoutes.js` with `src/routes/roomRoutesSupabase.js`
2. Or update your server to use the Supabase version

## Database Schema

### Tables

1. **players** - Player profiles and philosophy
   - `player_id` (unique identifier)
   - `philosophy` (JSONB) - AI-generated player philosophy
   - `play_history` (JSONB) - Game history
   - `preferences` (JSONB) - Player preferences

2. **game_sessions** - Individual game sessions
   - `session_id` (unique)
   - `player_id` (references players)
   - `game_config` (JSONB) - Game configuration
   - `game_state` (JSONB) - Game state snapshot
   - `narrative_events` (JSONB) - AI narrative events
   - `chronicle` (JSONB) - Post-game chronicle
   - `outcome` - win/loss/abandoned
   - `victory_type` - Type of victory achieved

3. **multiplayer_rooms** - Multiplayer room data
   - `room_id` (unique)
   - `host` - Host player ID
   - `players` - Current player count
   - `status` - waiting/starting/in-progress/completed
   - `players_list` (JSONB) - List of players
   - `assigned_axes` (JSONB) - Quaternion axis assignments

4. **ai_memory** - AI memory storage
   - `entity_id` - Entity identifier
   - `entity_type` - Type of entity
   - `content` - Memory content
   - `importance` - Importance score (0-1)
   - `tags` - Array of tags
   - `metadata` (JSONB) - Additional metadata

5. **chronicles** - Exported game chronicles
   - `session_id` (references game_sessions)
   - `player_id` (references players)
   - `title` - Chronicle title
   - `content` (JSONB) - Chronicle content
   - `timeline` - Timeline type
   - `exported_format` - Export format (PDF/HTML/JSON)

## Usage Examples

### Client-Side (React)

```typescript
import { playerService, sessionService } from '@/lib/supabase/database';

// Get or create player
const { data: player } = await playerService.getOrCreatePlayer('player_123');

// Create game session
const { data: session } = await sessionService.createSession(
  'player_123',
  'session_456',
  { mapType: 'crystalline_plains', seed: 12345 }
);

// Add narrative event
await sessionService.addNarrativeEvent('session_456', {
  type: 'lore',
  content: 'The world awakens...'
});

// Finalize session
await sessionService.finalizeSession('session_456', 'win', 'ecological');
```

### Server-Side (Node.js)

```javascript
const { roomService } = require('./lib/supabase/database');

// Create room
const { data: room } = await roomService.createRoom({
  id: 'room_123',
  name: 'My Room',
  host: 'player_123',
  mapType: 'crystalline_plains',
  seed: 12345
});

// Get available rooms
const { data: rooms } = await roomService.getAvailableRooms();
```

## Row Level Security (RLS)

The schema includes RLS policies that allow public access. For production:

1. Go to **Authentication** → **Policies** in Supabase
2. Review and adjust policies based on your security needs
3. Consider implementing user authentication for player-specific data

## Backup and Maintenance

- Supabase automatically backs up your database
- View backups in **Database** → **Backups**
- Monitor usage in **Settings** → **Usage**

## Troubleshooting

### Connection Issues

- Verify environment variables are set correctly
- Check Supabase project is active (not paused)
- Ensure network allows connections to Supabase

### Migration Errors

- Check SQL syntax in migration file
- Verify extensions are enabled (uuid-ossp)
- Check for existing tables that might conflict

### Performance

- Add indexes for frequently queried columns
- Use JSONB indexes for JSON queries
- Monitor query performance in Supabase dashboard

## Next Steps

1. Set up authentication (optional) for user accounts
2. Implement real-time subscriptions for multiplayer
3. Add database triggers for automatic updates
4. Set up scheduled cleanup jobs for old data

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Project Issues: Check GitHub issues

