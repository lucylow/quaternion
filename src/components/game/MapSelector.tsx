/**
 * Map Selector Component
 * UI for selecting a map before starting a game
 */

import React, { useState, useEffect } from 'react';
import { MapConfig } from '@/types/map';
import { mapLoader } from '@/services/MapLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { assetUrl } from '@/utils/assetUrl';

interface MapSelectorProps {
  onMapSelect: (mapConfig: MapConfig) => void;
  selectedMapId?: string;
}

export const MapSelector: React.FC<MapSelectorProps> = ({
  onMapSelect,
  selectedMapId
}) => {
  const [maps, setMaps] = useState<MapConfig[]>([]);
  const [previewImages, setPreviewImages] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const availableMaps = mapLoader.getAvailableMaps();
    setMaps(availableMaps);

    // Preload preview images with retry logic
    availableMaps.forEach(map => {
      const loadImageWithRetry = async (path: string, retries: number = 3) => {
        // Resolve the path using assetUrl() to handle special characters and Lovable transformation
        const resolvedPath = assetUrl(path);
        
        // Try resolved path and original path, with and without CORS
        const pathsToTry = [
          { path: resolvedPath, cors: false },
          { path: path, cors: false },
          { path: resolvedPath, cors: true },  // Try with CORS as fallback
          { path: path, cors: true }
        ];

        for (let attempt = 0; attempt < retries; attempt++) {
          for (const { path: tryPath, cors } of pathsToTry) {
            try {
              await new Promise<void>((resolve, reject) => {
                const img = new Image();
                
                // Only set crossOrigin if needed (for external sources like GitHub)
                if (cors || tryPath.startsWith('http://') || tryPath.startsWith('https://')) {
                  img.crossOrigin = 'anonymous';
                }
                
                const timeout = setTimeout(() => {
                  reject(new Error('Timeout'));
                }, 8000);

                img.onload = () => {
                  clearTimeout(timeout);
                  setPreviewImages(prev => new Map(prev).set(map.id, tryPath));
                  resolve();
                };

                img.onerror = () => {
                  clearTimeout(timeout);
                  reject(new Error('Load failed'));
                };

                img.src = tryPath;
              });
              return; // Success, exit function
            } catch (error) {
              if (attempt === retries - 1 && tryPath === pathsToTry[pathsToTry.length - 1].path && cors === pathsToTry[pathsToTry.length - 1].cors) {
                // Last attempt failed
                console.warn(`Failed to load preview for map: ${map.id} after ${retries} attempts`);
              } else {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
              }
            }
          }
        }
      };

      loadImageWithRetry(map.imagePath);
    });
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'hard': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getThemeColor = (theme: string) => {
    const themeColors: Record<string, string> = {
      alien: 'border-purple-400',
      urban: 'border-gray-400',
      aquatic: 'border-blue-400',
      mountain: 'border-stone-400',
      desert: 'border-amber-400',
      ice: 'border-cyan-400',
      volcanic: 'border-orange-400',
      jungle: 'border-green-400',
      mixed: 'border-indigo-400',
      open: 'border-teal-400',
      tactical: 'border-red-400'
    };
    return themeColors[theme] || 'border-gray-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {maps.map(map => (
        <Card
          key={map.id}
          className={`cursor-pointer transition-all hover:scale-105 ${
            selectedMapId === map.id ? 'ring-2 ring-primary border-2 border-primary' : ''
          } ${getThemeColor(map.theme)} border`}
          onClick={() => onMapSelect(map)}
        >
          <CardHeader className="p-0">
            {previewImages.has(map.id) ? (
              <img
                src={previewImages.get(map.id)}
                alt={map.name}
                className="w-full h-48 object-cover rounded-t-lg"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-lg flex items-center justify-center">
                <span className="text-gray-500 text-sm">Loading preview...</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4">
            <CardTitle className="text-lg mb-2">{map.name}</CardTitle>
            <CardDescription className="text-sm mb-3">
              {map.description}
            </CardDescription>
            <div className="flex gap-2 flex-wrap">
              <Badge className={getDifficultyColor(map.difficulty)}>
                {map.difficulty.toUpperCase()}
              </Badge>
              <Badge variant="outline" className={`${getThemeColor(map.theme)} text-xs`}>
                {map.theme}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {map.gridSize.width}×{map.gridSize.height}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

