import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X } from 'lucide-react';

export interface AIOffer {
  id: string;
  type: string;
  title: string;
  description: string;
  benefits: string[];
  costs?: string[];
  onAccept?: () => void;
  onDecline?: () => void;
  // Legacy support
  terms?: string;
}

interface AIOffersPanelProps {
  offers: AIOffer[];
  onAccept?: (offerId: string) => void;
  onDecline?: (offerId: string) => void;
  onReject?: (offerId: string) => void;
}

export function AIOffersPanel({ offers, onAccept, onDecline, onReject }: AIOffersPanelProps) {
  if (offers.length === 0) return null;

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {offers.map((offer) => (
        <Card key={offer.id} className="p-4 bg-purple-900/20 border-purple-500/30">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-purple-200 mb-1">{offer.title}</h4>
              <p className="text-sm text-muted-foreground mb-2">{offer.description}</p>
              
              {offer.benefits && offer.benefits.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-green-400 mb-1">Benefits:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {offer.benefits.map((benefit, idx) => (
                      <li key={idx}>• {benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {offer.costs && offer.costs.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-red-400 mb-1">Costs:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {offer.costs.map((cost, idx) => (
                      <li key={idx}>• {cost}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onAccept?.(offer.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject?.(offer.id) || onDecline?.(offer.id)}
                >
                  <X className="w-3 h-3 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
