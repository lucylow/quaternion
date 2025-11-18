/**
 * Resource Event Display Component
 * Shows active resource events and their effects
 */

import { X, AlertTriangle, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ResourceEvent } from '@/game/puzzles/ResourceEventGenerator';
import { ResourceType } from '@/game/ResourceManager';

interface ResourceEventDisplayProps {
  events: ResourceEvent[];
  onDismiss?: (eventId: string) => void;
}

export const ResourceEventDisplay = ({ events, onDismiss }: ResourceEventDisplayProps) => {
  if (events.length === 0) return null;

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case ResourceType.ORE:
        return '⛏️';
      case ResourceType.ENERGY:
        return '⚡';
      case ResourceType.BIOMASS:
        return '🌿';
      case ResourceType.DATA:
        return '🧠';
      default:
        return '📦';
    }
  };

  const formatTimeRemaining = (endTime: number) => {
    const remaining = Math.max(0, endTime - Date.now());
    const seconds = Math.floor(remaining / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="absolute top-24 right-4 z-20 space-y-2 max-w-sm pointer-events-auto">
      {events.map(event => {
        const timeRemaining = formatTimeRemaining(event.endTime);
        const isExpiring = (event.endTime - Date.now()) < 30000; // Less than 30 seconds

        return (
          <Card
            key={event.eventId}
            className={`p-3 bg-gray-800/95 border-2 ${
              event.isPositive
                ? 'border-green-500/50'
                : 'border-red-500/50'
            } ${isExpiring ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {event.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <h4 className="text-sm font-bold text-white">{event.description}</h4>
                </div>
                
                <p className="text-xs text-gray-300 mb-2">{event.flavorText}</p>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {Array.from(event.resourceModifiers.entries()).map(([type, modifier]) => (
                    <div
                      key={type}
                      className="text-xs px-2 py-1 rounded bg-gray-700/50 flex items-center gap-1"
                    >
                      <span>{getResourceIcon(type as ResourceType)}</span>
                      <span className={modifier >= 1 ? 'text-green-400' : 'text-red-400'}>
                        {modifier >= 1 ? '+' : ''}
                        {Math.round((modifier - 1) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Time remaining: {timeRemaining}</span>
                </div>
              </div>

              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  onClick={() => onDismiss(event.eventId)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};


