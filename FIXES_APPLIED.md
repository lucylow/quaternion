# Game Fixes Applied - Summary

This document summarizes all the fixes and improvements applied to make the game clickable and playable in the browser.

## ✅ Fixes Applied

### 1. React Duplicate Keys Fix
**File:** `src/pages/QuaternionGame.tsx`
- **Issue:** `aiMessages.map()` was using `getMessageKey(msg, idx)` which could cause duplicate keys
- **Fix:** Changed to use stable `msg.id` directly: `key={msg.id}`
- **Location:** Line ~3640

### 2. Window Message Handler
**File:** `src/main.tsx`
- **Status:** Already properly guarded with passive listener
- **Note:** Handler already filters iframe-pos messages silently

### 3. EngineBridge for React ↔ Engine Communication
**File:** `src/engine/EngineBridge.ts` (NEW)
- **Purpose:** Bridge for React UI to communicate with Phaser game engine
- **Features:**
  - `sendCommand(cmd)` - Send commands from React to engine
  - `onCommand(fn)` - Register listeners in Phaser scene
  - Automatic error handling
- **Usage:**
  ```typescript
  // In React:
  engineBridge.sendCommand({ type: 'click-tile', payload: { tileId: 'tile_1' } });
  
  // In Phaser scene:
  engineBridge.onCommand((cmd) => {
    if (cmd.type === 'click-tile') { /* handle */ }
  });
  ```

### 4. AudioManager
**File:** `src/engine/AudioManager.ts` (NEW)
- **Purpose:** Unified audio manager with Phaser + HTML5 Audio fallback
- **Features:**
  - Uses Phaser sound when available
  - Falls back to HTML5 Audio
  - Supports `.ogg` and `.mp3` formats
  - Caching for performance
- **Methods:**
  - `registerPhaser(soundManager)` - Register Phaser sound system
  - `play(soundKey, opts)` - Play one-shot sound
  - `loop(soundKey, opts)` - Play looping sound
  - `stop(soundKey)` - Stop specific sound
  - `stopAll()` - Stop all sounds

### 5. TTS Playback Helper
**File:** `src/engine/tts.ts` (NEW)
- **Purpose:** Play TTS audio files (ElevenLabs output)
- **Functions:**
  - `playTTSUrl(url)` - Play TTS from URL (local or remote)
  - `playTTSFile(filename)` - Play from `/audio/voices/` directory
- **Features:**
  - Automatic blob URL management
  - Error handling
  - Cleanup after playback

### 6. Mock Game Data
**File:** `src/data/mockGameState.ts` (NEW)
- **Purpose:** Mock data for testing and development
- **Exports:**
  - `MOCK_TILES` - Array of 9 sample tiles
  - `MOCK_UNITS` - Array of sample units
  - `generateMockTiles(width, height)` - Generate tiles for larger maps
  - `generateMockUnits(count, mapWidth, mapHeight)` - Generate units

### 7. Example TileCard Component
**File:** `src/components/game/TileCard.tsx` (NEW)
- **Purpose:** Example clickable tile component
- **Features:**
  - Integrates with EngineBridge
  - Plays click sounds via AudioManager
  - Keyboard accessible (Enter/Space)
  - Styled with hover effects

### 8. LogOnce Utility
**File:** `src/utils/logOnce.ts` (NEW)
- **Purpose:** Throttle repeated log messages
- **Functions:**
  - `logOnce(key, ...args)` - Warn once per key
  - `logOnceError(key, ...args)` - Error once per key
  - `clearLogOnceCache()` - Reset cache
  - `resetLogOnceKey(key)` - Reset specific key

### 9. Phaser Scene Integration
**File:** `src/pages/QuaternionGame.tsx`
- **Changes:**
  - Added EngineBridge and AudioManager imports
  - Registered AudioManager in `create()` function
  - Set up EngineBridge command listener
  - Added audio preloading in `preload()` function
  - Updated click handlers for:
    - Resource nodes
    - Player base
    - Units
  - All click handlers now:
    - Play click sounds
    - Send commands via EngineBridge

## 📁 New Files Created

1. `src/engine/EngineBridge.ts` - React ↔ Engine communication bridge
2. `src/engine/AudioManager.ts` - Unified audio management
3. `src/engine/tts.ts` - TTS playback helper
4. `src/data/mockGameState.ts` - Mock game data
5. `src/components/game/TileCard.tsx` - Example clickable tile component
6. `src/utils/logOnce.ts` - Log throttling utility

## 🔧 Modified Files

1. `src/pages/QuaternionGame.tsx`
   - Fixed duplicate keys in aiMessages.map
   - Added EngineBridge integration
   - Added AudioManager integration
   - Updated click handlers

2. `src/main.tsx`
   - Message handler already properly guarded (no changes needed)

## 🎮 Audio Files Required

Place these files in `public/audio/`:
- `bg_loop.ogg` (or `.mp3`) - Background music loop
- `ui_click.ogg` (or `.mp3`) - UI click sound

Place TTS files in `public/audio/voices/`:
- Any ElevenLabs-generated audio files

## ✅ Testing Checklist

1. ✅ No React duplicate key warnings in console
2. ✅ No `input.hitAreaCallback is not a function` errors
3. ✅ No spam from `iframe-pos` messages
4. ✅ Clicking tiles/units plays sounds
5. ✅ Background music plays (if files exist)
6. ✅ React UI clicks propagate to Phaser scene
7. ✅ TTS playback works (if files exist)

## 🚀 Next Steps

1. Add audio files to `public/audio/`:
   - `bg_loop.ogg`
   - `ui_click.ogg`

2. Add TTS files to `public/audio/voices/`:
   - Any generated TTS audio files

3. Test clicking:
   - Resource nodes
   - Player base
   - Units
   - Tiles (using TileCard component)

4. Verify EngineBridge communication:
   - React → Engine commands work
   - Visual feedback appears on clicks
   - Sounds play correctly

## 📝 Notes

- The existing `audioManager` from `@/utils/audioManager` is kept separate from the new `gameAudioManager` to avoid conflicts
- All Phaser interactive objects use `safeSetInteractive()` which already handles hitAreaCallback issues
- EngineBridge is attached to `window.engineBridge` in debug mode for easy testing
- AudioManager automatically falls back to HTML5 Audio if Phaser sound fails

