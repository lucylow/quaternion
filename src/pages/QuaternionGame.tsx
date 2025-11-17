import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Zap, Leaf, Box, Building, Swords, Trophy, X, RotateCcw, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { QuaternionGameState } from '@/game/QuaternionGameState';
import { TECH_TREE, BUILDINGS, COMMANDERS, UNIT_TYPES, AI_SUGGESTIONS } from '@/data/quaternionData';
import { BuildMenu } from '@/components/game/BuildMenu';
import { TechTreeModal } from '@/components/game/TechTreeModal';
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
  const [showTechTree, setShowTechTree] = useState(false);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [buildQueue, setBuildQueue] = useState<Array<{ id: string; building: string; progress: number; totalTime: number }>>([]);
  const [researchedTechs, setResearchedTechs] = useState<Set<string>>(new Set());
  const [aiMessages, setAiMessages] = useState<Array<{ commander: string; message: string; id: number }>>([]);
  const [gameOver, setGameOver] = useState<{ won: boolean; reason: string } | null>(null);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
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
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      }
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

      // Create enhanced grid background with gradient
      const bgGraphics = this.add.graphics();
      bgGraphics.fillGradientStyle(0x001122, 0x001122, 0x002244, 0x002244, 1);
      bgGraphics.fillRect(0, 0, width * 2, height * 2);
      
      bgGraphics.lineStyle(1, 0x00ffea, 0.1);
      for (let x = 0; x < width * 2; x += 64) {
        bgGraphics.lineBetween(x, 0, x, height * 2);
      }
      for (let y = 0; y < height * 2; y += 64) {
        bgGraphics.lineBetween(0, y, width * 2, y);
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

      // Create AI base
      aiBase = this.add.rectangle(1050, 350, 80, 80, 0xff4444, 0.9);
      aiBase.setStrokeStyle(3, 0xff4444, 1);
      aiBase.setData('type', 'base');
      aiBase.setData('player', 2);
      aiBase.setData('health', 1000);
      aiBase.setData('maxHealth', 1000);
      buildings.push(aiBase as Phaser.GameObjects.Sprite);
      
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

      // Camera controls
      const cursors = this.input.keyboard?.createCursorKeys();
      const camera = this.cameras.main;
      camera.setBounds(0, 0, width * 2, height * 2);

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

      this.input.on('pointerup', () => {
        isSelecting = false;
        selectionGraphics.clear();
      });

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
            if (time > (unit.getData('lastGather') || 0) + 2000) {
              const resourceType = target.getData('type');
              const amount = 10;
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
        lastAiSpawn = time;
        
        addAIMessage('LIRA', 'Enemy units detected! Prepare defenses!');
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

      // Camera movement
      const cursors = this.input.keyboard?.createCursorKeys();
      const camera = this.cameras.main;
      const speed = 5;

      if (cursors?.left.isDown) {
        camera.scrollX -= speed;
      } else if (cursors?.right.isDown) {
        camera.scrollX += speed;
      }

      if (cursors?.up.isDown) {
        camera.scrollY -= speed;
      } else if (cursors?.down.isDown) {
        camera.scrollY += speed;
      }
      
      // Update performance stats display periodically
      if (gameLoopRef.current && showPerformanceStats) {
        // Update stats every 500ms to avoid too frequent React updates
        if (time % 500 < delta) {
          setPerformanceStats(gameLoopRef.current.getPerformanceStats());
        }
      }
    }

    phaserGameRef.current = new Phaser.Game(config);

    return () => {
      // Cleanup: stop game loop first, then cleanup game state, then Phaser
      gameLoopRef.current?.cleanup().then(() => {
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
                <div className="text-white font-mono">
                  Time: {formatTime(gameTime)}
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

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-gray-900 to-transparent p-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => setShowBuildMenu(!showBuildMenu)}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Building className="w-4 h-4 mr-2" />
                Build
              </Button>
              <Button
                onClick={() => setShowTechTree(!showTechTree)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Brain className="w-4 h-4 mr-2" />
                Tech Tree
              </Button>
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
