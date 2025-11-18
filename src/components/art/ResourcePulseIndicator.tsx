/**
 * Resource Pulse Indicator Component
 * Animated resource indicators that pulse based on importance/instability
 */

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { QuaternionArtPalette } from '@/game/art/ArtPalette';

interface ResourcePulseIndicatorProps {
  resource: 'matter' | 'energy' | 'life' | 'knowledge';
  value: number;
  maxValue?: number;
  intensity?: number; // 0-1, controls pulse intensity
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function ResourcePulseIndicator({
  resource,
  value,
  maxValue = 100,
  intensity = 0,
  size = 'md',
  showValue = true,
  className
}: ResourcePulseIndicatorProps) {
  const [scale, setScale] = useState(1);
  const [pulse, setPulse] = useState(0);

  const palette = QuaternionArtPalette.getPalette(resource);
  const baseColor = QuaternionArtPalette.toHex(palette.base);
  const accentColor = QuaternionArtPalette.toHex(palette.accent);
  const emissiveColor = QuaternionArtPalette.toHex(palette.emissive);

  // Pulse animation
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    let timer = 0;

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      timer += delta;

      // Calculate pulse based on intensity
      const pulseSpeed = 1 + intensity * 6;
      const pulseAmount = intensity * 0.25;
      const pulseValue = (Math.sin(timer * pulseSpeed) + 1) / 2;
      
      setPulse(pulseValue);
      setScale(1 + pulseValue * pulseAmount);

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [intensity]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  const fillPercentage = Math.min(100, (value / maxValue) * 100);

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full transition-transform duration-200',
        sizeClasses[size],
        className
      )}
      style={{
        transform: `scale(${scale})`,
        boxShadow: `0 0 ${10 + pulse * 20}px ${emissiveColor}40`
      }}
    >
      {/* Background circle */}
      <div
        className="absolute inset-0 rounded-full opacity-20"
        style={{ backgroundColor: baseColor }}
      />

      {/* Fill circle */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-300"
        style={{
          background: `conic-gradient(from 0deg, ${accentColor} ${fillPercentage}%, ${baseColor}40 ${fillPercentage}%)`,
          opacity: 0.8
        }}
      />

      {/* Emissive glow */}
      {intensity > 0.5 && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            backgroundColor: emissiveColor,
            opacity: pulse * 0.3 * intensity
          }}
        />
      )}

      {/* Value text */}
      {showValue && (
        <span
          className="relative z-10 font-bold"
          style={{ color: accentColor }}
        >
          {Math.floor(value)}
        </span>
      )}

      {/* Resource icon/letter */}
      <div
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          backgroundColor: accentColor,
          color: baseColor
        }}
      >
        {resource[0].toUpperCase()}
      </div>
    </div>
  );
}

interface ResourceGridProps {
  resources: {
    matter?: number;
    energy?: number;
    life?: number;
    knowledge?: number;
  };
  intensities?: {
    matter?: number;
    energy?: number;
    life?: number;
    knowledge?: number;
  };
  maxValue?: number;
  className?: string;
}

export function ResourcePulseGrid({
  resources,
  intensities = {},
  maxValue = 100,
  className
}: ResourceGridProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      <ResourcePulseIndicator
        resource="matter"
        value={resources.matter || 0}
        intensity={intensities.matter || 0}
        maxValue={maxValue}
      />
      <ResourcePulseIndicator
        resource="energy"
        value={resources.energy || 0}
        intensity={intensities.energy || 0}
        maxValue={maxValue}
      />
      <ResourcePulseIndicator
        resource="life"
        value={resources.life || 0}
        intensity={intensities.life || 0}
        maxValue={maxValue}
      />
      <ResourcePulseIndicator
        resource="knowledge"
        value={resources.knowledge || 0}
        intensity={intensities.knowledge || 0}
        maxValue={maxValue}
      />
    </div>
  );
}


