/**
 * MatchmakingQueue - Player Matching System
 * Handles player matchmaking for multiplayer games
 */
class MatchmakingQueue {
  constructor() {
    this.queues = {
      easy: [],
      medium: [],
      hard: []
    };
    this.playerTimeouts = new Map();
  }

  addPlayer(playerId, gameType, difficulty) {
    if (!this.queues[difficulty]) return;

    this.queues[difficulty].push({
      playerId,
      gameType,
      addedAt: Date.now()
    });

    // Auto-remove after 5 minutes
    const timeout = setTimeout(() => {
      this.removePlayer(playerId, difficulty);
    }, 300000);

    this.playerTimeouts.set(playerId, timeout);
  }

  removePlayer(playerId, difficulty) {
    if (this.queues[difficulty]) {
      this.queues[difficulty] = this.queues[difficulty].filter(p => p.playerId !== playerId);
    }

    const timeout = this.playerTimeouts.get(playerId);
    if (timeout) {
      clearTimeout(timeout);
      this.playerTimeouts.delete(playerId);
    }
  }

  findMatch() {
    for (const [difficulty, queue] of Object.entries(this.queues)) {
      if (queue.length >= 2) {
        const match = {
          players: [queue[0].playerId, queue[1].playerId],
          difficulty,
          gameType: queue[0].gameType
        };

        this.queues[difficulty].shift();
        this.queues[difficulty].shift();

        return match;
      }
    }

    return null;
  }

  getPosition(playerId) {
    for (const queue of Object.values(this.queues)) {
      const index = queue.findIndex(p => p.playerId === playerId);
      if (index !== -1) return index + 1;
    }
    return null;
  }
}

export { MatchmakingQueue };

