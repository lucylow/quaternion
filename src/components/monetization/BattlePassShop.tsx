// src/components/monetization/BattlePassShop.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, 
  Crown, 
  Zap, 
  Gift, 
  Star, 
  TrendingUp, 
  Clock,
  Sparkles,
  Trophy,
  ArrowRight,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';

// Game asset mappings for battle pass rewards
const MONSTER_ASSETS = [
  '/assets/monsters/DALL·E 2024-11-20 16.27.04 - Create a dramatic, horror-themed scene from the celestial-themed game WOOHOO, where the Celestial Monster is attacking all the characters. The monster.webp',
  '/assets/monsters/DALL·E 2024-11-20 16.27.14 - Create an AI-generated image of a Celestial Monster character from a celestial-themed game. The monster is chaotic and otherworldly, with glowing cosm.webp',
  '/assets/monsters/DALL·E 2024-11-20 16.27.15 - Create an AI-generated image of a Celestial Monster character from a celestial-themed game. The monster is chaotic and otherworldly, with glowing cosm.webp',
  '/assets/monsters/DALL·E 2024-11-22 18.35.00 - Design a cinematic, ultra-high-quality sci-fi movie poster for \'Quaternion.\' The composition features a massive, glowing monster emanating the four po.webp',
  '/assets/monsters/DALL·E 2024-11-22 18.36.36 - Create a visually striking and highly detailed sci-fi movie poster for \'Quaternion.\' At the center, a colossal, glowing monster radiates four distinct.webp',
  '/assets/monsters/DALL·E 2024-11-22 18.40.56 - Design a highly cinematic sci-fi movie poster for \'Quaternion,\' featuring a towering monster radiating four distinct powers_ Time (blue), Space (green.webp',
  '/assets/monsters/DALL·E 2024-11-22 18.42.21 - Create a visually striking sci-fi movie poster for \'Quaternion.\' The central focus is a towering, glowing monster radiating four powers_ Time (blue, s.webp',
  '/assets/monsters/DALL·E 2024-11-22 18.44.15 - Design an enhanced sci-fi movie poster for \'Quaternion,\' focusing on the battle between a colossal monster and three futuristic starships. The monster.webp',
  '/assets/monsters/DALL·E 2024-11-22 18.49.09 - Create an original and highly detailed sci-fi illustration of a colossal elemental monster formed from four floating islands, each representing a dist.webp',
  '/assets/monsters/DALL·E 2024-11-22 18.54.19 - Design a breathtaking sci-fi illustration for \'Quaternion_ Defend the Dimensions.\' Depict a massive elemental monster formed from four floating island.webp',
  '/assets/monsters/DALL·E 2024-11-22 19.02.15 - Create a visually striking and highly original sci-fi illustration for \'Quaternion_ Defend the Dimensions.\' Center the image on a colossal monster for.webp',
];

const MAP_ASSETS = [
  '/assets/maps/DALL·E 2024-11-20 16.22.21 - Create a unique 2D and 3D map design for a twilight biome for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature glowing a.webp',
  '/assets/maps/DALL·E 2024-11-20 16.22.24 - Create a unique 2D and 3D map design for an urban battlefield for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature dense.webp',
  '/assets/maps/DALL·E 2024-11-20 16.22.28 - Create a unique 2D and 3D map design for an underwater biome for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature glowin.webp',
  '/assets/maps/DALL·E 2024-11-20 16.22.32 - Create a unique 2D and 3D map design for a mountainous terrain for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature laye.webp',
  '/assets/maps/DALL·E 2024-11-20 16.22.35 - Create a unique 2D and 3D map design for a desert terrain for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature shifting .webp',
  '/assets/maps/DALL·E 2024-11-20 16.22.38 - Create a unique 2D and 3D map design for an icy wasteland for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature slippery .webp',
  '/assets/maps/DALL·E 2024-11-20 16.22.41 - Create a unique 2D and 3D map design for a volcanic terrain for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature glowing.webp',
  '/assets/maps/DALL·E 2024-11-20 16.22.45 - Create a unique 2D and 3D map design for a lush alien jungle for a StarCraft-inspired mobile game titled \'Eclipse Down.\' The map should feature glowin.webp',
];

const COUNTRY_ASSETS = [
  '/assets/countries/DALL·E 2024-11-20 16.24.01 - Create an AI-generated image of a massive Zerg-inspired monster, the Zyrithon, in a VR perspective, destroying the Burj Khalifa in Dubai, UAE. The sce.webp',
  '/assets/countries/DALL·E 2024-11-20 16.24.05 - Create an AI-generated image of a massive Zerg-inspired monster, the Zyrithon, in a VR perspective, destroying the Great Wall of China. The scene shou.webp',
  '/assets/countries/DALL·E 2024-11-20 16.24.07 - Create an AI-generated image of a massive Zerg-inspired monster, the Zyrithon, in a VR perspective, destroying the Statue of Liberty in New York, USA.webp',
  '/assets/countries/DALL·E 2024-11-20 16.24.09 - Create an AI-generated image of a massive Zerg-inspired monster, the Zyrithon, in a VR perspective, destroying the Eiffel Tower in Paris, France. The .webp',
];

