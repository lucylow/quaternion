// cloud/edge/openai.js
// Edge proxy for OpenAI with mock mode reading fixtures.
// - Uses process.env.OPENAI_API_KEY for real calls
// - When process.env.OPENAI_MOCK === 'true' returns responses from fixtures
// - Supports: POST /ai/openai/chat  and POST /ai/openai/transcribe
/* eslint-disable no-console */
import fs from 'fs';
import crypto from 'crypto';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE = process.env.OPENAI_BASE || 'https://api.openai.com/v1';
const MOCK = process.env.OPENAI_MOCK === 'true';

function sha256hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function requireKey() {
  if (!OPENAI_KEY && !MOCK) throw new Error('Missing OPENAI_API_KEY');
}

async function openaiFetch(path, opts = {}) {
  requireKey();
  const url = `${OPENAI_BASE}${path}`;
  const headers = { Authorization: `Bearer ${OPENAI_KEY}`, ...(opts.headers || {}) };
  return await fetch(url, { ...opts, headers });
}

function loadMockFixtures() {
  try {
    const p = './replay/fixtures/mock_openai_responses.json';
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Missing mock fixtures:', e.message);
    return {};
  }
}

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/\/+$/, '');
    // Chat endpoint
    if (pathname.endsWith('/ai/openai/chat') && req.method === 'POST') {
      const body = await req.json();
      if (MOCK) {
        const fixtures = loadMockFixtures();
        // if caller provided a mockKey, return that block
        if (body.mockKey && fixtures.chats && fixtures.chats[body.mockKey]) {
          return new Response(JSON.stringify(fixtures.chats[body.mockKey]), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }
        // fallback: return demo/default
        const fallback = fixtures.chats && fixtures.chats['demo_chat'] ? fixtures.chats['demo_chat'] : { id: 'mock', choices:[{message:{role:'assistant', content:'Mock reply'}}] };
        return new Response(JSON.stringify(fallback), { status: 200, headers: { 'Content-Type': 'application/json' }});
      }

      // real mode
      requireKey();
      const payload = {
        model: body.model || 'gpt-4o-mini',
        messages: body.messages || [],
        max_tokens: body.max_tokens ?? 512,
        temperature: body.temperature ?? 0.7,
        stream: !!body.stream
      };

      if (payload.stream) {
        const resp = await openaiFetch('/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!resp.ok) {
          const txt = await resp.text();
          return new Response(txt, { status: resp.status, headers: { 'Content-Type': 'text/plain' }});
        }
        // proxy streaming body to client
        const reader = resp.body.getReader();
        const stream = new ReadableStream({
          async pull(controller) {
            const { done, value } = await reader.read();
            if (done) { controller.close(); return; }
            controller.enqueue(value);
          }
        });
        return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' }});
      } else {
        const resp = await openaiFetch('/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!resp.ok) {
          const txt = await resp.text();
          return new Response(txt, { status: resp.status, headers: { 'Content-Type': 'text/plain' }});
        }
        const json = await resp.json();
        return new Response(JSON.stringify(json), { status: 200, headers: { 'Content-Type': 'application/json' }});
      }
    }

    // Transcription endpoint
    if (pathname.endsWith('/ai/openai/transcribe') && req.method === 'POST') {
      const body = await req.json();
      if (MOCK) {
        const fixtures = loadMockFixtures();
        if (body.mockKey && fixtures.transcripts && fixtures.transcripts[body.mockKey]) {
          return new Response(JSON.stringify(fixtures.transcripts[body.mockKey]), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }
        const fallback = { text: 'Mock transcription: player says something.' };
        return new Response(JSON.stringify(fallback), { status: 200, headers: { 'Content-Type': 'application/json' }});
      }

      requireKey();
      const audioBuffer = Buffer.from(body.audioBase64, 'base64');
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer]), 'recording.wav');
      formData.append('model', body.model || 'whisper-1');
      const resp = await openaiFetch('/audio/transcriptions', {
        method: 'POST',
        body: formData
      });
      if (!resp.ok) {
        const txt = await resp.text();
        return new Response(txt, { status: resp.status });
      }
      const json = await resp.json();
      return new Response(JSON.stringify(json), { status: 200, headers: { 'Content-Type': 'application/json' }});
    }

    return new Response('Not found', { status: 404 });
  } catch (err) {
    console.error('openai edge error', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
}

