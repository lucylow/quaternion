// src/audio/ttsClient.ts

export interface ElevenLabsVoiceSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface TtsOptions {
  text: string;
  voice?: string;
  ssml?: boolean;
  voice_settings?: ElevenLabsVoiceSettings;
}

export async function requestTtsAudio({ 
  text, 
  voice = 'mara', 
  ssml = false,
  voice_settings 
} : TtsOptions) {
  const base = import.meta.env.VITE_EDGE_BASE || import.meta.env.VITE_API_BASE || '/api';
  const res = await fetch(`${base}/ai/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      text, 
      voice, 
      ssml,
      voice_settings: voice_settings || undefined
    })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`TTS proxy error: ${res.status} - ${txt}`);
  }
  // server returns audio bytes (ogg/wav) with content-type audio/ogg
  const arr = await res.arrayBuffer();
  return arr;
}