// Get asset for reward type and level
const getRewardAsset = (rewardType: string, level: number): string | null => {
  const index = (level - 1) % 20; // Cycle through assets
  
  switch (rewardType) {
    case 'monster':
    case 'cosmetic':
      return MONSTER_ASSETS[index % MONSTER_ASSETS.length];
    case 'map':
    case 'level':
      return MAP_ASSETS[index % MAP_ASSETS.length];
    case 'country':
    case 'location':
      return COUNTRY_ASSETS[index % COUNTRY_ASSETS.length];
    default:
      // Mix of assets for other types
      if (index % 3 === 0) return MONSTER_ASSETS[index % MONSTER_ASSETS.length];
      if (index % 3 === 1) return MAP_ASSETS[index % MAP_ASSETS.length];
      return COUNTRY_ASSETS[index % COUNTRY_ASSETS.length];
  }
};

interface BattlePass {
  id: string;
  name: string;
  price: number;
  duration: string;
  rewards: number;
  description: string;
  benefits: string[];
}

interface BattlePassProgress {
  passType: string;
  currentLevel: number;
  progress: number;
  totalRewards: number;
  rewards: BattlePassReward[];
  expiresAt: string;
}

interface BattlePassReward {
  id: string;
  level: number;
  reward_type: string;
  reward_id: string;
  claimed: boolean;
  claimed_at?: string;
}

