/**
 * Express server for quaternion-game
 * - serves built React app from ./dist (production)
 * - serves static files from ./public (if needed)
 * - SPA fallback to /index.html for client-side routing
 * - uses process.env.PORT or 3000
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

const PORT = process.env.PORT || 3000;

// Determine which directory to serve (prefer dist for built React app)
const DIST_DIR = path.join(__dirname, 'dist');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Check if dist directory exists (built React app)
const serveDir = fs.existsSync(DIST_DIR) ? DIST_DIR : PUBLIC_DIR;

console.log(`Serving from: ${serveDir}`);

// Security headers (basic)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
});

// JSON body parser for API routes
app.use(express.json());

// API Routes - must come BEFORE static file serving and SPA fallback
const replayRoutes = require('./src/routes/replayRoutes');
app.use('/api/replay', replayRoutes);

const roomRoutes = require('./src/routes/roomRoutes');
app.use('/api/rooms', roomRoutes);

// Serve static files from the appropriate directory
app.use(express.static(serveDir, {
  extensions: ['html', 'js', 'css', 'json', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico']
}));

// SPA fallback for single page apps - return index.html for unknown routes
// This ensures client-side routing works correctly
app.get('*', (req, res) => {
  const indexPath = path.join(serveDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not found - please build the app first with "npm run build"');
  }
});

app.listen(PORT, () => {
  console.log(`quaternion-game server listening on http://localhost:${PORT} (PORT=${PORT})`);
  console.log(`Serving from: ${serveDir}`);
  console.log(`\nTo build the app: npm run build`);
  console.log(`To run in dev mode: npm run dev`);
});
