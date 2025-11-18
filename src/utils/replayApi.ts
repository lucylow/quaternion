// src/utils/replayApi.ts
//
// Mocked replay API for frontend dev.
// When VITE_USE_REPLAY_MOCK === "true", these functions return deterministic-ish
// mock artifacts from public/fixtures/*.json and persist generated metadata to localStorage.
//
// Exports:
//   - generateReplay(payload)  // { seed, mapConfig, commanderId, mode }
//   - getReplay(replayId)
//   - downloadReplay(meta)      // attempts to open meta.url, falls back to fetching blob
//
// Usage:
// import * as replayApi from '../utils/replayApi';
// const meta = await replayApi.generateReplay({ seed, mapConfig, commanderId, mode: 'fast' });

import type { ReplayMetadata, ReplayData } from '@/lib/replayClient';
import { safeStringify } from '@/utils/safeJSON';

const MOCK_ENABLED = (import.meta.env.VITE_USE_REPLAY_MOCK || '').toLowerCase() === 'true';
const STORAGE_KEY = 'mock_replay_store_v1';
const MIN_LATENCY = 200; // ms
const MAX_LATENCY = 1200; // ms

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

function nowISOString(): string {
  return new Date().toISOString();
}

function makeId(): string {
  // cheap unique-ish id (ok for mock)
  return 'm' + (Date.now().toString(36)) + '-' + Math.random().toString(36).slice(2, 9);
}

interface MockStore {
  [replayId: string]: {
    metadata: ReplayMetadata;
    fixture: any;
  };
}

function loadStore(): MockStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveStore(store: MockStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, safeStringify(store));
  } catch (e) {
    // ignore
  }
}

