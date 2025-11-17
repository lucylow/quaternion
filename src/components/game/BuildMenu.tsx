import { Button } from '@/components/ui/button';
import { BUILDINGS } from '@/data/quaternionData';
import { Box, Zap, Leaf, Brain } from 'lucide-react';

interface BuildMenuProps {
  resources: { matter: number; energy: number; life: number; knowledge: number };
  onBuild: (buildingId: string) => void;
  onClose: () => void;
}

export const BuildMenu = ({ resources, onBuild, onClose }: BuildMenuProps) => {
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
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">CONSTRUCTION MENU</h2>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Object.values(BUILDINGS).map(building => {
            const affordable = canBuild(building);
            
            return (
              <div
                key={building.id}
                className={`bg-gray-700 rounded p-4 border ${
                  affordable 
                    ? 'border-cyan-400 hover:bg-cyan-400/10 cursor-pointer' 
                    : 'border-gray-600 opacity-50'
                } transition-all`}
                onClick={() => affordable && onBuild(building.id)}
              >
                <h3 className="font-bold mb-1 text-white">{building.name}</h3>
                <p className="text-xs text-gray-400 mb-2">{building.description}</p>
                
                <div className="space-y-1">
                  <div className="flex gap-2 text-xs flex-wrap">
                    <span className="text-gray-400">Cost:</span>
                    {building.cost.matter && (
                      <span className="flex items-center gap-1 text-blue-400">
                        <Box className="w-3 h-3" />{building.cost.matter}
                      </span>
                    )}
                    {building.cost.energy && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Zap className="w-3 h-3" />{building.cost.energy}
                      </span>
                    )}
                    {building.cost.life && (
                      <span className="flex items-center gap-1 text-green-400">
                        <Leaf className="w-3 h-3" />{building.cost.life}
                      </span>
                    )}
                    {building.cost.knowledge && (
                      <span className="flex items-center gap-1 text-purple-400">
                        <Brain className="w-3 h-3" />{building.cost.knowledge}
                      </span>
                    )}
                  </div>
                  
                  {building.produces && (
                    <div className="flex gap-2 text-xs text-green-500 flex-wrap">
                      <span>Produces:</span>
                      {building.produces.matter && (
                        <span className="flex items-center gap-1">
                          <Box className="w-3 h-3" />+{building.produces.matter}/s
                        </span>
                      )}
                      {building.produces.energy && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />+{building.produces.energy}/s
                        </span>
                      )}
                      {building.produces.life && (
                        <span className="flex items-center gap-1">
                          <Leaf className="w-3 h-3" />+{building.produces.life}/s
                        </span>
                      )}
                      {building.produces.knowledge && (
                        <span className="flex items-center gap-1">
                          <Brain className="w-3 h-3" />+{building.produces.knowledge}/s
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    Build time: {building.buildTime}s
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    </div>
  );
};
