// scripts/check_canvas.js
// Node script: fetches root page and reports presence of canvas id (basic smoke)

const http = require('http');
const https = require('https');

(async () => {
  const url = process.argv[2] || 'http://localhost:3000';
  console.log('[QUAT DEBUG] checking', url);
  
  const fetchUrl = (urlString) => {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(urlString);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      client.get(urlString, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(data);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  };
  
  try {
    const txt = await fetchUrl(url);
    if (txt.indexOf('game-canvas') !== -1) {
      console.log('[QUAT DEBUG] page contains marker #game-canvas');
    } else {
      console.warn('[QUAT DEBUG] marker not found — canvas likely mounted client-side');
    }
  } catch (e) {
    console.error('[QUAT DEBUG] fetch failed', e.message);
  }
})();

