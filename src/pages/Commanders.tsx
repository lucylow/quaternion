import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Brain, Zap, Leaf, Box, Swords, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { COMMANDERS } from "@/data/quaternionData";

const Commanders = () => {
  const navigate = useNavigate();

  const commanderIcons: Record<string, typeof Brain> = {
    'CORE': Brain,
    'AUREN': Box,
    'LIRA': Swords,
    'VIREL': Zap,
    'KOR': Brain,
  };

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
              <Brain className="w-8 h-8" />
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
              AI Commanders
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Meet your strategic AI advisors. Each commander has a unique personality, perspective, and approach to the Quaternion.
            </p>
          </div>

          {/* Commanders Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {Object.values(COMMANDERS).map((commander) => {
              const Icon = commanderIcons[commander.id] || Brain;
              return (
                <Card
                  key={commander.id}
                  className="bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon transition-all hover:-translate-y-2 overflow-hidden group"
                  style={{ borderColor: commander.color + '40' }}
                >
                  <div
                    className="h-48 flex items-center justify-center relative"
                    style={{ background: `linear-gradient(135deg, ${commander.color}20, ${commander.color}05)` }}
                  >
                    <Icon className="w-24 h-24" style={{ color: commander.color }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold mb-2" style={{ color: commander.color }}>
                      {commander.name}
                    </h3>
                    <p className="text-secondary font-semibold mb-3 italic">{commander.role}</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      <strong className="text-primary">Focus:</strong> {commander.focus}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      <strong className="text-primary">Personality:</strong> {commander.personality}
                    </p>
                    <div
                      className="border-l-4 pl-4 py-3 italic text-sm"
                      style={{ borderColor: commander.color }}
                    >
                      <MessageCircle className="w-4 h-4 inline mr-2" style={{ color: commander.color }} />
                      "{commander.quote}"
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* How Commanders Work */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-primary mb-6">How AI Commanders Work</h2>
            <Card className="bg-card/70 border-primary/30">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-3 flex items-center gap-2">
                    <Brain className="w-6 h-6" />
                    Strategic Decision Making
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Each commander analyzes the game state using advanced AI algorithms. They consider resource levels,
                    enemy positions, tech progress, and the Quaternion balance to provide strategic recommendations.
                    Commanders make decisions every 50 ticks (~1 per second), balancing speed with thoughtful analysis.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary mb-3 flex items-center gap-2">
                    <MessageCircle className="w-6 h-6" />
                    Dynamic Commentary
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Commanders don't just give orders—they provide context-aware commentary throughout the game. They
                    react to your decisions, warn about resource imbalances, celebrate victories, and offer strategic
                    insights based on their unique perspectives.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary mb-3 flex items-center gap-2">
                    <Zap className="w-6 h-6" />
                    Hybrid AI System
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Commanders use a hybrid AI system combining Large Language Models (LLM) for strategic thinking with
                    deterministic heuristics for reliability. If the LLM fails or produces invalid output, the system
                    automatically falls back to proven strategies, ensuring the game always runs smoothly.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary mb-3 flex items-center gap-2">
                    <Swords className="w-6 h-6" />
                    Personality-Driven Strategy
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Each commander's personality influences their strategic recommendations. CORE focuses on efficiency,
                    AUREN emphasizes ethics, LIRA prioritizes aggression, VIREL values research, and KOR embraces chaos.
                    Learning which commander's advice to follow in different situations is key to mastering the game.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={() => navigate('/quaternion')}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-neon"
            >
              Play with AI Commanders
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Commanders;

