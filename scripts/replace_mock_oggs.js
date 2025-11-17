#!/usr/bin/env node
/**
 * Batch script to replace mock OGG files with real TTS outputs
 * 
 * Usage:
 *   node scripts/replace_mock_oggs.js [--api-url=http://localhost:3000/api/ai/tts] [--mock]
 * 
 * Options:
 *   --api-url: URL to your TTS API endpoint (default: http://localhost:3000/api/ai/tts)
 *   --mock: Use mock mode (returns placeholder audio)
 */

const fs = require('fs');
const path = require('path');

const OUTDIR = path.join(__dirname, '..', 'voices_to_tts');
const MAPPING_FILE = path.join(OUTDIR, 'mapping.json');

// Parse command line args
const args = process.argv.slice(2);
const apiUrl = args.find(arg => arg.startsWith('--api-url='))?.split('=')[1] || 'http://localhost:3000/api/ai/tts';
const useMock = args.includes('--mock');

async function fetchTTS(ssmlContent, voice) {
  const body = {
    text: ssmlContent,
    voice: voice,
    ssml: true,
    mock: useMock
  };

  console.log(`Fetching TTS for ${voice}...`);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS API error (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Error fetching TTS for ${voice}:`, error.message);
    throw error;
  }
}

async function replaceMockOggs() {
  if (!fs.existsSync(OUTDIR)) {
    console.error(`Error: ${OUTDIR} does not exist. Run make_voices_to_tts.sh first.`);
    process.exit(1);
  }

  if (!fs.existsSync(MAPPING_FILE)) {
    console.error(`Error: ${MAPPING_FILE} not found.`);
    process.exit(1);
  }

  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  
  console.log(`Found ${mapping.length} voice files to process`);
  console.log(`API URL: ${apiUrl}`);
  console.log(`Mock mode: ${useMock ? 'ON' : 'OFF'}\n`);

  for (const item of mapping) {
    const ssmlPath = path.join(OUTDIR, item.ssml_file);
    const oggPath = path.join(OUTDIR, item.mock_audio);

    if (!fs.existsSync(ssmlPath)) {
      console.warn(`Warning: ${ssmlPath} not found, skipping ${item.id}`);
      continue;
    }

    const ssmlContent = fs.readFileSync(ssmlPath, 'utf8');
    
    try {
      const audioBuffer = await fetchTTS(ssmlContent, item.recommended_voice);
      fs.writeFileSync(oggPath, audioBuffer);
      console.log(`✓ Replaced ${item.mock_audio} (${audioBuffer.length} bytes)`);
    } catch (error) {
      console.error(`✗ Failed to replace ${item.mock_audio}:`, error.message);
      // Continue with other files
    }
  }

  console.log('\nDone! All mock OGG files have been replaced.');
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('Error: This script requires Node.js 18+ (for native fetch support)');
  console.error('Alternatively, install node-fetch: npm install node-fetch');
  process.exit(1);
}

replaceMockOggs().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

