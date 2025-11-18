import { Button } from '@/components/ui/button';
import { Move, Swords, Sparkles, Square, Target, RotateCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Phaser from 'phaser';
import { useEffect, useState } from 'react';
import { InteractionAudio } from '@/audio/InteractionAudio';
import { AXIS_DESIGNS, QuaternionAxis } from '@/design/QuaternionDesignSystem';
import { cn } from '@/lib/utils';

interface CommandPanelProps {
  selectedUnits: Phaser.Physics.Arcade.Sprite[];
  onCommand: (command: string, data?: any) => void;
}

export const CommandPanel = ({ selectedUnits, onCommand }: CommandPanelProps) => {
  const hasSelection = selectedUnits && selectedUnits.length > 0;
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [interactionAudio, setInteractionAudio] = useState<InteractionAudio | null>(null);
  const [activeCommand, setActiveCommand] = useState<string | null>(null);
  
  // Determine axis based on selected units (default to matter)
  const getUnitAxis = (): QuaternionAxis => {
    if (!selectedUnits || selectedUnits.length === 0) return 'matter';
    const firstUnit = selectedUnits[0];
    const unitAxis = firstUnit.getData('axis') as QuaternionAxis;
    return unitAxis || 'matter';
  };
  
  const currentAxis = getUnitAxis();
  const axisDesign = AXIS_DESIGNS[currentAxis];

  useEffect(() => {
    // Initialize interaction audio
    const initAudio = async () => {
      try {
        const audio = InteractionAudio.instance();
        await audio.init();
        setInteractionAudio(audio);
      } catch (error) {
        console.warn('Failed to initialize interaction audio:', error);
        // Continue without audio
      }
    };
    initAudio();

    // Keyboard shortcut listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const shortcuts: Record<string, string> = {
        'M': 'move',
        'A': 'attack',
        'P': 'patrol',
        'S': 'special',
        'H': 'stop'
      };

      const command = shortcuts[key];
      if (command && (command === 'stop' || hasSelection)) {
        setPressedKey(key);
        // Play sound effect for command
        try {
          const audio = InteractionAudio.instance();
          if (audio && audio.isEnabled()) {
            if (command === 'move') {
              audio.play('move', { volume: 0.5 });
            } else if (command === 'attack') {
              audio.play('attack', { volume: 0.6 });
            } else {
              audio.play('command', { volume: 0.6 });
            }
          }
        } catch (error) {
          // Continue without audio
        }
        onCommand(command);
      }
    };

    const handleKeyUp = () => {
      setPressedKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [hasSelection, onCommand]);

  const commands = [
    {
      id: 'move',
      label: 'Move',
      icon: Move,
      shortcut: 'M',
      description: 'Translate units to target location (Quaternion: w+x+y+z)',
      axis: 'matter' as QuaternionAxis,
      color: `text-[${axisDesign.primary}] border-[${axisDesign.primary}]/50 hover:bg-[${axisDesign.primary}]/20`
    },
    {
      id: 'attack',
      label: 'Attack',
      icon: Swords,
      shortcut: 'A',
      description: 'Engage target with quantum-enhanced weapons',
      axis: 'energy' as QuaternionAxis,
      color: 'text-red-300 border-red-400/50 hover:bg-red-400/20'
    },
    {
      id: 'patrol',
      label: 'Patrol',
      icon: Target,
      shortcut: 'P',
      description: 'Oscillate between waypoints (Periodic quaternion rotation)',
      axis: 'life' as QuaternionAxis,
      color: 'text-yellow-300 border-yellow-400/50 hover:bg-yellow-400/20'
    },
    {
      id: 'special',
      label: 'Special',
      icon: Sparkles,
      shortcut: 'S',
      description: 'Execute quaternion transformation ability',
      axis: 'knowledge' as QuaternionAxis,
      color: 'text-purple-300 border-purple-400/50 hover:bg-purple-400/20'
    },
    {
      id: 'stop',
      label: 'Stop',
      icon: Square,
      shortcut: 'H',
      description: 'Reset quaternion state (w=1, x=y=z=0)',
      axis: 'matter' as QuaternionAxis,
      color: 'text-cyan-200 border-cyan-400/30 hover:bg-cyan-400/10'
    }
  ];

  return (
    <TooltipProvider>
      <div 
        className="bg-gray-800/95 backdrop-blur-md border rounded-lg p-3 relative overflow-hidden"
        style={{
          borderColor: `${axisDesign.primary}50`,
          boxShadow: `0 0 20px ${axisDesign.primary}20`
        }}
      >
        {/* Quaternion rotation background effect */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg, ${axisDesign.primary}, ${axisDesign.secondary}, ${axisDesign.tertiary}, ${axisDesign.primary})`,
            animation: 'quaternion-rotate 4s linear infinite'
          }}
        />
        
        <div className="flex items-center gap-2 relative z-10">
          {commands.map((cmd) => {
            const Icon = cmd.icon;
            const disabled = !hasSelection && cmd.id !== 'stop';
            const cmdAxisDesign = AXIS_DESIGNS[cmd.axis];
            const isActive = activeCommand === cmd.id;
            
            return (
              <Tooltip key={cmd.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Don't execute if disabled
                      if (disabled) {
                        // Play error sound for disabled button
                        try {
                          const audio = InteractionAudio.instance();
                          if (audio && audio.isEnabled()) {
                            audio.play('error', { volume: 0.3 });
                          }
                        } catch (error) {
                          // Continue without audio
                        }
                        return;
                      }

                      // Play appropriate sound effect
                      try {
                        const audio = InteractionAudio.instance();
                        if (audio && audio.isEnabled()) {
                          if (cmd.id === 'move') {
                            audio.play('move', { volume: 0.5 });
                          } else if (cmd.id === 'attack') {
                            audio.play('attack', { volume: 0.6 });
                          } else if (cmd.id === 'patrol') {
                            audio.play('command', { volume: 0.5, pitch: 0.9 });
                          } else if (cmd.id === 'special') {
                            audio.play('command', { volume: 0.6, pitch: 1.2 });
                          } else {
                            audio.play('command', { volume: 0.6 });
                          }
                        }
                      } catch (error) {
                        // Continue without audio
                      }

                      // Visual feedback
                      setActiveCommand(cmd.id);
                      setTimeout(() => setActiveCommand(null), 300);
                      
                      // Execute command
                      onCommand(cmd.id);
                    }}
                    disabled={disabled}
                    className={cn(
                      'border min-w-[60px] flex flex-col items-center gap-1 h-auto py-2',
                      'transition-all duration-200 hover:scale-110 active:scale-95',
                      'relative overflow-hidden group cursor-pointer touch-manipulation',
                      'select-none z-10',
                      disabled && 'opacity-50 cursor-not-allowed',
                      !disabled && 'hover:shadow-lg active:scale-95',
                      pressedKey === cmd.shortcut && 'ring-2 ring-offset-2 scale-105',
                      isActive && 'scale-110 ring-2 ring-offset-1'
                    )}
                    type="button"
                    aria-label={`${cmd.label} command (${cmd.shortcut})`}
                    style={{
                      color: cmdAxisDesign.primary,
                      borderColor: `${cmdAxisDesign.primary}50`,
                      backgroundColor: isActive ? `${cmdAxisDesign.primary}15` : 'transparent',
                      boxShadow: isActive ? `0 0 15px ${cmdAxisDesign.glow}40` : 'none'
                    }}
                  >
                    {/* Quaternion rotation indicator */}
                    {isActive && (
                      <RotateCw 
                        className="absolute top-1 right-1 w-3 h-3 animate-spin"
                        style={{ color: cmdAxisDesign.glow }}
                      />
                    )}
                    
                    <Icon 
                      className="w-5 h-5 transition-transform group-hover:rotate-12" 
                      style={{ color: cmdAxisDesign.primary }}
                    />
                    <span 
                      className="text-sm font-semibold text-readable-neon"
                      style={{ color: cmdAxisDesign.primary }}
                    >
                      {cmd.label}
                    </span>
                    <span 
                      className="text-xs opacity-70 text-readable font-mono"
                      style={{ color: cmdAxisDesign.secondary }}
                    >
                      {cmd.shortcut}
                    </span>
                    
                    {/* Hover glow effect */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, ${cmdAxisDesign.glow}, transparent)`
                      }}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm text-readable font-semibold mb-1">{cmd.label}</p>
                  <p className="text-xs text-readable/80 mb-2">{cmd.description}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-readable/60">Shortcut:</span>
                    <kbd 
                      className="px-2 py-1 rounded bg-background/50 border"
                      style={{ 
                        borderColor: cmdAxisDesign.primary,
                        color: cmdAxisDesign.primary 
                      }}
                    >
                      {cmd.shortcut}
                    </kbd>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        
        <style>{`
          @keyframes quaternion-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
};

