// api/ai/ltx.js
// Lovable Edge function: proxy to LTX Video Generation API (text-to-video & image-to-video)
// Requires process.env.LTX_API_KEY to be set (Bearer token)
// 
// Exposed endpoints:
// POST /api/ai/ltx/text-to-video   -> body { prompt, model?, duration?, resolution?, fps?, generate_audio? }
// POST /api/ai/ltx/image-to-video  -> body { image_uri, prompt, model?, duration?, resolution?, fps?, generate_audio? }
//
// IMPORTANT: keep API key server-side (LTX requires Bearer token in Authorization header)
// Mock mode: set LTX_MOCK=true or pass mock:true in body for demo/dev

const LTX_KEY = process.env.LTX_API_KEY;
const LTX_BASE = 'https://api.ltx.video/v1';
const crypto = require('crypto');

function jsonResponse(res, code = 200) {
  return new Response(JSON.stringify(res), {
    status: code,
    headers: { 'Content-Type': 'application/json' }
  });
}

function requireKey() {
  if (!LTX_KEY && process.env.LTX_MOCK !== 'true') {
    throw new Error('Missing LTX_API_KEY - set in Lovable secrets or enable mock mode');
  }
}

// Generate prompt hash for caching/telemetry
function promptHash(prompt, opts = {}) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify({ prompt, ...opts }));
  return hash.digest('hex');
}

// Generate a realistic mock MP4 video buffer (minimal valid MP4 structure)
function generateMockVideo(promptHash, prompt, type = 'text') {
  // Minimal MP4 ftyp + mdat boxes (not playable but valid structure)
  const ftyp = Buffer.from([
    0x00, 0x00, 0x00, 0x20, // box size
    0x66, 0x74, 0x79, 0x70, // "ftyp"
    0x69, 0x73, 0x6F, 0x6D, // major brand "isom"
    0x00, 0x00, 0x02, 0x00, // minor version
    0x69, 0x73, 0x6F, 0x6D, // compatible brand
    0x69, 0x73, 0x6F, 0x32, // compatible brand
    0x61, 0x76, 0x63, 0x31, // compatible brand
    0x6D, 0x70, 0x34, 0x31  // compatible brand
  ]);
  
  // Create a small mdat box with metadata
  const metadata = `MOCK ${type.toUpperCase()} VIDEO\nPrompt: ${prompt.substring(0, 100)}\nHash: ${promptHash}\nGenerated: ${new Date().toISOString()}`;
  const mdatSize = 8 + Buffer.byteLength(metadata);
  const mdat = Buffer.alloc(mdatSize);
  mdat.writeUInt32BE(mdatSize, 0);
  mdat.write('mdat', 4);
  mdat.write(metadata, 8);
  
  // Combine into a minimal MP4
  return Buffer.concat([ftyp, mdat, Buffer.alloc(4096).fill(0)]); // Add padding for realistic size
}

// Cache hooks (stubs - implement with S3/Lovable blob storage if needed)
async function getCachedVideo(promptHash) {
  // TODO: check S3 or Lovable object storage for promptHash
  // return { buffer, contentType, url } if present
  return null;
}

async function putCachedVideo(promptHash, buffer, contentType) {
  // TODO: store buffer in S3 or Lovable object storage, return URL or key
  return null;
}

