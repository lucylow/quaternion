import { useState, useCallback } from 'react';
import { generateReplay, getReplay, type ReplayRequest, type ReplayMetadata, type ReplayData } from '@/lib/replayClient';

interface UseReplayState {
  loading: boolean;
  error: string | null;
  metadata: ReplayMetadata | null;
  data: ReplayData | null;
}

export function useReplay() {
  const [state, setState] = useState<UseReplayState>({
    loading: false,
    error: null,
    metadata: null,
    data: null,
  });

  const generate = useCallback(async (request: ReplayRequest): Promise<ReplayMetadata | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const metadata = await generateReplay(request);
      setState(prev => ({ ...prev, loading: false, metadata, error: null }));
      return metadata;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate replay';
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
      return null;
    }
  }, []);

  const fetch = useCallback(async (replayId: string): Promise<ReplayData | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await getReplay(replayId);
      setState(prev => ({ ...prev, loading: false, data, error: null }));
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch replay';
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    setState({ loading: false, error: null, metadata: null, data: null });
  }, []);

  return {
    state,
    generateReplay: generate,
    fetchReplay: fetch,
    clear,
  };
}
