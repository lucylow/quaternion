import { useEffect, useRef, useState } from 'react';
import useStableKeyGetter from '@/hooks/useStableKeys';
import Phaser from 'phaser';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Brain, Zap, Leaf, Box, Building, Swords, Trophy, X, RotateCcw, Activity, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { QuaternionGameState } from '@/game/QuaternionGameState';
import { TECH_TREE, BUILDINGS, COMMANDERS, UNIT_TYPES, AI_SUGGESTIONS, WIN_CONDITIONS, NEURAL_FRONTIER_WIN_CONDITIONS } from '@/data/quaternionData';
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
import { InteractionAudio } from '@/audio/InteractionAudio';
import { safeStringify, safeParse } from '@/utils/safeJSON';
import BackgroundMusic from '@/audio/BackgroundMusic';
import ChromaPulseSynth from '@/audio/ChromaPulseSynth';
import MapMusicManager from '@/audio/MapMusicManager';
import { generateAndPlayTTS } from '@/utils/ttsClient';
import { AXIS_DESIGNS, getAxisDesign, hexToPhaserColor, AI_THOUGHT_VISUALS, BIOME_THEMES } from '@/design/QuaternionDesignSystem';
import { AIStoryGenerator, NarrativeEvent, NarrativeContext } from '@/game/narrative/AIStoryGenerator';
import { NarrativeDisplay } from '@/components/narrative/NarrativeDisplay';
import { ChronicleExporter } from '@/components/narrative/ChronicleExporter';
import { BookOpen, Handshake, Sparkles, Target } from 'lucide-react';
import { AIOffersPanel } from '@/components/creative/AIOffersPanel';
import { AlternativeVictoriesDisplay } from '@/components/creative/AlternativeVictoriesDisplay';
import { loadDevSampleIfNoEntities } from '@/utils/dev_fallback_renderer';
import { safeSetInteractive } from '@/utils/inputSafe';
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
import { engineBridge } from '@/engine/EngineBridge';
import { audioManager } from '@/engine/AudioManager';

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
  const selectedUnitsRef = useRef<Phaser.Physics.Arcade.Sprite[]>([]);
  const cameraRef = useRef<Phaser.Cameras.Scene2D.Camera | null>(null);
  const playerUnitsRef = useRef<Phaser.Physics.Arcade.Sprite[]>([]);
  const aiUnitsRef = useRef<Phaser.Physics.Arcade.Sprite[]>([]);
  const buildingsRef = useRef<Phaser.GameObjects.Sprite[]>([]);
  const [showTechTree, setShowTechTree] = useState(false);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [interactionAudio, setInteractionAudio] = useState<InteractionAudio | null>(null);
  const [buildQueue, setBuildQueue] = useState<Array<{ id: string; building: string; progress: number; totalTime: number }>>([]);
  const [buildingPlacementMode, setBuildingPlacementMode] = useState<string | null>(null);
  const buildingPreviewRef = useRef<Phaser.GameObjects.GameObject | null>(null);
  const [researchedTechs, setResearchedTechs] = useState<Set<string>>(new Set());
  const [aiMessages, setAiMessages] = useState<Array<{ commander: string; message: string; id: number }>>([]);
  const [gameOver, setGameOver] = useState<{ won: boolean; reason: string; scenario?: EndgameScenario } | null>(null);
  const [endgameScenario, setEndgameScenario] = useState<EndgameScenario | null>(null);
  const messageIdCounterRef = useRef(0);
  const getMessageKey = useStableKeyGetter(aiMessages, (msg) => msg.id);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [winConditionProgress, setWinConditionProgress] = useState<Record<string, { progress: number; max: number; label: string }>>({});
  const [showTutorial, setShowTutorial] = useState(true);
  const [showVictoryConditions, setShowVictoryConditions] = useState(true);
  const [showAlternativeVictories, setShowAlternativeVictories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const gameStartedRef = useRef(false); // Flag to prevent multiple starts
  
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
  
  // Determine game type from route pathname or config
  const gameType: 'neural-frontier' | 'quaternion' = 
    location.pathname === '/game/neural-frontier' || routeConfig?.gameType === 'neural-frontier'
      ? 'neural-frontier'
      : 'quaternion';
  
  // Try to load room data from localStorage if not in route state (for page refresh/reconnection)
  const loadRoomDataFromStorage = () => {
    try {
      const storedRoomData = localStorage.getItem('quaternion_roomData');
      if (storedRoomData) {
        return safeParse(storedRoomData);
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

  // Add safeguards to prevent accidental serialization of Phaser objects
  useEffect(() => {
    // Prevent accidental serialization of Phaser objects
    const originalStringify = JSON.stringify;
    
    (JSON as any).stringify = function(value: any, replacer?: any, space?: any) {
      try {
        // Check if value contains Phaser objects
        if (value && typeof value === 'object') {
          if (value.constructor && value.constructor.name.startsWith('Phaser')) {
            console.warn('Attempting to stringify Phaser object, using safe serialization');
            return safeStringify(value, space);
          }
        }
        return originalStringify.call(this, value, replacer, space);
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('circular')) {
          console.warn('Circular reference detected, using safe serialization');
          return safeStringify(value, space);
        }
        throw error;
      }
    };
    
    return () => {
      JSON.stringify = originalStringify;
    };
  }, []);

  useEffect(() => {
    console.log('=== QuaternionGame Component Mounted ===');
    
    // Ensure container exists before creating game
    if (!gameRef.current) {
      console.error('Game container ref not found');
      return;
    }

    if (phaserGameRef.current) {
      console.log('Phaser game already exists, skipping initialization');
      return;
    }

    console.log('Container found:', !!gameRef.current);
    console.log('Container element:', gameRef.current);
    console.log('Container ID:', gameRef.current?.id);
    console.log('Container classes:', gameRef.current?.className);
    
      // Wait a frame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (!gameRef.current) {
          const errorMsg = 'Game container not found. Please refresh the page.';
          console.error(errorMsg);
          setError(errorMsg);
          setErrorDetails('The game container element was not found. This may be a rendering issue.');
          setLoading(false);
          return;
        }

      console.log('Creating Phaser game...');

      // Initialize audio system (non-blocking, will work after user interaction)
      initializeAudio().then(async () => {
        // Initialize interaction audio
        try {
          const audio = InteractionAudio.instance();
          await audio.init();
          setInteractionAudio(audio);
        } catch (error) {
          console.warn('Failed to initialize interaction audio:', error);
        }
        
        // Set music for the selected map
        try {
          const mapMusicManager = MapMusicManager.instance();
          const selectedMapId = routeConfig?.mapId;
          
          if (selectedMapId) {
            await mapMusicManager.setMusicForMapId(selectedMapId);
            console.log(`[MapMusic] Set music for map ID: ${selectedMapId}`);
          } else if (effectiveConfig?.mapType) {
            // Fallback: try to find a map with matching theme
            // For now, use a default theme based on mapType
            const mapType = effectiveConfig.mapType;
            // Map common mapType values to themes
            const themeMap: Record<string, string> = {
              'crystalline_plains': 'open',
              'twilight_biome': 'alien',
              'urban_battlefield': 'urban',
              'underwater_biome': 'aquatic',
              'mountainous_terrain': 'mountain',
              'desert_terrain': 'desert',
              'icy_wasteland': 'ice',
              'volcanic_terrain': 'volcanic',
              'alien_jungle': 'jungle'
            };
            const theme = themeMap[mapType] || 'mixed';
            await mapMusicManager.setMusicForTheme(theme);
            console.log(`[MapMusic] Set music for mapType: ${mapType} (theme: ${theme})`);
          }
        } catch (err) {
          console.warn('[MapMusic] Failed to set map music:', err);
        }
      }).catch(err => console.warn('Audio init deferred:', err));

      // Start background music (loop) - engine AudioManager handles Phaser/HTML5 fallback
      try {
        audioManager.loop('music/bg_loop', { volume: 0.5 });
      } catch (err) {
        console.warn('[Audio] Background music not available:', err);
      }

      // Store functions in variables accessible to the scene
      const showToast = toast;
      const sendAIMessage = (commander: string, message: string) => {
        const id = Date.now() * 10000 + (messageIdCounterRef.current++ % 10000);
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

      // Initialize GameLoop with callbacks to update game state
      if (gameStateRef.current) {
        gameLoopRef.current = new GameLoop(
          {
            fixedTimestep: 1 / 60, // 60 FPS fixed timestep
            maxFrameSkip: 5,
            maxDeltaTime: 0.1,
            targetFPS: 60,
            enablePerformanceMonitoring: true,
            enableAdaptiveQuality: true,
            enableFrameRateLimiting: true,
            pauseOnFocusLoss: true,
            autoResume: true
          },
          {
            initialize: async () => {
              console.log('[GameLoop] Initializing...');
            },
            fixedUpdate: (deltaTime: number) => {
              if (gameStateRef.current) {
                gameStateRef.current.update(deltaTime);
              }
            },
            render: (interpolation: number) => {
              // Phaser handles rendering
            },
            cleanup: async () => {
              console.log('[GameLoop] Cleaning up...');
            },
            onError: (error: Error) => {
              console.error('[GameLoop] Error:', error);
              toast.error(`Game loop error: ${error.message}`);
            }
          }
        );
        
        // Initialize and start the game loop ONLY ONCE
        gameLoopRef.current.initialize().then(() => {
          if (!gameStartedRef.current) {
            gameStartedRef.current = true;
            gameStateRef.current?.start();
            gameLoopRef.current?.start();
            console.log('[GameLoop] Started successfully');
            
            // Start background music when game starts (after user interaction)
            // This ensures audio context is ready
            setTimeout(async () => {
              try {
                // Audio context will be resumed automatically when Phaser sounds play
                // Engine AudioManager handles this automatically
                
                // Start background music
                try {
                  const bgMusic = BackgroundMusic.instance();
                  if (!bgMusic.isActive()) {
                    await bgMusic.start();
                    console.log('[Audio] Background music started');
                  }
                } catch (bgMusicError) {
                  console.warn('[Audio] Failed to start background music (non-critical):', bgMusicError);
                  // Continue without background music
                }
                
                // Start chroma pulse synth
                try {
                  const chromaSynth = ChromaPulseSynth.instance();
                  if (!chromaSynth.isActive()) {
                    await chromaSynth.start();
                    console.log('[Audio] Chroma pulse synth started');
                  }
                } catch (chromaError) {
                  console.warn('[Audio] Failed to start chroma pulse synth (non-critical):', chromaError);
                  // Continue without chroma synth
                }
              } catch (audioError) {
                console.warn('[Audio] Unexpected error during audio startup (non-critical):', audioError);
                // Don't throw - audio is optional
              }
            }, 500); // Small delay to ensure game is fully initialized
          }
        }).catch((error) => {
          const errorMsg = 'Failed to initialize game loop';
          console.error(errorMsg, error);
          setError(errorMsg);
          setErrorDetails(error instanceof Error ? error.message : 'Unknown error occurred');
          toast.error(`Game initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      // CRITICAL: Create config AFTER ensuring container exists and is ready
      // Use container element directly, not the ref
      const containerElement = gameRef.current;
      if (!containerElement) {
        const errorMsg = 'Container element is null when creating config';
        console.error(errorMsg);
        setError(errorMsg);
        setErrorDetails('The game container was lost during initialization. Please refresh the page.');
        setLoading(false);
        return;
      }

      console.log('Creating Phaser config with parent:', containerElement);
      console.log('Container dimensions:', containerElement.offsetWidth, 'x', containerElement.offsetHeight);
      console.log('Container computed style:', window.getComputedStyle(containerElement).display);
      
      // Get container dimensions or use window size
      const containerWidth = containerElement.offsetWidth || window.innerWidth;
      const containerHeight = containerElement.offsetHeight || window.innerHeight;
      
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: containerWidth || 1200,
        height: containerHeight || 700,
        parent: containerElement, // Use element directly
        backgroundColor: '#001122', // Dark blue background - visible even if nothing else renders
      scene: {
        preload: preload,
        create: create,
        update: update
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
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
      // Input configuration - CRITICAL for canvas interaction
      input: {
        mouse: {
          target: containerElement, // Explicitly target container
          capture: true,     // Capture mouse events
        },
        touch: {
          target: containerElement, // Explicitly target container
          capture: true,     // Capture touch events
        },
        keyboard: true,
      },
      dom: {
        createContainer: true,
      },
      // Disable unnecessary features for better performance
      disableContextMenu: true,
      banner: false,
    };

    function preload(this: Phaser.Scene) {
      this.load.on('progress', (value: number) => {
        setLoadingProgress(value * 100);
      });

      // Preload audio files for AudioManager
      try {
        this.load.audio('bg_loop', '/audio/bg_loop.ogg');
        this.load.audio('ui_click', '/audio/ui_click.ogg');
      } catch (err) {
        console.warn('[Preload] Audio files not available, will use fallback:', err);
      }

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
        
        // Log which monster textures were successfully loaded
        const monsterKeys = ImageAssetLoader.getMonsterKeys();
        const loadedMonsters = monsterKeys.filter(key => this.textures.exists(key));
        console.log(`[Preload] Successfully loaded ${loadedMonsters.length}/${monsterKeys.length} monster textures:`, loadedMonsters);
        
        if (loadedMonsters.length === 0) {
          console.warn('[Preload] WARNING: No monster textures loaded! Check asset paths and file names.');
        }
        
        // Always set loading to false and start game, even if assets failed
        setLoading(false);
        gameStateRef.current?.start();
        console.log('[Preload] Game ready - loading screen should disappear');
      });

      // Log loading progress
      this.load.on('filecomplete', (key: string, type: string, data: any) => {
        console.log(`[Preload] Loaded: ${key} (${type})`);
      });

      this.load.on('loaderror', (file: Phaser.Loader.File) => {
        console.error(`[Preload] Failed to load: ${file.key} from ${file.src}`);
        console.error(`[Preload] Error details:`, file);
        
        // Check if we're in Lovable preview and log base path info
        if (typeof window !== 'undefined' && window.location.pathname.includes('id-preview')) {
          const pathname = window.location.pathname;
          const pathParts = pathname.split('/');
          const idPreviewIndex = pathParts.findIndex(part => part === 'id-preview');
          if (idPreviewIndex !== -1) {
            const basePath = pathParts.slice(0, idPreviewIndex + 1).join('/');
            console.warn(`[Preload] Lovable preview detected. Base path: ${basePath}`);
            console.warn(`[Preload] File src should include base path: ${basePath}${file.src}`);
          }
        }
        
        // For map assets, try to reload with better encoding
        if (file.key.startsWith('map-') || file.key.startsWith('monster-') || file.key.startsWith('country-')) {
          console.log(`[Preload] Attempting to reload asset: ${file.key}`);
          // The path might need re-encoding - Phaser should handle this, but log for debugging
          const originalSrc = file.src;
          console.log(`[Preload] Original src: ${originalSrc}`);
          console.log(`[Preload] Encoded src would be: ${encodeURI(originalSrc)}`);
        }
        
        // Don't prevent game from starting - just log the error
        // The game will use fallback graphics if images fail to load
      });

      this.load.on('fileprogress', (file: Phaser.Loader.File, value: number) => {
        if (value > 0 && value < 1) {
          console.log(`[Preload] Loading ${file.key}: ${(value * 100).toFixed(1)}%`);
        }
      });

      // Fallback timeout in case assets don't load - ensure game always starts
      setTimeout(() => {
        if (this.load.progress < 1) {
          console.warn(`Assets not fully loaded. Progress: ${(this.load.progress * 100).toFixed(1)}%`);
          console.log('Available textures:', Object.keys(this.textures.list));
          console.warn('[Preload] Proceeding with partial asset load - game will use fallback rendering');
        }
        // Always set loading to false after timeout to ensure game is playable
        setLoading(false);
        if (gameStateRef.current && !gameStateRef.current.isRunning) {
          gameStateRef.current?.start();
        }
        console.log('[Preload] Fallback timeout - game ready');
      }, 3000); // Reduced timeout to 3 seconds for faster startup
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

      // Register AudioManager with Phaser sound system
      gameAudioManager.registerPhaser(this.sound);
      
      // Start background music loop
      try {
        gameAudioManager.loop('bg_loop', { volume: 0.45 });
      } catch (err) {
        console.warn('[AudioManager] Background music not available:', err);
      }

      // Set up EngineBridge command listener for React -> Engine communication
      const unsubscribe = engineBridge.onCommand((cmd) => {
        try {
          if (cmd.type === 'click-tile') {
            const { tileId, tileName, x, y } = cmd.payload || {};
            console.log('[EngineBridge] Received click-tile command:', { tileId, tileName, x, y });
            
            // Visual feedback: find and highlight tile sprite if it exists
            const tileSprite = this.children.getByName(tileId);
            if (tileSprite && 'setTint' in tileSprite) {
              (tileSprite as any).setTint(0x66ff66);
              this.time.delayedCall(300, () => {
                if (tileSprite && 'clearTint' in tileSprite) {
                  (tileSprite as any).clearTint();
                }
              });
            }
            
            // Play click sound
            gameAudioManager.play('ui_click', { volume: 0.8 }).catch(() => {
              console.debug('[AudioManager] Click sound not available');
            });
          } else if (cmd.type === 'move') {
            const { unitIds, x, y } = cmd.payload || {};
            console.log('[EngineBridge] Received move command:', { unitIds, x, y });
            // Handle movement command (implement based on your game logic)
          }
        } catch (err) {
          console.error('[EngineBridge] Error handling command:', err);
        }
      });

      // Store unsubscribe function for cleanup
      (this as any).__engineBridgeUnsubscribe = unsubscribe;

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
          console.log(`[Background] Game world size: ${width * 2}x${height * 2}`);
          
          // Calculate world dimensions
          const worldWidth = width * 2;
          const worldHeight = height * 2;
          
          // Create map image at center of world, then position it to cover entire world
          const img = this.add.image(0, 0, key);
          
          // Calculate scale to cover entire world (use cover strategy - scale to fill)
          const scaleX = worldWidth / textureWidth;
          const scaleY = worldHeight / textureHeight;
          const scale = Math.max(scaleX, scaleY) * 1.1; // Slightly larger to ensure full coverage
          
          img.setScale(scale);
          img.setOrigin(0.5, 0.5); // Center origin
          
          // Position at center of world
          img.setPosition(worldWidth / 2, worldHeight / 2);
          
          // Make it fully visible
          img.setAlpha(1.0); // Full opacity for visibility
          img.setTint(0xffffff); // No tint - full color
          img.setDepth(-1000); // Behind everything
          img.setScrollFactor(1); // Scroll with camera
          
          // Make sure it's visible
          img.setVisible(true);
          
          console.log(`[Background] Map background created successfully: ${key}`);
          console.log(`[Background] Position: (${worldWidth / 2}, ${worldHeight / 2}), Scale: ${scale.toFixed(2)}`);
          console.log(`[Background] Image dimensions after scale: ${textureWidth * scale}x${textureHeight * scale}`);
          
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
        const worldWidth = width * 2;
        const worldHeight = height * 2;
        const bgGraphics = this.add.graphics();
        // Use a more visible gradient that clearly shows the game area
        bgGraphics.fillGradientStyle(0x001122, 0x001122, 0x003366, 0x002244, 1);
        bgGraphics.fillRect(0, 0, worldWidth, worldHeight);
        bgGraphics.setDepth(-1000);
        bgGraphics.setScrollFactor(1);
        bgGraphics.setVisible(true);
        bgGraphics.setActive(true);
        backgroundImage = bgGraphics;
        console.log('[Background] Gradient fallback background created and visible');
      } else {
        // Ensure background is set up correctly
        if (backgroundImage instanceof Phaser.GameObjects.Image) {
          // Double-check visibility
          backgroundImage.setVisible(true);
          backgroundImage.setActive(true);
          console.log('[Background] Map background verified and visible');
        }
      }
      
      // CRITICAL: Ensure something is always visible - add a test rectangle if nothing else
      if (!backgroundImage || (backgroundImage instanceof Phaser.GameObjects.Image && !backgroundImage.visible)) {
        console.error('[Background] CRITICAL: No visible background! Creating emergency fallback');
        const emergencyBg = this.add.rectangle(width, height, width * 2, height * 2, 0x001133, 1);
        emergencyBg.setDepth(-1001);
        emergencyBg.setScrollFactor(1);
        emergencyBg.setVisible(true);
        console.log('[Background] Emergency background created');
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
        
        // Ensure resource nodes are visible
        if ('setDepth' in node) {
          node.setDepth(75); // Above background but below units
        }
        
        node.setData('type', nodeType.resource);
        node.setData('amount', 1000);
        node.setData('axis', nodeType.axis);
        safeSetInteractive(node, { useHandCursor: true });
        node.on('pointerdown', () => {
          console.log('[Scene] Resource node clicked:', nodeType.resource, 'at', node.x, node.y);
          // Play click sound
          gameAudioManager.play('ui_click', { volume: 0.8 }).catch(() => {
            console.debug('[AudioManager] Click sound not available');
          });
          // Send command to engine bridge
          engineBridge.sendCommand({ 
            type: 'click-resource-node', 
            payload: { 
              resource: nodeType.resource,
              axis: nodeType.axis,
              x: node.x,
              y: node.y
            } 
          });
        });
        
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
      safeSetInteractive(playerBase, { useHandCursor: true });
      playerBase.on('pointerdown', () => {
        console.log('[Scene] Player base clicked at', playerBase.x, playerBase.y);
        // Play click sound
        gameAudioManager.play('ui_click', { volume: 0.8 }).catch(() => {
          console.debug('[AudioManager] Click sound not available');
        });
        // Send command to engine bridge
        engineBridge.sendCommand({ 
          type: 'click-base', 
          payload: { 
            x: playerBase.x,
            y: playerBase.y
          } 
        });
      });
      playerBase.setDepth(50); // Ensure base is visible
      playerBase.setData('type', 'base');
      playerBase.setData('player', 1);
      playerBase.setData('health', 1000);
      playerBase.setData('maxHealth', 1000);
      buildings.push(playerBase as Phaser.GameObjects.Sprite);
      buildingsRef.current = buildings;
      
      // Base glow effect
      const baseGlow = this.add.circle(150, 350, 50, 0x00ffea, 0.2);
      baseGlow.setDepth(49); // Just below the base
      this.tweens.add({
        targets: baseGlow,
        scale: { from: 1, to: 1.3 },
        alpha: { from: 0.2, to: 0.05 },
        duration: 1500,
        yoyo: true,
        repeat: -1
      });


      // Selection graphics
      selectionGraphics = this.add.graphics();

      // Create player units - CRITICAL FIX: Units were never being created!
      console.log('[Scene] Creating player units...');
      for (let i = 0; i < 6; i++) {
        const unitX = 200 + (i % 3) * 60;
        const unitY = 400 + Math.floor(i / 3) * 60;
        const unitType = i < 3 ? 'worker' : 'soldier';
        const unitAxis = i < 3 ? 'matter' : 'energy';
        
        // Create unit as physics sprite with visible graphics
        const unit = this.physics.add.sprite(unitX, unitY, '');
        unit.displayWidth = 40;
        unit.displayHeight = 40;
        unit.setTint(0x00ffea);
        safeSetInteractive(unit, { useHandCursor: true }); // CRITICAL: Make units clickable!
        unit.setData('type', unitType);
        unit.setData('axis', unitAxis);
        unit.setData('health', 100);
        unit.setData('maxHealth', 100);
        unit.setData('selected', false);
        unit.setData('damage', unitType === 'soldier' ? 15 : 5);
        unit.setData('state', 'idle');
        
        // Create unit graphics with axis-themed visuals - CRITICAL: Make sure graphics are visible!
        const unitGraphics = this.add.graphics();
        const design = AXIS_DESIGNS[unitAxis];
        const primaryColor = hexToPhaserColor(design.primary);
        const glowColor = hexToPhaserColor(design.glow);
        
        // Draw visible unit shape
        unitGraphics.fillStyle(primaryColor, 1.0); // Full opacity for visibility
        if (unitType === 'worker') {
          unitGraphics.fillCircle(0, 0, 20);
        } else {
          // Soldier - triangle shape
          unitGraphics.fillTriangle(-15, 15, 0, -15, 15, 15);
        }
        unitGraphics.lineStyle(3, glowColor, 1); // Thicker line for visibility
        if (unitType === 'worker') {
          unitGraphics.strokeCircle(0, 0, 20);
        } else {
          unitGraphics.strokeTriangle(-15, 15, 0, -15, 15, 15);
        }
        
        // Position graphics at unit location
        unitGraphics.setPosition(unitX, unitY);
        unitGraphics.setDepth(100); // Ensure units are above background
        unitGraphics.setVisible(true);
        unitGraphics.setActive(true);
        
        unit.setData('graphics', unitGraphics);
        playerUnits.push(unit);
        
        // Unit click handler - CRITICAL: Add click detection!
        unit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          console.log('[Scene] Unit clicked!', unitType, 'at', unit.x, unit.y);
          
          if (!pointer.leftButtonDown()) return; // Only left clicks
          
          // Play click sound
          gameAudioManager.play('ui_click', { volume: 0.8 }).catch(() => {
            console.debug('[AudioManager] Click sound not available');
          });
          
          // Send command to engine bridge
          engineBridge.sendCommand({ 
            type: 'click-unit', 
            payload: { 
              unitId: unit.getData('id') || `unit_${i}`,
              unitType: unitType,
              axis: unitAxis,
              x: unit.x,
              y: unit.y
            } 
          });
          
          // Deselect all other units
          selectedUnitsRef.current.forEach(u => {
            if (u !== unit) {
              u.setData('selected', false);
              const g = u.getData('graphics') as Phaser.GameObjects.Graphics;
              if (g) {
                const uAxis = u.getData('axis') || 'matter';
                const uDesign = AXIS_DESIGNS[uAxis];
                const uPrimaryColor = hexToPhaserColor(uDesign.primary);
                const uGlowColor = hexToPhaserColor(uDesign.glow);
                g.clear();
                g.fillStyle(uPrimaryColor, 0.8);
                g.fillCircle(u.x, u.y, 20);
                g.lineStyle(2, uGlowColor, 1);
                g.strokeCircle(u.x, u.y, 20);
              }
            }
          });
          
          // Select this unit
          if (!unit.getData('selected')) {
            selectedUnitsRef.current.length = 0;
            selectedUnitsRef.current.push(unit);
            unit.setData('selected', true);
            const g = unit.getData('graphics') as Phaser.GameObjects.Graphics;
            if (g) {
              g.clear();
              g.fillStyle(primaryColor, 0.8);
              g.fillCircle(unit.x, unit.y, 20);
              g.lineStyle(3, 0xffff00, 1); // Yellow selection ring
              g.strokeCircle(unit.x, unit.y, 20);
            }
            setSelectedUnit(unitType);
            setSelectedUnits([unit]);
            console.log('[Scene] Unit selected:', unitType);
          }
        });
        
        // Unit hover effects
        unit.on('pointerover', () => {
          const g = unit.getData('graphics') as Phaser.GameObjects.Graphics;
          if (g && !unit.getData('selected')) {
            g.clear();
            g.fillStyle(primaryColor, 0.9);
            g.fillCircle(unit.x, unit.y, 22); // Slightly larger on hover
            g.lineStyle(2, glowColor, 1);
            g.strokeCircle(unit.x, unit.y, 22);
          }
        });
        
        unit.on('pointerout', () => {
          if (!unit.getData('selected')) {
            const g = unit.getData('graphics') as Phaser.GameObjects.Graphics;
            if (g) {
              g.clear();
              g.fillStyle(primaryColor, 0.8);
              g.fillCircle(unit.x, unit.y, 20);
              g.lineStyle(2, glowColor, 1);
              g.strokeCircle(unit.x, unit.y, 20);
            }
          }
        });
      }
      
      // Update playerUnitsRef so minimap and other components can access them
      playerUnitsRef.current = playerUnits;
      console.log('[Scene] Created', playerUnits.length, 'player units');

      // Enhanced Camera controls
      cursors = this.input.keyboard?.createCursorKeys() || null;
      wasd = this.input.keyboard?.addKeys('W,S,A,D') as {
        W: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
      } || null;
      const camera = this.cameras.main;
      cameraRef.current = camera;
      camera.setBounds(0, 0, width * 2, height * 2);
      camera.setZoom(1.0);
      // Ensure camera background is transparent so map shows through
      camera.setBackgroundColor('#000000', 0); // Transparent black

      // Keyboard shortcuts for menus
      this.input.keyboard?.on('keydown-T', () => setShowTechTree(true));
      this.input.keyboard?.on('keydown-B', () => setShowBuildMenu(true));
      this.input.keyboard?.on('keydown-S', () => {
        selectedUnitsRef.current.forEach(unit => {
          if (unit.active) {
            unit.setVelocity(0, 0);
            unit.setData('target', null);
            unit.setData('state', 'idle');
          }
        });
      });
      // ESC to cancel building placement
      this.input.keyboard?.on('keydown-ESC', () => {
        if (buildingPlacementMode) {
          setBuildingPlacementMode(null);
          if (buildingPreviewRef.current && buildingPreviewRef.current.active) {
            buildingPreviewRef.current.destroy();
            buildingPreviewRef.current = null;
          }
          toast.info('Building placement cancelled');
        }
      });
      
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

      // Enable input debugging
      console.log('[Scene] Setting up input handlers...');
      console.log('[Scene] Input enabled:', this.input.enabled);
      console.log('[Scene] Input active:', this.input.isActive());
      
      // Add gameobjectdown handler for unit clicks (alternative to individual unit handlers)
      this.input.on('gameobjectdown', (pointer: Phaser.Input.Pointer, gameObject: any) => {
        console.log('[Scene] GameObject clicked:', gameObject, 'at', pointer.x, pointer.y);
      });
      
      // Mouse controls with debug logging
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        console.log('[Scene] Phaser pointerdown detected:', pointer.x, pointer.y, 'button:', pointer.buttons, 'world:', pointer.worldX, pointer.worldY);
        if (pointer.rightButtonDown()) {
          // Right click - move/attack command
          if (selectedUnitsRef.current.length > 0) {
            const worldX = pointer.worldX;
            const worldY = pointer.worldY;
            
            // Check if any unit is in attack mode
            const inAttackMode = selectedUnitsRef.current.some(unit => unit.getData('attackMode'));
            
            // Check if clicking on enemy (prioritize if in attack mode)
            let targetFound = false;
            aiUnits.forEach(enemy => {
              if (!enemy.active) return;
              const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, worldX, worldY);
              if (dist < 30 || (inAttackMode && dist < 100)) {
                selectedUnitsRef.current.forEach(unit => {
                  if (unit.active) {
                    unit.setData('target', enemy);
                    unit.setData('state', 'attacking');
                    unit.setData('attackMode', false); // Clear attack mode
                    this.physics.moveToObject(unit, enemy, 120);
                  }
                });
                targetFound = true;
              }
            });
            
            if (!targetFound && aiBase) {
              const dist = Phaser.Math.Distance.Between(aiBase.x, aiBase.y, worldX, worldY);
              if (dist < 50) {
                selectedUnitsRef.current.forEach(unit => {
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
                  selectedUnitsRef.current.forEach(unit => {
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
              selectedUnitsRef.current.forEach(unit => {
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

      // Handle command events from CommandPanel
      this.events.on('command-move', (data: { units: Phaser.Physics.Arcade.Sprite[], target?: any }) => {
        if (data.target) {
          // Move to specific target position
          data.units.forEach(unit => {
            if (unit.active) {
              unit.setData('state', 'moving');
              this.physics.moveTo(unit, data.target.x, data.target.y, 120);
            }
          });
        }
        // If no target, wait for right-click to set destination
      });

      this.events.on('command-attack', (data: { units: Phaser.Physics.Arcade.Sprite[], target?: any }) => {
        // Set units to attack mode - they will attack on next right-click
        data.units.forEach(unit => {
          if (unit.active) {
            unit.setData('attackMode', true);
          }
        });
        // If target provided, attack immediately
        if (data.target) {
          data.units.forEach(unit => {
            if (unit.active) {
              unit.setData('target', data.target);
              unit.setData('state', 'attacking');
              this.physics.moveToObject(unit, data.target, 120);
            }
          });
        }
      });

      this.events.on('command-patrol', (data: { units: Phaser.Physics.Arcade.Sprite[], points?: any[] }) => {
        // Set patrol mode
        data.units.forEach(unit => {
          if (unit.active) {
            unit.setData('patrolMode', true);
            if (data.points && data.points.length > 0) {
              unit.setData('patrolPoints', data.points);
            }
          }
        });
      });

      this.events.on('command-special', (data: { units: Phaser.Physics.Arcade.Sprite[] }) => {
        // Execute special ability
        data.units.forEach(unit => {
          if (unit.active) {
            const abilities = unit.getData('abilities') || [];
            if (abilities.length > 0) {
              // Execute first ability
              console.log('Executing special ability for unit:', unit.getData('type'));
            }
          }
        });
      });

      this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (pointer.leftButtonReleased() && isSelecting) {
          isSelecting = false;
          selectionGraphics.clear();

          // Select units in box (simplified from Neural Frontier)
          const minX = Math.min(selectionStart.x, pointer.worldX);
          const maxX = Math.max(selectionStart.x, pointer.worldX);
          const minY = Math.min(selectionStart.y, pointer.worldY);
          const maxY = Math.max(selectionStart.y, pointer.worldY);

          // Clear previous selection
          const currentSelected = [...selectedUnitsRef.current];
          currentSelected.forEach(u => {
            u.setData('selected', false);
            const g = u.getData('graphics') as Phaser.GameObjects.Graphics;
            if (g) {
              g.clear();
              g.fillStyle(0x00ffea, 0.8);
              g.fillCircle(u.x, u.y, 20);
              g.lineStyle(2, 0xffffff);
              g.strokeCircle(u.x, u.y, 20);
            }
          });
          const newSelected: Phaser.Physics.Arcade.Sprite[] = [];

          // Find units in selection box
          playerUnits.forEach(unit => {
            if (!unit.active) return;
            if (unit.x >= minX && unit.x <= maxX && unit.y >= minY && unit.y <= maxY) {
              newSelected.push(unit);
              unit.setData('selected', true);
              const g = unit.getData('graphics') as Phaser.GameObjects.Graphics;
              if (g) {
                g.clear();
                g.fillStyle(0x00ffea, 0.8);
                g.fillCircle(unit.x, unit.y, 20);
                g.lineStyle(3, 0xffff00);
                g.strokeCircle(unit.x, unit.y, 20);
              }
            }
          });

          // Update ref and React state
          selectedUnitsRef.current = newSelected;
          setSelectedUnits(newSelected);
          if (newSelected.length === 1) {
            setSelectedUnit(newSelected[0].getData('type'));
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
          if (selectedUnitsRef.current.length > 0) {
            controlGroups.set(groupNum, [...selectedUnitsRef.current]);
            showToast.success(`Control group ${groupNum} created with ${selectedUnitsRef.current.length} units`);
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
              const currentSelected = [...selectedUnitsRef.current];
              currentSelected.forEach(u => {
                const ring = u.getData('selectionRing') as Phaser.GameObjects.Ellipse | undefined;
                if (ring) ring.setVisible(false);
              });
              const newSelected: Phaser.Physics.Arcade.Sprite[] = [];

              // Select group units (filter out inactive)
              group.forEach(unit => {
                if (unit.active) {
                  newSelected.push(unit);
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
              controlGroups.set(i, newSelected.filter(u => u.active));

              // Update ref and React state
              selectedUnitsRef.current = newSelected;
              setSelectedUnits(newSelected);
              if (newSelected.length === 1) {
                setSelectedUnit(newSelected[0].getData('type'));
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
              ethicalAlignment: state.players.get(1)?.moralAlignment || 0,
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
        
        if (state.players.size > 0) {
          const player = state.players.get(1);
          if (player) {
            setResources({
              ore: Math.floor(player.resources.ore),
              energy: Math.floor(player.resources.energy),
              biomass: Math.floor(player.resources.biomass),
              data: Math.floor(player.resources.data)
            });
            setPopulation(player.population);
          }
        }

        // Update win condition progress
        if (state.winConditions && state.players.size > 0) {
          const player = state.players.get(1);
          if (player) {
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
          const normalizedMorality = Math.max(-1, Math.min(1, morality + (state.players.get(1)?.moralAlignment || 0) / 100));
          
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
            ethicalAlignment: state.players.get(1)?.moralAlignment || 0,
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
                sendAIMessage('CORE', `AI Offer: ${offer.title || offer.terms || offer.id}`);
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

      // Update unit graphics positions (simplified from Neural Frontier)
      playerUnits.forEach(unit => {
        const g = unit.getData('graphics') as Phaser.GameObjects.Graphics;
        if (g) {
          g.clear();
          const color = unit.getData('selected') ? 0xffff00 : 0x00ffea;
          const lineWidth = unit.getData('selected') ? 3 : 2;
          g.fillStyle(0x00ffea, 0.8);
          g.fillCircle(unit.x, unit.y, 20);
          g.lineStyle(lineWidth, color);
          g.strokeCircle(unit.x, unit.y, 20);
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
          // Fallback to simple graphics
          aiUnit.setDisplaySize(24, 24);
          const aiGraphics = this.add.graphics();
          aiGraphics.fillStyle(0xff4444, 0.8);
          aiGraphics.fillCircle(x, y, 20);
          aiGraphics.lineStyle(2, 0xffffff);
          aiGraphics.strokeCircle(x, y, 20);
          aiUnit.setData('graphics', aiGraphics);
        }
        
        aiUnit.setData('type', 'soldier');
        aiUnit.setData('player', 2);
        aiUnit.setData('health', 200);
        aiUnit.setData('maxHealth', 200);
        aiUnit.setData('damage', 25);
        aiUnit.setData('target', playerBase);
        aiUnit.setData('state', 'attacking');
        
        // Make AI units interactive for debugging/click detection
        safeSetInteractive(aiUnit, { useHandCursor: false });
        aiUnit.on('pointerdown', () => {
          console.log('[Scene] AI unit clicked at', aiUnit.x, aiUnit.y);
        });
        
        // Move towards player base
        this.physics.moveToObject(aiUnit, playerBase, 100);
        aiUnits.push(aiUnit);
        aiUnitsRef.current = aiUnits;
        lastAiSpawn = time;
        
        sendAIMessage('LIRA', 'Enemy units detected! Prepare defenses!');
      }

      // AI unit combat (simplified graphics update)
      aiUnits.forEach(aiUnit => {
        if (!aiUnit.active) return;
        
        const g = aiUnit.getData('graphics') as Phaser.GameObjects.Graphics;
        if (g) {
          // Update graphic position for units using graphics
          g.clear();
          g.fillStyle(0xff4444, 0.8);
          g.fillCircle(aiUnit.x, aiUnit.y, 20);
          g.lineStyle(2, 0xffffff);
          g.strokeCircle(aiUnit.x, aiUnit.y, 20);
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

      // Player unit vs AI unit combat and auto-engagement
      playerUnits.forEach(playerUnit => {
        if (!playerUnit.active) return;
        
        const unitState = playerUnit.getData('state');
        const currentTarget = playerUnit.getData('target');
        
        // Auto-engage nearby enemies if not already targeting or if target is dead
        if (unitState !== 'attacking' || !currentTarget || !currentTarget.active) {
          let nearestEnemy: Phaser.Physics.Arcade.Sprite | null = null;
          let nearestDist = Infinity;
          
          aiUnits.forEach(aiUnit => {
            if (!aiUnit.active) return;
            const dist = Phaser.Math.Distance.Between(playerUnit.x, playerUnit.y, aiUnit.x, aiUnit.y);
            if (dist < 80 && dist < nearestDist) { // Auto-engage within 80 pixels
              nearestDist = dist;
              nearestEnemy = aiUnit;
            }
          });
          
          // Also check AI base
          if (aiBase && aiBase.active) {
            const dist = Phaser.Math.Distance.Between(playerUnit.x, playerUnit.y, aiBase.x, aiBase.y);
            if (dist < 100 && dist < nearestDist) {
              nearestDist = dist;
              nearestEnemy = aiBase as any;
            }
          }
          
          if (nearestEnemy) {
            playerUnit.setData('target', nearestEnemy);
            playerUnit.setData('state', 'attacking');
            this.physics.moveToObject(playerUnit, nearestEnemy, 120);
          }
        }
        
        // Combat with current target
        const target = playerUnit.getData('target');
        if (target && target.active) {
          const dist = Phaser.Math.Distance.Between(playerUnit.x, playerUnit.y, target.x, target.y);
          const attackRange = playerUnit.getData('range') || 40;
          
          if (dist < attackRange) {
            // In range - stop moving and attack
            playerUnit.setVelocity(0, 0);
            
            if (time > (playerUnit.getData('lastCombat') || 0) + 1000) {
              const playerDamage = playerUnit.getData('damage') || 10;
              const targetHealth = target.getData('health') || (target === aiBase ? 1000 : 200);
              target.setData('health', Math.max(0, targetHealth - playerDamage));
              playerUnit.setData('lastCombat', time);
              
              // Create attack effect
              createParticleEmitter(this, target.x, target.y, 0xff0000, 'explosion');
              
              if (target.getData('health') <= 0) {
                if (target === aiBase) {
                  setGameOver({ won: true, reason: 'Enemy base destroyed!' });
                }
                const graphic = target.getData('graphic');
                if (graphic) graphic.destroy();
                const healthBar = target.getData('floatingHealthBar');
                if (healthBar) {
                  healthBar.bg.destroy();
                  healthBar.fill.destroy();
                }
                target.destroy();
                playerUnit.setData('target', null);
                playerUnit.setData('state', 'idle');
              }
            }
          }
        }
        
        // Take damage from nearby enemies
        aiUnits.forEach(aiUnit => {
          if (!aiUnit.active) return;
          const dist = Phaser.Math.Distance.Between(playerUnit.x, playerUnit.y, aiUnit.x, aiUnit.y);
          if (dist < 40) {
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
        if (selectedUnitsRef.current.length > 0) {
          const avgX = selectedUnitsRef.current.reduce((sum, u) => sum + (u.active ? u.x : 0), 0) / selectedUnitsRef.current.length;
          const avgY = selectedUnitsRef.current.reduce((sum, u) => sum + (u.active ? u.y : 0), 0) / selectedUnitsRef.current.length;
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

      // Create Phaser game - MUST be inside the requestAnimationFrame callback
      console.log('Initializing Phaser game with config:', config);
      try {
        const game = new Phaser.Game(config);
        
        // CRITICAL: Ensure canvas is visible immediately
        if (game.canvas) {
          game.canvas.style.display = 'block';
          game.canvas.style.width = '100%';
          game.canvas.style.height = '100%';
          game.canvas.style.pointerEvents = 'auto';
          game.canvas.style.position = 'relative';
          console.log('[Phaser] Canvas style set - should be visible now');
          console.log('[Phaser] Canvas dimensions:', game.canvas.width, 'x', game.canvas.height);
        }
        
        // Store game reference
        phaserGameRef.current = game;
        // Store globally for debug overlay access
        (window as any).__QUAT_PHASER_GAME__ = game;
        if (game.canvas) {
          game.canvas.id = 'game-canvas';
        }

        // Log game initialization
        game.events.once('ready', async () => {
          console.log('[QUAT DEBUG] Phaser game ready!');
          console.log('[QUAT DEBUG] Phaser game instance:', game);
          console.log('[QUAT DEBUG] Canvas element:', game.canvas);
          console.log('[QUAT DEBUG] Canvas parent:', game.canvas?.parentElement);
          console.log('[QUAT DEBUG] Input enabled:', game.input.enabled);
          console.log('[QUAT DEBUG] Input active:', game.input.isActive());
          
          // Check for entities and load fallback if needed
          try {
            const didFallback = await loadDevSampleIfNoEntities();
            if (didFallback) {
              console.warn('[QUAT DEBUG] dev fallback renderer activated');
            }
          } catch (e) {
            console.warn('[QUAT DEBUG] fallback check failed', e);
          }
          
          // Log input system status and ensure it's enabled
          const scene = game.scene.getScenes(true)[0];
          if (scene) {
            console.log('Scene input enabled:', scene.input.enabled);
            console.log('Scene input active:', scene.input.isActive());
            
            // CRITICAL: Ensure input is enabled
            if (!scene.input.enabled) {
              scene.input.enabled = true;
              console.log('✅ Scene input enabled manually');
            }
            if (!game.input.enabled) {
              game.input.enabled = true;
              console.log('✅ Game input enabled manually');
            }
          }
          
          // Verify canvas is in DOM
          if (game.canvas && game.canvas.parentElement) {
            console.log('✅ Canvas successfully attached to DOM');
            console.log('Canvas position:', window.getComputedStyle(game.canvas).position);
            console.log('Canvas pointer-events:', window.getComputedStyle(game.canvas).pointerEvents);
            console.log('Canvas z-index:', window.getComputedStyle(game.canvas).zIndex);
          } else {
            console.error('❌ Canvas not attached to DOM!');
          }
          
          // CRITICAL: Hide loading screen when game is ready
          setLoading(false);
          console.log('✅ Loading screen hidden');
        });

        console.log('Phaser game created, waiting for ready event...');
      } catch (error) {
        const errorMsg = 'Failed to create Phaser game';
        console.error('❌', errorMsg, error);
        setError(errorMsg);
        setErrorDetails(error instanceof Error ? error.message : 'Unknown error occurred during Phaser initialization');
        toast.error(`Failed to initialize game: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setLoading(false);
      }
    });

    return () => {
      console.log('Destroying Phaser game...');
      // Cleanup audio
      audioManager.stop('music/bg_loop');
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Prevent default for game shortcuts
      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          setShowBuildMenu(!showBuildMenu);
          playUISound('click');
          break;
        case 't':
          event.preventDefault();
          setShowTechTree(!showTechTree);
          playUISound('click');
          break;
        case 'p':
          event.preventDefault();
          setShowPerformanceStats(!showPerformanceStats);
          break;
        case 'escape':
          event.preventDefault();
          if (showBuildMenu) setShowBuildMenu(false);
          if (showTechTree) setShowTechTree(false);
          if (showTutorial) setShowTutorial(false);
          break;
        case 'h':
          event.preventDefault();
          setShowTutorial(!showTutorial);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBuildMenu, showTechTree, showTutorial, showPerformanceStats]);

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
    const id = Date.now() * 10000 + (messageIdCounterRef.current++ % 10000);
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

  // Resource name mapping: BUILDINGS/TECH_TREE use matter/life/knowledge, but game uses ore/biomass/data
  const mapResourceName = (resourceName: string): keyof GameResources => {
    switch (resourceName) {
      case 'matter': return 'ore';
      case 'life': return 'biomass';
      case 'knowledge': return 'data';
      case 'energy': return 'energy';
      default: return resourceName as keyof GameResources;
    }
  };

  const handleBuildBuilding = (buildingId: string) => {
    const building = BUILDINGS[buildingId];
    if (!building) return;

    // Check costs - map resource names
    const canAfford = Object.entries(building.cost).every(([resource, cost]) => {
      const mappedResource = mapResourceName(resource);
      return resources[mappedResource] >= (cost || 0);
    });

    if (canAfford) {
      // Enter placement mode instead of immediately building
      setBuildingPlacementMode(buildingId);
      setShowBuildMenu(false);
      toast.info(`Select a location to place ${building.name}`, {
        description: 'Click on the map to place, or press ESC to cancel'
      });
    } else {
      toast.error('Insufficient resources', {
        description: 'Cannot afford this building'
      });
    }
  };

  const placeBuilding = (x: number, y: number) => {
    if (!buildingPlacementMode) return;
    
    const building = BUILDINGS[buildingPlacementMode];
    if (!building) return;

    // Deduct costs - map resource names
    const newResources = { ...resources };
    Object.entries(building.cost).forEach(([resource, cost]) => {
      const mappedResource = mapResourceName(resource);
      newResources[mappedResource] -= (cost || 0);
    });
    setResources(newResources);

    // Add to build queue
    const buildId = Date.now().toString();
    setBuildQueue(prev => [...prev, {
      id: buildId,
      building: buildingPlacementMode,
      progress: 0,
      totalTime: building.buildTime
    }]);

    // Create building sprite on Phaser scene
    if (phaserGameRef.current && phaserGameRef.current.scene.scenes[0]) {
      const scene = phaserGameRef.current.scene.scenes[0];
      
      // Create building visual
      const buildingSprite = scene.add.rectangle(x, y, 60, 60, 0x00ffea, 0.8);
      buildingSprite.setStrokeStyle(3, 0x00ffea, 1);
      buildingSprite.setDepth(50);
      buildingSprite.setData('type', 'building');
      buildingSprite.setData('buildingId', buildingPlacementMode);
      buildingSprite.setData('buildId', buildId);
      buildingSprite.setData('progress', 0);
      buildingSprite.setData('totalTime', building.buildTime);
      
      // Add building name label
      const label = scene.add.text(x, y + 40, building.name, {
        fontSize: '12px',
        color: '#00ffea',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      label.setDepth(51);
      buildingSprite.setData('label', label);
      
      // Add to buildings array
      if (buildingsRef.current) {
        buildingsRef.current.push(buildingSprite as Phaser.GameObjects.Sprite);
      }

      // Simulate building progress with visual feedback
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 0.1;
        setBuildQueue(prev => prev.map(item => 
          item.id === buildId 
            ? { ...item, progress: Math.min(progress, building.buildTime) }
            : item
        ));
        
        // Update building visual progress
        if (buildingSprite && buildingSprite.active) {
          const progressPercent = progress / building.buildTime;
          buildingSprite.setAlpha(0.5 + (progressPercent * 0.5)); // Fade in as it builds
          buildingSprite.setData('progress', progress);
          
          // Update label
          const label = buildingSprite.getData('label');
          if (label && label.active) {
            label.setText(`${building.name}\n${Math.floor(progressPercent * 100)}%`);
          }
        }
        
        if (progress >= building.buildTime) {
          clearInterval(progressInterval);
          setBuildQueue(prev => prev.filter(item => item.id !== buildId));
          
          // Finalize building visual
          if (buildingSprite && buildingSprite.active) {
            buildingSprite.setAlpha(1.0);
            buildingSprite.setFillStyle(0x00ffea, 1.0);
            const label = buildingSprite.getData('label');
            if (label && label.active) {
              label.setText(building.name);
            }
            
            // Add completion effect
            const particles = scene.add.particles(x, y, 'particle', {
              speed: { min: 20, max: 60 },
              scale: { start: 0.5, end: 0 },
              tint: 0x00ffea,
              lifespan: 1000,
              quantity: 20
            });
            setTimeout(() => particles.destroy(), 1000);
          }
          
          toast.success(`Building ${building.name} complete!`, {
            description: building.description
          });
          addAIMessage('AUREN', `${building.name} construction complete.`);
        }
      }, 100);
    }

    toast.success(`Building ${building.name}`, {
      description: `Construction time: ${building.buildTime}s`
    });

    gameStateRef.current?.logAction('build_building', { buildingId: buildingPlacementMode, cost: building.cost, x, y });
    
    // Exit placement mode
    setBuildingPlacementMode(null);
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

    // Check costs - map resource names
    const canAfford = Object.entries(tech.cost).every(([resource, cost]) => {
      const mappedResource = mapResourceName(resource);
      return resources[mappedResource] >= (cost || 0);
    });

    if (canAfford) {
      // Deduct costs - map resource names
      const newResources = { ...resources };
      Object.entries(tech.cost).forEach(([resource, cost]) => {
        const mappedResource = mapResourceName(resource);
        newResources[mappedResource] -= (cost || 0);
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
    if (!phaserGameRef.current || selectedUnitsRef.current.length === 0) return;

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
        selectedUnitsRef.current.forEach(unit => {
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="text-center max-w-md px-4">
            <h1 className="text-4xl font-bold text-cyan-400 mb-4">QUATERNION</h1>
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300 mb-4">
              {loadingProgress < 30 ? 'Initializing game systems...' :
               loadingProgress < 60 ? 'Loading assets...' :
               loadingProgress < 90 ? 'Setting up game world...' :
               'Almost ready...'}
            </p>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm mt-2">{Math.round(loadingProgress)}%</p>
            {loadingProgress > 90 && (
              <p className="text-cyan-300 text-xs mt-2 animate-pulse">Press any key to start when ready</p>
            )}
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
                  <li><strong>P:</strong> Performance Stats</li>
                  <li><strong>H:</strong> Help/Tutorial</li>
                  <li><strong>ESC:</strong> Close menus</li>
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

      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-800 border-2 border-red-400 rounded-lg p-8 max-w-md text-center">
            <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-red-400 mb-2">Game Error</h2>
            <p className="text-gray-300 mb-2">{error}</p>
            {errorDetails && (
              <p className="text-gray-400 text-sm mb-6">{errorDetails}</p>
            )}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => {
                  setError(null);
                  setErrorDetails(null);
                  window.location.reload();
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reload Game
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

      {/* Endgame Scene */}
      {gameOver && endgameScenario ? (
        <EndgameScene
          endgameData={EndgameManager.getEndgameData(
            endgameScenario,
            gameStateRef.current?.players?.get(1)?.resources || resources,
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
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-gray-900 to-transparent p-4 pointer-events-none">
            <div className="flex items-center justify-between pointer-events-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-cyan-400 hover:text-cyan-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit Game
              </Button>

              <div className="flex items-center gap-4 pointer-events-auto">
                {/* Enhanced Resources with Axis-Specific Styling */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex items-center gap-2 bg-gray-800/85 backdrop-blur-sm px-3 py-2 rounded-lg border border-orange-400/50 hover:border-orange-400/80 transition-all group cursor-help"
                      style={{ 
                        boxShadow: `0 0 15px rgba(255, 165, 0, ${resources.ore > 50 ? 0.5 : 0.2})`,
                        animation: resources.ore < 50 ? 'pulse 2s infinite' : 'none'
                      }}
                    >
                      <Box className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
                      <span className="text-orange-300 font-mono font-bold text-base text-readable-neon">{resources.ore}</span>
                      {resources.ore < 50 && (
                        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">Matter (Ore)</p>
                    <p className="text-xs text-gray-300">Raw materials for construction and units</p>
                    {resources.ore < 50 && (
                      <p className="text-xs text-orange-400 mt-1">⚠️ Low - gather more resources</p>
                    )}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex items-center gap-2 bg-gray-800/85 backdrop-blur-sm px-3 py-2 rounded-lg border border-yellow-400/50 hover:border-yellow-400/80 transition-all group cursor-help"
                      style={{ 
                        boxShadow: `0 0 15px rgba(255, 255, 0, ${resources.energy > 50 ? 0.5 : 0.2})`,
                        animation: resources.energy < 50 ? 'pulse 2s infinite' : 'none'
                      }}
                    >
                      <Zap className="w-5 h-5 text-yellow-300 group-hover:scale-110 transition-transform" />
                      <span className="text-yellow-200 font-mono font-bold text-base text-readable-neon">{resources.energy}</span>
                      {resources.energy < 50 && (
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">Energy</p>
                    <p className="text-xs text-gray-300">Power for advanced units and buildings</p>
                    {resources.energy < 50 && (
                      <p className="text-xs text-yellow-400 mt-1">⚠️ Low - build energy generators</p>
                    )}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex items-center gap-2 bg-gray-800/85 backdrop-blur-sm px-3 py-2 rounded-lg border border-green-400/50 hover:border-green-400/80 transition-all group cursor-help"
                      style={{ 
                        boxShadow: `0 0 15px rgba(0, 255, 0, ${resources.biomass > 50 ? 0.5 : 0.2})`,
                        animation: resources.biomass < 50 ? 'pulse 2s infinite' : 'none'
                      }}
                    >
                      <Leaf className="w-5 h-5 text-green-300 group-hover:scale-110 transition-transform" />
                      <span className="text-green-200 font-mono font-bold text-base text-readable-neon">{resources.biomass}</span>
                      {resources.biomass < 50 && (
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">Life (Biomass)</p>
                    <p className="text-xs text-gray-300">Biological resources for healing and growth</p>
                    {resources.biomass < 50 && (
                      <p className="text-xs text-green-400 mt-1">⚠️ Low - harvest from nature</p>
                    )}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex items-center gap-2 bg-gray-800/85 backdrop-blur-sm px-3 py-2 rounded-lg border border-purple-400/50 hover:border-purple-400/80 transition-all group cursor-help"
                      style={{ 
                        boxShadow: `0 0 15px rgba(255, 0, 255, ${resources.data > 50 ? 0.5 : 0.2})`,
                        animation: resources.data < 50 ? 'pulse 2s infinite' : 'none'
                      }}
                    >
                      <Brain className="w-5 h-5 text-purple-300 group-hover:scale-110 transition-transform" />
                      <span className="text-purple-200 font-mono font-bold text-base text-readable-neon">{resources.data}</span>
                      {resources.data < 50 && (
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">Knowledge (Data)</p>
                    <p className="text-xs text-gray-300">Research points for technology advancement</p>
                    {resources.data < 50 && (
                      <p className="text-xs text-purple-400 mt-1">⚠️ Low - research more technologies</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-cyan-200 font-mono text-base font-semibold flex items-center gap-1 text-readable-neon">
                  <Clock className="w-5 h-5" />
                  {formatTime(gameTime)}
                  {gameTime > 0 && (
                    <>
                      {gameTime < 1800 ? (
                        <span className="text-sm text-green-300 ml-1 text-readable-neon">
                          ({Math.floor((gameTime / 1800) * 100)}% of 30min)
                        </span>
                      ) : (
                        <span className="text-sm text-yellow-300 ml-1 text-readable-neon">
                          (Over 30min)
                        </span>
                      )}
                      <span className="text-sm text-cyan-300 ml-2 text-readable-neon">
                        Target: &lt;25min
                      </span>
                    </>
                  )}
                </div>
                <div className="text-cyan-200 font-mono text-base font-semibold text-readable-neon">
                  Pop: {population.current}/{population.max}
                </div>
                <div className={`font-mono text-base font-semibold text-readable-neon ${instability > 150 ? 'text-red-300' : instability > 100 ? 'text-yellow-300' : 'text-green-300'}`}>
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
          <div 
            ref={gameRef} 
            id="phaser-game-container"
            className="absolute inset-0 w-full h-full z-0 pointer-events-auto"
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'auto',
              touchAction: 'none',
              zIndex: 0,
              backgroundColor: '#000011', // Dark blue background to show canvas area
              minHeight: '100vh',
              minWidth: '100vw'
            }}
          />

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
                    onClick={() => {
                      interactionAudio?.play('click', { volume: 0.5 });
                      setShowBuildMenu(!showBuildMenu);
                    }}
                    className="bg-cyan-600/90 hover:bg-cyan-700 backdrop-blur-sm border border-cyan-400/30 hover:border-cyan-400/60 transition-all shadow-lg hover:shadow-cyan-400/50"
                    size="sm"
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Build
                  </Button>
                  <Button
                    onClick={() => {
                      interactionAudio?.play('click', { volume: 0.5 });
                      setShowTechTree(!showTechTree);
                    }}
                    className="bg-purple-600/90 hover:bg-purple-700 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/60 transition-all shadow-lg hover:shadow-purple-400/50"
                    size="sm"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Tech
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Build Queue */}
          {buildQueue.length > 0 && (
            <div className="absolute bottom-20 left-4 z-20 space-y-2">
              {buildQueue.map(item => (
                <div key={item.id} className="bg-gray-800/90 border border-cyan-400/50 rounded-lg p-2 min-w-[200px]">
                  <div className="text-cyan-200 text-base font-semibold mb-1 text-readable-neon">{BUILDINGS[item.building]?.name}</div>
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
                <h3 className="text-cyan-300 text-base font-bold flex items-center gap-2 text-readable-neon">
                  <Activity className="w-5 h-5" />
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
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-cyan-200 text-readable">FPS:</span>
                  <span className={`font-bold text-readable-neon ${performanceStats.fps >= 55 ? 'text-green-300' : performanceStats.fps >= 30 ? 'text-yellow-300' : 'text-red-300'}`}>
                    {performanceStats.fps}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-200 text-readable">UPS:</span>
                  <span className="text-cyan-300 font-bold text-readable-neon">{performanceStats.ups}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-200 text-readable">Frame:</span>
                  <span className="text-cyan-200 text-readable-neon">{performanceStats.frameTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-200 text-readable">Update:</span>
                  <span className="text-cyan-200 text-readable-neon">{performanceStats.updateTime.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-200 text-readable">Render:</span>
                  <span className="text-cyan-200 text-readable-neon">{performanceStats.renderTime.toFixed(2)}ms</span>
                </div>
                {performanceStats.droppedFrames > 0 && (
                  <div className="flex justify-between">
                    <span className="text-cyan-200 text-readable">Dropped:</span>
                    <span className="text-red-300 text-readable-neon">{performanceStats.droppedFrames}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-cyan-400/30">
                  <span className="text-cyan-200 text-readable">Quality:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-400 transition-all"
                        style={{ width: `${performanceStats.qualityLevel * 100}%` }}
                      />
                    </div>
                    <span className="text-cyan-200 text-sm text-readable-neon">{(performanceStats.qualityLevel * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Win Condition Progress */}
          <div className="absolute top-20 left-4 z-20 space-y-2 max-w-xs">
            {!showVictoryConditions ? (
              <Button
                onClick={() => setShowVictoryConditions(true)}
                className={`bg-gray-800/90 border hover:bg-gray-700/90 ${
                  gameType === 'neural-frontier'
                    ? 'border-cyan-400/50'
                    : 'border-purple-400/50'
                }`}
                variant="outline"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Victory Conditions
              </Button>
            ) : (
              <div className={`bg-gray-800/90 border rounded-lg p-4 ${
                gameType === 'neural-frontier'
                  ? 'border-cyan-400/50'
                  : 'border-purple-400/50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-base font-bold flex items-center gap-2 text-readable-neon ${
                    gameType === 'neural-frontier'
                      ? 'text-cyan-300'
                      : 'text-purple-300'
                  }`}>
                    <Trophy className="w-5 h-5" />
                    {gameType === 'neural-frontier' ? 'Victory Goals' : 'Victory Conditions'}
                  </h3>
                  <Button
                    onClick={() => setShowVictoryConditions(false)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-700/50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {gameType === 'neural-frontier' ? (
                    // Neural Frontier: Simpler, more casual display
                    <>
                      {NEURAL_FRONTIER_WIN_CONDITIONS.map((condition) => {
                        const progress = winConditionProgress[condition.id] || { progress: 0, max: 1, label: condition.name };
                        return (
                          <div key={condition.id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2 text-cyan-200 text-readable">
                                <span className="text-lg">{condition.icon}</span>
                                <span>{condition.name}</span>
                              </span>
                              <span className="text-cyan-300 text-readable-neon font-semibold">
                                {Math.floor((progress.progress / progress.max) * 100)}%
                              </span>
                            </div>
                            <p className="text-xs text-cyan-300/70 text-readable mb-1">{condition.description}</p>
                            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-300"
                                style={{ width: `${Math.min((progress.progress / progress.max) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    // Quaternion Strategy: Full detailed display
                    <>
                      {Object.entries(winConditionProgress).map(([key, condition]) => {
                        const winCondition = WIN_CONDITIONS.find(wc => wc.id === key);
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2 text-purple-200 text-readable">
                                {winCondition && <span className="text-lg">{winCondition.icon}</span>}
                                <span>{condition.label}</span>
                              </span>
                              <span className="text-purple-300 text-readable-neon font-semibold">
                                {Math.floor((condition.progress / condition.max) * 100)}%
                              </span>
                            </div>
                            {winCondition && (
                              <p className="text-xs text-purple-300/70 text-readable mb-1">{winCondition.description}</p>
                            )}
                            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-300"
                                style={{ width: `${Math.min((condition.progress / condition.max) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}
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
            {aiMessages.map((msg) => {
              const commander = COMMANDERS[msg.commander];
              const commanderColor = commander.color || '#00ffea';
              
              return (
                <div
                  key={msg.id}
                  className="bg-gray-800/90 backdrop-blur-sm border rounded-lg p-3 animate-in slide-in-from-right shadow-lg transition-all hover:scale-[1.02] relative"
                  style={{
                    borderColor: `${commanderColor}40`,
                    boxShadow: `0 4px 12px ${commanderColor}20, 0 0 8px ${commanderColor}10`
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-white opacity-70 hover:opacity-100"
                    onClick={() => {
                      setAiMessages(prev => prev.filter(m => m.id !== msg.id));
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <div className="flex items-center gap-2 mb-2 pr-6">
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: commanderColor }}
                    />
                    <span 
                      className="text-base font-bold text-readable-neon"
                      style={{ color: commanderColor }}
                    >
                      {commander.name}
                    </span>
                    <span className="text-sm text-cyan-200 ml-auto text-readable">{commander.role}</span>
                  </div>
                  <p className="text-cyan-100 text-base leading-relaxed text-readable">{msg.message}</p>
                  
                  {/* Subtle waveform indicator */}
                  <div className="mt-2 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" style={{ color: commanderColor }} />
                </div>
              );
            })}
          </div>

          {/* Build Menu */}
          {showBuildMenu && (
            <BuildMenu
              resources={{
                matter: resources.ore,
                energy: resources.energy,
                life: resources.biomass,
                knowledge: resources.data
              }}
              onBuild={handleBuildBuilding}
              onClose={() => setShowBuildMenu(false)}
            />
          )}

          {/* Tech Tree Modal */}
          {showTechTree && (
            <TechTreeModal
              researchedTechs={researchedTechs}
              resources={{
                matter: resources.ore,
                energy: resources.energy,
                life: resources.biomass,
                knowledge: resources.data
              }}
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
          {marketOffers.length > 0 && (
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
              onDismiss={(offerId) => {
                // Simply remove the offer from the state
                setMarketOffers(prev => prev.filter(o => o.offerId !== offerId));
              }}
            />
          )}

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
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-0 right-0 z-10 h-6 w-6 p-0 text-gray-400 hover:text-white"
                  onClick={() => setAiOffers([])}
                  title="Hide AI Offers"
                >
                  <X className="w-3 h-3" />
                </Button>
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
            </div>
          )}

          {/* Alternative Victories Display */}
          {alternativeVictories.length > 0 && (
            <div className="absolute top-80 left-4 z-20 w-80">
              {!showAlternativeVictories ? (
                <Button
                  onClick={() => setShowAlternativeVictories(true)}
                  className="bg-gray-800/90 border border-yellow-400/50 hover:bg-gray-700/90"
                  variant="outline"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Alternative Victories
                </Button>
              ) : (
                <div className="relative bg-gray-800/90 border border-yellow-400/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <h3 className="font-semibold text-lg text-yellow-400">Alternative Victory Conditions</h3>
                    </div>
                    <Button
                      onClick={() => setShowAlternativeVictories(false)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-700/50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {alternativeVictories.map((victory) => (
                      <div
                        key={victory.id}
                        className={`p-4 rounded-lg border ${
                          victory.unlocked
                            ? 'bg-yellow-900/20 border-yellow-500/50'
                            : 'bg-background/50 border-border'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {victory.unlocked ? (
                            <Trophy className="w-5 h-5 text-yellow-400 mt-0.5" />
                          ) : (
                            <Target className="w-5 h-5 text-muted-foreground mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`font-semibold ${victory.unlocked ? 'text-yellow-200' : ''}`}>
                                {victory.title}
                              </h4>
                              {victory.unlocked && (
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{victory.description}</p>
                            
                            {!victory.unlocked && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Progress</span>
                                  <span>
                                    {victory.progress} / {victory.maxProgress}
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(100, (victory.progress / victory.maxProgress) * 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Tiles Indicator */}
          {dynamicTiles.length > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
              {dynamicTiles.map(tile => (
                <div
                  key={tile.id}
                  className="bg-gray-800/90 border-2 border-yellow-400 rounded-lg p-4 mb-2 animate-in zoom-in shadow-2xl relative"
                  style={{
                    boxShadow: '0 0 20px rgba(255, 255, 0, 0.5)'
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-white opacity-70 hover:opacity-100"
                    onClick={() => {
                      setDynamicTiles(prev => prev.filter(t => t.id !== tile.id));
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <div className="flex items-center gap-2 mb-2 pr-6">
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
