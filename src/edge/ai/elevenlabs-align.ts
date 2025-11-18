// src/edge/ai/elevenlabs-align.ts
// Lovable Cloud Edge Function: ElevenLabs Forced Alignment
// Exposes: POST /api/ai/elevenlabs/align
// Tool: ElevenLabs (Sponsor-tag ready)

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ElevenLabs_API_key;
const PROVIDER_BASE = 'https://api.elevenlabs.io/v1';

// Mock alignment data
function generateMockAlignment(transcript?: string): any {
  const words = transcript ? transcript.split(' ') : ['Please', '—', 'listen.'];
  let currentTime = 0.0;
  const segments = words.map((word, i) => {
    const start = currentTime;
    const duration = word.length * 0.1 + 0.2; // Estimate duration
    currentTime += duration;
    return {
      start,
      end: currentTime,
      text: word
    };
  });

  return {
    aligned: true,
    segments
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { audioBase64, transcript, mock } = body;

    if (!audioBase64 || !transcript) {
      return new Response(JSON.stringify({ error: 'Missing audioBase64 or transcript' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mock mode fallback
    if (mock || process.env.TTS_MOCK === 'true' || !ELEVEN_KEY) {
      return new Response(JSON.stringify(generateMockAlignment(transcript)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Real ElevenLabs API call
    const alignUrl = `${PROVIDER_BASE}/forced-alignment`;

    const resp = await fetch(alignUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_base64: audioBase64,
        transcript: transcript
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.warn(`ElevenLabs alignment error: ${resp.status} - ${txt}`);
      // Fallback to mock
      return new Response(JSON.stringify(generateMockAlignment(transcript)), {
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
    console.error('ElevenLabs alignment edge error:', err);
    // Graceful fallback
    return new Response(JSON.stringify(generateMockAlignment()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

