// src/components/monetization/CosmeticShop.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Cosmetic {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rarity: string;
  preview: string;
}

export function CosmeticShop() {
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchCosmetics();
  }, []);

  const fetchCosmetics = async () => {
    try {
      const response = await fetch('/api/monetization/shop/cosmetics');
      const data = await response.json();
      setCosmetics(data.cosmetics || []);
    } catch (error) {
      console.error('Failed to fetch cosmetics:', error);
      toast.error('Failed to load cosmetics');
    }
  };

  const handlePurchase = async (cosmetic: Cosmetic) => {
    setPurchasing(cosmetic.id);
    setLoading(true);

    try {
      const playerId = localStorage.getItem('playerId') || 'demo_player';
      
      const response = await fetch('/api/monetization/shop/purchase-cosmetic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          cosmeticId: cosmetic.id
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to checkout with Stripe
      window.location.href = `/checkout?clientSecret=${data.clientSecret}&amount=${data.amount}&type=cosmetic&id=${cosmetic.id}`;
    } catch (error: any) {
      console.error('Failed to initiate purchase:', error);
      toast.error(error.message || 'Failed to initiate purchase');
      setLoading(false);
      setPurchasing(null);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-yellow-500';
      case 'epic':
        return 'bg-purple-500';
      case 'rare':
        return 'bg-blue-500';
      case 'uncommon':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Cosmetic Shop</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cosmetics.map(cosmetic => (
          <Card key={cosmetic.id} className="overflow-hidden">
            <CardHeader>
              <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">{cosmetic.name[0]}</span>
              </div>
              <div className="flex items-center justify-between">
                <CardTitle>{cosmetic.name}</CardTitle>
                <Badge className={getRarityColor(cosmetic.rarity)}>
                  {cosmetic.rarity}
                </Badge>
              </div>
              <CardDescription>{cosmetic.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Category: {cosmetic.category.replace('_', ' ')}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <span className="text-2xl font-bold">${cosmetic.price.toFixed(2)}</span>
              <Button
                onClick={() => handlePurchase(cosmetic)}
                disabled={loading || purchasing === cosmetic.id}
              >
                {purchasing === cosmetic.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Buy Now'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

