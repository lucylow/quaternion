// usePurchases.tsx
import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.REACT_APP_API_BASE || 'http://localhost:4000';

export function usePurchases() {
  const [loading, setLoading] = useState(false);

  async function createCheckout(itemSku: string, creatorCode?: string) {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId') || 'demo-user-id';
      const r = await fetch(`${API_BASE}/api/shop/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ itemSku, creatorCode })
      });
      const j = await r.json();
      if (j.url) {
        window.location.href = j.url; // redirect to Stripe Checkout
      } else {
        throw new Error(j.error || 'Checkout creation failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function createSubscription(priceId: string) {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId') || 'demo-user-id';
      const r = await fetch(`${API_BASE}/api/subscription/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ priceId })
      });
      const j = await r.json();
      if (j.url) {
        window.location.href = j.url; // redirect to Stripe Checkout
      } else {
        throw new Error(j.error || 'Subscription creation failed');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function getUserEntitlements() {
    try {
      const userId = localStorage.getItem('userId') || 'demo-user-id';
      const r = await fetch(`${API_BASE}/api/user/entitlements`, {
        headers: { 'x-user-id': userId }
      });
      const j = await r.json();
      return j.items || [];
    } catch (error) {
      console.error('Entitlements error:', error);
      return [];
    }
  }

  return { createCheckout, createSubscription, getUserEntitlements, loading };
}

