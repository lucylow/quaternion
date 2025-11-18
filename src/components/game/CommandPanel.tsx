import { Button } from '@/components/ui/button';
import { Move, Swords, Sparkles, Square, Target } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Phaser from 'phaser';

interface CommandPanelProps {
  selectedUnits: Phaser.Physics.Arcade.Sprite[];
  onCommand: (command: string, data?: any) => void;
}

export const CommandPanel = ({ selectedUnits, onCommand }: CommandPanelProps) => {
  const hasSelection = selectedUnits && selectedUnits.length > 0;

  const commands = [
    {
      id: 'move',
      label: 'Move',
      icon: Move,
      shortcut: 'M',
      description: 'Move selected units to target location',
      color: 'text-cyan-300 border-cyan-400/50 hover:bg-cyan-400/20'
    },
    {
      id: 'attack',
      label: 'Attack',
      icon: Swords,
      shortcut: 'A',
      description: 'Attack move to target location',
      color: 'text-red-300 border-red-400/50 hover:bg-red-400/20'
    },
    {
      id: 'patrol',
      label: 'Patrol',
      icon: Target,
      shortcut: 'P',
      description: 'Patrol between two points',
      color: 'text-yellow-300 border-yellow-400/50 hover:bg-yellow-400/20'
    },
    {
      id: 'special',
      label: 'Special',
      icon: Sparkles,
      shortcut: 'S',
      description: 'Use special ability',
      color: 'text-purple-300 border-purple-400/50 hover:bg-purple-400/20'
    },
    {
      id: 'stop',
      label: 'Stop',
      icon: Square,
      shortcut: 'H',
      description: 'Stop all orders',
      color: 'text-cyan-200 border-cyan-400/30 hover:bg-cyan-400/10'
    }
  ];

  return (
    <TooltipProvider>
      <div className="bg-gray-800/95 backdrop-blur-md border border-cyan-400/50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          {commands.map((cmd) => {
            const Icon = cmd.icon;
            const disabled = !hasSelection && cmd.id !== 'stop';
            
            return (
              <Tooltip key={cmd.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCommand(cmd.id)}
                    disabled={disabled}
                    className={`
                      ${cmd.color}
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      border min-w-[60px] flex flex-col items-center gap-1 h-auto py-2
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-semibold text-readable-neon">{cmd.label}</span>
                    <span className="text-xs opacity-70 text-readable">{cmd.shortcut}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm text-readable">{cmd.description}</p>
                  <p className="text-xs text-cyan-200 mt-1 text-readable">Shortcut: {cmd.shortcut}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

