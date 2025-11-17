// src/audio/ttsClient.ts
export async function requestTtsAudio({ text, voice = 'mara', ssml = false } : { text: string, voice?: string, ssml?: boolean }) {
  const base = import.meta.env.VITE_EDGE_BASE || import.meta.env.VITE_API_BASE || '/api';
  const res = await fetch(`${base}/ai/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, ssml })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`TTS proxy error: ${res.status} - ${txt}`);
  }
  // server returns audio bytes (ogg/wav) with content-type audio/ogg
  const arr = await res.arrayBuffer();
  return arr;
}

