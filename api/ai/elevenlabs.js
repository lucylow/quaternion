// api/ai/elevenlabs.js
// Lovable Edge function: proxy to ElevenLabs API
// Requires process.env.ELEVENLABS_API_KEY to be set (xi-api-key)
// 
// Exposed endpoints:
// POST /api/ai/elevenlabs/tts        -> body { text, voiceId?, ssml?, model?, voice_settings? }
// POST /api/ai/elevenlabs/stt        -> body { audioBase64 }
// POST /api/ai/elevenlabs/voiceconv  -> body { audioBase64, targetVoiceId, style? }
// GET  /api/ai/elevenlabs/voices     -> list voices
// POST /api/ai/elevenlabs/isolate    -> body { audioBase64 }
// POST /api/ai/elevenlabs/align      -> body { audioBase64, transcript }
//
// IMPORTANT: keep xi-api-key server-side (ElevenLabs requires xi-api-key header)

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ElevenLabs_API_key;
const PROVIDER_BASE = 'https://api.elevenlabs.io/v1';

function jsonResponse(res, code = 200) {
  return new Response(JSON.stringify(res), {
    status: code,
    headers: { 'Content-Type': 'application/json' }
  });
}

function requireKey() {
  if (!ELEVEN_KEY) {
    throw new Error('Missing ELEVENLABS_API_KEY - set in Lovable secrets');
  }
}

