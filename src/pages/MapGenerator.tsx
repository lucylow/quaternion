import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../frontend/scenes/BootScene';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageAssetLoader } from '@/game/ImageAssetLoader';
import '../App.css';

interface MapPreview {
  key: string;
  name: string;
  description: string;
  path: string;
  category: string;
}

const MapGenerator = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [mapPreviews, setMapPreviews] = useState<MapPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Map metadata for better display
  const mapMetadata: Record<string, { name: string; description: string; category: string }> = {
    'map-twilight': {
      name: 'Twilight Biome',
      description: 'A mysterious realm where day meets night, featuring glowing auroras and ethereal landscapes',
      category: 'Fantasy'
    },
    'map-urban': {
      name: 'Urban Battlefield',
      description: 'Dense cityscape with towering structures and strategic chokepoints',
      category: 'Urban'
    },
    'map-underwater': {
      name: 'Underwater Biome',
      description: 'Submerged depths with bioluminescent flora and ancient ruins',
      category: 'Aquatic'
    },
    'map-mountain': {
      name: 'Mountainous Terrain',
      description: 'Rugged peaks with layered elevations and natural fortifications',
      category: 'Mountain'
    },
    'map-desert': {
      name: 'Desert Terrain',
      description: 'Shifting sand dunes, canyons, and hidden oases',
      category: 'Desert'
    },
    'map-icy': {
      name: 'Icy Wasteland',
      description: 'Frozen tundra with slippery surfaces and glacial formations',
      category: 'Arctic'
    },
    'map-volcanic': {
      name: 'Volcanic Terrain',
      description: 'Dark basalt fields with glowing lava flows and obsidian formations',
      category: 'Volcanic'
    },
    'map-jungle': {
      name: 'Alien Jungle',
      description: 'Lush alien vegetation with glowing flora and dense canopies',
      category: 'Jungle'
    },
    'map-varied': {
      name: 'Varied Terrains',
      description: 'A diverse landscape featuring multiple terrain types and strategic variety',
      category: 'Mixed'
    },
    'map-easy': {
      name: 'Easy Map',
      description: 'Open terrain with minimal obstacles, perfect for beginners',
      category: 'Beginner'
    },
    'map-difficulty-series': {
      name: 'Difficulty Series',
      description: 'A collection of maps designed for progressive challenge levels',
      category: 'Progressive'
    },
    'map-hybrid': {
      name: 'Hybrid 2D/3D',
      description: 'Tactical top-down interface with detailed terrain features',
      category: 'Hybrid'
    }
  };

  useEffect(() => {
    // Initialize map previews
    ImageAssetLoader.initializeAssets();
    const mapKeys = ImageAssetLoader.getMapKeys();
    const previews: MapPreview[] = mapKeys.map(key => {
      const metadata = mapMetadata[key] || { name: key, description: 'A procedurally generated map', category: 'Unknown' };
      // Get the asset path
      const asset = ImageAssetLoader.getMapAssetByKey(key);
      return {
        key,
        name: metadata.name,
        description: metadata.description,
        path: asset?.path || '',
        category: metadata.category
      };
    });
    setMapPreviews(previews);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) {
      return;
    }

    phaserGameRef.current = new Phaser.Game({
      ...gameConfig,
      parent: gameRef.current || undefined
    });

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  const handleMapSelect = (mapKey: string) => {
    setSelectedMap(mapKey);
    // You can add logic here to load the selected map in the Phaser game
  };

  const getMapImageUrl = (path: string) => {
    if (!path) return '';
    // Ensure path starts with /assets
    return path.startsWith('/') ? path : `/assets${path}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header Section */}
      <div className="relative overflow-hidden border-b border-purple-500/20 bg-gradient-to-r from-purple-900/50 via-blue-900/50 to-purple-900/50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMS4xLS45LTItMi0ySDI2Yy0xLjEgMC0yIC45LTIgMnYyNGMwIDEuMS45IDIgMiAyaDhjMS4xIDAgMi0uOSAyLTJWMzR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Quaternion Map Generator
            </h1>
            <p className="text-xl text-purple-200/90 max-w-2xl mx-auto">
              Explore procedurally-generated battlefields across diverse biomes and terrains. 
              Each map offers unique strategic challenges and visual experiences.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="gallery">Map Gallery</TabsTrigger>
            <TabsTrigger value="generator">Live Generator</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                <p className="mt-4 text-purple-200">Loading maps...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mapPreviews.map((map) => {
                  const imageUrl = getMapImageUrl(map.path);
                  const isSelected = selectedMap === map.key;
                  
                  return (
                    <Card
                      key={map.key}
                      className={`group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                        isSelected 
                          ? 'ring-2 ring-purple-400 shadow-purple-500/50' 
                          : 'hover:ring-2 hover:ring-purple-400/50'
                      } bg-slate-800/80 backdrop-blur-sm border-purple-500/30`}
                      onClick={() => handleMapSelect(map.key)}
                    >
                      <div className="relative aspect-video overflow-hidden bg-slate-900">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={map.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
                            <span className="text-purple-300 text-sm">Map Preview</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <Badge 
                          className="absolute top-2 right-2 bg-purple-600/90 hover:bg-purple-600 border-purple-400/50"
                        >
                          {map.category}
                        </Badge>
                        {isSelected && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-green-600/90 hover:bg-green-600 border-green-400/50">
                              Selected
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-purple-200 group-hover:text-purple-100 transition-colors">
                          {map.name}
                        </CardTitle>
                        <CardDescription className="text-purple-300/70 text-sm line-clamp-2">
                          {map.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="w-full bg-purple-600/20 hover:bg-purple-600/40 border-purple-400/50 text-purple-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMapSelect(map.key);
                          }}
                        >
                          {isSelected ? 'Selected' : 'Select Map'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="generator" className="space-y-6">
            <Card className="bg-slate-800/80 backdrop-blur-sm border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-200">Live Map Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-purple-300/80">
                    Select a map theme above to explore procedurally-generated terrain in real-time.
                  </p>
                  <div 
                    id="game-container" 
                    ref={gameRef} 
                    className="game-container-generator w-full min-h-[600px] rounded-lg overflow-hidden border-2 border-purple-500/30 bg-black"
                  />
                  {selectedMap && (
                    <div className="mt-4 p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                      <p className="text-sm text-purple-200">
                        <strong>Selected:</strong> {mapMetadata[selectedMap]?.name || selectedMap}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/80 backdrop-blur-sm border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-200">Map Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Fire', desc: 'Lava, volcanic terrain, and scorching heat', icon: '🔥' },
                    { name: 'Ice', desc: 'Frozen tundra, glaciers, and crevasses', icon: '❄️' },
                    { name: 'Forest', desc: 'Dense woodland with swamps and groves', icon: '🌲' },
                    { name: 'Desert', desc: 'Sand dunes, canyons, and oasis', icon: '🏜️' },
                    { name: 'Volcanic', desc: 'Dark basalt, obsidian, and active lava', icon: '🌋' },
                    { name: 'Urban', desc: 'Cityscapes with strategic chokepoints', icon: '🏙️' },
                  ].map((theme) => (
                    <div
                      key={theme.name}
                      className="p-4 rounded-lg bg-purple-900/20 border border-purple-500/30 hover:bg-purple-900/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{theme.icon}</span>
                        <h4 className="font-semibold text-purple-200">{theme.name}</h4>
                      </div>
                      <p className="text-sm text-purple-300/70">{theme.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MapGenerator;
