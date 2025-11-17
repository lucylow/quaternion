// src/components/monetization/BattlePassShop.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

interface BattlePass {
  id: string;
  name: string;
  price: number;
  duration: string;
  rewards: number;
  description: string;
  benefits: string[];
}

export function BattlePassShop() {
  const [passes, setPasses] = useState<BattlePass[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchBattlePasses();
  }, []);

  const fetchBattlePasses = async () => {
    try {
      const response = await fetch('/api/monetization/battle-pass');
      const data = await response.json();
      setPasses(data.battlePasses || []);
    } catch (error) {
      console.error('Failed to fetch battle passes:', error);
      toast.error('Failed to load battle passes');
    }
  };

  const handlePurchase = async (pass: BattlePass) => {
    setPurchasing(pass.id);
    setLoading(true);

    try {
      const playerId = localStorage.getItem('playerId') || 'demo_player';
      
      const response = await fetch('/api/monetization/battle-pass/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          passType: pass.id
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to checkout
      window.location.href = `/checkout?clientSecret=${data.clientSecret}&amount=${data.amount}&type=battle_pass&id=${pass.id}`;
    } catch (error: any) {
      console.error('Failed to purchase battle pass:', error);
      toast.error(error.message || 'Failed to purchase battle pass');
      setLoading(false);
      setPurchasing(null);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Battle Pass</h1>
      <p className="text-muted-foreground mb-8">
        Unlock exclusive rewards and progress through seasonal content
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {passes.map(pass => (
          <Card 
            key={pass.id} 
            className={`relative overflow-hidden ${
              pass.id === 'premium_pass' ? 'border-2 border-purple-500 scale-105' : ''
            }`}
          >
            {pass.id === 'premium_pass' && (
              <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 text-sm font-bold">
                POPULAR
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{pass.name}</CardTitle>
              <CardDescription>{pass.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-4xl font-bold">${pass.price.toFixed(2)}</span>
                <span className="text-muted-foreground"> / {pass.duration}</span>
              </div>
              <Badge variant="secondary" className="mb-4">
                {pass.rewards} Rewards
              </Badge>
              <ul className="space-y-2">
                {pass.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handlePurchase(pass)}
                disabled={loading || purchasing === pass.id}
                className="w-full"
                variant={pass.id === 'premium_pass' ? 'default' : 'outline'}
              >
                {purchasing === pass.id ? 'Processing...' : 'Purchase'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

