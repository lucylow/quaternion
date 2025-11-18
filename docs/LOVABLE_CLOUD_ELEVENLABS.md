# Lovable Cloud: ElevenLabs Edge Functions

## Overview

This document describes the ElevenLabs integration for Lovable Cloud using Edge Functions. All functions include comprehensive mock data fallbacks for graceful degradation.

## Edge Functions Created

All edge functions are located in `src/edge/ai/`:

### 1. `elevenlabs-tts.ts` - Text-to-Speech
- **Endpoint**: `POST /api/ai/elevenlabs/tts`
- **Tool**: **ElevenLabs** (Sponsor-tag ready)
- **Fallback**: Silent OGG audio on error or mock mode

### 2. `elevenlabs-stt.ts` - Speech-to-Text
- **Endpoint**: `POST /api/ai/elevenlabs/stt`
- **Tool**: **ElevenLabs** (Sponsor-tag ready)
- **Fallback**: Mock transcription on error or mock mode

### 3. `elevenlabs-voices.ts` - List Voices
- **Endpoint**: `GET /api/ai/elevenlabs/voices`
- **Tool**: **ElevenLabs** (Sponsor-tag ready)
- **Fallback**: Mock voice list on error or mock mode

### 4. `elevenlabs-voiceconv.ts` - Voice Conversion
- **Endpoint**: `POST /api/ai/elevenlabs/voiceconv`
- **Tool**: **ElevenLabs** (Sponsor-tag ready)
- **Fallback**: Silent OGG audio on error or mock mode

### 5. `elevenlabs-align.ts` - Forced Alignment
- **Endpoint**: `POST /api/ai/elevenlabs/align`
- **Tool**: **ElevenLabs** (Sponsor-tag ready)
- **Fallback**: Estimated word timestamps on error or mock mode

### 6. `elevenlabs-isolate.ts` - Audio Isolation
- **Endpoint**: `POST /api/ai/elevenlabs/isolate`
- **Tool**: **ElevenLabs** (Sponsor-tag ready)
- **Fallback**: Mock isolation result on error or mock mode

## Environment Variables

Set these in **Lovable Cloud Secrets**:

```bash
# Required for production
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional: Enable mock mode (for local dev or demos)
TTS_MOCK=false
```

## Mock Mode Fallbacks

All functions automatically fall back to mock data when:
- `TTS_MOCK=true` is set in environment
- `mock: true` is passed in request body
- `ELEVENLABS_API_KEY` is missing
- API call fails with an error

This ensures graceful degradation and allows:
- Local development without API costs
- Hackathon demos without API access
- Testing without network connectivity
- Reducing API usage during development

## Recommended AI Tools Stack

The following tools are integrated or recommended for Quaternion:

| Function | Tool | Sponsor-tag ready | Status |
|----------|------|-------------------|--------|
| **Voice lines for advisors** | **ElevenLabs** | ✅ Yes | ✅ Integrated |
| Art / textures / concept images | **ImagineArt**, **Dreamina** | ✅ Yes | 🔄 Pending |
| Music / soundscape | **Fuser** or **Magnific** | ✅ Yes | 🔄 Pending |
| Cutscene / cinematic | **LTX Studio** | ✅ Yes | 🔄 Pending |
| 3D terrain / AI unit design | **Luma AI** + **Hailuo** | ✅ Yes | 🔄 Pending |
| Upscaling / style blend | **Mago Studio**, **ArtCraft** | ✅ Yes | 🔄 Pending |
| Narrative generation | **Google AI Studio** | ✅ Yes | ✅ Integrated |

## Usage Examples

### Text-to-Speech

```typescript
// Frontend
import { ttsSpeak } from '@/audio/elevenClient';

const audioBuffer = await ttsSpeak({
  text: 'Deploy nodes. Build fast.',
  voiceId: 'VR6AewLTigWG4xSOukaG', // Arnold
  voice_settings: {
    stability: 0.7,
    similarity_boost: 0.8,
    style: 0.3
  }
});

// Play with AudioManager
const audioManager = AudioManager.instance();
await audioManager.playTtsArrayBuffer(audioBuffer);
```

### Speech-to-Text

```typescript
import { transcribeBlob } from '@/audio/elevenClient';

const result = await transcribeBlob(audioBlob);
console.log('Transcription:', result.text);
```

### List Voices

```typescript
import { listVoices } from '@/audio/elevenClient';

const { voices } = await listVoices();
console.log('Available voices:', voices);
```

## Deployment to Lovable Cloud

1. **Set Environment Variables**:
   - Go to Lovable Cloud dashboard
   - Navigate to Secrets/Environment Variables
   - Add `ELEVENLABS_API_KEY` with your ElevenLabs API key
   - Optionally set `TTS_MOCK=false` for production

2. **Deploy Edge Functions**:
   - Push code to your repository
   - Lovable Cloud automatically deploys edge functions from `src/edge/`
   - Functions are accessible at `/api/ai/elevenlabs/*`

3. **Verify Deployment**:
   ```bash
   curl https://your-app.lovable.app/api/ai/elevenlabs/voices
   ```

## Error Handling

All functions include comprehensive error handling:
- **API errors**: Fallback to mock data
- **Missing API key**: Fallback to mock data
- **Network errors**: Fallback to mock data
- **Invalid requests**: Return 400 with error message

## Security

- ✅ **API key never exposed** - Stored server-side only
- ✅ **All requests validated** - Input sanitization
- ✅ **Error messages sanitized** - No API key leaks
- ✅ **CORS handled** - Proper headers set

## Sponsor Tag Compliance

All edge functions are marked with:
- **Tool**: ElevenLabs (sponsor-tag ready)
- Proper attribution in code comments
- Ready for Chroma Awards compliance

## Next Steps

1. ✅ **ElevenLabs** - Voice lines integrated
2. 🔄 **ImagineArt/Dreamina** - Art generation integration
3. 🔄 **Fuser/Magnific** - Music generation integration
4. 🔄 **LTX Studio** - Cinematic integration
5. 🔄 **Luma AI/Hailuo** - 3D asset generation
6. 🔄 **Mago Studio/ArtCraft** - Upscaling integration
7. ✅ **Google AI Studio** - Narrative generation integrated

