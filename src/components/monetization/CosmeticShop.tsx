// src/components/monetization/CosmeticShop.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Search, Sparkles, Star, Zap, Crown, Gem, Filter, Grid3x3, List, ShoppingCart, TrendingUp, Eye, X, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Cosmetic {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rarity: string;
  preview: string;
  image?: string;
  tags?: string[];
  stats?: Record<string, any>;
}

type SortOption = 'price-asc' | 'price-desc' | 'rarity' | 'name';
type ViewMode = 'grid' | 'list';

// Mock game assets data
const getMockGameAssets = (): Cosmetic[] => [
  // Unit Skins
  {
    id: 'unit-skin-dragon-warrior',
    name: 'Dragon Warrior Skin',
    description: 'Transform your units into legendary dragon warriors with fiery effects and enhanced animations.',
    price: 9.99,
    category: 'unit_skin',
    rarity: 'legendary',
    preview: '🔥',
    tags: ['combat', 'fire', 'legendary'],
    stats: { attackBonus: 5, defenseBonus: 3 }
  },
  {
    id: 'unit-skin-cyber-ninja',
    name: 'Cyber Ninja Skin',
    description: 'High-tech stealth units with neon trails and holographic effects.',
    price: 7.99,
    category: 'unit_skin',
    rarity: 'epic',
    preview: '⚡',
    tags: ['stealth', 'tech', 'speed']
  },
  {
    id: 'unit-skin-nature-guardian',
    name: 'Nature Guardian Skin',
    description: 'Eco-friendly units with plant-based armor and natural particle effects.',
    price: 5.99,
    category: 'unit_skin',
    rarity: 'rare',
    preview: '🌿',
    tags: ['nature', 'defense', 'sustainable']
  },
  {
    id: 'unit-skin-crystal-knight',
    name: 'Crystal Knight Skin',
    description: 'Shimmering crystal armor that reflects light beautifully in battle.',
    price: 4.99,
    category: 'unit_skin',
    rarity: 'uncommon',
    preview: '💎',
    tags: ['armor', 'defense', 'shiny']
  },
  
  // Building Skins
  {
    id: 'building-skin-futuristic-base',
    name: 'Futuristic Base',
    description: 'Sleek sci-fi architecture with holographic displays and energy shields.',
    price: 12.99,
    category: 'building_skin',
    rarity: 'legendary',
    preview: '🏗️',
    tags: ['tech', 'modern', 'defense']
  },
  {
    id: 'building-skin-medieval-castle',
    name: 'Medieval Castle',
    description: 'Classic stone fortress with banners, torches, and defensive walls.',
    price: 8.99,
    category: 'building_skin',
    rarity: 'epic',
    preview: '🏰',
    tags: ['classic', 'defense', 'historical']
  },
  {
    id: 'building-skin-floating-islands',
    name: 'Floating Islands Base',
    description: 'Magical floating platforms connected by energy bridges.',
    price: 6.99,
    category: 'building_skin',
    rarity: 'rare',
    preview: '☁️',
    tags: ['magic', 'unique', 'aerial']
  },
  {
    id: 'building-skin-industrial-complex',
    name: 'Industrial Complex',
    description: 'Heavy machinery and factories with smoke effects and conveyor belts.',
    price: 5.99,
    category: 'building_skin',
    rarity: 'uncommon',
    preview: '🏭',
    tags: ['production', 'industrial', 'efficiency']
  },
  
  // Map Themes
  {
    id: 'map-theme-neon-city',
    name: 'Neon City Theme',
    description: 'Cyberpunk cityscape with neon lights, rain effects, and urban atmosphere.',
    price: 14.99,
    category: 'map_theme',
    rarity: 'legendary',
    preview: '🌃',
    tags: ['cyberpunk', 'night', 'urban']
  },
  {
    id: 'map-theme-lush-jungle',
    name: 'Lush Jungle Theme',
    description: 'Dense tropical jungle with dynamic weather and wildlife animations.',
    price: 9.99,
    category: 'map_theme',
    rarity: 'epic',
    preview: '🌴',
    tags: ['nature', 'tropical', 'wildlife']
  },
  {
    id: 'map-theme-arctic-tundra',
    name: 'Arctic Tundra Theme',
    description: 'Frozen wasteland with snow effects, aurora borealis, and ice formations.',
    price: 7.99,
    category: 'map_theme',
    rarity: 'rare',
    preview: '❄️',
    tags: ['snow', 'cold', 'aurora']
  },
  {
    id: 'map-theme-desert-oasis',
    name: 'Desert Oasis Theme',
    description: 'Sandy dunes with mirages, oasis effects, and heat distortion.',
    price: 6.99,
    category: 'map_theme',
    rarity: 'uncommon',
    preview: '🏜️',
    tags: ['desert', 'heat', 'oasis']
  },
  
  // UI Cosmetics
  {
    id: 'ui-cosmetic-golden-interface',
    name: 'Golden Interface Pack',
    description: 'Luxurious gold-themed UI with elegant animations and premium effects.',
    price: 11.99,
    category: 'ui_cosmetic',
    rarity: 'legendary',
    preview: '✨',
    tags: ['premium', 'gold', 'elegant']
  },
  {
    id: 'ui-cosmetic-dark-mode-pro',
    name: 'Dark Mode Pro',
    description: 'Professional dark theme with customizable accent colors and smooth transitions.',
    price: 4.99,
    category: 'ui_cosmetic',
    rarity: 'epic',
    preview: '🌙',
    tags: ['dark', 'customizable', 'modern']
  },
  {
    id: 'ui-cosmetic-minimalist',
    name: 'Minimalist UI',
    description: 'Clean, simple interface with reduced clutter and focus on gameplay.',
    price: 3.99,
    category: 'ui_cosmetic',
    rarity: 'rare',
    preview: '📐',
    tags: ['clean', 'simple', 'focused']
  },
  
  // Victory Effects
  {
    id: 'victory-effect-fireworks',
    name: 'Fireworks Victory',
    description: 'Celebrate victories with spectacular fireworks displays and confetti.',
    price: 8.99,
    category: 'victory_effect',
    rarity: 'epic',
    preview: '🎆',
    tags: ['celebration', 'colorful', 'festive']
  },
  {
    id: 'victory-effect-rainbow-burst',
    name: 'Rainbow Burst',
    description: 'Vibrant rainbow explosion with prismatic light effects.',
    price: 6.99,
    category: 'victory_effect',
    rarity: 'rare',
    preview: '🌈',
    tags: ['colorful', 'bright', 'prismatic']
  },
  {
    id: 'victory-effect-golden-shower',
    name: 'Golden Shower',
    description: 'Shower of golden particles and coins raining down on victory.',
    price: 5.99,
    category: 'victory_effect',
    rarity: 'uncommon',
    preview: '💰',
    tags: ['gold', 'coins', 'wealth']
  },
  
  // Voice Packs
  {
    id: 'voice-pack-robot-commander',
    name: 'Robot Commander Voice',
    description: 'AI-powered robotic voice with mechanical sound effects.',
    price: 9.99,
    category: 'voice_pack',
    rarity: 'epic',
    preview: '🤖',
    tags: ['robot', 'tech', 'mechanical']
  },
  {
    id: 'voice-pack-epic-narrator',
    name: 'Epic Narrator Voice',
    description: 'Cinematic narrator voice for dramatic gameplay moments.',
    price: 7.99,
    category: 'voice_pack',
    rarity: 'rare',
    preview: '🎬',
    tags: ['narrative', 'cinematic', 'dramatic']
  },
  {
    id: 'voice-pack-comedy-announcer',
    name: 'Comedy Announcer',
    description: 'Lighthearted and humorous voice pack with funny quips.',
    price: 5.99,
    category: 'voice_pack',
    rarity: 'uncommon',
    preview: '😄',
    tags: ['funny', 'lighthearted', 'entertaining']
  },
  
  // Profile Cosmetics
  {
    id: 'profile-cosmetic-legendary-badge',
    name: 'Legendary Player Badge',
    description: 'Exclusive badge that shows your elite status in the community.',
    price: 19.99,
    category: 'profile_cosmetic',
    rarity: 'legendary',
    preview: '👑',
    tags: ['exclusive', 'status', 'premium']
  },
  {
    id: 'profile-cosmetic-animated-avatar',
    name: 'Animated Avatar Frame',
    description: 'Dynamic avatar frame with particle effects and animations.',
    price: 6.99,
    category: 'profile_cosmetic',
    rarity: 'epic',
    preview: '🖼️',
    tags: ['animated', 'customizable', 'dynamic']
  },
  {
    id: 'profile-cosmetic-title-pack',
    name: 'Elite Titles Pack',
    description: 'Collection of prestigious titles to display on your profile.',
    price: 4.99,
    category: 'profile_cosmetic',
    rarity: 'rare',
    preview: '📜',
    tags: ['titles', 'prestige', 'collection']
  }
];

