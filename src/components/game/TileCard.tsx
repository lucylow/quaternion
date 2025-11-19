// TileCard.tsx
// Example clickable tile component that bridges React UI to game engine

import React from 'react';
import { engineBridge } from '@/engine/EngineBridge';
import { audioManager } from '@/engine/AudioManager';

export interface TileCardProps {
  tile: {
    id: string;
    name: string;
    x?: number;
    y?: number;
    terrain?: string;
  };
  className?: string;
}

export default function TileCard({ tile, className = '' }: TileCardProps) {
  const handleClick = () => {
    // Play click sound
    audioManager.play('ui_click', { volume: 0.8 }).catch(() => {
      // Fallback if audio fails
      console.debug('Click sound not available');
    });

    // Send command to game engine
    engineBridge.sendCommand({ 
      type: 'click-tile', 
      payload: { 
        tileId: tile.id,
        tileName: tile.name,
        x: tile.x,
        y: tile.y,
        terrain: tile.terrain
      } 
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`border border-gray-600 rounded-lg p-3 cursor-pointer transition-all hover:border-cyan-400 hover:bg-gray-800/50 ${className}`}
      style={{ 
        borderColor: '#4a5568',
        cursor: 'pointer'
      }}
    >
      <div className="font-semibold text-cyan-200">{tile.name}</div>
      {tile.terrain && (
        <div className="text-sm text-gray-400 mt-1">Terrain: {tile.terrain}</div>
      )}
      {tile.x !== undefined && tile.y !== undefined && (
        <div className="text-xs text-gray-500 mt-1">
          Position: ({tile.x}, {tile.y})
        </div>
      )}
    </div>
  );
}

