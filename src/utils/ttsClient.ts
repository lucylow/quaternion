// src/utils/ttsClient.ts
import axios from 'axios';
import audioManager from './audioManager';

const CACHE_PREFIX = 'ql-tts-';

export async function generateAndPlayTTS({
  voiceId,
  text,
  ssml
}: {
  voiceId: string;
  text?: string;
  ssml?: string;
}) {
  const key = `${CACHE_PREFIX}${voiceId}|${(ssml ?? text)?.slice(0, 200)}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    await audioManager.queueVoice(cached);
    return cached;
  }

  // request audio (binary) - try new endpoint first, fallback to existing
  const baseUrl = import.meta.env.VITE_API_BASE || '/api';
  let resp;
  try {
    resp = await axios.post(
      `${baseUrl}/ai/elevenlabs-proxy/generate-tts`,
      { voiceId, text, ssml, format: 'ogg' },
      {
        responseType: 'arraybuffer'
      }
    );
  } catch (err) {
    // Fallback to existing TTS endpoint
    resp = await axios.post(
      `${baseUrl}/ai/tts`,
      { text: ssml || text, voice: voiceId, ssml: !!ssml },
      {
        responseType: 'arraybuffer'
      }
    );
  }
  // create blob url
  const blob = new Blob([resp.data], { type: 'audio/ogg' });
  const url = URL.createObjectURL(blob);
  // cache: store blob URL string in localStorage (short-lived). For long-term, upload to server blob storage.
  localStorage.setItem(key, url);
  await audioManager.queueVoice(url);
  return url;
}

