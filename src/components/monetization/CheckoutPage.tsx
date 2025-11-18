// src/components/monetization/CheckoutPage.tsx
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY || '');

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
      case 'cosmetic': {
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
      }
      
      case 'battle_pass': {
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
      }
      
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
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-primary/20 shadow-sm">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-primary hover:text-secondary hover:bg-primary/10 transition-all"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              <a href="/" className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-secondary">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <span>QUATERNION<span className="text-secondary">:</span>NF</span>
              </a>
              <div className="w-24" />
            </div>
          </nav>
        </header>

        <div className="pt-32 pb-20 relative z-10">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-2xl overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-primary to-green-500" />
              
              <CardContent className="pt-16 pb-16">
                <div className="flex flex-col items-center justify-center text-center space-y-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/30 rounded-full blur-3xl animate-pulse" />
                    <div className="relative p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-2xl">
                      <CheckCircle2 className="h-16 w-16 text-white" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-500 via-primary to-green-500 bg-clip-text text-transparent">
                      Payment Successful!
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto">
                      Your purchase has been confirmed and is now available in your account.
                    </p>
                  </div>
                  {productInfo && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 rounded-xl border border-primary/20 max-w-md w-full">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
                          <div className="text-white">
                            {getProductIcon(productInfo.type)}
                          </div>
                        </div>
                        <span className="font-bold text-lg text-primary">{productInfo.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">{productInfo.description}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-md">
                    <Button
                      onClick={() => navigate('/')}
                      variant="outline"
                      className="flex-1 h-12"
                      size="lg"
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
                      className="flex-1 h-12 bg-gradient-to-r from-primary via-secondary to-primary hover:opacity-90 shadow-lg"
                      size="lg"
                    >
                      View Purchase
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-6">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Redirecting automatically in a few seconds...</span>
                  </div>
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-primary/20 shadow-sm">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="text-primary hover:text-secondary hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <a href="/" className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-secondary">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span>QUATERNION<span className="text-secondary">:</span>NF</span>
            </a>
            <div className="w-24" />
          </div>
        </nav>
      </header>

      <div className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-3">
              Secure Checkout
            </h1>
            <p className="text-muted-foreground text-lg">Complete your purchase in just a few steps</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-xl sticky top-24 overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
                
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Order Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingProduct ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Loading product details...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 border border-primary/20 hover:border-primary/30 transition-colors">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-secondary shadow-lg">
                          <div className="text-white">
                            {type ? getProductIcon(type) : <Package className="w-6 h-6" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-primary mb-1">{displayName}</h3>
                              {type && (
                                <Badge variant="outline" className="text-xs">
                                  {getProductTypeLabel(type)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {displayDescription}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-primary/10">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-semibold">${displayPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Processing Fee</span>
                          <span className="font-semibold text-green-500">$0.00</span>
                        </div>
                        <div className="pt-3 border-t-2 border-primary/20">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-lg">Total</span>
                            <span className="font-bold text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                              ${displayPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-4 border-t border-primary/10 bg-muted/30">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="p-1 rounded bg-primary/10">
                      <Lock className="w-3 h-3 text-primary" />
                    </div>
                    <span>Secure checkout powered by Stripe</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="p-1 rounded bg-primary/10">
                      <Shield className="w-3 h-3 text-primary" />
                    </div>
                    <span>Your payment information is encrypted</span>
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Payment Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-xl overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
                
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Payment Details</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Complete your purchase securely with your payment method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                      <div>
                        <label className="text-sm font-semibold mb-3 block text-foreground">
                          Card Information
                        </label>
                        <div className="p-5 border-2 border-primary/20 rounded-xl bg-background/80 backdrop-blur-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-lg transition-all">
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
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex gap-1">
                            {['Visa', 'Mastercard', 'Amex', 'Discover'].map((card, i) => (
                              <div key={i} className="px-2 py-1 text-xs bg-muted rounded text-muted-foreground">
                                {card}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive" className="border-2">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription className="font-medium">{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 p-5 rounded-xl border border-primary/20">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-primary/20">
                            <Lock className="w-5 h-5 text-primary flex-shrink-0" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold mb-2 text-foreground">Secure Payment</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Your payment is processed securely by Stripe. We never store your full card details on our servers.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={!stripe || loading || loadingProduct}
                      className="w-full bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground hover:opacity-90 hover:shadow-xl transition-all h-14 text-lg font-bold shadow-lg"
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

                    <div className="flex items-center justify-center gap-8 pt-4 border-t border-primary/10">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="p-1 rounded bg-primary/10">
                          <Shield className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="font-medium">PCI Compliant</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="p-1 rounded bg-primary/10">
                          <Lock className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="font-medium">256-bit SSL</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="p-1 rounded bg-primary/10">
                          <CreditCard className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="font-medium">Secured by Stripe</span>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
                <CardContent className="pt-6">
                  <div className="space-y-6 text-sm">
                    <div className="p-4 rounded-lg bg-muted/50 border border-primary/10">
                      <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Refund Policy
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Digital items are non-refundable unless otherwise stated. If you experience any issues, 
                        please contact our support team.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-primary/10">
                      <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-primary" />
                        Need Help?
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
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