// Forward request to LTX API
async function forwardToLtx(path, bodyObj) {
  requireKey();
  const url = `${LTX_BASE}${path.startsWith('/') ? path : '/' + path}`;
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LTX_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyObj)
  });
  
  return resp;
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
    const mock = body.mock || process.env.LTX_MOCK === 'true' || !LTX_KEY;
    
    // POST /api/ai/ltx/text-to-video
    if (path.endsWith('/ai/ltx/text-to-video') && method === 'POST') {
      const prompt = (body.prompt || '').trim();
      const model = body.model || 'ltx-2-pro';
      const duration = Number(body.duration) || 8;
      const resolution = body.resolution || '1920x1080';
      const fps = body.fps || 25;
      const generate_audio = body.generate_audio !== undefined ? !!body.generate_audio : true;
      
      if (!prompt) {
        const error = { error: 'prompt required' };
        if (isEdge) return jsonResponse(error, 400);
        return res.status(400).json(error);
      }
      
      const phash = promptHash(prompt, { model, duration, resolution, fps, generate_audio });
      
      // Check cache
      const cached = await getCachedVideo(phash);
      if (cached) {
        console.log('LTX: cache hit', phash);
        if (cached.url) {
          const response = { url: cached.url, cached: true };
          if (isEdge) return jsonResponse(response);
          return res.json(response);
        }
        if (isEdge) {
          return new Response(cached.buffer, {
            status: 200,
            headers: { 'Content-Type': cached.contentType || 'video/mp4', 'X-Cache': 'HIT' }
          });
        }
        res.setHeader('Content-Type', cached.contentType || 'video/mp4');
        res.setHeader('X-Cache', 'HIT');
        return res.send(cached.buffer);
      }
      
      // Mock mode
      if (mock) {
        const mockVideo = generateMockVideo(phash, prompt, 'text');
        if (isEdge) {
          return new Response(mockVideo, {
            status: 200,
            headers: { 'Content-Type': 'video/mp4', 'X-Mock': 'true' }
          });
        }
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('X-Mock', 'true');
        return res.send(mockVideo);
      }
      
      // Forward to LTX
      const payload = { prompt, model, duration, resolution, fps, generate_audio };
      const start = Date.now();
      
      const resp = await forwardToLtx('/text-to-video', payload);
      
      if (!resp.ok) {
        const txt = await resp.text();
        console.error('LTX forward error', resp.status, txt);
        const error = { error: 'LTX error', status: resp.status, body: txt };
        if (isEdge) return jsonResponse(error, resp.status);
        return res.status(resp.status).json(error);
      }
      
      const arr = await resp.arrayBuffer();
      const buffer = Buffer.from(arr);
      
      // Cache store (async, don't block)
      try {
        await putCachedVideo(phash, buffer, resp.headers.get('content-type') || 'video/mp4');
      } catch (e) {
        console.warn('Cache store failed', e);
      }
      
      const durationMs = Date.now() - start;
      console.log(`LTX text-to-video: ${durationMs}ms, size: ${buffer.length}, hash: ${phash}`);
      
      // TODO: logTelemetry({ type: 'ltx_video', promptHash: phash, model, durationMs, size: buffer.length });
      
      if (isEdge) {
        return new Response(buffer, {
          status: 200,
          headers: { 'Content-Type': resp.headers.get('content-type') || 'video/mp4' }
        });
      }
      res.setHeader('Content-Type', resp.headers.get('content-type') || 'video/mp4');
      return res.send(buffer);
    }
    
    // POST /api/ai/ltx/image-to-video
    if (path.endsWith('/ai/ltx/image-to-video') && method === 'POST') {
      const image_uri = body.image_uri;
      const prompt = (body.prompt || '').trim();
      const model = body.model || 'ltx-2-pro';
      const duration = Number(body.duration) || 8;
      const resolution = body.resolution || '1920x1080';
      const fps = body.fps || 25;
      const generate_audio = body.generate_audio !== undefined ? !!body.generate_audio : true;
      
      if (!image_uri || !prompt) {
        const error = { error: 'image_uri and prompt required' };
        if (isEdge) return jsonResponse(error, 400);
        return res.status(400).json(error);
      }
      
      const phash = promptHash({ image_uri, prompt, model, duration, resolution, fps, generate_audio });
      
      // Check cache
      const cached = await getCachedVideo(phash);
      if (cached) {
        if (cached.url) {
          const response = { url: cached.url, cached: true };
          if (isEdge) return jsonResponse(response);
          return res.json(response);
        }
        if (isEdge) {
          return new Response(cached.buffer, {
            status: 200,
            headers: { 'Content-Type': cached.contentType || 'video/mp4', 'X-Cache': 'HIT' }
          });
        }
        res.setHeader('Content-Type', cached.contentType || 'video/mp4');
        res.setHeader('X-Cache', 'HIT');
        return res.send(cached.buffer);
      }
      
      // Mock mode
      if (mock) {
        const mockVideo = generateMockVideo(phash, `${prompt} [image: ${image_uri}]`, 'image');
        if (isEdge) {
          return new Response(mockVideo, {
            status: 200,
            headers: { 'Content-Type': 'video/mp4', 'X-Mock': 'true' }
          });
        }
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('X-Mock', 'true');
        return res.send(mockVideo);
      }
      
      // Forward to LTX
      const payload = { image_uri, prompt, model, duration, resolution, fps, generate_audio };
      const resp = await forwardToLtx('/image-to-video', payload);
      
      if (!resp.ok) {
        const txt = await resp.text();
        console.error('LTX image->video error', resp.status, txt);
        const error = { error: 'LTX error', status: resp.status, body: txt };
        if (isEdge) return jsonResponse(error, resp.status);
        return res.status(resp.status).json(error);
      }
      
      const arr = await resp.arrayBuffer();
      const buffer = Buffer.from(arr);
      
      // Cache store (async)
      try {
        await putCachedVideo(phash, buffer, resp.headers.get('content-type') || 'video/mp4');
      } catch (e) {
        console.warn('Cache store failed', e);
      }
      
      if (isEdge) {
        return new Response(buffer, {
          status: 200,
          headers: { 'Content-Type': resp.headers.get('content-type') || 'video/mp4' }
        });
      }
      res.setHeader('Content-Type', resp.headers.get('content-type') || 'video/mp4');
      return res.send(buffer);
    }
    
    // Not found
    if (isEdge) {
      return new Response('Not Found', { status: 404 });
    } else {
      return res.status(404).send('Not Found');
    }
    
  } catch (err) {
    console.error('ltx edge error', err);
    const errorResponse = { error: err.message };
    
    if (!res) {
      return jsonResponse(errorResponse, 500);
    } else {
      return res.status(500).json(errorResponse);
    }
  }
}

