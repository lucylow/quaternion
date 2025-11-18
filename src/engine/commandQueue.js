// src/engine/commandQueue.js
// Simple queue for storing incoming commands from clients.
// Exposes thread-safe (event-loop safe) operations.

const { v4: uuidv4 } = require('uuid');

class CommandQueue {
  constructor() {
    this._queue = []; // items: { serverOrder, receivedAt, command }
    this._counter = 0;
  }
  push(command) {
    const entry = { serverOrder: this._counter++, receivedAt: Date.now(), command };
    this._queue.push(entry);
    return entry;
  }
  drain() {
    // Return and clear; maintain deterministic ordering by serverOrder
    const drained = this._queue.slice();
    this._queue.length = 0;
    // Sort by serverOrder (already assigned in push) for determinism
    drained.sort((a,b) => a.serverOrder - b.serverOrder);
    return drained.map(e => e.command);
  }
  peek() { return this._queue.length ? this._queue[0].command : null; }
  length() { return this._queue.length; }
}

module.exports = CommandQueue;

