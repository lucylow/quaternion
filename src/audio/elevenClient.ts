/**
 * ElevenLabs Client
 * TypeScript client for quaternion frontend to call the ElevenLabs proxy Edge function.
 * Provides TTS, STT, voice conversion, voice isolation, forced alignment, and voice listing.
 */

const base = import.meta.env.VITE_EDGE_BASE || import.meta.env.VITE_API_BASE || '/api';

export interface ElevenLabsVoiceSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface TtsOptions {
  text: string;
  voiceId?: string;
  ssml?: boolean;
  model?: string;
  voice_settings?: ElevenLabsVoiceSettings;
}

export interface Voice {
  voice_id: string;
  name: string;
  samples?: any[];
  category?: string;
  fine_tuning?: any;
  labels?: Record<string, string>;
  description?: string;
  preview_url?: string;
}

export interface TranscriptionResult {
  text: string;
  [key: string]: any;
}

export interface AlignmentSegment {
  start: number;
  end: number;
  text: string;
}

export interface AlignmentResult {
  aligned: boolean;
  segments: AlignmentSegment[];
  [key: string]: any;
}

/**
 * Generate speech from text using ElevenLabs TTS
 * Returns ArrayBuffer of audio bytes (MPEG format)
 */
export async function ttsSpeak(options: TtsOptions): Promise<ArrayBuffer> {
  const res = await fetch(`${base}/ai/elevenlabs/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: options.text,
      voiceId: options.voiceId,
      ssml: options.ssml || false,
      model: options.model,
      voice_settings: options.voice_settings
    })
  });
  
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`TTS failed: ${res.status} ${txt}`);
  }
  
  return await res.arrayBuffer();
}

/**
 * Transcribe audio from base64-encoded audio data
 * Returns transcription JSON
 */
export async function transcribeAudioBase64(b64: string): Promise<TranscriptionResult> {
  const res = await fetch(`${base}/ai/elevenlabs/stt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64: b64 })
  });
  
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`STT failed: ${res.status} ${txt}`);
  }
  
  return await res.json();
}

/**
 * Convert voice in audio using base64-encoded audio data
 * Returns ArrayBuffer of converted audio
 */
export async function voiceConvertBase64(options: {
  audioBase64: string;
  targetVoiceId: string;
  style?: ElevenLabsVoiceSettings;
}): Promise<ArrayBuffer> {
  const res = await fetch(`${base}/ai/elevenlabs/voiceconv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: options.audioBase64,
      targetVoiceId: options.targetVoiceId,
      style: options.style
    })
  });
  
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`VoiceConv failed: ${res.status} ${txt}`);
  }
  
  return await res.arrayBuffer();
}

/**
 * List available voices from ElevenLabs
 * Returns array of Voice objects
 */
export async function listVoices(): Promise<{ voices: Voice[] }> {
  const res = await fetch(`${base}/ai/elevenlabs/voices`);
  
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Voices list failed: ${res.status} ${txt}`);
  }
  
  return await res.json();
}

/**
 * Isolate audio stems from base64-encoded audio
 * Returns isolation result (may contain stems or URLs)
 */
export async function isolateAudioBase64(b64: string): Promise<any> {
  const res = await fetch(`${base}/ai/elevenlabs/isolate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64: b64 })
  });
  
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Isolation failed: ${res.status} ${txt}`);
  }
  
  return await res.json();
}

/**
 * Get forced alignment (word timestamps) from audio and transcript
 * Returns alignment result with segments
 */
export async function forcedAlignment(options: {
  audioBase64: string;
  transcript: string;
}): Promise<AlignmentResult> {
  const res = await fetch(`${base}/ai/elevenlabs/align`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: options.audioBase64,
      transcript: options.transcript
    })
  });
  
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Alignment failed: ${res.status} ${txt}`);
  }
  
  return await res.json();
}

/**
 * Convert Blob to base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Transcribe a Blob (audio file)
 */
export async function transcribeBlob(blob: Blob): Promise<TranscriptionResult> {
  const b64 = await blobToBase64(blob);
  return transcribeAudioBase64(b64);
}

/**
 * Convert voice in a Blob (audio file)
 */
export async function voiceConvertBlob(
  blob: Blob,
  targetVoiceId: string,
  style?: ElevenLabsVoiceSettings
): Promise<ArrayBuffer> {
  const b64 = await blobToBase64(blob);
  return voiceConvertBase64({ audioBase64: b64, targetVoiceId, style });
}

/**
 * Isolate audio stems from a Blob (audio file)
 */
export async function isolateAudioBlob(blob: Blob): Promise<any> {
  const b64 = await blobToBase64(blob);
  return isolateAudioBase64(b64);
}

