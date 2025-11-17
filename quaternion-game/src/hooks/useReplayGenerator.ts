import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

// Analytics helper
function trackEvent(event: string, data?: any) {
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({ event, ...data });
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
    data: any;
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
        entries.sort((a: any, b: any) => b[1].cachedAt - a[1].cachedAt);
        const limited = Object.fromEntries(entries.slice(0, MAX_CACHE_SIZE));
        localStorage.setItem(CACHE_KEY, JSON.stringify(limited));
      } else {
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
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

      const data: ReplayMetadata = await response.json();
      
      // Save to cache
      saveToCache(cacheId, data);
      
      setMetadata(data);
      trackEvent('replay:generate:success', { replayId: data.replayId });
      toast({
        title: "Replay generated successfully",
        description: "Judge-ready replay artifact is ready for download.",
      });

      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      const errorMsg = err.message || 'Failed to generate replay';
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
      const response = await fetch(`/api/replay/${replayId}`);
      if (!response.ok) throw new Error('Failed to fetch replay');
      
      const data = await response.json();
      setMetadata(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Failed to fetch replay",
        description: err.message,
        variant: "destructive",
      });
      return null;
    }
  }, []);

  const downloadReplay = useCallback(async (replayId: string, url?: string) => {
    try {
      const downloadUrl = url || `/api/replay/${replayId}/download`;
      
      trackEvent('replay:download', { replayId });
      
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
    } catch (err: any) {
      toast({
        title: "Download failed",
        description: err.message,
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

