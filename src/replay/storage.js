/**
 * Storage manager for replay artifacts
 * Handles compression, storage, and signed URL generation
 */

import zlib from 'zlib';
import { promisify } from 'util';
import { supabase } from '../integrations/supabase/client';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Compress replay data to gzip
 */
export async function compressReplay(replayData) {
  const jsonStr = JSON.stringify(replayData, null, 2);
  const compressed = await gzip(Buffer.from(jsonStr, 'utf-8'));
  
  const sizeKB = (compressed.length / 1024).toFixed(2);
  console.log(`Replay compressed to ${sizeKB}KB`);
  
  return {
    compressed,
    sizeBytes: compressed.length,
    sizeKB: parseFloat(sizeKB)
  };
}

/**
 * Decompress replay data
 */
export async function decompressReplay(compressedData) {
  const decompressed = await gunzip(compressedData);
  const jsonStr = decompressed.toString('utf-8');
  return JSON.parse(jsonStr);
}

/**
 * Store replay in Supabase Storage
 */
export async function storeReplay(replayId, compressedData) {
  const path = `${replayId}.json.gz`;
  
  const { data, error } = await supabase.storage
    .from('replays')
    .upload(path, compressedData, {
      contentType: 'application/gzip',
      cacheControl: '604800', // 7 days
      upsert: true
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Create signed URL valid for 7 days
  const { data: urlData, error: urlError } = await supabase.storage
    .from('replays')
    .createSignedUrl(path, 604800);

  if (urlError) {
    throw new Error(`Failed to create signed URL: ${urlError.message}`);
  }

  return {
    path,
    signedUrl: urlData.signedUrl,
    expiresIn: 604800
  };
}

/**
 * Retrieve replay from storage
 */
export async function retrieveReplay(replayId) {
  const path = `${replayId}.json.gz`;
  
  const { data, error } = await supabase.storage
    .from('replays')
    .download(path);

  if (error) {
    throw new Error(`Failed to download replay: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  return await decompressReplay(buffer);
}

/**
 * Get download URL for replay
 */
export async function getDownloadUrl(replayId) {
  const path = `${replayId}.json.gz`;
  
  const { data, error } = await supabase.storage
    .from('replays')
    .createSignedUrl(path, 604800);

  if (error) {
    throw new Error(`Failed to create download URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Check if replay size exceeds limit
 */
export function checkSizeLimit(sizeBytes, limitMB = 1) {
  const limitBytes = limitMB * 1024 * 1024;
  return {
    withinLimit: sizeBytes <= limitBytes,
    sizeBytes,
    limitBytes,
    sizeKB: (sizeBytes / 1024).toFixed(2),
    limitKB: (limitBytes / 1024).toFixed(2)
  };
}

/**
 * In-memory fallback storage
 */
const memoryStore = new Map();

export const fallbackStorage = {
  async store(replayId, data) {
    memoryStore.set(replayId, data);
    return { path: `memory://${replayId}`, signedUrl: null };
  },
  
  async retrieve(replayId) {
    const data = memoryStore.get(replayId);
    if (!data) {
      throw new Error('Replay not found in fallback storage');
    }
    return data;
  },
  
  has(replayId) {
    return memoryStore.has(replayId);
  },
  
  clear() {
    memoryStore.clear();
  }
};
