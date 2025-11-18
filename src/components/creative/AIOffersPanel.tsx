/**
 * AI Offers Panel
 * Displays symbiotic gameplay offers from AI factions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Handshake, X, Check } from 'lucide-react';
import { AIOffer } from '@/ai/creative/SymbioticGameplay';

interface AIOffersPanelProps {
  offers: AIOffer[];
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
}

export const AIOffersPanel = ({ offers, onAccept, onReject }: AIOffersPanelProps) => {
  if (offers.length === 0) return null;

  return (
    <Card className="bg-card/90 border-primary/30 max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Handshake className="w-5 h-5 text-primary" />
          AI Offers
        </CardTitle>
        <CardDescription>
          Symbiotic opportunities from AI factions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {offers.map(offer => (
          <div
            key={offer.id}
            className="p-3 bg-gray-800/50 rounded-lg border border-cyan-400/20"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-cyan-400 mb-1">
                  {offer.type.replace('_', ' ').toUpperCase()}
                </h4>
                <p className="text-xs text-gray-300 mb-2">{offer.terms}</p>
                {offer.resourceOffer && (
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Give: {Object.entries(offer.resourceOffer.give).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>
                    <div>Receive: {Object.entries(offer.resourceOffer.receive).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Duration: {Math.floor(offer.duration / 1000)}s
                  {offer.mutualBenefit && ' • Mutual Benefit'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onAccept(offer.id)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-3 h-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(offer.id)}
                className="flex-1"
              >
                <X className="w-3 h-3 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

