import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, User, Gamepad2, Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { COMMANDERS } from '@/data/quaternionData';
import { toast } from 'sonner';

interface GameConfig {
  mode: 'single' | 'multiplayer';
  commanderId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  mapType?: string;
  mapWidth?: number;
  mapHeight?: number;
  seed?: number;
  roomId?: string;
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
}

const Lobby = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'single' | 'multiplayer'>('single');
  
  // Single player config
  const [singlePlayerConfig, setSinglePlayerConfig] = useState<GameConfig>({
    mode: 'single',
    commanderId: 'AUREN',
    difficulty: 'medium',
    mapType: 'crystalline_plains',
    mapWidth: 40,
    mapHeight: 30,
    seed: Math.floor(Math.random() * 1000000)
  });

  // Multiplayer config
  const [multiplayerConfig, setMultiplayerConfig] = useState<GameConfig>({
    mode: 'multiplayer',
    commanderId: 'AUREN',
    mapType: 'crystalline_plains',
    mapWidth: 40,
    mapHeight: 30
  });

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
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
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

  const handleStartSinglePlayer = () => {
    navigate('/quaternion', {
      state: {
        config: singlePlayerConfig
      }
    });
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    setCreatingRoom(true);
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName,
          mapType: multiplayerConfig.mapType,
          mapWidth: multiplayerConfig.mapWidth,
          mapHeight: multiplayerConfig.mapHeight,
          commanderId: multiplayerConfig.commanderId
        })
      });

      if (response.ok) {
        const data = await response.json();
        navigate('/quaternion', {
          state: {
            config: {
              ...multiplayerConfig,
              roomId: data.roomId
            }
          }
        });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create room');
      }
    } catch (error) {
      toast.error('Failed to create room');
      console.error(error);
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    setJoiningRoom(roomId);
    try {
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commanderId: multiplayerConfig.commanderId
        })
      });

      if (response.ok) {
        const data = await response.json();
        navigate('/quaternion', {
          state: {
            config: {
              ...multiplayerConfig,
              roomId: data.roomId
            }
          }
        });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to join room');
      }
    } catch (error) {
      toast.error('Failed to join room');
      console.error(error);
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
            <Card className="bg-card/70 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Single Player Configuration
                </CardTitle>
                <CardDescription>
                  Configure your single player game against AI opponents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                  {/* Map Type */}
                  <div className="space-y-2">
                    <Label htmlFor="mapType">Map Type</Label>
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

                  {/* Map Size */}
                  <div className="space-y-2">
                    <Label htmlFor="mapSize">Map Size</Label>
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Seed (optional) */}
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

                {/* Start Button */}
                <Button
                  onClick={handleStartSinglePlayer}
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-neon"
                >
                  <Gamepad2 className="w-5 h-5 mr-2" />
                  Start Single Player Game
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Multiplayer Tab */}
          <TabsContent value="multiplayer">
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
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {room.players}/{room.maxPlayers}
                                  </span>
                                  <span>Host: {room.host}</span>
                                </div>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Lobby;

