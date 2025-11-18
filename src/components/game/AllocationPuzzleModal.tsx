/**
 * Allocation Puzzle Modal
 * Displays resource allocation puzzles with options
 */

import { useState } from 'react';
import { X, AlertCircle, TrendingUp, Shield, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AllocationPuzzle, AllocationOption } from '@/game/puzzles/AllocationPuzzleManager';
import { ResourceType } from '@/game/ResourceManager';

interface AllocationPuzzleModalProps {
  puzzle: AllocationPuzzle;
  currentResources: Record<ResourceType, number>;
  onSelect: (optionId: string) => void;
  onClose: () => void;
}

export const AllocationPuzzleModal = ({
  puzzle,
  currentResources,
  onSelect,
  onClose
}: AllocationPuzzleModalProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const getOptionIcon = (optionId: string) => {
    switch (optionId) {
      case 'expansion':
        return <TrendingUp className="w-5 h-5" />;
      case 'defense':
        return <Shield className="w-5 h-5" />;
      case 'technology':
        return <Brain className="w-5 h-5" />;
      case 'economy':
        return <Zap className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const canAfford = (option: AllocationOption): boolean => {
    const costs = option.resourceCosts;
    if (costs.ore && (currentResources[ResourceType.ORE] || 0) < costs.ore) return false;
    if (costs.energy && (currentResources[ResourceType.ENERGY] || 0) < costs.energy) return false;
    if (costs.biomass && (currentResources[ResourceType.BIOMASS] || 0) < costs.biomass) return false;
    if (costs.data && (currentResources[ResourceType.DATA] || 0) < costs.data) return false;
    return true;
  };

  const getRiskColor = (riskLevel: number) => {
    if (riskLevel < 0.3) return 'text-green-400';
    if (riskLevel < 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatResourceCost = (costs: any) => {
    const parts: string[] = [];
    if (costs.ore) parts.push(`${costs.ore} Ore`);
    if (costs.energy) parts.push(`${costs.energy} Energy`);
    if (costs.biomass) parts.push(`${costs.biomass} Biomass`);
    if (costs.data) parts.push(`${costs.data} Data`);
    return parts.join(', ');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-cyan-400">
        <DialogHeader>
          <DialogTitle className="text-2xl text-cyan-400 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Resource Allocation Puzzle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scenario Description */}
          <Card className="p-4 bg-gray-800/50 border-cyan-400/30">
            <h3 className="text-lg font-bold text-white mb-2">{puzzle.scenarioDescription}</h3>
            <p className="text-gray-300 text-sm">{puzzle.aiNarrative}</p>
          </Card>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {puzzle.options.map(option => {
              const affordable = canAfford(option);
              const isSelected = selectedOption === option.optionId;

              return (
                <Card
                  key={option.optionId}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-400/10'
                      : affordable
                      ? 'border-gray-700 hover:border-cyan-400/50 bg-gray-800/50'
                      : 'border-gray-800 bg-gray-900/50 opacity-50'
                  }`}
                  onClick={() => affordable && setSelectedOption(option.optionId)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-cyan-400">{getOptionIcon(option.optionId)}</div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white mb-1">{option.optionName}</h4>
                      <p className="text-sm text-gray-300 mb-2">{option.strategicRationale}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Cost: </span>
                      <span className="text-yellow-400 font-mono">
                        {formatResourceCost(option.resourceCosts)}
                      </span>
                    </div>

                    {Object.keys(option.immediateEffects).length > 0 && (
                      <div>
                        <span className="text-gray-400">Immediate: </span>
                        <span className="text-orange-400">
                          {Object.entries(option.immediateEffects)
                            .map(([type, value]) => `${value > 0 ? '+' : ''}${value} ${type}`)
                            .join(', ')}
                        </span>
                      </div>
                    )}

                    {Object.keys(option.longTermEffects).length > 0 && (
                      <div>
                        <span className="text-gray-400">Long-term: </span>
                        <span className="text-green-400">
                          {Object.entries(option.longTermEffects)
                            .map(([type, value]) => `+${value} ${type}/sec`)
                            .join(', ')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-gray-400">Risk: </span>
                      <span className={getRiskColor(option.riskLevel)}>
                        {option.riskLevel < 0.3
                          ? 'Low'
                          : option.riskLevel < 0.6
                          ? 'Medium'
                          : 'High'}
                      </span>
                    </div>
                  </div>

                  {!affordable && (
                    <div className="mt-2 text-xs text-red-400">
                      Insufficient resources
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <Button variant="outline" onClick={onClose} className="border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedOption) {
                  onSelect(selectedOption);
                }
              }}
              disabled={!selectedOption}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


