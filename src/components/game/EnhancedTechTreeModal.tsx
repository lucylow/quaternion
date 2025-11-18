/**
 * Enhanced Tech Tree Modal with Puzzle Features
 * Includes: opportunity cost, sequence preview, advisor recommendations, synergy visualization
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Box, Zap, Leaf, Brain, Lock, CheckCircle, 
  Lightbulb, TrendingUp, Clock, AlertTriangle,
  Sparkles, Target, Info
} from 'lucide-react';
import { TechTreeManager, TechNode, TechCategory } from '@/game/TechTreeManager';
import { TechTreeSolver, PuzzleContext } from '@/game/tech/TechTreeSolver';
import { TechAdvisor, AdvisorResponse } from '@/game/tech/TechAdvisor';
import { SequenceSimulator, SequencePreview } from '@/game/tech/SequenceSimulator';
import { ResourceManager } from '@/game/ResourceManager';

interface EnhancedTechTreeModalProps {
  techManager: TechTreeManager;
  resourceManager: ResourceManager;
  researchedTechs: Set<string>;
  onResearch: (techId: string) => void;
  onClose: () => void;
  gamePhase?: number; // 0-1
  enemyComposition?: {
    hasAir: boolean;
    hasHeavy: boolean;
    hasStealth: boolean;
    unitCount?: number;
  };
}

export const EnhancedTechTreeModal = ({
  techManager,
  resourceManager,
  researchedTechs,
  onResearch,
  onClose,
  gamePhase = 0.3,
  enemyComposition
}: EnhancedTechTreeModalProps) => {
  const [hoveredNode, setHoveredNode] = useState<TechNode | null>(null);
  const [advisorResponse, setAdvisorResponse] = useState<AdvisorResponse | null>(null);
  const [sequencePreview, setSequencePreview] = useState<SequencePreview | null>(null);
  const [showAdvisor, setShowAdvisor] = useState(false);

  // Initialize puzzle systems
  const solver = useMemo(() => {
    return new TechTreeSolver(techManager, resourceManager);
  }, [techManager, resourceManager]);

  const advisor = useMemo(() => {
    return new TechAdvisor(solver, techManager, resourceManager);
  }, [solver, techManager, resourceManager]);

  const simulator = useMemo(() => {
    return new SequenceSimulator(techManager, resourceManager, solver);
  }, [techManager, resourceManager, solver]);

  // Get current resources
  const resources = useMemo(() => {
    const all = resourceManager.getAllResources();
    return {
      ore: all.ore,
      energy: all.energy,
      biomass: all.biomass,
      data: all.data
    };
  }, [resourceManager]);

  // Get available tech nodes
  const availableTech = useMemo(() => {
    return techManager.getAvailableTechNodes();
  }, [techManager]);

  // Generate advisor recommendation
  useEffect(() => {
    const context: PuzzleContext = {
      currentResources: resources,
      researchedTech: Array.from(researchedTechs),
      availableTech,
      gamePhase,
      enemyComposition: enemyComposition || {
        hasAir: false,
        hasHeavy: false,
        hasStealth: false,
        unitCount: 0 as number
      }
    };

    const recommendation = advisor.generateRecommendation(context);
    setAdvisorResponse(recommendation);
  }, [resources, researchedTechs, availableTech, gamePhase, enemyComposition, advisor]);

  // Update sequence preview when hovering
  useEffect(() => {
    if (hoveredNode) {
      const context: PuzzleContext = {
        currentResources: resources,
        researchedTech: Array.from(researchedTechs),
        availableTech,
        gamePhase,
        enemyComposition: enemyComposition || {
          hasAir: false,
          hasHeavy: false,
          hasStealth: false,
          unitCount: 0 as number
        }
      };

      const preview = simulator.previewSequence(hoveredNode, context);
      setSequencePreview(preview);
    } else {
      setSequencePreview(null);
    }
  }, [hoveredNode, resources, researchedTechs, availableTech, gamePhase, simulator]);

  const canResearch = (node: TechNode): boolean => {
    if (node.isResearched) return false;
    if (!node.isAvailable) return false;

    const cost = node.cost;
    return (
      (!cost.ore || resources.ore >= cost.ore) &&
      (!cost.energy || resources.energy >= cost.energy) &&
      (!cost.biomass || resources.biomass >= cost.biomass) &&
      (!cost.data || resources.data >= cost.data)
    );
  };

  const getCategoryColor = (category: TechCategory): string => {
    switch (category) {
      case TechCategory.INFRASTRUCTURE: return 'text-blue-400 border-blue-400';
      case TechCategory.MILITARY: return 'text-red-400 border-red-400';
      case TechCategory.RESEARCH: return 'text-purple-400 border-purple-400';
      case TechCategory.SPECIAL: return 'text-cyan-400 border-cyan-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getCategoryIcon = (category: TechCategory) => {
    switch (category) {
      case TechCategory.INFRASTRUCTURE: return Box;
      case TechCategory.MILITARY: return Target;
      case TechCategory.RESEARCH: return Brain;
      case TechCategory.SPECIAL: return Sparkles;
      default: return Info;
    }
  };

  // Get opportunity cost (what you can't afford if you buy this)
  const getOpportunityCost = (node: TechNode): TechNode[] => {
    const affordable = availableTech.filter(n => 
      n.nodeId !== node.nodeId && canResearch(n)
    );

    // Simulate spending on this node
    const remainingResources = {
      ore: resources.ore - (node.cost.ore || 0),
      energy: resources.energy - (node.cost.energy || 0),
      biomass: resources.biomass - (node.cost.biomass || 0),
      data: resources.data - (node.cost.data || 0)
    };

    // Find what becomes unaffordable
    return affordable.filter(n => {
      const cost = n.cost;
      return (
        (cost.ore && remainingResources.ore < cost.ore) ||
        (cost.energy && remainingResources.energy < cost.energy) ||
        (cost.biomass && remainingResources.biomass < cost.biomass) ||
        (cost.data && remainingResources.data < cost.data)
      );
    });
  };

  const allNodes = techManager.getAllTechNodes();
  const nodesByCategory = useMemo(() => {
    const grouped = new Map<TechCategory, TechNode[]>();
    allNodes.forEach(node => {
      if (!grouped.has(node.category)) {
        grouped.set(node.category, []);
      }
      grouped.get(node.category)!.push(node);
    });
    return grouped;
  }, [allNodes]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border-2 border-cyan-400 rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-cyan-400">TECH TREE PUZZLES</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvisor(!showAdvisor)}
              className="flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              {showAdvisor ? 'Hide' : 'Show'} Advisor
            </Button>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>

        {/* Advisor Recommendation */}
        {showAdvisor && advisorResponse && (
          <Card className="mb-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-300">
                <Lightbulb className="w-5 h-5" />
                AI Advisor Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">
                    {techManager.getTechNode(advisorResponse.recommendation)?.nodeName}
                  </span>
                  <Badge variant="outline" className="text-purple-300">
                    {Math.round(advisorResponse.confidence * 100)}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-gray-300">{advisorResponse.reasoning}</p>
                {advisorResponse.alternativeOptions && advisorResponse.alternativeOptions.length > 0 && (
                  <div className="text-xs text-gray-400 mt-2">
                    Alternatives: {advisorResponse.alternativeOptions.map(id => 
                      techManager.getTechNode(id)?.nodeName
                    ).join(', ')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tech Tree Display */}
          <div className="lg:col-span-2 space-y-4">
            {Array.from(nodesByCategory.entries()).map(([category, nodes]) => {
              const Icon = getCategoryIcon(category);
              const colorClass = getCategoryColor(category);

              return (
                <Card key={category} className="bg-gray-800/50">
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                      {category.charAt(0) + category.slice(1)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {nodes.map(node => {
                        const researched = node.isResearched;
                        const available = canResearch(node);
                        const locked = !researched && !available;
                        const isRecommended = advisorResponse?.recommendation === node.nodeId;

                        return (
                          <div
                            key={node.nodeId}
                            className={`bg-gray-700 rounded p-3 border transition-all cursor-pointer ${
                              researched ? 'border-green-500 bg-green-500/10' :
                              available ? `border-${colorClass.split(' ')[1]} hover:bg-${colorClass.split(' ')[1]}/10 ${isRecommended ? 'ring-2 ring-purple-500' : ''}` :
                              'border-gray-600 opacity-50 cursor-not-allowed'
                            }`}
                            onClick={() => available && onResearch(node.nodeId)}
                            onMouseEnter={() => setHoveredNode(node)}
                            onMouseLeave={() => setHoveredNode(null)}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-white">{node.nodeName}</h4>
                                {isRecommended && (
                                  <Badge variant="outline" className="text-purple-300 border-purple-500">
                                    Recommended
                                  </Badge>
                                )}
                                {node.synergyNodes.length > 0 && (
                                  <Badge variant="outline" className="text-yellow-300 border-yellow-500">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Synergy
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {researched && <CheckCircle className="w-4 h-4 text-green-500" />}
                                {locked && <Lock className="w-4 h-4 text-gray-500" />}
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mb-2">{node.description}</p>
                            
                            {/* Effects */}
                            {node.effects.length > 0 && (
                              <div className="text-xs text-gray-300 mb-2">
                                {node.effects.map((effect, i) => (
                                  <div key={i}>
                                    {effect.target}: {effect.isMultiplicative ? 
                                      `×${effect.value.toFixed(2)}` : 
                                      `${effect.value > 0 ? '+' : ''}${effect.value}`
                                    }
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Cost */}
                            <div className="flex gap-2 text-xs flex-wrap mb-2">
                              {node.cost.ore && (
                                <span className="flex items-center gap-1 text-blue-400">
                                  <Box className="w-3 h-3" />{node.cost.ore}
                                </span>
                              )}
                              {node.cost.energy && (
                                <span className="flex items-center gap-1 text-yellow-400">
                                  <Zap className="w-3 h-3" />{node.cost.energy}
                                </span>
                              )}
                              {node.cost.biomass && (
                                <span className="flex items-center gap-1 text-green-400">
                                  <Leaf className="w-3 h-3" />{node.cost.biomass}
                                </span>
                              )}
                              {node.cost.data && (
                                <span className="flex items-center gap-1 text-purple-400">
                                  <Brain className="w-3 h-3" />{node.cost.data}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {node.researchTime}s
                              {node.urgencyFactor > 0.7 && (
                                <span className="flex items-center gap-1 text-red-400">
                                  <AlertTriangle className="w-3 h-3" />
                                  Urgent
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            {/* Sequence Preview */}
            {hoveredNode && sequencePreview && (
              <Card className="bg-gray-800/50 border-cyan-500">
                <CardHeader>
                  <CardTitle className="text-cyan-300 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Sequence Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-2">2-Turn Projection:</h4>
                    <div className="space-y-1">
                      {sequencePreview.sequence.map((node, i) => (
                        <div key={node.nodeId} className="text-xs text-gray-300">
                          Turn {i + 1}: {node.nodeName}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {sequencePreview.synergyBonus > 0 && (
                    <div className="text-xs text-yellow-300">
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      Synergy Bonus: +{(sequencePreview.synergyBonus * 100).toFixed(0)}%
                    </div>
                  )}

                  <div className="text-xs text-gray-400">
                    Total Time: {sequencePreview.totalTime}s
                  </div>

                  {sequencePreview.projectedEffects.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-white mb-1">Effects:</h5>
                      <div className="text-xs text-gray-300 space-y-1">
                        {sequencePreview.projectedEffects.map((effect, i) => (
                          <div key={i}>• {effect}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Opportunity Cost */}
            {hoveredNode && !hoveredNode.isResearched && canResearch(hoveredNode) && (
              <Card className="bg-gray-800/50 border-orange-500">
                <CardHeader>
                  <CardTitle className="text-orange-300 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Opportunity Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const opportunityCost = getOpportunityCost(hoveredNode);
                    if (opportunityCost.length === 0) {
                      return (
                        <p className="text-xs text-gray-400">
                          No other techs become unaffordable
                        </p>
                      );
                    }
                    return (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 mb-2">
                          If you research this, you cannot afford:
                        </p>
                        {opportunityCost.slice(0, 3).map(node => (
                          <div key={node.nodeId} className="text-xs text-orange-300">
                            • {node.nodeName}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Synergy Info */}
            {hoveredNode && hoveredNode.synergyNodes.length > 0 && (
              <Card className="bg-gray-800/50 border-yellow-500">
                <CardHeader>
                  <CardTitle className="text-yellow-300 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Synergy Cluster
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-400 mb-2">
                    Works well with:
                  </p>
                  <div className="space-y-1">
                    {hoveredNode.synergyNodes.map(synergyId => {
                      const synergyNode = techManager.getTechNode(synergyId);
                      if (!synergyNode) return null;
                      const isResearched = researchedTechs.has(synergyId);
                      return (
                        <div 
                          key={synergyId}
                          className={`text-xs ${isResearched ? 'text-green-300' : 'text-gray-400'}`}
                        >
                          {isResearched ? '✓ ' : '○ '}
                          {synergyNode.nodeName}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


