# Audio Studio — Fuser Mode

A complete, drop-in Audio Studio feature for the Quaternion game with full mock data support for offline demos.

## Features

✅ **Real-time TTS Generation** - Generate narration for Lian, Mara, and Patch NPCs  
✅ **Voice Conversion** - Upload your voice and have it performed by NPC voice presets  
✅ **Music Generation** - Generate adaptive music loops (battle/ambient, tense/calm)  
✅ **SFX Generation** - Generate sound effects on-the-fly  
✅ **Mock Mode** - Fully functional offline demo with placeholder audio  
✅ **SSML Support** - Rich SSML packs for each NPC with personality-driven prosody  
✅ **Voice Presets** - Personality vectors and voice style configurations  

## Files Created

### Components
- `src/components/AudioStudio.tsx` - Main React component with full UI

### Audio System
- `src/audio/AudioManager.ts` - Added `playTtsArrayBuffer()` method
- `src/audio/AudioEngine.ts` - Added `playTtsArrayBuffer()` implementation
- `src/audio/elevenClient.ts` - Updated with mock mode support
- `src/audio/voice_presets.json` - Voice personality configurations

### SSML Packs
- `assets/ssml/lian_1.ssml` - Lian tactical line 1
- `assets/ssml/lian_2.ssml` - Lian tactical line 2
- `assets/ssml/mara_1.ssml` - Mara empathetic line 1
- `assets/ssml/mara_2.ssml` - Mara empathetic line 2
- `assets/ssml/patch_1.ssml` - Patch analytical line 1
- `assets/ssml/patch_2.ssml` - Patch analytical line 2

### API Endpoints
- `api/ai/musicgen.js` - Music generation edge function with mock support
- `server.js` - Added `/api/ai/musicgen` route

### Scripts
- `batch_generate_tts.js` - Batch script to generate TTS from SSML files

## Usage

### 1. Add AudioStudio to Your App

```tsx
import AudioStudio from '@/components/AudioStudio';

function MyApp() {
  return (
    <div>
      <AudioStudio />
    </div>
  );
}
```

### 2. Mock Mode (Default)

The Audio Studio automatically runs in mock mode when:
- `VITE_TTS_MOCK=true` is set, OR
- No `VITE_ELEVENLABS_API_KEY` is configured

In mock mode:
- All TTS requests return placeholder OGG audio
- Voice listing returns mock NPC voices
- Music generation returns placeholder loops
- Everything works offline for demos

### 3. Live Mode

To use real ElevenLabs API:
1. Set `VITE_ELEVENLABS_API_KEY` in your `.env`
2. Set `VITE_TTS_MOCK=false` (or omit it)
3. Ensure your edge functions are deployed

### 4. Batch TTS Generation

Generate all SSML files to audio:

```bash
# Set environment variables
export EDGE_BASE=http://localhost:8787  # or your deployed edge URL
export TTS_MOCK=true  # or false for real API

# Run batch script
node batch_generate_tts.js
```

Output files will be saved to `assets/audio_out/*.ogg`

## Voice Presets

Each NPC has a personality vector and SSML hints:

### Lian (Tactical Commander)
- **Personality**: High aggression (0.6), Low empathy (0.2)
- **Voice**: Lower pitch, slower rate (0.95)
- **Example**: "Hold the chokepoint — buy us time."

### Mara (Empathetic Advisor)
- **Personality**: Low aggression (0.1), High empathy (0.9)
- **Voice**: Normal pitch, slower rate (0.92)
- **Example**: "Please — listen. It remembers more than we do."

### Patch (Analytical AI)
- **Personality**: No aggression (0.0), High dry humor (0.9)
- **Voice**: Faster rate (1.08)
- **Example**: "Alarms: loud. Morale: quieter than you, commander."

## API Endpoints

### TTS Generation
```
POST /api/ai/elevenlabs/tts
Body: { text: string, voiceId: string, ssml: boolean, mock: boolean }
Returns: audio/ogg ArrayBuffer
```

### Music Generation
```
POST /api/ai/musicgen
Body: { style: "battle"|"ambient", mood: "tense"|"calm", lengthSec: number, mock: boolean }
Returns: audio/ogg ArrayBuffer
```

### Voice Conversion
```
POST /api/ai/elevenlabs/voiceconv
Body: { audioBase64: string, targetVoiceId: string }
Returns: audio/ogg ArrayBuffer
```

## Demo Script for Judges

1. **Open Audio Studio** - Navigate to the Audio Studio component
2. **Generate Narration** - Click "Generate Narration" → hear Mara's line (mock TTS)
3. **Upload Voice** - Upload a 1-2 second audio file → click "Convert" → hear your voice as Mara
4. **Generate Music** - Click "Generate Music (Battle)" → see music track appear
5. **Show Telemetry** - Display promptHash, modelVersion, durationMs in Inspector panel
6. **Explain Mock Mode** - Show that everything works offline with placeholder audio

## Integration Checklist

- [x] AudioStudio component created
- [x] playTtsArrayBuffer method added to AudioManager
- [x] SSML packs created for all 3 NPCs
- [x] Voice presets JSON created
- [x] Music generation edge function created
- [x] elevenClient updated with mock support
- [x] Batch TTS script created
- [x] Server routes configured
- [x] Mock mode fully functional

## Notes

- All mock audio uses minimal OGG headers with silence payloads
- Mock mode is automatically enabled when no API key is present
- Real API calls fall back to mock on error
- SSML files can be edited to adjust prosody and emphasis
- Voice presets can be extended with more personality traits

## Next Steps

1. **Replace Mock Audio**: Run batch script with real API to generate actual TTS
2. **Add More SSML Lines**: Create additional SSML files for more dialogue
3. **Extend Voice Presets**: Add more NPCs or adjust personality vectors
4. **Implement Caching**: Add persistent storage for generated audio (S3/Lovable storage)
5. **Add Export Features**: Implement WAV/OGG export and asset saving

---

**Powered by Lovable Edge + ElevenLabs • Mock Mode available**

