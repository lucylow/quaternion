import { Button } from '@/components/ui/button';
import { BUILDINGS } from '@/data/gameData';
import { Box, Zap, Leaf, Brain } from 'lucide-react';

interface BuildMenuProps {
  resources: { ore: number; energy: number; biomass: number; data: number };
  onBuild: (buildingId: string) => void;
  onClose: () => void;
}

export const BuildMenu = ({ resources, onBuild, onClose }: BuildMenuProps) => {
  const canBuild = (building: typeof BUILDINGS[string]) => {
    return (
      (!building.cost.ore || resources.ore >= building.cost.ore) &&
      (!building.cost.energy || resources.energy >= building.cost.energy) &&
      (!building.cost.biomass || resources.biomass >= building.cost.biomass) &&
      (!building.cost.data || resources.data >= building.cost.data)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-quaternion-darker border-2 border-quaternion-primary rounded-lg p-6 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-quaternion-primary mb-4">CONSTRUCTION MENU</h2>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Object.values(BUILDINGS).map(building => {
            const affordable = canBuild(building);
            
            return (
              <div
                key={building.id}
                className={`bg-quaternion-dark rounded p-4 border ${
                  affordable 
                    ? 'border-quaternion-primary hover:bg-quaternion-primary/10 cursor-pointer' 
                    : 'border-gray-600 opacity-50'
                } transition-all`}
                onClick={() => affordable && onBuild(building.id)}
              >
                <h3 className="font-bold mb-1">{building.name}</h3>
                <p className="text-xs text-quaternion-light/60 mb-2">{building.description}</p>
                
                <div className="space-y-1">
                  <div className="flex gap-2 text-xs">
                    <span className="text-quaternion-light/60">Cost:</span>
                    {building.cost.ore && <span className="flex items-center gap-1"><Box className="w-3 h-3" />{building.cost.ore}</span>}
                    {building.cost.energy && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{building.cost.energy}</span>}
                    {building.cost.biomass && <span className="flex items-center gap-1"><Leaf className="w-3 h-3" />{building.cost.biomass}</span>}
                    {building.cost.data && <span className="flex items-center gap-1"><Brain className="w-3 h-3" />{building.cost.data}</span>}
                  </div>
                  
                  {building.produces && (
                    <div className="flex gap-2 text-xs text-green-500">
                      <span>Produces:</span>
                      {building.produces.ore && <span className="flex items-center gap-1"><Box className="w-3 h-3" />+{building.produces.ore}/s</span>}
                      {building.produces.energy && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />+{building.produces.energy}/s</span>}
                      {building.produces.biomass && <span className="flex items-center gap-1"><Leaf className="w-3 h-3" />+{building.produces.biomass}/s</span>}
                      {building.produces.data && <span className="flex items-center gap-1"><Brain className="w-3 h-3" />+{building.produces.data}/s</span>}
                    </div>
                  )}
                  
                  <div className="text-xs text-quaternion-light/60">
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
