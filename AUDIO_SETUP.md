# Audio System Setup Checklist

This document provides a quick checklist for setting up the audio system in your Quaternion game.

## ✅ Files Created

All audio system files have been created:

- ✅ `src/audio/AudioManager.ts` - WebAudio manager
- ✅ `src/audio/MusicManager.ts` - Adaptive music manager
- ✅ `src/audio/ttsClient.ts` - TTS client
- ✅ `src/audio/subtitleGenerator.ts` - WebVTT generator
- ✅ `src/audio/telemetry.ts` - Audio telemetry
- ✅ `src/audio/audioInit.ts` - Initialization helper
- ✅ `src/audio/ttsHelpers.ts` - TTS helper functions
- ✅ `src/audio/index.ts` - Central exports
- ✅ `api/ai/tts.js` - Edge function for TTS
- ✅ Audio initialization integrated into `QuaternionGame.tsx`

## 📋 Setup Steps

### 1. Add Audio Assets

Place your audio files in:
- `public/assets/sfx/` - Sound effects (OGG format recommended)
- `public/assets/music/` - Music stems (OGG format recommended)

Update asset paths in `src/audio/audioInit.ts` to match your files.

### 2. Configure Environment Variables

Add to `.env` or Lovable Cloud secrets:

```bash
# TTS Provider (choose one: elevenlabs, google, or polly)
TTS_PROVIDER=elevenlabs

# ElevenLabs (recommended for games)
ELEVENLABS_API_KEY=your_key_here

# OR Google Cloud TTS
GOOGLE_TTS_KEY=base64_encoded_service_account_json

# OR Amazon Polly
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1

# Mock mode (for local dev without API keys)
TTS_MOCK=true

# API endpoints (optional, defaults to /api)
VITE_EDGE_BASE=/api
VITE_TELEMETRY_ENDPOINT=/api/telemetry
```

### 3. Install Optional Dependencies

For Google Cloud TTS support:

```bash
npm install jsonwebtoken
```

### 4. Test Audio System

1. Start the dev server: `npm run dev`
2. Navigate to the game page
3. Check browser console for audio initialization messages
4. Test TTS with mock mode: Set `TTS_MOCK=true` in `.env`

### 5. Integrate TTS into Game Logic

Example: Add narration to AI decisions

```typescript
import { narrateModelDecision } from '@/audio/ttsHelpers';

// In your AIController or game logic
await narrateModelDecision('AUREN', 'We must move carefully.', 'mara');
```

### 6. Update Music Based on Game State

Example: Update music when moral state changes

```typescript
import MusicManager from '@/audio/MusicManager';

// When player's moral state changes (-1 to +1)
MusicManager.instance().setMoralState(moralValue);
```

## 🎮 Usage Examples

### Play Sound Effect

```typescript
import { playSfx } from '@/audio';

playSfx('ui_click', 0.8);
```

### Narrate AI Decision

```typescript
import { narrateModelDecision } from '@/audio';

await narrateModelDecision('AUREN', 'Unit constructed.', 'mara');
```

### Control Music

```typescript
import MusicManager from '@/audio/MusicManager';

// Set moral state (affects ambient/tension mix)
MusicManager.instance().setMoralState(0.6);

// Direct control
MusicManager.instance().setStemVolumes({
  ambient: 0.8,
  tension: 0.2,
  pulse: 0.5
});
```

### Adjust Volumes

```typescript
import AudioManager from '@/audio/AudioManager';

AudioManager.instance().setMasterVolume(0.8);
AudioManager.instance().setMusicVolume(0.6);
AudioManager.instance().setSfxVolume(1.0);
AudioManager.instance().setVoiceVolume(1.0);
```

## 🐛 Troubleshooting

### Audio not playing
- Check browser console for errors
- Ensure user has interacted with the page (browser requirement)
- Verify audio context state: `AudioManager.instance().getAudioContext().state`

### TTS not working
- Check edge function logs
- Verify API keys are set
- Try mock mode: `TTS_MOCK=true`
- Check network tab for `/api/ai/tts` requests

### Music not loading
- Verify asset paths in `audioInit.ts`
- Check that OGG files exist
- Check browser console for 404 errors

## 📚 Documentation

See `src/audio/README.md` for detailed documentation.

## 🚀 Deployment

### Vercel/Lovable

1. Set environment variables in dashboard
2. Edge function at `api/ai/tts.js` will auto-deploy
3. Ensure audio assets are in `public/assets/`

### Local Development

1. Set `TTS_MOCK=true` for testing without API keys
2. Run `npm run dev`
3. Express server routes `/api/ai/tts` to edge function

## ⚖️ Legal Notes

- If using real-person voice likenesses, obtain written consent
- Verify provider license for competition/commercial use
- Add attribution to Devpost
- Include prompt logs + sample TTS outputs in proof artifacts

