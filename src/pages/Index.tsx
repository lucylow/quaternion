/**
 * Route: / (Home Page)
 * This is the main landing page of the application.
 * Edit this file to modify the home page content.
 */
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Box, Zap, Leaf, Trophy, ChevronDown, Gamepad2, Clock, Bot, Grid3x3, Palette, Mic, Music, Mountain, GitBranch, Dices, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/quaternion-hero.webp";
import mapImage from "@/assets/game-maps.webp";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

const Index = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    // Scroll progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'fixed top-0 left-0 h-1 bg-gradient-to-r from-primary to-secondary z-[100] transition-all';
    progressBar.style.width = '0%';
    document.body.appendChild(progressBar);

    const handleScroll = () => {
      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const progress = (scrollTop / (docHeight - winHeight)) * 100;
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      
      // Close mobile menu on scroll
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-5');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));

    // Close mobile menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (mobileMenuOpen && !target.closest('nav')) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClickOutside);
      progressBar.remove();
      observer.disconnect();
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-primary/30">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary hover:opacity-80 transition-opacity cursor-pointer">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8" />
              <span className="hidden sm:inline">QUATERNION<span className="text-secondary">:</span>NF</span>
              <span className="sm:hidden">Q<span className="text-secondary">:</span>NF</span>
            </a>
            <div className="hidden md:flex items-center gap-6">
              <a href="#overview" onClick={(e) => { e.preventDefault(); scrollToSection('overview'); }} className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded text-sm">Overview</a>
              <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }} className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded text-sm">Features</a>
              <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }} className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded text-sm">About</a>
              <a href="/commanders" onClick={(e) => { e.preventDefault(); navigate('/commanders'); }} className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded text-sm">Commanders</a>
              <a href="/how-to-play" onClick={(e) => { e.preventDefault(); navigate('/how-to-play'); }} className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded text-sm">How to Play</a>
              <a href="/ai-features" onClick={(e) => { e.preventDefault(); navigate('/ai-features'); }} className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded text-sm">AI Features</a>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => navigate('/lobby')}
                className="hidden sm:flex bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-neon focus:ring-2 focus:ring-primary focus:ring-offset-2 text-sm px-3 py-1.5"
              >
                Play Now
              </Button>
              <Button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                variant="ghost"
                size="icon"
                className="md:hidden text-primary"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-primary/20 pt-4 animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-3">
                <a href="#overview" onClick={(e) => { e.preventDefault(); scrollToSection('overview'); }} className="hover:text-primary transition-colors py-2 text-sm">Overview</a>
                <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }} className="hover:text-primary transition-colors py-2 text-sm">Features</a>
                <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); setMobileMenuOpen(false); }} className="hover:text-primary transition-colors py-2 text-sm">About</a>
                <a href="/commanders" onClick={(e) => { e.preventDefault(); navigate('/commanders'); setMobileMenuOpen(false); }} className="hover:text-primary transition-colors py-2 text-sm">Commanders</a>
                <a href="/how-to-play" onClick={(e) => { e.preventDefault(); navigate('/how-to-play'); setMobileMenuOpen(false); }} className="hover:text-primary transition-colors py-2 text-sm">How to Play</a>
                <a href="/ai-features" onClick={(e) => { e.preventDefault(); navigate('/ai-features'); setMobileMenuOpen(false); }} className="hover:text-primary transition-colors py-2 text-sm">AI Features</a>
                <Button 
                  onClick={() => { navigate('/lobby'); setMobileMenuOpen(false); }}
                  className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-neon mt-2"
                >
                  Play Now
                </Button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center pt-20 pb-8 sm:pb-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent opacity-30" />
        {/* Hero Image Background */}
        <div className="absolute inset-0 z-0 opacity-20">
          <OptimizedImage
            src={heroImage}
            alt="Quaternion Hero - AI-generated strategy game"
            className="w-full h-full"
            loading="eager"
            priority={true}
            objectFit="cover"
          />
        </div>
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
          <div className="space-y-4 sm:space-y-6 z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
              QUATERNION: NEURAL FRONTIER
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              An AI-generated strategy game where every decision rotates the four dimensions of reality. Command procedurally generated armies, exploit dynamic terrain, and balance the Quaternion to achieve victory.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/lobby')}
                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-neon focus:ring-2 focus:ring-primary focus:ring-offset-2 text-sm sm:text-base"
              >
                Play Free Demo
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 text-sm sm:text-base">
                Watch Gameplay
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <strong className="text-primary">15-30min</strong> Demo
              </span>
              <span className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-primary" />
                <strong className="text-primary">No Download</strong> Required
              </span>
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <strong className="text-primary">Instant Play</strong>
              </span>
            </div>
            
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-secondary to-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-md font-bold text-xs sm:text-sm">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Chroma Awards 2025 Submission - Puzzle/Strategy Category</span>
              <span className="sm:hidden">Chroma Awards 2025</span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-2">
              <p>Tools Used: ElevenLabs, OpenArt, LTX Studio, Fuser, Luma AI, SAGA, Google AI</p>
              <p className="mt-1">Visit <a href="https://www.ChromaAwards.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.ChromaAwards.com</a> for more information</p>
            </div>
          </div>
          
          <div className="relative hidden md:block">
            <div className="relative w-80 h-80 mx-auto">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-primary rounded-full animate-quaternion-rotate">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Box className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => scrollToSection('overview')} 
          className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10"
          aria-label="Scroll to overview"
        >
          <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        </button>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 bg-muted/20 border-y border-primary/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2 p-6 rounded-lg bg-card/50 border border-primary/20 hover:border-primary/40 transition-colors">
              <div className="text-5xl mb-2">🏆</div>
              <h4 className="text-xl font-bold text-primary">Chroma Awards 2025</h4>
              <p className="text-muted-foreground">Official Submission</p>
            </div>
            <div className="space-y-2 p-6 rounded-lg bg-card/50 border border-primary/20 hover:border-primary/40 transition-colors">
              <div className="text-5xl mb-2">⭐</div>
              <h4 className="text-xl font-bold text-primary">AI Innovation</h4>
              <p className="text-muted-foreground">Cutting-Edge Technology</p>
            </div>
            <div className="space-y-2 p-6 rounded-lg bg-card/50 border border-primary/20 hover:border-primary/40 transition-colors">
              <div className="text-5xl mb-2">🎮</div>
              <h4 className="text-xl font-bold text-primary">Instant Play</h4>
              <p className="text-muted-foreground">No Registration Needed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section id="overview" className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-primary">Game Overview</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-8 sm:mb-12 shadow-neon" />
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="animate-on-scroll opacity-0 translate-y-5 transition-all duration-700 bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon hover:-translate-y-2 group">
              <CardContent className="p-6">
                <Grid3x3 className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-2 text-primary">Procedural Strategy</h3>
                <p className="text-muted-foreground">Every match features AI-generated maps, units, and commanders. No two games are alike with our neural terrain synthesis system.</p>
              </CardContent>
            </Card>

            <Card className="animate-on-scroll opacity-0 translate-y-5 transition-all duration-700 bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon hover:-translate-y-2 group" style={{ transitionDelay: '100ms' }}>
              <CardContent className="p-6">
                <Bot className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-2 text-primary">AI-Driven Gameplay</h3>
                <p className="text-muted-foreground">Command AI generals with unique personalities, each with their own strategic preferences and evolving tactics.</p>
              </CardContent>
            </Card>

            <Card className="animate-on-scroll opacity-0 translate-y-5 transition-all duration-700 bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon hover:-translate-y-2 group" style={{ transitionDelay: '200ms' }}>
              <CardContent className="p-6">
                <Brain className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-2 text-primary">Four-Dimensional Balance</h3>
                <p className="text-muted-foreground">Master the Quaternion system: Matter, Energy, Life, and Knowledge. Each decision shifts the balance of power.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-primary">Innovative Features</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-8 sm:mb-12 shadow-neon" />
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="animate-on-scroll opacity-0 translate-y-5 transition-all duration-700 bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon hover:-translate-y-2 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <CardContent className="p-6 relative">
                <Dices className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2 text-primary">Procedural Generation</h3>
                <p className="text-muted-foreground">AI-powered terrain, unit, and narrative generation creates infinite replayability with Luma AI and Hailuo integration.</p>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon transition-all hover:-translate-y-2 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <CardContent className="p-6 relative">
                <Mic className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2 text-primary">AI Voice Narration</h3>
                <p className="text-muted-foreground">Dynamic narration and character voices powered by ElevenLabs, with context-aware emotional responses.</p>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon transition-all hover:-translate-y-2 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <CardContent className="p-6 relative">
                <Palette className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2 text-primary">AI-Generated Art</h3>
                <p className="text-muted-foreground">All visual assets created with OpenArt, Dreamina, and ArtCraft, ensuring a unique aesthetic for every playthrough.</p>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon transition-all hover:-translate-y-2 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <CardContent className="p-6 relative">
                <Music className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2 text-primary">Adaptive Soundtrack</h3>
                <p className="text-muted-foreground">Music and soundscape dynamically evolve based on gameplay using Fuser AI, matching the intensity of each moment.</p>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon transition-all hover:-translate-y-2 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <CardContent className="p-6 relative">
                <GitBranch className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2 text-primary">Tech Tree Puzzles</h3>
                <p className="text-muted-foreground">Strategic tech progression with optimal sequencing challenges. Each choice opens new tactical possibilities.</p>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon transition-all hover:-translate-y-2 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <CardContent className="p-6 relative">
                <Mountain className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2 text-primary">Terrain-Based Strategy</h3>
                <p className="text-muted-foreground">Exploit procedurally generated terrain features like chokepoints, elevation, and dynamic environmental hazards.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section id="ai-tools" className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-primary">AI Tools Integration</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6 shadow-neon" />
          <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-12 text-sm sm:text-base px-4">
            Quaternion showcases cutting-edge AI creativity by integrating multiple AI tools throughout the development process and gameplay experience.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {[
              { name: "ElevenLabs", desc: "Voice Generation" },
              { name: "OpenArt", desc: "Visual Assets" },
              { name: "LTX Studio", desc: "Cinematics" },
              { name: "Fuser", desc: "Adaptive Music" },
              { name: "Luma AI", desc: "3D Generation" },
              { name: "SAGA", desc: "Narrative Design" }
            ].map((tool) => (
              <Card key={tool.name} className="bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon transition-all hover:-translate-y-2 text-center">
                <CardContent className="p-6">
                  <Brain className="w-10 h-10 text-primary mx-auto mb-2" />
                  <h4 className="font-bold text-primary">{tool.name}</h4>
                  <p className="text-sm text-muted-foreground">{tool.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-12 sm:py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-primary">Play The Demo</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-8 sm:mb-12 shadow-neon" />
          
          <Card className="bg-card/70 border-primary shadow-neon overflow-hidden">
            <CardContent className="p-4 sm:p-8">
              <div className="bg-background/50 h-64 sm:h-96 rounded-lg flex items-center justify-center mb-6 sm:mb-8 relative overflow-hidden">
                {/* Map Image Background */}
                <OptimizedImage
                  src={mapImage}
                  alt="Procedurally generated game maps"
                  className="absolute inset-0 w-full h-full opacity-30"
                  loading="lazy"
                  objectFit="cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
                <div className="text-center z-10 px-4 relative">
                  <Gamepad2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">WebGL Game Demo</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">Play directly in your browser - no downloads required</p>
                  <Button 
                    onClick={() => navigate('/lobby')}
                    className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-neon text-sm sm:text-base"
                  >
                    Launch Game
                  </Button>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Chroma Awards Compliant
                  </h4>
                  <p className="text-sm text-muted-foreground">Playable in browser with no downloads or login required</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    15-30 Minute Experience
                  </h4>
                  <p className="text-sm text-muted-foreground">Perfect for judging with a complete gameplay loop</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    AI Features Showcase
                  </h4>
                  <p className="text-sm text-muted-foreground">Experience all the AI-generated content in action</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Characters Section */}
      <section id="characters" className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-primary">AI Commanders</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-8 sm:mb-12 shadow-neon" />
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <Card className="bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon transition-all hover:-translate-y-2 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Box className="w-20 h-20 text-primary" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-1">AUREN</h3>
                <p className="text-secondary font-semibold mb-3">Architect of Matter</p>
                <p className="text-sm text-muted-foreground">The rational industrialist focused on construction, efficiency, and resource optimization. Speaks in engineering metaphors.</p>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon transition-all hover:-translate-y-2 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
                <Zap className="w-20 h-20 text-secondary" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-1">VIREL</h3>
                <p className="text-secondary font-semibold mb-3">Keeper of Energy</p>
                <p className="text-sm text-muted-foreground">Passionate and volatile, Virel controls power distribution and reacts emotionally to energy fluctuations.</p>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon transition-all hover:-translate-y-2 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center">
                <Leaf className="w-20 h-20 text-green-500" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-1">LIRA</h3>
                <p className="text-secondary font-semibold mb-3">Voice of Life</p>
                <p className="text-sm text-muted-foreground">Empathic and nurturing, Lira oversees biomass and ecological balance, advocating for preservation over exploitation.</p>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-primary/30 hover:border-primary hover:shadow-neon transition-all hover:-translate-y-2 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                <Brain className="w-20 h-20 text-accent" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-1">KOR</h3>
                <p className="text-secondary font-semibold mb-3">Seer of Knowledge</p>
                <p className="text-sm text-muted-foreground">Detached and analytical, Kor manages research and data, speaking in probabilities and recursive logic.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background/95 border-t border-primary/30 py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <div className="text-xl font-bold text-primary mb-4">QUATERNION: NEURAL FRONTIER</div>
              <p className="text-sm text-muted-foreground mb-4">An AI-generated strategy experience for the Chroma Awards 2025</p>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-secondary to-primary text-primary-foreground px-3 py-1 rounded text-sm font-bold">
                <Trophy className="w-4 h-4" />
                Official Submission
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Game Pages</h4>
              <div className="space-y-2 text-sm">
                <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }} className="block text-muted-foreground hover:text-primary transition-colors">About</a>
                <a href="/commanders" onClick={(e) => { e.preventDefault(); navigate('/commanders'); }} className="block text-muted-foreground hover:text-primary transition-colors">Commanders</a>
                <a href="/how-to-play" onClick={(e) => { e.preventDefault(); navigate('/how-to-play'); }} className="block text-muted-foreground hover:text-primary transition-colors">How to Play</a>
                <a href="/ai-features" onClick={(e) => { e.preventDefault(); navigate('/ai-features'); }} className="block text-muted-foreground hover:text-primary transition-colors">AI Features</a>
                <a href="/tech-tree" onClick={(e) => { e.preventDefault(); navigate('/tech-tree'); }} className="block text-muted-foreground hover:text-primary transition-colors">Tech Tree</a>
                <a href="/replays" onClick={(e) => { e.preventDefault(); navigate('/replays'); }} className="block text-muted-foreground hover:text-primary transition-colors">Replays</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <a href="#overview" onClick={(e) => { e.preventDefault(); scrollToSection('overview'); }} className="block text-muted-foreground hover:text-primary transition-colors">Game Overview</a>
                <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }} className="block text-muted-foreground hover:text-primary transition-colors">Features</a>
                <a href="#ai-tools" onClick={(e) => { e.preventDefault(); scrollToSection('ai-tools'); }} className="block text-muted-foreground hover:text-primary transition-colors">AI Tools</a>
                <a href="#demo" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }} className="block text-muted-foreground hover:text-primary transition-colors">Play Demo</a>
                <a href="#characters" onClick={(e) => { e.preventDefault(); scrollToSection('characters'); }} className="block text-muted-foreground hover:text-primary transition-colors">Characters</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">AI Tools Used</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">ElevenLabs</a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">OpenArt</a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">LTX Studio</a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Fuser</a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Luma AI</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Discord</a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Twitter</a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">YouTube</a>
                <a href="https://chromaawards.devpost.com/" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-primary transition-colors">Chroma Awards</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-primary/20 pt-8 text-center text-sm text-muted-foreground">
            <p className="mb-2">© 2025 Quaternion: Neural Frontier. Created for the Chroma Awards: AI Film, Music Videos, and Games competition.</p>
            <p>This project uses AI-generated content created with proper licensing and permissions for all assets.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
