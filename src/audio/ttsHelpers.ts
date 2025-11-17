// src/audio/ttsHelpers.ts
// Helper functions for TTS narration in game

import { requestTtsAudio } from './ttsClient';
import AudioManager from './AudioManager';
import { sendAudioTelemetry } from './telemetry';

/**
 * Narrate a model decision with TTS
 * @param agentId - ID of the agent/commander making the decision
 * @param text - Text to narrate
 * @param voice - Voice to use (default: 'mara')
 * @param duckMusic - Whether to duck music during narration (default: true)
 */
export async function narrateModelDecision(
  agentId: string,
  text: string,
  voice: string = 'mara',
  duckMusic: boolean = true
) {
  try {
    const arr = await requestTtsAudio({ text, voice, ssml: false });
    await sendAudioTelemetry({
      eventType: 'tts_play',
      payload: { agentId, textLength: text.length, voice }
    });
    await AudioManager.instance().playTtsArrayBuffer(arr, { duckMusic, volume: 1.0 });
  } catch (err) {
    console.error('Narration failed', err);
    // Don't throw - TTS is optional
  }
}

/**
 * Play a sound effect
 * @param key - Sound effect key (must be preloaded)
 * @param volume - Volume (0-1, default: 1)
 */
export function playSfx(key: string, volume: number = 1.0) {
  try {
    AudioManager.instance().playSfx(key, { volume });
    sendAudioTelemetry({
      eventType: 'sfx_play',
      payload: { key, volume }
    }).catch(() => {}); // Non-blocking
  } catch (err) {
    console.warn('SFX play failed', err);
  }
}

