# ElevenLabs Integration Usage Guide

This guide shows how to use the comprehensive ElevenLabs integration in Quaternion.

## Setup

### Environment Variables

Set these in Lovable Cloud secrets or `.env`:

```bash
# ElevenLabs API Key (required)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional: Mock mode for local dev (avoids API costs)
TTS_MOCK=false

# Optional: Custom voice IDs (can also use defaults)
VITE_ELEVENLABS_VOICE_AUREN=VR6AewLTigWG4xSOukaG
VITE_ELEVENLABS_VOICE_VIREL=21m00Tcm4TlvDq8ikWAM
VITE_ELEVENLABS_VOICE_LIRA=EXAVITQu4vr4xnSDxMaL
VITE_ELEVENLABS_VOICE_KOR=ThT5KcBeYPX3keUQqHPh
VITE_ELEVENLABS_VOICE_CORE=VR6AewLTigWG4xSOukaG
```

## Basic Usage Examples

### 1. Text-to-Speech (TTS)

Generate speech from text and play it with AudioManager:

```typescript
import { ttsSpeak } from '@/audio/elevenClient';
import AudioManager from '@/audio/AudioManager';

async function narrate(text: string, voiceId: string = '21m00Tcm4TlvDq8ikWAM') {
  try {
    // Generate speech
    const audioBuffer = await ttsSpeak({
      text,
      voiceId,
      model: 'eleven_turbo_v2', // Fast model
      voice_settings: {
        stability: 0.7,
        similarity_boost: 0.8,
        style: 0.5,
        use_speaker_boost: true
      }
    });
    
    // Play with AudioManager
    const audioManager = AudioManager.instance();
    await audioManager.playTtsArrayBuffer(audioBuffer, {
      volume: 1.0,
      duckMusic: true // Lower music volume during speech
    });
  } catch (error) {
    console.error('TTS failed:', error);
    // Fallback to pre-recorded audio or show subtitle only
  }
}

// Usage
await narrate('Deploy nodes. Build fast. Perfection favors the prepared.', 'VR6AewLTigWG4xSOukaG');
```

### 2. Speech-to-Text (STT) - Transcription

Transcribe audio from a Blob or ArrayBuffer:

```typescript
import { transcribeBlob, transcribeAudioBase64 } from '@/audio/elevenClient';

// From Blob (e.g., from microphone or file upload)
async function transcribeFromBlob(blob: Blob) {
  try {
    const result = await transcribeBlob(blob);
    console.log('Transcription:', result.text);
    return result.text;
  } catch (error) {
    console.error('Transcription failed:', error);
    return null;
  }
}

// From base64 string
async function transcribeFromBase64(base64: string) {
  try {
    const result = await transcribeAudioBase64(base64);
    return result.text;
  } catch (error) {
    console.error('Transcription failed:', error);
    return null;
  }
}
```

### 3. Voice Conversion

Convert voice in audio to a different voice:

```typescript
import { voiceConvertBlob, voiceConvertBase64 } from '@/audio/elevenClient';

async function convertVoice(blob: Blob, targetVoiceId: string) {
  try {
    const convertedBuffer = await voiceConvertBlob(blob, targetVoiceId, {
      stability: 0.6,
      similarity_boost: 0.75,
      style: 0.4
    });
    
    // Play converted audio
    const audioManager = AudioManager.instance();
    await audioManager.playTtsArrayBuffer(convertedBuffer, {
      volume: 1.0
    });
  } catch (error) {
    console.error('Voice conversion failed:', error);
  }
}
```

### 4. List Available Voices

Get list of available ElevenLabs voices:

```typescript
import { listVoices } from '@/audio/elevenClient';

async function getAvailableVoices() {
  try {
    const result = await listVoices();
    console.log('Available voices:', result.voices);
    
    // Find a specific voice
    const aurenVoice = result.voices.find(v => v.name.includes('Arnold'));
    if (aurenVoice) {
      console.log('Auren voice ID:', aurenVoice.voice_id);
    }
  } catch (error) {
    console.error('Failed to list voices:', error);
  }
}
```

### 5. Audio Isolation (Stem Separation)

Isolate voice or music from audio:

```typescript
import { isolateAudioBlob } from '@/audio/elevenClient';

async function isolateVoice(blob: Blob) {
  try {
    const result = await isolateAudioBlob(blob);
    console.log('Isolation result:', result);
    // Result may contain isolated audio URLs or base64 data
  } catch (error) {
    console.error('Isolation failed:', error);
  }
}
```

### 6. Forced Alignment (Word Timestamps)

Get word-level timestamps for audio and transcript:

```typescript
import { forcedAlignment, blobToBase64 } from '@/audio/elevenClient';

async function alignAudio(audioBlob: Blob, transcript: string) {
  try {
    const audioBase64 = await blobToBase64(audioBlob);
    const result = await forcedAlignment({
      audioBase64,
      transcript
    });
    
    console.log('Aligned segments:', result.segments);
    // result.segments = [
    //   { start: 0.0, end: 0.5, text: 'Deploy' },
    //   { start: 0.5, end: 1.0, text: 'nodes.' },
    //   ...
    // ]
  } catch (error) {
    console.error('Alignment failed:', error);
  }
}
```

## Integration with AdvisorDialogSystem

The `AdvisorDialogSystem` automatically uses ElevenLabs for advisor voice lines. You can also use the client directly:

