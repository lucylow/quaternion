import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Play, Clock, Trophy, Download, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Replays = () => {
  const navigate = useNavigate();
  const [replays] = useState([
    {
      id: 'replay-001',
      seed: 123456,
      commander: 'AUREN',
      mapType: 'Crystalline Plains',
      duration: '15:32',
      outcome: 'Victory',
      date: '2025-01-15',
    },
    {
      id: 'replay-002',
      seed: 789012,
      commander: 'VIREL',
      mapType: 'Quantum Nexus',
      duration: '22:18',
      outcome: 'Victory',
      date: '2025-01-14',
    },
    {
      id: 'replay-003',
      seed: 345678,
      commander: 'LIRA',
      mapType: 'Jagged Island',
      duration: '18:45',
      outcome: 'Defeat',
      date: '2025-01-13',
    },
  ]);

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
              <Play className="w-8 h-8" />
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
              Game Replays
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Watch and analyze your past games. Every replay is deterministic and can be verified.
            </p>
          </div>

          {/* Replay System Info */}
          <section className="mb-12">
            <Card className="bg-card/70 border-primary/30">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-primary mb-4">Deterministic Replay System</h2>
                <p className="text-muted-foreground mb-4">
                  Quaternion's replay system ensures complete determinism. Every game can be replayed exactly as it happened,
                  making it perfect for:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• Judge verification for competitions</li>
                  <li>• Learning from past games</li>
                  <li>• Sharing epic moments</li>
                  <li>• Analyzing AI decision-making</li>
                  <li>• Debugging and development</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Replays List */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-primary mb-6">Your Replays</h2>
            <div className="space-y-4">
              {replays.map((replay) => (
                <Card key={replay.id} className="bg-card/70 border-primary/30 hover:border-primary transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-primary">Replay {replay.id}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            replay.outcome === 'Victory' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {replay.outcome}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <strong className="text-primary">Commander:</strong> {replay.commander}
                          </div>
                          <div>
                            <strong className="text-primary">Map:</strong> {replay.mapType}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {replay.duration}
                          </div>
                          <div>
                            <strong className="text-primary">Seed:</strong> {replay.seed}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Played on {replay.date}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Watch
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* How Replays Work */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-primary mb-6">How Replays Work</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    Deterministic Recording
                  </h3>
                  <p className="text-muted-foreground">
                    Every game action is recorded with the game seed, ensuring complete reproducibility.
                    The replay file contains all decisions, AI choices, and game state transitions.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Play className="w-6 h-6" />
                    Playback System
                  </h3>
                  <p className="text-muted-foreground">
                    Replays can be played back at any speed, paused, and analyzed frame-by-frame.
                    The system reconstructs the exact game state at any point in time.
                  </p>
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
              Play a Game to Generate Replay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Replays;

