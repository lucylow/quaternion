// ShopButton.tsx
import React, { useState } from 'react';
import { usePurchases } from '@/hooks/usePurchases';

interface ShopButtonProps {
  sku: string;
  name: string;
  price?: number;
  currency?: string;
}

export default function ShopButton({ sku, name, price, currency = 'USD' }: ShopButtonProps) {
  const { createCheckout, loading } = usePurchases();
  const [creatorCode, setCreatorCode] = useState<string>('');

  const handlePurchase = async () => {
    try {
      await createCheckout(sku, creatorCode || undefined);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg">
      <div className="font-semibold">{name}</div>
      {price !== undefined && (
        <div className="text-lg font-bold">
          ${(price / 100).toFixed(2)} {currency}
        </div>
      )}
      <input
        type="text"
        placeholder="Creator code (optional)"
        value={creatorCode}
        onChange={e => setCreatorCode(e.target.value)}
        className="px-3 py-2 border rounded"
      />
      <button
        disabled={loading}
        onClick={handlePurchase}
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Buy'}
      </button>
    </div>
  );
}

