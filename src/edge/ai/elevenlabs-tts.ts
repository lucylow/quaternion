// src/edge/ai/elevenlabs-tts.ts
// Lovable Cloud Edge Function: ElevenLabs Text-to-Speech
// Exposes: POST /api/ai/elevenlabs/tts
// Tool: ElevenLabs (Sponsor-tag ready)

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ElevenLabs_API_key;
const PROVIDER_BASE = 'https://api.elevenlabs.io/v1';

// Mock audio data (silent OGG for fallback)
function generateMockAudio(): Uint8Array {
  // Tiny silent OGG (header-only + silence payload)
  const header = new Uint8Array([
    0x4F, 0x67, 0x67, 0x53, // "OggS"
    0x00, 0x02, 0x00, 0x00, // header junk
    0x00, 0x00, 0x00, 0x00,
  ]);
  const payload = new Uint8Array(4096).fill(0);
  return new Uint8Array([...header, ...payload]);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, voiceId, ssml, model, voice_settings, mock } = body;

    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mock mode fallback (for local dev, hackathons, or when API key missing)
    if (mock || process.env.TTS_MOCK === 'true' || !ELEVEN_KEY) {
      const mockAudio = generateMockAudio();
      return new Response(mockAudio, {
        status: 200,
        headers: { 'Content-Type': 'audio/ogg' }
      });
    }

    // Real ElevenLabs API call
    const voice = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel
    const endpoint = `${PROVIDER_BASE}/text-to-speech/${encodeURIComponent(voice)}/stream`;

    // Default voice settings
    const defaultVoiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    };

    const payload = {
      text,
      model_id: model || (ssml ? 'eleven_multilingual_v2' : 'eleven_turbo_v2'),
      voice_settings: voice_settings || defaultVoiceSettings
    };

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      // Fallback to mock on API error
      console.warn(`ElevenLabs TTS error: ${resp.status} - ${txt}`);
      const mockAudio = generateMockAudio();
      return new Response(mockAudio, {
        status: 200,
        headers: { 'Content-Type': 'audio/ogg' }
      });
    }

    const stream = await resp.arrayBuffer();
    const ct = resp.headers.get('content-type') || 'audio/mpeg';

    return new Response(stream, {
      status: 200,
      headers: { 'Content-Type': ct }
    });

  } catch (err: any) {
    console.error('ElevenLabs TTS edge error:', err);
    // Always return mock audio on error (graceful degradation)
    const mockAudio = generateMockAudio();
    return new Response(mockAudio, {
      status: 200,
      headers: { 'Content-Type': 'audio/ogg' }
    });
  }
}

