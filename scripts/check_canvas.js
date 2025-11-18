// PATCHED BY CURSOR - 2024-12-19 - safe bootstrap & debug
// scripts/check_canvas.js
//
// Small tool to validate canvas id in returned HTML.

const http = require('http');
const https = require('https');
const { URL } = require('url');

const url = process.argv[2] || 'http://localhost:3000';

console.log('[QUAT DEBUG] Checking canvas at', url);

const urlObj = new URL(url);
const client = urlObj.protocol === 'https:' ? https : http;

const options = {
  hostname: urlObj.hostname,
  port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
  path: urlObj.pathname + urlObj.search,
  method: 'GET',
  headers: {
    'User-Agent': 'Quaternion-Canvas-Checker/1.0',
  },
};

const req = client.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`ERROR: Server returned ${res.statusCode}`);
      process.exit(1);
    }

    console.log('✓ Server responded with status', res.statusCode);

    // Check for canvas
    if (data.includes('id="game-canvas"')) {
      console.log('✓ Canvas element with id="game-canvas" found in HTML');
    } else if (data.toLowerCase().includes('canvas')) {
      console.log('⚠ Canvas element found but without id="game-canvas"');
    } else {
      console.log('⚠ No canvas element in initial HTML (may be created by React)');
    }

    // Check for React root
    if (data.includes('id="root"')) {
      console.log('✓ React root element found');
    } else {
      console.log('⚠ React root element not found');
    }

    // Check for main script
    if (data.includes('/src/main')) {
      console.log('✓ Main script reference found');
    } else {
      console.log('⚠ Main script reference not found');
    }

    console.log('\nCanvas check complete.');
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
  console.error('Make sure dev server is running: npm run dev');
  process.exit(1);
});

req.end();
