import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Brain, Bot, Sparkles, Cpu, Network, Zap, Gift, Trophy, Mic, Video, Music, Image, Code, Palette, Layers, Play, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AIPipelineVisualization from "@/components/AIPipelineVisualization";
import AIImplementationChecklist from "@/components/AIImplementationChecklist";

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

  const chromaCriteria = [
    {
      name: "Narrative Design",
      delivery: "Dynamic AI-generated battle intros, commander dialogue, reactive world events. Player feels immersed in living strategy world.",
      tools: "Saga AI, Google AI Pro, ElevenLabs",
      evidence: "Playable demo with unique narration each match"
    },
    {
      name: "Creativity & Originality",
      delivery: "Original IP; no franchise re-use. Every map procedurally unique. AI opponent personalities distinct. Uses AI meaningfully.",
      tools: "Luma AI, Saga AI, OpenArt, ImagineArt",
      evidence: "Diverse map generation; distinct commander personalities visible in gameplay"
    },
    {
      name: "Music & Sound",
      delivery: "Adaptive music tracks generated via Fuser; voice acting for commanders and narration via ElevenLabs. Soundscape cohesive and responsive.",
      tools: "Fuser, ElevenLabs, Google AI Pro",
      evidence: "Real-time music layering; distinct voice performances; environmental SFX"
    },
    {
      name: "Thematic Adherence",
      delivery: "Game is 100% web-playable, no downloads. Playable within 15-30 min. Follows all Chroma guidelines. Transparent AI usage.",
      tools: "Rosebud AI / Itch.io (hosting)",
      evidence: "YouTube trailer; Devpost submission with tool tags; gameplay demo"
    },
    {
      name: "Production Value",
      delivery: "High-quality visuals (AI-generated, upscaled, polished). No bugs or glitches in demo. Smooth UI, responsive controls.",
      tools: "Magnific, Mago Studio, CapCut, Dreamina",
      evidence: "Professional-quality assets; bug-free 15-minute playable demo"
    },
    {
      name: "Player Experience Modeling & Adaptive Difficulty",
      delivery: "AI models player skill, emotional state, and engagement in real-time to dynamically adjust game difficulty. Maintains optimal flow state, reducing frustration and boredom through predictive adaptation.",
      tools: "Google Gemini 2.5 Flash (RL agent), Custom TypeScript implementation (player modeling, emotion recognition, flow state optimization)",
      evidence: "Real-time difficulty adjustment system with multi-dimensional player profiling, hardware-free emotion recognition, and RL-based adaptation that preserves game immersion"
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

          {/* AI Pipeline Visualization */}
          <section className="mb-16">
            <AIPipelineVisualization />
          </section>

          {/* AI Implementation Checklist */}
          <section className="mb-16">
            <AIImplementationChecklist />
          </section>

          {/* Chroma Awards Criteria Table */}
          <section className="mb-16">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold text-primary">Chroma Awards Criteria vs Quaternion</h2>
                <CheckCircle2 className="w-8 h-8 text-secondary" />
              </div>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                How Quaternion delivers on each Chroma Awards evaluation criterion with comprehensive AI integration
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden rounded-lg border border-primary/30 bg-card/70">
                  <table className="min-w-full divide-y divide-primary/20">
                    <thead>
                      <tr className="bg-primary/20">
                        <th className="px-6 py-4 text-left text-sm font-bold text-primary uppercase tracking-wider border-r border-primary/20">
                          Criterion
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-primary uppercase tracking-wider border-r border-primary/20">
                          How Quaternion Delivers
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-primary uppercase tracking-wider border-r border-primary/20">
                          AI Tools Used
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-primary uppercase tracking-wider">
                          Judge Evidence
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/10">
                      {chromaCriteria.map((criterion, index) => (
                        <tr 
                          key={index} 
                          className={`transition-colors hover:bg-primary/5 ${
                            index % 2 === 0 ? 'bg-card/50' : 'bg-card/30'
                          }`}
                        >
                          <td className="px-6 py-5 whitespace-nowrap border-r border-primary/20">
                            <div className="text-sm font-bold text-primary">
                              {criterion.name}
                            </div>
                          </td>
                          <td className="px-6 py-5 border-r border-primary/20">
                            <div className="text-sm text-muted-foreground leading-relaxed max-w-md">
                              {criterion.delivery}
                            </div>
                          </td>
                          <td className="px-6 py-5 border-r border-primary/20">
                            <div className="text-sm text-secondary font-medium">
                              {criterion.tools}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm text-muted-foreground">
                              {criterion.evidence}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Mobile-friendly card view */}
            <div className="mt-8 md:hidden space-y-4">
              {chromaCriteria.map((criterion, index) => (
                <Card key={index} className="bg-card/70 border-primary/30">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-secondary" />
                      {criterion.name}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">How We Deliver</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{criterion.delivery}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">AI Tools Used</p>
                        <p className="text-sm text-secondary font-medium">{criterion.tools}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">Judge Evidence</p>
                        <p className="text-sm text-muted-foreground">{criterion.evidence}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

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

          {/* Player Experience Modeling & Adaptive Difficulty */}
          <section className="mb-16">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Brain className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold text-primary">Player Experience Modeling & Adaptive Difficulty</h2>
                <Sparkles className="w-8 h-8 text-secondary" />
              </div>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                Advanced AI system that models player skill, emotional state, and engagement in real-time to dynamically adjust game difficulty, maintaining optimal "flow" state and reducing frustration.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-bold text-primary">Multi-Dimensional Player Modeling</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Comprehensive player profiling that tracks multiple dimensions of player experience:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• <strong>Skill Metrics:</strong> Accuracy, efficiency, adaptability, consistency</li>
                    <li>• <strong>Behavioral Patterns:</strong> Play style, risk tolerance, decision speed, exploration</li>
                    <li>• <strong>Emotional State:</strong> Frustration, engagement, confidence, enjoyment</li>
                    <li>• <strong>Per-Mechanic Skills:</strong> Individual skill levels for combat, economy, puzzles</li>
                    <li>• <strong>Physiological Data:</strong> Optional heart rate, GSR, pupil dilation (if hardware available)</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-bold text-primary">Flow State Optimization</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Implements Csikszentmihalyi's Flow Theory to maintain optimal challenge-skill balance:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• <strong>Flow Channel:</strong> Dynamic range between boredom and anxiety</li>
                    <li>• <strong>Real-Time Adjustment:</strong> Challenge level adapts to player skill</li>
                    <li>• <strong>State Detection:</strong> Identifies flow, anxiety, or boredom states</li>
                    <li>• <strong>Predictive Adaptation:</strong> Anticipates player needs, not just reactive</li>
                    <li>• <strong>Skill Growth Support:</strong> Encourages improvement while maintaining engagement</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-bold text-primary">Affective Computing & Emotion Recognition</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Hardware-free emotion detection from gameplay behavior patterns:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• <strong>Frustration Detection:</strong> Repeated failures, rapid restarts, button spamming</li>
                    <li>• <strong>Engagement Analysis:</strong> Session duration, focus actions, exploration behavior</li>
                    <li>• <strong>Confidence Estimation:</strong> Success rate combined with performance consistency</li>
                    <li>• <strong>Behavioral Inference:</strong> Emotion recognition without specialized hardware</li>
                    <li>• <strong>Physiological Support:</strong> Optional integration with HR, GSR sensors if available</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Cpu className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-bold text-primary">Reinforcement Learning Agent</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    RL-based difficulty adjustment system that learns optimal adaptation strategies:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• <strong>Q-Learning:</strong> State-action value estimation for difficulty adjustments</li>
                    <li>• <strong>Multi-Dimensional Actions:</strong> Enemy health, resources, puzzles, time pressure</li>
                    <li>• <strong>Reward Function:</strong> Optimizes for flow state, engagement, and skill growth</li>
                    <li>• <strong>Exploration-Exploitation:</strong> Balances trying new strategies vs. using known good ones</li>
                    <li>• <strong>Online Learning:</strong> Continuously improves from player interactions</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Network className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-bold text-primary">Stealth Adaptation Techniques</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Immersion-preserving adjustments that players don't notice:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• <strong>Probabilistic Assistance:</strong> AI hesitation, larger hitboxes (invisible to player)</li>
                    <li>• <strong>Resource Flow:</strong> Dynamic ammo, health, currency spawn rates</li>
                    <li>• <strong>Enemy Behavior:</strong> AI reaction time, accuracy, tactical complexity modulation</li>
                    <li>• <strong>Narrative Integration:</strong> Diegetic explanations for significant changes</li>
                    <li>• <strong>Subtle Adjustments:</strong> Changes under 15% remain imperceptible</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-bold text-primary">Research & Validation</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Evidence-based approach with comprehensive evaluation:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• <strong>Flow State Metrics:</strong> Percentage of time in flow, recovery from negative states</li>
                    <li>• <strong>Player Experience:</strong> Self-reported enjoyment, retention rates, session duration</li>
                    <li>• <strong>Adaptation Quality:</strong> Transparency scores, skill-challenge correlation</li>
                    <li>• <strong>A/B Testing:</strong> Compare static vs. reactive vs. predictive adaptation</li>
                    <li>• <strong>Long-Term Studies:</strong> Player retention and skill development tracking</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Technical Implementation Example */}
            <Card className="bg-card/70 border-primary/30 mb-6">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                  <Code className="w-6 h-6" />
                  Technical Implementation
                </h3>
                <div className="bg-muted/50 p-4 rounded border border-primary/20 mb-4">
                  <code className="text-xs text-muted-foreground whitespace-pre-wrap">
{`// Initialize player experience model
import { PlayerExperienceModel, FlowStateCalculator, 
         AdaptiveDifficultyAgent, StealthAdaptation } 
  from './ai/player-modeling';

const playerModel = new PlayerExperienceModel(playerId);
const flowCalculator = new FlowStateCalculator();
const difficultyAgent = new AdaptiveDifficultyAgent();
const stealthAdapter = new StealthAdaptation();

// Update model with gameplay data
const gameplayData = {
  successes: 15,
  failures: 5,
  rapidRestarts: 0,
  pauseFrequency: 2,
  complaintInputs: 3,
  focusActions: 45,
  explorationActions: 12,
  skillProgression: 0.1,
  // ... other metrics
};

playerModel.update(gameplayData);

// Calculate flow state
const flowChannel = flowCalculator.createFlowChannel(
  playerModel.getOverallSkillLevel()
);
const flowState = flowCalculator.calculateFlowState(flowChannel);

// Select difficulty action
const adaptationState = difficultyAgent.createAdaptationState(
  playerModel.getModel(),
  flowState,
  flowChannel.challengeLevel,
  currentTick
);
const action = difficultyAgent.selectAction(adaptationState);

// Apply stealth adjustments
const stealthAdjustments = stealthAdapter.generateStealthAdjustments(
  playerModel.getModel(),
  action
);
const resourceBalance = stealthAdapter.adjustResourceFlow(
  baseResources,
  playerModel.getModel(),
  action
);`}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete TypeScript implementation with multi-dimensional player modeling, flow state optimization, 
                  emotion recognition, and RL-based adaptive difficulty. All systems work together to maintain optimal 
                  player experience while preserving game immersion.
                </p>
              </CardContent>
            </Card>

            {/* Research Contributions */}
            <Card className="bg-card/70 border-primary/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-4">Research Contributions</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-secondary mb-2">Technical Innovations</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Multi-dimensional player state estimation</strong> - More accurate than single-metric approaches</li>
                      <li>• <strong>Hardware-free emotion recognition</strong> - Makes emotion-aware gaming accessible without special equipment</li>
                      <li>• <strong>Safe RL for real-time human interaction</strong> - Enables AI that learns without frustrating players</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary mb-2">Game Design Contributions</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Stealth adaptation preserving immersion</strong> - Players get appropriate challenge without breaking believability</li>
                      <li>• <strong>Mathematically defined flow state</strong> - Reduces player frustration and increases engagement</li>
                      <li>• <strong>Predictive adaptation</strong> - Anticipates player needs rather than just reacting to failures</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                                <li key={`${tool.name}-${idx}-${useCase}`} className="text-xs text-muted-foreground flex items-start gap-2">
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
                  <h3 className="text-xl font-bold text-primary mb-3">AI Integration Manager</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Central coordinator for all AI systems:
                  </p>
                  <div className="bg-muted/50 p-4 rounded border border-primary/20">
                    <code className="text-xs text-muted-foreground whitespace-pre-wrap">
{`import { createDefaultAIManager } from './ai/AIIntegrationManager';

const aiManager = createDefaultAIManager();

// Generate procedural map with AI
const mapResult = await aiManager.generateMap(
  12345,  // seed
  40,     // width
  30,     // height
  'crystalline_plains'
);

// Create AI commander
const commander = await aiManager.createCommander(
  'aggressive',
  seed,
  'medium'
);`}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Unified interface for all AI services with automatic fallback handling.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-3">LLM Map Theme Generation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI generates thematic descriptions for procedural maps:
                  </p>
                  <div className="bg-muted/50 p-4 rounded border border-primary/20">
                    <code className="text-xs text-muted-foreground whitespace-pre-wrap">
{`async generateMapTheme(seed, mapType) {
  const prompt = \`Generate a map theme for 
  seed: \${seed}, type: \${mapType}
  
  Return JSON with:
  - description: thematic narrative
  - strategicPersonality: tactical style
  - terrainFeatures: unique elements\`;
  
  const response = await this.callLLM(prompt);
  return this.parseJSONResponse(response);
}`}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    LLM provides narrative context, deterministic generator creates the map.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-3">Commander Personality Generation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI creates unique commander personalities with gameplay traits:
                  </p>
                  <div className="bg-muted/50 p-4 rounded border border-primary/20">
                    <code className="text-xs text-muted-foreground whitespace-pre-wrap">
{`async generateCommanderPersonality(archetype, seed) {
  const prompt = \`Generate commander for: \${archetype}
  
  Traits (0-1): strategicFocus, patience,
  riskTolerance, aggression
  
  Gameplay: preferredStrategy, 
  unitComposition, techPriority\`;
  
  const personality = await this.callLLM(prompt);
  return this.validateAndCache(personality);
}`}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Each commander has unique AI-generated personality affecting gameplay decisions.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-3">ElevenLabs Voice Integration</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Real-time TTS with voice profiles and SSML:
                  </p>
                  <div className="bg-muted/50 p-4 rounded border border-primary/20">
                    <code className="text-xs text-muted-foreground whitespace-pre-wrap">
{`async generateVoice(text, voiceId, options) {
  const response = await fetch(
    \`\${this.baseUrl}/text-to-speech/\${voiceId}\`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarity || 0.75
        }
      })
    }
  );
  return await response.arrayBuffer();
}`}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Supports multiple voices, SSML control, and voice cloning for commanders.
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
{`scoreAttack(agent, target) {
  const distScore = Math.max(0, 1 - 
    distance(agent, target) / agent.range);
  const hpScore = (target.maxHP - target.HP) / 
    target.maxHP;
  const threatScore = target.threatLevel / 10;
  
  return distScore * 0.4 + 
         hpScore * 0.4 + 
         threatScore * 0.2;
}

// Execute best action
const bestAction = actions.reduce((best, action) => 
  scoreAction(action) > scoreAction(best) 
    ? action : best
);`}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    &lt;1ms per unit per tick. Deterministic for replay compatibility.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-3">Dynamic Event System</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI-generated events with narrative context:
                  </p>
                  <div className="bg-muted/50 p-4 rounded border border-primary/20">
                    <code className="text-xs text-muted-foreground whitespace-pre-wrap">
{`async generateEvent(mapTheme, gameTime) {
  const prompt = \`Generate event for: \${mapTheme}
  Game time: \${gameTime} seconds
  
  Return JSON: {
    type: 'terrain' | 'combat' | 'resource',
    text: narrative description,
    impact: 'low' | 'medium' | 'high',
    effects: {...}
  }\`;
  
  const event = await this.llm.generate(prompt);
  return this.validateEvent(event);
}`}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Events trigger every 3-5 minutes with AI-generated narratives.
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
                          key={`${index}-${catIndex}-${category}`}
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
              onClick={() => navigate('/game')}
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

