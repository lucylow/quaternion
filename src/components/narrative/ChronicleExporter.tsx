/**
 * Chronicle Exporter Component
 * Allows players to export their AI-generated story as a digital tale
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, BookOpen, Sparkles } from 'lucide-react';
import { ChronicleExport } from '@/game/narrative/AIStoryGenerator';
import { toast } from 'sonner';

interface ChronicleExporterProps {
  chronicle: ChronicleExport;
  onExport?: (format: 'pdf' | 'html' | 'json') => void;
}

export const ChronicleExporter = ({ chronicle, onExport }: ChronicleExporterProps) => {
  const [exporting, setExporting] = useState(false);

  const exportAsPDF = async () => {
    setExporting(true);
    try {
      // Generate PDF content
      const htmlContent = generateHTMLContent(chronicle);
      
      // Use browser print to PDF (or integrate with a PDF library)
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
        toast.success('Chronicle exported as PDF');
      }
      
      onExport?.('pdf');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const exportAsHTML = () => {
    try {
      const htmlContent = generateHTMLContent(chronicle);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quaternion-chronicle-${chronicle.seed}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Chronicle exported as HTML');
      onExport?.('html');
    } catch (error) {
      toast.error('Failed to export HTML');
      console.error(error);
    }
  };

  const exportAsJSON = () => {
    try {
      const jsonContent = JSON.stringify(chronicle, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quaternion-chronicle-${chronicle.seed}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Chronicle exported as JSON');
      onExport?.('json');
    } catch (error) {
      toast.error('Failed to export JSON');
      console.error(error);
    }
  };

  const generateHTMLContent = (chronicle: ChronicleExport): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${chronicle.title} - Quaternion Chronicle</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 100%);
      color: #e0e0e0;
      line-height: 1.8;
      padding: 2rem;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: rgba(20, 20, 40, 0.9);
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    h1 {
      font-size: 2.5rem;
      background: linear-gradient(135deg, #00ffea 0%, #9d4edd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
      text-align: center;
    }
    .subtitle {
      text-align: center;
      color: #888;
      margin-bottom: 3rem;
      font-size: 0.9rem;
    }
    .intro {
      font-size: 1.2rem;
      font-style: italic;
      color: #b0b0b0;
      margin-bottom: 3rem;
      padding: 1.5rem;
      background: rgba(0, 255, 234, 0.1);
      border-left: 4px solid #00ffea;
      border-radius: 4px;
    }
    .chapter {
      margin-bottom: 3rem;
      padding: 1.5rem;
      background: rgba(157, 78, 221, 0.1);
      border-radius: 8px;
      border-left: 4px solid #9d4edd;
    }
    .chapter-title {
      font-size: 1.3rem;
      color: #9d4edd;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    .chapter-content {
      color: #d0d0d0;
      line-height: 1.9;
    }
    .ending {
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
      margin: 3rem 0;
      padding: 2rem;
      background: linear-gradient(135deg, rgba(0, 255, 234, 0.2) 0%, rgba(157, 78, 221, 0.2) 100%);
      border-radius: 8px;
      color: #00ffea;
    }
    .epilogue {
      font-style: italic;
      text-align: center;
      color: #888;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #333;
    }
    .scene {
      margin: 2rem 0;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      font-size: 0.95rem;
    }
    .scene-title {
      color: #00ffea;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .footer {
      text-align: center;
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid #333;
      color: #666;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${chronicle.title}</h1>
    <div class="subtitle">Seed: ${chronicle.seed} | Timeline: ${chronicle.timeline}</div>
    
    <div class="intro">${chronicle.intro}</div>
    
    ${chronicle.chapters.map((chapter, idx) => `
      <div class="chapter">
        <div class="chapter-title">Chapter ${idx + 1}: ${chapter.title}</div>
        <div class="chapter-content">${chapter.content}</div>
      </div>
    `).join('')}
    
    ${chronicle.visualScenes.map((scene, idx) => `
      <div class="scene">
        <div class="scene-title">Scene ${idx + 1}: ${scene.biome}</div>
        <div>${scene.description}</div>
        <div style="margin-top: 0.5rem; color: #666; font-size: 0.85rem;">Mood: ${scene.mood}</div>
      </div>
    `).join('')}
    
    <div class="ending">${chronicle.ending}</div>
    
    <div class="epilogue">${chronicle.epilogue}</div>
    
    <div class="footer">
      <p>Generated by Quaternion AI Storytelling System</p>
      <p>Soundtrack: ${chronicle.soundtrack.description}</p>
      <p>Tools: Saga AI, Google AI Pro, ElevenLabs, Fuser AI</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  };

  return (
    <Card className="bg-card/90 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Chronicle Mode
        </CardTitle>
        <CardDescription>
          Export your AI-generated story as a digital tale
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{chronicle.title}</h3>
          <p className="text-sm text-muted-foreground">
            Seed: {chronicle.seed} | Timeline: {chronicle.timeline}
          </p>
          <p className="text-sm italic text-muted-foreground mt-2">{chronicle.intro}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={exportAsPDF}
            disabled={exporting}
            className="flex-1 min-w-[120px]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={exportAsHTML}
            disabled={exporting}
            variant="outline"
            className="flex-1 min-w-[120px]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export HTML
          </Button>
          <Button
            onClick={exportAsJSON}
            disabled={exporting}
            variant="outline"
            className="flex-1 min-w-[120px]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-2 pt-2 border-t">
          <Sparkles className="w-3 h-3" />
          <span>AI-generated using Saga AI, Google AI Pro, ElevenLabs, and Fuser AI</span>
        </div>
      </CardContent>
    </Card>
  );
};

