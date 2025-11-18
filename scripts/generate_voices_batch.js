// scripts/generate_voices_batch.js
// Usage:
//   TTS_PROXY_URL=http://localhost:3000/generate-tts node scripts/generate_voices_batch.js
// or (direct - ensure API key is set - not recommended in client or public CI):
//   ELEVENLABS_API_KEY=sk-... ELEVENLABS_API_URL=https://api.elevenlabs.io/v1/text-to-speech node scripts/generate_voices_batch.js

const fs = require('fs');
const path = require('path');
const axios = require('axios').default;
const pLimit = require('p-limit');

const OUT_DIR = path.resolve(__dirname, '../public/audio/voices');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const VOICES_FILE = path.resolve(__dirname, '../voices_to_tts/ssml.json');
const MONSTER_FILE = path.resolve(__dirname, '../voices_to_tts/monster_sfx.json');
const INTRO_FILE = path.resolve(__dirname, '../voices_to_tts/cinematic_intro.ssml');

const proxyUrl = process.env.TTS_PROXY_URL || null; // e.g. http://localhost:3000/generate-tts
const apiKey = process.env.ELEVENLABS_API_KEY || null;
const apiBaseUrl = process.env.ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1/text-to-speech';
const format = 'ogg'; // output format
const concurrency = parseInt(process.env.TTS_CONCURRENCY || '3', 10);

async function postTTSDirect(voiceId, body) {
  // Direct to ElevenLabs API (assumes endpoint: /v1/text-to-speech/{voiceId})
  const url = `${apiBaseUrl}/${encodeURIComponent(voiceId)}`;
  const headers = {
    'xi-api-key': apiKey, // ElevenLabs sometimes uses xi-api-key, sometimes Authorization; user should check and set env accordingly
    'Content-Type': 'application/json'
  };
  return axios.post(url, body, {
    responseType: 'arraybuffer',
    headers
  });
}

async function postTTSProxy(body) {
  if (!proxyUrl) throw new Error('TTS_PROXY_URL not set');
  return axios.post(proxyUrl, body, { responseType: 'arraybuffer' });
}

async function generateItem(item) {
  try {
    console.log('Generating:', item.filename);
    const payload = item.ssml ? { ssml: item.ssml } : { text: item.text };
    // include voice & format info
    payload.voiceId = item.voiceId;
    payload.format = format;

    let resp;
    if (proxyUrl) {
      resp = await postTTSProxy(payload);
    } else {
      if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set for direct mode');
      // some APIs accept body: { input: { ssml } , voice: voiceId, audio: { format } }
      const directBody = item.ssml ? { input: { ssml: item.ssml } } : { input: { text: item.text } };
      directBody.voice = item.voiceId;
      directBody.audio = { format };
      resp = await postTTSDirect(item.voiceId, directBody);
    }

    const outPath = path.join(OUT_DIR, item.filename);
    fs.writeFileSync(outPath, Buffer.from(resp.data));
    console.log('Wrote', outPath);
    return { ok: true, file: outPath };
  } catch (err) {
    console.error('Failed', item.filename, err.message || err);
    return { ok: false, error: String(err) };
  }
}

async function run() {
  const voices = JSON.parse(fs.readFileSync(VOICES_FILE, 'utf8'));
  const monsters = JSON.parse(fs.readFileSync(MONSTER_FILE, 'utf8'));
  const introSSML = fs.existsSync(INTRO_FILE) ? fs.readFileSync(INTRO_FILE, 'utf8') : null;

  // build list
  const items = [...voices, ...monsters];
  if (introSSML) {
    items.unshift({
      id: 'cinematic_intro',
      voiceId: 'lian-voice',
      filename: 'cinematic_intro.ogg',
      ssml: introSSML
    });
  }

  console.log('Will generate', items.length, 'audio files with concurrency', concurrency);
  const limit = pLimit(concurrency);
  const tasks = items.map(it => limit(() => generateItem(it)));
  const results = await Promise.all(tasks);

  const failed = results.filter(r => !r.ok);
  console.log('Complete. Success:', results.length - failed.length, 'Failed:', failed.length);
  if (failed.length) {
    console.log('Failed items:', failed);
  }

  // optional: create index manifest
  const manifest = items.map(it => ({ id: it.id, filename: it.filename }));
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Wrote manifest.json');
}

run().catch(err => {
  console.error('Batch script error', err);
  process.exit(1);
});

