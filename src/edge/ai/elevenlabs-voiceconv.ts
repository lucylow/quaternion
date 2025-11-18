// src/edge/ai/elevenlabs-voiceconv.ts
// Lovable Cloud Edge Function: ElevenLabs Voice Conversion
// Exposes: POST /api/ai/elevenlabs/voiceconv
// Tool: ElevenLabs (Sponsor-tag ready)

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ElevenLabs_API_key;
const PROVIDER_BASE = 'https://api.elevenlabs.io/v1';

// Mock audio data
function generateMockAudio(): Uint8Array {
  const header = new Uint8Array([0x4F, 0x67, 0x67, 0x53, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const payload = new Uint8Array(4096).fill(0);
  return new Uint8Array([...header, ...payload]);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { audioBase64, targetVoiceId, style, mock } = body;

    if (!audioBase64 || !targetVoiceId) {
      return new Response(JSON.stringify({ error: 'Missing audioBase64 or targetVoiceId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mock mode fallback
    if (mock || process.env.TTS_MOCK === 'true' || !ELEVEN_KEY) {
      const mockAudio = generateMockAudio();
      return new Response(mockAudio, {
        status: 200,
        headers: { 'Content-Type': 'audio/ogg' }
      });
    }

    // Real ElevenLabs API call
    const convUrl = `${PROVIDER_BASE}/speech-to-speech/${encodeURIComponent(targetVoiceId)}`;
    
    const payload = {
      audio: audioBase64,
      voice_settings: style || {}
    };

    const resp = await fetch(convUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.warn(`ElevenLabs voice conversion error: ${resp.status} - ${txt}`);
      // Fallback to mock
      const mockAudio = generateMockAudio();
      return new Response(mockAudio, {
        status: 200,
        headers: { 'Content-Type': 'audio/ogg' }
      });
    }

    const arr = await resp.arrayBuffer();
    const ct = resp.headers.get('content-type') || 'audio/ogg';

    return new Response(arr, {
      status: 200,
      headers: { 'Content-Type': ct }
    });

  } catch (err: any) {
    console.error('ElevenLabs voice conversion edge error:', err);
    // Graceful fallback
    const mockAudio = generateMockAudio();
    return new Response(mockAudio, {
      status: 200,
      headers: { 'Content-Type': 'audio/ogg' }
    });
  }
}

