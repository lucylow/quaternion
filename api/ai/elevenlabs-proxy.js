// src/serverless/elevenlabs-proxy.js
// Serverless function / Express snippet for ElevenLabs TTS proxy
// Deploy as edge function or Express route

const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const FormData = require('form-data');

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVEN_URL = process.env.ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1/text-to-speech';

if (!API_KEY) {
  console.warn('ELEVENLABS_API_KEY is not set!');
}

// Endpoint: POST /generate-tts
// Body: { voiceId: string, ssml?: string, text?:string, format?: 'mp3'|'ogg' }
app.post('/generate-tts', async (req, res) => {
  const { voiceId, ssml, text, format = 'ogg' } = req.body;
  if (!voiceId || !(text || ssml)) {
    return res.status(400).json({ error: 'voiceId and text or ssml required' });
  }

  try {
    // NOTE: ElevenLabs uses xi-api-key header, not Authorization: Bearer
    const body = {
      text: ssml || text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    };

    const resp = await fetch(`${ELEVEN_URL}/${encodeURIComponent(voiceId)}`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': format === 'mp3' ? 'audio/mpeg' : 'audio/ogg'
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('TTS failed:', resp.status, txt);
      return res.status(502).json({ error: 'tts_failed', details: txt });
    }

    // stream audio back to client
    const arrayBuffer = await resp.arrayBuffer();
    res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'audio/ogg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('proxy error', err);
    res.status(500).json({ error: 'internal_error', details: String(err) });
  }
});

// For serverless deployment, export the handler
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
}

// For direct Express server usage
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`ElevenLabs TTS proxy running on port ${PORT}`);
  });
}

