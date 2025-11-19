import { Button } from '@/components/ui/button';
import { TECH_TREE, TechNode } from '@/data/quaternionData';
import { Box, Zap, Leaf, Brain, Lock, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { InteractionAudio } from '@/audio/InteractionAudio';

interface TechTreeModalProps {
  researchedTechs: Set<string>;
  resources: { matter: number; energy: number; life: number; knowledge: number };
  onResearch: (techId: string) => void;
  onClose: () => void;
}

export const TechTreeModal = ({ researchedTechs, resources, onResearch, onClose }: TechTreeModalProps) => {
  const [interactionAudio, setInteractionAudio] = useState<InteractionAudio | null>(null);

  useEffect(() => {
    const initAudio = async () => {
      try {
        const audio = InteractionAudio.instance();
        await audio.init();
        setInteractionAudio(audio);
      } catch (error) {
        console.warn('Failed to initialize interaction audio:', error);
      }
    };
    initAudio();
  }, []);
  const canResearch = (tech: TechNode) => {
    if (researchedTechs.has(tech.id)) return false;
    
    const hasPrereqs = tech.prerequisites.every(prereq => researchedTechs.has(prereq));
    if (!hasPrereqs) return false;

    return (
      (!tech.cost.matter || resources.matter >= tech.cost.matter) &&
      (!tech.cost.energy || resources.energy >= tech.cost.energy) &&
      (!tech.cost.life || resources.life >= tech.cost.life) &&
      (!tech.cost.knowledge || resources.knowledge >= tech.cost.knowledge)
    );
  };

  const getBranchColor = (branch: string) => {
    switch (branch) {
      case 'matter': return 'blue-400';
      case 'energy': return 'yellow-400';
      case 'life': return 'green-400';
      case 'knowledge': return 'purple-400';
      default: return 'cyan-400';
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-gray-800 border-2 border-cyan-400 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">QUATERNION TECH TREE</h2>
        
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
                        className={`bg-gray-700 rounded p-3 border ${
                          researched ? 'border-green-500 bg-green-500/10' :
                          available ? `border-${color} hover:bg-${color}/10 cursor-pointer` :
                          'border-gray-600 opacity-50 cursor-not-allowed'
                        } transition-all`}
                        onClick={() => {
                          if (available) {
                            interactionAudio?.play('research', { volume: 0.7 });
                            onResearch(tech.id);
                          } else if (!researched) {
                            interactionAudio?.play('error', { volume: 0.3 });
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-bold text-sm text-white">{tech.name}</h4>
                          {researched && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {locked && <Lock className="w-4 h-4 text-gray-500" />}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{tech.effects}</p>
                        <p className="text-xs text-gray-500 mb-2">{tech.description}</p>
                        <div className="flex gap-2 text-xs flex-wrap">
                          {tech.cost.matter && (
                            <span className="flex items-center gap-1 text-blue-400">
                              <Box className="w-3 h-3" />{tech.cost.matter}
                            </span>
                          )}
                          {tech.cost.energy && (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <Zap className="w-3 h-3" />{tech.cost.energy}
                            </span>
                          )}
                          {tech.cost.life && (
                            <span className="flex items-center gap-1 text-green-400">
                              <Leaf className="w-3 h-3" />{tech.cost.life}
                            </span>
                          )}
                          {tech.cost.knowledge && (
                            <span className="flex items-center gap-1 text-purple-400">
                              <Brain className="w-3 h-3" />{tech.cost.knowledge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Research time: {tech.researchTime}s
                        </div>
                      </div>
                    );
                  })}
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
          className="w-full"
        >
          Close
        </Button>
      </div>
    </div>
  );
};