async function proxyBinary(url, opts = {}) {
  requireKey();
  const headers = {
    'xi-api-key': ELEVEN_KEY,
    ...(opts.headers || {})
  };
  const resp = await fetch(url, { ...opts, headers });
  
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Provider error ${resp.status}: ${txt}`);
  }
  
  const arr = await resp.arrayBuffer();
  const contentType = resp.headers.get('content-type') || 'application/octet-stream';
  return { arr, contentType };
}

export default async function handler(req, res) {
  try {
    // Handle both Express (res) and Edge function (no res) patterns
    const isEdge = !res;
    
    let url, method, body;
    if (isEdge) {
      url = new URL(req.url);
      method = req.method;
      body = req.body || await req.json().catch(() => ({}));
    } else {
      url = new URL(req.url || `http://localhost${req.path}`);
      method = req.method;
      body = req.body || {};
    }
    
    const path = url.pathname.replace(/\/+$/, '');
    
    // Router
    if (path.endsWith('/ai/elevenlabs/voices') && method === 'GET') {
      // Get voices (list)
      requireKey();
      const { arr } = await proxyBinary(`${PROVIDER_BASE}/voices`, { method: 'GET' });
      
      if (isEdge) {
        return new Response(arr, { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });
      } else {
        const json = JSON.parse(Buffer.from(arr).toString());
        return res.status(200).json(json);
      }
    }
    
    // Text-to-speech (TTS)
    if (path.endsWith('/ai/elevenlabs/tts') && method === 'POST') {
      const mock = body.mock || process.env.TTS_MOCK === 'true';
      
      if (mock) {
        // Return a tiny silent OGG placeholder (for dev/hackathons)
        const fake = new Uint8Array([0x4F, 0x67, 0x67, 0x53, ...new Array(4096).fill(0)]);
        
        if (isEdge) {
          return new Response(fake, { 
            status: 200, 
            headers: { 'Content-Type': 'audio/ogg' } 
          });
        } else {
          res.setHeader('Content-Type', 'audio/ogg');
          return res.send(Buffer.from(fake));
        }
      }
      
      requireKey();
      const voice = body.voiceId || body.voice || '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel
      const endpoint = `${PROVIDER_BASE}/text-to-speech/${encodeURIComponent(voice)}/stream`;
      
      // Default voice settings
      const defaultVoiceSettings = {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      };
      
      const payload = {
        text: body.text,
        model_id: body.model || 'eleven_turbo_v2',
        voice_settings: body.voice_settings || defaultVoiceSettings
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
        if (isEdge) {
          return new Response(txt, { 
            status: resp.status, 
            headers: { 'Content-Type': 'text/plain' } 
          });
        } else {
          return res.status(resp.status).send(txt);
        }
      }
      
      const stream = await resp.arrayBuffer();
      const ct = resp.headers.get('content-type') || 'audio/mpeg';
      
      if (isEdge) {
        return new Response(stream, { 
          status: 200, 
          headers: { 'Content-Type': ct } 
        });
      } else {
        res.setHeader('Content-Type', ct);
        return res.send(Buffer.from(stream));
      }
    }
    
    // Speech-to-Text (transcribe)
    if (path.endsWith('/ai/elevenlabs/stt') && method === 'POST') {
      const mock = body.mock || process.env.TTS_MOCK === 'true';
      
      if (mock) {
        const mockResponse = { text: 'Transcription (mock): we preserved it.' };
        if (isEdge) {
          return jsonResponse(mockResponse);
        } else {
          return res.json(mockResponse);
        }
      }
      
      requireKey();
      const sttUrl = `${PROVIDER_BASE}/speech-to-text`;
      const buffer = Buffer.from(body.audioBase64, 'base64');
      
      const resp = await fetch(sttUrl, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVEN_KEY,
          'Content-Type': 'audio/mpeg' // Adjust if sending ogg, wav, etc
        },
        body: buffer
      });
      
      if (!resp.ok) {
        const txt = await resp.text();
        if (isEdge) {
          return new Response(txt, { 
            status: resp.status, 
            headers: { 'Content-Type': 'text/plain' } 
          });
        } else {
          return res.status(resp.status).send(txt);
        }
      }
      
      const json = await resp.json();
      if (isEdge) {
        return jsonResponse(json);
      } else {
        return res.json(json);
      }
    }
    
    // Speech-to-Speech / Voice conversion
    if (path.endsWith('/ai/elevenlabs/voiceconv') && method === 'POST') {
      const mock = body.mock || process.env.TTS_MOCK === 'true';
      
      if (mock) {
        const fake = new Uint8Array([0x4F, 0x67, 0x67, 0x53, ...new Array(4096).fill(0)]);
        if (isEdge) {
          return new Response(fake, { 
            status: 200, 
            headers: { 'Content-Type': 'audio/ogg' } 
          });
        } else {
          res.setHeader('Content-Type', 'audio/ogg');
          return res.send(Buffer.from(fake));
        }
      }
      
      requireKey();
      const convUrl = `${PROVIDER_BASE}/speech-to-speech/${encodeURIComponent(body.targetVoiceId)}`;
      const buffer = Buffer.from(body.audioBase64, 'base64');
      
      const payload = {
        audio: body.audioBase64,
        voice_settings: body.style || {}
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
        if (isEdge) {
          return new Response(txt, { status: resp.status });
        } else {
          return res.status(resp.status).send(txt);
        }
      }
      
      const arr = await resp.arrayBuffer();
      const ct = resp.headers.get('content-type') || 'audio/ogg';
      
      if (isEdge) {
        return new Response(arr, { 
          status: 200, 
          headers: { 'Content-Type': ct } 
        });
      } else {
        res.setHeader('Content-Type', ct);
        return res.send(Buffer.from(arr));
      }
    }
    
    // Audio isolation / stems
    if (path.endsWith('/ai/elevenlabs/isolate') && method === 'POST') {
      const mock = body.mock || process.env.TTS_MOCK === 'true';
      
      if (mock) {
        const mockResponse = { isolated: true, note: 'mock isolation produced' };
        if (isEdge) {
          return jsonResponse(mockResponse);
        } else {
          return res.json(mockResponse);
        }
      }
      
      requireKey();
      const isolateUrl = `${PROVIDER_BASE}/audio-isolation`;
      const buffer = Buffer.from(body.audioBase64, 'base64');
      
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
        if (isEdge) {
          return new Response(txt, { 
            status: resp.status, 
            headers: { 'Content-Type': 'text/plain' } 
          });
        } else {
          return res.status(resp.status).send(txt);
        }
      }
      
      const json = await resp.json();
      if (isEdge) {
        return jsonResponse(json);
      } else {
        return res.json(json);
      }
    }
    
    // Forced alignment (timestamps)
    if (path.endsWith('/ai/elevenlabs/align') && method === 'POST') {
      if (process.env.TTS_MOCK === 'true' || body.mock) {
        const mockResponse = {
          aligned: true,
          segments: [{ start: 0.0, end: 1.2, text: 'Please — listen.' }]
        };
        if (isEdge) {
          return jsonResponse(mockResponse);
        } else {
          return res.json(mockResponse);
        }
      }
      
      requireKey();
      const alignUrl = `${PROVIDER_BASE}/forced-alignment`;
      
      const resp = await fetch(alignUrl, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVEN_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_base64: body.audioBase64,
          transcript: body.transcript
        })
      });
      
      if (!resp.ok) {
        const txt = await resp.text();
        if (isEdge) {
          return new Response(txt, { status: resp.status });
        } else {
          return res.status(resp.status).send(txt);
        }
      }
      
      const json = await resp.json();
      if (isEdge) {
        return jsonResponse(json);
      } else {
        return res.json(json);
      }
    }
    
    // Not found
    if (isEdge) {
      return new Response('Not Found', { status: 404 });
    } else {
      return res.status(404).send('Not Found');
    }
    
  } catch (err) {
    console.error('elevenlabs edge error', err);
    const errorResponse = { error: err.message };
    
    if (!res) {
      return new Response(JSON.stringify(errorResponse), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    } else {
      return res.status(500).json(errorResponse);
    }
  }
}

