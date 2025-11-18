// src/components/monetization/CheckoutPage.tsx
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Shield, 
  Lock, 
  CreditCard,
  ShoppingBag,
  Sparkles,
  Package,
  Gift,
  Trophy,
  GraduationCap,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface ProductInfo {
  name: string;
  description: string;
  type: string;
  price: number;
}

function getProductIcon(type: string) {
  switch (type) {
    case 'cosmetic':
      return <Sparkles className="w-5 h-5" />;
    case 'battle_pass':
    case 'seasonal_pass':
      return <Trophy className="w-5 h-5" />;
    case 'coaching':
      return <GraduationCap className="w-5 h-5" />;
    case 'tournament':
      return <Users className="w-5 h-5" />;
    default:
      return <Package className="w-5 h-5" />;
  }
}

function getProductTypeLabel(type: string): string {
  switch (type) {
    case 'cosmetic':
      return 'Cosmetic Item';
    case 'battle_pass':
      return 'Battle Pass';
    case 'seasonal_pass':
      return 'Seasonal Pass';
    case 'coaching':
      return 'Coaching Session';
    case 'tournament':
      return 'Tournament Entry';
    default:
      return 'Product';
  }
}

async function fetchProductInfo(type: string, id: string): Promise<ProductInfo | null> {
  try {
    const playerId = localStorage.getItem('playerId') || 'demo_player';
    let endpoint = '';
    
    switch (type) {
      case 'cosmetic':
        endpoint = `/api/monetization/shop/cosmetics`;
        const cosmeticsResponse = await fetch(endpoint);
        const cosmeticsData = await cosmeticsResponse.json();
        const cosmetic = cosmeticsData.cosmetics?.find((c: any) => c.id === id);
        return cosmetic ? {
          name: cosmetic.name,
          description: cosmetic.description,
          type: 'cosmetic',
          price: cosmetic.price
        } : null;
      
      case 'battle_pass':
        endpoint = `/api/monetization/battle-pass/passes`;
        const bpResponse = await fetch(endpoint);
        const bpData = await bpResponse.json();
        const pass = bpData.passes?.find((p: any) => p.id === id);
        return pass ? {
          name: pass.name,
          description: pass.description || 'Battle Pass',
          type: 'battle_pass',
          price: pass.price
        } : null;
      
      default:
        return null;
    }
  } catch (error) {
    console.error('Failed to fetch product info:', error);
    return null;
  }
}

