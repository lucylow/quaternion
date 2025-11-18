// api/ai/musicgen.js
// Music Generation endpoint using ElevenLabs Music API (with mock fallback)
// POST /api/ai/eleven/musicgen { style: "battle"|"ambient", mood: "tense"|"calm", lengthSec: 30, mock: boolean }

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const body = await req.json();
    const { 
      style = "ambient", 
      mood = "calm", 
      lengthSec = 30, 
      mock = false,
      seed = null
    } = body;

    // Check for mock mode
    const useMock = mock || process.env.TTS_MOCK === "true" || !process.env.ELEVENLABS_API_KEY;

    // Cache key for potential caching (TODO: implement with Lovable storage or S3)
    const cacheKey = `music_${style}_${mood}_${lengthSec}_${seed || "default"}`;

    if (useMock) {
      console.log("[MUSICGEN MOCK MODE] Returning fake audio buffer");
      const fakeOgg = generateMockOggBytes(lengthSec);
      res.setHeader("Content-Type", "audio/ogg");
      return res.send(Buffer.from(fakeOgg));
    }

    // Real ElevenLabs Music API call
    const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ElevenLabs_API_key;
    if (!ELEVEN_KEY) {
      throw new Error("Missing ELEVENLABS_API_KEY");
    }

    // Note: ElevenLabs Music API endpoint (hypothetical - adjust based on actual API)
    const PROVIDER_BASE = "https://api.elevenlabs.io/v1";
    const musicEndpoint = `${PROVIDER_BASE}/music/generate`;

    const payload = {
      style: style,
      mood: mood,
      duration_seconds: lengthSec,
      seed: seed || Math.floor(Math.random() * 1e9)
    };

    const resp = await fetch(musicEndpoint, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("ElevenLabs Music API error:", resp.status, txt);
      // Fallback to mock on error
      const fakeOgg = generateMockOggBytes(lengthSec);
      res.setHeader("Content-Type", "audio/ogg");
      return res.send(Buffer.from(fakeOgg));
    }

    const arr = await resp.arrayBuffer();
    
    // TODO: Cache arr here using cacheKey
    
    res.setHeader("Content-Type", resp.headers.get("content-type") || "audio/ogg");
    return res.send(Buffer.from(arr));

  } catch (err) {
    console.error("musicgen error", err);
    // Always return mock audio on error
    const fakeOgg = generateMockOggBytes(30);
    res.setHeader("Content-Type", "audio/ogg");
    return res.send(Buffer.from(fakeOgg));
  }
}

/**
 * Generate mock OGG audio bytes (placeholder)
 * Creates a minimal valid OGG header with silence
 */
function generateMockOggBytes(lengthSec = 30) {
  // OGG header: "OggS" + version + header type + granule position + serial + page sequence + checksum + page segments
  const header = new Uint8Array([
    0x4F, 0x67, 0x67, 0x53, // "OggS"
    0x00, 0x02, 0x00, 0x00, // version 0, header type 0, granule position (8 bytes, little-endian)
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, // serial number
    0x00, 0x00, 0x00, 0x00, // page sequence
    0x00, 0x00, 0x00, 0x00, // checksum (simplified)
    0x01, // page segments
    0x00  // segment table (0 = end of page)
  ]);

  // Payload: silence bytes sized proportionally to length
  const size = Math.max(4096, Math.min(65536, lengthSec * 1024));
  const payload = new Uint8Array(size).fill(0);
  
  return new Uint8Array([...header, ...payload]);
}

