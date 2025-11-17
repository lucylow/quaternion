import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Keyboard, Mouse, Gamepad2, Target, Zap, Box, Leaf, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HowToPlay = () => {
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
            <a 
              href="/" 
              onClick={(e) => { e.preventDefault(); navigate('/'); }} 
              className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Gamepad2 className="w-8 h-8" />
              <span>QUATERNION<span className="text-secondary">:</span>NF</span>
            </a>
            <div className="w-24" />
          </div>
        </nav>
      </header>

      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
              How to Play
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Master the four dimensions and achieve victory through strategy, balance, and AI collaboration
            </p>
          </div>

          {/* Controls */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
              <Keyboard className="w-8 h-8" />
              Controls
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Mouse className="w-6 h-6" />
                    Mouse Controls
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong className="text-primary">Left Click:</strong> Select units</li>
                    <li><strong className="text-primary">Left Click + Drag:</strong> Select multiple units</li>
                    <li><strong className="text-primary">Right Click:</strong> Move selected units</li>
                    <li><strong className="text-primary">Scroll:</strong> Zoom in/out</li>
                    <li><strong className="text-primary">Click Resource Node:</strong> Gather resources</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Keyboard className="w-6 h-6" />
                    Keyboard Shortcuts
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong className="text-primary">Arrow Keys:</strong> Pan camera</li>
                    <li><strong className="text-primary">T:</strong> Open Tech Tree</li>
                    <li><strong className="text-primary">B:</strong> Open Build Menu</li>
                    <li><strong className="text-primary">C:</strong> View Commanders</li>
                    <li><strong className="text-primary">S:</strong> Stop selected units</li>
                    <li><strong className="text-primary">ESC:</strong> Close menus</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Game Mechanics */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6">Game Mechanics</h2>
            <div className="space-y-6">
              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6" />
                    Resource Management
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Manage four resources: <strong className="text-blue-400">Matter</strong>, <strong className="text-yellow-400">Energy</strong>, 
                    <strong className="text-green-400"> Life</strong>, and <strong className="text-purple-400">Knowledge</strong>.
                  </p>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li>• Gather resources from nodes on the map</li>
                    <li>• Build structures that produce resources over time</li>
                    <li>• Balance all four resources—imbalance increases Quaternion Instability</li>
                    <li>• Use resources to build units, structures, and research technologies</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Zap className="w-6 h-6" />
                    Quaternion Balance
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    The Quaternion Instability meter tracks how balanced your resources are. Keep it low for optimal gameplay.
                  </p>
                    <ul className="space-y-2 text-muted-foreground ml-4">
                      <li>• Instability increases when resources are imbalanced</li>
                      <li>• High instability (&gt;150%) causes negative effects</li>
                      <li>• Maintain balance by distributing resources evenly</li>
                      <li>• Some strategies intentionally create temporary imbalance for tactical advantage</li>
                    </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Box className="w-6 h-6" />
                    Building & Construction
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Build structures to expand your base and produce resources.
                  </p>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li>• Press <strong className="text-primary">B</strong> to open the build menu</li>
                    <li>• Select a building and place it on the map</li>
                    <li>• Buildings take time to construct—watch the build queue</li>
                    <li>• Some buildings produce resources automatically</li>
                    <li>• Barracks and factories train military units</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Brain className="w-6 h-6" />
                    Research & Technology
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Research technologies to unlock new capabilities and improve efficiency.
                  </p>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li>• Press <strong className="text-primary">T</strong> to open the tech tree</li>
                    <li>• Technologies have prerequisites—research in order</li>
                    <li>• Each tech belongs to one of four branches: Matter, Energy, Life, or Knowledge</li>
                    <li>• Research takes time and resources</li>
                    <li>• Terminal technologies unlock victory conditions</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Gamepad2 className="w-6 h-6" />
                    Combat & Units
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Command units to attack enemies and defend your base.
                  </p>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li>• Select units with left click or drag selection</li>
                    <li>• Right-click to move or attack</li>
                    <li>• Different unit types have different strengths</li>
                    <li>• Workers gather resources and build structures</li>
                    <li>• Combat units are trained at Barracks or Factories</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Victory Conditions */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6">Victory Conditions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/70 border-green-400/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-green-400 mb-3">⚖️ Equilibrium Victory</h3>
                  <p className="text-muted-foreground">
                    Maintain all four resources in harmony (±15%) for 60 seconds. This requires careful
                    resource management and balance.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-blue-400/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">🔬 Technological Victory</h3>
                  <p className="text-muted-foreground">
                    Unlock the Terminal Technology: Quantum Ascendancy. This requires researching
                    all major tech branches and investing heavily in knowledge.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-yellow-400/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-yellow-400 mb-3">🏰 Territorial Victory</h3>
                  <p className="text-muted-foreground">
                    Capture and hold the Central Node for 90 seconds. This requires strong military
                    and strategic positioning.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-purple-400/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-purple-400 mb-3">✨ Moral Victory</h3>
                  <p className="text-muted-foreground">
                    Make ethical choices over 4 key events (+80 moral alignment). This requires
                    listening to AUREN's advice and prioritizing preservation over exploitation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Tips */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6">Pro Tips</h2>
            <Card className="bg-card/70 border-primary/30">
              <CardContent className="p-8">
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <Leaf className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <span><strong className="text-primary">Listen to your AI commanders.</strong> They provide valuable strategic insights based on their unique perspectives.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <span><strong className="text-primary">Balance is key.</strong> Don't focus on maximizing one resource—maintain equilibrium across all four dimensions.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Box className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <span><strong className="text-primary">Plan your tech tree.</strong> Research prerequisites early and choose a path that matches your strategy.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <span><strong className="text-primary">Adapt to the map.</strong> Procedurally generated maps offer different strategic opportunities—explore and adapt.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <span><strong className="text-primary">Multiple paths to victory.</strong> Don't commit to one strategy—be flexible and adjust based on the game state.</span>
                  </li>
                </ul>
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
              Start Playing Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToPlay;

