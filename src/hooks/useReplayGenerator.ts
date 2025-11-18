import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { safeStringify } from '@/utils/safeJSON';

// Analytics helper
function trackEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event, ...data });
  }
}

interface ReplayMetadata {
  replayId: string;
  url: string;
  summary: string;
  aiHighlights: Array<{
    t: number;
    actor: string;
    action: string;
    reason: string;
  }>;
  meta: {
    engineCommit: string;
    partial: boolean;
    contentHash: string;
    nonDeterminism?: {
      reason: string;
    };
  };
  actions?: Array<{
    timestamp: number;
    type: string;
    data: Record<string, unknown>;
  }>;
}

interface GenerateReplayParams {
  seed: number;
  mapConfig: {
    type: string;
    width: number;
    height: number;
  };
  commanderId: string;
  mode?: 'full' | 'fast';
}

const CACHE_KEY = 'quaternion_replays_cache';
const MAX_CACHE_SIZE = 5;

export function useReplayGenerator() {
  const [metadata, setMetadata] = useState<ReplayMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from cache
  const loadFromCache = useCallback((replayId: string): ReplayMetadata | null => {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      if (!cache) return null;
      
      const cached = JSON.parse(cache);
      return cached[replayId] || null;
    } catch {
      return null;
    }
  }, []);

  // Save to cache
  const saveToCache = useCallback((replayId: string, data: ReplayMetadata) => {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      const parsed = cache ? JSON.parse(cache) : {};
      
      // Add new entry
      parsed[replayId] = { ...data, cachedAt: Date.now() };
      
      // Keep only last 5
      const entries = Object.entries(parsed);
      if (entries.length > MAX_CACHE_SIZE) {
        entries.sort((a, b) => {
          const aCached = (a[1] as { cachedAt?: number }).cachedAt ?? 0;
          const bCached = (b[1] as { cachedAt?: number }).cachedAt ?? 0;
          return bCached - aCached;
        });
        const limited = Object.fromEntries(entries.slice(0, MAX_CACHE_SIZE));
        localStorage.setItem(CACHE_KEY, safeStringify(limited));
      } else {
        localStorage.setItem(CACHE_KEY, safeStringify(parsed));
      }
    } catch (err) {
      console.warn('Failed to cache replay:', err);
    }
  }, []);

  const generateReplay = useCallback(async (params: GenerateReplayParams) => {
    setLoading(true);
    setError(null);

    // Track analytics
    trackEvent('replay:generate:start', { mode: params.mode || 'fast' });

    // Create a deterministic ID from params for caching
    const cacheId = `${params.seed}_${params.commanderId}_${params.mapConfig.type}`;
    
    // Check cache first
    const cached = loadFromCache(cacheId);
    if (cached) {
      setMetadata(cached);
      setLoading(false);
      toast({
        title: "Replay loaded from cache",
        description: "Using previously generated replay data.",
      });
      return cached;
    }

    // 30s timeout
    const timeoutId = setTimeout(() => {
      setError('Generation timeout - try fast mode');
      setLoading(false);
      trackEvent('replay:generate:timeout', { mode: params.mode });
      toast({
        title: "Generation timeout",
        description: "Try using fast mode for quicker results.",
        variant: "destructive",
      });
    }, 30000);

    try {
      // Use mock API in development, Supabase edge function in production
      const useMock = import.meta.env.VITE_USE_REPLAY_MOCK === 'true';
      
      let replayData: ReplayMetadata;
      
      if (useMock) {
        // In mock mode, use relative path that mock server intercepts
        const response = await fetch('/api/replay/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to generate replay');
        }

        replayData = await response.json();
      } else {
        // In production, use Supabase edge function
        try {
          const { data, error } = await supabase.functions.invoke('replay-handler/generate', {
            method: 'POST',
            body: params,
          });

          clearTimeout(timeoutId);

          if (error) {
            console.error('Supabase function error:', error);
            // Fallback to mock API
            console.warn('Falling back to mock replay API - Supabase functions not available');
            const mockResponse = await fetch('/api/replay/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params),
            });
            if (!mockResponse.ok) throw new Error('Mock API also failed');
            replayData = await mockResponse.json();
          } else {
            replayData = data;
          }
        } catch (err) {
          clearTimeout(timeoutId);
          console.error('Failed to generate replay, trying mock API:', err);
          // Fallback to mock API
          try {
            const mockResponse = await fetch('/api/replay/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params),
            });
            if (!mockResponse.ok) throw new Error('Mock API also failed');
            replayData = await mockResponse.json();
          } catch (mockErr) {
            throw err; // Throw original error if mock also fails
          }
        }
      }
      
      // Save to cache
      saveToCache(cacheId, replayData);
      
      setMetadata(replayData);
      trackEvent('replay:generate:success', { replayId: replayData.replayId });
      toast({
        title: "Replay generated successfully",
        description: "Judge-ready replay artifact is ready for download.",
      });

      return replayData;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate replay';
      setError(errorMsg);
      trackEvent('replay:generate:fail', { error: errorMsg });
      toast({
        title: "Generation failed",
        description: errorMsg,
        variant: "destructive",
      });
      
      // Load sample replay as fallback
      try {
        const sampleResponse = await fetch('/fixtures/sample-replay.json');
        const sampleData = await sampleResponse.json();
        setMetadata(sampleData);
        toast({
          title: "Using sample replay",
          description: "Loaded demo replay for preview.",
        });
        return sampleData;
      } catch {
        return null;
      }
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache]);

  const fetchReplay = useCallback(async (replayId: string) => {
    try {
      const useMock = import.meta.env.VITE_USE_REPLAY_MOCK === 'true';
      
      let data: ReplayMetadata;
      
      if (useMock) {
        const response = await fetch(`/api/replay/${replayId}`);
        if (!response.ok) throw new Error('Failed to fetch replay');
        data = await response.json();
      } else {
        try {
          const { data: supabaseData, error } = await supabase.functions.invoke(`replay-handler/${replayId}`, {
            method: 'GET',
          });

          if (error) {
            console.error('Supabase function error:', error);
            // Fallback to mock API
            console.warn('Falling back to mock replay API - Supabase functions not available');
            const mockResponse = await fetch(`/api/replay/${replayId}`);
            if (!mockResponse.ok) throw new Error('Mock API also failed');
            data = await mockResponse.json();
          } else {
            data = supabaseData;
          }
        } catch (err) {
          console.error('Failed to fetch replay, trying mock API:', err);
          // Fallback to mock API
          try {
            const mockResponse = await fetch(`/api/replay/${replayId}`);
            if (!mockResponse.ok) throw new Error('Mock API also failed');
            data = await mockResponse.json();
          } catch (mockErr) {
            throw err; // Throw original error if mock also fails
          }
        }
      }

      setMetadata(data);
      return data;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch replay';
      setError(errorMsg);
      toast({
        title: "Failed to fetch replay",
        description: errorMsg,
        variant: "destructive",
      });
      return null;
    }
  }, []);

  const downloadReplay = useCallback(async (replayId: string, url?: string) => {
    try {
      const useMock = import.meta.env.VITE_USE_REPLAY_MOCK === 'true';
      
      trackEvent('replay:download', { replayId });
      
      let downloadUrl: string;
      
      if (useMock) {
        // In mock mode, use relative path
        downloadUrl = url || `/api/replay/${replayId}/download`;
      } else {
        // In production, use Supabase edge function
        if (url) {
          downloadUrl = url;
        } else {
          // Fetch the download URL (Supabase will return the signed URL)
          const { data, error } = await supabase.functions.invoke(`replay-handler/${replayId}/download`, {
            method: 'GET',
          });

          if (error) {
            throw new Error(error.message || 'Failed to get download URL');
          }

          downloadUrl = data?.url || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/replay-handler/${replayId}/download`;
        }
      }
      
      // Try direct download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `replay-${replayId}.json.gz`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Replay downloading",
        description: "Judge-ready replay artifact saved.",
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Download failed';
      toast({
        title: "Download failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }, []);

  const shareReplay = useCallback(async (replayId: string, url?: string) => {
    const shareUrl = url || `${window.location.origin}/replay/${replayId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Replay permalink copied to clipboard.",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  }, []);

  return {
    metadata,
    loading,
    error,
    generateReplay,
    fetchReplay,
    downloadReplay,
    shareReplay,
  };
}

