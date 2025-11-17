/**
 * Mock Replay API Server for Local Development
 * Enable with: VITE_USE_REPLAY_MOCK=true
 */

import fullReplay from '../../public/fixtures/sample-replay.json';
import partialReplay from '../../public/fixtures/partial-replay.json';

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer?: any[];
  }
}

const MOCK_LATENCY_MIN = 200;
const MOCK_LATENCY_MAX = 1200;
const PARTIAL_CHANCE = 0.125; // 1 in 8

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomLatency() {
  return Math.floor(Math.random() * (MOCK_LATENCY_MAX - MOCK_LATENCY_MIN) + MOCK_LATENCY_MIN);
}

function shouldReturnPartial(seed: number): boolean {
  return seed % 8 === 0 || Math.random() < PARTIAL_CHANCE;
}

export class ReplayMockServer {
  private replays: Map<string, any> = new Map();

  async generateReplay(payload: {
    seed: number;
    mapConfig: any;
    commanderId: string;
    mode?: 'full' | 'fast';
  }) {
    await delay(getRandomLatency());

    const isPartial = shouldReturnPartial(payload.seed);
    const template = isPartial ? partialReplay : fullReplay;
    
    const replayId = `mock-${payload.seed}-${Date.now()}`;
    const mockUrl = `https://example.com/replays/${replayId}.json.gz`;

    const replay = {
      ...template,
      replayId,
      url: mockUrl,
      seed: payload.seed,
      mapConfig: payload.mapConfig,
      commanderId: payload.commanderId,
    };

    this.replays.set(replayId, replay);

    // Dispatch analytics event
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'replay:generate:success',
        replayId,
        mode: payload.mode || 'fast',
      });
    }

    return replay;
  }

  async getReplay(replayId: string) {
    await delay(100);
    
    const replay = this.replays.get(replayId);
    if (!replay) {
      throw new Error(`Replay ${replayId} not found`);
    }

    return replay;
  }

  async downloadReplay(replayId: string) {
    await delay(200);
    
    const replay = this.replays.get(replayId);
    if (!replay) {
      throw new Error(`Replay ${replayId} not found`);
    }

    // Dispatch analytics event
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'replay:download',
        replayId,
      });
    }

    // Return blob URL for download
    const blob = new Blob([JSON.stringify(replay, null, 2)], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }
}

// Singleton instance
export const mockServer = new ReplayMockServer();

// Mock fetch interceptor
export function setupMockReplayAPI() {
  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    // Intercept replay API calls
    if (url.includes('/api/replay/generate')) {
      try {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        const data = await mockServer.generateReplay(body);
        
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (url.match(/\/api\/replay\/[^/]+$/)) {
      try {
        const replayId = url.split('/').pop() || '';
        const data = await mockServer.getReplay(replayId);
        
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (url.includes('/api/replay/') && url.includes('/download')) {
      try {
        const replayId = url.split('/').find((_, i, arr) => arr[i - 1] === 'replay') || '';
        const blobUrl = await mockServer.downloadReplay(replayId);
        
        return new Response(null, {
          status: 302,
          headers: { 'Location': blobUrl },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Fall through to original fetch
    return originalFetch(input, init);
  };
}

// Auto-setup if env var is set
if (import.meta.env.VITE_USE_REPLAY_MOCK === 'true') {
  setupMockReplayAPI();
  console.log('🎮 Mock Replay API enabled');
}
