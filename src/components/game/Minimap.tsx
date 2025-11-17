import { useEffect, useRef } from 'react';

interface MinimapProps {
  gameWidth: number;
  gameHeight: number;
  playerUnits: Phaser.GameObjects.Sprite[];
  enemyUnits: Phaser.GameObjects.Sprite[];
  buildings: Phaser.GameObjects.Sprite[];
}

export const Minimap = ({ gameWidth, gameHeight, playerUnits, enemyUnits, buildings }: MinimapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapWidth = 200;
  const minimapHeight = 150;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, minimapWidth, minimapHeight);

    // Draw grid
    ctx.strokeStyle = '#00ffea';
    ctx.globalAlpha = 0.1;
    for (let x = 0; x < minimapWidth; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, minimapHeight);
      ctx.stroke();
    }
    for (let y = 0; y < minimapHeight; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(minimapWidth, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Draw buildings
    ctx.fillStyle = '#666';
    buildings.forEach(building => {
      const x = (building.x / gameWidth) * minimapWidth;
      const y = (building.y / gameHeight) * minimapHeight;
      ctx.fillRect(x - 3, y - 3, 6, 6);
    });

    // Draw player units
    ctx.fillStyle = '#00ffea';
    playerUnits.forEach(unit => {
      const x = (unit.x / gameWidth) * minimapWidth;
      const y = (unit.y / gameHeight) * minimapHeight;
      ctx.fillRect(x - 2, y - 2, 4, 4);
    });

    // Draw enemy units
    ctx.fillStyle = '#ff0000';
    enemyUnits.forEach(unit => {
      const x = (unit.x / gameWidth) * minimapWidth;
      const y = (unit.y / gameHeight) * minimapHeight;
      ctx.fillRect(x - 2, y - 2, 4, 4);
    });

    // Draw border
    ctx.strokeStyle = '#00ffea';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, minimapWidth, minimapHeight);
  }, [gameWidth, gameHeight, playerUnits, enemyUnits, buildings]);

  return (
    <div className="bg-quaternion-darker/90 backdrop-blur-sm border border-quaternion-primary/30 rounded-lg p-2">
      <h3 className="text-quaternion-primary font-bold text-xs mb-2">TACTICAL MAP</h3>
      <canvas 
        ref={canvasRef} 
        width={minimapWidth} 
        height={minimapHeight}
        className="border border-quaternion-primary/20 rounded"
      />
    </div>
  );
};
