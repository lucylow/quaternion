// Advanced Features and Configuration

// config/gameConfig.ts
export const GAME_CONFIG = {
  // Game settings
  GAME: {
    DEFAULT_MAP_WIDTH: 64,
    DEFAULT_MAP_HEIGHT: 64,
    DEFAULT_DIFFICULTY: 'medium' as const,
    TICKS_PER_SECOND: 60,
  },

  // AI behavior
  AI_BEHAVIOR: {
    DECISION_INTERVALS: {
      easy: 3000,    // ms
      medium: 1500,
      hard: 500,
    },
    AGGRESSIVENESS_MULTIPLIERS: {
      easy: 0.6,
      medium: 1.0,
      hard: 1.5,
    },
    DEFENSIVENESS_MULTIPLIERS: {
      easy: 1.5,
      medium: 1.0,
      hard: 0.7,
    },
  },

  // Unit stats
  UNITS: {
    worker: { hp: 50, attack: 5, defense: 0, speed: 2.5, cost: { minerals: 50, gas: 0 } },
    soldier: { hp: 100, attack: 15, defense: 5, speed: 3.0, cost: { minerals: 100, gas: 0 } },
    tank: { hp: 200, attack: 35, defense: 15, speed: 1.5, cost: { minerals: 150, gas: 100 } },
    air: { hp: 120, attack: 25, defense: 5, speed: 4.0, cost: { minerals: 125, gas: 75 } },
  },

  // Building stats
  BUILDINGS: {
    base: { hp: 500, cost: { minerals: 400, gas: 0 } },
    barracks: { hp: 300, cost: { minerals: 150, gas: 0 } },
    factory: { hp: 350, cost: { minerals: 200, gas: 100 } },
    airfield: { hp: 300, cost: { minerals: 150, gas: 100 } },
    refinery: { hp: 200, cost: { minerals: 100, gas: 0 } },
  },

  // UI
  UI: {
    POLL_INTERVAL: 100,           // ms
    CANVAS_SCALE: 8,               // pixels per tile
    THREAT_THRESHOLD_LOW: 33,
    THREAT_THRESHOLD_HIGH: 66,
    MAX_VISIBLE_UNITS: 50,
    MAX_VISIBLE_BUILDINGS: 30,
  },

  // Network
  NETWORK: {
    REQUEST_TIMEOUT: 5000,         // ms
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,             // ms
    BACKEND_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  },
};

export type GameConfig = typeof GAME_CONFIG;

// hooks/useGameConfig.ts
import { useContext, createContext } from 'react';
import { GAME_CONFIG } from '@/config/gameConfig';

const GameConfigContext = createContext<typeof GAME_CONFIG>(GAME_CONFIG);

export const useGameConfig = () => {
  const config = useContext(GameConfigContext);
  if (!config) {
    throw new Error('useGameConfig must be used within GameConfigProvider');
  }
  return config;
};

// utils/gameCalculations.ts
export const calculateThreatLevel = (
  aiUnits: number,
  playerUnits: number,
  aiBuildings: number,
  playerBuildings: number
): number => {
  // Weighted calculation of threat
  const unitRatio = aiUnits > 0 ? aiUnits / Math.max(1, playerUnits) : 0;
  const buildingRatio = aiBuildings > 0 ? aiBuildings / Math.max(1, playerBuildings) : 0;

  const threat = (unitRatio * 0.7 + buildingRatio * 0.3) * 100;
  return Math.min(100, Math.max(0, threat));
};

export const calculateResourceEfficiency = (
  totalResources: number,
  unitCount: number,
  buildingCount: number
): number => {
  if (unitCount + buildingCount === 0) return 0;
  return (totalResources / (unitCount + buildingCount)) * 10;
};

export const estimateGamePhase = (tick: number): 'early' | 'mid' | 'late' => {
  if (tick < 300) return 'early';
  if (tick < 900) return 'mid';
  return 'late';
};

export const getStrategyRecommendation = (
  threatLevel: number,
  resources: { minerals: number; gas: number },
  unitCount: number
): string => {
  if (threatLevel > 70) {
    return 'Defend main base - enemy threat high!';
  }

  if (threatLevel > 50) {
    return 'Build military units for defense';
  }

  if (resources.minerals > 500) {
    return 'Expand territory - strong economy';
  }

  if (unitCount < 10) {
    return 'Build initial workers and units';
  }

  return 'Maintain steady growth';
};

