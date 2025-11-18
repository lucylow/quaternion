import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Brain, Zap, Leaf, Box, Trophy, GitBranch } from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

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
            <div className="w-24" /> {/* Spacer */}
          </div>
        </nav>
      </header>

      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
              About Quaternion
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A revolutionary AI-powered strategy game where every decision rotates the four dimensions of reality
            </p>
          </div>

          {/* Story Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
              <GitBranch className="w-8 h-8" />
              The Story
            </h2>
            <Card className="bg-card/70 border-primary/30">
              <CardContent className="p-8 space-y-6">
                <p className="text-lg leading-relaxed">
                  In the far future, humanity has discovered the <strong className="text-primary">Quaternion Principle</strong>—a fundamental law
                  governing the four dimensions of existence: <strong className="text-blue-400">Matter</strong>, <strong className="text-yellow-400">Energy</strong>, 
                  <strong className="text-green-400"> Life</strong>, and <strong className="text-purple-400">Knowledge</strong>.
                </p>
                <p className="text-lg leading-relaxed">
                  These dimensions exist in a delicate balance. Any action that shifts one dimension affects the others, creating a complex
                  strategic landscape where every decision has cascading consequences.
                </p>
                <p className="text-lg leading-relaxed">
                  You command an AI-powered faction in this new frontier, where procedurally generated worlds, AI-driven opponents, and
                  dynamic terrain create infinite strategic possibilities. Your goal: master the Quaternion and achieve victory through
                  technological supremacy, territorial control, or perfect equilibrium.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Quaternion Dimensions */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6">The Four Dimensions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/70 border-blue-400/30 hover:border-blue-400 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Box className="w-8 h-8 text-blue-400" />
                    <h3 className="text-2xl font-bold text-blue-400">Matter</h3>
                  </div>
                  <p className="text-muted-foreground">
                    The physical foundation of reality. Matter represents resources, construction, and material wealth.
                    Extract it from nodes, build structures, and create units. Balance is key—too much matter without
                    energy creates stagnation.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-yellow-400/30 hover:border-yellow-400 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-8 h-8 text-yellow-400" />
                    <h3 className="text-2xl font-bold text-yellow-400">Energy</h3>
                  </div>
                  <p className="text-muted-foreground">
                    The force that drives all action. Energy powers your buildings, enables research, and fuels your
                    military. Manage it carefully—excess energy without matter is wasted potential, while too little
                    energy halts all progress.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-green-400/30 hover:border-green-400 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Leaf className="w-8 h-8 text-green-400" />
                    <h3 className="text-2xl font-bold text-green-400">Life</h3>
                  </div>
                  <p className="text-muted-foreground">
                    The biological essence of existence. Life represents growth, sustainability, and the capacity for
                    change. It powers your units, enables biological technologies, and represents the ethical dimension
                    of your choices.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-purple-400/30 hover:border-purple-400 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-8 h-8 text-purple-400" />
                    <h3 className="text-2xl font-bold text-purple-400">Knowledge</h3>
                  </div>
                  <p className="text-muted-foreground">
                    The understanding that unlocks the future. Knowledge drives research, enables advanced technologies,
                    and represents the intellectual dimension. It's the rarest resource, but also the most powerful
                    when properly utilized.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Game Philosophy */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6">Game Philosophy</h2>
            <Card className="bg-card/70 border-primary/30">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-3">Balance Over Dominance</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Unlike traditional RTS games where you maximize one resource, Quaternion rewards players who maintain
                    equilibrium across all four dimensions. The Quaternion Instability meter tracks your balance—let it
                    get too high, and reality itself begins to destabilize.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary mb-3">AI as a Partner</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Your AI commanders aren't just advisors—they're strategic partners with unique personalities. Each
                    commander sees the world differently and will suggest different approaches. Learning to work with
                    their perspectives is key to mastering the game.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary mb-3">Procedural Infinite Replayability</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Every game is unique. Maps are procedurally generated, AI opponents adapt to your playstyle, and
                    the tech tree offers multiple paths to victory. No two games are ever the same.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Chroma Awards */}
          <section className="mb-16">
            <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/50">
              <CardContent className="p-8 text-center">
                <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-primary mb-4">Chroma Awards 2025 Submission</h3>
                <p className="text-muted-foreground mb-6">
                  Quaternion: Neural Frontier is an official submission to the Chroma Awards: AI Film, Music Videos, and Games competition.
                  This project showcases cutting-edge AI integration in game development, featuring LLM-powered strategic AI, procedural
                  generation, and AI-generated content throughout.
                </p>
                <Button
                  onClick={() => window.open('https://chromaawards.devpost.com/', '_blank')}
                  className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                >
                  Learn More About Chroma Awards
                </Button>
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
              Start Playing Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;


