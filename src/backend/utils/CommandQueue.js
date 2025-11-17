/**
 * CommandQueue - Deterministic Command Processing
 * Ensures commands are processed in a deterministic order for multiplayer synchronization
 */
class CommandQueue {
  constructor() {
    this.queue = [];
    this.processedCommands = new Map(); // tick -> commands
  }

  enqueue(command) {
    // Sort by tick and timestamp for deterministic ordering
    this.queue.push(command);
    this.queue.sort((a, b) => {
      if (a.tick !== b.tick) return a.tick - b.tick;
      if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
      return a.playerId.localeCompare(b.playerId);
    });
  }

  getCommandsForTick(tick) {
    const commands = [];
    let i = 0;

    while (i < this.queue.length && this.queue[i].tick <= tick) {
      const cmd = this.queue[i];
      if (cmd.tick === tick) {
        commands.push(cmd);
        this.queue.splice(i, 1);
      } else {
        i++;
      }
    }

    this.processedCommands.set(tick, commands);
    return commands;
  }

  clear() {
    this.queue = [];
  }
}

export { CommandQueue };

