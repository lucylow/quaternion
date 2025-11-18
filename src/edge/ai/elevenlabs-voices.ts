// src/edge/ai/elevenlabs-voices.ts
// Lovable Cloud Edge Function: List ElevenLabs Voices
// Exposes: GET /api/ai/elevenlabs/voices
// Tool: ElevenLabs (Sponsor-tag ready)

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ElevenLabs_API_key;
const PROVIDER_BASE = 'https://api.elevenlabs.io/v1';

// Mock voices data (fallback)
function generateMockVoices(): any {
  return {
    voices: [
      {
        voice_id: '21m00Tcm4TlvDq8ikWAM',
        name: 'Rachel',
        category: 'premade',
        description: 'Calm and confident female voice'
      },
      {
        voice_id: 'VR6AewLTigWG4xSOukaG',
        name: 'Arnold',
        category: 'premade',
        description: 'Deep authoritative male voice'
      },
      {
        voice_id: 'EXAVITQu4vr4xnSDxMaL',
        name: 'Bella',
        category: 'premade',
        description: 'Warm empathetic female voice'
      },
      {
        voice_id: 'ThT5KcBeYPX3keUQqHPh',
        name: 'Dorothy',
        category: 'premade',
        description: 'Analytical robotic female voice'
      }
    ]
  };
}

export async function GET(req: Request) {
  try {
    // Mock mode fallback
    if (process.env.TTS_MOCK === 'true' || !ELEVEN_KEY) {
      return new Response(JSON.stringify(generateMockVoices()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Real ElevenLabs API call
    const resp = await fetch(`${PROVIDER_BASE}/voices`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.warn(`ElevenLabs voices error: ${resp.status} - ${txt}`);
      // Fallback to mock
      return new Response(JSON.stringify(generateMockVoices()), {
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
    console.error('ElevenLabs voices edge error:', err);
    // Graceful fallback
    return new Response(JSON.stringify(generateMockVoices()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

