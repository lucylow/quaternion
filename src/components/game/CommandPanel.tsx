import { Button } from '@/components/ui/button';
import { Move, Swords, Sparkles, Square, Target } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
      color: 'text-blue-400 border-blue-400/30 hover:bg-blue-400/10'
    },
    {
      id: 'attack',
      label: 'Attack',
      icon: Swords,
      shortcut: 'A',
      description: 'Attack move to target location',
      color: 'text-red-400 border-red-400/30 hover:bg-red-400/10'
    },
    {
      id: 'patrol',
      label: 'Patrol',
      icon: Target,
      shortcut: 'P',
      description: 'Patrol between two points',
      color: 'text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10'
    },
    {
      id: 'special',
      label: 'Special',
      icon: Sparkles,
      shortcut: 'S',
      description: 'Use special ability',
      color: 'text-purple-400 border-purple-400/30 hover:bg-purple-400/10'
    },
    {
      id: 'stop',
      label: 'Stop',
      icon: Square,
      shortcut: 'H',
      description: 'Stop all orders',
      color: 'text-gray-400 border-gray-400/30 hover:bg-gray-400/10'
    }
  ];

  return (
    <TooltipProvider>
      <div className="bg-game-panel/95 backdrop-blur-md border border-game-panel-border/50 rounded-lg p-3">
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
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{cmd.label}</span>
                    <span className="text-[10px] opacity-60">{cmd.shortcut}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{cmd.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Shortcut: {cmd.shortcut}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

