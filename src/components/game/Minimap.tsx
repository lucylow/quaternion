import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

interface MinimapProps {
  gameWidth: number;
  gameHeight: number;
  worldWidth: number;
  worldHeight: number;
  playerUnits: Phaser.GameObjects.Sprite[];
  enemyUnits: Phaser.GameObjects.Sprite[];
  buildings: Phaser.GameObjects.Sprite[];
  camera?: Phaser.Cameras.Scene2D.Camera | null;
  onMinimapClick?: (worldX: number, worldY: number) => void;
}

export const Minimap = ({ 
  gameWidth, 
  gameHeight, 
  worldWidth,
  worldHeight,
  playerUnits, 
  enemyUnits, 
  buildings,
  camera,
  onMinimapClick
}: MinimapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapWidth = 200;
  const minimapHeight = 150;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
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
        if (!building.active) return;
        const x = (building.x / worldWidth) * minimapWidth;
        const y = (building.y / worldHeight) * minimapHeight;
        ctx.fillRect(x - 3, y - 3, 6, 6);
      });

      // Draw player units
      ctx.fillStyle = '#00ffea';
      playerUnits.forEach(unit => {
        if (!unit.active) return;
        const x = (unit.x / worldWidth) * minimapWidth;
        const y = (unit.y / worldHeight) * minimapHeight;
        ctx.fillRect(x - 2, y - 2, 4, 4);
      });

      // Draw enemy units
      ctx.fillStyle = '#ff0000';
      enemyUnits.forEach(unit => {
        if (!unit.active) return;
        const x = (unit.x / worldWidth) * minimapWidth;
        const y = (unit.y / worldHeight) * minimapHeight;
        ctx.fillRect(x - 2, y - 2, 4, 4);
      });

      // Draw camera viewport
      if (camera) {
        const viewportX = (camera.scrollX / worldWidth) * minimapWidth;
        const viewportY = (camera.scrollY / worldHeight) * minimapHeight;
        const viewportWidth = (gameWidth / camera.zoom / worldWidth) * minimapWidth;
        const viewportHeight = (gameHeight / camera.zoom / worldHeight) * minimapHeight;

        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
        ctx.globalAlpha = 1;
      }

      // Draw border
      ctx.strokeStyle = '#00ffea';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, minimapWidth, minimapHeight);
    };

    draw();

    // Redraw on animation frame
    const animationFrame = requestAnimationFrame(function animate() {
      draw();
      requestAnimationFrame(animate);
    });

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [gameWidth, gameHeight, worldWidth, worldHeight, playerUnits, enemyUnits, buildings, camera]);

  // Handle minimap clicks
  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onMinimapClick) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert minimap coordinates to world coordinates
    const worldX = (x / minimapWidth) * worldWidth;
    const worldY = (y / minimapHeight) * worldHeight;

    onMinimapClick(worldX, worldY);
  };

  return (
    <div 
      ref={containerRef}
      className="bg-quaternion-darker/90 backdrop-blur-sm border border-quaternion-primary/30 rounded-lg p-2"
    >
      <h3 className="text-quaternion-primary font-bold text-xs mb-2">TACTICAL MAP</h3>
      <canvas 
        ref={canvasRef} 
        width={minimapWidth} 
        height={minimapHeight}
        className="border border-quaternion-primary/20 rounded cursor-pointer"
        onClick={handleMinimapClick}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
