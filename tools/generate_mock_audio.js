#!/usr/bin/env node
// tools/generate_mock_audio.js
// Creates mock OGG placeholder files for SSML voice pack so AudioManager can demo playback locally.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(process.cwd(), 'public', 'assets', 'tts-mock');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const voices = [
  { id: 'lian_1', text: 'Hold the chokepoint — buy us time.' },
  { id: 'lian_2', text: 'We move when I say we move.' },
  { id: 'mara_1', text: 'Please — listen. It remembers more than we do.' },
  { id: 'mara_2', text: 'There must be another way.' },
  { id: 'patch_1', text: 'Alarms: loud. Morale: quieter than you, commander.' },
  { id: 'patch_2', text: 'Scanning... nothing helpful. Sending passive judgement.' }
];

function makeFakeOgg(size = 8192) {
  const header = Buffer.from('OggS');
  const payload = Buffer.alloc(size);
  return Buffer.concat([header, payload]);
}

voices.forEach(v => {
  const fname = path.join(outDir, `${v.id}.ogg`);
  fs.writeFileSync(fname, makeFakeOgg());
  console.log('Wrote', fname);
});

console.log('Mock TTS audio created at', outDir);

