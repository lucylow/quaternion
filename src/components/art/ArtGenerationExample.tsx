/**
 * Art Generation Example Component
 * Demonstrates how to use ImagineArt and Dreamina for generating game assets
 */

import { useState } from 'react';
import { artGenerationService } from '@/lib/api';
import type { TextureGenerationRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ArtGenerationExample() {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'texture' | 'concept' | 'sprite' | 'background'>('texture');
  const [theme, setTheme] = useState<'matter' | 'energy' | 'life' | 'knowledge'>('knowledge');
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('high');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const request: TextureGenerationRequest = {
        prompt,
        type,
        theme,
        quality,
        gameEntity: 'example',
      };

      const response = await artGenerationService.generateArt(request);
      setResult({
        url: response.imageUrl,
        id: response.imageId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Art Generation Example</CardTitle>
        <CardDescription>
          Generate textures and concept images using ImagineArt and Dreamina
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Input
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., steel mechanical texture, industrial"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="texture">Texture</SelectItem>
                <SelectItem value="concept">Concept</SelectItem>
                <SelectItem value="sprite">Sprite</SelectItem>
                <SelectItem value="background">Background</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="matter">Matter</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="life">Life</SelectItem>
                <SelectItem value="knowledge">Knowledge</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quality">Quality</Label>
          <Select value={quality} onValueChange={(v) => setQuality(v as any)}>
            <SelectTrigger id="quality">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="ultra">Ultra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? 'Generating...' : 'Generate Art'}
        </Button>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-2">
            <Label>Generated Image</Label>
            <div className="border rounded-md overflow-hidden">
              <img
                src={result.url}
                alt="Generated"
                className="w-full h-auto"
                onError={() => setError('Failed to load generated image')}
              />
            </div>
            <p className="text-sm text-muted-foreground">ID: {result.id}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

