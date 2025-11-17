/**
 * Black Market Panel
 * Displays risky trade offers
 */

import { AlertTriangle, TrendingUp, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MarketOffer } from '@/game/puzzles/BlackMarketSystem';
import { ResourceType } from '@/game/ResourceManager';

interface BlackMarketPanelProps {
  offers: MarketOffer[];
  currentResources: Record<ResourceType, number>;
  onAccept: (offerId: string) => void;
  onDismiss?: (offerId: string) => void;
}

export const BlackMarketPanel = ({
  offers,
  currentResources,
  onAccept,
  onDismiss
}: BlackMarketPanelProps) => {
  if (offers.length === 0) return null;

  const formatTimeRemaining = (expiresAt: number) => {
    const remaining = Math.max(0, expiresAt - Date.now());
    const seconds = Math.floor(remaining / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatResourceCost = (costs: any) => {
    const parts: string[] = [];
    if (costs.ore) parts.push(`${costs.ore} Ore`);
    if (costs.energy) parts.push(`${costs.energy} Energy`);
    if (costs.biomass) parts.push(`${costs.biomass} Biomass`);
    if (costs.data) parts.push(`${costs.data} Data`);
    return parts.join(', ');
  };

  const formatResourceRewards = (rewards: any) => {
    const parts: string[] = [];
    Object.entries(rewards).forEach(([type, value]) => {
      parts.push(`+${value} ${type}`);
    });
    return parts.join(', ');
  };

  const canAfford = (offer: MarketOffer): boolean => {
    const costs = offer.resourceCosts;
    if (costs.ore && (currentResources[ResourceType.ORE] || 0) < costs.ore) return false;
    if (costs.energy && (currentResources[ResourceType.ENERGY] || 0) < costs.energy) return false;
    if (costs.biomass && (currentResources[ResourceType.BIOMASS] || 0) < costs.biomass) return false;
    if (costs.data && (currentResources[ResourceType.DATA] || 0) < costs.data) return false;
    return true;
  };

  const getRiskIndicator = (riskLevel: number) => {
    if (riskLevel < 0.3) return { color: 'text-green-400', text: 'Low Risk' };
    if (riskLevel < 0.6) return { color: 'text-yellow-400', text: 'Medium Risk' };
    return { color: 'text-red-400', text: 'High Risk' };
  };

  return (
    <div className="absolute bottom-24 right-4 z-30 space-y-2 max-w-sm">
      <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400" />
        <span>Black Market Offers</span>
      </div>

      {offers.map(offer => {
        const affordable = canAfford(offer);
        const risk = getRiskIndicator(offer.riskLevel);
        const timeRemaining = formatTimeRemaining(offer.expiresAt);

        return (
          <Card
            key={offer.offerId}
            className={`p-3 bg-gray-800/95 border-2 ${
              affordable ? 'border-yellow-500/50' : 'border-gray-700/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  <h4 className="text-sm font-bold text-white">{offer.traderPersonality}</h4>
                </div>
                <p className="text-xs text-gray-300 mb-2">{offer.description}</p>

                <div className="space-y-1 text-xs mb-2">
                  <div>
                    <span className="text-gray-400">Cost: </span>
                    <span className="text-red-400">{formatResourceCost(offer.resourceCosts)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Reward: </span>
                    <span className="text-green-400">{formatResourceRewards(offer.resourceRewards)}</span>
                  </div>
                  {offer.nonResourceRewards.attackBoost && (
                    <div>
                      <span className="text-gray-400">Bonus: </span>
                      <span className="text-cyan-400">
                        +{offer.nonResourceRewards.attackBoost}% Attack
                        {offer.nonResourceRewards.duration && ` (${offer.nonResourceRewards.duration}s)`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span className={risk.color}>{risk.text}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{timeRemaining}</span>
                  </div>
                </div>
              </div>

              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  onClick={() => onDismiss(offer.offerId)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            <Button
              onClick={() => onAccept(offer.offerId)}
              disabled={!affordable}
              className={`w-full mt-2 ${
                affordable
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-gray-700 cursor-not-allowed'
              }`}
              size="sm"
            >
              {affordable ? 'Accept Offer' : 'Insufficient Resources'}
            </Button>
          </Card>
        );
      })}
    </div>
  );
};

