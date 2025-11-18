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
import { EndgameScene } from '@/components/game/EndgameScene';
import { EndgameManager, EndgameScenario } from '@/game/EndgameManager';
import { ImageAssetLoader } from '@/game/ImageAssetLoader';
import { mapLoader } from '@/services/MapLoader';
import { ResourcePuzzleManager } from '@/game/puzzles/ResourcePuzzleManager';
import { ResourceEvent } from '@/game/puzzles/ResourceEventGenerator';
import { AllocationPuzzle } from '@/game/puzzles/AllocationPuzzleManager';
import { MarketOffer } from '@/game/puzzles/BlackMarketSystem';
import { AdvisorResponse } from '@/game/puzzles/ResourceAdvisor';
import { ResourceEventDisplay } from '@/components/game/ResourceEventDisplay';
import { AllocationPuzzleModal } from '@/components/game/AllocationPuzzleModal';
import { BlackMarketPanel } from '@/components/game/BlackMarketPanel';
import { ResourceAdvisorPanel } from '@/components/game/ResourceAdvisorPanel';
import { ResourceType } from '@/game/ResourceManager';
import { initializeAudio } from '@/audio/audioInit';
import { getAudioManager, updateGameAudio, playSFX, playUISound, playResourceSound, playCombatSound, playCommanderDialogue } from '@/audio/AudioSystemIntegration';
import { AXIS_DESIGNS, getAxisDesign, hexToPhaserColor, AI_THOUGHT_VISUALS, BIOME_THEMES } from '@/design/QuaternionDesignSystem';
import { AIStoryGenerator, NarrativeEvent, NarrativeContext } from '@/game/narrative/AIStoryGenerator';
import { NarrativeDisplay } from '@/components/narrative/NarrativeDisplay';
import { ChronicleExporter } from '@/components/narrative/ChronicleExporter';
import { BookOpen, Handshake, Sparkles } from 'lucide-react';
import { AIOffersPanel } from '@/components/creative/AIOffersPanel';
import { AlternativeVictoriesDisplay } from '@/components/creative/AlternativeVictoriesDisplay';
import {
  EmergentDiplomacyAI,
  LivingWorldEvents,
  ProceduralPuzzleGenerator,
  AIDungeonMaster,
  AlternativeVictoryConditions,
  SymbioticGameplay,
  AdaptiveLearningAI,
  DynamicTechTree
} from '@/ai/creative';

interface GameResources {
  ore: number;
  energy: number;
  biomass: number;
  data: number;
}