export function CosmeticShop() {
  const navigate = useNavigate();
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCosmetic, setSelectedCosmetic] = useState<Cosmetic | null>(null);
  const [cart, setCart] = useState<Cosmetic[]>([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchCosmetics();
  }, []);

  const fetchCosmetics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/monetization/shop/cosmetics');
      const data = await response.json();
      const fetchedCosmetics = data.cosmetics || [];
      
      // Use mock data if API returns empty or fails
      if (fetchedCosmetics.length === 0) {
        setCosmetics(getMockGameAssets());
      } else {
        setCosmetics(fetchedCosmetics);
      }
    } catch (error) {
      console.error('Failed to fetch cosmetics:', error);
      // Use mock data as fallback
      setCosmetics(getMockGameAssets());
      toast.info('Using mock game assets (API unavailable)');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (cosmetic: Cosmetic) => {
    if (!cart.find(item => item.id === cosmetic.id)) {
      setCart([...cart, cosmetic]);
      toast.success(`${cosmetic.name} added to cart`);
    } else {
      toast.info(`${cosmetic.name} is already in your cart`);
    }
  };

  const removeFromCart = (cosmeticId: string) => {
    setCart(cart.filter(item => item.id !== cosmeticId));
    toast.success('Item removed from cart');
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price, 0);
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
      navigate(`/checkout?clientSecret=${data.clientSecret}&amount=${data.amount}&type=cosmetic&id=${cosmetic.id}&name=${encodeURIComponent(cosmetic.name)}`);
    } catch (error: any) {
      console.error('Failed to initiate purchase:', error);
      toast.error(error.message || 'Failed to initiate purchase');
      setLoading(false);
      setPurchasing(null);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      const playerId = localStorage.getItem('playerId') || 'demo_player';
      
      // For now, checkout first item. In production, you'd create a combined payment intent
      const firstItem = cart[0];
      await handlePurchase(firstItem);
      
      // Remove purchased item from cart
      setCart(cart.slice(1));
    } catch (error: any) {
      console.error('Checkout failed:', error);
    }
  };

  const getRarityConfig = (rarity: string) => {
    const configs: Record<string, { color: string; gradient: string; icon: React.ReactNode; glow: string }> = {
      legendary: {
        color: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600',
        gradient: 'from-yellow-500 via-orange-500 to-yellow-600',
        icon: <Crown className="w-3 h-3" />,
        glow: 'shadow-[0_0_20px_rgba(251,191,36,0.5)]'
      },
      epic: {
        color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600',
        gradient: 'from-purple-500 via-pink-500 to-purple-600',
        icon: <Gem className="w-3 h-3" />,
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]'
      },
      rare: {
        color: 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600',
        gradient: 'from-blue-500 via-cyan-500 to-blue-600',
        icon: <Star className="w-3 h-3" />,
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]'
      },
      uncommon: {
        color: 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600',
        gradient: 'from-green-500 via-emerald-500 to-green-600',
        icon: <Zap className="w-3 h-3" />,
        glow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]'
      }
    };
    return configs[rarity] || {
      color: 'bg-gray-500',
      gradient: 'from-gray-500 to-gray-600',
      icon: <Sparkles className="w-3 h-3" />,
      glow: ''
    };
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      unit_skin: <Zap className="w-4 h-4" />,
      building_skin: <Grid3x3 className="w-4 h-4" />,
      profile_cosmetic: <Star className="w-4 h-4" />,
      ui_cosmetic: <Sparkles className="w-4 h-4" />,
      victory_effect: <Crown className="w-4 h-4" />,
      voice_pack: <Gem className="w-4 h-4" />,
      map_theme: <Grid3x3 className="w-4 h-4" />
    };
    return icons[category] || <Sparkles className="w-4 h-4" />;
  };

  const categories = useMemo(() => {
    const cats = new Set(cosmetics.map(c => c.category));
    return Array.from(cats);
  }, [cosmetics]);

  const filteredAndSortedCosmetics = useMemo(() => {
    let filtered = [...cosmetics];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Rarity filter
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(c => c.rarity === selectedRarity);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity': {
          const rarityOrder: Record<string, number> = {
            legendary: 4,
            epic: 3,
            rare: 2,
            uncommon: 1,
            common: 0
          };
          return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [cosmetics, searchQuery, selectedCategory, selectedRarity, sortBy]);

  const featuredCosmetics = useMemo(() => {
    return cosmetics.filter(c => c.rarity === 'legendary' || c.rarity === 'epic').slice(0, 3);
  }, [cosmetics]);

  if (loading && cosmetics.length === 0) {
    return (
      <div className="container mx-auto p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading cosmetics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">
              Game Assets Shop
            </h1>
            <p className="text-muted-foreground">Customize your experience with exclusive game assets and cosmetics</p>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowCart(true)}
                className="relative"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({cart.length})
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                  {cart.length}
                </Badge>
              </Button>
            )}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Section */}
        {featuredCosmetics.length > 0 && (
          <div className="mb-8 p-6 rounded-lg border bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Featured Items</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredCosmetics.map(cosmetic => {
                const rarityConfig = getRarityConfig(cosmetic.rarity);
                return (
                  <Card key={cosmetic.id} className={cn("overflow-hidden border-2 transition-all hover:scale-105", rarityConfig.glow)}>
                <CardHeader className="p-0 relative group">
                  <div className={cn("aspect-video rounded-t-lg flex items-center justify-center relative overflow-hidden cursor-pointer", rarityConfig.color)}
                    onClick={() => setSelectedCosmetic(cosmetic)}
                  >
                    {cosmetic.image ? (
                      <img 
                        src={cosmetic.image} 
                        alt={cosmetic.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="relative z-10 text-white text-4xl font-bold">
                          {cosmetic.preview || cosmetic.name[0]}
                        </div>
                      </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Badge className={cn("absolute top-2 right-2", rarityConfig.color, "text-white border-0")}>
                      {rarityConfig.icon}
                      <span className="ml-1 capitalize">{cosmetic.rarity}</span>
                    </Badge>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="text-lg mb-1">{cosmetic.name}</CardTitle>
                      <CardDescription className="text-sm line-clamp-2">{cosmetic.description}</CardDescription>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-2xl font-bold">${cosmetic.price.toFixed(2)}</span>
                        <Button size="sm" onClick={() => handlePurchase(cosmetic)}>
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Buy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search cosmetics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRarity} onValueChange={setSelectedRarity}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              <SelectItem value="legendary">Legendary</SelectItem>
              <SelectItem value="epic">Epic</SelectItem>
              <SelectItem value="rare">Rare</SelectItem>
              <SelectItem value="uncommon">Uncommon</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rarity">Rarity</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {filteredAndSortedCosmetics.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-2xl font-bold mb-2">No cosmetics found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your filters</p>
          <Button onClick={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setSelectedRarity('all');
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        )}>
          {filteredAndSortedCosmetics.map(cosmetic => {
            const rarityConfig = getRarityConfig(cosmetic.rarity);
            
            if (viewMode === 'list') {
              return (
                <Card key={cosmetic.id} className="overflow-hidden hover:shadow-lg transition-all">
                  <div className="flex flex-col md:flex-row">
                    <div 
                      className={cn("w-full md:w-48 aspect-video md:aspect-auto flex items-center justify-center relative cursor-pointer group", rarityConfig.color)}
                      onClick={() => setSelectedCosmetic(cosmetic)}
                    >
                      {cosmetic.image ? (
                        <img 
                          src={cosmetic.image} 
                          alt={cosmetic.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-black/20" />
                          <div className="relative z-10 text-white text-3xl font-bold">
                            {cosmetic.preview || cosmetic.name[0]}
                          </div>
                        </>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getCategoryIcon(cosmetic.category)}
                            <CardTitle className="text-xl">{cosmetic.name}</CardTitle>
                          </div>
                          <CardDescription>{cosmetic.description}</CardDescription>
                        </div>
                        <Badge className={cn(rarityConfig.color, "text-white border-0")}>
                          {rarityConfig.icon}
                          <span className="ml-1 capitalize">{cosmetic.rarity}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Category: {cosmetic.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <span className="text-3xl font-bold">${cosmetic.price.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => addToCart(cosmetic)}
                            disabled={cart.some(item => item.id === cosmetic.id)}
                            size="lg"
                            className="gap-2"
                          >
                            {cart.some(item => item.id === cosmetic.id) ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                In Cart
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                Add to Cart
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handlePurchase(cosmetic)}
                            disabled={loading || purchasing === cosmetic.id}
                            size="lg"
                            className="gap-2"
                          >
                            {purchasing === cosmetic.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Buy Now
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            }

            return (
              <Card 
                key={cosmetic.id} 
                className={cn(
                  "overflow-hidden transition-all hover:shadow-xl hover:scale-105 group",
                  rarityConfig.glow
                )}
              >
                <CardHeader className="p-0">
                  <div className={cn("aspect-video rounded-t-lg flex items-center justify-center relative overflow-hidden", rarityConfig.color)}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="relative z-10 text-white text-4xl font-bold group-hover:scale-110 transition-transform">
                      {cosmetic.preview || cosmetic.name[0]}
                    </div>
                    <Badge className={cn("absolute top-2 right-2", rarityConfig.color, "text-white border-0")}>
                      {rarityConfig.icon}
                      <span className="ml-1 capitalize">{cosmetic.rarity}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(cosmetic.category)}
                    <CardTitle className="text-lg">{cosmetic.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm line-clamp-2 mb-3">
                    {cosmetic.description}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mb-3">
                    {cosmetic.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between items-center p-4 pt-0 gap-2">
                  <span className="text-2xl font-bold">${cosmetic.price.toFixed(2)}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToCart(cosmetic)}
                      disabled={cart.some(item => item.id === cosmetic.id)}
                      className="gap-1"
                    >
                      {cart.some(item => item.id === cosmetic.id) ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          In Cart
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Add
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handlePurchase(cosmetic)}
                      disabled={loading || purchasing === cosmetic.id}
                      className="gap-2"
                      size="sm"
                    >
                      {purchasing === cosmetic.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          Buy Now
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Results count */}
      {filteredAndSortedCosmetics.length > 0 && (
        <div className="mt-8 text-center text-muted-foreground">
          Showing {filteredAndSortedCosmetics.length} of {cosmetics.length} cosmetics
        </div>
      )}

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart ({cart.length})
            </DialogTitle>
            <DialogDescription>
              Review your items before checkout
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <>
                {cart.map((item) => {
                  const rarityConfig = getRarityConfig(item.rarity);
                  return (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="flex gap-4 p-4">
                        <div className={cn("w-24 h-24 rounded-lg flex items-center justify-center relative flex-shrink-0", rarityConfig.color)}>
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="text-white text-2xl font-bold">
                              {item.preview || item.name[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                              <Badge className={cn("mt-2", rarityConfig.color, "text-white border-0")}>
                                {rarityConfig.icon}
                                <span className="ml-1 capitalize">{item.rarity}</span>
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.id)}
                              className="flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xl font-bold">${item.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary text-xl">${getCartTotal().toFixed(2)}</span>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    className="w-full"
                    size="lg"
                    disabled={cart.length === 0}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Proceed to Checkout
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedCosmetic} onOpenChange={(open) => !open && setSelectedCosmetic(null)}>
        {selectedCosmetic && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getCategoryIcon(selectedCosmetic.category)}
                {selectedCosmetic.name}
              </DialogTitle>
              <DialogDescription>{selectedCosmetic.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className={cn("aspect-video rounded-lg flex items-center justify-center relative overflow-hidden", getRarityConfig(selectedCosmetic.rarity).color)}>
                {selectedCosmetic.image ? (
                  <img 
                    src={selectedCosmetic.image} 
                    alt={selectedCosmetic.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative z-10 text-white text-6xl font-bold">
                      {selectedCosmetic.preview || selectedCosmetic.name[0]}
                    </div>
                  </>
                )}
                <Badge className={cn("absolute top-4 right-4", getRarityConfig(selectedCosmetic.rarity).color, "text-white border-0 text-base px-3 py-1")}>
                  {getRarityConfig(selectedCosmetic.rarity).icon}
                  <span className="ml-2 capitalize">{selectedCosmetic.rarity}</span>
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p className="font-semibold">{selectedCosmetic.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rarity</p>
                  <Badge className={cn(getRarityConfig(selectedCosmetic.rarity).color, "text-white border-0")}>
                    {getRarityConfig(selectedCosmetic.rarity).icon}
                    <span className="ml-1 capitalize">{selectedCosmetic.rarity}</span>
                  </Badge>
                </div>
              </div>

              {selectedCosmetic.tags && selectedCosmetic.tags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCosmetic.tags.map((tag, idx) => (
                      <Badge key={`${selectedCosmetic.id}-tag-${idx}-${tag}`} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
                  <p className="text-3xl font-bold">${selectedCosmetic.price.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      addToCart(selectedCosmetic);
                      setSelectedCosmetic(null);
                    }}
                    disabled={cart.some(item => item.id === selectedCosmetic.id)}
                    size="lg"
                    className="gap-2"
                  >
                    {cart.some(item => item.id === selectedCosmetic.id) ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        In Cart
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      handlePurchase(selectedCosmetic);
                      setSelectedCosmetic(null);
                    }}
                    disabled={loading || purchasing === selectedCosmetic.id}
                    size="lg"
                    className="gap-2"
                  >
                    {purchasing === selectedCosmetic.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        Buy Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
