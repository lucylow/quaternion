# Development Playtesting Guide

**PATCHED BY CURSOR - 2024-12-19 - safe bootstrap & debug**

This guide explains how to run and debug the game for playtesting, and how to interpret `[QUAT DEBUG]` logs.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm ci
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   - Navigate to the URL shown in terminal (usually `http://localhost:3000`)
   - Open DevTools console (F12 or Cmd+Option+I)

4. **Expected console logs:**
   You should see logs in this order:
   - `[QUAT DEBUG] main.tsx loaded`
   - `[QUAT DEBUG] phaserShim: installing Phaser input compatibility shims`
   - `[QUAT DEBUG] GameRoot mounted` (if using GameRoot component)
   - `[QUAT DEBUG] initEngine called`
   - `[QUAT DEBUG] render loop started` or fallback sample renderer installed
   - If sample fallback activated: see simple circles on canvas
   - If engine attached: see engine logs and entity count >0

## Debugging

### Console Logs

All debug logs are prefixed with `[QUAT DEBUG]` for easy filtering. You can filter the console to show only these logs.

### Common Issues

1. **"input.hitAreaCallback is not a function" errors:**
   - These should be prevented by the Phaser shim installed in `src/engine/phaserShim.js`
   - If you still see these, check that `phaserShim.js` is imported early in `main.tsx`

2. **Canvas not visible:**
   - Check that `#game-canvas` element exists in DOM
   - Check CSS: canvas should have `position: absolute; inset: 0; z-index: 1;`
   - Check browser console for canvas creation logs

3. **Engine not initializing:**
   - Check `window.quaternionEngine` exists: `console.log(window.quaternionEngine)`
   - Check `initEngine` logs in console
   - Fallback renderer should activate if engine fails

4. **"Unknown message type: iframe-pos" warnings:**
   - These are now handled gracefully and logged under `[QUAT DEBUG] iframe-pos`
   - Should not spam console anymore

### Debug Overlay

The `DebugOverlay` component shows:
- Last N console warnings/errors
- FPS (if available from Phaser game)
- Entity count (if engine provides `getEntityCount()`)
- Tick counter

Access it via the `DebugOverlay` component in your React tree.

### Window Globals

For debugging, these globals are available:
- `window.__QUAT_DEBUG__` - Debug mode flag
- `window.__QUAT_LOGS__` - Array of recent console logs
- `window.quaternionEngine` - The game engine instance
- `window.__QUAT_PHASER_GAME__` - Phaser game instance (if using Phaser)
- `window.__QUAT_DEV_FALLBACK_RENDER__` - Fallback renderer function
- `window.__QUAT_SAMPLE_REPLAY__` - Sample replay data (if loaded)

## Smoke Testing

Run the smoke test scripts to validate basic setup:

```bash
# Visual smoke test
./scripts/dev_visual_smoke.sh http://localhost:3000

# Canvas check
node scripts/check_canvas.js http://localhost:3000
```

## Game Loop

The game uses a decoupled fixed tick + render loop:
- **Fixed tick:** 50ms (20 TPS) for deterministic game logic
- **Render:** Variable timestep via `requestAnimationFrame` for smooth visuals
- **Interpolation:** Enabled by default for smooth rendering between ticks

See `src/hooks/useGameLoop.ts` for implementation.

## Fallback Renderer

If the engine fails to initialize, a dev fallback renderer will:
- Draw simple colored circles representing units
- Show a sample objective marker
- Display on the canvas so testers can see something

This is controlled by `src/utils/dev_fallback_renderer.ts`.

## Phaser Compatibility

The Phaser shim (`src/engine/phaserShim.js`) patches:
- `InputPlugin.setHitArea` to ensure `hitAreaCallback` is always a function
- `GameObject.setInteractive` to validate callbacks

This prevents common "input.hitAreaCallback is not a function" errors.

## Environment Variables

- `REACT_APP_USE_SAMPLE_DEMO=true` - Auto-load sample demo state (if implemented)
- `VITE_USE_REPLAY_MOCK=true` - Use mock replay API (if implemented)

## Manual Testing Checklist

After starting the dev server:

1. ✓ Open browser to dev URL
2. ✓ Open DevTools console
3. ✓ Verify `[QUAT DEBUG]` logs appear
4. ✓ Verify no `TypeError: input.hitAreaCallback is not a function` errors
5. ✓ Verify canvas is visible (check DOM for `#game-canvas`)
6. ✓ Verify overlays and UI still function
7. ✓ Verify buttons are clickable
8. ✓ Verify input events reach engine (click on unit should highlight or log event)
9. ✓ Run smoke scripts to validate setup

## Getting Help

If issues persist:
1. Check browser console for `[QUAT DEBUG]` logs
2. Check `window.__QUAT_LOGS__` for recent errors
3. Verify all files from the patch are present
4. Check that Phaser shim is loaded early (should see logs on page load)

