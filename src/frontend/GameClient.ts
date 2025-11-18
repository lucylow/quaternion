/**
 * GameClient - Frontend WebSocket Client for Multiplayer
 * Handles all communication with the multiplayer server
 */
type MessageType = 
  | 'authenticated'
  | 'game_state_init'
  | 'state_update'
  | 'game_started'
  | 'game_ended'
  | 'player_joined'
  | 'player_left'
  | 'error'
  | 'pong';

interface GameMessage {
  type: MessageType;
  [key: string]: any;
}

interface GameState {
  tick: number;
  map: {
    width: number;
    height: number;
    seed: number;
  };
  players: Array<{
    slot: number;
    units: number;
    buildings: number;
    resources: {
      minerals: number;
      gas: number;
    };
  }>;
}

export class GameClient {
  private serverUrl: string;
  private ws: WebSocket | null = null;
  private gameId: string | null = null;
  private playerId: string | null = null;
  private gameState: GameState | null = null;
  private eventHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(serverUrl: string) {
    // Convert http to ws and add WebSocket path
    const wsUrl = serverUrl.replace(/^http/, 'ws');
    this.serverUrl = `${wsUrl}/ws`;
  }

  connect(playerId: string, token?: string): Promise<void> {
    this.playerId = playerId;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.send({
            type: 'auth',
            payload: { playerId, token: token || 'anonymous' }
          });

          this.ws!.onmessage = (event) => {
            try {
              const message: GameMessage = JSON.parse(event.data);
              this.handleMessage(message);
            } catch (error) {
              console.error('Failed to parse message:', error);
            }
          };

          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.playerId) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect(this.playerId!, undefined).catch(() => {
          // Reconnection failed, will try again
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  joinGame(gameId: string): void {
    this.gameId = gameId;
    this.send({
      type: 'join_game',
      payload: { gameId, playerId: this.playerId }
    });
  }

  sendCommand(
    commandType: string,
    units?: string[],
    target?: string,
    position?: { x: number; y: number },
    buildingType?: string
  ): void {
    this.send({
      type: 'command',
      payload: {
        commandType,
        units,
        target,
        position,
        buildingType
      }
    });
  }

  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  private handleMessage(message: GameMessage): void {
    const { type, ...data } = message;

    // Call registered event handlers
    if (this.eventHandlers.has(type)) {
      this.eventHandlers.get(type)!(data);
    }

    // Handle specific message types
    switch (type) {
      case 'authenticated':
        this.emit('authenticated', data);
        break;
      case 'game_state_init':
        this.gameState = data.gameState;
        this.emit('gameInitialized', data);
        break;
      case 'state_update':
        this.updateGameState(data);
        this.emit('stateUpdated', data);
        break;
      case 'game_started':
        this.emit('gameStarted', data);
        break;
      case 'game_ended':
        this.emit('gameEnded', data);
        break;
      case 'player_joined':
        this.emit('playerJoined', data);
        break;
      case 'player_left':
        this.emit('playerLeft', data);
        break;
      case 'error':
        this.emit('error', data);
        break;
    }
  }

  private updateGameState(data: any): void {
    if (!this.gameState) return;

    // Apply deltas to game state
    if (data.deltas) {
      data.deltas.forEach((delta: any) => {
        switch (delta.type) {
          case 'unit_update':
            // Update unit position, health, etc.
            // This would need to be implemented based on your game state structure
            break;
          case 'building_update':
            // Update building state
            break;
          case 'player_update':
            // Update resources, supply, etc.
            if (this.gameState && this.gameState.players[delta.playerSlot]) {
              this.gameState.players[delta.playerSlot].resources = delta.resources;
            }
            break;
        }
      });
    }

    // Apply AI actions
    if (data.aiActions) {
      data.aiActions.forEach((aiAction: any) => {
        // Process AI actions
      });
    }
  }

  on(event: string, handler: (data: any) => void): void {
    this.eventHandlers.set(event, handler);
  }

  private emit(event: string, data: any): void {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event)!(data);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventHandlers.clear();
  }

  getGameState(): GameState | null {
    return this.gameState;
  }

  getGameId(): string | null {
    return this.gameId;
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  // Helper methods for common commands
  moveUnits(unitIds: string[], position: { x: number; y: number }): void {
    this.sendCommand('move', unitIds, undefined, position);
  }

  attackTarget(unitIds: string[], targetId: string): void {
    this.sendCommand('attack', unitIds, targetId);
  }

  gatherResources(unitIds: string[], resourceId: string): void {
    this.sendCommand('gather', unitIds, resourceId);
  }

  buildUnit(buildingId: string, unitType: string): void {
    this.sendCommand('build_unit', undefined, undefined, undefined, undefined);
    // Note: This needs to be adjusted based on your command structure
  }

  buildBuilding(buildingType: string, position: { x: number; y: number }): void {
    this.sendCommand('build_building', undefined, undefined, position, buildingType);
  }
}

export default GameClient;

