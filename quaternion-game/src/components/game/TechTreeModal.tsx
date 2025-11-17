import { Button } from '@/components/ui/button';
import { TECH_TREE, TechNode } from '@/data/gameData';
import { Box, Zap, Leaf, Brain, Lock, CheckCircle } from 'lucide-react';

interface TechTreeModalProps {
  researchedTechs: Set<string>;
  resources: { ore: number; energy: number; biomass: number; data: number };
  onResearch: (techId: string) => void;
  onClose: () => void;
}

export const TechTreeModal = ({ researchedTechs, resources, onResearch, onClose }: TechTreeModalProps) => {
  const canResearch = (tech: TechNode) => {
    if (researchedTechs.has(tech.id)) return false;
    
    const hasPrereqs = tech.prerequisites.every(prereq => researchedTechs.has(prereq));
    if (!hasPrereqs) return false;

    return (
      (!tech.cost.ore || resources.ore >= tech.cost.ore) &&
      (!tech.cost.energy || resources.energy >= tech.cost.energy) &&
      (!tech.cost.biomass || resources.biomass >= tech.cost.biomass) &&
      (!tech.cost.data || resources.data >= tech.cost.data)
    );
  };

  const getBranchColor = (branch: string) => {
    switch (branch) {
      case 'matter': return 'quaternion-primary';
      case 'energy': return 'quaternion-secondary';
      case 'life': return 'green-500';
      case 'knowledge': return 'yellow-500';
      default: return 'quaternion-primary';
    }
  };

  const getBranchIcon = (branch: string) => {
    switch (branch) {
      case 'matter': return Box;
      case 'energy': return Zap;
      case 'life': return Leaf;
      case 'knowledge': return Brain;
      default: return Box;
    }
  };

  const branches = {
    matter: { name: 'Matter', techs: [] as TechNode[] },
    energy: { name: 'Energy', techs: [] as TechNode[] },
    life: { name: 'Life', techs: [] as TechNode[] },
    knowledge: { name: 'Knowledge', techs: [] as TechNode[] }
  };

  Object.values(TECH_TREE).forEach(tech => {
    branches[tech.branch].techs.push(tech);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-quaternion-darker border-2 border-quaternion-primary rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-quaternion-primary mb-4">QUATERNION TECH TREE</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          {Object.entries(branches).map(([key, branch]) => {
            const Icon = getBranchIcon(key);
            const color = getBranchColor(key);
            
            return (
              <div key={key} className={`border-l-4 border-${color} pl-4`}>
                <h3 className={`text-${color} font-bold mb-3 flex items-center gap-2`}>
                  <Icon className="w-5 h-5" />
                  {branch.name}
                </h3>
                <div className="space-y-2">
                  {branch.techs.map(tech => {
                    const researched = researchedTechs.has(tech.id);
                    const available = canResearch(tech);
                    const locked = !researched && !available;

                    return (
                      <div
                        key={tech.id}
                        className={`bg-quaternion-dark rounded p-3 border ${
                          researched ? 'border-green-500 bg-green-500/10' :
                          available ? `border-${color} hover:bg-${color}/10 cursor-pointer` :
                          'border-gray-600 opacity-50'
                        } transition-all`}
                        onClick={() => available && onResearch(tech.id)}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-bold text-sm">{tech.name}</h4>
                          {researched && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {locked && <Lock className="w-4 h-4 text-gray-500" />}
                        </div>
                        <p className="text-xs text-quaternion-light/60 mb-2">{tech.effects}</p>
                        <div className="flex gap-2 text-xs">
                          {tech.cost.ore && <span className="flex items-center gap-1"><Box className="w-3 h-3" />{tech.cost.ore}</span>}
                          {tech.cost.energy && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{tech.cost.energy}</span>}
                          {tech.cost.biomass && <span className="flex items-center gap-1"><Leaf className="w-3 h-3" />{tech.cost.biomass}</span>}
                          {tech.cost.data && <span className="flex items-center gap-1"><Brain className="w-3 h-3" />{tech.cost.data}</span>}
                        </div>
                      </div>
                    );
                  })}
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
