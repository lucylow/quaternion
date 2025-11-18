/**
 * Route: /lobby
 * Game lobby page for matchmaking and room management.
 * Edit this file to modify the lobby page.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, User, Gamepad2, Plus, Search, ArrowLeft, Loader2, Target, BookOpen, Puzzle, Film, Zap, Leaf, Brain, Box, Map } from 'lucide-react';
import { COMMANDERS } from '@/data/quaternionData';
import { PUZZLES, getAvailablePuzzles, getPuzzle, type Puzzle } from '@/data/puzzles';
import { toast } from 'sonner';
import { MapSelector } from '@/components/game/MapSelector';
import { MapConfig } from '@/types/map';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface GameConfig {
  mode: 'single' | 'multiplayer' | 'campaign' | 'puzzle' | 'theater';
  commanderId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  mapType?: string;
  mapId?: string; // New: ID of the selected map image
  mapWidth?: number;
  mapHeight?: number;
  seed?: number;
  roomId?: string;
  gameMode?: 'arena' | 'campaign' | 'puzzle' | 'theater';
  quaternionAxis?: 'matter' | 'energy' | 'life' | 'knowledge';
  cooperativeMode?: boolean;
  replayId?: string;
  puzzleId?: string;
}

interface Room {
  id: string;
  name: string;
  host: string;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'starting' | 'in-progress';
  mapType: string;
  createdAt: string;
  cooperativeMode?: boolean;
  assignedAxes?: {
    matter?: string;
    energy?: string;
    life?: string;
    knowledge?: string;
  };
}

const Lobby = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'single' | 'multiplayer'>('single');
  const [gameType, setGameType] = useState<'neural-frontier' | 'quaternion'>('quaternion');
  const [singlePlayerMode, setSinglePlayerMode] = useState<'arena' | 'campaign' | 'puzzle' | 'theater'>('arena');
  
  // Single player config
  const [singlePlayerConfig, setSinglePlayerConfig] = useState<GameConfig>({
    mode: 'single',
    gameMode: 'arena',
    commanderId: 'AUREN',
    difficulty: 'medium',
    mapType: 'crystalline_plains',
    mapWidth: 40,
    mapHeight: 30,
    seed: Math.floor(Math.random() * 1000000)
  });

  // Quick start config for Chroma Awards (optimized for 15-20 min sessions)
  const [quickStartConfig] = useState<GameConfig>({
    mode: 'single',
    commanderId: 'AUREN',
    difficulty: 'easy',
    mapType: 'crystalline_plains',
    mapWidth: 30,
    mapHeight: 20,
    seed: Math.floor(Math.random() * 1000000)
  });

  // Multiplayer config
  const [multiplayerConfig, setMultiplayerConfig] = useState<GameConfig>({
    mode: 'multiplayer',
    commanderId: 'AUREN',
    mapType: 'crystalline_plains',
    mapWidth: 40,
    mapHeight: 30,
    cooperativeMode: false,
    quaternionAxis: undefined
  });

  // Campaign progress
  const [campaignProgress, setCampaignProgress] = useState({
    currentChapter: 1,
    unlockedChapters: [1],
    completedSeeds: [] as number[]
  });

  // Puzzle progress
  const [puzzleProgress, setPuzzleProgress] = useState({
    completed: [] as string[],
    unlocked: ['puzzle_1', 'puzzle_2']
  });
  
  // Selected puzzle
  const [selectedPuzzle, setSelectedPuzzle] = useState<string | null>(null);

  // Map selection
  const [selectedMap, setSelectedMap] = useState<MapConfig | null>(null);
  const [showMapSelector, setShowMapSelector] = useState(false);

  // Room management
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch available rooms
  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      } else {
        console.error('Failed to fetch rooms:', response.statusText);
        toast.error('Failed to load rooms');
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      toast.error('Network error: Could not load rooms');
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'multiplayer') {
      fetchRooms();
      const interval = setInterval(fetchRooms, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab]);
  
  // Also fetch rooms when component mounts
  useEffect(() => {
    if (activeTab === 'multiplayer') {
      fetchRooms();
    }
  }, []);

  const handleStartSinglePlayer = () => {
    // Neural Frontier (simple game) doesn't need complex config
    if (gameType === 'neural-frontier') {
      navigate('/game');
      return;
    }

    // Quaternion game needs full config
    const config = { ...singlePlayerConfig };
    
    // Add selected map ID if available
    if (selectedMap) {
      config.mapId = selectedMap.id;
      // Use map's grid size if not overridden
      if (!config.mapWidth) config.mapWidth = selectedMap.gridSize.width;
      if (!config.mapHeight) config.mapHeight = selectedMap.gridSize.height;
    }
    
    // Handle different game modes
    if (singlePlayerMode === 'campaign') {
      config.mode = 'campaign';
      config.seed = campaignProgress.currentChapter * 1000000 + Math.floor(Math.random() * 1000);
    } else if (singlePlayerMode === 'puzzle') {
      if (!selectedPuzzle) {
        toast.error('Please select a puzzle to play');
        return;
      }
      config.mode = 'puzzle';
      const puzzle = getPuzzle(selectedPuzzle);
      if (puzzle) {
        config.seed = puzzle.seed;
        config.puzzleId = puzzle.id;
      } else {
        config.seed = 999000; // Default puzzle seed
      }
    } else if (singlePlayerMode === 'theater') {
      config.mode = 'theater';
      // Theater mode needs a replay ID - for now, use a default
      toast.info('Theater mode: Select a replay to watch');
      return;
    }
    
    navigate('/quaternion', {
      state: {
        config
      }
    });
  };

  const handleMapSelect = (mapConfig: MapConfig) => {
    setSelectedMap(mapConfig);
    setShowMapSelector(false);
    // Update map type in config
    setSinglePlayerConfig({ ...singlePlayerConfig, mapType: mapConfig.id });
    toast.success(`Selected map: ${mapConfig.name}`, {
      description: mapConfig.description
    });
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    // Validate cooperative mode requirements
    if (multiplayerConfig.cooperativeMode && !multiplayerConfig.quaternionAxis) {
      toast.error('Please select your Quaternion Axis for cooperative mode');
      return;
    }

    setCreatingRoom(true);
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName.trim(),
          mapType: multiplayerConfig.mapType || 'crystalline_plains',
          mapWidth: multiplayerConfig.mapWidth || 40,
          mapHeight: multiplayerConfig.mapHeight || 30,
          commanderId: multiplayerConfig.commanderId || 'AUREN',
          cooperativeMode: multiplayerConfig.cooperativeMode || false,
          quaternionAxis: multiplayerConfig.quaternionAxis,
          seed: Math.floor(Math.random() * 1000000),
          difficulty: multiplayerConfig.difficulty || 'medium'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store playerId and roomId in localStorage for reconnection
        if (data.playerId) {
          localStorage.setItem('quaternion_playerId', data.playerId);
        }
        if (data.roomId) {
          localStorage.setItem('quaternion_roomId', data.roomId);
        }
        
        // Store room data for game loading
        if (data.room) {
          localStorage.setItem('quaternion_roomData', JSON.stringify(data.room));
        }
        
        toast.success(`Room "${roomName}" created successfully!`, {
          description: `Room ID: ${data.roomId}`
        });
        
        // Navigate to game with full config
        navigate('/quaternion', {
          state: {
            config: {
              ...multiplayerConfig,
              mode: 'multiplayer',
              roomId: data.roomId,
              playerId: data.playerId,
              seed: data.room?.seed,
              mapType: data.room?.mapType,
              mapWidth: data.room?.mapWidth,
              mapHeight: data.room?.mapHeight,
              cooperativeMode: data.room?.cooperativeMode,
              quaternionAxis: multiplayerConfig.quaternionAxis,
              difficulty: data.room?.difficulty
            }
          }
        });
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(error.error || error.message || 'Failed to create room');
        console.error('Room creation error:', error);
      }
    } catch (error) {
      toast.error('Failed to create room: Network error');
      console.error('Room creation network error:', error);
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    
    // Check if cooperative mode requires axis selection
    if (room?.cooperativeMode && !multiplayerConfig.quaternionAxis) {
      toast.error('Please select your Quaternion Axis to join this cooperative room');
      return;
    }
    
    setJoiningRoom(roomId);
    try {
      // Get existing playerId from localStorage if available (for reconnection)
      const existingPlayerId = localStorage.getItem('quaternion_playerId');
      
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commanderId: multiplayerConfig.commanderId || 'AUREN',
          quaternionAxis: multiplayerConfig.quaternionAxis,
          playerId: existingPlayerId // Include for reconnection
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store playerId and roomId in localStorage
        if (data.playerId) {
          localStorage.setItem('quaternion_playerId', data.playerId);
        }
        if (data.roomId) {
          localStorage.setItem('quaternion_roomId', data.roomId);
        }
        
        // Store room data for game loading
        if (data.room) {
          localStorage.setItem('quaternion_roomData', JSON.stringify(data.room));
        }
        
        toast.success(`Joined room "${data.room?.name || roomId}"!`, {
          description: `Players: ${data.room?.players || 0}/${data.room?.maxPlayers || 4}`
        });
        
        // Navigate to game with full config
        navigate('/quaternion', {
          state: {
            config: {
              ...multiplayerConfig,
              mode: 'multiplayer',
              roomId: data.roomId,
              playerId: data.playerId,
              seed: data.room?.seed,
              mapType: data.room?.mapType,
              mapWidth: data.room?.mapWidth,
              mapHeight: data.room?.mapHeight,
              cooperativeMode: data.room?.cooperativeMode,
              quaternionAxis: multiplayerConfig.quaternionAxis,
              difficulty: data.room?.difficulty
            }
          }
        });
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(error.error || error.message || 'Failed to join room');
        console.error('Join room error:', error);
      }
    } catch (error) {
      toast.error('Failed to join room: Network error');
      console.error('Join room network error:', error);
    } finally {
      setJoiningRoom(null);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    room.status === 'waiting' &&
    room.players < room.maxPlayers
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-primary hover:text-primary/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Game Lobby
          </h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>

        {/* Game Type Selection */}
        <Card className="bg-card/70 border-primary/30 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              Select Game Mode
            </CardTitle>
            <CardDescription>
              Choose between the streamlined Neural Frontier or the full Quaternion Strategy experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Card 
                className={`bg-card/70 border-primary/30 cursor-pointer transition-all ${
                  gameType === 'neural-frontier' ? 'border-2 border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => setGameType('neural-frontier')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gamepad2 className="w-5 h-5 text-cyan-400" />
                    <CardTitle className="text-lg">Neural Frontier</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Streamlined RTS - Quick 15-20 min matches, simplified resource management, perfect for beginners
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className={`bg-card/70 border-primary/30 cursor-pointer transition-all ${
                  gameType === 'quaternion' ? 'border-2 border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => setGameType('quaternion')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <CardTitle className="text-lg">Quaternion Strategy</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Full 4-axis strategy - Resource puzzles, black market, multiple victory paths, multiplayer support
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'single' | 'multiplayer')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Single Player
            </TabsTrigger>
            <TabsTrigger value="multiplayer" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Multiplayer
            </TabsTrigger>
          </TabsList>

          {/* Single Player Tab */}
          <TabsContent value="single">
            {/* Show mode selection only for Quaternion game */}
            {gameType === 'quaternion' && (
              <>
                {/* Single Player Mode Selection */}
                <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card 
                className={`bg-card/70 border-primary/30 cursor-pointer transition-all ${
                  singlePlayerMode === 'arena' ? 'border-2 border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => {
                  setSinglePlayerMode('arena');
                  setSinglePlayerConfig({ ...singlePlayerConfig, gameMode: 'arena', mode: 'single' });
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Arena Seed</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Short replayable matches with deterministic seeds. Perfect for judges.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className={`bg-card/70 border-primary/30 cursor-pointer transition-all ${
                  singlePlayerMode === 'campaign' ? 'border-2 border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => {
                  setSinglePlayerMode('campaign');
                  setSinglePlayerConfig({ ...singlePlayerConfig, gameMode: 'campaign', mode: 'campaign' });
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    <CardTitle className="text-lg">Campaign</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Chained seeds with advisor memory and meta-unlocks carrying over.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className={`bg-card/70 border-primary/30 cursor-pointer transition-all ${
                  singlePlayerMode === 'puzzle' ? 'border-2 border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => {
                  setSinglePlayerMode('puzzle');
                  setSinglePlayerConfig({ ...singlePlayerConfig, gameMode: 'puzzle', mode: 'puzzle' });
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Puzzle className="w-5 h-5 text-orange-400" />
                    <CardTitle className="text-lg">Puzzle Siege</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Short scripted puzzles focused on equilibrium challenges.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className={`bg-card/70 border-primary/30 cursor-pointer transition-all ${
                  singlePlayerMode === 'theater' ? 'border-2 border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => {
                  setSinglePlayerMode('theater');
                  setSinglePlayerConfig({ ...singlePlayerConfig, gameMode: 'theater', mode: 'theater' });
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Film className="w-5 h-5 text-cyan-400" />
                    <CardTitle className="text-lg">Theater Mode</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Replay your best runs with AI Core commentary overlay.
                  </CardDescription>
                </CardContent>
              </Card>
                </div>

                {/* Quick Start for Chroma Awards */}
            <Card className="bg-card/70 border-primary/30 mb-6 border-2 border-yellow-400/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-yellow-400" />
                  Quick Start (Chroma Awards Demo)
                </CardTitle>
                <CardDescription>
                  Optimized for 15-25 minute play sessions. Perfect for judges to experience the full game quickly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      ⚡ 50-70% faster build/research times
                    </p>
                    <p className="text-sm text-muted-foreground">
                      🎯 Reduced win condition requirements (10-20s)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      💰 30% lower costs, 50% faster resource gathering
                    </p>
                    <p className="text-sm text-muted-foreground">
                      📦 Smaller map + increased starting resources
                    </p>
                    <p className="text-xs text-yellow-400 mt-2 font-semibold">
                      Target completion: 15-25 minutes
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/quaternion', {
                      state: { config: quickStartConfig }
                    })}
                    size="lg"
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:shadow-lg"
                  >
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    Quick Start
                  </Button>
                </div>
              </CardContent>
            </Card>
              </>
            )}

            {/* Show simplified config for Neural Frontier */}
            {gameType === 'neural-frontier' && (
              <Card className="bg-card/70 border-primary/30 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-cyan-400" />
                    Neural Frontier - Quick Start
                  </CardTitle>
                  <CardDescription>
                    A streamlined RTS experience with AI commanders and tactical gameplay. Perfect for quick matches!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-background/50 rounded-lg border border-primary/20">
                        <h4 className="font-semibold mb-2 text-primary">Features</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Quick 15-20 minute matches</li>
                          <li>• AI commander suggestions</li>
                          <li>• Simplified resource management</li>
                          <li>• Tactical unit control</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-background/50 rounded-lg border border-primary/20">
                        <h4 className="font-semibold mb-2 text-primary">Perfect For</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Beginners learning RTS</li>
                          <li>• Quick gaming sessions</li>
                          <li>• Casual play</li>
                          <li>• Testing game mechanics</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Puzzle Selection - Only shown when puzzle mode is selected (Quaternion only) */}
            {gameType === 'quaternion' && singlePlayerMode === 'puzzle' && (
              <Card className="bg-card/70 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Puzzle className="w-5 h-5 text-orange-400" />
                    Select Puzzle
                  </CardTitle>
                  <CardDescription>
                    Choose a puzzle challenge. Complete puzzles to unlock more!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                    {getAvailablePuzzles(puzzleProgress.completed).map((puzzle) => {
                      const isCompleted = puzzleProgress.completed.includes(puzzle.id);
                      const isSelected = selectedPuzzle === puzzle.id;
                      const difficultyColors = {
                        easy: 'text-green-400 border-green-400',
                        medium: 'text-yellow-400 border-yellow-400',
                        hard: 'text-red-400 border-red-400'
                      };
                      
                      return (
                        <Card
                          key={puzzle.id}
                          className={`bg-card/70 border-primary/30 cursor-pointer transition-all ${
                            isSelected ? 'border-2 border-primary ring-2 ring-primary/20' : ''
                          } ${isCompleted ? 'opacity-80' : ''}`}
                          onClick={() => setSelectedPuzzle(puzzle.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-1">{puzzle.name}</h4>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${difficultyColors[puzzle.difficulty]}`}
                                  >
                                    {puzzle.difficulty}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {puzzle.category}
                                  </Badge>
                                  {isCompleted && (
                                    <Badge variant="outline" className="text-xs border-green-400 text-green-400">
                                      ✓ Completed
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {puzzle.description}
                            </p>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="font-semibold text-white mb-1">Win Condition:</div>
                              <div>{puzzle.winCondition.description}</div>
                              {puzzle.constraints.length > 0 && (
                                <>
                                  <div className="font-semibold text-white mt-2 mb-1">Constraints:</div>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {puzzle.constraints.slice(0, 2).map((constraint, idx) => (
                                      <li key={idx}>
                                        {constraint.type === 'time_limit' && `${constraint.value}s time limit`}
                                        {constraint.type === 'resource_min' && `Min ${constraint.resource}: ${constraint.value}`}
                                        {constraint.type === 'resource_max' && `Max ${constraint.resource}: ${constraint.value}`}
                                        {constraint.type === 'no_building' && 'No buildings allowed'}
                                        {constraint.type === 'no_research' && 'No research allowed'}
                                        {constraint.type === 'unit_limit' && `Max ${constraint.value} units`}
                                        {constraint.type === 'tech_required' && `Must research: ${constraint.techId}`}
                                      </li>
                                    ))}
                                    {puzzle.constraints.length > 2 && (
                                      <li>+{puzzle.constraints.length - 2} more...</li>
                                    )}
                                  </ul>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  {selectedPuzzle && (
                    <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <Puzzle className="w-4 h-4 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-semibold mb-2">Hints for {getPuzzle(selectedPuzzle)?.name}:</h5>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {getPuzzle(selectedPuzzle)?.hints.map((hint, idx) => (
                              <li key={idx}>{hint}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Map Selection - Only for Quaternion */}
            {gameType === 'quaternion' && singlePlayerMode !== 'puzzle' && (
              <Card className="bg-card/70 border-primary/30 mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Map className="w-5 h-5 text-primary" />
                        Select Map
                      </CardTitle>
                      <CardDescription>
                        Choose from 12 AI-generated map images
                      </CardDescription>
                    </div>
                    {selectedMap && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMapSelector(!showMapSelector)}
                      >
                        {showMapSelector ? 'Hide Maps' : 'Change Map'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {showMapSelector || !selectedMap ? (
                    <div className="max-h-[600px] overflow-y-auto">
                      <MapSelector
                        onMapSelect={handleMapSelect}
                        selectedMapId={selectedMap?.id}
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-background/50 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-4">
                        {selectedMap.imagePath && (
                          <OptimizedImage
                            src={selectedMap.imagePath}
                            alt={`${selectedMap.name} - ${selectedMap.description}`}
                            className="w-32 h-32 rounded-lg"
                            objectFit="cover"
                            fallbackSrc="/placeholder.svg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{selectedMap.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {selectedMap.description}
                          </p>
                          <div className="flex gap-2">
                            <Badge className={selectedMap.difficulty === 'easy' ? 'bg-green-500' : selectedMap.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}>
                              {selectedMap.difficulty.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{selectedMap.theme}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Configuration - Only show for Quaternion */}
            {gameType === 'quaternion' && (
              <Card className="bg-card/70 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Single Player Configuration
                  </CardTitle>
                  <CardDescription>
                    {singlePlayerMode === 'puzzle' 
                      ? 'Puzzle mode uses preset configurations'
                      : 'Configure your single player game against AI opponents'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Hide config for puzzle mode */}
                  {singlePlayerMode !== 'puzzle' && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Commander Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="commander">Commander</Label>
                    <Select
                      value={singlePlayerConfig.commanderId}
                      onValueChange={(value) =>
                        setSinglePlayerConfig({ ...singlePlayerConfig, commanderId: value })
                      }
                    >
                      <SelectTrigger id="commander">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(COMMANDERS).map((commander) => (
                          <SelectItem key={commander.id} value={commander.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: commander.color }}
                              />
                              {commander.name} - {commander.role}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {singlePlayerConfig.commanderId && (
                      <p className="text-sm text-muted-foreground">
                        {COMMANDERS[singlePlayerConfig.commanderId]?.quote}
                      </p>
                    )}
                  </div>

                  {/* Difficulty Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">AI Difficulty</Label>
                    <Select
                      value={singlePlayerConfig.difficulty}
                      onValueChange={(value: 'easy' | 'medium' | 'hard') =>
                        setSinglePlayerConfig({ ...singlePlayerConfig, difficulty: value })
                      }
                    >
                      <SelectTrigger id="difficulty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Map Type - Keep for backward compatibility */}
                  <div className="space-y-2">
                    <Label htmlFor="mapType">Map Type (Legacy)</Label>
                    <Select
                      value={singlePlayerConfig.mapType}
                      onValueChange={(value) =>
                        setSinglePlayerConfig({ ...singlePlayerConfig, mapType: value })
                      }
                    >
                      <SelectTrigger id="mapType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="crystalline_plains">Crystalline Plains</SelectItem>
                        <SelectItem value="neural_forest">Neural Forest</SelectItem>
                        <SelectItem value="quantum_wasteland">Quantum Wasteland</SelectItem>
                        <SelectItem value="void_caverns">Void Caverns</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Map Size - Override grid size if map selected */}
                  <div className="space-y-2">
                    <Label htmlFor="mapSize">Map Size {selectedMap && '(Override)'}</Label>
                    <Select
                      value={`${singlePlayerConfig.mapWidth}x${singlePlayerConfig.mapHeight}`}
                      onValueChange={(value) => {
                        const [width, height] = value.split('x').map(Number);
                        setSinglePlayerConfig({
                          ...singlePlayerConfig,
                          mapWidth: width,
                          mapHeight: height
                        });
                      }}
                    >
                      <SelectTrigger id="mapSize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30x20">Small (30x20)</SelectItem>
                        <SelectItem value="40x30">Medium (40x30)</SelectItem>
                        <SelectItem value="50x40">Large (50x40)</SelectItem>
                        <SelectItem value="60x50">Extra Large (60x50)</SelectItem>
                        {selectedMap && (
                          <SelectItem value={`${selectedMap.gridSize.width}x${selectedMap.gridSize.height}`}>
                            Map Default ({selectedMap.gridSize.width}×{selectedMap.gridSize.height})
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                )}

                {/* Seed (optional) - Hidden for puzzle mode */}
                {singlePlayerMode !== 'puzzle' && (
                <div className="space-y-2">
                  <Label htmlFor="seed">Game Seed (Optional)</Label>
                  <Input
                    id="seed"
                    type="number"
                    value={singlePlayerConfig.seed}
                    onChange={(e) =>
                      setSinglePlayerConfig({
                        ...singlePlayerConfig,
                        seed: parseInt(e.target.value) || Math.floor(Math.random() * 1000000)
                      })
                    }
                    placeholder="Random seed for map generation"
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty for random seed, or enter a specific seed for reproducible maps
                  </p>
                </div>
                )}

                  {/* Start Button */}
                  <Button
                    onClick={handleStartSinglePlayer}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-neon"
                    disabled={singlePlayerMode === 'puzzle' && !selectedPuzzle}
                  >
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    {singlePlayerMode === 'puzzle' 
                      ? (selectedPuzzle ? `Start Puzzle: ${getPuzzle(selectedPuzzle)?.name}` : 'Select a Puzzle to Start')
                      : 'Start Single Player Game'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Start Button for Neural Frontier */}
            {gameType === 'neural-frontier' && (
              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <Button
                    onClick={handleStartSinglePlayer}
                    size="lg"
                    className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:shadow-lg"
                  >
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    Launch Neural Frontier
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Multiplayer Tab - Only available for Quaternion */}
          <TabsContent value="multiplayer">
            {gameType === 'neural-frontier' ? (
              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Multiplayer Not Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Neural Frontier is currently single-player only. Switch to Quaternion Strategy for multiplayer support.
                  </p>
                  <Button
                    onClick={() => setGameType('quaternion')}
                    variant="outline"
                  >
                    Switch to Quaternion Strategy
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
            {/* Multiplayer Mode Selection */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Card 
                className={`bg-card/70 border-primary/30 cursor-pointer transition-all ${
                  !multiplayerConfig.cooperativeMode ? 'border-2 border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => setMultiplayerConfig({ ...multiplayerConfig, cooperativeMode: false })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Competitive</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Standard multiplayer matches with competing factions.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className={`bg-card/70 border-primary/30 cursor-pointer transition-all ${
                  multiplayerConfig.cooperativeMode ? 'border-2 border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => setMultiplayerConfig({ ...multiplayerConfig, cooperativeMode: true })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-400" />
                    <CardTitle className="text-lg">Cooperative Faction</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Up to 4 players, each controlling one quaternion axis (Matter, Energy, Life, Knowledge).
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Create Room */}
              <Card className="bg-card/70 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Create Room
                  </CardTitle>
                  <CardDescription>
                    Create a new multiplayer room and wait for players to join
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomName">Room Name</Label>
                    <Input
                      id="roomName"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Enter room name..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mpCommander">Your Commander</Label>
                    <Select
                      value={multiplayerConfig.commanderId}
                      onValueChange={(value) =>
                        setMultiplayerConfig({ ...multiplayerConfig, commanderId: value })
                      }
                    >
                      <SelectTrigger id="mpCommander">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(COMMANDERS).map((commander) => (
                          <SelectItem key={commander.id} value={commander.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: commander.color }}
                              />
                              {commander.name} - {commander.role}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mpMapType">Map Type</Label>
                    <Select
                      value={multiplayerConfig.mapType}
                      onValueChange={(value) =>
                        setMultiplayerConfig({ ...multiplayerConfig, mapType: value })
                      }
                    >
                      <SelectTrigger id="mpMapType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="crystalline_plains">Crystalline Plains</SelectItem>
                        <SelectItem value="neural_forest">Neural Forest</SelectItem>
                        <SelectItem value="quantum_wasteland">Quantum Wasteland</SelectItem>
                        <SelectItem value="void_caverns">Void Caverns</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cooperative Mode: Quaternion Axis Selection */}
                  {multiplayerConfig.cooperativeMode && (
                    <div className="space-y-2">
                      <Label htmlFor="quaternionAxis">Your Quaternion Axis</Label>
                      <Select
                        value={multiplayerConfig.quaternionAxis || ''}
                        onValueChange={(value: 'matter' | 'energy' | 'life' | 'knowledge') =>
                          setMultiplayerConfig({ ...multiplayerConfig, quaternionAxis: value })
                        }
                      >
                        <SelectTrigger id="quaternionAxis">
                          <SelectValue placeholder="Select your axis..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="matter">
                            <div className="flex items-center gap-2">
                              <Box className="w-4 h-4 text-blue-400" />
                              Matter - Physical resources and structures
                            </div>
                          </SelectItem>
                          <SelectItem value="energy">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-yellow-400" />
                              Energy - Power and movement
                            </div>
                          </SelectItem>
                          <SelectItem value="life">
                            <div className="flex items-center gap-2">
                              <Leaf className="w-4 h-4 text-green-400" />
                              Life - Growth and sustainability
                            </div>
                          </SelectItem>
                          <SelectItem value="knowledge">
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-purple-400" />
                              Knowledge - Research and technology
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        In cooperative mode, each player controls one axis. Coordinate with your team!
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleCreateRoom}
                    disabled={creatingRoom}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-neon"
                  >
                    {creatingRoom ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2" />
                        Create Room
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Join Room */}
              <Card className="bg-card/70 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-primary" />
                    Join Room
                  </CardTitle>
                  <CardDescription>
                    Browse and join available multiplayer rooms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchRooms">Search Rooms</Label>
                    <Input
                      id="searchRooms"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search rooms..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="joinCommander">Your Commander</Label>
                    <Select
                      value={multiplayerConfig.commanderId}
                      onValueChange={(value) =>
                        setMultiplayerConfig({ ...multiplayerConfig, commanderId: value })
                      }
                    >
                      <SelectTrigger id="joinCommander">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(COMMANDERS).map((commander) => (
                          <SelectItem key={commander.id} value={commander.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: commander.color }}
                              />
                              {commander.name} - {commander.role}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quaternion Axis Selection for Joining Cooperative Rooms */}
                  <div className="space-y-2">
                    <Label htmlFor="joinQuaternionAxis">Quaternion Axis (for Cooperative Rooms)</Label>
                    <Select
                      value={multiplayerConfig.quaternionAxis || ''}
                      onValueChange={(value: 'matter' | 'energy' | 'life' | 'knowledge') =>
                        setMultiplayerConfig({ ...multiplayerConfig, quaternionAxis: value })
                      }
                    >
                      <SelectTrigger id="joinQuaternionAxis">
                        <SelectValue placeholder="Select axis (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="matter">
                          <div className="flex items-center gap-2">
                            <Box className="w-4 h-4 text-blue-400" />
                            Matter
                          </div>
                        </SelectItem>
                        <SelectItem value="energy">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            Energy
                          </div>
                        </SelectItem>
                        <SelectItem value="life">
                          <div className="flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-green-400" />
                            Life
                          </div>
                        </SelectItem>
                        <SelectItem value="knowledge">
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-400" />
                            Knowledge
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Required for cooperative rooms. Each player controls one axis.
                    </p>
                  </div>

                  {/* Room List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {loadingRooms ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : filteredRooms.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No available rooms found
                      </div>
                    ) : (
                      filteredRooms.map((room) => (
                        <Card
                          key={room.id}
                          className="bg-background/50 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                          onClick={() => handleJoinRoom(room.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{room.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {room.mapType.replace('_', ' ')}
                                  </Badge>
                                  {room.cooperativeMode && (
                                    <Badge variant="outline" className="text-xs border-green-400 text-green-400">
                                      Cooperative
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {room.players}/{room.maxPlayers}
                                  </span>
                                  <span>Host: {room.host}</span>
                                </div>
                                {room.cooperativeMode && room.assignedAxes && (
                                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                    <span className="text-muted-foreground">Axes:</span>
                                    {room.assignedAxes.matter && (
                                      <Badge variant="outline" className="text-xs border-blue-400 text-blue-400">
                                        <Box className="w-3 h-3 mr-1" />
                                        Matter
                                      </Badge>
                                    )}
                                    {room.assignedAxes.energy && (
                                      <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-400">
                                        <Zap className="w-3 h-3 mr-1" />
                                        Energy
                                      </Badge>
                                    )}
                                    {room.assignedAxes.life && (
                                      <Badge variant="outline" className="text-xs border-green-400 text-green-400">
                                        <Leaf className="w-3 h-3 mr-1" />
                                        Life
                                      </Badge>
                                    )}
                                    {room.assignedAxes.knowledge && (
                                      <Badge variant="outline" className="text-xs border-purple-400 text-purple-400">
                                        <Brain className="w-3 h-3 mr-1" />
                                        Knowledge
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                disabled={joiningRoom === room.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinRoom(room.id);
                                }}
                              >
                                {joiningRoom === room.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Join'
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Lobby;

