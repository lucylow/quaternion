import { Button } from '@/components/ui/button';
import { Download, FileText, Globe } from 'lucide-react';
import { ChronicleExport } from '@/game/narrative/AIStoryGenerator';

interface ChronicleExporterProps {
  chronicle: ChronicleExport;
  onExport?: (format: 'pdf' | 'html' | 'json') => void;
}

export function ChronicleExporter({ chronicle, onExport }: ChronicleExporterProps) {
  const exportAsJSON = () => {
    const dataStr = JSON.stringify(chronicle, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronicle-${chronicle.seed}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onExport?.('json');
  };

  const exportAsHTML = () => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${chronicle.title}</title>
  <style>
    body {
      font-family: 'Orbitron', sans-serif;
      background: hsl(220, 40%, 5%);
      color: hsl(180, 100%, 95%);
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.6;
    }
    h1 { color: hsl(180, 100%, 50%); }
    h2 { color: hsl(180, 70%, 60%); margin-top: 2rem; }
    .chapter { margin: 2rem 0; padding: 1rem; border-left: 3px solid hsl(180, 100%, 50%); }
    .ending { font-style: italic; color: hsl(180, 80%, 70%); }
  </style>
</head>
<body>
  <h1>${chronicle.title}</h1>
  <p><strong>Seed:</strong> ${chronicle.seed}</p>
  <p>${chronicle.intro}</p>
  
  ${chronicle.chapters.map(ch => `
    <div class="chapter">
      <h2>${ch.title}</h2>
      <p>${ch.content}</p>
      <small>Timeline: ${ch.timestamp}</small>
    </div>
  `).join('')}
  
  <div class="ending">
    <h2>Ending</h2>
    <p>${chronicle.ending}</p>
  </div>
  
  <p><em>${chronicle.epilogue}</em></p>
</body>
</html>`;
    
    const dataBlob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronicle-${chronicle.seed}.html`;
    link.click();
    URL.revokeObjectURL(url);
    onExport?.('html');
  };

  const exportAsPDF = () => {
    // For PDF, we'll use the browser's print functionality
    // In a production app, you might want to use a library like jsPDF
    window.print();
    onExport?.('pdf');
  };

  return (
    <div className="bg-background border border-border rounded-lg p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">{chronicle.title}</h2>
      <p className="text-muted-foreground mb-4">{chronicle.intro}</p>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Chapters</h3>
        {chronicle.chapters.map((chapter, idx) => (
          <div key={idx} className="border-l-2 border-primary pl-4 py-2">
            <h4 className="font-medium">{chapter.title}</h4>
            <p className="text-sm text-muted-foreground">{chapter.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t">
        <p className="text-muted-foreground italic">{chronicle.ending}</p>
        <p className="text-sm mt-2">{chronicle.epilogue}</p>
      </div>

      <div className="flex gap-2 mt-6">
        <Button onClick={exportAsJSON} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export JSON
        </Button>
        <Button onClick={exportAsHTML} variant="outline" size="sm">
          <Globe className="w-4 h-4 mr-2" />
          Export HTML
        </Button>
        <Button onClick={exportAsPDF} variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>
    </div>
  );
}

