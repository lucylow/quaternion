import { Button } from '@/components/ui/button';
import { BUILDINGS } from '@/data/quaternionData';
import { Box, Zap, Leaf, Brain } from 'lucide-react';
import { useState, useEffect } from 'react';
import { InteractionAudio } from '@/audio/InteractionAudio';

interface BuildMenuProps {
  resources: { matter: number; energy: number; life: number; knowledge: number };
  onBuild: (buildingId: string) => void;
  onClose: () => void;
}

export const BuildMenu = ({ resources, onBuild, onClose }: BuildMenuProps) => {
  const [interactionAudio, setInteractionAudio] = useState<InteractionAudio | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  useEffect(() => {
    const initAudio = async () => {
      const audio = InteractionAudio.instance();
      await audio.init();
      setInteractionAudio(audio);
    };
    initAudio();
  }, []);

  const canBuild = (building: typeof BUILDINGS[string]) => {
    return (
      (!building.cost.matter || resources.matter >= building.cost.matter) &&
      (!building.cost.energy || resources.energy >= building.cost.energy) &&
      (!building.cost.life || resources.life >= building.cost.life) &&
      (!building.cost.knowledge || resources.knowledge >= building.cost.knowledge)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 border-2 border-cyan-400 rounded-lg p-6 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-3xl font-bold text-cyan-300 mb-4 text-readable-neon">CONSTRUCTION MENU</h2>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Object.values(BUILDINGS).map(building => {
            const affordable = canBuild(building);
            
            return (
              <div
                key={building.id}
                className={`bg-gray-700 rounded p-4 border ${
                  affordable 
                    ? 'border-cyan-400/50 hover:bg-cyan-400/20 cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-cyan-400/50' 
                    : 'border-gray-600 opacity-50 cursor-not-allowed'
                } transition-all duration-200 ${
                  hoveredBuilding === building.id ? 'ring-2 ring-cyan-400 scale-105' : ''
                }`}
                onMouseEnter={() => {
                  if (affordable) {
                    setHoveredBuilding(building.id);
                    interactionAudio?.play('hover', { volume: 0.3 });
                  }
                }}
                onMouseLeave={() => setHoveredBuilding(null)}
                onClick={() => {
                  if (affordable) {
                    interactionAudio?.play('build', { volume: 0.7 });
                    onBuild(building.id);
                  } else {
                    interactionAudio?.play('error', { volume: 0.5 });
                  }
                }}
              >
                <h3 className="font-bold mb-1 text-base text-cyan-200 text-readable-neon">{building.name}</h3>
                <p className="text-sm text-cyan-100 mb-2 text-readable">{building.description}</p>
                
                <div className="space-y-1">
                  <div className="flex gap-2 text-sm flex-wrap">
                    <span className="text-cyan-200 text-readable">Cost:</span>
                    {building.cost.matter && (
                      <span className="flex items-center gap-1 text-orange-300 text-readable-neon">
                        <Box className="w-4 h-4" />{building.cost.matter}
                      </span>
                    )}
                    {building.cost.energy && (
                      <span className="flex items-center gap-1 text-yellow-300 text-readable-neon">
                        <Zap className="w-4 h-4" />{building.cost.energy}
                      </span>
                    )}
                    {building.cost.life && (
                      <span className="flex items-center gap-1 text-green-300 text-readable-neon">
                        <Leaf className="w-4 h-4" />{building.cost.life}
                      </span>
                    )}
                    {building.cost.knowledge && (
                      <span className="flex items-center gap-1 text-purple-300 text-readable-neon">
                        <Brain className="w-4 h-4" />{building.cost.knowledge}
                      </span>
                    )}
                  </div>
                  
                  {building.produces && (
                    <div className="flex gap-2 text-sm text-green-300 flex-wrap text-readable-neon">
                      <span>Produces:</span>
                      {building.produces.matter && (
                        <span className="flex items-center gap-1">
                          <Box className="w-4 h-4" />+{building.produces.matter}/s
                        </span>
                      )}
                      {building.produces.energy && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />+{building.produces.energy}/s
                        </span>
                      )}
                      {building.produces.life && (
                        <span className="flex items-center gap-1">
                          <Leaf className="w-4 h-4" />+{building.produces.life}/s
                        </span>
                      )}
                      {building.produces.knowledge && (
                        <span className="flex items-center gap-1">
                          <Brain className="w-4 h-4" />+{building.produces.knowledge}/s
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-sm text-cyan-200 text-readable">
                    Build time: {building.buildTime}s
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button 
          onClick={() => {
            interactionAudio?.play('click', { volume: 0.4 });
            onClose();
          }}
          className="w-full hover:scale-105 transition-transform duration-150"
        >
          Close
        </Button>
      </div>
    </div>
  );
};