const QuaternionGame = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const gameStateRef = useRef<QuaternionGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const [resources, setResources] = useState<GameResources>({
    ore: 250,
    energy: 40,
    biomass: 0,
    data: 10
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
  const [gameOver, setGameOver] = useState<{ won: boolean; reason: string; scenario?: EndgameScenario } | null>(null);
  const [endgameScenario, setEndgameScenario] = useState<EndgameScenario | null>(null);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [winConditionProgress, setWinConditionProgress] = useState<Record<string, { progress: number; max: number; label: string }>>({});
  const [showTutorial, setShowTutorial] = useState(true);
  const gameLoopRef = useRef<GameLoop | null>(null);
  
  // Resource Puzzle Systems
  const puzzleManagerRef = useRef<ResourcePuzzleManager | null>(null);
  const [activeEvents, setActiveEvents] = useState<ResourceEvent[]>([]);
  const [activePuzzle, setActivePuzzle] = useState<AllocationPuzzle | null>(null);
  const [marketOffers, setMarketOffers] = useState<MarketOffer[]>([]);
  const [advisorAdvice, setAdvisorAdvice] = useState<AdvisorResponse | null>(null);
  const [lastAdvisorCheck, setLastAdvisorCheck] = useState(0);
  
  // AI Storytelling System
  const storyGeneratorRef = useRef<AIStoryGenerator | null>(null);
  const [narrativeEvents, setNarrativeEvents] = useState<NarrativeEvent[]>([]);
  const [showChronicle, setShowChronicle] = useState(false);
  const [chronicleData, setChronicleData] = useState<any>(null);
  const [lastNarrativeUpdate, setLastNarrativeUpdate] = useState(0);
  
  // AI Creative Gameplay Systems
  const diplomacyAIRef = useRef<EmergentDiplomacyAI | null>(null);
  const worldEventsRef = useRef<LivingWorldEvents | null>(null);
  const puzzleGeneratorRef = useRef<ProceduralPuzzleGenerator | null>(null);
  const dungeonMasterRef = useRef<AIDungeonMaster | null>(null);
  const victoryConditionsRef = useRef<AlternativeVictoryConditions | null>(null);
  const symbioticGameplayRef = useRef<SymbioticGameplay | null>(null);
  const adaptiveLearningRef = useRef<AdaptiveLearningAI | null>(null);
  const dynamicTechTreeRef = useRef<DynamicTechTree | null>(null);
  
  // Creative gameplay state
  const [activeAlliances, setActiveAlliances] = useState<any[]>([]);
  const [worldEvents, setWorldEvents] = useState<any[]>([]);
  const [aiOffers, setAiOffers] = useState<any[]>([]);
  const [alternativeVictories, setAlternativeVictories] = useState<any[]>([]);
  const [dynamicTiles, setDynamicTiles] = useState<any[]>([]);
  const [heroicMoments, setHeroicMoments] = useState<any[]>([]);
  const [lastDiplomacyCheck, setLastDiplomacyCheck] = useState(0);
  const [lastWorldEventCheck, setLastWorldEventCheck] = useState(0);
  const [lastDungeonMasterCheck, setLastDungeonMasterCheck] = useState(0);
  const [lastVictoryCheck, setLastVictoryCheck] = useState(0);
  const [lastSymbioticCheck, setLastSymbioticCheck] = useState(0);
  const [lastLearningCheck, setLastLearningCheck] = useState(0);
  const [lastTechTreeCheck, setLastTechTreeCheck] = useState(0);
  
  // Get game configuration from route state or use defaults
  const location = useLocation();
  const routeConfig = (location.state as any)?.config;
  
  // Try to load room data from localStorage if not in route state (for page refresh/reconnection)
  const loadRoomDataFromStorage = () => {
    try {
      const storedRoomData = localStorage.getItem('quaternion_roomData');
      if (storedRoomData) {
        return JSON.parse(storedRoomData);
      }
    } catch (error) {
      console.warn('Failed to load room data from storage:', error);
    }
    return null;
  };
  
  const storedRoomData = loadRoomDataFromStorage();
  const effectiveConfig = routeConfig || (storedRoomData ? {
    mode: 'multiplayer',
    roomId: localStorage.getItem('quaternion_roomId'),
    playerId: localStorage.getItem('quaternion_playerId'),
    seed: storedRoomData.seed,
    mapType: storedRoomData.mapType,
    mapWidth: storedRoomData.mapWidth,
    mapHeight: storedRoomData.mapHeight,
    cooperativeMode: storedRoomData.cooperativeMode,
    difficulty: storedRoomData.difficulty,
    commanderId: storedRoomData.playersList?.find((p: any) => p.id === localStorage.getItem('quaternion_playerId'))?.commanderId || 'AUREN'
  } : null);
  
  // Game metadata - use config from route state, localStorage, or defaults
  const [gameSeed] = useState(effectiveConfig?.seed || Math.floor(Math.random() * 1000000));
  const [commanderId] = useState(effectiveConfig?.commanderId || 'AUREN');
  const [mapConfig] = useState({
    type: effectiveConfig?.mapType || 'Crystalline Plains',
    width: effectiveConfig?.mapWidth || 40,
    height: effectiveConfig?.mapHeight || 30
  });
  const gameMode = effectiveConfig?.mode || 'single';
  const roomId = effectiveConfig?.roomId;
  const playerId = effectiveConfig?.playerId;
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    // Initialize audio system (non-blocking, will work after user interaction)
    initializeAudio().catch(err => console.warn('Audio init deferred:', err));

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
      mapType: effectiveConfig?.mapType || 'crystalline_plains',
      aiDifficulty: effectiveConfig?.difficulty || 'medium',
      commanderId: commanderId,
      mode: gameMode,
      roomId: roomId,
      playerId: playerId
    });
    
    // Log multiplayer connection info
    if (gameMode === 'multiplayer' && roomId) {
      console.log('Multiplayer game initialized:', {
        roomId,
        playerId,
        seed: gameSeed,
        mapType: effectiveConfig?.mapType,
        cooperativeMode: effectiveConfig?.cooperativeMode
      });
    }

    // Initialize Resource Puzzle Manager
    if (gameStateRef.current && gameStateRef.current.resourceManager) {
      puzzleManagerRef.current = new ResourcePuzzleManager(
        gameStateRef.current.resourceManager
      );
      puzzleManagerRef.current.initialize(Date.now());
    }

    // Initialize AI Story Generator
    storyGeneratorRef.current = new AIStoryGenerator();
    
    // Generate initial lore
    const initialContext: NarrativeContext = {
      biome: mapConfig.type,
      resourceBalance: {
        matter: resources.ore,
        energy: resources.energy,
        life: resources.biomass,
        knowledge: resources.data
      },
      instability: 0,
      playerDecisions: [],
      gameTime: 0,
      ethicalAlignment: 0,
      techTier: 0
    };
    
    storyGeneratorRef.current.updateContext(initialContext);
    
    // Generate initial biome lore
    storyGeneratorRef.current.generateNarrativeEvent('lore', initialContext).then(event => {
      setNarrativeEvents([event]);
      sendAIMessage('CORE', event.content);
    });

    // Initialize AI Creative Gameplay Systems
    const currentPlayerId = playerId || effectiveConfig?.playerId || 'player_' + Date.now();
    
    diplomacyAIRef.current = new EmergentDiplomacyAI(currentPlayerId);
    worldEventsRef.current = new LivingWorldEvents();
    puzzleGeneratorRef.current = new ProceduralPuzzleGenerator();
    dungeonMasterRef.current = new AIDungeonMaster();
    victoryConditionsRef.current = new AlternativeVictoryConditions();
    symbioticGameplayRef.current = new SymbioticGameplay();
    adaptiveLearningRef.current = new AdaptiveLearningAI();
    dynamicTechTreeRef.current = new DynamicTechTree();
    
    // Initialize adaptive learning with player profile
    adaptiveLearningRef.current.getOrCreateProfile(currentPlayerId);

    const playerUnits: Phaser.Physics.Arcade.Sprite[] = [];
    const aiUnits: Phaser.Physics.Arcade.Sprite[] = [];
    const selectedUnits: Phaser.Physics.Arcade.Sprite[] = [];
    let selectionGraphics: Phaser.GameObjects.Graphics;
    let isSelecting = false;
    let selectionStart = { x: 0, y: 0 };
    const resourceNodes: Phaser.GameObjects.Sprite[] = [];
    const buildings: Phaser.GameObjects.Sprite[] = [];
    let playerBase: Phaser.GameObjects.Rectangle;
    let aiBase: Phaser.GameObjects.Rectangle;
    let lastAiSpawn = 0;
    const lastResourceGather = 0;

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

      // Initialize asset lists first
      ImageAssetLoader.initializeAssets();

      // Load game images (maps, monsters, countries)
      ImageAssetLoader.loadAssets(this);

      // Wait for all assets to load
      this.load.once('complete', () => {
        const loadedTextures = Object.keys(this.textures.list);
        console.log('[Preload] Assets loaded successfully');
        console.log('[Preload] Total textures loaded:', loadedTextures.length);
        console.log('[Preload] Available textures:', loadedTextures);
        
        // Log which map textures were successfully loaded
        const mapKeys = ImageAssetLoader.getMapKeys();
        const loadedMaps = mapKeys.filter(key => this.textures.exists(key));
        console.log(`[Preload] Successfully loaded ${loadedMaps.length}/${mapKeys.length} map textures:`, loadedMaps);
        
        if (loadedMaps.length === 0) {
          console.warn('[Preload] WARNING: No map textures loaded! Check asset paths and file names.');
        }
        
        setTimeout(() => {
          setLoading(false);
          gameStateRef.current?.start();
        }, 500);
      });

      // Log loading progress
      this.load.on('filecomplete', (key: string, type: string, data: any) => {
        console.log(`[Preload] Loaded: ${key} (${type})`);
      });

      this.load.on('loaderror', (file: Phaser.Loader.File) => {
        console.error(`[Preload] Failed to load: ${file.key} from ${file.src}`);
        console.error(`[Preload] Error details:`, file);
      });

      this.load.on('fileprogress', (file: Phaser.Loader.File, value: number) => {
        if (value > 0 && value < 1) {
          console.log(`[Preload] Loading ${file.key}: ${(value * 100).toFixed(1)}%`);
        }
      });

      // Fallback timeout in case assets don't load
      setTimeout(() => {
        if (this.load.progress < 1) {
          console.warn(`Assets not fully loaded. Progress: ${(this.load.progress * 100).toFixed(1)}%`);
          console.log('Available textures:', Object.keys(this.textures.list));
          setLoading(false);
          gameStateRef.current?.start();
        }
      }, 5000);
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

    // Create enhanced unit graphics with axis-themed animations
    function createUnitGraphic(scene: Phaser.Scene, x: number, y: number, color: number, type: string = 'worker', axis?: 'matter' | 'energy' | 'life' | 'knowledge'): Phaser.GameObjects.Container {
      const container = scene.add.container(x, y);
      container.setDepth(100); // Ensure units are visible above background
      
      // Determine axis design if not provided (default to matter for workers, energy for soldiers)
      const unitAxis = axis || (type === 'worker' ? 'matter' : 'energy');
      const design = AXIS_DESIGNS[unitAxis];
      const primaryColor = hexToPhaserColor(design.primary);
      const glowColor = hexToPhaserColor(design.glow);
      
      // Base shape based on type and axis with improved visuals
      let shape: Phaser.GameObjects.Graphics;
      if (type === 'worker') {
        shape = scene.add.graphics();
        // Outer glow with axis color
        shape.fillStyle(glowColor, 0.3);
        shape.fillCircle(0, 0, 16);
        // Main body with axis-specific shape
        if (design.shape === 'angular') {
          // Matter: Angular geometric
          shape.fillStyle(primaryColor, 0.95);
          shape.fillRect(-10, -10, 20, 20);
          shape.lineStyle(2, glowColor, 1);
          shape.strokeRect(-10, -10, 20, 20);
        } else {
          // Default circular
          shape.fillStyle(primaryColor, 0.95);
          shape.fillCircle(0, 0, 12);
          shape.lineStyle(2, glowColor, 1);
          shape.strokeCircle(0, 0, 12);
        }
        // Inner highlight
        shape.fillStyle(0xffffff, 0.6);
        shape.fillCircle(-3, -3, 4);
        // Tool indicator with axis styling
        shape.lineStyle(1, glowColor, 0.8);
        shape.lineBetween(-6, 6, 6, 6);
      } else if (type === 'soldier') {
        shape = scene.add.graphics();
        // Outer glow
        shape.fillStyle(glowColor, 0.3);
        shape.fillCircle(0, 0, 18);
        // Main triangle body with axis color
        shape.fillStyle(primaryColor, 0.95);
        shape.fillTriangle(-12, 10, 0, -12, 12, 10);
        shape.lineStyle(2, glowColor, 1);
        shape.strokeTriangle(-12, 10, 0, -12, 12, 10);
        // Weapon indicator with energy effect
        shape.lineStyle(2, glowColor, 0.9);
        shape.lineBetween(0, -12, 0, -18);
        // Add energy particle effect for energy axis
        if (unitAxis === 'energy') {
          shape.fillStyle(glowColor, 0.6);
          shape.fillCircle(0, -15, 3);
        }
      } else {
        shape = scene.add.graphics();
        // Outer glow
        shape.fillStyle(glowColor, 0.3);
        if (design.shape === 'angular') {
          shape.fillRect(-16, -16, 32, 32);
        } else {
          shape.fillCircle(0, 0, 16);
        }
        // Main body
        shape.fillStyle(primaryColor, 0.95);
        if (design.shape === 'angular') {
          shape.fillRect(-12, -12, 24, 24);
          shape.lineStyle(2, glowColor, 1);
          shape.strokeRect(-12, -12, 24, 24);
        } else {
          shape.fillCircle(0, 0, 12);
          shape.lineStyle(2, glowColor, 1);
          shape.strokeCircle(0, 0, 12);
        }
        // Inner pattern based on axis
        if (design.shape === 'fractal') {
          shape.lineStyle(1, glowColor, 0.7);
          shape.strokeCircle(0, 0, 8);
          shape.lineBetween(-6, 0, 6, 0);
          shape.lineBetween(0, -6, 0, 6);
        } else {
          shape.lineStyle(1, glowColor, 0.7);
          shape.lineBetween(-6, 0, 6, 0);
          shape.lineBetween(0, -6, 0, 6);
        }
      }
      
      container.add(shape);
      
      // Enhanced pulsing animation with axis-specific timing
      const pulseDuration = unitAxis === 'energy' ? 800 : 1000;
      scene.tweens.add({
        targets: container,
        scaleX: { from: 1, to: 1.1 },
        scaleY: { from: 1, to: 1.1 },
        duration: pulseDuration,
        yoyo: true,
        repeat: -1,
        ease: unitAxis === 'energy' ? 'Power2' : 'Sine.easeInOut'
      });
      
      // Health bar background with axis-themed border
      const healthBg = scene.add.graphics();
      healthBg.fillStyle(0x000000, 0.7);
      healthBg.fillRect(-16, -22, 32, 6);
      healthBg.lineStyle(1, glowColor, 0.5);
      healthBg.strokeRect(-16, -22, 32, 6);
      container.add(healthBg);
      
      // Health bar with axis color gradient
      const healthBar = scene.add.graphics();
      healthBar.fillStyle(primaryColor, 1);
      healthBar.fillRect(-15, -21, 30, 4);
      container.add(healthBar);
      container.setData('healthBar', healthBar);
      container.setData('maxHealth', 100);
      container.setData('health', 100);
      container.setData('axis', unitAxis);
      
      return container;
    }

    function create(this: Phaser.Scene) {
      const { width, height } = this.cameras.main;

      // Create particle texture if it doesn't exist (for particle effects)
      if (!this.textures.exists('particle')) {
        const particleGraphics = this.add.graphics();
        particleGraphics.fillStyle(0xffffff, 1);
        particleGraphics.fillCircle(0, 0, 2);
        particleGraphics.generateTexture('particle', 4, 4);
        particleGraphics.destroy();
      }

      // Use a map image as background if available, otherwise fall back to gradient
      let backgroundImage: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics | null = null;

      // Log all available textures for debugging
      const availableTextures = Object.keys(this.textures.list);
      console.log('[Background] Available textures:', availableTextures);
      console.log('[Background] Total textures:', availableTextures.length);

      // Try to use selected map first, then fall back to random map or gradient
      const selectedMapId = routeConfig?.mapId;
      let mapKey: string | null = null;

      if (selectedMapId) {
        console.log(`[Background] Selected map ID: ${selectedMapId}`);
        // Try to load the selected map using the mapping helper
        mapKey = ImageAssetLoader.getMapKeyByMapId(selectedMapId);
        console.log(`[Background] Mapped to key: ${mapKey}`);
        
        // Fallback: try to find by path if direct mapping fails
        if (!mapKey) {
          const mapConfig = mapLoader.getMapById(selectedMapId);
          if (mapConfig) {
            const asset = ImageAssetLoader.getMapAssetByPath(mapConfig.imagePath);
            if (asset) {
              mapKey = asset.key;
              console.log(`[Background] Found by path, key: ${mapKey}`);
            }
          }
        }
        
        // Verify the map key exists in textures
        if (mapKey && !this.textures.exists(mapKey)) {
          console.warn(`[Background] Map texture not found for key: ${mapKey}, trying fallback`);
          mapKey = null;
        } else if (mapKey) {
          console.log(`[Background] Confirmed texture exists for key: ${mapKey}`);
        }
      }

      // If no specific map found, try to find any available map
      if (!mapKey) {
        const mapKeys = ImageAssetLoader.getMapKeys();
        console.log('[Background] No specific map selected, trying available maps:', mapKeys);
        // Try each map key until we find one that exists
        const shuffledKeys = [...mapKeys].sort(() => Math.random() - 0.5);
        for (const key of shuffledKeys) {
          if (this.textures.exists(key)) {
            mapKey = key;
            console.log(`[Background] Found available map: ${key}`);
            break;
          } else {
            console.warn(`[Background] Map texture not found: ${key}`);
          }
        }
      }
      
      if (!mapKey) {
        console.warn('[Background] No map textures available. Available textures:', availableTextures);
        console.warn('[Background] Expected map keys:', ImageAssetLoader.getMapKeys());
      }

      // Helper function to create map background
      const createMapBackground = (key: string): Phaser.GameObjects.Image | null => {
        if (!this.textures.exists(key)) {
          console.warn(`[Background] Texture ${key} does not exist`);
          return null;
        }
        try {
          // Get texture dimensions
          const texture = this.textures.get(key);
          if (!texture || !texture.source || !texture.source[0]) {
            console.error(`[Background] Invalid texture structure for ${key}`);
            return null;
          }
          
          const textureWidth = texture.source[0].width;
          const textureHeight = texture.source[0].height;
          
          if (!textureWidth || !textureHeight || textureWidth === 0 || textureHeight === 0) {
            console.error(`[Background] Invalid texture dimensions for ${key}: ${textureWidth}x${textureHeight}`);
            return null;
          }
          
          console.log(`[Background] Creating map image with key: ${key}, dimensions: ${textureWidth}x${textureHeight}`);
          
          // Create map image at origin (0,0) to cover the entire game world
          const img = this.add.image(0, 0, key);
          
          // Scale to cover the entire game world (width * 2, height * 2)
          // Maintain aspect ratio while covering the area
          const scaleX = (width * 2) / textureWidth;
          const scaleY = (height * 2) / textureHeight;
          const scale = Math.max(scaleX, scaleY);
          
          img.setScale(scale);
          img.setOrigin(0, 0); // Top-left origin for world positioning
          img.setAlpha(0.4); // Semi-transparent so game elements are visible
          img.setTint(0x001122); // Darken the map slightly
          img.setDepth(-1000); // Behind everything
          
          console.log(`[Background] Map background created successfully: ${key} at scale ${scale.toFixed(2)}`);
          return img;
        } catch (error) {
          console.error(`[Background] Failed to create map image with key ${key}:`, error);
          return null;
        }
      };

      // Try to create the map image, with error handling
      if (mapKey) {
        console.log(`[Background] Attempting to create background with key: ${mapKey}`);
        backgroundImage = createMapBackground(mapKey);
        
        // If map creation failed, try to find another available map
        if (!backgroundImage) {
          console.log('[Background] Primary map failed, trying fallback maps...');
          const mapKeys = ImageAssetLoader.getMapKeys();
          for (const key of mapKeys) {
            if (key !== mapKey && this.textures.exists(key)) {
              console.log(`[Background] Trying fallback map: ${key}`);
              backgroundImage = createMapBackground(key);
              if (backgroundImage) {
                console.log(`[Background] Successfully using fallback map: ${key}`);
                break;
              }
            }
          }
        } else {
          console.log(`[Background] Successfully created background with primary map: ${mapKey}`);
        }
      }
      
      // Fallback to gradient background if map image creation failed
      if (!backgroundImage) {
        console.warn('[Background] All map attempts failed, using gradient fallback');
        const bgGraphics = this.add.graphics();
        bgGraphics.fillGradientStyle(0x001122, 0x001122, 0x002244, 0x002244, 1);
        bgGraphics.fillRect(0, 0, width * 2, height * 2);
        bgGraphics.setDepth(-1000);
        backgroundImage = bgGraphics;
        console.log('[Background] Gradient fallback background created');
      }
      
      // Add grid overlay on top of background
      const gridGraphics = this.add.graphics();
      gridGraphics.lineStyle(1, 0x00ffea, 0.15);
      for (let x = 0; x < width * 2; x += 64) {
        gridGraphics.lineBetween(x, 0, x, height * 2);
      }
      for (let y = 0; y < height * 2; y += 64) {
        gridGraphics.lineBetween(0, y, width * 2, y);
      }
      gridGraphics.setDepth(-999);
      
      // Add subtle animated stars/particles in background with AI thought visuals
      for (let i = 0; i < 50; i++) {
        const star = this.add.circle(
          Math.random() * width * 2,
          Math.random() * height * 2,
          1,
          0x00ffea,
          0.3 + Math.random() * 0.4
        );
        star.setDepth(-998);
        this.tweens.add({
          targets: star,
          alpha: { from: 0.3, to: 0.7 },
          duration: 2000 + Math.random() * 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
      
      // Add AI Thought Visuals: Floating data streams and glowing nodes
      const aiThoughtVisuals: Phaser.GameObjects.GameObject[] = [];
      
      // Create glowing nodes (AI cognition indicators)
      for (let i = 0; i < 8; i++) {
        const nodeX = Math.random() * width * 2;
        const nodeY = Math.random() * height * 2;
        const nodeColor = AI_THOUGHT_VISUALS.glowingNode.color;
        
        const node = this.add.circle(nodeX, nodeY, 3, nodeColor, 0.6);
        node.setDepth(-997);
        
        // Pulsing glow effect
        this.tweens.add({
          targets: node,
          scale: { from: 1, to: 2 },
          alpha: { from: 0.6, to: 0.2 },
          duration: 2000 + Math.random() * 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Slow drift movement
        this.tweens.add({
          targets: node,
          x: nodeX + (Math.random() - 0.5) * 200,
          y: nodeY + (Math.random() - 0.5) * 200,
          duration: 5000 + Math.random() * 5000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        aiThoughtVisuals.push(node);
      }
      
      // Create data streams (floating information particles)
      for (let i = 0; i < 5; i++) {
        const streamX = Math.random() * width * 2;
        const streamY = Math.random() * height * 2;
        const streamColor = AI_THOUGHT_VISUALS.dataStream.color;
        
        // Create a line that moves like a data stream
        const stream = this.add.graphics();
        stream.lineStyle(1, streamColor, 0.4);
        stream.setDepth(-997);
        
        // Animate the stream
        let streamProgress = 0;
        const streamLength = 50 + Math.random() * 50;
        const streamAngle = Math.random() * Math.PI * 2;
        
        this.tweens.add({
          targets: { progress: 0 },
          progress: 1,
          duration: 3000 + Math.random() * 2000,
          repeat: -1,
          onUpdate: (tween) => {
            streamProgress = tween.progress;
            stream.clear();
            stream.lineStyle(1, streamColor, 0.4);
            const startX = streamX + Math.cos(streamAngle) * streamProgress * streamLength;
            const startY = streamY + Math.sin(streamAngle) * streamProgress * streamLength;
            const endX = startX + Math.cos(streamAngle) * 20;
            const endY = startY + Math.sin(streamAngle) * 20;
            stream.lineBetween(startX, startY, endX, endY);
          }
        });
        
        aiThoughtVisuals.push(stream);
      }

      // Create resource nodes with axis-specific enhanced visuals
      const nodeTypes = [
        { resource: 'ore', axis: 'matter' as const },
        { resource: 'energy', axis: 'energy' as const },
        { resource: 'biomass', axis: 'life' as const },
        { resource: 'data', axis: 'knowledge' as const }
      ];

      for (let i = 0; i < 12; i++) {
        const nodeType = nodeTypes[i % 4];
        const design = AXIS_DESIGNS[nodeType.axis];
        const x = 200 + (i % 4) * 250;
        const y = 150 + Math.floor(i / 4) * 200;
        const primaryColor = hexToPhaserColor(design.primary);
        const glowColor = hexToPhaserColor(design.glow);
        
        // Enhanced outer glow with axis-specific effects
        const outerGlow = this.add.circle(x, y, 40, glowColor, 0.2);
        this.tweens.add({
          targets: outerGlow,
          scale: { from: 1, to: 1.6 },
          alpha: { from: 0.2, to: 0.05 },
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Middle glow ring
        const middleGlow = this.add.circle(x, y, 30, glowColor, 0.15);
        this.tweens.add({
          targets: middleGlow,
          scale: { from: 1, to: 1.3 },
          alpha: { from: 0.15, to: 0.08 },
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Main node with axis-specific shape
        let node: Phaser.GameObjects.GameObject;
        if (design.shape === 'angular') {
          // Matter: Angular geometric shape
          const graphics = this.add.graphics();
          graphics.fillStyle(primaryColor, 0.9);
          graphics.fillRect(x - 20, y - 20, 40, 40);
          graphics.lineStyle(3, glowColor, 1);
          graphics.strokeRect(x - 20, y - 20, 40, 40);
          // Add inner geometric pattern
          graphics.lineStyle(2, glowColor, 0.6);
          graphics.moveTo(x - 10, y - 10);
          graphics.lineTo(x + 10, y + 10);
          graphics.moveTo(x + 10, y - 10);
          graphics.lineTo(x - 10, y + 10);
          node = graphics;
        } else if (design.shape === 'dynamic') {
          // Energy: Dynamic particle-like shape
          node = this.add.circle(x, y, 25, primaryColor, 0.9);
          node.setStrokeStyle(3, glowColor, 1);
          // Add pulsing energy effect
          this.tweens.add({
            targets: node,
            scale: { from: 1, to: 1.15 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Power2'
          });
        } else if (design.shape === 'organic') {
          // Life: Organic flowing shape
          const graphics = this.add.graphics();
          graphics.fillStyle(primaryColor, 0.9);
          graphics.fillCircle(x, y, 25);
          graphics.lineStyle(3, glowColor, 1);
          graphics.strokeCircle(x, y, 25);
          // Add organic pattern
          graphics.lineStyle(2, glowColor, 0.5);
          for (let j = 0; j < 8; j++) {
            const angle = (j / 8) * Math.PI * 2;
            graphics.moveTo(x, y);
            graphics.lineTo(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20);
          }
          node = graphics;
        } else {
          // Knowledge: Fractal pattern
          const graphics = this.add.graphics();
          graphics.fillStyle(primaryColor, 0.9);
          graphics.fillCircle(x, y, 25);
          graphics.lineStyle(3, glowColor, 1);
          graphics.strokeCircle(x, y, 25);
          // Add fractal circuitry pattern
          graphics.lineStyle(1.5, glowColor, 0.7);
          graphics.strokeCircle(x, y, 15);
          graphics.strokeCircle(x, y, 10);
          graphics.moveTo(x - 12, y);
          graphics.lineTo(x + 12, y);
          graphics.moveTo(x, y - 12);
          graphics.lineTo(x, y + 12);
          node = graphics;
        }
        
        node.setData('type', nodeType.resource);
        node.setData('amount', 1000);
        node.setData('axis', nodeType.axis);
        node.setInteractive();
        
        // Enhanced icon with axis styling
        const icon = this.add.text(x, y, nodeType.resource.charAt(0).toUpperCase(), {
          fontSize: '18px',
          color: '#ffffff',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);
        
        // Add axis-specific particle emitter
        const particleColor = hexToPhaserColor(design.particle);
        const particles = this.add.particles(x, y, 'particle', {
          speed: design.particleConfig.speed,
          scale: design.particleConfig.scale,
          tint: particleColor,
          lifespan: design.particleConfig.lifespan,
          frequency: 200,
          quantity: design.particleConfig.quantity,
          emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 25), quantity: design.particleConfig.quantity }
        });
        particles.setDepth(-1);
        
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
      
      // Center camera on player base at start
      const playerBaseX = 150;
      const playerBaseY = 350;
      camera.centerOn(playerBaseX, playerBaseY);
      
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
          const scenario = state.endgameScenario || null;
          setEndgameScenario(scenario);
          
          // Generate final chronicle
          if (storyGeneratorRef.current) {
            const narrativeContext: NarrativeContext = {
              biome: mapConfig.type,
              resourceBalance: {
                matter: resources.ore,
                energy: resources.energy,
                life: resources.biomass,
                knowledge: resources.data
              },
              instability: instability,
              playerDecisions: [],
              gameTime: gameTime,
              ethicalAlignment: state.players[0]?.moralAlignment || 0,
              techTier: researchedTechs.size
            };
            
            const timeline = storyGeneratorRef.current.detectTimeline(narrativeContext);
            const currentPlayerId = playerId || effectiveConfig?.playerId || 'player_' + Date.now();
            
            storyGeneratorRef.current.updatePlayerPhilosophy(
              currentPlayerId,
              narrativeContext,
              timeline,
              state.winner === 1 ? 'Victory' : 'Defeat'
            );
            
            // Generate ending narrative
            storyGeneratorRef.current.generateNarrativeEvent('chronicle', narrativeContext).then(event => {
              setNarrativeEvents(prev => [...prev, event]);
            });
            
            // Generate chronicle for export
            storyGeneratorRef.current.generateChronicle(
              currentPlayerId,
              narrativeContext,
              timeline
            ).then(chronicle => {
              setChronicleData(chronicle);
            });
          }
          
          setGameOver({ 
            won: state.winner === 1, 
            reason: 'Game ended',
            scenario: scenario || undefined
          });
          return;
        }
        
        if (state.players.length > 0) {
          const player = state.players[0];
          setResources({
            ore: Math.floor(player.resources.ore),
            energy: Math.floor(player.resources.energy),
            biomass: Math.floor(player.resources.biomass),
            data: Math.floor(player.resources.data)
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

        // Update Audio System - Adaptive Music
        if (!gameOver) {
          // Calculate intensity based on instability and combat state
          const intensity = Math.min(1, instability / 200);
          
          // Calculate morality based on resource balance and ethical alignment
          const resourceBalance = {
            matter: resources.ore,
            energy: resources.energy,
            life: resources.biomass,
            knowledge: resources.data
          };
          const mean = (resourceBalance.matter + resourceBalance.energy + resourceBalance.life + resourceBalance.knowledge) / 4;
          const variance = (
            Math.pow(resourceBalance.matter - mean, 2) +
            Math.pow(resourceBalance.energy - mean, 2) +
            Math.pow(resourceBalance.life - mean, 2) +
            Math.pow(resourceBalance.knowledge - mean, 2)
          ) / 4;
          const balance = Math.sqrt(variance) / mean;
          
          // Morality: -1 (exploit) to +1 (conserve)
          // Positive if life/biomass is high, negative if energy/exploitation is high
          const morality = (resourceBalance.life - resourceBalance.energy) / (mean || 1);
          const normalizedMorality = Math.max(-1, Math.min(1, morality + (state.players[0]?.moralAlignment || 0) / 100));
          
          updateGameAudio({
            intensity,
            morality: normalizedMorality,
            instability
          });
        }

        // Update AI Storytelling System
        if (storyGeneratorRef.current && !gameOver) {
          const currentTime = Date.now();
          
          // Update narrative context
          const narrativeContext: NarrativeContext = {
            biome: mapConfig.type,
            resourceBalance: {
              matter: resources.ore,
              energy: resources.energy,
              life: resources.biomass,
              knowledge: resources.data
            },
            instability: instability,
            playerDecisions: [],
            gameTime: gameTime,
            ethicalAlignment: state.players[0]?.moralAlignment || 0,
            techTier: researchedTechs.size
          };
          
          storyGeneratorRef.current.updateContext(narrativeContext);
          
          // Generate narrative events periodically (every 30 seconds)
          if (currentTime - lastNarrativeUpdate > 30000) {
            const timeline = storyGeneratorRef.current.detectTimeline(narrativeContext);
            
            // Generate dialogue event
            storyGeneratorRef.current.generateNarrativeEvent('dialogue', narrativeContext).then(event => {
              if (event.content) {
                setNarrativeEvents(prev => [...prev, event]);
                const axisCommander: Record<string, string> = {
                  matter: 'AUREN',
                  energy: 'LIRA',
                  life: 'LIRA',
                  knowledge: 'VIREL'
                };
                const commander = event.axis ? axisCommander[event.axis] : 'CORE';
                sendAIMessage(commander, event.content);
              }
            });
            
            setLastNarrativeUpdate(currentTime);
          }
          
          // Update narrative log
          setNarrativeEvents(storyGeneratorRef.current.getNarrativeLog());
        }

        // Update AI Creative Gameplay Systems
        if (!gameOver) {
          const currentTime = Date.now();
          const currentPlayerId = playerId || effectiveConfig?.playerId || 'player_' + Date.now();

          // Emergent Diplomacy - generate alliances (every 60 seconds)
          if (diplomacyAIRef.current && currentTime - lastDiplomacyCheck > 60000) {
            const alliances = diplomacyAIRef.current.generateTerrainDrivenAlliances(state);
            if (alliances.length > 0) {
              setActiveAlliances(prev => [...prev, ...alliances]);
              alliances.forEach(alliance => {
                sendAIMessage('CORE', `New alliance formed: ${alliance.reason}`);
              });
            }
            setLastDiplomacyCheck(currentTime);
          }

          // Living World Events (every 45 seconds)
          if (worldEventsRef.current && currentTime - lastWorldEventCheck > 45000) {
            const playerActions = {
              deforest: 0, // Would track from game state
              pollute: 0,
              extract: 0
            };
            
            const events = worldEventsRef.current.generateEcosystemEvents(state, playerActions);
            if (events.length > 0) {
              setWorldEvents(prev => [...prev, ...events]);
              events.forEach(event => {
                sendAIMessage('LIRA', event.description);
                worldEventsRef.current?.applyEventEffects(event, state);
              });
            }
            
            worldEventsRef.current.updateEvents();
            setLastWorldEventCheck(currentTime);
          }

          // AI Dungeon Master - orchestrate narrative (every 30 seconds)
          if (dungeonMasterRef.current && currentTime - lastDungeonMasterCheck > 30000) {
            const narrative = dungeonMasterRef.current.orchestrateGameNarrative(state);
            
            if (narrative.tiles.length > 0) {
              setDynamicTiles(prev => [...prev, ...narrative.tiles]);
              narrative.tiles.forEach(tile => {
                sendAIMessage('CORE', `${tile.name} discovered: ${tile.description}`);
              });
            }
            
            if (narrative.moments.length > 0) {
              setHeroicMoments(prev => [...prev, ...narrative.moments]);
              narrative.moments.forEach(moment => {
                sendAIMessage('AUREN', moment.setup);
              });
            }
            
            setLastDungeonMasterCheck(currentTime);
          }

          // Alternative Victory Conditions (every 60 seconds)
          if (victoryConditionsRef.current && currentTime - lastVictoryCheck > 60000) {
            const victories = victoryConditionsRef.current.enableCreativeWinConditions(state);
            if (victories.length > 0) {
              setAlternativeVictories(victories);
              
              // Check if any victory achieved
              const achieved = victoryConditionsRef.current.checkVictories(state);
              if (achieved) {
                setGameOver({
                  won: true,
                  reason: `Victory: ${achieved.name}`,
                  scenario: undefined
                });
              }
            }
            setLastVictoryCheck(currentTime);
          }

          // Symbiotic Gameplay - generate offers (every 90 seconds)
          if (symbioticGameplayRef.current && currentTime - lastSymbioticCheck > 90000) {
            const offers = symbioticGameplayRef.current.createPlayerAISymbiosis(
              state,
              currentPlayerId
            );
            if (offers.length > 0) {
              setAiOffers(prev => [...prev, ...offers]);
              offers.forEach(offer => {
                sendAIMessage('CORE', `AI Offer: ${offer.terms}`);
              });
            }
            setLastSymbioticCheck(currentTime);
          }

          // Adaptive Learning AI (every 2 minutes)
          if (adaptiveLearningRef.current && currentTime - lastLearningCheck > 120000) {
            const adaptation = adaptiveLearningRef.current.learnAndMirrorPlayer(state, currentPlayerId);
            if (adaptation.signatureMove) {
              sendAIMessage('KOR', `AI has learned your ${adaptation.signatureMove} tactic!`);
            }
            
            const apprentices = adaptiveLearningRef.current.createAIApprentices(state, currentPlayerId);
            if (apprentices.length > 0) {
              apprentices.forEach(apprentice => {
                sendAIMessage('VIREL', `AI faction is learning ${apprentice.learningFocus} from you`);
              });
            }
            
            setLastLearningCheck(currentTime);
          }

          // Dynamic Tech Tree (every 60 seconds)
          if (dynamicTechTreeRef.current && currentTime - lastTechTreeCheck > 60000) {
            const newTechs = dynamicTechTreeRef.current.generateTerrainInfluencedTech(
              state,
              currentPlayerId
            );
            if (newTechs.length > 0) {
              newTechs.forEach(tech => {
                sendAIMessage('VIREL', `New technology unlocked: ${tech.name} - ${tech.description}`);
                toast.success(`Terrain Tech Unlocked: ${tech.name}`, {
                  description: tech.effects
                });
              });
            }
            setLastTechTreeCheck(currentTime);
          }
        }

        // Update Resource Puzzle Systems
        if (puzzleManagerRef.current && !gameOver) {
          const currentTime = Date.now();
          puzzleManagerRef.current.update(currentTime, {
            resources: {
              [ResourceType.ORE]: resources.ore,
              [ResourceType.ENERGY]: resources.energy,
              [ResourceType.BIOMASS]: resources.biomass,
              [ResourceType.DATA]: resources.data
            },
            maxCapacities: {
              [ResourceType.ORE]: 10000,
              [ResourceType.ENERGY]: 5000,
              [ResourceType.BIOMASS]: 3000,
              [ResourceType.DATA]: 2000
            },
            generationRates: {},
            activeEvents: activeEvents,
            researchedTechs: Array.from(researchedTechs),
            playerBehavior: []
          });

          // Update active events
          setActiveEvents(puzzleManagerRef.current.getActiveEvents());

          // Check for new puzzles
          const puzzles = puzzleManagerRef.current.getActivePuzzles();
          if (puzzles.length > 0 && !activePuzzle) {
            setActivePuzzle(puzzles[0]);
          }

          // Update market offers
          setMarketOffers(puzzleManagerRef.current.getMarketOffers());

          // Check for advisor advice (every 30 seconds)
          if (currentTime - lastAdvisorCheck > 30000) {
            puzzleManagerRef.current.generateAdvisorAdvice(
              'resource_management',
              {
                resources: {
                  [ResourceType.ORE]: resources.ore,
                  [ResourceType.ENERGY]: resources.energy,
                  [ResourceType.BIOMASS]: resources.biomass,
                  [ResourceType.DATA]: resources.data
                },
                maxCapacities: {
                  [ResourceType.ORE]: 10000,
                  [ResourceType.ENERGY]: 5000,
                  [ResourceType.BIOMASS]: 3000,
                  [ResourceType.DATA]: 2000
                },
                generationRates: {},
                activeEvents: activeEvents,
                recentDecisions: []
              },
              currentTime
            ).then(advice => {
              if (advice) {
                setAdvisorAdvice(advice);
                setLastAdvisorCheck(currentTime);
              }
            });
          }
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
              const resourceColor = target.getData('type') === 'ore' ? 0x4a90e2 :
                                   target.getData('type') === 'energy' ? 0xffd700 :
                                   target.getData('type') === 'biomass' ? 0x50c878 : 0x9d4edd;
              
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
        
        // Try to use a monster sprite if available, otherwise use graphics
        const monsterKeys = ImageAssetLoader.getMonsterKeys();
        let monsterKey = '';
        if (monsterKeys.length > 0 && this.textures.exists(monsterKeys[0])) {
          // Use a random monster sprite
          monsterKey = monsterKeys[Math.floor(Math.random() * monsterKeys.length)];
        }
        
        const aiUnit = this.physics.add.sprite(x, y, monsterKey || '');
        if (monsterKey) {
          // Use monster image
          aiUnit.setDisplaySize(48, 48);
          aiUnit.setAlpha(0.9);
          aiUnit.setTint(0xff4444); // Red tint for enemies
        } else {
          // Fallback to graphics
          aiUnit.setDisplaySize(24, 24);
          const aiGraphic = createUnitGraphic(this, x, y, 0xff4444, 'soldier');
          aiUnit.setData('graphic', aiGraphic);
        }
        
        aiUnit.setData('type', 'soldier');
        aiUnit.setData('player', 2);
        aiUnit.setData('health', 200);
        aiUnit.setData('maxHealth', 200);
        aiUnit.setData('damage', 25);
        aiUnit.setData('target', playerBase);
        aiUnit.setData('state', 'attacking');
        
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
          // Update graphic position for units using graphics
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
        } else {
          // For sprite-based units, update floating health bar
          const health = aiUnit.getData('health') || 200;
          const maxHealth = aiUnit.getData('maxHealth') || 200;
          const healthPercent = health / maxHealth;
          
          let healthBar = aiUnit.getData('floatingHealthBar');
          if (!healthBar) {
            // Create health bar once if it doesn't exist
            const healthBarBg = this.add.graphics();
            const healthBarFill = this.add.graphics();
            healthBar = { bg: healthBarBg, fill: healthBarFill };
            aiUnit.setData('floatingHealthBar', healthBar);
          }
          
          // Update health bar position and fill
          healthBar.bg.clear();
          healthBar.bg.fillStyle(0x000000, 0.7);
          healthBar.bg.fillRect(aiUnit.x - 20, aiUnit.y - 35, 40, 6);
          healthBar.bg.setDepth(aiUnit.depth + 1);
          
          healthBar.fill.clear();
          const color = healthPercent > 0.5 ? 0xff0000 : healthPercent > 0.25 ? 0xff8800 : 0x880000;
          healthBar.fill.fillStyle(color, 1);
          healthBar.fill.fillRect(aiUnit.x - 19, aiUnit.y - 34, 38 * healthPercent, 4);
          healthBar.fill.setDepth(aiUnit.depth + 2);
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
                <p>Balance four resources (Ore, Energy, Biomass, Data) and achieve victory through one of four paths:</p>
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
                  <li><strong className="text-cyan-400">Google AI:</strong> Strategic AI decision-making</li>
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

      {/* Endgame Scene */}
      {gameOver && endgameScenario ? (
        <EndgameScene
          endgameData={EndgameManager.getEndgameData(
            endgameScenario,
            gameStateRef.current?.players.get(1)?.resources || resources,
            gameTime
          )}
          gameTime={gameTime}
          onRestart={() => window.location.reload()}
        />
      ) : gameOver ? (
        // Fallback to old game over screen if no scenario detected
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
      ) : null}

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

              <div className="flex items-center gap-4">
                {/* Enhanced Resources with Axis-Specific Styling */}
                <div 
                  className="flex items-center gap-2 bg-gray-800/85 backdrop-blur-sm px-3 py-2 rounded-lg border border-blue-400/30 hover:border-blue-400/60 transition-all group"
                  style={{ 
                    boxShadow: `0 0 10px rgba(74, 144, 226, ${resources.ore > 50 ? 0.3 : 0.1})`,
                    animation: resources.ore < 50 ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  <Box className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-white font-mono font-semibold">{resources.ore}</span>
                  {resources.ore < 50 && (
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  )}
                </div>
                <div 
                  className="flex items-center gap-2 bg-gray-800/85 backdrop-blur-sm px-3 py-2 rounded-lg border border-yellow-400/30 hover:border-yellow-400/60 transition-all group"
                  style={{ 
                    boxShadow: `0 0 10px rgba(255, 107, 53, ${resources.energy > 50 ? 0.3 : 0.1})`,
                    animation: resources.energy < 50 ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  <Zap className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                  <span className="text-white font-mono font-semibold">{resources.energy}</span>
                  {resources.energy < 50 && (
                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  )}
                </div>
                <div 
                  className="flex items-center gap-2 bg-gray-800/85 backdrop-blur-sm px-3 py-2 rounded-lg border border-green-400/30 hover:border-green-400/60 transition-all group"
                  style={{ 
                    boxShadow: `0 0 10px rgba(80, 200, 120, ${resources.biomass > 50 ? 0.3 : 0.1})`,
                    animation: resources.biomass < 50 ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  <Leaf className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="text-white font-mono font-semibold">{resources.biomass}</span>
                  {resources.biomass < 50 && (
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  )}
                </div>
                <div 
                  className="flex items-center gap-2 bg-gray-800/85 backdrop-blur-sm px-3 py-2 rounded-lg border border-purple-400/30 hover:border-purple-400/60 transition-all group"
                  style={{ 
                    boxShadow: `0 0 10px rgba(157, 78, 221, ${resources.data > 50 ? 0.3 : 0.1})`,
                    animation: resources.data < 50 ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  <Brain className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-white font-mono font-semibold">{resources.data}</span>
                  {resources.data < 50 && (
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  )}
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

          {/* Enhanced RTS Bottom Panel with AI Flair */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-gray-900/95 via-gray-900/90 to-transparent p-4 pointer-events-none">
            {/* Waveform Overlay for AI Feedback */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent">
                <div 
                  className="h-full bg-cyan-400/40 animate-waveform"
                  style={{ 
                    width: '100px',
                    animation: 'waveform 3s ease-in-out infinite',
                    animationDelay: '0s'
                  }}
                />
                <div 
                  className="h-full bg-purple-400/30 animate-waveform"
                  style={{ 
                    width: '80px',
                    animation: 'waveform 2.5s ease-in-out infinite',
                    animationDelay: '0.5s'
                  }}
                />
                <div 
                  className="h-full bg-blue-400/30 animate-waveform"
                  style={{ 
                    width: '120px',
                    animation: 'waveform 3.5s ease-in-out infinite',
                    animationDelay: '1s'
                  }}
                />
              </div>
            </div>
            
            <div className="flex items-end justify-between gap-4 max-w-[1800px] mx-auto relative">
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
                    className="bg-cyan-600/90 hover:bg-cyan-700 backdrop-blur-sm border border-cyan-400/30 hover:border-cyan-400/60 transition-all shadow-lg hover:shadow-cyan-400/50"
                    size="sm"
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Build
                  </Button>
                  <Button
                    onClick={() => setShowTechTree(!showTechTree)}
                    className="bg-purple-600/90 hover:bg-purple-700 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/60 transition-all shadow-lg hover:shadow-purple-400/50"
                    size="sm"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Tech
                  </Button>
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-2 bg-gray-800/50 px-2 py-1 rounded backdrop-blur-sm">
                  <Trophy className="w-3 h-3 text-yellow-400" />
                  <span>Chroma Awards 2025 - Puzzle/Strategy | Tools: ElevenLabs, OpenArt, Google AI, Fuser, Luma AI</span>
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

          {/* Enhanced AI Messages with Minimalistic Design */}
          <div className="absolute top-20 right-4 z-20 space-y-2 max-w-sm">
            {aiMessages.map(msg => {
              const commander = COMMANDERS[msg.commander];
              const commanderColor = commander.color || '#00ffea';
              
              return (
                <div
                  key={msg.id}
                  className="bg-gray-800/90 backdrop-blur-sm border rounded-lg p-3 animate-in slide-in-from-right shadow-lg transition-all hover:scale-[1.02]"
                  style={{
                    borderColor: `${commanderColor}40`,
                    boxShadow: `0 4px 12px ${commanderColor}20, 0 0 8px ${commanderColor}10`
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: commanderColor }}
                    />
                    <span 
                      className="text-sm font-bold"
                      style={{ color: commanderColor }}
                    >
                      {commander.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">{commander.role}</span>
                  </div>
                  <p className="text-white text-sm leading-relaxed">{msg.message}</p>
                  
                  {/* Subtle waveform indicator */}
                  <div className="mt-2 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" style={{ color: commanderColor }} />
                </div>
              );
            })}
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

          {/* Resource Event Display */}
          <ResourceEventDisplay
            events={activeEvents}
            onDismiss={(eventId) => {
              setActiveEvents(prev => prev.filter(e => e.eventId !== eventId));
            }}
          />

          {/* Allocation Puzzle Modal */}
          {activePuzzle && (
            <AllocationPuzzleModal
              puzzle={activePuzzle}
              currentResources={{
                [ResourceType.ORE]: resources.ore,
                [ResourceType.ENERGY]: resources.energy,
                [ResourceType.BIOMASS]: resources.biomass,
                [ResourceType.DATA]: resources.data
              }}
              onSelect={(optionId) => {
                if (puzzleManagerRef.current && activePuzzle) {
                  const result = puzzleManagerRef.current.executeAllocationDecision(
                    activePuzzle.puzzleId,
                    optionId
                  );
                  if (result.success && result.option) {
                    // Apply resource costs
                    const costs = result.option.resourceCosts;
                    setResources(prev => ({
                      ore: prev.ore - (costs.ore || 0),
                      energy: prev.energy - (costs.energy || 0),
                      biomass: prev.biomass - (costs.biomass || 0),
                      data: prev.data - (costs.data || 0)
                    }));
                    toast.success(`Selected: ${result.option.optionName}`, {
                      description: result.option.strategicRationale
                    });
                  }
                }
                setActivePuzzle(null);
              }}
              onClose={() => setActivePuzzle(null)}
            />
          )}

          {/* Black Market Panel */}
          <BlackMarketPanel
            offers={marketOffers}
            currentResources={{
              [ResourceType.ORE]: resources.ore,
              [ResourceType.ENERGY]: resources.energy,
              [ResourceType.BIOMASS]: resources.biomass,
              [ResourceType.DATA]: resources.data
            }}
            onAccept={(offerId) => {
              if (puzzleManagerRef.current) {
                const result = puzzleManagerRef.current.acceptMarketOffer(offerId);
                if (result.success && result.offer) {
                  // Apply costs and rewards
                  const costs = result.offer.resourceCosts;
                  const rewards = result.offer.resourceRewards;
                  setResources(prev => ({
                    ore: prev.ore - (costs.ore || 0) + (rewards[ResourceType.ORE] || 0),
                    energy: prev.energy - (costs.energy || 0) + (rewards[ResourceType.ENERGY] || 0),
                    biomass: prev.biomass - (costs.biomass || 0) + (rewards[ResourceType.BIOMASS] || 0),
                    data: prev.data - (costs.data || 0) + (rewards[ResourceType.DATA] || 0)
                  }));

                  if (result.riskTriggered && result.penalties) {
                    toast.error('Hidden risk triggered!', {
                      description: result.penalties.effects?.join(', ') || 'Unexpected consequences'
                    });
                  } else {
                    toast.success('Market offer accepted', {
                      description: result.offer.description
                    });
                  }
                }
              }
            }}
          />

          {/* Resource Advisor Panel */}
          {advisorAdvice && puzzleManagerRef.current && (
            <ResourceAdvisorPanel
              advisor={puzzleManagerRef.current.getAdvisor().getCurrentAdvisor()}
              advice={advisorAdvice}
              onDismiss={() => setAdvisorAdvice(null)}
            />
          )}

          {/* Narrative Display */}
          <div className="absolute top-20 right-4 z-20 w-80 max-h-[500px]">
            <NarrativeDisplay events={narrativeEvents} maxHeight="400px" />
          </div>

          {/* AI Offers Panel */}
          {aiOffers.length > 0 && (
            <div className="absolute bottom-24 left-4 z-20">
              <AIOffersPanel
                offers={aiOffers}
                onAccept={(offerId) => {
                  if (symbioticGameplayRef.current) {
                    symbioticGameplayRef.current.acceptOffer(offerId);
                    setAiOffers(prev => prev.filter(o => o.id !== offerId));
                    toast.success('AI offer accepted!');
                  }
                }}
                onReject={(offerId) => {
                  if (symbioticGameplayRef.current) {
                    symbioticGameplayRef.current.rejectOffer(offerId);
                    setAiOffers(prev => prev.filter(o => o.id !== offerId));
                  }
                }}
              />
            </div>
          )}

          {/* Alternative Victories Display */}
          {alternativeVictories.length > 0 && (
            <div className="absolute top-80 left-4 z-20 w-80">
              <AlternativeVictoriesDisplay victories={alternativeVictories} />
            </div>
          )}

          {/* Dynamic Tiles Indicator */}
          {dynamicTiles.length > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
              {dynamicTiles.map(tile => (
                <div
                  key={tile.id}
                  className="bg-gray-800/90 border-2 border-yellow-400 rounded-lg p-4 mb-2 animate-in zoom-in shadow-2xl"
                  style={{
                    boxShadow: '0 0 20px rgba(255, 255, 0, 0.5)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-bold text-yellow-400">{tile.name}</h3>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{tile.description}</p>
                  <p className="text-xs text-yellow-400">{tile.benefit}</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (dungeonMasterRef.current) {
                        dungeonMasterRef.current.activateDynamicTile(tile.id);
                        setDynamicTiles(prev => prev.filter(t => t.id !== tile.id));
                        toast.success(`${tile.name} activated!`);
                      }
                    }}
                    className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700"
                  >
                    Activate
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Chronicle Exporter (shown after game ends) */}
          {gameOver && chronicleData && showChronicle && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
              <div className="max-w-2xl w-full">
                <ChronicleExporter
                  chronicle={chronicleData}
                  onExport={(format) => {
                    if (format === 'pdf' || format === 'html') {
                      setShowChronicle(false);
                    }
                  }}
                />
                <Button
                  onClick={() => setShowChronicle(false)}
                  variant="outline"
                  className="mt-4 w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
          
          {/* Chronicle Button (show after game ends) */}
          {gameOver && chronicleData && !showChronicle && (
            <div className="absolute bottom-4 right-4 z-30">
              <Button
                onClick={() => setShowChronicle(true)}
                className="bg-purple-600/90 hover:bg-purple-700 backdrop-blur-sm border border-purple-400/30"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                View Chronicle
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuaternionGame;