function CheckoutForm() {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const clientSecret = urlParams.get('clientSecret');
  const amount = urlParams.get('amount');
  const type = urlParams.get('type');
  const id = urlParams.get('id');
  const productName = urlParams.get('name');

  useEffect(() => {
    const loadProductInfo = async () => {
      if (type && id) {
        setLoadingProduct(true);
        const info = await fetchProductInfo(type, id);
        setProductInfo(info);
        setLoadingProduct(false);
      } else {
        setLoadingProduct(false);
      }
    };
    loadProductInfo();
  }, [type, id]);

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
              name: localStorage.getItem('username') || 'Player',
              email: localStorage.getItem('email') || undefined
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
              ...(type === 'tournament' && { tournamentId: id }),
              ...(type === 'cosmetic' && { cosmeticId: id })
            })
          });

          if (response.ok) {
            setSucceeded(true);
            toast.success('Purchase successful!');
            setTimeout(() => {
              if (type === 'cosmetic') {
                navigate('/shop');
              } else if (type === 'battle_pass' || type === 'seasonal_pass') {
                navigate('/battle-pass');
              } else {
                navigate('/');
              }
            }, 3000);
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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-primary/30">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-primary hover:text-secondary"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              <a href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
                <ShoppingBag className="w-8 h-8" />
                <span>QUATERNION<span className="text-secondary">:</span>NF</span>
              </a>
              <div className="w-24" />
            </div>
          </nav>
        </header>

        <div className="pt-32 pb-20">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="bg-card/70 border-primary/30">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                    <CheckCircle2 className="relative h-20 w-20 text-green-500 mb-4" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-primary mb-2">Payment Successful!</h2>
                    <p className="text-muted-foreground text-lg">
                      Your purchase has been confirmed and is now available.
                    </p>
                  </div>
                  {productInfo && (
                    <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20 max-w-md">
                      <div className="flex items-center gap-3 mb-2">
                        {getProductIcon(productInfo.type)}
                        <span className="font-semibold text-primary">{productInfo.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{productInfo.description}</p>
                    </div>
                  )}
                  <div className="flex gap-4 mt-8">
                    <Button
                      onClick={() => navigate('/')}
                      variant="outline"
                    >
                      Go to Home
                    </Button>
                    <Button
                      onClick={() => {
                        if (type === 'cosmetic') {
                          navigate('/shop');
                        } else if (type === 'battle_pass') {
                          navigate('/battle-pass');
                        } else {
                          navigate('/');
                        }
                      }}
                      className="bg-gradient-to-r from-primary to-secondary"
                    >
                      View Purchase
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Redirecting automatically in a few seconds...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const displayName = productInfo?.name || productName || 'Item';
  const displayDescription = productInfo?.description || 'Your purchase';
  const displayPrice = productInfo?.price || parseFloat(amount || '0');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-primary/30">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="text-primary hover:text-secondary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <a href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
              <ShoppingBag className="w-8 h-8" />
              <span>QUATERNION<span className="text-secondary">:</span>NF</span>
            </a>
            <div className="w-24" />
          </div>
        </nav>
      </header>

      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-card/70 border-primary/30 sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingProduct ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {type ? getProductIcon(type) : <Package className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1">
                              <h3 className="font-semibold text-primary">{displayName}</h3>
                              {type && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {getProductTypeLabel(type)}
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {displayDescription}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-primary/10">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">${displayPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Processing Fee</span>
                          <span className="font-medium">$0.00</span>
                        </div>
                        <div className="pt-2 border-t border-primary/10">
                          <div className="flex justify-between">
                            <span className="font-semibold text-lg">Total</span>
                            <span className="font-bold text-lg text-primary">
                              ${displayPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2 pt-4 border-t border-primary/10">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Secure checkout powered by Stripe</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>Your payment information is encrypted</span>
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Payment Form */}
            <div className="lg:col-span-2">
              <Card className="bg-card/70 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Details
                  </CardTitle>
                  <CardDescription>
                    Complete your purchase securely with your payment method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Card Information
                        </label>
                        <div className="p-4 border border-primary/20 rounded-lg bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                          <CardElement
                            options={{
                              style: {
                                base: {
                                  fontSize: '16px',
                                  color: 'hsl(var(--foreground))',
                                  fontFamily: 'system-ui, sans-serif',
                                  '::placeholder': {
                                    color: 'hsl(var(--muted-foreground))',
                                  },
                                },
                                invalid: {
                                  color: 'hsl(var(--destructive))',
                                  iconColor: 'hsl(var(--destructive))',
                                },
                              },
                              hidePostalCode: false,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          We accept Visa, Mastercard, American Express, and Discover
                        </p>
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                        <div className="flex items-start gap-3">
                          <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold mb-1">Secure Payment</h4>
                            <p className="text-xs text-muted-foreground">
                              Your payment is processed securely by Stripe. We never store your full card details on our servers.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={!stripe || loading || loadingProduct}
                      className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity h-12 text-lg font-semibold"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-5 w-5" />
                          Pay ${displayPrice.toFixed(2)}
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-6 pt-4 border-t border-primary/10">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Shield className="w-4 h-4" />
                        <span>PCI Compliant</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="w-4 h-4" />
                        <span>256-bit SSL</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CreditCard className="w-4 h-4" />
                        <span>Secured by Stripe</span>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card className="bg-card/70 border-primary/30 mt-6">
                <CardContent className="pt-6">
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Refund Policy</h4>
                      <p>
                        Digital items are non-refundable unless otherwise stated. If you experience any issues, 
                        please contact our support team.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Need Help?</h4>
                      <p>
                        If you have any questions about your purchase, please visit our support center or contact us directly.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const clientSecret = urlParams.get('clientSecret');

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <header className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-primary/30">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-primary hover:text-secondary"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              <a href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
                <ShoppingBag className="w-8 h-8" />
                <span>QUATERNION<span className="text-secondary">:</span>NF</span>
              </a>
              <div className="w-24" />
            </div>
          </nav>
        </header>

        <div className="pt-32 pb-20">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="bg-card/70 border-primary/30">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <XCircle className="h-16 w-16 text-destructive" />
                  <h2 className="text-2xl font-bold text-primary">Invalid Checkout Session</h2>
                  <p className="text-muted-foreground">
                    The checkout session is invalid or has expired. Please start a new purchase.
                  </p>
                  <Button onClick={() => navigate('/shop')} className="mt-4">
                    Go to Shop
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
