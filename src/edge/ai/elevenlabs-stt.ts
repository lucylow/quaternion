// src/edge/ai/elevenlabs-stt.ts
// Lovable Cloud Edge Function: ElevenLabs Speech-to-Text
// Exposes: POST /api/ai/elevenlabs/stt
// Tool: ElevenLabs (Sponsor-tag ready)

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ElevenLabs_API_key;
const PROVIDER_BASE = 'https://api.elevenlabs.io/v1';

// Mock transcription response
function generateMockTranscription(): any {
  return {
    text: 'Transcription (mock): we preserved it.',
    segments: [
      { start: 0.0, end: 2.0, text: 'Transcription (mock): we preserved it.' }
    ]
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
      return new Response(JSON.stringify(generateMockTranscription()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Real ElevenLabs API call
    const sttUrl = `${PROVIDER_BASE}/speech-to-text`;
    // Convert base64 to ArrayBuffer
    const binaryString = atob(audioBase64);
    const buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      buffer[i] = binaryString.charCodeAt(i);
    }

    const resp = await fetch(sttUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'audio/mpeg'
      },
      body: buffer
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.warn(`ElevenLabs STT error: ${resp.status} - ${txt}`);
      // Fallback to mock
      return new Response(JSON.stringify(generateMockTranscription()), {
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
    console.error('ElevenLabs STT edge error:', err);
    // Graceful fallback
    return new Response(JSON.stringify(generateMockTranscription()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

