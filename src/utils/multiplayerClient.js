// src/utils/multiplayerClient.js
// Lightweight WebSocket client with command sending and server-delta reconciliation.

export default function createMultiplayerClient({ url, onDelta, onHello, logPrefix = '[MP-CLT]' }) {
  const ws = new WebSocket(url);
  let clientId = null;
  let pendingCommands = []; // local commands not yet acked { nonce, command, tRequest }
  let nextNonce = 1;
  let lastServerTick = 0;

  ws.addEventListener('open', () => console.log(`${logPrefix} connected to ${url}`));
  ws.addEventListener('message', (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      handleServerMessage(msg);
    } catch (err) { console.warn(`${logPrefix} parse error`, err); }
  });

  function handleServerMessage(msg) {
    switch (msg.type) {
      case 'hello':
        clientId = msg.clientId;
        if (onHello) onHello(msg);
        break;
      case 'delta':
        // authoritative: contains tick and deltas
        lastServerTick = msg.tick;
        // call user-supplied callback to apply deltas
        if (onDelta) onDelta(msg);
        // remove any pendingCommands older than acked tick (if your server returns ackNonce)
        // reapply pending commands for prediction: the frontend should rollback to msg.tick snapshot and reapply
        break;
      case 'sync':
        // handle snapshot
        break;
      default:
        console.warn(`${logPrefix} unknown msg`, msg.type);
    }
  }

  function sendCommand(command) {
    // attach nonce and tRequest
    const envelope = { type: 'command', command: { ...command, nonce: nextNonce++, tRequest: Date.now() } };
    pendingCommands.push(envelope.command);
    ws.send(JSON.stringify(envelope));
    return envelope.command.nonce;
  }

  function close() {
    ws.close();
  }

  return { sendCommand, close, getClientId: () => clientId, pendingCommands };
}

