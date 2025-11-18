# Game Troubleshooting Guide

## Quick Diagnostic

Run the diagnostic script:
```bash
node scripts/diagnose-game.js
```

## Common Issues and Fixes

### 1. Game Shows Loading Screen Forever

**Symptoms:** Loading spinner never disappears, game canvas never appears

**Possible Causes:**
- Phaser game `ready` event not firing
- Asset loading hanging
- Container element not found

**Fixes:**
- ✅ **FIXED:** Added `setLoading(false)` in Phaser game `ready` event handler
- Check browser console for errors
- Verify container element exists: `document.getElementById('phaser-game-container')`
- Check network tab for failed asset loads

### 2. Blank Screen / Black Screen

**Symptoms:** Page loads but shows nothing or just black screen

**Possible Causes:**
- Phaser game not initializing
- Canvas not rendering
- CSS z-index issues
- Container element not visible

**Fixes:**
1. Open browser console (F12)
2. Check for errors
3. Verify Phaser game instance exists:
   ```javascript
   // In browser console
   window.phaserGameRef?.current
   ```
4. Check if canvas exists:
   ```javascript
   document.querySelector('canvas')
   ```
5. Verify container is visible:
   ```javascript
   const container = document.getElementById('phaser-game-container');
   console.log('Container:', container);
   console.log('Visible:', container?.offsetWidth, container?.offsetHeight);
   ```

### 3. Game Doesn't Respond to Input

**Symptoms:** Can't click, drag, or interact with game

**Possible Causes:**
- Input system disabled
- Canvas pointer-events blocked
- Z-index layering issues

**Fixes:**
- ✅ **FIXED:** Code ensures input is enabled in ready handler
- Check CSS: `pointer-events: auto` on game container
- Verify no overlay blocking canvas
- Check browser console for input-related errors

### 4. Assets Not Loading

**Symptoms:** Missing textures, sprites, or images

**Possible Causes:**
- Incorrect asset paths
- CORS issues
- Asset files missing

**Fixes:**
1. Check browser Network tab for 404 errors
2. Verify asset paths in `ImageAssetLoader`
3. Check that assets exist in `public/assets/` or correct directory
4. Look for CORS errors in console

### 5. Environment Variables Missing

**Symptoms:** API features not working (Supabase, ElevenLabs, etc.)

**Fixes:**
1. Create `.env` file in project root
2. Add required variables:
   ```
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   VITE_ELEVENLABS_API_KEY=your_key
   ```
3. Restart dev server after adding env vars

### 6. Dependencies Not Installed

**Symptoms:** Module not found errors, import errors

**Fixes:**
```bash
npm install
```

### 7. Build Errors

**Symptoms:** `npm run build` fails

**Fixes:**
1. Check TypeScript errors: `npm run lint`
2. Verify all imports are correct
3. Check for missing type definitions

## Debugging Steps

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for:
   - Red errors
   - Yellow warnings
   - Phaser initialization logs
   - Game ready messages

### Step 2: Verify Game Initialization
In browser console, run:
```javascript
// Check if game container exists
console.log('Container:', document.getElementById('phaser-game-container'));

// Check if Phaser is loaded
console.log('Phaser:', window.Phaser);

// Check if game instance exists (if exposed)
// This requires the game ref to be accessible
```

### Step 3: Check Network Requests
1. Open DevTools Network tab
2. Reload page
3. Look for:
   - Failed requests (red)
   - Missing assets
   - Slow loading resources

### Step 4: Verify React Rendering
1. Install React DevTools extension
2. Check if `QuaternionGame` component is mounted
3. Verify state values (loading, error, etc.)

### Step 5: Check Phaser Game State
If game instance is accessible:
```javascript
const game = window.phaserGameRef?.current;
if (game) {
  console.log('Game state:', game.isRunning);
  console.log('Scenes:', game.scene.scenes);
  console.log('Canvas:', game.canvas);
}
```

## Manual Testing Checklist

- [ ] Page loads without errors
- [ ] Loading screen appears initially
- [ ] Loading screen disappears after game ready
- [ ] Game canvas is visible
- [ ] Can see game graphics/terrain
- [ ] Mouse clicks work
- [ ] Keyboard input works (WASD, arrow keys)
- [ ] UI panels are visible
- [ ] No console errors
- [ ] Performance is acceptable (60 FPS target)

## Getting Help

If issues persist:

1. **Collect Information:**
   - Browser and version
   - Operating system
   - Console errors (screenshot)
   - Network tab errors
   - Steps to reproduce

2. **Run Diagnostic:**
   ```bash
   node scripts/diagnose-game.js
   ```

3. **Check Logs:**
   - Browser console logs
   - Terminal output from `npm run dev`

4. **Test Minimal Case:**
   - Try navigating directly to `/game`
   - Check if other routes work
   - Verify React Router is working

## Recent Fixes Applied

- ✅ Added `setLoading(false)` in Phaser game `ready` event handler to ensure loading screen disappears
- ✅ Enhanced input system initialization checks
- ✅ Added comprehensive logging for debugging

