import { Heart, Shield, Zap, Activity, Info, RotateCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Phaser from 'phaser';
import { AXIS_DESIGNS, QuaternionAxis, getAxisDesign } from '@/design/QuaternionDesignSystem';

interface UnitPanelProps {
  selectedUnits: Phaser.Physics.Arcade.Sprite[];
  onCommand?: (command: string) => void;
}

export const UnitPanel = ({ selectedUnits, onCommand }: UnitPanelProps) => {
  if (!selectedUnits || selectedUnits.length === 0) {
    return (
      <div className="bg-gray-800/95 backdrop-blur-md border border-cyan-400/50 rounded-lg p-4 w-80 h-32 flex items-center justify-center relative overflow-hidden">
        {/* Quaternion rotation background */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg, #4a90e2, #ff6b35, #50c878, #9d4edd, #4a90e2)`,
            animation: 'quaternion-rotate 6s linear infinite'
          }}
        />
        <p className="text-cyan-200 text-base text-readable relative z-10">
          No units selected
          <span className="block text-xs text-cyan-400/60 mt-1 font-mono">
            Quaternion state: idle
          </span>
        </p>
        <style>{`
          @keyframes quaternion-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
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
  
  // Get unit axis for theming
  const unitAxis = (primaryUnit.getData('axis') as QuaternionAxis) || 'matter';
  const axisDesign = AXIS_DESIGNS[unitAxis];

  // Calculate selection stats
  const totalHealth = selectedUnits.reduce((sum, unit) => sum + (unit.getData('health') || 0), 0);
  const totalMaxHealth = selectedUnits.reduce((sum, unit) => sum + (unit.getData('maxHealth') || 100), 0);
  const avgHealthPercent = (totalHealth / totalMaxHealth) * 100;

  return (
    <div 
      className="bg-gray-800/95 backdrop-blur-md border rounded-lg p-4 w-80 space-y-3 relative overflow-hidden"
      style={{
        borderColor: `${axisDesign.primary}50`,
        boxShadow: `0 0 25px ${axisDesign.primary}15`
      }}
    >
      {/* Quaternion rotation background effect */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg, ${axisDesign.primary}, ${axisDesign.secondary}, ${axisDesign.tertiary}, ${axisDesign.primary})`,
          animation: 'quaternion-rotate 8s linear infinite'
        }}
      />
      
      {/* Unit Portrait/Icon */}
      <div className="flex items-start gap-3 relative z-10">
        <div 
          className="w-16 h-16 rounded-lg border flex items-center justify-center relative overflow-hidden group"
          style={{
            background: `linear-gradient(135deg, ${axisDesign.primary}20, ${axisDesign.secondary}20)`,
            borderColor: `${axisDesign.primary}50`
          }}
        >
          {/* Rotating quaternion indicator */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `conic-gradient(from 0deg, ${axisDesign.glow}, transparent, ${axisDesign.glow})`,
              animation: 'quaternion-rotate 3s linear infinite'
            }}
          />
          <Activity 
            className="w-8 h-8 relative z-10 transition-transform group-hover:scale-110" 
            style={{ color: axisDesign.primary }}
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 
                className="font-bold text-base text-readable-neon mb-0.5"
                style={{ color: axisDesign.primary }}
              >
                {unitName}
              </h3>
              <span 
                className="text-xs font-mono opacity-70"
                style={{ color: axisDesign.secondary }}
              >
                Axis: {unitAxis.toUpperCase()} | Q(w,x,y,z)
              </span>
            </div>
            {selectedUnits.length > 1 && (
              <Badge 
                variant="outline" 
                className="text-sm font-semibold"
                style={{
                  borderColor: `${axisDesign.primary}50`,
                  color: axisDesign.primary
                }}
              >
                {selectedUnits.length}
              </Badge>
            )}
          </div>
          
          {/* Health Bar with quaternion-themed styling */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span 
                className="flex items-center gap-1 text-readable"
                style={{ color: axisDesign.primary }}
              >
                <Heart className="w-4 h-4" />
                <span>Quantum Integrity</span>
              </span>
              <span 
                className="font-mono font-semibold text-readable-neon"
                style={{ color: axisDesign.primary }}
              >
                {selectedUnits.length === 1 
                  ? `${Math.floor(unitHealth)}/${unitMaxHealth}`
                  : `${Math.floor(totalHealth)}/${totalMaxHealth}`
                }
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={selectedUnits.length === 1 ? healthPercent : avgHealthPercent}
                className="h-2"
                style={{
                  backgroundColor: `${axisDesign.secondary}20`
                }}
              />
              {/* Glow effect on health bar */}
              <div 
                className="absolute inset-0 h-2 rounded-full opacity-30 blur-sm"
                style={{
                  background: `linear-gradient(90deg, ${axisDesign.glow}, ${axisDesign.primary})`,
                  width: `${selectedUnits.length === 1 ? healthPercent : avgHealthPercent}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Unit Stats with quaternion terminology */}
      <div className="grid grid-cols-2 gap-2 text-sm relative z-10">
        <div 
          className="flex items-center gap-1 text-readable p-2 rounded border"
          style={{
            color: axisDesign.primary,
            borderColor: `${axisDesign.primary}30`,
            backgroundColor: `${axisDesign.primary}10`
          }}
        >
          <Shield className="w-4 h-4" />
          <div>
            <div className="font-semibold">Defense</div>
            <div className="text-xs font-mono opacity-70">{primaryUnit.getData('armor') || 0}</div>
          </div>
        </div>
        <div 
          className="flex items-center gap-1 text-readable p-2 rounded border"
          style={{
            color: axisDesign.tertiary,
            borderColor: `${axisDesign.tertiary}30`,
            backgroundColor: `${axisDesign.tertiary}10`
          }}
        >
          <Zap className="w-4 h-4" />
          <div>
            <div className="font-semibold">Velocity</div>
            <div className="text-xs font-mono opacity-70">{primaryUnit.getData('speed') || 100}</div>
          </div>
        </div>
      </div>

      {/* Abilities with quaternion transformation theme */}
      {unitAbilities.length > 0 && (
        <div className="space-y-1 relative z-10">
          <div 
            className="text-sm flex items-center gap-1 text-readable"
            style={{ color: axisDesign.secondary }}
          >
            <Info className="w-4 h-4" />
            <span>Quaternion Transformations:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {unitAbilities.map((ability: string, idx: number) => (
              <Badge 
                key={`${ability}-${idx}`} 
                variant="outline" 
                className="text-sm font-semibold transition-all hover:scale-105"
                style={{
                  borderColor: `${axisDesign.glow}50`,
                  color: axisDesign.glow,
                  backgroundColor: `${axisDesign.glow}10`
                }}
              >
                {ability}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes quaternion-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

