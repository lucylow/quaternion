// components/GameMap/GameMapCanvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import { GameState, Unit, Building, ResourceNode } from '@/services/aiGameService';
import { cn } from '@/lib/utils';

interface GameMapCanvasProps {
  gameState: GameState | null;
  selectedUnitId?: string;
  onUnitSelect?: (unitId: string) => void;
  onPositionClick?: (x: number, y: number) => void;
  scale?: number;
}

export const GameMapCanvas: React.FC<GameMapCanvasProps> = ({
  gameState,
  selectedUnitId,
  onUnitSelect,
  onPositionClick,
  scale = 8,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !gameState) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < gameState.map.width; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i * scale, 0);
      ctx.lineTo(i * scale, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < gameState.map.height; i += 10) {
      ctx.beginPath();
      ctx.moveTo(0, i * scale);
      ctx.lineTo(canvas.width, i * scale);
      ctx.stroke();
    }

    // Draw resources
    gameState.resources.forEach(resource => {
      const x = resource.x * scale;
      const y = resource.y * scale;

      if (resource.type === 'mineral') {
        ctx.fillStyle = '#6b9bd1';
      } else {
        ctx.fillStyle = '#9b8b5b';
      }

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw buildings
    gameState.buildings.forEach(building => {
      const x = building.x * scale;
      const y = building.y * scale;
      const size = 6;

      ctx.fillStyle = building.playerId === 1 ? '#2ecc71' : '#e74c3c';
      ctx.fillRect(x - size / 2, y - size / 2, size, size);

      // Draw HP bar
      const hpPercent = building.hp / building.maxHp;
      ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(x - size / 2, y - size / 2 - 3, (size * hpPercent), 1.5);
    });

    // Draw units
    gameState.units.forEach(unit => {
      const x = unit.x * scale;
      const y = unit.y * scale;
      const radius = unit.type === 'worker' ? 2 : 3;

      // Unit circle
      ctx.fillStyle =
        unit.playerId === 1
          ? '#3498db'
          : unit.playerId === 2
            ? '#e74c3c'
            : '#95a5a6';

      if (selectedUnitId === unit.id || hoveredUnitId === unit.id) {
        ctx.fillStyle = '#f1c40f';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (selectedUnitId === unit.id || hoveredUnitId === unit.id) {
        ctx.stroke();
      }
    });

    // Draw status overlay
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Tick: ${gameState.tick}`, 10, 20);
    ctx.fillText(`Units: ${gameState.units.length}`, 10, 35);
    ctx.fillText(`Buildings: ${gameState.buildings.length}`, 10, 50);
  }, [gameState, selectedUnitId, hoveredUnitId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !gameState) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);

    // Check if clicking on a unit
    const clickedUnit = gameState.units.find(
      unit =>
        Math.abs(unit.x - x) < 3 &&
        Math.abs(unit.y - y) < 3
    );

    if (clickedUnit && onUnitSelect) {
      onUnitSelect(clickedUnit.id);
    } else if (onPositionClick) {
      onPositionClick(x, y);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !gameState) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);

    const hoveredUnit = gameState.units.find(
      unit =>
        Math.abs(unit.x - x) < 3 &&
        Math.abs(unit.y - y) < 3
    );

    setHoveredUnitId(hoveredUnit?.id || null);
  };

  if (!gameState) {
    return (
      <div className="w-full h-full bg-secondary flex items-center justify-center rounded-lg">
        <p className="text-muted-foreground">No game state available</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={gameState.map.width * scale}
      height={gameState.map.height * scale}
      onClick={handleCanvasClick}
      onMouseMove={handleCanvasMouseMove}
      className="w-full border rounded-lg cursor-pointer bg-slate-900"
    />
  );
};

// components/GameStats/UnitPanel.tsx
interface UnitPanelProps {
  unit: Unit | null;
  isLoading?: boolean;
}

export const UnitPanel: React.FC<UnitPanelProps> = ({ unit, isLoading = false }) => {
  if (!unit) {
    return (
      <div className="p-4 border rounded-lg bg-secondary/50 text-center text-muted-foreground">
        Select a unit to view details
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div>
        <h3 className="font-semibold capitalize">{unit.type}</h3>
        <p className="text-xs text-muted-foreground">ID: {unit.id}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Position</span>
          <p className="font-mono">{unit.x}, {unit.y}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Status</span>
          <p className="capitalize">{unit.status}</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Health</span>
          <span className="font-mono">{unit.hp}/{unit.maxHp}</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all',
              (unit.hp / unit.maxHp) > 0.5 ? 'bg-green-500' : (unit.hp / unit.maxHp) > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// components/GameStats/ResourceDisplay.tsx
interface ResourceDisplayProps {
  player1Resources: { minerals: number; gas: number };
  player2Resources: { minerals: number; gas: number };
}

export const ResourceDisplay: React.FC<ResourceDisplayProps> = ({
  player1Resources,
  player2Resources,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Player 1 */}
      <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Player 1</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Minerals</span>
            <span className="font-mono font-bold">{player1Resources.minerals}</span>
          </div>
          <div className="flex justify-between">
            <span>Gas</span>
            <span className="font-mono font-bold">{player1Resources.gas}</span>
          </div>
        </div>
      </div>

      {/* AI (Player 2) */}
      <div className="border rounded-lg p-3 bg-red-50 dark:bg-red-950">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">AI Opponent</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Minerals</span>
            <span className="font-mono font-bold">{player2Resources.minerals}</span>
          </div>
          <div className="flex justify-between">
            <span>Gas</span>
            <span className="font-mono font-bold">{player2Resources.gas}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// components/GameStats/BuildingInfo.tsx
interface BuildingInfoProps {
  building: Building | null;
}

export const BuildingInfo: React.FC<BuildingInfoProps> = ({ building }) => {
  if (!building) {
    return (
      <div className="p-4 border rounded-lg bg-secondary/50 text-center text-muted-foreground">
        Select a building to view details
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div>
        <h3 className="font-semibold capitalize">{building.type}</h3>
        <p className="text-xs text-muted-foreground">ID: {building.id}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Position</span>
          <p className="font-mono">{building.x}, {building.y}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Owner</span>
          <p>{building.playerId === 1 ? 'Player 1' : 'AI'}</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Health</span>
          <span className="font-mono">{building.hp}/{building.maxHp}</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all',
              (building.hp / building.maxHp) > 0.5 ? 'bg-green-500' : (building.hp / building.maxHp) > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${(building.hp / building.maxHp) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Construction</span>
          <span className="font-mono">{building.progress}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{ width: `${building.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};