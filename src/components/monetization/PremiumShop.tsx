/**
 * Premium Shop - Unified monetization hub
 * 
 * Features:
 * - Cosmetics
 * - Expansion Packs/DLC
 * - Battle Passes
 * - AI Service Tokens
 * - Subscriptions
 * - Special Bundles
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingBag, 
  Sparkles, 
  Crown, 
  Zap, 
  Gift, 
  Package, 
  CreditCard,
  Brain,
  Gamepad2,
  BookOpen,
  Users,
  TrendingUp,
  Star,
  Timer,
  Lock,
  Check,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CosmeticShop } from './CosmeticShop';
import { BattlePassShop } from './BattlePassShop';

export type ProductCategory = 
  | 'cosmetics'
  | 'expansions'
  | 'battle_pass'
  | 'ai_tokens'
  | 'subscriptions'
  | 'bundles';

export interface ExpansionPack {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'story' | 'gameplay' | 'content' | 'premium';
  features: string[];
  estimatedHours: number;
  preview: string;
  releaseDate: string;
}

export interface AITokenPack {
  id: string;
  name: string;
  description: string;
  price: number;
  tokens: number;
  bonus?: number;
  type: 'narrative' | 'generation' | 'voice' | 'premium';
  features: string[];
}

export interface Subscription {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  savings?: number;
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  items: string[];
  discount: number;
  limitedTime?: boolean;
}

export function PremiumShop() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProductCategory>('cosmetics');
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  
  const [expansions, setExpansions] = useState<ExpansionPack[]>([]);
  const [aiTokens, setAiTokens] = useState<AITokenPack[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);

  useEffect(() => {
    fetchExpansions();
    fetchAITokens();
    fetchSubscriptions();
    fetchBundles();
  }, []);

  const fetchExpansions = async () => {
    try {
      const response = await fetch('/api/monetization/expansions');
      const data = await response.json();
      setExpansions(data.expansions || getDefaultExpansions());
    } catch (error) {
      console.error('Failed to fetch expansions:', error);
      setExpansions(getDefaultExpansions());
    }
  };

  const fetchAITokens = async () => {
    try {
      const response = await fetch('/api/monetization/ai-tokens');
      const data = await response.json();
      setAiTokens(data.packs || getDefaultAITokens());
    } catch (error) {
      console.error('Failed to fetch AI tokens:', error);
      setAiTokens(getDefaultAITokens());
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/monetization/subscriptions');
      const data = await response.json();
      setSubscriptions(data.subscriptions || getDefaultSubscriptions());
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      setSubscriptions(getDefaultSubscriptions());
    }
  };

  const fetchBundles = async () => {
    try {
      const response = await fetch('/api/monetization/bundles');
      const data = await response.json();
      setBundles(data.bundles || getDefaultBundles());
    } catch (error) {
      console.error('Failed to fetch bundles:', error);
      setBundles(getDefaultBundles());
    }
  };

  const handlePurchase = async (
    productId: string,
    productType: string,
    amount: number,
    name: string
  ) => {
    setPurchasing(productId);
    setLoading(true);

    try {
      const playerId = localStorage.getItem('playerId') || 'demo_player';
      
      let endpoint = '';
      switch (productType) {
        case 'expansion':
          endpoint = '/api/monetization/expansions/purchase';
          break;
        case 'ai_token':
          endpoint = '/api/monetization/ai-tokens/purchase';
          break;
        case 'subscription':
          endpoint = '/api/monetization/subscriptions/purchase';
          break;
        case 'bundle':
          endpoint = '/api/monetization/bundles/purchase';
          break;
        default:
          throw new Error('Invalid product type');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          productId,
          productType,
          amount
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to checkout
      window.location.href = `/checkout?clientSecret=${data.clientSecret}&amount=${data.amount}&type=${productType}&id=${productId}&name=${encodeURIComponent(name)}`;
    } catch (error: any) {
      console.error('Failed to initiate purchase:', error);
      toast.error(error.message || 'Failed to initiate purchase');
      setLoading(false);
      setPurchasing(null);
    }
  };

  const getCategoryIcon = (category: ProductCategory) => {
    switch (category) {
      case 'cosmetics':
        return <Sparkles className="w-5 h-5" />;
      case 'expansions':
        return <Package className="w-5 h-5" />;
      case 'battle_pass':
        return <Crown className="w-5 h-5" />;
      case 'ai_tokens':
        return <Brain className="w-5 h-5" />;
      case 'subscriptions':
        return <CreditCard className="w-5 h-5" />;
      case 'bundles':
        return <Gift className="w-5 h-5" />;
    }
  };

  const renderExpansions = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Expansion Packs</h2>
        <p className="text-muted-foreground">
          Expand your game with new stories, content, and features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {expansions.map(expansion => (
          <Card key={expansion.id} className="relative overflow-hidden hover:shadow-lg transition-all">
            {expansion.category === 'premium' && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                <Star className="w-3 h-3 inline mr-1" />
                PREMIUM
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-xl">{expansion.name}</CardTitle>
                <Badge variant="outline">{expansion.category}</Badge>
              </div>
              <CardDescription>{expansion.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold">${expansion.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    {expansion.estimatedHours}+ hours
                  </div>
                  <div className="flex items-center gap-1">
                    <Gamepad2 className="w-4 h-4" />
                    {expansion.features.length} features
                  </div>
                </div>
              </div>

              <ul className="space-y-2 mb-4">
                {expansion.features.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                onClick={() => handlePurchase(expansion.id, 'expansion', expansion.price, expansion.name)}
                disabled={loading || purchasing === expansion.id}
                className="w-full"
                size="lg"
              >
                {purchasing === expansion.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Purchase ${expansion.price.toFixed(2)}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAITokens = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">AI Service Tokens</h2>
        <p className="text-muted-foreground">
          Unlock AI-powered features: narrative generation, voice synthesis, and more
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {aiTokens.map(pack => (
          <Card key={pack.id} className="relative overflow-hidden hover:shadow-lg transition-all">
            {pack.bonus && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                +{pack.bonus} Bonus
              </div>
            )}

            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{pack.name}</CardTitle>
              </div>
              <CardDescription className="text-sm">{pack.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold">${pack.price.toFixed(2)}</span>
                </div>
                <div className="text-2xl font-semibold text-primary mb-2">
                  {pack.tokens + (pack.bonus || 0)} Tokens
                </div>
                {pack.bonus && (
                  <p className="text-sm text-muted-foreground">
                    {pack.tokens} base + {pack.bonus} bonus
                  </p>
                )}
              </div>

              <Badge variant="outline" className="mb-4">
                {pack.type.replace('_', ' ').toUpperCase()}
              </Badge>

              <ul className="space-y-2">
                {pack.features.slice(0, 3).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs">
                    <Zap className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                onClick={() => handlePurchase(pack.id, 'ai_token', pack.price, pack.name)}
                disabled={loading || purchasing === pack.id}
                className="w-full"
              >
                {purchasing === pack.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Buy Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Subscriptions</h2>
        <p className="text-muted-foreground">
          Get unlimited access to premium features with monthly or yearly subscriptions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptions.map(sub => (
          <Card 
            key={sub.id} 
            className={`relative overflow-hidden transition-all hover:shadow-xl ${
              sub.popular ? 'border-2 border-primary scale-105 shadow-lg' : ''
            }`}
          >
            {sub.popular && (
              <>
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-bold rounded-bl-lg">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  POPULAR
                </div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />
              </>
            )}

            <CardHeader>
              <CardTitle className="text-2xl mb-2">{sub.name}</CardTitle>
              <CardDescription>{sub.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold">${sub.price.toFixed(2)}</span>
                  <span className="text-muted-foreground">/{sub.interval}</span>
                </div>
                {sub.savings && (
                  <p className="text-sm text-green-600 font-semibold">
                    Save ${sub.savings.toFixed(2)} vs {sub.interval === 'month' ? 'monthly' : 'yearly'}!
                  </p>
                )}
              </div>

              <ul className="space-y-3">
                {sub.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                onClick={() => handlePurchase(sub.id, 'subscription', sub.price, sub.name)}
                disabled={loading || purchasing === sub.id}
                className="w-full"
                size="lg"
                variant={sub.popular ? 'default' : 'outline'}
              >
                {purchasing === sub.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderBundles = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Special Bundles</h2>
        <p className="text-muted-foreground">
          Get more value with exclusive bundles and limited-time offers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bundles.map(bundle => (
          <Card key={bundle.id} className="relative overflow-hidden border-2 border-primary hover:shadow-xl transition-all">
            {bundle.limitedTime && (
              <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg animate-pulse">
                <Timer className="w-4 h-4 inline mr-1" />
                LIMITED TIME
              </div>
            )}

            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-2xl">{bundle.name}</CardTitle>
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {bundle.discount}% OFF
                </Badge>
              </div>
              <CardDescription>{bundle.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold">${bundle.price.toFixed(2)}</span>
                  <span className="text-xl text-muted-foreground line-through">
                    ${bundle.originalPrice.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-green-600 font-semibold">
                  Save ${(bundle.originalPrice - bundle.price).toFixed(2)}!
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold mb-2">Includes:</p>
                <ul className="space-y-2">
                  {bundle.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Gift className="w-4 h-4 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                onClick={() => handlePurchase(bundle.id, 'bundle', bundle.price, bundle.name)}
                disabled={loading || purchasing === bundle.id}
                className="w-full"
                size="lg"
              >
                {purchasing === bundle.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Get Bundle
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary to-purple-600 rounded-lg">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Premium Shop
              </h1>
              <p className="text-muted-foreground mt-1">
                Unlock exclusive content, features, and premium experiences
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProductCategory)} className="w-full">
          <TabsList className="grid w-full max-w-4xl grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-8">
            <TabsTrigger value="cosmetics" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Cosmetics</span>
            </TabsTrigger>
            <TabsTrigger value="expansions" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Expansions</span>
            </TabsTrigger>
            <TabsTrigger value="battle_pass" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Battle Pass</span>
            </TabsTrigger>
            <TabsTrigger value="ai_tokens" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">AI Tokens</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="bundles" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Bundles</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cosmetics" className="mt-0">
            <CosmeticShop />
          </TabsContent>

          <TabsContent value="expansions" className="mt-0">
            {renderExpansions()}
          </TabsContent>

          <TabsContent value="battle_pass" className="mt-0">
            <BattlePassShop />
          </TabsContent>

          <TabsContent value="ai_tokens" className="mt-0">
            {renderAITokens()}
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-0">
            {renderSubscriptions()}
          </TabsContent>

          <TabsContent value="bundles" className="mt-0">
            {renderBundles()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Default data (fallback when API unavailable)
function getDefaultExpansions(): ExpansionPack[] {
  return [
    {
      id: 'quantum_legacy',
      name: 'Quantum Legacy Expansion',
      description: 'Time-bending strategy with AI-generated narrative branches and multi-generational gameplay',
      price: 14.99,
      category: 'story',
      features: [
        'Dynamic inheritance system',
        'AI-generated ancestors',
        'Time paradox puzzles',
        'Multi-generational tech trees',
        'Personalized consequences'
      ],
      estimatedHours: 20,
      preview: '',
      releaseDate: '2025-02-01'
    },
    {
      id: 'neural_nexus',
      name: 'Neural Nexus: Corporate Warfare',
      description: 'Cyberpunk business strategy with AI-driven market manipulation and ethical dilemmas',
      price: 9.99,
      category: 'gameplay',
      features: [
        'Living digital economy',
        'Ethical dilemma system',
        'Procedural market events',
        'Digital espionage mechanics'
      ],
      estimatedHours: 15,
      preview: '',
      releaseDate: '2025-03-01'
    },
    {
      id: 'aetheria_worlds',
      name: 'Echoes of Aetheria Worlds',
      description: 'AI-generated fantasy worlds with infinite replayability and dynamic NPC relationships',
      price: 5.99,
      category: 'content',
      features: [
        'Infinite world generation',
        'Dynamic NPC relationships',
        'Procedural mythology',
        'Adaptive difficulty'
      ],
      estimatedHours: 30,
      preview: '',
      releaseDate: '2025-04-01'
    }
  ];
}

function getDefaultAITokens(): AITokenPack[] {
  return [
    {
      id: 'narrative_basic',
      name: 'Narrative Tokens',
      description: 'Generate personalized stories and quests',
      price: 2.99,
      tokens: 100,
      bonus: 0,
      type: 'narrative',
      features: [
        'AI-generated quests',
        'Dynamic story branches',
        'Personalized narratives'
      ]
    },
    {
      id: 'narrative_premium',
      name: 'Narrative Premium',
      description: 'Enhanced narrative generation with longer stories',
      price: 7.99,
      tokens: 300,
      bonus: 50,
      type: 'narrative',
      features: [
        'Extended story generation',
        'Complex narrative arcs',
        'Character development'
      ]
    },
    {
      id: 'voice_basic',
      name: 'Voice Synthesis Pack',
      description: 'Generate voice lines for characters and narration',
      price: 4.99,
      tokens: 200,
      type: 'voice',
      features: [
        'Character voices',
        'Narration generation',
        'Multiple voice styles'
      ]
    },
    {
      id: 'generation_mega',
      name: 'Generation Mega Pack',
      description: 'Complete AI generation toolkit for all content types',
      price: 19.99,
      tokens: 1000,
      bonus: 200,
      type: 'premium',
      features: [
        'Narrative generation',
        'Voice synthesis',
        'Content creation',
        'Priority processing'
      ]
    }
  ];
}

function getDefaultSubscriptions(): Subscription[] {
  return [
    {
      id: 'basic_monthly',
      name: 'Basic Monthly',
      description: 'Essential features for casual players',
      price: 9.99,
      interval: 'month',
      features: [
        'Access to premium cosmetics',
        '100 AI tokens/month',
        'Early access to content',
        'Exclusive events'
      ]
    },
    {
      id: 'premium_monthly',
      name: 'Premium Monthly',
      description: 'Full access to all premium features',
      price: 19.99,
      interval: 'month',
      popular: true,
      features: [
        'All expansion packs included',
        'Unlimited AI tokens',
        'Priority support',
        'Exclusive content drops',
        'Beta access to new features',
        'Custom AI personality training'
      ]
    },
    {
      id: 'premium_yearly',
      name: 'Premium Yearly',
      description: 'Best value - save with annual subscription',
      price: 199.99,
      interval: 'year',
      savings: 39.89,
      features: [
        'All expansion packs included',
        'Unlimited AI tokens',
        'Priority support',
        'Exclusive content drops',
        'Beta access to new features',
        'Custom AI personality training',
        '2 months free vs monthly'
      ]
    }
  ];
}

function getDefaultBundles(): Bundle[] {
  return [
    {
      id: 'founder_pack',
      name: 'Founder\'s Pack',
      description: 'Complete package for new players - everything you need to get started',
      price: 49.99,
      originalPrice: 79.99,
      discount: 37,
      items: [
        '3 Expansion Packs',
        'Premium Battle Pass (3 months)',
        '500 AI Tokens',
        '10 Exclusive Cosmetics',
        '1 Month Premium Subscription'
      ],
      limitedTime: true
    },
    {
      id: 'ai_creator_pack',
      name: 'AI Creator Bundle',
      description: 'Everything you need to create with AI-powered tools',
      price: 34.99,
      originalPrice: 54.97,
      discount: 36,
      items: [
        'Narrative Premium Pack',
        'Voice Synthesis Pack',
        'Generation Mega Pack',
        '3 months Premium Subscription'
      ]
    }
  ];
}

