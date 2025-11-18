// src/video/ltxClient.ts
// Frontend TypeScript client for LTX Video Generation API
// Calls the edge endpoint at /api/ai/ltx/text-to-video and /api/ai/ltx/image-to-video

const EDGE_BASE = import.meta.env.VITE_API_BASE || '';

export interface VideoGenerationOptions {
  prompt: string;
  model?: string;
  duration?: number;
  resolution?: string;
  fps?: number;
  generate_audio?: boolean;
}

export interface ImageToVideoOptions extends VideoGenerationOptions {
  imageUri: string;
}

export interface VideoGenerationResult {
  blob: Blob;
  url: string;
  cached?: boolean;
}

/**
 * Generate video from text prompt using LTX API
 */
export async function generateVideoFromText(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
  const { prompt, model = 'ltx-2-pro', duration = 8, resolution = '1920x1080', fps = 25, generate_audio = true } = options;

  const res = await fetch(`${EDGE_BASE}/api/ai/ltx/text-to-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model, duration, resolution, fps, generate_audio })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`LTX text->video failed ${res.status}: ${txt}`);
  }

  // Check if response is JSON (cached URL) or binary (video blob)
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (data.url) {
      // Fetch the cached URL
      const videoRes = await fetch(data.url);
      const blob = await videoRes.blob();
      const url = URL.createObjectURL(blob);
      return { blob, url, cached: data.cached };
    }
  }

  // Read as blob
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return { blob, url, cached: res.headers.get('X-Cache') === 'HIT' };
}

/**
 * Generate video from image URI and prompt using LTX API
 */
export async function generateVideoFromImage(options: ImageToVideoOptions): Promise<VideoGenerationResult> {
  const { imageUri, prompt, model = 'ltx-2-pro', duration = 8, resolution = '1920x1080', fps = 25, generate_audio = true } = options;

  const res = await fetch(`${EDGE_BASE}/api/ai/ltx/image-to-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_uri: imageUri, prompt, model, duration, resolution, fps, generate_audio })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`LTX image->video failed ${res.status}: ${txt}`);
  }

  // Check if response is JSON (cached URL) or binary (video blob)
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (data.url) {
      // Fetch the cached URL
      const videoRes = await fetch(data.url);
      const blob = await videoRes.blob();
      const url = URL.createObjectURL(blob);
      return { blob, url, cached: data.cached };
    }
  }

  // Read as blob
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return { blob, url, cached: res.headers.get('X-Cache') === 'HIT' };
}

/**
 * Generate video with progress tracking (streaming)
 * Note: This reads the response in chunks to track progress
 */
export async function generateVideoFromTextWithProgress(
  options: VideoGenerationOptions,
  onProgress?: (loaded: number, total: number) => void
): Promise<VideoGenerationResult> {
  const { prompt, model = 'ltx-2-pro', duration = 8, resolution = '1920x1080', fps = 25, generate_audio = true } = options;

  const res = await fetch(`${EDGE_BASE}/api/ai/ltx/text-to-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model, duration, resolution, fps, generate_audio })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`LTX text->video failed ${res.status}: ${txt}`);
  }

  const total = parseInt(res.headers.get('content-length') || '0', 10);
  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    loaded += value.length;
    if (onProgress) {
      onProgress(loaded, total || loaded);
    }
  }

  const blob = new Blob(chunks, { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);
  return { blob, url, cached: res.headers.get('X-Cache') === 'HIT' };
}

