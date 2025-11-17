// src/replay/exporter.js
// Minimal exporter stub.
// - For quick integration: reads a sample replay JSON fixture, canonicalizes JSON, gzips it, saves to S3 (if configured) or local storage.
// - Produces metadata matching the frontend contract and returns a signed URL (or local file link).
//
// Configure via env:
//  - S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (optional)
//  - STORAGE_LOCAL_PATH (fallback, e.g., ./data/replays)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);
const { v4: uuidv4 } = require('uuid');

// Try multiple possible fixture locations
const SAMPLE_FIXTURE = [
  path.join(__dirname, '..', 'fixtures', 'sample-replay.json'),
  path.join(__dirname, '..', '..', 'tests', 'fixtures', 'sample-replay.json'),
  path.join(__dirname, '..', '..', 'src', 'fixtures', 'sample-replay.json'),
].find(p => fs.existsSync(p)) || path.join(__dirname, '..', '..', 'tests', 'fixtures', 'sample-replay.json');
const LOCAL_STORAGE_PATH = process.env.STORAGE_LOCAL_PATH || path.join(__dirname, '..', '..', 'data', 'replays');

// S3 client (optional)
let s3Client = null;
let s3Bucket = process.env.S3_BUCKET;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && s3Bucket) {
  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
  } catch (e) {
    console.warn('AWS SDK not installed, S3 uploads disabled');
  }
}

// Helper: canonical JSON (sorted keys)
function canonicalize(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

async function ensureLocalDir() {
  await fs.promises.mkdir(LOCAL_STORAGE_PATH, { recursive: true });
}

// Upload stream to S3 using Upload (stream support)
async function uploadStreamToS3(key, readStream, contentLength) {
  const { Upload } = require('@aws-sdk/lib-storage');
  const { PutObjectCommand } = require('@aws-sdk/client-s3');

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: s3Bucket,
      Key: key,
      Body: readStream,
      ContentType: 'application/gzip',
    },
  });

  const result = await upload.done();
  // Generate signed URL (7 days)
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: s3Bucket, Key: key }), { expiresIn: 60 * 60 * 24 * 7 });
  return signedUrl;
}

async function uploadStreamToLocal(key, readStream) {
  await ensureLocalDir();
  const outPath = path.join(LOCAL_STORAGE_PATH, key);
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  const outStream = fs.createWriteStream(outPath);
  await pipeline(readStream, outStream);
  const abs = outPath;
  // For development: return a file:// link (not ideal in production)
  return `file://${abs}`;
}

async function saveGzippedReplayBuffer(buffer, key) {
  // buffer is gzipped already
  if (s3Client && s3Bucket) {
    // send to S3 via stream
    const { Readable } = require('stream');
    const rs = Readable.from(buffer);
    const url = await uploadStreamToS3(key, rs, buffer.length);
    return url;
  } else {
    await ensureLocalDir();
    const outPath = path.join(LOCAL_STORAGE_PATH, key);
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
    await fs.promises.writeFile(outPath, buffer);
    return `file://${path.resolve(outPath)}`;
  }
}

