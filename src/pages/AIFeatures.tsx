import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Brain, Bot, Sparkles, Cpu, Network, Zap, Gift, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AIFeatures = () => {
  const navigate = useNavigate();

  const aiTools = [
    { name: "ElevenLabs", description: "AI voice generation for commander dialogue and narration", icon: "🎙️" },
    { name: "OpenArt", description: "AI-generated visual assets and artwork", icon: "🎨" },
    { name: "LTX Studio", description: "AI-powered cinematic generation", icon: "🎬" },
    { name: "Fuser", description: "Adaptive music and soundscape generation", icon: "🎵" },
    { name: "Luma AI", description: "3D asset and environment generation", icon: "🌐" },
    { name: "SAGA", description: "Narrative design and story generation", icon: "📖" },
    { name: "Google Gemini 2.5 Flash", description: "Strategic AI decision-making for commanders", icon: "🤖" },
  ];

  const chromaAwardsOffers = [
    { name: "ElevenLabs", offer: "2 Months of Starter (Worth $10)", value: "$10", categories: ["Voiceover", "Music", "Sound Effects"] },
    { name: "Freepik", offer: "50% Off Annual Premium+ Plans (Worth $321)", value: "$321", categories: ["Image & Video", "Editing Tools", "Stock Assets", "3D", "Fine-Tuning"] },
    { name: "Runway", offer: "Generation Credits (Worth $30)", value: "$30", categories: ["Image & Video", "Lip Sync", "Editing Tools"] },
    { name: "Dreamina AI", offer: "1 Month of Basic (Worth $20)", value: "$20", categories: ["Image & Video"] },
    { name: "CapCut", offer: "1 Month of Premium (Worth $20)", value: "$20", categories: ["Video Editing", "Captions", "Effects"] },
    { name: "Google AI", offer: "1 Month of Pro (Worth $20)", value: "$20", categories: ["Image & Video", "Cloud Storage", "LLM"] },
    { name: "LTX Studio", offer: "1 Month of Pro (Worth $125)", value: "$125", categories: ["Image & Video", "Storyboarding", "Scripts"] },
    { name: "Runway (Basic)", offer: "Basic Free Trial", value: "Free", categories: ["Image & Video", "Lip Sync", "Editing Tools"] },
    { name: "OpenArt", offer: "1 Month Of Essential (Worth $14)", value: "$14", categories: ["Image & Video", "Editing Tools", "Effects"] },
    { name: "Bolt", offer: "1 Month of Pro (Worth $25)", value: "$25", categories: ["Vibe Coding", "Game Development"] },
    { name: "Runway (Explorer)", offer: "1 Month of Explorer and Generation Credits (Worth $30)", value: "$30", categories: ["Image & Video", "Cloud Compute"] },
    { name: "ImagineArt", offer: "1 Month of Professional (Worth $60)", value: "$60", categories: ["Image & Video", "Editing Tools", "Upscaling"] },
    { name: "Runway (Cloud)", offer: "Basic Free Trial", value: "Free", categories: ["Cloud Compute"] },
    { name: "Luma AI", offer: "1 Month of Plus (Worth $30)", value: "$30", categories: ["Image & Video", "Modify Video"] },
    { name: "Hailuo", offer: "1000 Credits (Worth $15)", value: "$15", categories: ["Image & Video"] },
    { name: "Saga", offer: "1 month of Premium with 1000 Image & Video Credits (Worth $320)", value: "$320", categories: ["Screenwriting", "Image & Video"] },
    { name: "D-ID", offer: "1 Month of Creator + $50 in Credits (Worth $70)", value: "$70", categories: ["Lip-Sync"] },
    { name: "Fuser", offer: "Early Access + 10,000 Credits (Worth $10)", value: "$10", categories: ["Image & Video"] },
    { name: "Bolt (Indie)", offer: "1 Month of Indie Dev Plan (Worth $15)", value: "$15", categories: ["Vibe Coding", "Game Development"] },
    { name: "Mago Studio", offer: "1 Month of Basic (Worth $9)", value: "$9", categories: ["Style Transfer"] },
    { name: "ArtCraft", offer: "1 Month of Basic (Worth $10)", value: "$10", categories: ["Image & Video"] },
    { name: "HeyGen", offer: "1 Month of the Lite Plan (Worth $10)", value: "$10", categories: ["Multimodal", "Avatars", "Lip-Sync"] },
    { name: "Veed", offer: "50% off Pro Monthly with 1500 generation credits (Worth $27.50)", value: "$27.50", categories: ["Video Editing", "Image & Video", "Upscaling"] },
    { name: "Morph Studio", offer: "1 Month Of Basic (Worth $10)", value: "$10", categories: ["Image & Video"] },
    { name: "TD-Pro", offer: "50% Off TD-Pro Plans (Worth $15)", value: "$15", categories: ["Image & Video", "Cloud Compute"] },
    { name: "Advanced Generative AI Course", offer: "Free Download (Worth $699)", value: "$699", categories: ["Education"] },
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
              AI Features
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Quaternion showcases cutting-edge AI integration throughout the entire game experience
            </p>
          </div>

          {/* Core AI Systems */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6">Core AI Systems</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Bot className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-bold text-primary">Strategic Commander AI</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Powered by Google Gemini 2.5 Flash, commanders analyze game state and provide strategic
                    recommendations. The system uses a hybrid approach:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• LLM-powered strategic decision-making</li>
                    <li>• Deterministic fallback for reliability</li>
                    <li>• Rate-limited to 1 decision per second</li>
                    <li>• Output validation ensures game stability</li>
                    <li>• Personality-driven recommendations</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Cpu className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-bold text-primary">Adaptive AI Controller</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Heuristic-based AI that controls enemy units with adaptive difficulty:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• Four strategic states: Expansion, Tech, Aggression, Defense</li>
                    <li>• Personality traits: Aggression, Efficiency, Adaptability</li>
                    <li>• Three difficulty levels with scaling reaction times</li>
                    <li>• State-based decision making with cooldowns</li>
                    <li>• Adapts to player strategy over time</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-bold text-primary">Utility-Based Unit AI</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Fast, deterministic AI for individual unit control:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• &lt;1ms per unit per tick for performance</li>
                    <li>• Squad coordination and formation management</li>
                    <li>• Tactical behaviors: attack, retreat, abilities</li>
                    <li>• Spatial awareness and target prioritization</li>
                    <li>• Deterministic for replay compatibility</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Network className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-bold text-primary">Procedural Generation</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Quaternion-based deterministic map generation:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• Seeded random number generation for replayability</li>
                    <li>• Perlin-like noise for terrain variation</li>
                    <li>• Symmetric start positions for fair gameplay</li>
                    <li>• Multiple map types with configurable parameters</li>
                    <li>• Infinite replayability with unique maps</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* AI Tools Used */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              AI Tools Integration
            </h2>
            <p className="text-muted-foreground mb-8 text-center max-w-3xl mx-auto">
              Quaternion integrates multiple AI tools throughout development and gameplay, showcasing
              the power of AI-assisted game creation.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiTools.map((tool) => (
                <Card key={tool.name} className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{tool.icon}</div>
                    <h3 className="text-lg font-bold text-primary mb-2">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Chroma Awards Free Trials */}
          <section className="mb-16">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold text-primary">Chroma Awards Free Trials</h2>
                <Gift className="w-8 h-8 text-secondary" />
              </div>
              <p className="text-muted-foreground mb-2 text-lg">
                Over $1M in Free Trials Available
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Create amazing AI Films, Music Videos, and Games for the Chroma Awards competition with these essential tools!
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/30">
                <span className="text-sm font-semibold text-primary">Season 1, 2025</span>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chromaAwardsOffers.map((offer, index) => (
                <Card 
                  key={index} 
                  className="bg-card/70 border-primary/30 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/20"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-primary pr-2">{offer.name}</h3>
                      <span className="text-sm font-semibold text-secondary bg-secondary/20 px-2 py-1 rounded whitespace-nowrap">
                        {offer.value}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{offer.offer}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {offer.categories.map((category, catIndex) => (
                        <span
                          key={catIndex}
                          className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                All codes claimed • Terms and conditions apply
              </p>
            </div>
          </section>

          {/* AI Safety & Reliability */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6">AI Safety & Reliability</h2>
            <Card className="bg-card/70 border-primary/30">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-3">Output Validation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All LLM decisions are validated before execution. The system checks order types, resource availability,
                    and confidence levels to ensure only valid, safe actions are performed.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary mb-3">Deterministic Fallback</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Every LLM call has a deterministic fallback. If the LLM fails, produces invalid output, or exceeds
                    rate limits, the system automatically switches to proven heuristic strategies, ensuring the game
                    always runs smoothly.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary mb-3">Rate Limiting</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Commander AI is rate-limited to 1 decision per 50 ticks (~1 per second). This prevents API cost
                    explosion, ensures responsive gameplay, and maintains game balance.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary mb-3">Replay Compatibility</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All AI decisions are logged and can be replayed deterministically. This ensures judges can verify
                    gameplay and maintains the integrity of competitive play.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Performance Metrics */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6">AI Performance</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">&lt;0.5ms</div>
                  <p className="text-muted-foreground">Unit AI per tick</p>
                </CardContent>
              </Card>
              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">&lt;5ms</div>
                  <p className="text-muted-foreground">Squad AI per tick</p>
                </CardContent>
              </Card>
              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">~200-500ms</div>
                  <p className="text-muted-foreground">LLM decision time</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={() => navigate('/quaternion')}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-neon"
            >
              Experience AI-Powered Gameplay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFeatures;