export function BattlePassShop() {
  const [passes, setPasses] = useState<BattlePass[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shop' | 'progress'>('shop');
  const [progress, setProgress] = useState<BattlePassProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    fetchBattlePasses();
    fetchProgress();
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

  const fetchProgress = async () => {
    try {
      setLoadingProgress(true);
      const playerId = localStorage.getItem('playerId') || 'demo_player';
      const response = await fetch(`/api/monetization/battle-pass/progress?playerId=${playerId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.progress) {
          setProgress(data.progress);
          setActiveTab('progress');
        }
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoadingProgress(false);
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

  const calculateProgressPercentage = () => {
    if (!progress) return 0;
    const xpPerLevel = 1000;
    const currentLevelXP = progress.progress;
    const totalXPForLevel = xpPerLevel;
    return (currentLevelXP / totalXPForLevel) * 100;
  };

  const getXPForNextLevel = () => {
    if (!progress) return 1000;
    return 1000 - progress.progress;
  };

  const getDaysRemaining = () => {
    if (!progress || !progress.expiresAt) return 0;
    const expires = new Date(progress.expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getRewardIcon = (rewardType: string, level: number = 1) => {
    const asset = getRewardAsset(rewardType, level);
    
    if (asset) {
      return (
        <img 
          src={asset} 
          alt={rewardType}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Fallback to icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              switch (rewardType) {
                case 'cosmetic':
                  parent.innerHTML = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>';
                  break;
                case 'xp_booster':
                  parent.innerHTML = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>';
                  break;
                case 'currency':
                  parent.innerHTML = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>';
                  break;
                default:
                  parent.innerHTML = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2v1m0 0V6a2 2 0 112 2v1m-2 0h.01M12 8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
              }
            }
          }}
        />
      );
    }
    
    // Fallback to icon
    switch (rewardType) {
      case 'cosmetic':
        return <Sparkles className="h-5 w-5" />;
      case 'xp_booster':
        return <Zap className="h-5 w-5" />;
      case 'currency':
        return <Star className="h-5 w-5" />;
      default:
        return <Gift className="h-5 w-5" />;
    }
  };

  const renderProgressView = () => {
    if (loadingProgress) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!progress) {
      return (
        <div className="text-center py-12">
          <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-2xl font-bold mb-2">No Active Battle Pass</h3>
          <p className="text-muted-foreground mb-6">
            Purchase a battle pass to start earning rewards!
          </p>
          <Button onClick={() => setActiveTab('shop')}>
            View Battle Passes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    }

    const daysRemaining = getDaysRemaining();
    const progressPercent = calculateProgressPercentage();
    const xpNeeded = getXPForNextLevel();

    return (
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Level</p>
                  <p className="text-3xl font-bold">{progress.currentLevel}</p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">XP to Next Level</p>
                  <p className="text-3xl font-bold">{xpNeeded}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Days Remaining</p>
                  <p className="text-3xl font-bold">{daysRemaining}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Level {progress.currentLevel} Progress</CardTitle>
              <Badge variant="secondary">
                {progress.progress} / 1000 XP
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercent} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              {xpNeeded} XP needed to reach Level {progress.currentLevel + 1}
            </p>
          </CardContent>
        </Card>

        {/* Rewards Grid */}
        <div>
          <h3 className="text-2xl font-bold mb-4">Rewards</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: Math.min(progress.totalRewards, 30) }, (_, i) => {
              const level = i + 1;
              const reward = progress.rewards.find(r => r.level === level);
              const isUnlocked = level <= progress.currentLevel;
              const isClaimed = reward?.claimed || false;
              const isCurrentLevel = level === progress.currentLevel;

              return (
                <Card
                  key={level}
                  className={`relative overflow-hidden transition-all ${
                    isCurrentLevel
                      ? 'ring-2 ring-primary ring-offset-2 scale-105'
                      : isUnlocked
                      ? 'opacity-100'
                      : 'opacity-50'
                  }`}
                >
                  {isCurrentLevel && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-1 text-xs font-bold rounded-bl">
                      CURRENT
                    </div>
                  )}
                  <CardContent className="pt-6 pb-4">
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          isUnlocked
                            ? isClaimed
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-primary bg-primary/10'
                            : 'border-muted bg-muted/50 grayscale'
                        }`}
                      >
                        {isUnlocked ? (
                          isClaimed ? (
                            <div className="w-full h-full flex items-center justify-center bg-green-500/20">
                              <Check className="h-8 w-8 text-green-600" />
                            </div>
                          ) : (
                            <>
                              {getRewardAsset(reward?.reward_type || 'gift', level) ? (
                                <img 
                                  src={getRewardAsset(reward?.reward_type || 'gift', level)!} 
                                  alt={`Level ${level} reward`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      const icon = getRewardIcon(reward?.reward_type || 'gift', level);
                                      parent.innerHTML = '';
                                      if (typeof icon === 'object' && icon !== null) {
                                        parent.appendChild(icon as any);
                                      }
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {getRewardIcon(reward?.reward_type || 'gift', level)}
                                </div>
                              )}
                            </>
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted/50">
                            <Lock className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold">Level {level}</p>
                        {reward && (
                          <p className="text-xs text-muted-foreground capitalize">
                            {reward.reward_type.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {progress.totalRewards > 30 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              +{progress.totalRewards - 30} more rewards available
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderShopView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {passes.map(pass => (
          <Card 
            key={pass.id} 
            className={`relative overflow-hidden transition-all hover:shadow-lg ${
              pass.id === 'premium_pass' 
                ? 'border-2 border-purple-500 scale-105 shadow-xl' 
                : 'hover:scale-102'
            }`}
          >
            {pass.id === 'premium_pass' && (
              <>
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                  <Crown className="h-4 w-4 inline mr-1" />
                  POPULAR
                </div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
              </>
            )}
            
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">{pass.name}</CardTitle>
                {pass.id === 'yearly_pass' && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500">
                    BEST VALUE
                  </Badge>
                )}
              </div>
              <CardDescription className="text-base">{pass.description}</CardDescription>
            </CardHeader>
            
            {/* Game Asset Preview */}
            <div className="px-6 pb-4">
              <div className="relative h-48 rounded-lg overflow-hidden border border-border/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <div className="absolute inset-0 grid grid-cols-3 gap-1 p-2">
                  {[
                    MONSTER_ASSETS[0],
                    MAP_ASSETS[0],
                    COUNTRY_ASSETS[0],
                  ].map((asset, idx) => (
                    <div key={idx} className="relative overflow-hidden rounded">
                      <img 
                        src={asset} 
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    Exclusive Game Assets Included
                  </Badge>
                </div>
              </div>
            </div>
            
            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold">${pass.price.toFixed(2)}</span>
                  <span className="text-muted-foreground">/ {pass.duration}</span>
                </div>
                {pass.id === 'yearly_pass' && (
                  <p className="text-sm text-green-600 font-semibold">
                    Save ${(19.99 * 4 - 49.99).toFixed(2)} vs monthly passes!
                  </p>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {pass.rewards} Rewards
                  </Badge>
                </div>
                
                <ul className="space-y-3">
                  {pass.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      </div>
                      <span className="text-sm leading-relaxed">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            
            <CardFooter className="pt-4">
              <Button
                onClick={() => handlePurchase(pass)}
                disabled={loading || purchasing === pass.id}
                className="w-full"
                size="lg"
                variant={pass.id === 'premium_pass' ? 'default' : 'outline'}
              >
                {purchasing === pass.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Purchase Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Battle Pass
            </h1>
            <p className="text-muted-foreground mt-1">
              Unlock exclusive rewards and progress through seasonal content
            </p>
          </div>
        </div>
      </div>

      {/* Featured Rewards Preview */}
      <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Featured Rewards
          </CardTitle>
          <CardDescription>
            Exclusive game assets, monsters, maps, and more await you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { asset: MONSTER_ASSETS[0], label: 'Celestial Monster', type: 'Monster' },
              { asset: MAP_ASSETS[0], label: 'Twilight Biome', type: 'Map' },
              { asset: COUNTRY_ASSETS[0], label: 'Dubai Battlefield', type: 'Location' },
              { asset: MONSTER_ASSETS[3], label: 'Quaternion Poster', type: 'Exclusive' },
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="relative h-32 rounded-lg overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors">
                  <img 
                    src={item.asset} 
                    alt={item.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-xs font-semibold text-white">{item.label}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {item.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'shop' | 'progress')} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="shop" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Shop
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="mt-0">
          {renderShopView()}
        </TabsContent>

        <TabsContent value="progress" className="mt-0">
          {renderProgressView()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
