// src/hooks/useReplay.js
// Hook that encapsulates replay generation, preview fetch, download and caching.
// Usage: const { state, generateReplay, getReplay, downloadReplay, shareReplay } = useReplay();

import { useState, useCallback } from 'react';
import { safeStringify } from '@/utils/safeJSON';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const LOCAL_CACHE_KEY = 'quaternion_last_replays_v1';
const CACHE_MAX = 5;
const DEFAULT_TIMEOUT_MS = 30000; // 30s

function saveToCache(metadata) {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    // Prepend and dedupe by replayId
    const filtered = [metadata, ...arr.filter(a => a.replayId !== metadata.replayId)];
    localStorage.setItem(LOCAL_CACHE_KEY, safeStringify(filtered.slice(0, CACHE_MAX)));
  } catch (e) {
    // no-op
  }
}

function getCachedList() {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  opts.signal = controller.signal;
  try {
    const res = await fetch(url, opts);
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export default function useReplay() {
  const [state, setState] = useState({
    loading: false,
    error: null,
    metadata: null,
    timedOut: false,
  });

  const generateReplay = useCallback(async (payload = {}) => {
    setState(s => ({ ...s, loading: true, error: null, timedOut: false }));
    try {
      const url = `${API_BASE}/api/replay/generate`;
      const body = JSON.stringify(payload);
      // Try fetch with timeout
      let res;
      try {
        res = await fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }, DEFAULT_TIMEOUT_MS);
      } catch (err) {
        // timeout or other network error
        setState(s => ({ ...s, loading: false, timedOut: err.name === 'AbortError', error: err.message || String(err) }));
        return null;
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const message = errBody.message || `Server error ${res.status}`;
        setState(s => ({ ...s, loading: false, error: message }));
        return null;
      }
      const json = await res.json();
      if (json && json.replayId) {
        saveToCache(json);
        setState(s => ({ ...s, loading: false, metadata: json, timedOut: false }));
        return json;
      } else {
        setState(s => ({ ...s, loading: false, error: 'Invalid response' }));
        return null;
      }
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: err.message || String(err) }));
      return null;
    }
  }, []);

  const getReplay = useCallback(async (replayId) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`${API_BASE}/api/replay/${encodeURIComponent(replayId)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setState(s => ({ ...s, loading: false, error: err.message || `Error ${res.status}` }));
        return null;
      }
      const json = await res.json();
      saveToCache(json);
      setState(s => ({ ...s, loading: false, metadata: json }));
      return json;
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: err.message || String(err) }));
      return null;
    }
  }, []);

  const downloadReplay = useCallback(async (replayMeta) => {
    // replayMeta: the metadata returned from generate/get (contains url)
    if (!replayMeta || !replayMeta.url) {
      throw new Error('No replay URL available');
    }
    // try to open in new tab first (preferable for signed URL)
    try {
      const win = window.open(replayMeta.url, '_blank', 'noopener');
      if (win) return true;
    } catch (e) {
      // fallback to fetch + blob download
    }
    // Fallback: fetch blob and download
    const res = await fetch(replayMeta.url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const blob = await res.blob();
    const filename = `replay-${replayMeta.replayId}.json.gz`;
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
    return true;
  }, []);

  const shareReplay = useCallback(async (replayMeta) => {
    if (!replayMeta) throw new Error('No replay metadata to share');
    // prefer signed URL
    const toCopy = replayMeta.url || `${API_BASE}/replay/${replayMeta.replayId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(toCopy);
      return true;
    } else {
      // fallback to popup prompt
      window.prompt('Copy replay link', toCopy);
      return false;
    }
  }, []);

  const getCached = useCallback(() => getCachedList(), []);

  return {
    state,
    generateReplay,
    getReplay,
    downloadReplay,
    shareReplay,
    getCached,
  };
}


