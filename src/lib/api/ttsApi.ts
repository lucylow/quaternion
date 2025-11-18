/**
 * TTS API Client
 * Type-safe methods for interacting with the text-to-speech backend
 */

import { apiClient } from './client';
import type { TTSRequest, TTSResponse } from './types';

class TTSApi {
  /**
   * Generate speech from text
   */
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    const response = await apiClient.post<TTSResponse>('/ai/tts', request);
    return response.data;
  }
}

// Export singleton instance
export const ttsApi = new TTSApi();
export default ttsApi;

