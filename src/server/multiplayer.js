// src/server/multiplayer.js
// WebSocket server that handles connections, incoming commands, and broadcasts deltas.
// Uses 'ws' library.

const WebSocket = require('ws');
const CommandQueue = require('../engine/commandQueue');
const { createRng } = require('../utils/deterministicRng');

const TICK_MS = Number(process.env.TICK_MS || 50);

function makeMultiplayerServer(httpServer, engine) {
  // engine must expose:
  //  - engine.tickLoopStart(opts) or we will call engine.tick(tick, rng, commands)
  //  - engine.applyCommands(commands) and engine.collectDeltas()
  //  - engine.getStateHash() for debug
  const wss = new WebSocket.Server({ server: httpServer, path: '/ws' });
  const clients = new Map(); // ws -> clientInfo
  const cmdQueue = new CommandQueue();
  let tick = 0;
  let serverOrderCounter = 0;

  function broadcast(message, skipWs=null) {
    const raw = JSON.stringify(message);
    for (const [ws] of clients) {
      if (ws.readyState === WebSocket.OPEN && ws !== skipWs) ws.send(raw);
    }
  }

  wss.on('connection', (ws, req) => {
    const id = `client-${Math.random().toString(36).slice(2,9)}`;
    clients.set(ws, { id, lastSeen: Date.now() });
    console.log('[MP-SRV] client connected', id);
    ws.send(JSON.stringify({ type: 'hello', tick, serverTime: Date.now(), clientId: id }));
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        clients.get(ws).lastSeen = Date.now();
        handleClientMessage(ws, msg);
      } catch (err) {
        console.warn('[MP-SRV] invalid msg', err && err.message);
      }
    });
    ws.on('close', () => {
      clients.delete(ws);
      console.log('[MP-SRV] client disconnected', id);
    });
  });

  function handleClientMessage(ws, msg) {
    if (!msg || !msg.type) return;
    switch (msg.type) {
      case 'command':
        // Validate minimal schema
        if (!msg.command || !msg.command.actorId || !msg.command.commandType) {
          ws.send(JSON.stringify({ type:'error', message:'invalid command schema' }));
          return;
        }
        // Attach server metadata and push to cmdQueue
        cmdQueue.push({
          ...msg.command,
          _clientId: clients.get(ws).id,
          _receivedAt: Date.now(),
          _serverOrder: serverOrderCounter++,
        });
        break;
      case 'sync_request':
        // client asks for authoritative snapshot
        try {
          const snapshot = engine.getSnapshot ? engine.getSnapshot() : { stateHash: engine.getStateHash?.() };
          ws.send(JSON.stringify({ type:'sync', tick, snapshot }));
        } catch (err) {
          console.error('[MP-SRV] sync error', err);
        }
        break;
      case 'pong':
        // keepalive
        break;
      default:
        ws.send(JSON.stringify({ type:'error', message:`unsupported type ${msg.type}` }));
    }
  }

  // Server tick loop: consume commands, step engine, collect deltas, broadcast
  const rngSeedBase = Number(process.env.SERVER_SEED || Date.now());
  const tickLoop = async () => {
    const rng = createRng(rngSeedBase + tick);
    // 1) Drain command queue
    const commands = cmdQueue.drain();
    if (commands.length) {
      // deterministic ordering is preserved by serverOrder
      try {
        engine.applyCommands(commands, { tick });
      } catch (err) {
        console.error('[MP-SRV] applyCommands error', err);
      }
    }
    // 2) Step simulation
    try {
      engine.tick(tick, rng);
    } catch (err) {
      console.error('[MP-SRV] engine.tick error', err);
    }

    // 3) Collect deltas
    let deltas = [];
    try {
      deltas = engine.collectDeltas ? engine.collectDeltas(tick) : [];
    } catch (err) {
      console.error('[MP-SRV] collectDeltas error', err);
    }

    // 4) Broadcast deltas (pack into one message)
    if (deltas && deltas.length) {
      const msg = { type:'delta', tick, deltas, stateHash: engine.getStateHash ? engine.getStateHash() : null };
      broadcast(msg);
    } else {
      // still broadcast heartbeat occasionally
      if (tick % Math.floor(1000 / TICK_MS) === 0) broadcast({ type: 'tick', tick });
    }

    tick++;
    setTimeout(tickLoop, TICK_MS);
  };

  // start tick loop
  setTimeout(tickLoop, TICK_MS);

  return { wss, broadcast, clients, cmdQueue };
}

module.exports = { makeMultiplayerServer };

