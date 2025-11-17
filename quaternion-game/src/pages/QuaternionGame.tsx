import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Zap, Leaf, Box, Building, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { QuaternionGameState } from '@/game/QuaternionGameState';
import { TECH_TREE, BUILDINGS, COMMANDERS, UNIT_TYPES, AI_SUGGESTIONS } from '@/data/quaternionData';

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
  const [buildQueue, setBuildQueue] = useState<Array<{ id: string; name: string; timeRemaining: number; totalTime: number }>>([]);
  const [researchedTechs, setResearchedTechs] = useState<Set<string>>(new Set());
  const [aiMessages, setAiMessages] = useState<Array<{ commander: string; message: string; id: number }>>([]);
  
  // Game metadata
  const [gameSeed] = useState(Math.floor(Math.random() * 1000000));
  const [commanderId] = useState('AUREN');
  const [mapConfig] = useState({ type: 'Crystalline Plains', width: 40, height: 30 });
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    // Initialize game state
    gameStateRef.current = new QuaternionGameState({
      seed: gameSeed,
      mapWidth: 40,
      mapHeight: 30,
      mapType: 'crystalline_plains',
      aiDifficulty: 'medium',
      commanderId: commanderId
    });

    const playerUnits: Phaser.Physics.Arcade.Sprite[] = [];
    const selectedUnits: Phaser.Physics.Arcade.Sprite[] = [];
    let selectionGraphics: Phaser.GameObjects.Graphics;
    let isSelecting = false;
    const selectionStart = { x: 0, y: 0 };
    const resourceNodes: Phaser.GameObjects.Sprite[] = [];
    const buildings: Phaser.GameObjects.Sprite[] = [];

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

    function create(this: Phaser.Scene) {
      const { width, height } = this.cameras.main;

      // Create grid background
      const bgGraphics = this.add.graphics();
      bgGraphics.lineStyle(1, 0x00ffea, 0.08);
      for (let x = 0; x < width * 2; x += 64) {
        bgGraphics.lineBetween(x, 0, x, height * 2);
      }
      for (let y = 0; y < height * 2; y += 64) {
        bgGraphics.lineBetween(0, y, width * 2, y);
      }

      // Create resource nodes
      const nodeTypes = [
        { color: 0x4a90e2, resource: 'matter' },
        { color: 0xffd700, resource: 'energy' },
        { color: 0x50c878, resource: 'life' },
        { color: 0x9d4edd, resource: 'knowledge' }
      ];

      for (let i = 0; i < 12; i++) {
        const nodeType = nodeTypes[i % 4];
        const x = 200 + (i % 4) * 250;
        const y = 150 + Math.floor(i / 4) * 200;
        
        const node = this.add.circle(x, y, 20, nodeType.color, 0.7);
        const glow = this.add.circle(x, y, 30, nodeType.color, 0.2);
        
        this.tweens.add({
          targets: glow,
          scale: { from: 1, to: 1.3 },
          alpha: { from: 0.2, to: 0.05 },
          duration: 2000,
          yoyo: true,
          repeat: -1
        });

        resourceNodes.push(node as Phaser.GameObjects.Sprite);
      }

      // Create player base
      const playerBase = this.add.rectangle(150, 350, 60, 60, 0x00ffea, 0.8);
      buildings.push(playerBase as Phaser.GameObjects.Sprite);

      // Create player units
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const distance = 80;
        const x = 150 + Math.cos(angle) * distance;
        const y = 350 + Math.sin(angle) * distance;
        
        const unit = this.physics.add.sprite(x, y, '');
        const unitGraphic = this.add.circle(0, 0, 8, 0x00ffea);
        unit.setData('graphic', unitGraphic);
        
        unit.setInteractive();
        unit.on('pointerdown', () => {
          if (!selectedUnits.includes(unit)) {
            selectedUnits.forEach(u => {
              const g = u.getData('graphic');
              g.setStrokeStyle(0);
            });
            selectedUnits = [unit];
            const g = unit.getData('graphic');
            g.setStrokeStyle(2, 0xffffff);
          }
        });

        playerUnits.push(unit);
      }

      // Create AI base
      const aiBase = this.add.rectangle(1050, 350, 60, 60, 0xff4444, 0.8);
      buildings.push(aiBase as Phaser.GameObjects.Sprite);

      // Selection graphics
      selectionGraphics = this.add.graphics();

      // Camera controls
      const cursors = this.input.keyboard?.createCursorKeys();
      const camera = this.cameras.main;
      camera.setBounds(0, 0, width * 2, height * 2);

      // Mouse controls for selection
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          // Right click - move command
          if (selectedUnits.length > 0) {
            const worldX = pointer.worldX;
            const worldY = pointer.worldY;
            
            selectedUnits.forEach(unit => {
              this.physics.moveTo(unit, worldX, worldY, 100);
              
              // Stop after reaching destination
              this.time.delayedCall(
                Phaser.Math.Distance.Between(unit.x, unit.y, worldX, worldY) / 100 * 1000,
                () => {
                  unit.setVelocity(0, 0);
                }
              );
            });
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
          selectionGraphics.lineStyle(2, 0x00ffea);
          selectionGraphics.strokeRect(
            selectionStart.x,
            selectionStart.y,
            pointer.worldX - selectionStart.x,
            pointer.worldY - selectionStart.y
          );
        }
      });
    }

    function update(this: Phaser.Scene, time: number, delta: number) {
      // Update game state
      if (gameStateRef.current) {
        gameStateRef.current.update(delta / 1000);
        const state = gameStateRef.current.getState();
        
        setGameTime(Math.floor(state.gameTime));
        setInstability(Math.floor(state.instability));
        
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
        }
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
    }

    phaserGameRef.current = new Phaser.Game(config);

    return () => {
      phaserGameRef.current?.destroy(true);
      phaserGameRef.current = null;
      gameStateRef.current?.stop();
    };
  }, [gameSeed, commanderId]);

  // Resource monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Check for low resources
      Object.entries(resources).forEach(([resource, value]) => {
        if (value < 50 && value > 0) {
          const suggestion = AI_SUGGESTIONS.resource_low[0];
          addAIMessage(suggestion.commander, suggestion.message.replace('{resource}', resource));
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [resources]);

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
      setBuildQueue(prev => [...prev, {
        id: Date.now(),
        building: buildingId,
        progress: 0,
        totalTime: building.buildTime
      }]);

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

      {/* Top HUD */}
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
          <Button
            className="bg-red-600 hover:bg-red-700"
          >
            <Swords className="w-4 h-4 mr-2" />
            Attack
          </Button>
        </div>
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
    </div>
  );
};

export default QuaternionGame;
