/**
 * Game Launcher Component
 * Allows users to choose between the two different game modes:
 * - /game: Simple RTS game (Neural Frontier)
 * - /quaternion: Full Quaternion strategy game
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Brain, Zap, Target, Users, Clock } from 'lucide-react';

export interface GameMode {
  id: 'neural-frontier' | 'quaternion';
  name: string;
  description: string;
  route: string;
  features: string[];
  estimatedTime: string;
  difficulty: 'casual' | 'intermediate' | 'advanced';
  icon: React.ReactNode;
  color: string;
}

const gameModes: GameMode[] = [
  {
    id: 'neural-frontier',
    name: 'Neural Frontier',
    description: 'A streamlined RTS experience with AI-powered commanders and tactical gameplay',
    route: '/game',
    features: [
      'Quick 15-20 minute matches',
      'AI commander suggestions',
      'Simplified resource management',
      'Perfect for beginners',
      'Tactical unit control'
    ],
    estimatedTime: '15-20 min',
    difficulty: 'casual',
    icon: <Gamepad2 className="w-8 h-8" />,
    color: 'cyan'
  },
  {
    id: 'quaternion',
    name: 'Quaternion Strategy',
    description: 'The full 4-axis strategy experience with complex resource puzzles and multiple victory paths',
    route: '/game',
    features: [
      '4-resource system (Matter, Energy, Life, Knowledge)',
      'Resource puzzles & black market',
      'Multiple victory conditions',
      'AI advisor system',
      'Multiplayer support',
      'Advanced tech tree'
    ],
    estimatedTime: '25-45 min',
    difficulty: 'advanced',
    icon: <Brain className="w-8 h-8" />,
    color: 'purple'
  }
];

export const GameLauncher = () => {
  const navigate = useNavigate();

  const getDifficultyColor = (difficulty: GameMode['difficulty']) => {
    switch (difficulty) {
      case 'casual':
        return 'text-green-400 border-green-400';
      case 'intermediate':
        return 'text-yellow-400 border-yellow-400';
      case 'advanced':
        return 'text-red-400 border-red-400';
    }
  };

  const getDifficultyLabel = (difficulty: GameMode['difficulty']) => {
    switch (difficulty) {
      case 'casual':
        return 'Casual';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-quaternion-darker to-quaternion-dark p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-quaternion-primary mb-4">
            QUATERNION GAMES
          </h1>
          <p className="text-xl text-quaternion-light mb-2">
            Choose Your Experience
          </p>
          <p className="text-quaternion-light/70">
            Two distinct game modes, one unified platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {gameModes.map((mode) => (
            <Card
              key={mode.id}
              className="bg-game-panel/90 backdrop-blur-md border-2 border-game-panel-border hover:border-quaternion-primary transition-all hover:scale-[1.02] shadow-lg hover:shadow-quaternion-primary/20"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${mode.color}-500/20 border border-${mode.color}-400/30`}>
                    <div className={`text-${mode.color}-400`}>
                      {mode.icon}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-xs font-bold ${getDifficultyColor(mode.difficulty)}`}>
                    {getDifficultyLabel(mode.difficulty)}
                  </div>
                </div>
                <CardTitle className="text-2xl text-quaternion-primary mb-2">
                  {mode.name}
                </CardTitle>
                <CardDescription className="text-quaternion-light/80 text-base">
                  {mode.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Features */}
                  <div>
                    <h3 className="text-sm font-bold text-quaternion-secondary mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Features
                    </h3>
                    <ul className="space-y-1">
                      {mode.features.map((feature, idx) => (
                        <li key={`${mode.id}-feature-${feature.slice(0, 20)}-${idx}`} className="text-sm text-quaternion-light/70 flex items-start gap-2">
                          <span className="text-quaternion-primary mt-1">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Time Estimate */}
                  <div className="flex items-center gap-2 text-sm text-quaternion-light/70">
                    <Clock className="w-4 h-4 text-quaternion-secondary" />
                    <span>Estimated playtime: <strong className="text-quaternion-primary">{mode.estimatedTime}</strong></span>
                  </div>

                  {/* Launch Button */}
                  <Button
                    onClick={() => navigate(mode.route)}
                    className={`w-full bg-${mode.color}-600 hover:bg-${mode.color}-700 text-white font-bold py-6 text-lg transition-all hover:scale-105`}
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Launch {mode.name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="bg-game-panel/90 backdrop-blur-md border-2 border-game-panel-border">
          <CardHeader>
            <CardTitle className="text-quaternion-primary flex items-center gap-2">
              <Users className="w-5 h-5" />
              Game Mode Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-quaternion-primary/30">
                    <th className="text-left p-3 text-quaternion-primary">Feature</th>
                    <th className="text-center p-3 text-quaternion-primary">Neural Frontier</th>
                    <th className="text-center p-3 text-quaternion-primary">Quaternion Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-quaternion-primary/10">
                    <td className="p-3 text-quaternion-light">Game State</td>
                    <td className="p-3 text-center text-quaternion-light/70">React State</td>
                    <td className="p-3 text-center text-quaternion-light/70">QuaternionGameState</td>
                  </tr>
                  <tr className="border-b border-quaternion-primary/10">
                    <td className="p-3 text-quaternion-light">Resources</td>
                    <td className="p-3 text-center text-quaternion-light/70">4 Basic Resources</td>
                    <td className="p-3 text-center text-quaternion-light/70">4-Axis System</td>
                  </tr>
                  <tr className="border-b border-quaternion-primary/10">
                    <td className="p-3 text-quaternion-light">Puzzle System</td>
                    <td className="p-3 text-center text-quaternion-light/70">❌</td>
                    <td className="p-3 text-center text-quaternion-light/70">✅</td>
                  </tr>
                  <tr className="border-b border-quaternion-primary/10">
                    <td className="p-3 text-quaternion-light">Black Market</td>
                    <td className="p-3 text-center text-quaternion-light/70">❌</td>
                    <td className="p-3 text-center text-quaternion-light/70">✅</td>
                  </tr>
                  <tr className="border-b border-quaternion-primary/10">
                    <td className="p-3 text-quaternion-light">AI Advisor</td>
                    <td className="p-3 text-center text-quaternion-light/70">Basic Suggestions</td>
                    <td className="p-3 text-center text-quaternion-light/70">Advanced System</td>
                  </tr>
                  <tr className="border-b border-quaternion-primary/10">
                    <td className="p-3 text-quaternion-light">Multiplayer</td>
                    <td className="p-3 text-center text-quaternion-light/70">❌</td>
                    <td className="p-3 text-center text-quaternion-light/70">✅</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-quaternion-light">Victory Conditions</td>
                    <td className="p-3 text-center text-quaternion-light/70">1-2 Simple</td>
                    <td className="p-3 text-center text-quaternion-light/70">4 Complex</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Shared Systems Info */}
        <Card className="mt-8 bg-game-panel/90 backdrop-blur-md border-2 border-game-panel-border">
          <CardHeader>
            <CardTitle className="text-quaternion-primary">Shared Systems</CardTitle>
            <CardDescription className="text-quaternion-light/70">
              Both games share common infrastructure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-background/30 border border-quaternion-primary/20">
                <h4 className="font-bold text-quaternion-secondary mb-2">Phaser Engine</h4>
                <p className="text-sm text-quaternion-light/70">
                  Both games use Phaser 3 for rendering and physics
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/30 border border-quaternion-primary/20">
                <h4 className="font-bold text-quaternion-secondary mb-2">AI Systems</h4>
                <p className="text-sm text-quaternion-light/70">
                  Shared AI commander personalities and suggestions
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/30 border border-quaternion-primary/20">
                <h4 className="font-bold text-quaternion-secondary mb-2">UI Components</h4>
                <p className="text-sm text-quaternion-light/70">
                  Common build menus, tech trees, and HUD elements
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


