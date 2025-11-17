import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Brain, Bot, Sparkles, Cpu, Network, Zap, Gift, Trophy, Mic, Video, Music, Image, Code, Palette, Layers, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AIFeatures = () => {
  const navigate = useNavigate();

  const aiTools = [
    { 
      name: "ElevenLabs", 
      description: "AI voice generation for commander dialogue and narration",
      icon: "🎙️",
      useCases: [
        "In-game advisor voice for strategic recommendations",
        "Dynamic narration that adapts to game events",
        "Trailer voiceover with emotional SSML controls",
        "Commander personality voices with distinct tones"
      ],
      category: "Voice & Audio",
      integration: "Real-time TTS API integration with Unity WebGL"
    },
    { 
      name: "OpenArt", 
      description: "AI-generated visual assets and artwork",
      icon: "🎨",
      useCases: [
        "Concept art for kaiju and units",
        "UI backgrounds and menu screens",
        "2D sprites and icons at multiple resolutions",
        "Style transfer for consistent visual identity"
      ],
      category: "Visual Assets",
      integration: "Asset pipeline: generation → optimization → Unity import"
    },
    { 
      name: "LTX Studio", 
      description: "AI-powered cinematic generation",
      icon: "🎬",
      useCases: [
        "Script-to-cutscene generation for mission intros",
        "60-second trailer with gameplay cuts",
        "Storyboarding and narrative visualization",
        "Dynamic mission briefings"
      ],
      category: "Cinematics",
      integration: "Video generation → compression → embedded playback"
    },
    { 
      name: "Fuser", 
      description: "Adaptive music and soundscape generation",
      icon: "🎵",
      useCases: [
        "2-minute escalating orchestral combat tracks",
        "Dynamic music that responds to battle intensity",
        "Ambient soundscapes for different biomes",
        "Triumphant motifs for victory sequences"
      ],
      category: "Audio",
      integration: "Stem-based audio system with real-time mixing"
    },
    { 
      name: "Luma AI", 
      description: "3D asset and environment generation",
      icon: "🌐",
      useCases: [
        "Base 3D meshes for units and buildings",
        "Environment variants for procedural maps",
        "Photogrammetry-like assets for realism",
        "3D model variations for visual diversity"
      ],
      category: "3D Assets",
      integration: "3D generation → Blender retopo → Unity FBX import"
    },
    { 
      name: "Dreamina AI", 
      description: "2D avatar and lip-sync animation",
      icon: "💬",
      useCases: [
        "Lip-synced character animations for cutscenes",
        "Talking heads for commander introductions",
        "Avatar-based narrative sequences",
        "Short video clips for UI elements"
      ],
      category: "Animation",
      integration: "Video generation → frame extraction → sprite sequences"
    },
    { 
      name: "Google Gemini 2.5 Flash", 
      description: "Strategic AI decision-making for commanders",
      icon: "🤖",
      useCases: [
        "LLM-powered high-level strategic decisions",
        "Procedural map seed generation via JSON prompts",
        "Unit and faction flavor text generation",
        "Adaptive tactical recommendations"
      ],
      category: "AI Decision Making",
      integration: "API integration with rate limiting and fallback heuristics"
    },
    {
      name: "Mago Studio",
      description: "Style transfer and image enhancement",
      icon: "✨",
      useCases: [
        "Style transfer for consistent visual aesthetic",
        "Image upscaling for high-res assets",
        "Artistic filters for unique visual identity",
        "Asset variation generation"
      ],
      category: "Visual Enhancement",
      integration: "Batch processing pipeline for asset optimization"
    },
    {
      name: "CapCut / Veed",
      description: "Video editing and post-production",
      icon: "✂️",
      useCases: [
        "Trailer editing and assembly",
        "Subtitle generation and synchronization",
        "Effects and transitions for cinematics",
        "Final polish and compression"
      ],
      category: "Post-Production",
      integration: "Export pipeline for WebGL-embedded videos"
    }
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
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Quaternion showcases cutting-edge AI integration throughout the entire game experience, from design to deployment
            </p>
            <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
              A procedural AI-driven RTS where neural commanders and human strategists contest procedurally-generated quantum battlefields. AI generates maps, unit behaviors, cinematic narration, and adaptive music for a living demo loop.
            </p>
          </div>

          {/* Development Pipeline */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
              <Layers className="w-8 h-8" />
              AI-Powered Development Pipeline
            </h2>
            <div className="grid md:grid-cols-5 gap-4 mb-8">
              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-bold text-primary mb-2">Design & Scope</h3>
                  <p className="text-xs text-muted-foreground">
                    LLM-generated game design docs, faction concepts, and mission seeds
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">⚙️</div>
                  <h3 className="font-bold text-primary mb-2">Prototype</h3>
                  <p className="text-xs text-muted-foreground">
                    Minimal playable version with core mechanics and AI decision systems
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">🎨</div>
                  <h3 className="font-bold text-primary mb-2">AI Content</h3>
                  <p className="text-xs text-muted-foreground">
                    Art, audio, dialog, procedural maps, and agent behavior generation
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">✨</div>
                  <h3 className="font-bold text-primary mb-2">Polish & Media</h3>
                  <p className="text-xs text-muted-foreground">
                    AI-generated trailer, voiceover, music, subtitles, and effects
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">🚀</div>
                  <h3 className="font-bold text-primary mb-2">Host & Submit</h3>
                  <p className="text-xs text-muted-foreground">
                    WebGL build on Itch.io with Chroma Awards submission
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

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
                    LLM-driven procedural map generation with deterministic execution:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• LLM generates JSON seeds for map parameters</li>
                    <li>• Deterministic pseudo-random from seed for replayability</li>
                    <li>• Perlin-like noise for terrain variation</li>
                    <li>• Resource node placement and chokepoint generation</li>
                    <li>• Symmetric start positions for fair gameplay</li>
                    <li>• Multiple map types with configurable parameters</li>
                    <li>• Infinite replayability with unique maps</li>
                  </ul>
                  <div className="mt-4 p-3 bg-primary/10 rounded border border-primary/20">
                    <p className="text-xs font-semibold text-primary mb-1">LLM Prompt Example:</p>
                    <code className="text-xs text-muted-foreground block whitespace-pre-wrap">
                      {`Generate a seed JSON for a sci-fi RTS map.
Constraints: map_size 1024, num_resource_nodes 6,
terrain_types [plains, crater, lava, forest],
chokepoints 3, objective_locations 2.`}
                    </code>
                  </div>
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
              the power of AI-assisted game creation. Each tool serves specific functions in our pipeline.
            </p>
            
            {/* Group by Category */}
            {["Voice & Audio", "Visual Assets", "Cinematics", "Audio", "3D Assets", "Animation", "AI Decision Making", "Visual Enhancement", "Post-Production"].map((category) => {
              const categoryTools = aiTools.filter(tool => tool.category === category);
              if (categoryTools.length === 0) return null;
              
              return (
                <div key={category} className="mb-12">
                  <h3 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                    {category === "Voice & Audio" && <Mic className="w-5 h-5" />}
                    {category === "Visual Assets" && <Image className="w-5 h-5" />}
                    {category === "Cinematics" && <Video className="w-5 h-5" />}
                    {category === "Audio" && <Music className="w-5 h-5" />}
                    {category === "3D Assets" && <Layers className="w-5 h-5" />}
                    {category === "Animation" && <Play className="w-5 h-5" />}
                    {category === "AI Decision Making" && <Bot className="w-5 h-5" />}
                    {category === "Visual Enhancement" && <Palette className="w-5 h-5" />}
                    {category === "Post-Production" && <Video className="w-5 h-5" />}
                    {category}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {categoryTools.map((tool) => (
                      <Card key={tool.name} className="bg-card/70 border-primary/30 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/20">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="text-3xl">{tool.icon}</div>
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-primary mb-1">{tool.name}</h4>
                              <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-primary mb-2">Use Cases:</p>
                            <ul className="space-y-1">
                              {tool.useCases.map((useCase, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <span className="text-secondary mt-0.5">•</span>
                                  <span>{useCase}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="pt-3 border-t border-primary/20">
                            <p className="text-xs font-semibold text-primary mb-1">Integration:</p>
                            <p className="text-xs text-muted-foreground">{tool.integration}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Implementation Examples */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
              <Code className="w-8 h-8" />
              Implementation Examples
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-3">LLM Commander Decision</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    High-level strategic decisions use LLM with deterministic fallback:
                  </p>
                  <div className="bg-muted/50 p-4 rounded border border-primary/20">
                    <code className="text-xs text-muted-foreground whitespace-pre-wrap">
{`STATE: {
  "resources": 300,
  "myUnits": {"tank":3,"drone":2},
  "enemyVisible": {"air":2,"infantry":5}
}
INSTRUCTION: Provide exactly one 
tactical order in JSON format:
{"orderType": "build/push/defend",
 "target": "north",
 "unit": "tank",
 "qty": 3}`}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Output validation ensures safe execution. Falls back to heuristic AI on failure.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-3">Utility-Based Unit AI</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Fast, deterministic scoring system for unit actions:
                  </p>
                  <div className="bg-muted/50 p-4 rounded border border-primary/20">
                    <code className="text-xs text-muted-foreground whitespace-pre-wrap">
{`ScoreAttack(agent, target):
  distScore = max(0, 1 - distance/range)
  hpScore = (target.maxHP - target.HP) / maxHP
  threatScore = target.threatLevel
  return distScore*0.4 + hpScore*0.4 + threatScore*0.2

Execute best action: MaxBy(actions, Score)`}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    &lt;1ms per unit per tick. Deterministic for replay compatibility.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-3">Procedural Map Generator</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Deterministic generation from LLM-generated seed:
                  </p>
                  <div className="bg-muted/50 p-4 rounded border border-primary/20">
                    <code className="text-xs text-muted-foreground whitespace-pre-wrap">
{`GenerateFromSeed(seed):
  rng = new Random(seed)
  heightmap = PerlinNoise(seed)
  resourceNodes = PlaceNodes(rng, 6)
  chokepoints = CalculateChokepoints(heightmap)
  return Map(heightmap, nodes, chokepoints)`}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    LLM provides JSON seed → deterministic generator creates reproducible maps.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-3">ElevenLabs TTS Integration</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Real-time voice generation with SSML control:
                  </p>
                  <div className="bg-muted/50 p-4 rounded border border-primary/20">
                    <code className="text-xs text-muted-foreground whitespace-pre-wrap">
{`PlayLine(text, voice="Alloy"):
  payload = {text, voice}
  audioBytes = POST(ElevenLabsAPI, payload)
  audioClip = WavToAudioClip(audioBytes)
  AudioSource.Play(audioClip)

SSML Example:
<speak><voice name="Alloy">
  Commander, <break time="400ms"/>
  enemy forces converging on sector three.
</voice></speak>`}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Note: API keys proxied through server for security. Pre-generate for demos.
                  </p>
                </CardContent>
              </Card>
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
            
            {/* Tool to Task Mapping */}
            <div className="mb-8 p-6 bg-card/50 border border-primary/30 rounded-lg">
              <h3 className="text-xl font-bold text-primary mb-4">Tool-to-Task Mapping</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-primary mb-2">Voice & Narration:</p>
                  <p className="text-muted-foreground mb-4">ElevenLabs → In-game advisor voice, dynamic narration, trailer VO</p>
                  
                  <p className="font-semibold text-primary mb-2">Visual Assets:</p>
                  <p className="text-muted-foreground mb-4">OpenArt, ImagineArt, ArtCraft → Concept art, UI backgrounds, 2D sprites</p>
                  
                  <p className="font-semibold text-primary mb-2">Cinematics:</p>
                  <p className="text-muted-foreground mb-4">LTX Studio → Script-to-cutscene, trailers, storyboarding</p>
                  
                  <p className="font-semibold text-primary mb-2">Animation:</p>
                  <p className="text-muted-foreground mb-4">Dreamina AI → Lip-sync, 2D avatars, character animations</p>
                </div>
                <div>
                  <p className="font-semibold text-primary mb-2">Music & Audio:</p>
                  <p className="text-muted-foreground mb-4">Fuser, Google AI Pro → Adaptive music, soundscape generation</p>
                  
                  <p className="font-semibold text-primary mb-2">3D Assets:</p>
                  <p className="text-muted-foreground mb-4">Luma AI, Hailuo → 3D models, environment generation</p>
                  
                  <p className="font-semibold text-primary mb-2">Post-Production:</p>
                  <p className="text-muted-foreground mb-4">CapCut, Veed, Morph Studio → Video editing, captions, effects</p>
                  
                  <p className="font-semibold text-primary mb-2">Development:</p>
                  <p className="text-muted-foreground mb-4">Bolt → Rapid prototyping, vibe coding for game mechanics</p>
                </div>
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

          {/* Chroma Awards Submission Checklist */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              Chroma Awards Submission Checklist
            </h2>
            <Card className="bg-card/70 border-primary/30">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-4">Essential Requirements</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="text-secondary mt-1">✓</span>
                        <div>
                          <p className="font-semibold text-foreground">Playable Demo</p>
                          <p className="text-sm text-muted-foreground">WebGL build playable in browser without download/login</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-secondary mt-1">✓</span>
                        <div>
                          <p className="font-semibold text-foreground">Trailer</p>
                          <p className="text-sm text-muted-foreground">60-second trailer on YouTube + vertical version for TikTok/Reels</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-secondary mt-1">✓</span>
                        <div>
                          <p className="font-semibold text-foreground">English Subtitles</p>
                          <p className="text-sm text-muted-foreground">All dialogue has English subtitles (Chroma requirement)</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-secondary mt-1">✓</span>
                        <div>
                          <p className="font-semibold text-foreground">Tool Tags</p>
                          <p className="text-sm text-muted-foreground">Tools Used clearly listed with Sponsor Awards if applicable</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-4">AI Integration Requirements</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="text-secondary mt-1">✓</span>
                        <div>
                          <p className="font-semibold text-foreground">AI Usage Demonstration</p>
                          <p className="text-sm text-muted-foreground">Clear demonstration of which AI tools power different features</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-secondary mt-1">✓</span>
                        <div>
                          <p className="font-semibold text-foreground">Novelty & Production Quality</p>
                          <p className="text-sm text-muted-foreground">One-minute pitch emphasizing AI usage, novelty, and quality</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-secondary mt-1">✓</span>
                        <div>
                          <p className="font-semibold text-foreground">IP Compliance</p>
                          <p className="text-sm text-muted-foreground">No copyrighted assets without license; use Chroma free trials or own creations</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-secondary mt-1">✓</span>
                        <div>
                          <p className="font-semibold text-foreground">Demo Loop</p>
                          <p className="text-sm text-muted-foreground">3–8 minute curated mission showing unique AI features</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-8 p-6 bg-primary/10 rounded-lg border border-primary/30">
                  <h4 className="font-bold text-primary mb-3">Tools Used (For Devpost Submission)</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    ElevenLabs (voice), OpenArt (art), Luma AI (3D), Dreamina (lip-sync), LTX Studio (cinematics), 
                    Fuser (music), Google Gemini 2.5 Flash (strategic AI), Mago Studio (style transfer), 
                    CapCut/Veed (video editing)
                  </p>
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    All tools listed above were used in the development and gameplay of Quaternion, 
                    demonstrating comprehensive AI integration across all aspects of the game.
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
              Experience AI-Powered Gameplay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFeatures;

