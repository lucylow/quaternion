/**
 * Endgame Scene Component
 * Displays cinematic endings with narration, visuals, and effects for each scenario
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ArrowLeft, Sparkles, AlertTriangle, Heart, Zap, Brain, Infinity as InfinityIcon } from 'lucide-react';
import { EndgameData, EndgameScenario } from '@/game/EndgameManager';
import { useNavigate } from 'react-router-dom';

interface EndgameSceneProps {
  endgameData: EndgameData;
  gameTime: number;
  onRestart?: () => void;
}

export const EndgameScene = ({ endgameData, gameTime, onRestart }: EndgameSceneProps) => {
  const [narrationVisible, setNarrationVisible] = useState(false);
  const [epilogueVisible, setEpilogueVisible] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Animate narration appearing
    const narrationTimer = setTimeout(() => setNarrationVisible(true), 500);
    // Show epilogue after narration
    const epilogueTimer = setTimeout(() => setEpilogueVisible(true), 3000);
    // Show controls after epilogue
    const controlsTimer = setTimeout(() => setShowControls(true), 6000);

    return () => {
      clearTimeout(narrationTimer);
      clearTimeout(epilogueTimer);
      clearTimeout(controlsTimer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getScenarioIcon = () => {
    switch (endgameData.scenario) {
      case 'collapse':
        return <AlertTriangle className="w-20 h-20 text-red-400" />;
      case 'harmony':
        return <Heart className="w-20 h-20 text-green-400" />;
      case 'ascendancy':
        return <Brain className="w-20 h-20 text-purple-400" />;
      case 'reclamation':
        return <Sparkles className="w-20 h-20 text-green-400" />;
      case 'overclock':
        return <Zap className="w-20 h-20 text-yellow-400" />;
      case 'ultimate_balance':
        return <InfinityIcon className="w-20 h-20 text-blue-400" />;
    }
  };

  const getBackgroundGradient = () => {
    const theme = endgameData.visualTheme;
    switch (endgameData.scenario) {
      case 'collapse':
        return `linear-gradient(135deg, ${theme.backgroundColor} 0%, ${theme.secondaryColor} 100%)`;
      case 'harmony':
        return `radial-gradient(circle at center, ${theme.primaryColor}15 0%, ${theme.backgroundColor} 100%)`;
      case 'ascendancy':
        return `linear-gradient(45deg, ${theme.backgroundColor} 0%, ${theme.secondaryColor} 50%, ${theme.primaryColor}25 100%)`;
      case 'reclamation':
        return `radial-gradient(ellipse at bottom, ${theme.primaryColor}20 0%, ${theme.backgroundColor} 70%)`;
      case 'overclock':
        return `linear-gradient(180deg, ${theme.primaryColor}10 0%, ${theme.backgroundColor} 50%, ${theme.secondaryColor} 100%)`;
      case 'ultimate_balance':
        return `conic-gradient(from 0deg, ${theme.primaryColor}10, ${theme.secondaryColor}10, ${theme.primaryColor}10)`;
    }
  };

  const getEffectClasses = () => {
    const effects = endgameData.visualTheme.effects;
    const classes: string[] = [];
    
    if (effects.includes('flicker')) classes.push('animate-pulse');
    if (effects.includes('pulsate')) classes.push('animate-pulse');
    if (effects.includes('glow')) classes.push('drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]');
    if (effects.includes('intense')) classes.push('animate-bounce');
    
    return classes.join(' ');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: getBackgroundGradient(),
        transition: 'background 2s ease-in-out'
      }}
    >
      {/* Visual Effects Overlay */}
      <div 
        className={`absolute inset-0 ${getEffectClasses()}`}
        style={{
          background: endgameData.scenario === 'collapse' 
            ? 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(255,68,68,0.1) 100%)'
            : endgameData.scenario === 'ultimate_balance'
            ? 'radial-gradient(circle at 50% 50%, rgba(96,165,250,0.2) 0%, transparent 70%)'
            : 'transparent',
          animation: endgameData.scenario === 'collapse' ? 'pulse 2s ease-in-out infinite' : undefined
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center">
        {/* Icon */}
        <div className={`mb-8 flex justify-center transition-opacity duration-1000 ${narrationVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className={getEffectClasses()}>
            {getScenarioIcon()}
          </div>
        </div>

        {/* Title */}
        <h1 
          className={`text-5xl md:text-6xl font-bold mb-6 transition-all duration-1000 ${
            narrationVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ color: endgameData.visualTheme.primaryColor }}
        >
          {endgameData.title}
        </h1>

        {/* Narration */}
        <div 
          className={`text-xl md:text-2xl mb-8 transition-all duration-1000 delay-500 ${
            narrationVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ color: endgameData.visualTheme.primaryColor }}
        >
          {endgameData.narration}
        </div>

        {/* Epilogue */}
        <div 
          className={`text-lg md:text-xl mb-12 transition-all duration-1000 delay-2000 ${
            epilogueVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ color: endgameData.visualTheme.primaryColor, fontStyle: 'italic' }}
        >
          <p className="leading-relaxed max-w-2xl mx-auto">
            {endgameData.epilogue}
          </p>
        </div>

        {/* Game Stats */}
        <div 
          className={`mb-8 transition-all duration-1000 delay-3000 ${
            epilogueVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="inline-block px-6 py-3 rounded-lg bg-black/30 backdrop-blur-sm border border-white/10">
            <p className="text-gray-300 text-sm">Time: {formatTime(gameTime)}</p>
            <p className="text-gray-400 text-xs mt-1">
              {endgameData.audioTheme.description}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div 
          className={`flex gap-4 justify-center transition-all duration-1000 delay-4000 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Button
            onClick={() => {
              if (onRestart) {
                onRestart();
              } else {
                window.location.reload();
              }
            }}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 text-lg"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 px-8 py-3 text-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Main Menu
          </Button>
        </div>
      </div>

      {/* Particle Effects for Ultimate Balance */}
      {endgameData.scenario === 'ultimate_balance' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: endgameData.visualTheme.primaryColor,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.6
              }}
            />
          ))}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
          50% { transform: translateY(-40px) translateX(-10px); opacity: 1; }
          75% { transform: translateY(-20px) translateX(5px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

