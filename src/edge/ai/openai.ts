// src/edge/ai/openai.ts
// Lovable Cloud Edge Function: OpenAI API Proxy
// Exposes: POST /api/ai/openai/chat, POST /api/ai/openai/transcribe
// Tool: OpenAI (Sponsor-tag ready)
// Security: Keeps OPENAI_API_KEY server-side only

import crypto from 'crypto';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE = process.env.OPENAI_BASE || 'https://api.openai.com/v1';
const MOCK = process.env.OPENAI_MOCK === 'true';

// Simple in-memory cache (replace with durable store in production)
const inMemoryCache = new Map<string, any>();

function requireKey() {
  if (!OPENAI_KEY && !MOCK) {
    throw new Error('Missing OPENAI_API_KEY in environment');
  }
}

function sha256hex(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Exponential backoff helper
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  { retries = 3, minDelay = 200, factor = 2 }: { retries?: number; minDelay?: number; factor?: number } = {}
): Promise<T> {
  let attempt = 0;
  let delay = minDelay;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries) throw err;
      await new Promise(r => setTimeout(r, delay));
      delay *= factor;
    }
  }
}

// Proxy fetch wrapper for OpenAI
async function openaiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  requireKey();
  const url = `${OPENAI_BASE}${path}`;
  const headers = {
    Authorization: `Bearer ${OPENAI_KEY}`,
    ...(opts.headers || {}),
  };
  return await retryWithBackoff(() => fetch(url, { ...opts, headers }), { retries: 3 });
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/\/+$/, '');

    // 1) Chat (supports streaming if body.stream === true)
    // Handles routes: /ai/openai/chat or /api/ai/openai/chat
    if ((pathname.endsWith('/ai/openai/chat') || pathname.includes('/ai/openai/chat')) && req.method === 'POST') {
      const body = await req.json();
      
      if (MOCK) {
        // Mock deterministic response for demos
        return new Response(
          JSON.stringify({
            id: 'mock',
            choices: [{ message: { role: 'assistant', content: 'Mock reply.' } }],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Caching by prompt hash (optional)
      const promptHash = sha256hex(JSON.stringify(body));
      if (body.cache && inMemoryCache.has(promptHash)) {
        const cached = inMemoryCache.get(promptHash);
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Build OpenAI request payload - use /chat/completions
      const payload = {
        model: body.model || 'gpt-4o-mini', // pick your model
        messages: body.messages || [],
        max_tokens: body.max_tokens ?? 512,
        temperature: body.temperature ?? 0.8,
        stream: !!body.stream,
      };

      if (payload.stream) {
        // Stream: fetch streaming response and forward as text/event-stream
        const resp = await openaiFetch('/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          return new Response(txt, {
            status: resp.status,
            headers: { 'Content-Type': 'text/plain' },
          });
        }

        // Pass the streaming body through to the client
        const reader = resp.body?.getReader();
        if (!reader) {
          return new Response('No stream available', { status: 500 });
        }

        const stream = new ReadableStream({
          async pull(controller) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
          },
        });
        
        return new Response(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      } else {
        // Non-streaming
        const resp = await openaiFetch('/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (!resp.ok) {
          const txt = await resp.text();
          return new Response(txt, {
            status: resp.status,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        
        const json = await resp.json();
        if (body.cache) {
          inMemoryCache.set(promptHash, json);
        }
        
        return new Response(JSON.stringify(json), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 2) Audio transcription (accepts base64 in body)
    // Handles routes: /ai/openai/transcribe or /api/ai/openai/transcribe
    if ((pathname.endsWith('/ai/openai/transcribe') || pathname.includes('/ai/openai/transcribe')) && req.method === 'POST') {
      const body = await req.json();
      
      if (MOCK) {
        return new Response(
          JSON.stringify({ text: 'Mock transcription.' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // OpenAI Audio transcription endpoint: /audio/transcriptions
      // Build a multipart/form-data body
      const audioBuffer = Buffer.from(body.audioBase64, 'base64');
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer]), 'recording.wav');
      formData.append('model', body.model || 'whisper-1');

      // Note: in Edge runtimes FormData + fetch works; adapt if not available
      const resp = await openaiFetch('/audio/transcriptions', {
        method: 'POST',
        body: formData,
      });
      
      if (!resp.ok) {
        const txt = await resp.text();
        return new Response(txt, { status: resp.status });
      }
      
      const json = await resp.json();
      return new Response(JSON.stringify(json), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  } catch (err: any) {
    console.error('openai edge error', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

