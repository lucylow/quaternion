# Audio Implementation Guide

This document describes the Howler.js-based audio system for Quaternion, including background music, UI SFX, and AI-generated TTS voices.

## Overview

The audio system consists of:
- **Howler-based AudioManager** (`src/utils/audioManager.ts`) - Central audio manager for SFX, background music, and voice queue
- **TTS Client** (`src/utils/ttsClient.ts`) - Client-side TTS generation with caching
- **Serverless Proxy** (`api/ai/elevenlabs-proxy.js`) - Secure server-side proxy for ElevenLabs API
- **Batch Script** (`src/scripts/batch_generate_tts.js`) - Pre-generate TTS files for demo builds
- **SSML Voice Lines** (`src/voices_to_tts/ssml.json`) - Voice lines for Archive Campaign

## Setup

### 1. Install Dependencies

```bash
npm install howler axios node-fetch form-data --save
npm install -D @types/howler @types/express
```

### 2. Audio File Structure

Place audio files in the following structure:

```
public/
  audio/
    sfx/
      click.ogg
      ui_select.ogg
      confirm.ogg
    music/
      bg_loop.ogg
    voices/
      lian_archive_awaken.ogg
      lian_scan_anomaly.ogg
      ... (other pre-generated TTS files)
```

### 3. Environment Variables

Set the following environment variables:

```bash
# For ElevenLabs TTS
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_API_URL=https://api.elevenlabs.io/v1/text-to-speech  # Optional, defaults to this
```

### 4. Server Configuration

The server automatically serves the ElevenLabs proxy at `/api/ai/elevenlabs-proxy/generate-tts`.

## Usage

### UI Click Sounds

Use the `useClickSFX` hook in React components:

```tsx
import { useClickSFX } from '@/hooks/useClickSFX';

function MyButton() {
  const onClickPlay = useClickSFX('click');
  return <button onClick={onClickPlay}>Click Me</button>;
}
```

### Background Music

Background music is automatically started when the game initializes. To control it manually:

```tsx
import audioManager from '@/utils/audioManager';

// Start background music
audioManager.playBackground('/audio/music/bg_loop.ogg', { volume: 0.5 });

// Stop background music
audioManager.stopBackground();
```

### Text-to-Speech

Generate and play TTS voices:

```tsx
import { generateAndPlayTTS } from '@/utils/ttsClient';

// Generate TTS from text
await generateAndPlayTTS({
  voiceId: 'lian-voice',
  text: 'Warning: energy levels critically low.'
});

// Generate TTS from SSML
await generateAndPlayTTS({
  voiceId: 'mara-voice',
  ssml: '<speak><voice name="Mara">If you wake it wrong, it will consume everything...</voice></speak>'
});
```

### Pre-generated TTS Files

To use pre-generated TTS files (for offline demo):

```tsx
import audioManager from '@/utils/audioManager';

// Queue a pre-generated voice line
audioManager.queueVoice('/audio/voices/lian_archive_awaken.ogg');
```

## Generating TTS Files

### Batch Generation

Run the batch script to generate all TTS files from `ssml.json`:

```bash
# Set the proxy URL (defaults to localhost:3001)
export TTS_PROXY_URL=http://localhost:3001/generate-tts

# Run the batch script
node src/scripts/batch_generate_tts.js
```

This will generate all `.ogg` files in `public/audio/voices/`.

### Manual Generation

You can also generate individual files by calling the proxy endpoint directly:

```bash
curl -X POST http://localhost:3001/generate-tts \
  -H "Content-Type: application/json" \
  -d '{
    "voiceId": "lian-voice",
    "text": "Test message",
    "format": "ogg"
  }' \
  --output test.ogg
```

## Voice IDs

The system uses the following voice IDs (configure these in your ElevenLabs account):

- `lian-voice` - Lian (calm strategist)
- `mara-voice` - Mara (warm, urgent)
- `patch-voice` - Patch (wry drone)

## SSML Examples

### Lian (calm strategist)
```xml
<speak>
  <voice name="Lian" gender="female">
    <prosody rate="0.96" pitch="-1%">
      Warning: energy levels critically low.
      <break time="250ms"/>
      Adjust production immediately.
    </prosody>
  </voice>
</speak>
```

### Mara (warm, urgent)
```xml
<speak>
  <voice name="Mara">
    <prosody rate="1.02">
      We cannot keep harvesting like this.
      <break time="200ms"/>
      There are consequences you cannot ignore.
    </prosody>
  </voice>
</speak>
```

### Patch (wry drone)
```xml
<speak>
  <voice name="Patch">
    <prosody rate="0.9">
      Alarms: loud.
      <break time="120ms"/>
      Morale: quieter than you, commander.
    </prosody>
  </voice>
</speak>
```

## Integration with Phaser

To play SFX when clicking sprites in Phaser:

```typescript
// In your Phaser scene
import audioManager from '../../utils/audioManager';

sprite.on('pointerdown', () => {
  // Play click immediately
  audioManager.playSFX('select');
  
  // Dispatch event to React / engine
  window.dispatchEvent(new CustomEvent('quaternion:pointerdown', {
    detail: { unitId: unit.id }
  }));
});
```

## Caching

The TTS client automatically caches generated audio in localStorage. Cache keys are prefixed with `ql-tts-` and include the voice ID and text hash.

For production, consider:
- Uploading generated audio to blob storage (S3, Cloudflare R2, etc.)
- Serving cached files from CDN
- Using IndexedDB for larger cache storage

## Troubleshooting

### Audio not playing
- Check browser autoplay policies (user interaction required)
- Verify audio files exist in `public/audio/`
- Check browser console for errors

### TTS not working
- Verify `ELEVENLABS_API_KEY` is set
- Check proxy endpoint is accessible
- Review server logs for API errors

### Background music not loading
- Ensure `bg_loop.ogg` exists in `public/audio/music/`
- Check file format (OGG recommended)
- Verify file size (large files may need streaming)

## Notes

- The system gracefully falls back if TTS is unavailable
- Pre-generated files are recommended for demo builds to avoid API costs
- CORS headers are set on the proxy for cross-origin requests
- Blob URLs are cached in localStorage (short-lived, session-based)

