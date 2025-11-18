# Lovable Cloud Integration Guide

## PATCHED BY CURSOR - lovable integration

This document describes how to set up and deploy the Lovable Cloud integration for the Quaternion game.

## Overview

The integration adds:
- Edge proxy endpoints that securely forward requests to Lovable Cloud
- Frontend client for calling Lovable services
- Asset prefetching from Lovable CDN with local fallbacks
- Phaser input shims to prevent crashes
- Debug UI component for monitoring Lovable health

## Setup

### 1. Set Environment Variables

Copy `src/edge/lovably_config.example.env` and set your actual values:

```bash
LOVABLE_API_KEY=your_lovable_api_key_here
LOVABLE_BASE_URL=https://api.lovableproject.com
```

### 2. Deploy Edge Functions

The edge proxy (`src/edge/lovably_proxy.js`) needs to be deployed to your hosting platform (Lovable Cloud, Vercel, etc.).

#### Option A: Deploy to Lovable Cloud

1. Use the deploy script template:
   ```bash
   ./scripts/deploy_lovably_edge.sh
   ```

2. Set the `LOVABLE_API_KEY` secret in your Lovable project settings.

3. Update the script with your actual Lovable CLI commands.

#### Option B: Deploy as Express Middleware

If running a Node.js server, mount the proxy handlers:

```javascript
const { handleHealth, handleLLM, handleAsset } = require('./src/edge/lovably_proxy');

app.get('/api/lovably/health', handleHealth);
app.post('/api/lovably/llm', handleLLM);
app.post('/api/lovably/assets', handleAsset);
```

### 3. Verify Health Endpoint

After deployment, test the health endpoint:

```bash
./scripts/check_lovably_health.sh
```

Or manually:
```bash
curl http://localhost:3000/api/lovably/health
```

## Usage

### Frontend Client

The frontend client (`src/utils/lovableClient.js`) provides:

- `lovablyHealth()` - Check Lovable service health
- `lovablyLLM(promptOrMessages, opts)` - Call Lovable LLM
- `lovablySignedAsset(path)` - Get signed URL for assets

### Debug UI

The `LovableDebug` component is automatically mounted in the app. It shows:
- Lovable health status
- A ping button to test the health endpoint

### Asset Prefetching

The engine startup (`src/engine/startup.ts`) automatically:
1. Checks Lovable health
2. Prefetches critical assets (sprites, tiles, fonts)
3. Falls back to local assets if Lovable is unavailable

Assets are stored in `window.__QUAT_ASSET_OVERRIDES__` for the engine to use.

## Phaser Shims

The integration includes Phaser input shims to prevent `input.hitAreaCallback is not a function` errors:

- `src/engine/phaserShim.js` - Automatic shim installation
- `src/utils/phaserHelpers.js` - Helper functions (`safeSetInteractive`, `applyHitAreaCallbackSafely`)

These are automatically applied at app startup.

## Troubleshooting

### Lovable Health Check Fails

1. Verify `LOVABLE_API_KEY` is set correctly
2. Check that edge functions are deployed
3. Verify network connectivity to Lovable API
4. Check browser console for `[QUAT DEBUG]` logs

### Assets Not Loading

1. Check `window.__QUAT_ASSET_OVERRIDES__` in browser console
2. Verify asset paths match Lovable CDN structure
3. Check network tab for failed asset requests
4. Fallback to local assets should work automatically

### Phaser Input Errors

1. Verify `phaserShim.js` is imported in `main.tsx`
2. Check console for `[QUAT DEBUG] installed Phaser InputPlugin.setHitArea shim`
3. Use `safeSetInteractive` from `phaserHelpers.js` instead of direct `setInteractive`

## Files Modified/Created

### New Files
- `src/edge/lovably_proxy.js` - Edge proxy handlers
- `src/utils/lovableClient.js` - Frontend client
- `src/components/LovableDebug.tsx` - Debug UI
- `src/edge/lovably_config.example.env` - Example env config
- `scripts/deploy_lovably_edge.sh` - Deploy script
- `scripts/check_lovably_health.sh` - Health check script
- `docs/LOVABLE-INTEGRATION.md` - This file

### Modified Files
- `src/engine/startup.ts` - Added Lovable asset prefetching
- `src/utils/phaserHelpers.js` - Enhanced with better fallbacks
- `src/engine/phaserShim.js` - Added `applyPhaserInputShims()` export
- `src/App.tsx` - Added LovableDebug component
- `src/main.tsx` - Already imports phaserShim (no changes needed)

## Rollback

All files are marked with `// PATCHED BY CURSOR - lovable integration` comments. To rollback:

1. Search for this comment in the codebase
2. Revert changes or remove marked sections
3. Remove new files listed above

## Next Steps

1. Set your `LOVABLE_API_KEY` in your deployment environment
2. Deploy the edge proxy functions
3. Test the health endpoint
4. Monitor the debug UI for any issues
5. Adjust asset paths in `startup.ts` to match your Lovable CDN structure

