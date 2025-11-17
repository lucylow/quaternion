# Audio System Documentation

This directory contains a complete audio system for the Quaternion game, including:

- **AudioManager**: WebAudio manager for SFX, TTS, ducking, and preloading
- **MusicManager**: Adaptive multi-stem music manager with crossfades
- **TTS Client**: Client for requesting TTS audio from edge functions
- **Subtitle Generator**: WebVTT generation from dialogue entries
- **Telemetry**: Audio event logging for analytics

## Quick Start

### 1. Initialize Audio

Audio is automatically initialized when the game starts. For manual initialization:

```typescript
import { initializeAudio } from '@/audio/audioInit';

await initializeAudio();
```

### 2. Play Sound Effects

```typescript
import { playSfx } from '@/audio/ttsHelpers';

playSfx('ui_click', 0.8); // Play UI click at 80% volume
playSfx('boom', 1.0); // Play explosion at full volume
```

### 3. Play TTS Narration

```typescript
import { narrateModelDecision } from '@/audio/ttsHelpers';

await narrateModelDecision('AUREN', 'We must move carefully.', 'mara', true);
```

### 4. Control Music

```typescript
import MusicManager from '@/audio/MusicManager';

// Set moral state (-1 exploit to +1 conserve)
MusicManager.instance().setMoralState(0.6);

// Directly control stem volumes
MusicManager.instance().setStemVolumes({
  ambient: 0.8,
  tension: 0.2,
  pulse: 0.5
});
```

### 5. Adjust Volumes

```typescript
import AudioManager from '@/audio/AudioManager';

AudioManager.instance().setMasterVolume(0.8);
AudioManager.instance().setMusicVolume(0.6);
AudioManager.instance().setSfxVolume(1.0);
AudioManager.instance().setVoiceVolume(1.0);
```

## Configuration

### Environment Variables

Add these to your `.env` file or Lovable Cloud secrets:

```
# TTS Provider (elevenlabs, google, or polly)
TTS_PROVIDER=elevenlabs

# ElevenLabs API Key
ELEVENLABS_API_KEY=your_key_here

# Google Cloud TTS (base64-encoded service account JSON)
GOOGLE_TTS_KEY=base64_encoded_json

# AWS Polly
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1

# Mock mode (for local dev without API keys)
TTS_MOCK=true

# API Base URL
VITE_EDGE_BASE=/api
VITE_API_BASE=/api

# Telemetry endpoint
VITE_TELEMETRY_ENDPOINT=/api/telemetry
```

### Asset Paths

Place audio assets in `public/assets/`:

- SFX: `public/assets/sfx/*.ogg`
- Music: `public/assets/music/*.ogg`

Update paths in `src/audio/audioInit.ts` to match your assets.

## Edge Function Setup

The TTS edge function is located at `api/ai/tts.js`. For Vercel deployment:

1. The function will automatically be deployed as an edge function
2. Set environment variables in Vercel dashboard
3. For local dev, the Express server routes `/api/ai/tts` to the edge function

## Integration Examples

### In AIController

```typescript
import { narrateModelDecision } from '@/audio/ttsHelpers';

async function decide() {
  const decision = await makeDecision();
  
  // Narrate the decision
  if (decision.narration) {
    await narrateModelDecision(this.agentId, decision.narration, 'mara');
  }
  
  return decision;
}
```

### On Moral State Change

```typescript
import MusicManager from '@/audio/MusicManager';
import AudioManager from '@/audio/AudioManager';

function onMoralStateChange(moralValue: number) {
  // Update music based on moral state (-1 to +1)
  MusicManager.instance().setMoralState(moralValue);
  
  // Adjust SFX volume based on moral state
  AudioManager.instance().setSfxVolume(moralValue < 0 ? 1.0 : 0.8);
}
```

### Generate Subtitles

```typescript
import { dialogueLinesToWebVTT } from '@/audio/subtitleGenerator';

const dialogue = [
  { start: 0, end: 2000, speaker: 'Mara', text: 'We must move carefully.' },
  { start: 2500, end: 5000, speaker: 'Mara', text: 'If you wake it wrong, it will consume everything.' }
];

const vtt = dialogueLinesToWebVTT(dialogue);
// Use vtt with video player or export
```

## Browser Audio Policy

Modern browsers require user interaction before audio can play. The audio system handles this automatically, but you may want to add a "Click to Start" button for better UX:

```typescript
function handleUserClick() {
  // Resume audio context (required by browsers)
  AudioManager.instance().getAudioContext().resume();
  // Start game
}
```

## Telemetry

Audio events are automatically logged to your telemetry endpoint:

- `tts_play`: TTS narration started
- `sfx_play`: Sound effect played
- `music_change`: Music state changed
- `duck_start`: Music ducking started
- `duck_end`: Music ducking ended

## Troubleshooting

### Audio not playing
- Check browser console for errors
- Ensure user interaction has occurred (browser requirement)
- Verify audio context is not suspended: `AudioManager.instance().getAudioContext().state`

### TTS not working
- Check edge function logs
- Verify API keys are set correctly
- Try mock mode: `TTS_MOCK=true`
- Check network tab for `/api/ai/tts` requests

### Music not loading
- Verify asset paths in `audioInit.ts`
- Check that OGG files exist in `public/assets/music/`
- Check browser console for 404 errors

## Legal Notes

- If using real-person voice likenesses (even TTS clones), obtain written consent
- Verify provider license about competition/commercial use
- Add attribution to Devpost
- Include prompt logs + sample raw TTS outputs in proof artifacts

