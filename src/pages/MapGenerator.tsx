import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../frontend/scenes/BootScene';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Map, Sparkles, Zap, Mountain, Snowflake, TreePine, Sun, GitBranch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import '../App.css';

const MapGenerator = () => {
  const navigate = useNavigate();
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) {
      return;
    }

    phaserGameRef.current = new Phaser.Game({
      ...gameConfig,
      parent: gameRef.current || undefined
    });

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  const mapThemes = [
    {
      name: "Fire",
      icon: Zap,
      description: "Lava, volcanic terrain, and scorching heat",
      color: "text-red-400",
      border: "border-red-400/30"
    },
    {
      name: "Ice",
      icon: Snowflake,
      description: "Frozen tundra, glaciers, and crevasses",
      color: "text-blue-400",
      border: "border-blue-400/30"
    },
    {
      name: "Forest",
      icon: TreePine,
      description: "Dense woodland with swamps and groves",
      color: "text-green-400",
      border: "border-green-400/30"
    },
    {
      name: "Desert",
      icon: Sun,
      description: "Sand dunes, canyons, and oasis",
      color: "text-yellow-400",
      border: "border-yellow-400/30"
    },
    {
      name: "Volcanic",
      icon: Mountain,
      description: "Dark basalt, obsidian, and active lava",
      color: "text-orange-400",
      border: "border-orange-400/30"
    }
  ];

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
              <Map className="w-8 h-8" />
              <span>QUATERNION<span className="text-secondary">:</span>NF</span>
            </a>
            <div className="w-24" />
          </div>
        </nav>
      </header>

      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
              Map Generator
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Explore procedurally-generated battlefields and <span className="text-primary font-semibold">unlock new possibilities</span> with AI-powered terrain generation
            </p>
            <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
              Each map is uniquely generated using advanced algorithms, ensuring infinite replayability and strategic variety. Select a theme above to explore different terrain types.
            </p>
          </div>

          {/* Game Container */}
          <section className="mb-16">
            <Card className="bg-card/70 border-primary/30">
              <CardContent className="p-6">
                <div className="game-wrapper">
                  <div id="game-container" ref={gameRef} className="game-container w-full" style={{ minHeight: '600px' }}></div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Map Themes */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              Available Map Themes
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mapThemes.map((theme) => {
                const Icon = theme.icon;
                return (
                  <Card
                    key={theme.name}
                    className={`bg-card/70 ${theme.border} hover:border-primary transition-colors`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className={`w-6 h-6 ${theme.color}`} />
                        <h3 className={`text-xl font-bold ${theme.color}`}>{theme.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{theme.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Features Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6">Procedural Generation Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-3 flex items-center gap-2">
                    <Mountain className="w-6 h-6" />
                    Infinite Variety
                  </h3>
                  <p className="text-muted-foreground">
                    Every map is procedurally generated from a unique seed, ensuring no two battles are ever the same. 
                    This system allows you to <strong className="text-primary">unlock new possibilities</strong> with each playthrough.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-3 flex items-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    Strategic Depth
                  </h3>
                  <p className="text-muted-foreground">
                    Each terrain type offers unique strategic advantages and challenges. Master the art of adaptation 
                    as you explore diverse battlefields that test your tactical skills.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-3 flex items-center gap-2">
                    <Zap className="w-6 h-6" />
                    AI-Powered Generation
                  </h3>
                  <p className="text-muted-foreground">
                    Our advanced procedural generation system uses AI to create balanced, strategic maps with optimal 
                    resource placement and tactical chokepoints.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-3 flex items-center gap-2">
                    <Map className="w-6 h-6" />
                    Replayability
                  </h3>
                  <p className="text-muted-foreground">
                    With infinite map variations, every match feels fresh and exciting. Discover new strategies and 
                    approaches as you adapt to different terrain configurations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* How It Works */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6">How Map Generation Works</h2>
            <Card className="bg-card/70 border-primary/30">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-2">1. Seed Generation</h3>
                    <p className="text-muted-foreground">
                      Each map starts with a unique seed value that determines all aspects of terrain generation. 
                      This ensures reproducibility while maintaining infinite variety.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-2">2. Terrain Placement</h3>
                    <p className="text-muted-foreground">
                      Advanced algorithms place terrain features, resources, and strategic points based on the selected 
                      theme and seed parameters.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-2">3. Balance & Fairness</h3>
                    <p className="text-muted-foreground">
                      The system ensures symmetric start positions and balanced resource distribution, creating fair 
                      competitive environments while maintaining strategic diversity.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-2">4. Strategic Features</h3>
                    <p className="text-muted-foreground">
                      Chokepoints, high ground, and resource clusters are intelligently placed to create engaging 
                      tactical scenarios that <strong className="text-primary">unlock new possibilities</strong> for strategic gameplay.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={() => navigate('/game')}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-neon"
            >
              Start Playing on Generated Maps
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapGenerator;

