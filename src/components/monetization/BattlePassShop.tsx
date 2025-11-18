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

  const getRewardIcon = (rewardType: string) => {
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
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isUnlocked
                            ? isClaimed
                              ? 'bg-green-500'
                              : 'bg-primary'
                            : 'bg-muted'
                        }`}
                      >
                        {isUnlocked ? (
                          isClaimed ? (
                            <Check className="h-6 w-6 text-white" />
                          ) : (
                            getRewardIcon(reward?.reward_type || 'gift')
                          )
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {passes.map((pass, index) => (
          <Card 
            key={pass.id} 
            className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
              pass.id === 'premium_pass' 
                ? 'border-2 border-purple-500/50 shadow-2xl scale-105 bg-gradient-to-br from-purple-950/50 via-background to-pink-950/50' 
                : 'hover:scale-105 hover:border-primary/50 bg-card/50 backdrop-blur-sm'
            }`}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {pass.id === 'premium_pass' && (
              <>
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white px-4 py-2 text-xs font-bold rounded-bl-lg shadow-lg z-10 animate-pulse">
                  <Crown className="h-3.5 w-3.5 inline mr-1" />
                  POPULAR
                </div>
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none" />
              </>
            )}
            
            {pass.id === 'yearly_pass' && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-xs font-bold rounded-bl-lg shadow-lg z-10">
                <Star className="h-3.5 w-3.5 inline mr-1" />
                BEST VALUE
              </div>
            )}
            
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    pass.id === 'premium_pass' 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                      : 'bg-primary/10'
                  }`}>
                    <Crown className={`h-5 w-5 ${
                      pass.id === 'premium_pass' ? 'text-white' : 'text-primary'
                    }`} />
                  </div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {pass.name}
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-base leading-relaxed">{pass.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10">
              <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    ${pass.price.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground text-lg">/ {pass.duration}</span>
                </div>
                {pass.id === 'yearly_pass' && (
                  <p className="text-sm text-green-400 font-semibold flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" />
                    Save ${(19.99 * 4 - 49.99).toFixed(2)} vs monthly passes!
                  </p>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Gift className="h-4 w-4 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-base px-3 py-1.5 font-semibold">
                    {pass.rewards} Exclusive Rewards
                  </Badge>
                </div>
                
                <ul className="space-y-3">
                  {pass.benefits.map((benefit, index) => (
                    <li 
                      key={index} 
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-primary/5 transition-colors"
                    >
                      <div className="mt-0.5 p-1 rounded-full bg-green-500/10">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      </div>
                      <span className="text-sm leading-relaxed text-foreground/90">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            
            <CardFooter className="pt-4 relative z-10">
              <Button
                onClick={() => handlePurchase(pass)}
                disabled={loading || purchasing === pass.id}
                className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
                  pass.id === 'premium_pass' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl' 
                    : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md hover:shadow-lg'
                }`}
                size="lg"
              >
                {purchasing === pass.id ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Purchase Now
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Enhanced Header */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl -z-10" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur-lg opacity-50 animate-pulse" />
                <div className="relative p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <Crown className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Battle Pass
                </h1>
                <p className="text-muted-foreground text-lg">
                  Unlock exclusive rewards and progress through seasonal content
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'shop' | 'progress')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-muted/50 backdrop-blur-sm border border-primary/10">
            <TabsTrigger 
              value="shop" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground transition-all"
            >
              <Gift className="h-4 w-4" />
              Shop
            </TabsTrigger>
            <TabsTrigger 
              value="progress" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="mt-0 animate-in fade-in-50 duration-300">
            {renderShopView()}
          </TabsContent>

          <TabsContent value="progress" className="mt-0 animate-in fade-in-50 duration-300">
            {renderProgressView()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
