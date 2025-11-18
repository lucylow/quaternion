// src/edge/ai/elevenlabs-isolate.ts
// Lovable Cloud Edge Function: ElevenLabs Audio Isolation
// Exposes: POST /api/ai/elevenlabs/isolate
// Tool: ElevenLabs (Sponsor-tag ready)

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ElevenLabs_API_key;
const PROVIDER_BASE = 'https://api.elevenlabs.io/v1';

// Mock isolation response
function generateMockIsolation(): any {
  return {
    isolated: true,
    note: 'mock isolation produced',
    stems: {
      voice: 'base64_encoded_audio_here',
      music: 'base64_encoded_audio_here'
    }
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { audioBase64, mock } = body;

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: 'Missing audioBase64' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mock mode fallback
    if (mock || process.env.TTS_MOCK === 'true' || !ELEVEN_KEY) {
      return new Response(JSON.stringify(generateMockIsolation()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Real ElevenLabs API call
    const isolateUrl = `${PROVIDER_BASE}/audio-isolation`;
    // Convert base64 to ArrayBuffer
    const binaryString = atob(audioBase64);
    const buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      buffer[i] = binaryString.charCodeAt(i);
    }

    const resp = await fetch(isolateUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/octet-stream'
      },
      body: buffer
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.warn(`ElevenLabs isolation error: ${resp.status} - ${txt}`);
      // Fallback to mock
      return new Response(JSON.stringify(generateMockIsolation()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const json = await resp.json();
    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('ElevenLabs isolation edge error:', err);
    // Graceful fallback
    return new Response(JSON.stringify(generateMockIsolation()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