// utils/formatting.ts
export const formatResourceDisplay = (amount: number): string => {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
};

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) {
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// utils/validation.ts
export const isValidGameState = (state: any): boolean => {
  return (
    state &&
    typeof state.gameId === 'string' &&
    typeof state.tick === 'number' &&
    Array.isArray(state.players) &&
    Array.isArray(state.units) &&
    Array.isArray(state.buildings) &&
    state.players.length >= 2
  );
};

export const isValidUnit = (unit: any): boolean => {
  return (
    unit &&
    typeof unit.id === 'string' &&
    ['worker', 'soldier', 'tank', 'air'].includes(unit.type) &&
    typeof unit.playerId === 'number' &&
    typeof unit.hp === 'number' &&
    typeof unit.maxHp === 'number'
  );
};

export const validateUnitCommand = (
  unitIds: string[],
  commandType: string
): { valid: boolean; error?: string } => {
  if (!Array.isArray(unitIds) || unitIds.length === 0) {
    return { valid: false, error: 'Must select at least one unit' };
  }

  if (!['move', 'attack', 'gather', 'build'].includes(commandType)) {
    return { valid: false, error: 'Invalid command type' };
  }

  return { valid: true };
};

// components/GameOverlay/GameNotifications.tsx
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface GameNotification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // ms, 0 = persistent
  timestamp: number;
}

interface GameNotificationsProps {
  notifications: GameNotification[];
  onDismiss: (id: string) => void;
}

export const GameNotifications: React.FC<GameNotificationsProps> = ({
  notifications,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="animate-in slide-in-from-right"
          onClick={() => onDismiss(notification.id)}
        >
          <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
            <div className="flex items-start gap-3">
              {notification.type === 'error' && <AlertTriangle className="h-4 w-4 mt-0.5" />}
              {notification.type === 'success' && <CheckCircle className="h-4 w-4 mt-0.5" />}
              {notification.type === 'info' && <Info className="h-4 w-4 mt-0.5" />}
              <AlertDescription>{notification.message}</AlertDescription>
            </div>
          </Alert>
        </div>
      ))}
    </div>
  );
};

// hooks/useGameNotifications.ts
import { useState, useCallback, useRef } from 'react';
import { GameNotification, NotificationType } from '@/components/GameOverlay/GameNotifications';

export const useGameNotifications = () => {
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const notificationIdRef = useRef(0);

  const addNotification = useCallback(
    (message: string, type: NotificationType = 'info', duration = 5000) => {
      const id = `notification-${notificationIdRef.current++}`;
      const notification: GameNotification = {
        id,
        type,
        message,
        duration,
        timestamp: Date.now(),
      };

      setNotifications(prev => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const success = useCallback(
    (message: string, duration?: number) => addNotification(message, 'success', duration),
    [addNotification]
  );

  const error = useCallback(
    (message: string, duration?: number) => addNotification(message, 'error', duration ?? 7000),
    [addNotification]
  );

  const info = useCallback(
    (message: string, duration?: number) => addNotification(message, 'info', duration),
    [addNotification]
  );

  const warning = useCallback(
    (message: string, duration?: number) => addNotification(message, 'warning', duration ?? 6000),
    [addNotification]
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info,
    warning,
  };
};

// utils/eventEmitter.ts
type EventCallback = (...args: any[]) => void;

export class GameEventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  off(event: string, callback?: EventCallback): void {
    if (!callback) {
      this.events.delete(event);
    } else {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  clear(): void {
    this.events.clear();
  }
}

// Example usage in components
export const gameEvents = new GameEventEmitter();

// Emit events
gameEvents.emit('unit-selected', { unitId: 'unit_123' });
gameEvents.emit('building-constructed', { buildingId: 'building_1' });

// Listen for events
const unsubscribe = gameEvents.on('unit-selected', ({ unitId }) => {
  console.log('Unit selected:', unitId);
});

// Cleanup
unsubscribe();