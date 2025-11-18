/**
 * Route: /game
 * Main game page with Phaser game engine.
 * Edit this file to modify the game page.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Zap, Leaf, Box, Building, Swords, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Minimap } from '@/components/game/Minimap';
import { BuildQueue } from '@/components/game/BuildQueue';
import { TechTreeModal } from '@/components/game/TechTreeModal';
import { BuildMenu } from '@/components/game/BuildMenu';
import { JudgeHUD } from '@/components/game/JudgeHUD';
import { COMMANDERS, AI_SUGGESTIONS, BUILDINGS, TECH_TREE } from '@/data/gameData';
import { toast } from 'sonner';
import { ImageAssetLoader } from '@/game/ImageAssetLoader';
import { AICommanderArchetypes, CommanderProfile } from '@/ai/opponents/AICommanderArchetypes';

interface GameResources {
  ore: number;
  energy: number;
  biomass: number;
  data: number;
}

const Game = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [resources, setResources] = useState<GameResources>({
    ore: 500,
    energy: 250,
    biomass: 100,
    data: 50
  });
  const [population, setPopulation] = useState({ current: 8, max: 50 });
  const [gameTime, setGameTime] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [showTechTree, setShowTechTree] = useState(false);
  const [showCommanders, setShowCommanders] = useState(false);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [buildQueue, setBuildQueue] = useState<Array<{ id: string; name: string; timeRemaining: number; totalTime: number }>>([]);
  const [researchedTechs, setResearchedTechs] = useState<Set<string>>(new Set());
  const [aiMessages, setAiMessages] = useState<Array<{ commander: string; message: string; id: number }>>([]);
  
  const location = useLocation();
  const routeConfig = (location.state as any)?.config;
  
  // Game metadata for Judge HUD replay generation
  const [gameSeed] = useState(routeConfig?.seed || Math.floor(Math.random() * 1000000));
  const [commanderId] = useState(routeConfig?.commanderId || 'AUREN');
  const [mapConfig] = useState({ 
    type: routeConfig?.mapType || routeConfig?.mapId || 'Crystalline Plains', 
    width: routeConfig?.mapWidth || 40, 
    height: routeConfig?.mapHeight || 30,
    mapId: routeConfig?.mapId,
    mapImagePath: routeConfig?.mapImagePath
  });
  const [selectedMapKey, setSelectedMapKey] = useState<string | null>(routeConfig?.mapId ? ImageAssetLoader.getMapKeyByMapId(routeConfig.mapId) : null);
  
  // AI Commander Profile
  const [commanderProfile] = useState<CommanderProfile>(() => {
    const archetype = routeConfig?.archetype || 'THE_TACTICIAN';
    const seed = gameSeed;
    return AICommanderArchetypes.createCommander(archetype as any, seed);
  });
  
  const navigate = useNavigate();
  
  // Context-aware AI suggestion generator
  const generateContextualAISuggestion = (
    currentResources: GameResources,
    currentPopulation: { current: number; max: number },
    researchedTechs: Set<string>,
    buildQueueLength: number
  ): { commander: string; message: string } | null => {
    const suggestions: Array<{ commander: string; message: string; priority: number }> = [];
    
    // Resource-based suggestions
    if (currentResources.ore < 100) {
      suggestions.push({
        commander: 'AUREN',
        message: 'Ore reserves critically low. Build ore extractors immediately.',
        priority: 9
      });
    } else if (currentResources.ore > 800 && currentResources.energy < 100) {
      suggestions.push({
        commander: 'VIREL',
        message: 'Ore surplus detected. Invest in energy reactors to balance production.',
        priority: 8
      });
    }
    
    if (currentResources.energy < 50) {
      suggestions.push({
        commander: 'VIREL',
        message: 'Energy reserves depleted. Prioritize power generation before expansion.',
        priority: 9
      });
    }
    
    if (currentResources.biomass < 50 && researchedTechs.size > 0) {
      suggestions.push({
        commander: 'LIRA',
        message: 'Biomass levels low. Consider building bio labs for sustainable growth.',
        priority: 7
      });
    }
    
    if (currentResources.data < 30 && researchedTechs.size < 3) {
      suggestions.push({
        commander: 'KOR',
        message: 'Data production insufficient. Build data centers to unlock advanced tech.',
        priority: 8
      });
    }
    
    // Population-based suggestions
    if (currentPopulation.current >= currentPopulation.max * 0.9) {
      suggestions.push({
        commander: 'AUREN',
        message: 'Population near capacity. Expand infrastructure or upgrade units.',
        priority: 7
      });
    }
    
    // Tech-based suggestions
    if (researchedTechs.size === 0 && currentResources.data >= 50) {
      suggestions.push({
        commander: 'KOR',
        message: 'Research opportunities available. Start with Data Analysis for faster research.',
        priority: 8
      });
    }
    
    if (researchedTechs.has('quantum_core') && !researchedTechs.has('advanced_refinery')) {
      suggestions.push({
        commander: 'AUREN',
        message: 'Quantum Core complete. Research Advanced Refinery to boost ore production.',
        priority: 7
      });
    }
    
    // Build queue suggestions
    if (buildQueueLength === 0 && currentResources.ore >= 150) {
      suggestions.push({
        commander: 'VIREL',
        message: 'Resources available. Consider building barracks or expanding production.',
        priority: 6
      });
    }
    
    // Commander personality-based suggestions (using archetype)
    const catchphrase = commanderProfile.voiceProfile.catchphrases[
      Math.floor(Math.random() * commanderProfile.voiceProfile.catchphrases.length)
    ];
    
    if (suggestions.length === 0) {
      // Use commander's catchphrase or general advice
      const commanderName = COMMANDERS.find(c => c.id.toLowerCase() === commanderId.toLowerCase())?.name || 'AUREN';
      suggestions.push({
        commander: commanderName,
        message: catchphrase || 'Continue building your strategic advantage.',
        priority: 5
      });
    }
    
    // Sort by priority and return highest priority suggestion
    suggestions.sort((a, b) => b.priority - a.priority);
    return suggestions.length > 0 ? { commander: suggestions[0].commander, message: suggestions[0].message } : null;
  };

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    const playerUnits: Phaser.Physics.Arcade.Sprite[] = [];
    let selectedUnits: Phaser.Physics.Arcade.Sprite[] = [];
    let selectionGraphics: Phaser.GameObjects.Graphics;
    let isSelecting = false;
    let selectionStart = { x: 0, y: 0 };
    const resourceNodes: Phaser.GameObjects.Sprite[] = [];

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

      // Load map assets
      ImageAssetLoader.loadMaps(this);
      
      // If we have a specific map selected, ensure it's loaded
      if (selectedMapKey) {
        const mapAsset = ImageAssetLoader.getMapKeys().find(key => key === selectedMapKey);
        if (mapAsset) {
          console.log(`[Game] Preloading selected map: ${selectedMapKey}`);
        }
      }

      this.load.on('complete', () => {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      });
    }

    function create(this: Phaser.Scene) {
      const { width, height } = this.cameras.main;

      // Try to load map background image if available
      let mapBackground: Phaser.GameObjects.Image | null = null;
      let mapKey: string | null = selectedMapKey;
      
      // If we have a map ID, try to get the corresponding key
      if (!mapKey && mapConfig.mapId) {
        mapKey = ImageAssetLoader.getMapKeyByMapId(mapConfig.mapId);
      }
      
      // If still no key, try to get a random map or use the first available
      if (!mapKey) {
        const availableMaps = ImageAssetLoader.getMapKeys();
        if (availableMaps.length > 0) {
          // Try to find a map that's loaded
          for (const key of availableMaps) {
            if (this.textures.exists(key)) {
              mapKey = key;
              break;
            }
          }
        }
      }
      
      // Create map background if available
      if (mapKey && this.textures.exists(mapKey)) {
        try {
          const texture = this.textures.get(mapKey);
          if (texture && texture.source && texture.source[0]) {
            const textureWidth = texture.source[0].width;
            const textureHeight = texture.source[0].height;
            
            if (textureWidth > 0 && textureHeight > 0) {
              mapBackground = this.add.image(0, 0, mapKey);
              mapBackground.setOrigin(0, 0);
              mapBackground.setDepth(-100); // Behind everything
              
              // Scale to cover the game area
              const scaleX = (width * 2) / textureWidth;
              const scaleY = (height * 2) / textureHeight;
              const scale = Math.max(scaleX, scaleY);
              mapBackground.setScale(scale);
              
              // Add a dark overlay to make game elements more visible
              const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.3);
              overlay.setOrigin(0, 0);
              overlay.setDepth(-99);
              
              console.log(`[Game] Map background loaded: ${mapKey}`);
            }
          }
        } catch (error) {
          console.warn(`[Game] Failed to create map background:`, error);
        }
      }
      
      // Create grid overlay on top of map (if no map, this is the background)
      const bgGraphics = this.add.graphics();
      bgGraphics.lineStyle(1, 0x00ffea, mapBackground ? 0.15 : 0.08);
      for (let x = 0; x < width * 2; x += 64) {
        bgGraphics.lineBetween(x, 0, x, height * 2);
      }
      for (let y = 0; y < height * 2; y += 64) {
        bgGraphics.lineBetween(0, y, width * 2, y);
      }
      bgGraphics.setDepth(-50); // Above map but below units

      // Create player base
      const playerBase = this.add.circle(200, 200, 50, 0x00ffea, 0.3);
      playerBase.setStrokeStyle(3, 0x00ffea);
      this.add.text(200, 270, 'PLAYER BASE', {
        fontSize: '16px',
        color: '#00ffea',
        fontFamily: 'Orbitron',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Create enemy base
      const enemyBase = this.add.circle(width - 200, height - 200, 50, 0xff0000, 0.3);
      enemyBase.setStrokeStyle(3, 0xff0000);
      this.add.text(width - 200, height - 130, 'ENEMY BASE', {
        fontSize: '16px',
        color: '#ff0000',
        fontFamily: 'Orbitron',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Create resource nodes with labels
      const resourceTypes = [
        { color: 0x00ffea, label: 'ORE', type: 'ore' },
        { color: 0xff00aa, label: 'ENERGY', type: 'energy' },
        { color: 0x00ff00, label: 'BIOMASS', type: 'biomass' }
      ];

      resourceTypes.forEach((resType, idx) => {
        for (let i = 0; i < 3; i++) {
          const x = Phaser.Math.Between(200, width - 200);
          const y = Phaser.Math.Between(200, height - 200);
          const resource = this.add.circle(x, y, 20, resType.color, 0.5);
          resource.setStrokeStyle(2, resType.color);
          resource.setData('type', resType.type);
          resource.setData('amount', 1000);
          resource.setInteractive();
          resourceNodes.push(resource as Phaser.GameObjects.Sprite);

          const label = this.add.text(x, y, resType.label[0], {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Orbitron',
            fontStyle: 'bold'
          }).setOrigin(0.5);
        }
      });

      // Create player units
      for (let i = 0; i < 6; i++) {
        const unit = this.physics.add.sprite(
          250 + (i % 3) * 60,
          250 + Math.floor(i / 3) * 60,
          ''
        );
        unit.displayWidth = 40;
        unit.displayHeight = 40;
        unit.setTint(0x00ffea);
        unit.setInteractive();
        unit.setData('type', i < 3 ? 'worker' : 'infantry');
        unit.setData('health', 100);
        unit.setData('maxHealth', 100);
        unit.setData('selected', false);
        
        // Draw unit shape - position graphics at unit location
        const unitGraphics = this.add.graphics();
        unitGraphics.x = unit.x;
        unitGraphics.y = unit.y;
        unitGraphics.fillStyle(0x00ffea, 0.8);
        unitGraphics.fillCircle(0, 0, 20); // Draw at 0,0 relative to graphics position
        unitGraphics.lineStyle(2, 0xffffff);
        unitGraphics.strokeCircle(0, 0, 20);
        
        unit.setData('graphics', unitGraphics);
        playerUnits.push(unit);

        // Unit click handler
        unit.on('pointerdown', () => {
          if (!unit.getData('selected')) {
            selectedUnits.forEach(u => {
              u.setData('selected', false);
              const g = u.getData('graphics') as Phaser.GameObjects.Graphics;
              if (g) {
                g.clear();
                g.fillStyle(0x00ffea, 0.8);
                g.fillCircle(0, 0, 20);
                g.lineStyle(2, 0xffffff);
                g.strokeCircle(0, 0, 20);
              }
            });
            selectedUnits = [unit];
            unit.setData('selected', true);
            const g = unit.getData('graphics') as Phaser.GameObjects.Graphics;
            if (g) {
              g.clear();
              g.fillStyle(0x00ffea, 0.8);
              g.fillCircle(0, 0, 20);
              g.lineStyle(3, 0xffff00);
              g.strokeCircle(0, 0, 20);
            }
            setSelectedUnit(unit.getData('type'));
          }
        });
      }

      // Selection graphics
      selectionGraphics = this.add.graphics();

      // Mouse controls for unit movement
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        // Right-click to move selected units
        if (pointer.rightButtonDown() && selectedUnits.length > 0) {
          selectedUnits.forEach((unit, idx) => {
            // Spread units slightly when moving to same location
            const angle = (idx / selectedUnits.length) * Math.PI * 2;
            const spread = 30;
            const offsetX = Math.cos(angle) * spread;
            const offsetY = Math.sin(angle) * spread;
            
            const targetX = pointer.worldX + offsetX;
            const targetY = pointer.worldY + offsetY;
            
            // Stop current movement
            if (unit.body) {
              (unit.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
            }
            
            // Move to target
            this.physics.moveTo(unit, targetX, targetY, 200);
            
            // Show movement indicator
            const indicator = this.add.circle(pointer.worldX, pointer.worldY, 5, 0x00ff00, 0.8);
            this.tweens.add({
              targets: indicator,
              alpha: 0,
              scale: 3,
              duration: 500,
              onComplete: () => indicator.destroy()
            });
          });
          toast.info(`Moving ${selectedUnits.length} unit(s)`);
        } else if (pointer.leftButtonDown()) {
          // Left-click to select (but not if clicking on a unit - that's handled by unit.on('pointerdown'))
          const clickedUnit = playerUnits.find(unit => {
            const distance = Phaser.Math.Distance.Between(
              pointer.worldX, pointer.worldY,
              unit.x, unit.y
            );
            return distance < 25; // Unit radius
          });
          
          if (!clickedUnit) {
            isSelecting = true;
            selectionStart = { x: pointer.worldX, y: pointer.worldY };
          }
        }
      });

      this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (isSelecting) {
          isSelecting = false;
          
          // Select units in selection box
          const selectionBox = {
            x: Math.min(selectionStart.x, pointer.worldX),
            y: Math.min(selectionStart.y, pointer.worldY),
            width: Math.abs(pointer.worldX - selectionStart.x),
            height: Math.abs(pointer.worldY - selectionStart.y)
          };
          
          const newSelection: Phaser.Physics.Arcade.Sprite[] = [];
          playerUnits.forEach(unit => {
            if (unit.x >= selectionBox.x && 
                unit.x <= selectionBox.x + selectionBox.width &&
                unit.y >= selectionBox.y && 
                unit.y <= selectionBox.y + selectionBox.height) {
              newSelection.push(unit);
            }
          });
          
          // Update selection
          selectedUnits.forEach(u => {
            u.setData('selected', false);
            const g = u.getData('graphics') as Phaser.GameObjects.Graphics;
            if (g) {
              g.clear();
              g.fillStyle(0x00ffea, 0.8);
              g.fillCircle(0, 0, 20);
              g.lineStyle(2, 0xffffff);
              g.strokeCircle(0, 0, 20);
            }
          });
          
          selectedUnits = newSelection;
          selectedUnits.forEach(unit => {
            unit.setData('selected', true);
            const g = unit.getData('graphics') as Phaser.GameObjects.Graphics;
            if (g) {
              g.clear();
              g.fillStyle(0x00ffea, 0.8);
              g.fillCircle(0, 0, 20);
              g.lineStyle(3, 0xffff00);
              g.strokeCircle(0, 0, 20);
            }
          });
          
          if (selectedUnits.length > 0) {
            setSelectedUnit(selectedUnits[0].getData('type'));
            toast.info(`Selected ${selectedUnits.length} unit(s)`);
          } else {
            setSelectedUnit(null);
          }
          
          selectionGraphics.clear();
        }
      });

      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (isSelecting) {
          selectionGraphics.clear();
          selectionGraphics.lineStyle(2, 0x00ffea, 1);
          selectionGraphics.strokeRect(
            selectionStart.x,
            selectionStart.y,
            pointer.worldX - selectionStart.x,
            pointer.worldY - selectionStart.y
          );
          selectionGraphics.fillStyle(0x00ffea, 0.1);
          selectionGraphics.fillRect(
            selectionStart.x,
            selectionStart.y,
            pointer.worldX - selectionStart.x,
            pointer.worldY - selectionStart.y
          );
        }
      });

      // Camera controls
      const cursors = this.input.keyboard?.createCursorKeys();
      const camera = this.cameras.main;
      camera.setBounds(0, 0, width * 2, height * 2);
      camera.setZoom(1);

      // Keyboard shortcuts
      this.input.keyboard?.on('keydown-T', () => setShowTechTree(true));
      this.input.keyboard?.on('keydown-C', () => setShowCommanders(true));
      this.input.keyboard?.on('keydown-B', () => setShowBuildMenu(true));
      this.input.keyboard?.on('keydown-S', () => {
        selectedUnits.forEach(unit => unit.setVelocity(0, 0));
      });

      this.events.on('update', () => {
        if (!cursors) return;
        const speed = 8;
        if (cursors.left?.isDown) camera.scrollX -= speed;
        if (cursors.right?.isDown) camera.scrollX += speed;
        if (cursors.up?.isDown) camera.scrollY -= speed;
        if (cursors.down?.isDown) camera.scrollY += speed;

        // Update unit graphics positions (they follow the unit sprites)
        playerUnits.forEach(unit => {
          const g = unit.getData('graphics') as Phaser.GameObjects.Graphics;
          if (g) {
            // Update graphics position to match unit position
            g.x = unit.x;
            g.y = unit.y;
            
            // Redraw the unit circle at the current position
            g.clear();
            const color = unit.getData('selected') ? 0xffff00 : 0x00ffea;
            const lineWidth = unit.getData('selected') ? 3 : 2;
            g.fillStyle(0x00ffea, 0.8);
            g.fillCircle(0, 0, 20); // Use 0,0 since we set x,y above
            g.lineStyle(lineWidth, color);
            g.strokeCircle(0, 0, 20);
          }
        });
      });

      // Resource generation timer
      this.time.addEvent({
        delay: 2000,
        callback: () => {
          setResources(prev => {
            const updated = {
              ore: prev.ore + 10,
              energy: prev.energy + 5,
              biomass: prev.biomass + 3,
              data: prev.data + 2
            };
            // Update ref for AI suggestions
            currentResourcesRef = updated;
            return updated;
          });
        },
        loop: true
      });

      // Game time
      this.time.addEvent({
        delay: 1000,
        callback: () => setGameTime(prev => prev + 1),
        loop: true
      });

      // Context-aware AI suggestions
      this.time.addEvent({
        delay: 30000, // Every 30 seconds
        callback: () => {
          // Generate contextual suggestion using refs (updated by state changes)
          const contextualSuggestion = generateContextualAISuggestion(
            currentResourcesRef,
            currentPopulationRef,
            currentResearchedTechsRef,
            currentBuildQueueRef.length
          );
          
          // Fallback to random suggestion if no contextual one
          const suggestion = contextualSuggestion || 
            AI_SUGGESTIONS[Math.floor(Math.random() * AI_SUGGESTIONS.length)];
          
          const id = Date.now();
          setAiMessages(prev => [...prev, { ...suggestion, id }]);
          
          // Show toast with commander name and message
          const commander = COMMANDERS.find(c => c.name === suggestion.commander) || COMMANDERS[0];
          toast.info(`${suggestion.commander}: ${suggestion.message}`, {
            description: commander.role,
            duration: 5000
          });
          
          // Auto-remove after 15 seconds
          setTimeout(() => {
            setAiMessages(prev => prev.filter(msg => msg.id !== id));
          }, 15000);
        },
        loop: true
      });
      
      // Event-based AI suggestions (immediate responses to player actions)
      // These will be triggered by game events
    }

    function update(this: Phaser.Scene) {
      // Update unit movement and stop when they reach their destination
      playerUnits.forEach(unit => {
        if (unit.body) {
          const body = unit.body as Phaser.Physics.Arcade.Body;
          const velocity = body.velocity;
          
          // Check if unit has reached its destination
          if (body.speed > 0) {
            const target = body.target as { x: number; y: number } | null;
            if (target) {
              const distance = Phaser.Math.Distance.Between(
                unit.x, unit.y,
                target.x, target.y
              );
              
              // Stop if very close to target
              if (distance < 10) {
                unit.setVelocity(0, 0);
                body.target = null;
              }
            }
          }
          
          // Also stop if velocity is very small
          if (Math.abs(velocity.x) < 1 && Math.abs(velocity.y) < 1 && body.speed < 5) {
            unit.setVelocity(0, 0);
            body.target = null;
          }
        }
      });
    }

    phaserGameRef.current = new Phaser.Game(config);

    return () => {
      phaserGameRef.current?.destroy(true);
      phaserGameRef.current = null;
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBuild = (buildingId: string) => {
    const building = BUILDINGS[buildingId];
    if (!building) return;

    if (
      (!building.cost.ore || resources.ore >= building.cost.ore) &&
      (!building.cost.energy || resources.energy >= building.cost.energy) &&
      (!building.cost.biomass || resources.biomass >= building.cost.biomass) &&
      (!building.cost.data || resources.data >= building.cost.data)
    ) {
      setResources(prev => ({
        ore: prev.ore - (building.cost.ore || 0),
        energy: prev.energy - (building.cost.energy || 0),
        biomass: prev.biomass - (building.cost.biomass || 0),
        data: prev.data - (building.cost.data || 0)
      }));

      setBuildQueue(prev => [...prev, {
        id: Date.now().toString(),
        name: building.name,
        timeRemaining: building.buildTime,
        totalTime: building.buildTime
      }]);

      toast.success(`${building.name} construction started`);
      setShowBuildMenu(false);
      
      // AI response to building construction
      const commander = COMMANDERS.find(c => c.id.toLowerCase() === commanderId.toLowerCase()) || COMMANDERS[0];
      const responses = [
        { commander: commander.name, message: `Excellent choice. ${building.name} will strengthen your position.` },
        { commander: commander.name, message: `${building.name} construction initiated. Strategic move.` },
        { commander: commander.name, message: `Building ${building.name}. This will improve your capabilities.` }
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      const id = Date.now();
      setAiMessages(prev => [...prev, { ...response, id }]);
      setTimeout(() => {
        setAiMessages(prev => prev.filter(msg => msg.id !== id));
      }, 10000);
    } else {
      toast.error('Insufficient resources');
      
      // AI response to insufficient resources
      const commander = COMMANDERS.find(c => c.id.toLowerCase() === commanderId.toLowerCase()) || COMMANDERS[0];
      const responses = [
        { commander: commander.name, message: 'Insufficient resources. Focus on resource production first.' },
        { commander: commander.name, message: 'Not enough resources. Build extractors and reactors.' },
        { commander: 'VIREL', message: 'Resource management is key. Balance your economy first.' }
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      const id = Date.now();
      setAiMessages(prev => [...prev, { ...response, id }]);
      setTimeout(() => {
        setAiMessages(prev => prev.filter(msg => msg.id !== id));
      }, 8000);
    }
  };

  const handleBuildComplete = (id: string) => {
    const item = buildQueue.find(q => q.id === id);
    if (item) {
      const building = Object.values(BUILDINGS).find(b => b.name === item.name);
      if (building?.produces) {
        toast.success(`${item.name} completed! Now producing resources.`);
      } else {
        toast.success(`${item.name} construction complete!`);
      }
    }
  };

  const handleResearch = (techId: string) => {
    const tech = TECH_TREE[techId];
    if (!tech) return;

    if (
      (!tech.cost.ore || resources.ore >= tech.cost.ore) &&
      (!tech.cost.energy || resources.energy >= tech.cost.energy) &&
      (!tech.cost.biomass || resources.biomass >= tech.cost.biomass) &&
      (!tech.cost.data || resources.data >= tech.cost.data)
    ) {
      setResources(prev => ({
        ore: prev.ore - (tech.cost.ore || 0),
        energy: prev.energy - (tech.cost.energy || 0),
        biomass: prev.biomass - (tech.cost.biomass || 0),
        data: prev.data - (tech.cost.data || 0)
      }));

      // AI response to research start
      const commander = COMMANDERS.find(c => c.id.toLowerCase() === commanderId.toLowerCase()) || COMMANDERS[0];
      const researchResponses = [
        { commander: 'KOR', message: `Researching ${tech.name}. Knowledge is power.` },
        { commander: commander.name, message: `${tech.name} research initiated. This will unlock new possibilities.` },
        { commander: 'KOR', message: `Excellent choice. ${tech.name} will enhance your capabilities.` }
      ];
      const researchResponse = researchResponses[Math.floor(Math.random() * researchResponses.length)];
      const researchId = Date.now();
      setAiMessages(prev => [...prev, { ...researchResponse, id: researchId }]);
      setTimeout(() => {
        setAiMessages(prev => prev.filter(msg => msg.id !== researchId));
      }, 10000);

      setTimeout(() => {
        setResearchedTechs(prev => {
          const updated = new Set([...prev, techId]);
          currentResearchedTechsRef = updated;
          return updated;
        });
        toast.success(`Research complete: ${tech.name}! ${tech.effects}`);
        
        // AI response to research completion
        const completeResponses = [
          { commander: 'KOR', message: `Research complete: ${tech.name}. ${tech.effects}` },
          { commander: commander.name, message: `${tech.name} unlocked! New strategic options available.` },
          { commander: 'KOR', message: `Technology ${tech.name} integrated. Efficiency increased.` }
        ];
        const completeResponse = completeResponses[Math.floor(Math.random() * completeResponses.length)];
        const completeId = Date.now();
        setAiMessages(prev => [...prev, { ...completeResponse, id: completeId }]);
        setTimeout(() => {
          setAiMessages(prev => prev.filter(msg => msg.id !== completeId));
        }, 12000);
      }, tech.researchTime * 1000);

      toast.info(`Researching ${tech.name}... (${tech.researchTime}s)`);
    } else {
      toast.error('Insufficient resources for research');
      
      // AI response to insufficient research resources
      const commander = COMMANDERS.find(c => c.id.toLowerCase() === commanderId.toLowerCase()) || COMMANDERS[0];
      const responses = [
        { commander: 'KOR', message: 'Insufficient resources for research. Build data centers to generate data.' },
        { commander: commander.name, message: 'Not enough resources. Focus on production first.' }
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      const id = Date.now();
      setAiMessages(prev => [...prev, { ...response, id }]);
      setTimeout(() => {
        setAiMessages(prev => prev.filter(msg => msg.id !== id));
      }, 8000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-quaternion-darker to-quaternion-dark text-quaternion-light overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-quaternion-darker/90 backdrop-blur-md border-b border-quaternion-primary">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-quaternion-primary hover:text-quaternion-secondary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <h1 className="text-xl font-bold text-quaternion-primary">QUATERNION: NEURAL FRONTIER</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBuildMenu(true)}>
              <Building className="mr-1 h-3 w-3" /> Build
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowTechTree(true)}>
              <Brain className="mr-1 h-3 w-3" /> Tech
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCommanders(true)}>
              <Swords className="mr-1 h-3 w-3" /> Commanders
            </Button>
          </div>
        </div>
      </header>

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-quaternion-darker">
          <h2 className="text-4xl font-bold text-quaternion-primary mb-4">INITIALIZING AI SYSTEMS</h2>
          <p className="text-quaternion-light mb-6">Loading Neural Networks...</p>
          <div className="w-80 h-5 bg-quaternion-dark border border-quaternion-primary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-quaternion-primary to-quaternion-secondary transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
          </div>
        </div>
      )}

      <div className="pt-20 px-4 pb-4">
        <div className="container mx-auto max-w-[1600px]">
          <div className="grid grid-cols-12 gap-4">
            {/* Main Game Area */}
            <div className="col-span-12 lg:col-span-9">
              <div ref={gameRef} className="relative border-2 border-game-panel-border rounded-lg overflow-hidden shadow-game-panel bg-background" style={{ height: '700px' }} />
            </div>

            {/* Right Sidebar */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              {/* Resources Panel */}
              <div className="bg-game-panel/90 backdrop-blur-md border border-game-panel-border/50 rounded-lg p-4 shadow-game-panel">
                <h3 className="text-primary font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Box className="w-4 h-4" />
                  Resources
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded bg-background/30 hover:bg-background/50 transition-colors">
                    <span className="text-xs flex items-center gap-2 text-foreground/70">
                      <Box className="w-3 h-3 text-resource-ore" /> Ore
                    </span>
                    <span className="font-mono text-resource-ore font-bold">{resources.ore}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-background/30 hover:bg-background/50 transition-colors">
                    <span className="text-xs flex items-center gap-2 text-foreground/70">
                      <Zap className="w-3 h-3 text-resource-energy" /> Energy
                    </span>
                    <span className="font-mono text-resource-energy font-bold">{resources.energy}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-background/30 hover:bg-background/50 transition-colors">
                    <span className="text-xs flex items-center gap-2 text-foreground/70">
                      <Leaf className="w-3 h-3 text-resource-biomass" /> Biomass
                    </span>
                    <span className="font-mono text-resource-biomass font-bold">{resources.biomass}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-background/30 hover:bg-background/50 transition-colors">
                    <span className="text-xs flex items-center gap-2 text-foreground/70">
                      <Brain className="w-3 h-3 text-resource-data" /> Data
                    </span>
                    <span className="font-mono text-resource-data font-bold">{resources.data}</span>
                  </div>
                </div>
              </div>

              {/* Game Info Panel */}
              <div className="bg-game-panel/90 backdrop-blur-md border border-game-panel-border/50 rounded-lg p-4 shadow-game-panel">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-foreground/70">Population</span>
                    <span className="font-mono text-primary font-bold">{population.current}/{population.max}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-foreground/70">Game Time</span>
                    <span className="font-mono text-secondary font-bold">
                      {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Build Queue */}
              {buildQueue.length > 0 && (
                <div className="bg-game-panel/90 backdrop-blur-md border border-game-panel-border/50 rounded-lg p-4 shadow-game-panel">
                  <h3 className="text-primary font-bold mb-3 text-sm uppercase tracking-wide">Build Queue</h3>
                  <BuildQueue queue={buildQueue} onItemComplete={handleBuildComplete} />
                </div>
              )}

              {/* Minimap */}
              <div className="bg-game-panel/90 backdrop-blur-md border border-game-panel-border/50 rounded-lg p-4 shadow-game-panel">
                <h3 className="text-primary font-bold mb-3 text-sm uppercase tracking-wide">Tactical Map</h3>
                <Minimap gameWidth={1200} gameHeight={700} playerUnits={[]} enemyUnits={[]} buildings={[]} />
              </div>

              {/* Judge HUD - Replay Generation */}
              <JudgeHUD
                seed={gameSeed}
                commanderId={commanderId}
                mapConfig={mapConfig}
                outcome={resources.ore > 500 ? "Winning" : "In Progress"}
              />

              {/* AI Suggestions */}
              <div className="bg-game-panel/90 backdrop-blur-md border border-accent/30 rounded-lg p-4 shadow-game-panel">
                <h3 className="text-accent font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <MessageCircle className="w-4 h-4" />
                  AI Insights
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {aiMessages.slice(-3).map((msg) => (
                    <div key={msg.id} className="text-xs p-2 rounded bg-background/30 border border-accent/20">
                      <div className="font-bold text-accent mb-1">{msg.commander}</div>
                      <div className="text-foreground/70">{msg.message}</div>
                    </div>
                  ))}
                  {aiMessages.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      AI commanders will provide strategic insights
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Tree Modal */}
      {showTechTree && (
        <TechTreeModal
          researchedTechs={researchedTechs}
          resources={resources}
          onResearch={handleResearch}
          onClose={() => setShowTechTree(false)}
        />
      )}

      {/* Build Menu Modal */}
      {showBuildMenu && (
        <BuildMenu
          resources={resources}
          onBuild={handleBuild}
          onClose={() => setShowBuildMenu(false)}
        />
      )}

      {/* Commanders Modal */}
      {showCommanders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-game-panel border-2 border-game-panel-border rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-[0_0_40px_rgba(0,255,234,0.2)]">
            <h2 className="text-2xl font-bold text-primary mb-6 uppercase tracking-wide">AI Commanders</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {COMMANDERS.map((commander) => (
                <div
                  key={commander.id}
                  className="p-4 rounded-lg bg-background/50 border-2 transition-all hover:scale-105 hover:shadow-neon"
                  style={{ borderColor: commander.color }}
                >
                  <h3 className="font-bold text-lg mb-2" style={{ color: commander.color }}>
                    {commander.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 italic">{commander.role}</p>
                  <p className="text-xs mb-3"><strong>Focus:</strong> {commander.focus}</p>
                  <p className="text-xs italic border-l-2 pl-3 py-2" style={{ borderColor: commander.color }}>
                    "{commander.quote}"
                  </p>
                </div>
              ))}
            </div>
            <Button onClick={() => setShowCommanders(false)} className="w-full" variant="outline">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
