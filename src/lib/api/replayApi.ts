/**
 * Replay API Client
 * Type-safe methods for interacting with the replay backend
 */

import { apiClient } from './client';
import { API_CONFIG } from './config';
import type {
  GenerateReplayRequest,
  ReplayMetadata,
  ReplayResponse,
} from './types';

class ReplayApi {
  /**
   * Generate a new replay
   */
  async generateReplay(request: GenerateReplayRequest): Promise<ReplayMetadata> {
    const response = await apiClient.post<ReplayResponse>('/replay/generate', request);
    
    if (response.data.errorId || response.data.message) {
      throw new Error(response.data.message || 'Failed to generate replay');
    }
    
    return {
      replayId: response.data.replayId,
      url: response.data.url,
      summary: response.data.summary,
      aiHighlights: response.data.aiHighlights,
      partial: response.data.partial,
    };
  }

  /**
   * Get replay metadata by ID
   */
  async getReplay(replayId: string): Promise<ReplayMetadata> {
    const response = await apiClient.get<ReplayMetadata | { message: string }>(
      `/replay/${replayId}`
    );
    
    if ('message' in response.data && response.data.message) {
      throw new Error(response.data.message);
    }
    
    return response.data as ReplayMetadata;
  }

  /**
   * Download replay file
   * Returns a blob URL for the replay file
   */
  async downloadReplay(replayId: string): Promise<Blob> {
    const baseUrl = API_CONFIG.GAME_API_URL;
    const url = `${baseUrl}/replay/${replayId}/download`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/gzip',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to download replay');
    }
    
    return await response.blob();
  }

  /**
   * Get replay download URL
   */
  getReplayDownloadUrl(replayId: string): string {
    const baseUrl = API_CONFIG.GAME_API_URL;
    return `${baseUrl}/replay/${replayId}/download`;
  }
}

// Export singleton instance
export const replayApi = new ReplayApi();
export default replayApi;

