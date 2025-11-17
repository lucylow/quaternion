import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Zap, Leaf, Box, Building, Swords, Trophy, X, RotateCcw, Activity, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { QuaternionGameState } from '@/game/QuaternionGameState';
import { TECH_TREE, BUILDINGS, COMMANDERS, UNIT_TYPES, AI_SUGGESTIONS } from '@/data/quaternionData';
import { BuildMenu } from '@/components/game/BuildMenu';
import { TechTreeModal } from '@/components/game/TechTreeModal';
import { UnitPanel } from '@/components/game/UnitPanel';
import { CommandPanel } from '@/components/game/CommandPanel';
import { Minimap } from '@/components/game/Minimap';
import { GameLoop, PerformanceStats } from '@/game/GameLoop';

interface GameResources {
  matter: number;
  energy: number;
  life: number;
  knowledge: number;
}

const QuaternionGame = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const gameStateRef = useRef<QuaternionGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const [resources, setResources] = useState<GameResources>({
    matter: 500,
    energy: 250,
    life: 100,
    knowledge: 50
  });
  
  const [population, setPopulation] = useState({ current: 8, max: 50 });
  const [gameTime, setGameTime] = useState(0);
  const [instability, setInstability] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<Phaser.Physics.Arcade.Sprite[]>([]);
  const cameraRef = useRef<Phaser.Cameras.Scene2D.Camera | null>(null);
  const playerUnitsRef = useRef<Phaser.Physics.Arcade.Sprite[]>([]);
  const aiUnitsRef = useRef<Phaser.Physics.Arcade.Sprite[]>([]);
  const buildingsRef = useRef<Phaser.GameObjects.Sprite[]>([]);
  const [showTechTree, setShowTechTree] = useState(false);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [buildQueue, setBuildQueue] = useState<Array<{ id: string; building: string; progress: number; totalTime: number }>>([]);
  const [researchedTechs, setResearchedTechs] = useState<Set<string>>(new Set());
  const [aiMessages, setAiMessages] = useState<Array<{ commander: string; message: string; id: number }>>([]);
  const [gameOver, setGameOver] = useState<{ won: boolean; reason: string } | null>(null);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [winConditionProgress, setWinConditionProgress] = useState<Record<string, { progress: number; max: number; label: string }>>({});
  const [showTutorial, setShowTutorial] = useState(true);
  const gameLoopRef = useRef<GameLoop | null>(null);
  
  // Get game configuration from route state or use defaults
  const location = useLocation();
  const routeConfig = (location.state as any)?.config;
  
  // Game metadata - use config from route state or defaults
  const [gameSeed] = useState(routeConfig?.seed || Math.floor(Math.random() * 1000000));
  const [commanderId] = useState(routeConfig?.commanderId || 'AUREN');
  const [mapConfig] = useState({
    type: routeConfig?.mapType || 'Crystalline Plains',
    width: routeConfig?.mapWidth || 40,
    height: routeConfig?.mapHeight || 30
  });
  const gameMode = routeConfig?.mode || 'single';
  const roomId = routeConfig?.roomId;
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    // Store functions in variables accessible to the scene
    const showToast = toast;
    const sendAIMessage = (commander: string, message: string) => {
      const id = Date.now();
      setAiMessages(prev => [...prev, { commander, message, id }]);
      showToast(message, {
        description: `${COMMANDERS[commander].name} - ${COMMANDERS[commander].role}`,
        duration: 5000
      });
      setTimeout(() => {
        setAiMessages(prev => prev.filter(m => m.id !== id));
      }, 10000);
    };

    // Initialize game state with configuration
    gameStateRef.current = new QuaternionGameState({
      seed: gameSeed,
      mapWidth: mapConfig.width,
      mapHeight: mapConfig.height,
      mapType: routeConfig?.mapType || 'crystalline_plains',
      aiDifficulty: routeConfig?.difficulty || 'medium',
      commanderId: commanderId,
      mode: gameMode,
      roomId: roomId
    });

    const playerUnits: Phaser.Physics.Arcade.Sprite[] = [];
    const aiUnits: Phaser.Physics.Arcade.Sprite[] = [];
    const selectedUnits: Phaser.Physics.Arcade.Sprite[] = [];
    let selectionGraphics: Phaser.GameObjects.Graphics;
    let isSelecting = false;
    const selectionStart = { x: 0, y: 0 };
    const resourceNodes: Phaser.GameObjects.Sprite[] = [];
    const buildings: Phaser.GameObjects.Sprite[] = [];
    let playerBase: Phaser.GameObjects.Rectangle;
    let aiBase: Phaser.GameObjects.Rectangle;
    let lastAiSpawn = 0;
    let lastResourceGather = 0;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1200,
      height: 700,
      parent: gameRef.current,
      backgroundColor: '#001122',
      scene: {
        preload: preload,
        create: create,
        update: update
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // Optimize for desktop rendering
        autoRound: true,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false,
          // Optimize physics for desktop
          fps: 60,
          timeScale: 1,
        }
      },
      // Performance optimizations for desktop
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
        powerPreference: 'high-performance', // Prefer dedicated GPU on desktop
      },
      fps: {
        target: 60,
        forceSetTimeOut: false, // Use requestAnimationFrame for better performance
        smoothStep: true, // Smooth frame interpolation
      },
      // Disable unnecessary features for better performance
      disableContextMenu: true,
      banner: false,
    };

    function preload(this: Phaser.Scene) {
      this.load.on('progress', (value: number) => {
        setLoadingProgress(value * 100);
      });

      setTimeout(() => {
        setLoading(false);
        gameStateRef.current?.start();
      }, 1000);
    }

    // Create particle emitter for effects
    function createParticleEmitter(scene: Phaser.Scene, x: number, y: number, color: number, type: 'explosion' | 'gather' | 'heal' = 'explosion') {
      const particles = scene.add.particles(x, y, 'particle', {
        speed: { min: 20, max: 100 },
        scale: { start: 0.3, end: 0 },
        tint: color,
        lifespan: 500,
        quantity: type === 'explosion' ? 10 : 5,
        emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 10), quantity: type === 'explosion' ? 10 : 5 }
      });
      
      setTimeout(() => {
        particles.destroy();
      }, 1000);
      
      return particles;
    }

    // Create enhanced unit graphics with animations
    function createUnitGraphic(scene: Phaser.Scene, x: number, y: number, color: number, type: string = 'worker'): Phaser.GameObjects.Container {
      const container = scene.add.container(x, y);
      
      // Base shape based on type with improved visuals
      let shape: Phaser.GameObjects.Graphics;
      if (type === 'worker') {
        shape = scene.add.graphics();
        // Outer glow
        shape.fillStyle(color, 0.3);
        shape.fillCircle(0, 0, 16);
        // Main body
        shape.fillStyle(color, 0.95);
        shape.fillCircle(0, 0, 12);
        shape.lineStyle(2, 0xffffff, 1);
        shape.strokeCircle(0, 0, 12);
        // Inner highlight
        shape.fillStyle(0xffffff, 0.6);
        shape.fillCircle(-3, -3, 4);
        // Tool indicator
        shape.lineStyle(1, 0xffffff, 0.8);
        shape.lineBetween(-6, 6, 6, 6);
      } else if (type === 'soldier') {
        shape = scene.add.graphics();
        // Outer glow
        shape.fillStyle(color, 0.3);
        shape.fillCircle(0, 0, 18);
        // Main triangle body
        shape.fillStyle(color, 0.95);
        shape.fillTriangle(-12, 10, 0, -12, 12, 10);
        shape.lineStyle(2, 0xffffff, 1);
        shape.strokeTriangle(-12, 10, 0, -12, 12, 10);
        // Weapon indicator
        shape.lineStyle(2, 0xffffff, 0.9);
        shape.lineBetween(0, -12, 0, -18);
      } else {
        shape = scene.add.graphics();
        // Outer glow
        shape.fillStyle(color, 0.3);
        shape.fillRect(-14, -14, 28, 28);
        // Main body
        shape.fillStyle(color, 0.95);
        shape.fillRect(-12, -12, 24, 24);
        shape.lineStyle(2, 0xffffff, 1);
        shape.strokeRect(-12, -12, 24, 24);
        // Inner cross
        shape.lineStyle(1, 0xffffff, 0.7);
        shape.lineBetween(-6, 0, 6, 0);
        shape.lineBetween(0, -6, 0, 6);
      }
      
      container.add(shape);
      
      // Pulsing animation for units
      scene.tweens.add({
        targets: container,
        scaleX: { from: 1, to: 1.1 },
        scaleY: { from: 1, to: 1.1 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Health bar background with border
      const healthBg = scene.add.graphics();
      healthBg.fillStyle(0x000000, 0.7);
      healthBg.fillRect(-16, -22, 32, 6);
      healthBg.lineStyle(1, 0xffffff, 0.5);
      healthBg.strokeRect(-16, -22, 32, 6);
      container.add(healthBg);
      
      // Health bar
      const healthBar = scene.add.graphics();
      healthBar.fillStyle(0x00ff00, 1);
      healthBar.fillRect(-15, -21, 30, 4);
      container.add(healthBar);
      container.setData('healthBar', healthBar);
      container.setData('maxHealth', 100);
      container.setData('health', 100);
      
      return container;
    }

    function create(this: Phaser.Scene) {
      const { width, height } = this.cameras.main;

      // Create enhanced grid background with animated gradient
      const bgGraphics = this.add.graphics();
      bgGraphics.fillGradientStyle(0x001122, 0x001122, 0x002244, 0x002244, 1);
      bgGraphics.fillRect(0, 0, width * 2, height * 2);
      
      // Animated grid lines with subtle pulse
      bgGraphics.lineStyle(1, 0x00ffea, 0.15);
      for (let x = 0; x < width * 2; x += 64) {
        bgGraphics.lineBetween(x, 0, x, height * 2);
      }
      for (let y = 0; y < height * 2; y += 64) {
        bgGraphics.lineBetween(0, y, width * 2, y);
      }
      
      // Add subtle animated stars/particles in background
      for (let i = 0; i < 50; i++) {
        const star = this.add.circle(
          Math.random() * width * 2,
          Math.random() * height * 2,
          1,
          0x00ffea,
          0.3 + Math.random() * 0.4
        );
        this.tweens.add({
          targets: star,
          alpha: { from: 0.3, to: 0.7 },
          duration: 2000 + Math.random() * 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      // Create resource nodes with better visuals
      const nodeTypes = [
        { color: 0x4a90e2, resource: 'matter', icon: 'M' },
        { color: 0xffd700, resource: 'energy', icon: 'E' },
        { color: 0x50c878, resource: 'life', icon: 'L' },
        { color: 0x9d4edd, resource: 'knowledge', icon: 'K' }
      ];

      for (let i = 0; i < 12; i++) {
        const nodeType = nodeTypes[i % 4];
        const x = 200 + (i % 4) * 250;
        const y = 150 + Math.floor(i / 4) * 200;
        
        // Outer glow
        const glow = this.add.circle(x, y, 35, nodeType.color, 0.15);
        this.tweens.add({
          targets: glow,
          scale: { from: 1, to: 1.5 },
          alpha: { from: 0.15, to: 0.05 },
          duration: 2000,
          yoyo: true,
          repeat: -1
        });
        
        // Main node
        const node = this.add.circle(x, y, 25, nodeType.color, 0.8);
        node.setStrokeStyle(3, nodeType.color, 1);
        node.setData('type', nodeType.resource);
        node.setData('amount', 1000);
        node.setInteractive();
        
        // Icon
        const icon = this.add.text(x, y, nodeType.icon, {
          fontSize: '16px',
          color: '#ffffff',
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }).setOrigin(0.5);
        
        resourceNodes.push(node as Phaser.GameObjects.Sprite);
      }

      // Create enhanced player base
      playerBase = this.add.rectangle(150, 350, 80, 80, 0x00ffea, 0.9);
      playerBase.setStrokeStyle(3, 0x00ffea, 1);
      playerBase.setInteractive();
      playerBase.setData('type', 'base');
      playerBase.setData('player', 1);
      playerBase.setData('health', 1000);
      playerBase.setData('maxHealth', 1000);
      buildings.push(playerBase as Phaser.GameObjects.Sprite);
      buildingsRef.current = buildings;
      
      // Base glow effect
      const baseGlow = this.add.circle(150, 350, 50, 0x00ffea, 0.2);
      this.tweens.add({
        targets: baseGlow,
        scale: { from: 1, to: 1.3 },
        alpha: { from: 0.2, to: 0.05 },
        duration: 1500,
        yoyo: true,
        repeat: -1
      });

      // Create enhanced player units
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const distance = 100;
        const x = 150 + Math.cos(angle) * distance;
        const y = 350 + Math.sin(angle) * distance;
        
        const unit = this.physics.add.sprite(x, y, '');
        unit.setDisplaySize(24, 24);
        unit.setData('type', i < 4 ? 'worker' : 'soldier');
        unit.setData('player', 1);
        unit.setData('health', i < 4 ? 100 : 200);
        unit.setData('maxHealth', i < 4 ? 100 : 200);
        unit.setData('damage', i < 4 ? 5 : 25);
        unit.setData('target', null);
        unit.setData('state', 'idle');
        
        const unitGraphic = createUnitGraphic(this, x, y, 0x00ffea, unit.getData('type'));
        unit.setData('graphic', unitGraphic);
        unit.setData('container', unitGraphic);
        
        unit.setInteractive();
        unit.on('pointerdown', () => {
          if (!selectedUnits.includes(unit)) {
            selectedUnits.forEach(u => {
              const g = u.getData('graphic');
              if (g) {
                g.setAlpha(1);
                g.list.forEach((child: any) => {
                  if (child.lineStyle) {
                    child.clear();
                    child.lineStyle(0);
                  }
                });
              }
            });
            selectedUnits.length = 0;
            selectedUnits.push(unit);
            const g = unit.getData('graphic');
            if (g) {
              g.setAlpha(1.2);
              // Add selection ring
              const ring = this.add.graphics();
              ring.lineStyle(3, 0xffffff, 1);
              ring.strokeCircle(unit.x, unit.y, 18);
              ring.setData('unit', unit);
              unit.setData('selectionRing', ring);
            }
            setSelectedUnit(unit.getData('type'));
          }
        });

        playerUnits.push(unit);
      }
      playerUnitsRef.current = playerUnits;

      // Create AI base
      aiBase = this.add.rectangle(1050, 350, 80, 80, 0xff4444, 0.9);
      aiBase.setStrokeStyle(3, 0xff4444, 1);
      aiBase.setData('type', 'base');
      aiBase.setData('player', 2);
      aiBase.setData('health', 1000);
      aiBase.setData('maxHealth', 1000);
      buildings.push(aiBase as Phaser.GameObjects.Sprite);
      buildingsRef.current = buildings;
      
      const aiBaseGlow = this.add.circle(1050, 350, 50, 0xff4444, 0.2);
      this.tweens.add({
        targets: aiBaseGlow,
        scale: { from: 1, to: 1.3 },
        alpha: { from: 0.2, to: 0.05 },
        duration: 1500,
        yoyo: true,
        repeat: -1
      });

      // Selection graphics
      selectionGraphics = this.add.graphics();

      // Enhanced Camera controls
      const cursors = this.input.keyboard?.createCursorKeys();
      const wasd = this.input.keyboard?.addKeys('W,S,A,D') as {
        W: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
      };
      const camera = this.cameras.main;
      cameraRef.current = camera;
      camera.setBounds(0, 0, width * 2, height * 2);
      camera.setZoom(1.0);
      
      // Mouse wheel zoom
      this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number, deltaZ: number) => {
        const zoom = camera.zoom;
        const zoomDelta = deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Phaser.Math.Clamp(zoom + zoomDelta, 0.5, 2.0);
        camera.setZoom(newZoom);
      });

      // Mouse controls
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          // Right click - move/attack command
          if (selectedUnits.length > 0) {
            const worldX = pointer.worldX;
            const worldY = pointer.worldY;
            
            // Check if clicking on enemy
            let targetFound = false;
            aiUnits.forEach(enemy => {
              const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, worldX, worldY);
              if (dist < 30) {
                selectedUnits.forEach(unit => {
                  unit.setData('target', enemy);
                  unit.setData('state', 'attacking');
                  this.physics.moveToObject(unit, enemy, 120);
                });
                targetFound = true;
              }
            });
            
            if (!targetFound && aiBase) {
              const dist = Phaser.Math.Distance.Between(aiBase.x, aiBase.y, worldX, worldY);
              if (dist < 50) {
                selectedUnits.forEach(unit => {
                  unit.setData('target', aiBase);
                  unit.setData('state', 'attacking');
                  this.physics.moveToObject(unit, aiBase, 120);
                });
                targetFound = true;
              }
            }
            
            // Check if clicking on resource node
            if (!targetFound) {
              resourceNodes.forEach(node => {
                const dist = Phaser.Math.Distance.Between(node.x, node.y, worldX, worldY);
                if (dist < 30) {
                  selectedUnits.forEach(unit => {
                    if (unit.getData('type') === 'worker') {
                      unit.setData('target', node);
                      unit.setData('state', 'gathering');
                      this.physics.moveToObject(unit, node, 100);
                    }
                  });
                  targetFound = true;
                }
              });
            }
            
            // Default move command
            if (!targetFound) {
              selectedUnits.forEach(unit => {
                unit.setData('state', 'moving');
                this.physics.moveTo(unit, worldX, worldY, 120);
                
                // Create move indicator
                const indicator = this.add.circle(worldX, worldY, 5, 0x00ffea, 0.8);
                this.tweens.add({
                  targets: indicator,
                  alpha: 0,
                  scale: 0,
                  duration: 500,
                  onComplete: () => indicator.destroy()
                });
              });
            }
          }
        } else {
          // Left click - start selection
          isSelecting = true;
          selectionStart = { x: pointer.worldX, y: pointer.worldY };
        }
      });

      this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (pointer.leftButtonReleased() && isSelecting) {
          isSelecting = false;
          selectionGraphics.clear();

          // Select units in box
          const minX = Math.min(selectionStart.x, pointer.worldX);
          const maxX = Math.max(selectionStart.x, pointer.worldX);
          const minY = Math.min(selectionStart.y, pointer.worldY);
          const maxY = Math.max(selectionStart.y, pointer.worldY);

          // Clear previous selection if not shift-clicking
          if (!pointer.shiftKey) {
            selectedUnits.forEach(u => {
              const ring = u.getData('selectionRing') as Phaser.GameObjects.Ellipse | undefined;
              if (ring) ring.setVisible(false);
            });
            selectedUnits.length = 0;
          }

          // Find units in selection box
          playerUnits.forEach(unit => {
            if (!unit.active) return;
            if (unit.x >= minX && unit.x <= maxX && unit.y >= minY && unit.y <= maxY) {
              if (!selectedUnits.includes(unit)) {
                selectedUnits.push(unit);
                let ring = unit.getData('selectionRing') as Phaser.GameObjects.Ellipse | undefined;
                if (!ring) {
                  ring = this.add.graphics();
                  ring.lineStyle(3, 0x00ffea, 1);
                  ring.strokeCircle(unit.x, unit.y, 18);
                  ring.setData('unit', unit);
                  unit.setData('selectionRing', ring);
                }
                ring.setVisible(true);
              }
            }
          });

          // Update React state
          setSelectedUnits([...selectedUnits]);
          if (selectedUnits.length === 1) {
            setSelectedUnit(selectedUnits[0].getData('type'));
          } else {
            setSelectedUnit(null);
          }
        }
      });

      // Control groups (1-9) for unit selection
      const controlGroups: Map<number, Phaser.Physics.Arcade.Sprite[]> = new Map();
      
      // Create control group (Ctrl + number)
      this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '9') {
          const groupNum = parseInt(event.key);
          if (selectedUnits.length > 0) {
            controlGroups.set(groupNum, [...selectedUnits]);
            showToast.success(`Control group ${groupNum} created with ${selectedUnits.length} units`);
          }
        }
      });

      // Select control group (number key)
      for (let i = 1; i <= 9; i++) {
        const key = this.input.keyboard?.addKey(`${i}`);
        key?.on('down', () => {
          if (!this.input.keyboard?.isDown('CTRL') && !this.input.keyboard?.isDown('META')) {
            const group = controlGroups.get(i);
            if (group && group.length > 0) {
              // Clear current selection
              selectedUnits.forEach(u => {
                const ring = u.getData('selectionRing') as Phaser.GameObjects.Ellipse | undefined;
                if (ring) ring.setVisible(false);
              });
              selectedUnits.length = 0;

              // Select group units (filter out inactive)
              group.forEach(unit => {
                if (unit.active) {
                  selectedUnits.push(unit);
                  let ring = unit.getData('selectionRing') as Phaser.GameObjects.Ellipse | undefined;
                  if (!ring) {
                    ring = this.add.graphics();
                    ring.lineStyle(3, 0x00ffea, 1);
                    ring.strokeCircle(unit.x, unit.y, 18);
                    ring.setData('unit', unit);
                    unit.setData('selectionRing', ring);
                  }
                  ring.setVisible(true);
                }
              });

              // Update group with active units only
              controlGroups.set(i, selectedUnits.filter(u => u.active));

              // Update React state
              setSelectedUnits([...selectedUnits]);
              if (selectedUnits.length === 1) {
                setSelectedUnit(selectedUnits[0].getData('type'));
              } else {
                setSelectedUnit(null);
              }
            }
          }
        });
      }

      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (isSelecting) {
          selectionGraphics.clear();
          selectionGraphics.lineStyle(2, 0x00ffea, 0.8);
          selectionGraphics.fillStyle(0x00ffea, 0.1);
          selectionGraphics.fillRect(
            selectionStart.x,
            selectionStart.y,
            pointer.worldX - selectionStart.x,
            pointer.worldY - selectionStart.y
          );
          selectionGraphics.strokeRect(
            selectionStart.x,
            selectionStart.y,
            pointer.worldX - selectionStart.x,
            pointer.worldY - selectionStart.y
          );
        }
      });

      // AI spawn timer
      lastAiSpawn = this.time.now;
    }

    function update(this: Phaser.Scene, time: number, delta: number) {
      // Note: Game logic updates are handled by GameLoop with fixed timestep
      // This update function only handles rendering and visual updates
      
      // Update UI state from game state (safe to do every frame)
      if (gameStateRef.current && !gameOver) {
        const state = gameStateRef.current.getState();
        
        setGameTime(Math.floor(state.gameTime));
        setInstability(Math.floor(state.instability));
        
        if (state.gameOver) {
          setGameOver({ won: state.winner === 1, reason: 'Game ended' });
          return;
        }
        
        if (state.players.length > 0) {
          const player = state.players[0];
          setResources({
            matter: Math.floor(player.resources.matter),
            energy: Math.floor(player.resources.energy),
            life: Math.floor(player.resources.life),
            knowledge: Math.floor(player.resources.knowledge)
          });
          setPopulation(player.population);
        }

        // Update win condition progress
        if (state.winConditions && state.players.length > 0) {
          const player = state.players[0];
          const progress: Record<string, { progress: number; max: number; label: string }> = {};
          state.winConditions.forEach((wc: any) => {
            // Adjust max values based on quick start mode
            const isQuickStart = mapConfig.width <= 30 && mapConfig.height <= 20;
            
            if (wc.type === 'equilibrium') {
              progress.equilibrium = {
                progress: wc.progress,
                max: isQuickStart ? 10 * 60 : 15 * 60, // 10 or 15 seconds at 60 ticks/sec (reduced)
                label: 'Equilibrium Victory'
              };
            } else if (wc.type === 'technological') {
              progress.technological = {
                progress: player.researchedTechs.has('quantum_ascendancy') ? 1 : 0,
                max: 1,
                label: 'Technological Victory'
              };
            } else if (wc.type === 'territorial') {
              progress.territorial = {
                progress: wc.progress,
                max: isQuickStart ? 15 * 60 : 20 * 60, // 15 or 20 seconds (reduced)
                label: 'Territorial Victory'
              };
            } else if (wc.type === 'moral') {
              progress.moral = {
                progress: player.moralAlignment || 0,
                max: 60, // Reduced from 80 to 60
                label: 'Moral Victory'
              };
            }
          });
          setWinConditionProgress(progress);
        }
      }

      // Update unit graphics positions
      playerUnits.forEach(unit => {
        const graphic = unit.getData('graphic');
        if (graphic) {
          graphic.setPosition(unit.x, unit.y);
          
          // Update health bar
          const healthBar = graphic.getData('healthBar');
          if (healthBar) {
            const health = unit.getData('health') || 100;
            const maxHealth = unit.getData('maxHealth') || 100;
            healthBar.clear();
            const healthPercent = health / maxHealth;
            const color = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
            healthBar.fillStyle(color, 1);
            healthBar.fillRect(-15, -20, 30 * healthPercent, 4);
          }
        }
        
        // Unit combat logic
        const target = unit.getData('target');
        const state = unit.getData('state');
        
        if (state === 'attacking' && target && target.active) {
          const dist = Phaser.Math.Distance.Between(unit.x, unit.y, target.x, target.y);
          const range = unit.getData('type') === 'soldier' ? 50 : 30;
          
          if (dist < range) {
            unit.setVelocity(0, 0);
            // Attack
            if (time > (unit.getData('lastAttack') || 0) + 1000) {
              const damage = unit.getData('damage') || 10;
              const targetHealth = target.getData('health') || 0;
              target.setData('health', Math.max(0, targetHealth - damage));
              unit.setData('lastAttack', time);
              
              // Create enhanced damage effect with particles
              const damageText = this.add.text(target.x, target.y - 10, `-${damage}`, {
                fontSize: '16px',
                color: '#ff0000',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
              }).setOrigin(0.5);
              
              this.tweens.add({
                targets: damageText,
                alpha: 0,
                y: target.y - 40,
                scale: 1.5,
                duration: 800,
                ease: 'Power2',
                onComplete: () => damageText.destroy()
              });
              
              // Particle explosion
              for (let i = 0; i < 5; i++) {
                const particle = this.add.circle(target.x, target.y, 3, 0xff0000, 0.9);
                const angle = (i / 5) * Math.PI * 2;
                const distance = 20 + Math.random() * 15;
                this.tweens.add({
                  targets: particle,
                  x: target.x + Math.cos(angle) * distance,
                  y: target.y + Math.sin(angle) * distance,
                  alpha: 0,
                  scale: 0,
                  duration: 400,
                  onComplete: () => particle.destroy()
                });
              }
              
              if (target.getData('health') <= 0) {
                if (target === aiBase) {
                  setGameOver({ won: true, reason: 'Enemy base destroyed!' });
                }
                target.destroy();
                unit.setData('target', null);
                unit.setData('state', 'idle');
              }
            }
          } else {
            this.physics.moveToObject(unit, target, 120);
          }
        }
        
        // Resource gathering
        if (state === 'gathering' && target) {
          const dist = Phaser.Math.Distance.Between(unit.x, unit.y, target.x, target.y);
          if (dist < 30) {
            unit.setVelocity(0, 0);
            if (time > (unit.getData('lastGather') || 0) + 1000) { // Reduced from 2000ms to 1000ms
              const resourceType = target.getData('type');
              const amount = 15; // Increased from 10 to 15
              setResources(prev => ({
                ...prev,
                [resourceType]: prev[resourceType as keyof GameResources] + amount
              }));
              unit.setData('lastGather', time);
              
              // Create enhanced gather effect
              const gatherText = this.add.text(target.x, target.y - 10, `+${amount}`, {
                fontSize: '16px',
                color: '#00ff00',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
              }).setOrigin(0.5);
              
              this.tweens.add({
                targets: gatherText,
                alpha: 0,
                y: target.y - 40,
                scale: 1.3,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => gatherText.destroy()
              });
              
              // Resource particle effect
              const resourceColor = target.getData('type') === 'matter' ? 0x4a90e2 :
                                   target.getData('type') === 'energy' ? 0xffd700 :
                                   target.getData('type') === 'life' ? 0x50c878 : 0x9d4edd;
              
              for (let i = 0; i < 3; i++) {
                const particle = this.add.circle(target.x, target.y, 2, resourceColor, 0.8);
                const angle = (i / 3) * Math.PI * 2;
                this.tweens.add({
                  targets: particle,
                  x: target.x + Math.cos(angle) * 15,
                  y: target.y + Math.sin(angle) * 15 - 10,
                  alpha: 0,
                  scale: 0,
                  duration: 600,
                  onComplete: () => particle.destroy()
                });
              }
            }
          } else {
            this.physics.moveToObject(unit, target, 100);
          }
        }
      });

      // AI unit spawning
      if (time > lastAiSpawn + 15000 && aiBase && aiBase.active) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 100;
        const x = aiBase.x + Math.cos(angle) * distance;
        const y = aiBase.y + Math.sin(angle) * distance;
        
        const aiUnit = this.physics.add.sprite(x, y, '');
        aiUnit.setDisplaySize(24, 24);
        aiUnit.setData('type', 'soldier');
        aiUnit.setData('player', 2);
        aiUnit.setData('health', 200);
        aiUnit.setData('maxHealth', 200);
        aiUnit.setData('damage', 25);
        aiUnit.setData('target', playerBase);
        aiUnit.setData('state', 'attacking');
        
        const aiGraphic = createUnitGraphic(this, x, y, 0xff4444, 'soldier');
        aiUnit.setData('graphic', aiGraphic);
        
        // Move towards player base
        this.physics.moveToObject(aiUnit, playerBase, 100);
        aiUnits.push(aiUnit);
        aiUnitsRef.current = aiUnits;
        lastAiSpawn = time;
        
        sendAIMessage('LIRA', 'Enemy units detected! Prepare defenses!');
      }

      // AI unit combat
      aiUnits.forEach(aiUnit => {
        if (!aiUnit.active) return;
        
        const graphic = aiUnit.getData('graphic');
        if (graphic) {
          graphic.setPosition(aiUnit.x, aiUnit.y);
          
          const healthBar = graphic.getData('healthBar');
          if (healthBar) {
            const health = aiUnit.getData('health') || 200;
            const maxHealth = aiUnit.getData('maxHealth') || 200;
            healthBar.clear();
            const healthPercent = health / maxHealth;
            const color = healthPercent > 0.5 ? 0xff0000 : healthPercent > 0.25 ? 0xff8800 : 0x880000;
            healthBar.fillStyle(color, 1);
            healthBar.fillRect(-15, -20, 30 * healthPercent, 4);
          }
        }
        
        const target = aiUnit.getData('target');
        if (target && target.active) {
          const dist = Phaser.Math.Distance.Between(aiUnit.x, aiUnit.y, target.x, target.y);
          if (dist < 50) {
            aiUnit.setVelocity(0, 0);
            if (time > (aiUnit.getData('lastAttack') || 0) + 1000) {
              const damage = aiUnit.getData('damage') || 25;
              const targetHealth = target.getData('health') || 0;
              target.setData('health', Math.max(0, targetHealth - damage));
              aiUnit.setData('lastAttack', time);
              
              if (target.getData('health') <= 0) {
                if (target === playerBase) {
                  setGameOver({ won: false, reason: 'Your base was destroyed!' });
                }
                target.destroy();
                aiUnit.setData('target', null);
                aiUnit.setData('state', 'idle');
              }
            }
          } else {
            this.physics.moveToObject(aiUnit, target, 100);
          }
        }
      });

      // Player unit vs AI unit combat
      playerUnits.forEach(playerUnit => {
        if (!playerUnit.active) return;
        aiUnits.forEach(aiUnit => {
          if (!aiUnit.active) return;
          const dist = Phaser.Math.Distance.Between(playerUnit.x, playerUnit.y, aiUnit.x, aiUnit.y);
          if (dist < 40) {
            // Combat
            if (time > (playerUnit.getData('lastCombat') || 0) + 1000) {
              const playerDamage = playerUnit.getData('damage') || 10;
              const aiHealth = aiUnit.getData('health') || 200;
              aiUnit.setData('health', Math.max(0, aiHealth - playerDamage));
              playerUnit.setData('lastCombat', time);
              
              if (aiUnit.getData('health') <= 0) {
                const graphic = aiUnit.getData('graphic');
                if (graphic) graphic.destroy();
                aiUnit.destroy();
              }
            }
            
            if (time > (aiUnit.getData('lastCombat') || 0) + 1000) {
              const aiDamage = aiUnit.getData('damage') || 25;
              const playerHealth = playerUnit.getData('health') || 100;
              playerUnit.setData('health', Math.max(0, playerHealth - aiDamage));
              aiUnit.setData('lastCombat', time);
              
              if (playerUnit.getData('health') <= 0) {
                const graphic = playerUnit.getData('graphic');
                if (graphic) graphic.destroy();
                const ring = playerUnit.getData('selectionRing');
                if (ring) ring.destroy();
                playerUnit.destroy();
              }
            }
          }
        });
      });

      // Enhanced Camera movement with WASD and edge scrolling
      const camera = this.cameras.main;
      const panSpeed = 200;
      const speed = (panSpeed * delta) / 1000;
      let moveX = 0;
      let moveY = 0;

      // Keyboard controls (Arrow keys + WASD)
      if (cursors?.left.isDown || wasd?.A.isDown) moveX -= speed;
      if (cursors?.right.isDown || wasd?.D.isDown) moveX += speed;
      if (cursors?.up.isDown || wasd?.W.isDown) moveY -= speed;
      if (cursors?.down.isDown || wasd?.S.isDown) moveY += speed;

      // Edge scrolling (only when not selecting)
      if (!isSelecting) {
        const pointer = this.input.activePointer;
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        const edgeThickness = 10;

        if (pointer.x >= screenWidth - edgeThickness) {
          moveX += speed;
        } else if (pointer.x <= edgeThickness) {
          moveX -= speed;
        }

        if (pointer.y >= screenHeight - edgeThickness) {
          moveY += speed;
        } else if (pointer.y <= edgeThickness) {
          moveY -= speed;
        }
      }

      // Apply camera movement
      if (moveX !== 0 || moveY !== 0) {
        const newX = Phaser.Math.Clamp(
          camera.scrollX + moveX,
          0,
          width * 2 - (width / camera.zoom)
        );
        const newY = Phaser.Math.Clamp(
          camera.scrollY + moveY,
          0,
          height * 2 - (height / camera.zoom)
        );
        camera.setScroll(newX, newY);
      }

      // Space bar - center camera on selection
      if (this.input.keyboard?.checkDown(this.input.keyboard.addKey('SPACE'), 200)) {
        if (selectedUnits.length > 0) {
          const avgX = selectedUnits.reduce((sum, u) => sum + (u.active ? u.x : 0), 0) / selectedUnits.length;
          const avgY = selectedUnits.reduce((sum, u) => sum + (u.active ? u.y : 0), 0) / selectedUnits.length;
          this.tweens.add({
            targets: camera,
            scrollX: Phaser.Math.Clamp(avgX - width / 2, 0, width * 2 - width),
            scrollY: Phaser.Math.Clamp(avgY - height / 2, 0, height * 2 - height),
            duration: 500,
            ease: 'Power2'
          });
        }
      }
      
      // Update performance stats display periodically (optional - Phaser has its own loop)
      if (gameLoopRef.current && showPerformanceStats) {
        // Update stats every 500ms to avoid too frequent React updates
        if (time % 500 < delta) {
          setPerformanceStats(gameLoopRef.current.getPerformanceStats());
        }
      }
      
      // Calculate FPS for display (simple implementation)
      if (showPerformanceStats && !performanceStats) {
        const fps = Math.round(1000 / delta);
        setPerformanceStats({
          fps: fps,
          ups: 60,
          frameTime: delta,
          updateTime: delta * 0.3,
          renderTime: delta * 0.7,
          fixedUpdateTime: delta * 0.3,
          droppedFrames: fps < 55 ? 1 : 0,
          qualityLevel: 1.0
        });
      }
    }

    phaserGameRef.current = new Phaser.Game(config);

    return () => {
      // Cleanup: stop game loop first, then cleanup game state, then Phaser
      if (gameLoopRef.current) {
        gameLoopRef.current.cleanup().then(() => {
          gameStateRef.current?.stop();
          phaserGameRef.current?.destroy(true);
          phaserGameRef.current = null;
          gameLoopRef.current = null;
        }).catch((error) => {
          console.error('Error during cleanup:', error);
          gameStateRef.current?.stop();
          phaserGameRef.current?.destroy(true);
          phaserGameRef.current = null;
          gameLoopRef.current = null;
        });
      } else {
        gameStateRef.current?.stop();
        phaserGameRef.current?.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [gameSeed, commanderId]);

  // Resource monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameOver) return;
      // Check for low resources
      Object.entries(resources).forEach(([resource, value]) => {
        if (value < 50 && value > 0) {
          const suggestion = AI_SUGGESTIONS.resource_low[0];
          addAIMessage(suggestion.commander, suggestion.message.replace('{resource}', resource));
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [resources, gameOver]);

  const addAIMessage = (commander: string, message: string) => {
    const id = Date.now();
    setAiMessages(prev => [...prev, { commander, message, id }]);
    toast(message, {
      description: `${COMMANDERS[commander].name} - ${COMMANDERS[commander].role}`,
      duration: 5000
    });

    // Remove after 10 seconds
    setTimeout(() => {
      setAiMessages(prev => prev.filter(m => m.id !== id));
    }, 10000);
  };

  const handleBuildBuilding = (buildingId: string) => {
    const building = BUILDINGS[buildingId];
    if (!building) return;

    // Check costs
    const canAfford = Object.entries(building.cost).every(([resource, cost]) => {
      return resources[resource as keyof GameResources] >= (cost || 0);
    });

    if (canAfford) {
      // Deduct costs
      const newResources = { ...resources };
      Object.entries(building.cost).forEach(([resource, cost]) => {
        newResources[resource as keyof GameResources] -= (cost || 0);
      });
      setResources(newResources);

      // Add to build queue
      const buildId = Date.now().toString();
      setBuildQueue(prev => [...prev, {
        id: buildId,
        building: buildingId,
        progress: 0,
        totalTime: building.buildTime
      }]);

      // Simulate building progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 0.1;
        setBuildQueue(prev => prev.map(item => 
          item.id === buildId 
            ? { ...item, progress: Math.min(progress, building.buildTime) }
            : item
        ));
        
        if (progress >= building.buildTime) {
          clearInterval(progressInterval);
          setBuildQueue(prev => prev.filter(item => item.id !== buildId));
          toast.success(`Building ${building.name} complete!`, {
            description: building.description
          });
          addAIMessage('AUREN', `${building.name} construction complete.`);
        }
      }, 100);

      toast.success(`Building ${building.name}`, {
        description: `Construction time: ${building.buildTime}s`
      });

      gameStateRef.current?.logAction('build_building', { buildingId, cost: building.cost });
    } else {
      toast.error('Insufficient resources', {
        description: 'Cannot afford this building'
      });
    }
  };

  const handleResearchTech = (techId: string) => {
    const tech = TECH_TREE[techId];
    if (!tech) return;

    // Check prerequisites
    const hasPrereqs = tech.prerequisites.every(prereq => researchedTechs.has(prereq));
    if (!hasPrereqs) {
      toast.error('Prerequisites not met', {
        description: 'Research required technologies first'
      });
      return;
    }

    // Check costs
    const canAfford = Object.entries(tech.cost).every(([resource, cost]) => {
      return resources[resource as keyof GameResources] >= (cost || 0);
    });

    if (canAfford) {
      // Deduct costs
      const newResources = { ...resources };
      Object.entries(tech.cost).forEach(([resource, cost]) => {
        newResources[resource as keyof GameResources] -= (cost || 0);
      });
      setResources(newResources);

      // Add to researched
      setTimeout(() => {
        setResearchedTechs(prev => new Set([...prev, techId]));
        toast.success(`Research complete: ${tech.name}`, {
          description: tech.effects
        });
        addAIMessage('VIREL', `Technology ${tech.name} integrated. ${tech.effects}`);
        
        gameStateRef.current?.researchTech(techId, 1);
      }, tech.researchTime * 1000);

      toast.info(`Researching ${tech.name}`, {
        description: `Time: ${tech.researchTime}s`
      });
    } else {
      toast.error('Insufficient resources', {
        description: 'Cannot afford this research'
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle unit commands from CommandPanel
  const handleUnitCommand = (command: string, data?: any) => {
    if (!phaserGameRef.current || selectedUnits.length === 0) return;

    const scene = phaserGameRef.current.scene.scenes[0];
    if (!scene) return;

    switch (command) {
      case 'move':
        // Move command is handled by right-click, but we can trigger it here too
        scene.events.emit('command-move', { units: selectedUnits, target: data });
        break;
      case 'attack':
        scene.events.emit('command-attack', { units: selectedUnits, target: data });
        break;
      case 'patrol':
        scene.events.emit('command-patrol', { units: selectedUnits, points: data });
        break;
      case 'special':
        scene.events.emit('command-special', { units: selectedUnits });
        break;
      case 'stop':
        selectedUnits.forEach(unit => {
          if (unit.active) {
            unit.setData('target', null);
            unit.setData('state', 'idle');
            scene.physics.moveTo(unit, unit.x, unit.y, 0);
          }
        });
        break;
    }
  };

  // Handle minimap click
  const handleMinimapClick = (worldX: number, worldY: number) => {
    if (!phaserGameRef.current || !cameraRef.current) return;

    const scene = phaserGameRef.current.scene.scenes[0];
    if (!scene) return;

    // Center camera on clicked position
    const camera = cameraRef.current;
    const width = scene.scale.width;
    const height = scene.scale.height;

    scene.tweens.add({
      targets: camera,
      scrollX: Phaser.Math.Clamp(worldX - width / 2, 0, width * 2 - width),
      scrollY: Phaser.Math.Clamp(worldY - height / 2, 0, height * 2 - height),
      duration: 500,
      ease: 'Power2'
    });
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Loading Screen */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-cyan-400 mb-4">QUATERNION</h1>
            <p className="text-gray-400 mb-4">Initializing game systems...</p>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      {showTutorial && !loading && !gameOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800 border-2 border-cyan-400 rounded-lg p-8 max-w-2xl mx-4">
            <h2 className="text-3xl font-bold text-cyan-400 mb-4">Welcome to Quaternion</h2>
            <div className="space-y-4 text-gray-300 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Objective</h3>
                <p>Balance four resources (Matter, Energy, Life, Knowledge) and achieve victory through one of four paths:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li><strong className="text-cyan-400">Equilibrium:</strong> Keep all resources balanced for 10-15 seconds</li>
                  <li><strong className="text-cyan-400">Technological:</strong> Research Quantum Ascendancy (now faster!)</li>
                  <li><strong className="text-cyan-400">Territorial:</strong> Control the central node for 15-20 seconds</li>
                  <li><strong className="text-cyan-400">Moral:</strong> Make ethical choices (+60 alignment, 3 events)</li>
                </ul>
                <p className="text-xs text-yellow-400 mt-2">⚡ Optimized for 15-25 minute sessions!</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Controls</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Left Click:</strong> Select units</li>
                  <li><strong>Right Click:</strong> Move/Attack/Gather</li>
                  <li><strong>B:</strong> Build Menu</li>
                  <li><strong>T:</strong> Tech Tree</li>
                  <li><strong>Arrow Keys:</strong> Pan camera</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">AI Features</h3>
                <p className="text-sm mb-2">This game uses AI tools including:</p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                  <li><strong className="text-cyan-400">ElevenLabs:</strong> AI voice generation for commanders</li>
                  <li><strong className="text-cyan-400">OpenArt:</strong> AI-generated visual assets</li>
                  <li><strong className="text-cyan-400">Google Gemini 2.5 Flash:</strong> Strategic AI decision-making</li>
                  <li><strong className="text-cyan-400">Fuser:</strong> Adaptive music generation</li>
                  <li><strong className="text-cyan-400">Luma AI:</strong> 3D environment generation</li>
                </ul>
                <p className="text-xs text-gray-400 mt-2">Your AI commanders will provide strategic advice throughout the game.</p>
              </div>
            </div>
            <div className="flex gap-4 justify-end">
              <Button
                onClick={() => setShowTutorial(false)}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Start Playing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-800 border-2 border-cyan-400 rounded-lg p-8 max-w-md text-center">
            {gameOver.won ? (
              <>
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-green-400 mb-2">VICTORY!</h2>
                <p className="text-gray-300 mb-4">{gameOver.reason}</p>
                <p className="text-gray-400 mb-6">Time: {formatTime(gameTime)}</p>
                {gameTime < 1500 && (
                  <p className="text-green-400 text-sm mb-4 font-semibold">
                    ✓ Completed in under 25 minutes - Perfect for Chroma Awards judging!
                  </p>
                )}
                {gameTime >= 1500 && gameTime < 1800 && (
                  <p className="text-yellow-400 text-sm mb-4">
                    ⚠ Completed in 25-30 minutes - Good for judging!
                  </p>
                )}
                {gameTime >= 1800 && (
                  <p className="text-orange-400 text-sm mb-4">
                    ⏱ Over 30 minutes - Consider using Quick Start mode for faster games
                  </p>
                )}
              </>
            ) : (
              <>
                <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-red-400 mb-2">DEFEAT</h2>
                <p className="text-gray-300 mb-4">{gameOver.reason}</p>
                <p className="text-gray-400 mb-6">Time: {formatTime(gameTime)}</p>
              </>
            )}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="border-cyan-400 text-cyan-400"
              >
                Main Menu
              </Button>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                Chroma Awards 2025 Submission | www.ChromaAwards.com
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top HUD */}
      {!gameOver && (
        <>
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-gray-900 to-transparent p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-cyan-400 hover:text-cyan-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit Game
              </Button>

              <div className="flex items-center gap-6">
                {/* Resources */}
                <div className="flex items-center gap-2 bg-gray-800/80 px-3 py-2 rounded-lg">
                  <Box className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-mono">{resources.matter}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/80 px-3 py-2 rounded-lg">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-mono">{resources.energy}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/80 px-3 py-2 rounded-lg">
                  <Leaf className="w-4 h-4 text-green-400" />
                  <span className="text-white font-mono">{resources.life}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/80 px-3 py-2 rounded-lg">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-mono">{resources.knowledge}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-white font-mono flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(gameTime)}
                  {gameTime > 0 && (
                    <>
                      {gameTime < 1800 ? (
                        <span className="text-xs text-green-400 ml-1">
                          ({Math.floor((gameTime / 1800) * 100)}% of 30min)
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-400 ml-1">
                          (Over 30min)
                        </span>
                      )}
                      <span className="text-xs text-cyan-400 ml-2">
                        Target: &lt;25min
                      </span>
                    </>
                  )}
                </div>
                <div className="text-white font-mono">
                  Pop: {population.current}/{population.max}
                </div>
                <div className={`font-mono ${instability > 150 ? 'text-red-400' : instability > 100 ? 'text-yellow-400' : 'text-green-400'}`}>
                  Instability: {instability}%
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPerformanceStats(!showPerformanceStats)}
                  className="text-cyan-400 hover:text-cyan-300"
                  title="Toggle Performance Stats"
                >
                  <Activity className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Game Canvas */}
          <div ref={gameRef} className="w-full h-full" />

          {/* Enhanced RTS Bottom Panel */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-gray-900/95 via-gray-900/90 to-transparent p-4 pointer-events-none">
            <div className="flex items-end justify-between gap-4 max-w-[1800px] mx-auto">
              {/* Left: Unit Panel */}
              <div className="pointer-events-auto">
                <UnitPanel selectedUnits={selectedUnits} onCommand={handleUnitCommand} />
              </div>

              {/* Center: Command Panel */}
              <div className="pointer-events-auto">
                <CommandPanel selectedUnits={selectedUnits} onCommand={handleUnitCommand} />
              </div>

              {/* Right: Build Menu & Tech Tree */}
              <div className="flex flex-col items-end gap-2 pointer-events-auto">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowBuildMenu(!showBuildMenu)}
                    className="bg-cyan-600 hover:bg-cyan-700"
                    size="sm"
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Build
                  </Button>
                  <Button
                    onClick={() => setShowTechTree(!showTechTree)}
                    className="bg-purple-600 hover:bg-purple-700"
                    size="sm"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Tech
                  </Button>
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <Trophy className="w-3 h-3" />
                  <span>Chroma Awards 2025 - Puzzle/Strategy | Tools: ElevenLabs, OpenArt, Gemini, Fuser, Luma AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Build Queue */}
          {buildQueue.length > 0 && (
            <div className="absolute bottom-20 left-4 z-20 space-y-2">
              {buildQueue.map(item => (
                <div key={item.id} className="bg-gray-800/90 border border-cyan-400/30 rounded-lg p-2 min-w-[200px]">
                  <div className="text-white text-sm mb-1">{BUILDINGS[item.building]?.name}</div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-400 transition-all"
                      style={{ width: `${(item.progress / item.totalTime) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Performance Stats */}
          {showPerformanceStats && performanceStats && (
            <div className="absolute top-20 left-4 z-20 bg-gray-800/90 border border-cyan-400/30 rounded-lg p-4 min-w-[200px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-cyan-400 text-sm font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Performance
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPerformanceStats(false)}
                  className="h-4 w-4 p-0 text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-400">FPS:</span>
                  <span className={`font-bold ${performanceStats.fps >= 55 ? 'text-green-400' : performanceStats.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {performanceStats.fps}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">UPS:</span>
                  <span className="text-cyan-400 font-bold">{performanceStats.ups}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Frame:</span>
                  <span className="text-white">{performanceStats.frameTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Update:</span>
                  <span className="text-white">{performanceStats.updateTime.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Render:</span>
                  <span className="text-white">{performanceStats.renderTime.toFixed(2)}ms</span>
                </div>
                {performanceStats.droppedFrames > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dropped:</span>
                    <span className="text-red-400">{performanceStats.droppedFrames}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700">
                  <span className="text-gray-400">Quality:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-400 transition-all"
                        style={{ width: `${performanceStats.qualityLevel * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-xs">{(performanceStats.qualityLevel * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Win Condition Progress */}
          <div className="absolute top-20 left-4 z-20 space-y-2 max-w-xs">
            <div className="bg-gray-800/90 border border-cyan-400/30 rounded-lg p-4">
              <h3 className="text-cyan-400 text-sm font-bold mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Victory Conditions
              </h3>
              <div className="space-y-3">
                {Object.entries(winConditionProgress).map(([key, condition]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">{condition.label}</span>
                      <span className="text-cyan-400">
                        {Math.floor((condition.progress / condition.max) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-300"
                        style={{ width: `${Math.min((condition.progress / condition.max) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Minimap */}
          <div className="absolute bottom-20 right-4 z-20">
            <Minimap
              gameWidth={1200}
              gameHeight={700}
              worldWidth={2400}
              worldHeight={1400}
              playerUnits={playerUnitsRef.current}
              enemyUnits={aiUnitsRef.current}
              buildings={buildingsRef.current}
              camera={cameraRef.current}
              onMinimapClick={handleMinimapClick}
            />
          </div>

          {/* AI Messages */}
          <div className="absolute top-20 right-4 z-20 space-y-2 max-w-sm">
            {aiMessages.map(msg => (
              <div
                key={msg.id}
                className="bg-gray-800/90 border border-cyan-400/30 rounded-lg p-3 animate-in slide-in-from-right"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-cyan-400 text-sm font-bold">
                    {COMMANDERS[msg.commander].name}
                  </span>
                </div>
                <p className="text-white text-sm">{msg.message}</p>
              </div>
            ))}
          </div>

          {/* Build Menu */}
          {showBuildMenu && (
            <BuildMenu
              resources={resources}
              onBuild={handleBuildBuilding}
              onClose={() => setShowBuildMenu(false)}
            />
          )}

          {/* Tech Tree Modal */}
          {showTechTree && (
            <TechTreeModal
              researchedTechs={researchedTechs}
              resources={resources}
              onResearch={handleResearchTech}
              onClose={() => setShowTechTree(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default QuaternionGame;
