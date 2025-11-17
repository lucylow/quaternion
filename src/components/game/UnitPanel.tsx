import { Heart, Shield, Zap, Activity, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Phaser from 'phaser';

interface UnitPanelProps {
  selectedUnits: Phaser.Physics.Arcade.Sprite[];
  onCommand?: (command: string) => void;
}

export const UnitPanel = ({ selectedUnits, onCommand }: UnitPanelProps) => {
  if (!selectedUnits || selectedUnits.length === 0) {
    return (
      <div className="bg-gray-800/95 backdrop-blur-md border border-cyan-400/50 rounded-lg p-4 w-80 h-32 flex items-center justify-center">
        <p className="text-gray-400 text-sm">No units selected</p>
      </div>
    );
  }

  // Get first selected unit for display
  const primaryUnit = selectedUnits[0];
  const unitType = primaryUnit.getData('type') || 'unit';
  const unitHealth = primaryUnit.getData('health') || 0;
  const unitMaxHealth = primaryUnit.getData('maxHealth') || 100;
  const unitName = primaryUnit.getData('name') || unitType.toUpperCase();
  const unitAbilities = primaryUnit.getData('abilities') || [];
  const healthPercent = (unitHealth / unitMaxHealth) * 100;

  // Calculate selection stats
  const totalHealth = selectedUnits.reduce((sum, unit) => sum + (unit.getData('health') || 0), 0);
  const totalMaxHealth = selectedUnits.reduce((sum, unit) => sum + (unit.getData('maxHealth') || 100), 0);
  const avgHealthPercent = (totalHealth / totalMaxHealth) * 100;

  return (
    <div className="bg-gray-800/95 backdrop-blur-md border border-cyan-400/50 rounded-lg p-4 w-80 space-y-3">
      {/* Unit Portrait/Icon */}
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg border border-cyan-400/30 flex items-center justify-center">
          <Activity className="w-8 h-8 text-cyan-400" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-cyan-400 font-bold text-sm">{unitName}</h3>
            {selectedUnits.length > 1 && (
              <Badge variant="outline" className="text-xs border-cyan-400/30 text-cyan-400">
                {selectedUnits.length}
              </Badge>
            )}
          </div>
          
          {/* Health Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1">
                <Heart className="w-3 h-3" />
                Health
              </span>
              <span className="text-white font-mono">
                {selectedUnits.length === 1 
                  ? `${Math.floor(unitHealth)}/${unitMaxHealth}`
                  : `${Math.floor(totalHealth)}/${totalMaxHealth}`
                }
              </span>
            </div>
            <Progress 
              value={selectedUnits.length === 1 ? healthPercent : avgHealthPercent}
              className="h-2"
            />
          </div>
        </div>
      </div>

      {/* Unit Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1 text-gray-400">
          <Shield className="w-3 h-3" />
          <span>Armor: {primaryUnit.getData('armor') || 0}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <Zap className="w-3 h-3" />
          <span>Speed: {primaryUnit.getData('speed') || 100}</span>
        </div>
      </div>

      {/* Abilities */}
      {unitAbilities.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Abilities:
          </div>
          <div className="flex flex-wrap gap-1">
            {unitAbilities.map((ability: string, idx: number) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className="text-xs border-purple-400/30 text-purple-400"
              >
                {ability}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

