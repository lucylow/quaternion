// src/audio/telemetry.ts
export async function sendAudioTelemetry(event: {
  eventType: 'tts_play' | 'sfx_play' | 'music_change' | 'duck_start' | 'duck_end',
  payload: Record<string, any>
}) {
  try {
    const endpoint = import.meta.env.VITE_TELEMETRY_ENDPOINT || '/api/telemetry';
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ts: new Date().toISOString(),
        ...event
      })
    });
  } catch (err) {
    console.warn('telemetry failed', err);
  }
}


