/**
 * Express server for quaternion-game
 * - serves built React app from ./dist (production)
 * - serves static files from ./public (if needed)
 * - SPA fallback to /index.html for client-side routing
 * - uses process.env.PORT or 3000
 * - Multiplayer WebSocket server integration
 */

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// Initialize multiplayer server (optional, only if ws is available)
let multiplayerServer = null;

// Use async IIFE to handle ES module imports
(async () => {
  try {
    // Import ws module
    const { WebSocketServer } = await import('ws');
    const { MultiplayerGameServer } = await import('./src/backend/MultiplayerGameServer.js');
    
    // Create WebSocket server on the existing HTTP server
    const wss = new WebSocketServer({ server, path: '/ws' });
    
    // Initialize multiplayer server with existing app and server
    multiplayerServer = new MultiplayerGameServer({
      app,
      server,
      wss,
      port: PORT
    });
    
    multiplayerServer._externalServer = true; // Mark that we're using external server
    
    console.log('Multiplayer server initialized');
  } catch (error) {
    console.warn('Multiplayer server not available:', error.message);
    if (error.message.includes('ws') || error.message.includes('Cannot find module')) {
      console.warn('Install with: npm install ws');
    }
  }
})();

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

// Monetization routes
try {
  const monetizationRoutes = require('./src/backend/controllers/MonetizationController.js');
  app.use('/api/monetization', monetizationRoutes);
} catch (err) {
  console.error('Failed to load monetization routes:', err);
}

// Payment webhook (must use raw body for webhook endpoint)
try {
  const paymentWebhook = require('./src/backend/routes/PaymentWebhook.js');
  app.use('/api/payments', paymentWebhook);
} catch (err) {
  console.error('Failed to load payment webhook:', err);
}

// TTS API route (for local development - production uses edge function)
app.post('/api/ai/tts', async (req, res) => {
  try {
    // Import the TTS handler
    const ttsHandler = require('./api/ai/tts.js');
    await ttsHandler.default(req, res);
  } catch (error) {
    console.error('TTS route error:', error);
    res.status(500).json({ error: error.message });
  }
});

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

// Start server
server.listen(PORT, () => {
  console.log(`quaternion-game server listening on http://localhost:${PORT} (PORT=${PORT})`);
  console.log(`Serving from: ${serveDir}`);
  console.log(`\nTo build the app: npm run build`);
  console.log(`To run in dev mode: npm run dev`);
  
  // Multiplayer server is already initialized and attached to this server
  if (multiplayerServer) {
    console.log('Multiplayer WebSocket server enabled at /ws');
  }
});