async function fetchFixtureJson(path: string): Promise<any> {
  // path should be relative to / (e.g., '/fixtures/full-replay.json')
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Fixture fetch failed ${res.status}`);
  return res.json();
}

function chooseFixtureFile(seed: number): string {
  // 1-in-8 chance to return partial fixture; otherwise full
  const partialChance = 1 / 8;
  if (typeof seed === 'number' && Math.abs(seed) % 8 === 0) {
    // deterministic partial for seeds divisible by 8
    return '/fixtures/partial-replay.json';
  }
  return Math.random() < partialChance ? '/fixtures/partial-replay.json' : '/fixtures/full-replay.json';
}

interface GenerateReplayPayload {
  seed: number;
  mapConfig: any;
  commanderId: string;
  mode?: 'full' | 'fast';
  runtime?: {
    maxTicks?: number;
    maxDurationSec?: number;
  };
}

/**
 * generateReplay(payload)
 * - payload: { seed:number, mapConfig:object, commanderId:string, mode?: 'full'|'fast' }
 * - returns metadata object compatible with backend contract:
 *   { replayId, url, summary, aiHighlights, meta: { engineCommit, partial, contentHash }, ... }
 */
export async function generateReplay(payload: GenerateReplayPayload = {}): Promise<ReplayMetadata> {
  if (!MOCK_ENABLED) {
    // Consumer should call real backend
    throw new Error('Mock disabled - set VITE_USE_REPLAY_MOCK=true to use mock');
  }

  // simulate network latency
  await delay(randInt(MIN_LATENCY, MAX_LATENCY));

  const { seed = 0, mapConfig = {}, commanderId = 'mock_commander', mode = 'fast' } = payload;
  const fixturePath = chooseFixtureFile(seed);

  // fetch fixture JSON from public/fixtures
  let fixture: any;
  try {
    fixture = await fetchFixtureJson(fixturePath);
  } catch (err) {
    // fallback: minimal generated metadata
    fixture = {
      replayId: 'fixture-000',
      seed,
      mapConfig,
      commanderId,
      startTime: nowISOString(),
      endTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      durationSec: 300,
      finalOutcome: 'partial',
      summary: 'Mock fallback replay.',
      aiHighlights: [],
      actions: [],
      meta: { version: 'v1', engineCommit: 'mock', generatedBy: 'replay-mock', contentHash: '' },
      partial: true
    };
  }

  // mutate fixture deterministically for payload
  const replayId = makeId();
  fixture.replayId = replayId;
  fixture.seed = seed;
  fixture.mapConfig = mapConfig;
  fixture.commanderId = commanderId;
  fixture.startTime = nowISOString();
  fixture.endTime = new Date(Date.now() + (fixture.durationSec || 300) * 1000).toISOString();
  fixture.meta = fixture.meta || {};
  fixture.meta.generatedBy = 'replay-mock';
  fixture.meta.engineCommit = fixture.meta.engineCommit || 'mock';
  fixture.meta.version = fixture.meta.version || 'v1';
  fixture.meta.contentHash = fixture.meta.contentHash || (Math.random().toString(16).slice(2, 10));
  
  // if mode === 'fast', condense actions
  if (mode === 'fast' && Array.isArray(fixture.actions)) {
    fixture.actions = fixture.actions.slice(-80);
  }

  // Determine partial flag:
  if (!fixture.partial) {
    // keep partial if fixture had it; otherwise random deterministic-ish for seed 0 etc.
    if (typeof seed === 'number' && Math.abs(seed) % 7 === 0) fixture.partial = true;
  }

  // Build outward metadata that frontend expects from POST /api/replay/generate
  // For mock we point url to the fixture JSON (non-gz) so frontend can open it directly.
  const base = window.location.origin || '';
  const url = `${base}${fixturePath}`; // e.g., https://localhost:3000/fixtures/full-replay.json

  // Convert actions format if needed (timestamp -> t)
  const actions = (fixture.actions || []).map((action: any) => ({
    t: action.timestamp || action.t || 0,
    actor: action.actor || 'Player',
    type: action.type || 'unknown',
    payload: action.data || action.payload || {},
    reason: action.reason || ''
  }));

  const metadata: ReplayMetadata = {
    replayId,
    seed: fixture.seed,
    mapConfig: fixture.mapConfig,
    commanderId: fixture.commanderId,
    startTime: fixture.startTime,
    endTime: fixture.endTime,
    durationSec: fixture.durationSec || 0,
    finalOutcome: (fixture.finalOutcome || (fixture.partial ? 'partial' : 'unknown')) as 'victory' | 'defeat' | 'draw',
    summary: fixture.summary || 'Mock-generated replay.',
    aiHighlights: fixture.aiHighlights || [],
    partial: !!fixture.partial,
    url
  };

  // persist to localStorage map for retrieval by getReplay
  const store = loadStore();
  store[replayId] = { metadata, fixture: { ...fixture, actions } };
  saveStore(store);

  return metadata;
}

/**
 * getReplay(replayId)
 * - returns metadata if found in mock store
 * - else tries to return a fixture (best effort)
 */
export async function getReplay(replayId: string): Promise<ReplayData | null> {
  if (!MOCK_ENABLED) {
    throw new Error('Mock disabled - set VITE_USE_REPLAY_MOCK=true to use mock');
  }
  await delay(randInt(MIN_LATENCY / 2, MIN_LATENCY)); // shorter latency for preview
  const store = loadStore();
  if (store[replayId]) {
    const { fixture } = store[replayId];
    return {
      ...store[replayId].metadata,
      actions: fixture.actions || [],
      stateDeltas: fixture.stateDeltas || [],
      meta: fixture.meta || { version: 'v1', engineCommit: 'mock', generatedBy: 'replay-mock' }
    } as ReplayData;
  }

  // fallback: return a default fixture as preview
  try {
    const fixture = await fetchFixtureJson('/fixtures/full-replay.json');
    const actions = (fixture.actions || []).map((action: any) => ({
      t: action.timestamp || action.t || 0,
      actor: action.actor || 'Player',
      type: action.type || 'unknown',
      payload: action.data || action.payload || {},
      reason: action.reason || ''
    }));

    const metadata: ReplayData = {
      replayId: 'fixture-preview',
      seed: fixture.seed || 0,
      mapConfig: fixture.mapConfig || {},
      commanderId: fixture.commanderId || 'mock',
      startTime: fixture.startTime || nowISOString(),
      endTime: fixture.endTime || nowISOString(),
      durationSec: fixture.durationSec || 0,
      finalOutcome: (fixture.finalOutcome || 'partial') as 'victory' | 'defeat' | 'draw',
      summary: fixture.summary || 'Sample preview',
      aiHighlights: fixture.aiHighlights || [],
      actions,
      stateDeltas: fixture.stateDeltas || [],
      meta: fixture.meta || { engineCommit: 'mock', version: 'v1', generatedBy: 'replay-mock' },
      partial: !!fixture.partial,
      url: `${window.location.origin}/fixtures/full-replay.json`
    };
    return metadata;
  } catch (e) {
    return null;
  }
}

/**
 * downloadReplay(meta)
 * - Attempts to open meta.url in a new tab; if popup blocked, fetches blob and triggers download.
 * - Returns true on success.
 */
export async function downloadReplay(meta: ReplayMetadata): Promise<boolean> {
  if (!MOCK_ENABLED) {
    throw new Error('Mock disabled - set VITE_USE_REPLAY_MOCK=true to use mock');
  }
  if (!meta || !meta.url) throw new Error('No replay url');

  // Try open in new tab (signed URL path); this is simplest for dev
  try {
    const w = window.open(meta.url, '_blank', 'noopener');
    if (w) return true;
  } catch (e) {
    // ignore
  }

  // fallback: fetch and download blob
  const res = await fetch(meta.url);
  if (!res.ok) throw new Error('Failed to download fixture');
  const blob = await res.blob();
  const filename = `replay-${meta.replayId}.json`;
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
  return true;
}

// Export functions for use in frontend hooks
export default {
  generateReplay,
  getReplay,
  downloadReplay,
};


