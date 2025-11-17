/**
 * ReplayRecorder - Complete Replay System
 * Records all game commands and state snapshots for replay functionality
 */
class ReplayRecorder {
  constructor(gameId) {
    this.gameId = gameId;
    this.replayId = `replay_${gameId}_${Date.now()}`;
    this.startTime = Date.now();
    this.commands = [];
    this.snapshots = [];
    this.metadata = {
      version: '1.0',
      gameId,
      replayId: this.replayId,
      startTime: this.startTime
    };
  }

  recordCommand(command) {
    this.commands.push({
      ...command,
      recordedAt: Date.now()
    });
  }

  recordTick(snapshot) {
    this.snapshots.push(snapshot);
  }

  finalize() {
    this.metadata.endTime = Date.now();
    this.metadata.duration = this.metadata.endTime - this.startTime;
    this.metadata.totalTicks = this.snapshots.length;
    this.metadata.totalCommands = this.commands.length;
  }

  getReplayData() {
    return {
      metadata: this.metadata,
      commands: this.commands,
      snapshots: this.snapshots
    };
  }
}

export { ReplayRecorder };

