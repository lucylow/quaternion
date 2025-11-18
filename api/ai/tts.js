// api/ai/tts.js
// Fully compatible with Lovable Edge Runtime (Node 18) and Vercel Edge Functions

export default async function handler(req, res) {
  try {
    const body = await req.json();
    const { 
      text, 
      voice = 'default', 
      ssml = false, 
      mock = false,
      voice_settings = {} // ElevenLabs voice settings
    } = body;

    if (!text) return res.status(400).json({ error: "Missing text" });

    // If mock mode enabled → return 1-second OGG silence for instant local dev
    if (mock || process.env.TTS_MOCK === "true") {
      console.log("[TTS MOCK MODE] Returning fake audio buffer");
      const fakeOgg = generateFakeOggBytes();
      res.setHeader("Content-Type", "audio/ogg");
      return res.send(Buffer.from(fakeOgg));
    }

    // Choose provider from environment (default: elevenlabs)
    const provider = (process.env.TTS_PROVIDER || "elevenlabs").toLowerCase();

    let audioBuf;
    if (provider === "elevenlabs") audioBuf = await elevenLabsTTS(text, voice, ssml, voice_settings);
    else if (provider === "google") audioBuf = await googleCloudTTS(text, voice, ssml);
    else if (provider === "polly") audioBuf = await amazonPollyTTS(text, voice, ssml);
    else throw new Error("Unknown provider: " + provider);

    res.setHeader("Content-Type", "audio/ogg");
    return res.send(Buffer.from(audioBuf));
  } catch (err) {
    console.error("TTS handler error", err);
    return res.status(500).json({ error: err.message });
  }
}

/* ----------------------------------------------------------
   MOCK OGG GENERATOR (FAKE AUDIO FOR FAST LOCAL DEVELOPMENT)
----------------------------------------------------------- */
function generateFakeOggBytes() {
  // Tiny silent OGG (header-only + silence payload)
  const header = new Uint8Array([
    0x4F,0x67,0x67,0x53, // "OggS"
    0x00,0x02,0x00,0x00, // header junk
    0x00,0x00,0x00,0x00,
  ]);
  const payload = new Uint8Array(2048).fill(0);
  return new Uint8Array([...header, ...payload]);
}

/* ----------------------------------------------------------
   ELEVENLABS SPEECH
----------------------------------------------------------- */
async function elevenLabsTTS(text, voice, ssml, voiceSettings = {}) {
  const key = process.env.ELEVENLABS_API_KEY || process.env.ElevenLabs_API_key;
  if (!key) throw new Error("Missing ELEVENLABS_API_KEY");

  const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream`;

  // Default voice settings (can be overridden)
  const defaultVoiceSettings = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true
  };

  // Merge provided settings with defaults
  const finalVoiceSettings = {
    ...defaultVoiceSettings,
    ...voiceSettings
  };

  const payload = {
    text,
    model_id: ssml ? "eleven_multilingual_v2" : "eleven_turbo_v2",
    voice_settings: finalVoiceSettings
  };

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg"
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const errTxt = await resp.text();
    throw new Error("ElevenLabs error: " + errTxt);
  }

  return await resp.arrayBuffer();
}

/* ----------------------------------------------------------
   GOOGLE CLOUD TTS
----------------------------------------------------------- */
async function googleCloudTTS(text, voice, ssml) {
  const base64 = process.env.GOOGLE_TTS_KEY;
  if (!base64) throw new Error("Missing GOOGLE_TTS_KEY");

  // Note: For edge functions, JWT signing requires a library
  // This is a simplified version - for production, use a pre-generated token
  // or implement JWT signing with crypto (more complex)
  try {
    // Try to use jsonwebtoken if available
    const jwt = require("jsonwebtoken");
    const json = JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
    const clientEmail = json.client_email;
    const privateKey = json.private_key;

    const token = jwt.sign(
      { scope: "https://www.googleapis.com/auth/cloud-platform" },
      privateKey,
      {
        algorithm: "RS256",
        expiresIn: "1h",
        issuer: clientEmail,
        audience: "https://oauth2.googleapis.com/token"
      }
    );

    const ttsEndpoint = `https://texttospeech.googleapis.com/v1/text:synthesize`;

    const payload = {
      input: ssml ? { ssml: text } : { text },
      voice: {
        languageCode: "en-US",
        name: "en-US-Neural2-C"
      },
      audioConfig: {
        audioEncoding: "OGG_OPUS",
        pitch: 0,
        speakingRate: 1.0
      }
    };

    const resp = await fetch(ttsEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errTxt = await resp.text();
      throw new Error("Google TTS error: " + errTxt);
    }

    const data = await resp.json();
    return Buffer.from(data.audioContent, "base64");
  } catch (error) {
    if (error.message.includes("require")) {
      throw new Error("Google TTS requires jsonwebtoken package. Install with: npm install jsonwebtoken");
    }
    throw error;
  }
}

/* ----------------------------------------------------------
   AMAZON POLLY
----------------------------------------------------------- */
async function amazonPollyTTS(text, voice) {
  const crypto = require("crypto");
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "us-east-1";

  if (!accessKey || !secretKey)
    throw new Error("Missing AWS credentials");

  const endpoint = `https://polly.${region}.amazonaws.com/v1/speech`;

  const payload = JSON.stringify({
    OutputFormat: "ogg_vorbis",
    Text: text,
    VoiceId: voice || "Joanna"
  });

  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);

  // AWS SigV4 signing
  const kDate = crypto.createHmac("sha256", "AWS4" + secretKey).update(date).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
  const kService = crypto.createHmac("sha256", kRegion).update("polly").digest();
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();

  const canonicalHeaders = `content-type:application/json\nhost:polly.${region}.amazonaws.com\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-date";

  const canonicalRequest =
    `POST\n/v1/speech\n\n${canonicalHeaders}\n${signedHeaders}\n${crypto
      .createHash("sha256")
      .update(payload)
      .digest("hex")}`;

  const stringToSign =
    `AWS4-HMAC-SHA256\n${amzDate}\n${date}/${region}/polly/aws4_request\n${crypto
      .createHash("sha256")
      .update(canonicalRequest)
      .digest("hex")}`;

  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${date}/${region}/polly/aws4_request, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Amz-Date": amzDate,
      Authorization: authHeader
    },
    body: payload
  });

  if (!resp.ok) {
    const errTxt = await resp.text();
    throw new Error("Polly error: " + errTxt);
  }

  return await resp.arrayBuffer();
}

