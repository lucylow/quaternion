// Client for replay API
import { supabase } from '@/integrations/supabase/client';
import * as replayApiMock from '@/utils/replayApi';

const MOCK_ENABLED = (import.meta.env.VITE_USE_REPLAY_MOCK || '').toLowerCase() === 'true';

export interface ReplayRequest {
  seed: number;
  mapConfig: any;
  commanderId: string;
  runtime?: {
    maxTicks?: number;
    maxDurationSec?: number;
  };
  mode?: 'full' | 'fast';
}

export interface ReplayMetadata {
  replayId: string;
  seed: number;
  mapConfig: any;
  commanderId: string;
  startTime: string;
  endTime: string;
  durationSec: number;
  finalOutcome: 'victory' | 'defeat' | 'draw';
  summary: string;
  aiHighlights: Array<{
    t: number;
    actor: string;
    action: string;
    reason: string;
  }>;
  url?: string;
  partial: boolean;
}

export interface ReplayData extends ReplayMetadata {
  actions: Array<{
    t: number;
    actor: string;
    type: string;
    payload: any;
    reason: string;
  }>;
  stateDeltas?: Array<{
    t: number;
    description: string;
    delta: any;
  }>;
  meta: {
    version: string;
    engineCommit: string;
    generatedBy?: string;
    nonDeterminism?: any;
    partial?: boolean;
    contentHash?: string;
  };
}

/**
 * Generate a new replay
 * Uses mock API if VITE_USE_REPLAY_MOCK=true, otherwise uses Supabase edge function
 */
export async function generateReplay(request: ReplayRequest): Promise<ReplayMetadata> {
  if (MOCK_ENABLED) {
    return replayApiMock.generateReplay(request);
  }

  const { data, error } = await supabase.functions.invoke('replay-handler/generate', {
    body: request,
    method: 'POST'
  });

  if (error) {
    throw new Error(`Failed to generate replay: ${error.message}`);
  }

  return data as ReplayMetadata;
}

/**
 * Get replay data by ID
 * Uses mock API if VITE_USE_REPLAY_MOCK=true, otherwise uses Supabase edge function
 */
export async function getReplay(replayId: string): Promise<ReplayData> {
  if (MOCK_ENABLED) {
    const data = await replayApiMock.getReplay(replayId);
    if (!data) {
      throw new Error(`Replay ${replayId} not found`);
    }
    return data;
  }

  const { data, error } = await supabase.functions.invoke(`replay-handler/${replayId}`, {
    method: 'GET'
  });

  if (error) {
    throw new Error(`Failed to fetch replay: ${error.message}`);
  }

  return data as ReplayData;
}

/**
 * Get download URL for replay
 */
export function getReplayDownloadUrl(replayId: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/replay-handler/${replayId}/download`;
}

/**
 * Download replay as JSON file
 * Uses mock API if VITE_USE_REPLAY_MOCK=true, otherwise uses Supabase edge function
 */
export async function downloadReplay(replayId: string): Promise<void> {
  if (MOCK_ENABLED) {
    // Get metadata first
    const metadata = await getReplay(replayId);
    if (!metadata || !metadata.url) {
      throw new Error('Replay metadata not found');
    }
    await replayApiMock.downloadReplay(metadata);
    return;
  }

  const url = getReplayDownloadUrl(replayId);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to download replay');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `replay-${replayId}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
