import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingBag, CheckCircle2, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Mock product data based on URL params or defaults
const getMockProduct = (type: string | null, id: string | null, name: string | null, price: string | null) => {
  // If we have URL params, use them
  if (name && price) {
    return {
      name: decodeURIComponent(name),
      description: 'Premium game asset for your collection',
      price: parseFloat(price),
      type: type || 'cosmetic',
      id: id || 'unknown',
      icon: '✨',
    };
  }

  // Default mock product
  return {
    name: 'Dragon Warrior Skin',
    description: 'Transform your units into legendary dragon warriors with fiery effects and enhanced animations.',
    price: 9.99,
    type: 'cosmetic',
    id: 'unit-skin-dragon-warrior',
    icon: '🔥',
  };
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
  });

  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  const id = urlParams.get('id');
  const name = urlParams.get('name');
  const price = urlParams.get('price') || urlParams.get('amount');

  const product = getMockProduct(type, id, name, price);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setLoading(false);
    setSuccess(true);
    toast.success('Purchase completed successfully!');

    // Redirect after 2 seconds
    setTimeout(() => {
      if (type === 'cosmetic' || product.type === 'cosmetic') {
        navigate('/shop');
      } else if (type === 'battle_pass' || product.type === 'battle_pass') {
        navigate('/battle-pass');
      } else {
        navigate('/');
      }
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-primary/30">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <CheckCircle2 className="h-20 w-20 text-green-500" />
                <div className="absolute inset-0 animate-ping">
                  <CheckCircle2 className="h-20 w-20 text-green-500 opacity-20" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-primary">Purchase Complete!</h2>
              <p className="text-muted-foreground">
                Thank you for your purchase. {product.name} has been added to your account.
              </p>
              <div className="pt-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Redirecting...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-primary/30">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
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

      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Product Summary */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-3xl">{product.icon}</span>
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {product.type === 'cosmetic' ? 'Cosmetic' : product.type === 'battle_pass' ? 'Battle Pass' : 'Asset'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${product.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">${product.price.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Checkout Form */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
                <CardDescription>Enter your payment details to complete the purchase</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Cardholder Name
                    </label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="cardNumber" className="text-sm font-medium">
                      Card Number
                    </label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="expiryDate" className="text-sm font-medium">
                        Expiry Date
                      </label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: formatExpiryDate(e.target.value) })}
                        maxLength={5}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="cvv" className="text-sm font-medium">
                        CVV
                      </label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        type="password"
                        value={formData.cvv}
                        onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>

                  <CardFooter className="px-0 pt-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Complete Purchase
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>

                <div className="mt-4 text-center text-xs text-muted-foreground">
                  <p>🔒 This is a mock checkout page. No real payment will be processed.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
