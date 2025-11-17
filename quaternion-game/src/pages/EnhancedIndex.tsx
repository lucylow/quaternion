import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Brain, Zap, Leaf, Box, Trophy, Target, Sparkles, Castle } from 'lucide-react';

const EnhancedIndex = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            QUATERNION
          </h1>
          <p className="text-2xl text-gray-300 mb-2">
            AI-Generated Strategy Game
          </p>
          <p className="text-lg text-gray-400">
            Balance four resources. Command your forces. Achieve harmony.
          </p>
        </div>

        {/* Game Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gray-800/50 border-cyan-400/30">
            <CardHeader>
              <Box className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-cyan-400">Matter</CardTitle>
              <CardDescription className="text-gray-400">
                Raw material foundation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">
                Extract and manage matter resources to build your empire
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-yellow-400/30">
            <CardHeader>
              <Zap className="w-8 h-8 text-yellow-400 mb-2" />
              <CardTitle className="text-yellow-400">Energy</CardTitle>
              <CardDescription className="text-gray-400">
                Power all operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">
                Generate and conserve energy to fuel your civilization
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-green-400/30">
            <CardHeader>
              <Leaf className="w-8 h-8 text-green-400 mb-2" />
              <CardTitle className="text-green-400">Life</CardTitle>
              <CardDescription className="text-gray-400">
                Biomass and growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">
                Cultivate life resources and expand your population
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-purple-400/30">
            <CardHeader>
              <Brain className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-purple-400">Knowledge</CardTitle>
              <CardDescription className="text-gray-400">
                Research and advancement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">
                Unlock technologies and ascend to higher levels
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Win Conditions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Win Conditions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-800/50 border-cyan-400/30 hover:border-cyan-400 transition-colors">
              <CardHeader>
                <Target className="w-6 h-6 text-cyan-400 mb-2" />
                <CardTitle className="text-lg">Equilibrium</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">
                  Maintain all resources in harmony (±15%) for 60 seconds
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-purple-400/30 hover:border-purple-400 transition-colors">
              <CardHeader>
                <Brain className="w-6 h-6 text-purple-400 mb-2" />
                <CardTitle className="text-lg">Technological</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">
                  Unlock the Terminal Technology: Quantum Ascendancy
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-red-400/30 hover:border-red-400 transition-colors">
              <CardHeader>
                <Castle className="w-6 h-6 text-red-400 mb-2" />
                <CardTitle className="text-lg">Territorial</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">
                  Capture and hold the Central Node for 90 seconds
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-yellow-400/30 hover:border-yellow-400 transition-colors">
              <CardHeader>
                <Sparkles className="w-6 h-6 text-yellow-400 mb-2" />
                <CardTitle className="text-lg">Moral</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">
                  Make ethical choices over 4 key events (+80 alignment)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gray-800/50 border-cyan-400/50 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Begin?</CardTitle>
              <CardDescription className="text-gray-300">
                Command your forces, balance resources, and achieve victory through strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => navigate('/quaternion')}
                size="lg"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-lg py-6"
              >
                <Trophy className="w-5 h-5 mr-2" />
                Launch Quaternion Game
              </Button>
              
              <Button
                onClick={() => navigate('/game')}
                size="lg"
                variant="outline"
                className="w-full border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
              >
                View Original Demo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Game Info */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-bold mb-4">Game Features</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h4 className="font-bold text-cyan-400 mb-2">AI Opponents</h4>
              <p className="text-sm text-gray-300">
                Face intelligent AI with adaptive strategies and multiple difficulty levels
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h4 className="font-bold text-purple-400 mb-2">Tech Tree</h4>
              <p className="text-sm text-gray-300">
                Research technologies across four branches to unlock powerful upgrades
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h4 className="font-bold text-yellow-400 mb-2">Replay System</h4>
              <p className="text-sm text-gray-300">
                Deterministic replays with judge-ready artifacts for verification
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedIndex;
