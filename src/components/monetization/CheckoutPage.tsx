// src/components/monetization/CheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY || '');

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const clientSecret = urlParams.get('clientSecret');
  const amount = urlParams.get('amount');
  const type = urlParams.get('type');
  const id = urlParams.get('id');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: localStorage.getItem('username') || 'Player'
            }
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm purchase with backend
        const playerId = localStorage.getItem('playerId') || 'demo_player';
        
        let confirmEndpoint = '';
        if (type === 'cosmetic') {
          confirmEndpoint = '/api/monetization/shop/confirm-cosmetic-purchase';
        } else if (type === 'battle_pass') {
          confirmEndpoint = '/api/monetization/battle-pass/activate';
        } else if (type === 'seasonal_pass') {
          confirmEndpoint = '/api/monetization/seasonal-pass/activate';
        } else if (type === 'coaching') {
          confirmEndpoint = '/api/monetization/coaching/confirm-booking';
        } else if (type === 'tournament') {
          confirmEndpoint = '/api/monetization/tournaments/confirm-entry';
        }

        if (confirmEndpoint) {
          const response = await fetch(confirmEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerId,
              paymentIntentId: paymentIntent.id,
              ...(type === 'battle_pass' && { passType: id }),
              ...(type === 'seasonal_pass' && { season: id }),
              ...(type === 'coaching' && { coachingPackage: id }),
              ...(type === 'tournament' && { tournamentId: id })
            })
          });

          if (response.ok) {
            setSucceeded(true);
            toast.success('Purchase successful!');
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to confirm purchase');
          }
        } else {
          setSucceeded(true);
          toast.success('Payment successful!');
        }

        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  if (succeeded) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground">Your purchase has been confirmed.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Purchase</CardTitle>
        <CardDescription>
          {amount && `Total: $${parseFloat(amount).toFixed(2)}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={!stripe || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amount || '0.00'}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CheckoutPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientSecret = urlParams.get('clientSecret');

  if (!clientSecret) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>Invalid checkout session</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}