async function generateAndUpload({ seed, mapConfig, commanderId, mode = 'fast' }) {
  // For this stub, load sample fixture and substitute seed/commanderId/mapConfig in meta so it's deterministic-ish.
  let fixture;
  try {
    const fixtureRaw = await fs.promises.readFile(SAMPLE_FIXTURE, 'utf8');
    fixture = JSON.parse(fixtureRaw);
  } catch (e) {
    // Fallback to minimal fixture if file doesn't exist
    fixture = {
      replayId: 'sample-0001',
      seed: 12345,
      mapConfig: { type: 'jagged_island', width: 64, height: 64 },
      commanderId: 'cautious_geologist',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
      durationSec: 300,
      finalOutcome: 'victory',
      summary: 'Sample replay for development/testing.',
      aiHighlights: [],
      actions: [],
      stateDeltas: [],
      meta: { version: 'v1', engineCommit: 'dev', generatedBy: 'sample', contentHash: '' },
      partial: false
    };
  }

  // patch some fields
  const now = new Date().toISOString();
  fixture.replayId = uuidv4();
  fixture.seed = seed;
  fixture.mapConfig = mapConfig;
  fixture.commanderId = commanderId;
  fixture.startTime = now;
  fixture.endTime = new Date(Date.now() + 1000 * 60 * 5).toISOString(); // 5 minutes later
  fixture.durationSec = 60 * 5;
  fixture.meta = fixture.meta || {};
  fixture.meta.generatedBy = 'quaternion-replay-exporter-stub-v0.1';
  fixture.meta.engineCommit = getGitSha() || 'dev';
  fixture.meta.version = 'v1';

  // If mode=fast, truncate some arrays to keep artifact small
  if (mode === 'fast') {
    fixture.actions = (fixture.actions || []).slice(-80);
    fixture.aiHighlights = (fixture.aiHighlights || []).slice(0, 6);
  }

  // canonicalize and gzip buffer
  const canonical = canonicalize(fixture);
  const contentHash = crypto.createHash('sha256').update(canonical).digest('hex');
  fixture.meta = fixture.meta || {};
  fixture.meta.contentHash = contentHash;

  const jsonStr = JSON.stringify(fixture);
  const gz = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'));

  // enforce size limit (1MB gzipped)
  const MAX_GZ = 1 * 1024 * 1024;
  let partial = false;
  let uploadBuffer = gz;
  if (gz.length > MAX_GZ) {
    partial = true;
    // naive truncation: keep first N bytes of JSON before gzipping - better to aggregate events before
    // For stub: create a minimal preview object instead
    const preview = {
      replayId: fixture.replayId,
      seed: fixture.seed,
      mapConfig: fixture.mapConfig,
      commanderId: fixture.commanderId,
      startTime: fixture.startTime,
      endTime: fixture.endTime,
      durationSec: fixture.durationSec,
      finalOutcome: fixture.finalOutcome || 'partial',
      summary: fixture.summary || 'Partial replay (truncated by exporter).',
      aiHighlights: fixture.aiHighlights?.slice(0, 3) || [],
      actions: fixture.actions?.slice(-12) || [],
      meta: fixture.meta,
      partial: true,
    };
    const previewStr = JSON.stringify(preview);
    uploadBuffer = zlib.gzipSync(Buffer.from(previewStr, 'utf8'));
  }

  // choose key
  const key = `replays/${fixture.replayId}.json.gz`;

  const url = await saveGzippedReplayBuffer(uploadBuffer, key);

  // metadata returned to user
  const metadata = {
    replayId: fixture.replayId,
    seed: fixture.seed,
    mapConfig: fixture.mapConfig,
    commanderId: fixture.commanderId,
    startTime: fixture.startTime,
    endTime: fixture.endTime,
    durationSec: fixture.durationSec,
    finalOutcome: fixture.finalOutcome || 'partial',
    summary: fixture.summary || 'Generated replay (stub).',
    aiHighlights: fixture.aiHighlights || [],
    meta: {
      version: fixture.meta.version,
      engineCommit: fixture.meta.engineCommit,
      generatedBy: fixture.meta.generatedBy,
      contentHash: fixture.meta.contentHash,
      nonDeterminism: null
    },
    partial,
    url
  };

  // Optionally store metadata to a simple index file for retrieval (local)
  await saveMetadataIndex(metadata);

  return metadata;
}

async function saveMetadataIndex(metadata) {
  // store minimal metadata locally for GET /:id
  const indexPath = path.join(LOCAL_STORAGE_PATH, 'index.json');
  try {
    await ensureLocalDir();
    let index = [];
    try {
      const raw = await fs.promises.readFile(indexPath, 'utf8');
      index = JSON.parse(raw);
    } catch (e) { index = []; }
    const filtered = [metadata, ...index.filter(i => i.replayId !== metadata.replayId)];
    await fs.promises.writeFile(indexPath, JSON.stringify(filtered.slice(0, 200), null, 2), 'utf8');
  } catch (e) {
    console.warn('saveMetadataIndex error', e);
  }
}

async function getMetadata(replayId) {
  const indexPath = path.join(LOCAL_STORAGE_PATH, 'index.json');
  try {
    const raw = await fs.promises.readFile(indexPath, 'utf8');
    const index = JSON.parse(raw);
    return index.find(i => i.replayId === replayId) || null;
  } catch (e) {
    return null;
  }
}

async function getDownloadStream(replayId) {
  // for local storage, return a readStream; for s3, create a presigned get stream (not implemented in stub)
  const key = `replays/${replayId}.json.gz`;
  if (s3Client && s3Bucket) {
    // If using S3, best approach is to presign and let client download directly. For server-streaming we'd need to getObject and pipe.
    // For this stub we'll return null (prefer presigned URLs via metadata.url)
    return null;
  } else {
    const outPath = path.join(LOCAL_STORAGE_PATH, key);
    if (!fs.existsSync(outPath)) return null;
    const s = fs.createReadStream(outPath);
    const stats = fs.statSync(outPath);
    return { stream: s, size: stats.size, filename: `replay-${replayId}.json.gz` };
  }
}

function getGitSha() {
  try {
    const cp = require('child_process');
    const sha = cp.execSync('git rev-parse HEAD', { cwd: path.join(__dirname, '..', '..'), stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    return sha;
  } catch (e) {
    return null;
  }
}

module.exports = {
  generateAndUpload,
  getMetadata,
  getDownloadStream,
  // exported for tests
  canonicalize,
};