```typescript
import { ttsSpeak } from '@/audio/elevenClient';
import { AdvisorDialogSystem } from '@/audio/AdvisorDialogSystem';

// Create advisor dialog system
const dialogSystem = new AdvisorDialogSystem({
  enableTTS: true,
  enableSubtitles: true,
  voiceDucking: true,
  cacheAudio: true
});

// Play dialog for event
await dialogSystem.playDialogForEvent('game_start', 'Auren');

// Get voice config for advisor
const aurenConfig = dialogSystem.getAdvisorVoiceConfig('Auren');
console.log('Auren voice ID:', aurenConfig?.voiceId);

// Update voice settings dynamically
dialogSystem.updateAdvisorVoiceSettings('Auren', {
  stability: 0.8,
  style: 0.4
});
```

## Advanced Usage

### Custom Voice Settings per Emotion

Adjust voice settings based on dialog emotion:

```typescript
import { ttsSpeak, ElevenLabsVoiceSettings } from '@/audio/elevenClient';

function getVoiceSettingsForEmotion(emotion: number): ElevenLabsVoiceSettings {
  // emotion: -1 (negative) to +1 (positive)
  const baseStyle = 0.5;
  const styleOffset = emotion * 0.3; // Adjust style based on emotion
  
  return {
    stability: 0.7,
    similarity_boost: 0.8,
    style: Math.max(0, Math.min(1, baseStyle + styleOffset)),
    use_speaker_boost: true
  };
}

async function speakWithEmotion(text: string, voiceId: string, emotion: number) {
  const settings = getVoiceSettingsForEmotion(emotion);
  const audioBuffer = await ttsSpeak({
    text,
    voiceId,
    voice_settings: settings
  });
  
  // Play audio...
}
```

### Batch TTS Generation

Pre-generate multiple voice lines:

```typescript
import { ttsSpeak } from '@/audio/elevenClient';

async function pregenerateVoiceLines(lines: Array<{ text: string; voiceId: string; id: string }>) {
  const cache = new Map<string, ArrayBuffer>();
  
  for (const line of lines) {
    try {
      const audioBuffer = await ttsSpeak({
        text: line.text,
        voiceId: line.voiceId
      });
      cache.set(line.id, audioBuffer);
      console.log(`Generated: ${line.id}`);
    } catch (error) {
      console.error(`Failed to generate ${line.id}:`, error);
    }
  }
  
  return cache;
}
```

## Error Handling

Always handle errors gracefully with fallbacks:

```typescript
import { ttsSpeak } from '@/audio/elevenClient';
import AudioManager from '@/audio/AudioManager';

async function safeNarrate(text: string, voiceId: string) {
  try {
    const audioBuffer = await ttsSpeak({ text, voiceId });
    const audioManager = AudioManager.instance();
    await audioManager.playTtsArrayBuffer(audioBuffer);
  } catch (error) {
    console.warn('TTS failed, using fallback:', error);
    
    // Fallback options:
    // 1. Show subtitle only
    // 2. Use pre-recorded audio
    // 3. Use browser TTS as last resort
    showSubtitle(text);
    
    // Or use browser TTS fallback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }
}
```

## Telemetry & Caching

### Server-Side Caching

Cache TTS outputs server-side to save API costs:

```javascript
// In api/ai/elevenlabs.js (edge function)
import crypto from 'crypto';

function getCacheKey(text, voiceId, settings) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify({ text, voiceId, settings }));
  return hash.digest('hex');
}

// Check cache before API call
// Store in Lovable object storage or S3
```

### Telemetry Logging

Log TTS usage for analytics:

```typescript
import { ttsSpeak } from '@/audio/elevenClient';

async function narrateWithTelemetry(text: string, voiceId: string) {
  const startTime = Date.now();
  
  try {
    const audioBuffer = await ttsSpeak({ text, voiceId });
    const duration = Date.now() - startTime;
    
    // Log telemetry
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'tts_generated',
        payload: {
          textLength: text.length,
          voiceId,
          durationMs: duration,
          audioSizeBytes: audioBuffer.byteLength
        }
      })
    });
    
    return audioBuffer;
  } catch (error) {
    // Log error
    await fetch('/api/telemetry', {
      method: 'POST',
      body: JSON.stringify({
        eventType: 'tts_error',
        payload: { error: error.message, voiceId }
      })
    });
    throw error;
  }
}
```

## Security Notes

- ✅ **API key is server-side only** - Never exposed to client
- ✅ **All requests go through Edge function** - Validates and proxies requests
- ✅ **Mock mode available** - For local dev without API costs
- ✅ **Error handling** - Prevents API key leaks in error messages

## References

- [ElevenLabs API Documentation](https://docs.elevenlabs.io/)
- [Text-to-Speech Streaming](https://docs.elevenlabs.io/api-reference/text-to-speech-stream)
- [Speech-to-Text (Scribe)](https://docs.elevenlabs.io/api-reference/speech-to-text)
- [Voice Conversion](https://docs.elevenlabs.io/api-reference/speech-to-speech)
- [Forced Alignment](https://docs.elevenlabs.io/api-reference/forced-alignment)

## Mock Mode

Enable mock mode for local development or demos:

```bash
# In .env or Lovable secrets
TTS_MOCK=true
```

When enabled, TTS endpoints return silent audio instead of making API calls. This is useful for:
- Local development without API costs
- Hackathon demos
- Testing without network access
- Reducing API usage during development

