/**
 * Accessibility Settings Component
 * Provides accessibility options for players
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Eye, Volume2, Keyboard } from 'lucide-react';

export interface AccessibilitySettings {
  highContrast: boolean;
  colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  subtitles: boolean;
  subtitleSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
  keyboardNavigation: boolean;
  reduceMotion: boolean;
  cameraShake: boolean;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  colorblindMode: 'none',
  subtitles: true,
  subtitleSize: 'medium',
  screenReader: false,
  keyboardNavigation: true,
  reduceMotion: false,
  cameraShake: true,
};

export function AccessibilitySettingsPanel() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
    
    // Apply settings to document
    applyAccessibilitySettings(newSettings);
  };

  const applyAccessibilitySettings = (settings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);
    
    // Colorblind mode
    root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    if (settings.colorblindMode !== 'none') {
      root.classList.add(`colorblind-${settings.colorblindMode}`);
    }
    
    // Reduce motion
    root.classList.toggle('reduce-motion', settings.reduceMotion);
    
    // Subtitle size
    root.setAttribute('data-subtitle-size', settings.subtitleSize);
  };

  // Apply on mount
  useEffect(() => {
    applyAccessibilitySettings(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Accessibility Settings
        </CardTitle>
        <CardDescription>
          Customize the game experience to your needs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Visual
          </h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="high-contrast">High Contrast Mode</Label>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={(checked) => updateSetting('highContrast', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="colorblind">Colorblind Mode</Label>
            <select
              id="colorblind"
              value={settings.colorblindMode}
              onChange={(e) => updateSetting('colorblindMode', e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="none">None</option>
              <option value="protanopia">Protanopia (Red-Blind)</option>
              <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
              <option value="tritanopia">Tritanopia (Blue-Blind)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="reduce-motion">Reduce Motion</Label>
            <Switch
              id="reduce-motion"
              checked={settings.reduceMotion}
              onCheckedChange={(checked) => updateSetting('reduceMotion', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="camera-shake">Camera Shake</Label>
            <Switch
              id="camera-shake"
              checked={settings.cameraShake}
              onCheckedChange={(checked) => updateSetting('cameraShake', checked)}
            />
          </div>
        </div>

        {/* Audio Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Audio
          </h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="subtitles">Subtitles</Label>
            <Switch
              id="subtitles"
              checked={settings.subtitles}
              onCheckedChange={(checked) => updateSetting('subtitles', checked)}
            />
          </div>

          {settings.subtitles && (
            <div className="space-y-2">
              <Label htmlFor="subtitle-size">Subtitle Size</Label>
              <select
                id="subtitle-size"
                value={settings.subtitleSize}
                onChange={(e) => updateSetting('subtitleSize', e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          )}
        </div>

        {/* Input Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Input
          </h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="keyboard-nav">Keyboard Navigation</Label>
            <Switch
              id="keyboard-nav"
              checked={settings.keyboardNavigation}
              onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="screen-reader">Screen Reader Support</Label>
            <Switch
              id="screen-reader"
              checked={settings.screenReader}
              onCheckedChange={(checked) => updateSetting('screenReader', checked)}
            />
          </div>
        </div>

        <Button
          onClick={() => {
            setSettings(defaultSettings);
            localStorage.removeItem('accessibility-settings');
            applyAccessibilitySettings(defaultSettings);
          }}
          variant="outline"
          className="w-full"
        >
          Reset to Defaults
        </Button>
      </CardContent>
    </Card>
  );
}

