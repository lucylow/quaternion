// src/scripts/batch_generate_tts.js
// Node script - run: node src/scripts/batch_generate_tts.js
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const PROXY = process.env.TTS_PROXY_URL || 'http://localhost:3001/generate-tts';
const OUT_DIR = path.resolve(__dirname, '../../public/audio/voices');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// load ssml inputs
const ssmlPath = path.resolve(__dirname, '../voices_to_tts/ssml.json');
if (!fs.existsSync(ssmlPath)) {
  console.error('SSML file not found at:', ssmlPath);
  process.exit(1);
}

const lines = require(ssmlPath); // array of {id, voiceId, ssml, filename}

(async () => {
  console.log(`Generating ${lines.length} TTS files...`);
  for (const row of lines) {
    const outPath = path.join(OUT_DIR, row.filename);
    console.log(`Generating ${row.filename}...`);
    
    try {
      const resp = await fetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          voiceId: row.voiceId, 
          ssml: row.ssml, 
          format: 'ogg' 
        })
      });
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`Failed to generate ${row.filename}:`, resp.status, errorText);
        continue;
      }
      
      const ab = await resp.arrayBuffer();
      fs.writeFileSync(outPath, Buffer.from(ab));
      console.log(`✓ Wrote ${outPath}`);
    } catch (error) {
      console.error(`Error generating ${row.filename}:`, error.message);
    }
  }
  console.log('Done!');
})();

