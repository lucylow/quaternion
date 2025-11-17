import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Eye,
  Sparkles
} from "lucide-react";
import { useState } from "react";

interface ChecklistItem {
  priority: string;
  feature: string;
  timeframe: string;
  aiTools: string;
  judgeImpact: string;
}

const implementationChecklist: ChecklistItem[] = [
  {
    priority: "P0 - Critical",
    feature: "Web-playable build (Rosebud AI / Itch.io)",
    timeframe: "Week 1",
    aiTools: "Rosebud AI / Itch.io",
    judgeImpact: "Playable in browser without download"
  },
  {
    priority: "P0 - Critical",
    feature: "Core RTS gameplay (units, resources, terrain)",
    timeframe: "Weeks 1-2",
    aiTools: "Unity Engine",
    judgeImpact: "Core gameplay loop (clear goals, feedback)"
  },
  {
    priority: "P0 - Critical",
    feature: "Procedural map generation (seed-based)",
    timeframe: "Week 2",
    aiTools: "Luma AI, Google AI Pro",
    judgeImpact: "Each match feels different; strategic depth"
  },
  {
    priority: "P1 - High",
    feature: "AI opponent with behavior tree",
    timeframe: "Week 3",
    aiTools: "Google AI Pro, ML models",
    judgeImpact: "Opponent adapts; makes intelligent decisions"
  },
  {
    priority: "P1 - High",
    feature: "ElevenLabs voice integration (2-3 lines)",
    timeframe: "Week 3",
    aiTools: "ElevenLabs TTS API",
    judgeImpact: "Voiced narration; immersive atmosphere"
  },
  {
    priority: "P1 - High",
    feature: "Dynamic terrain events (LLM-generated)",
    timeframe: "Week 3-4",
    aiTools: "Saga AI, Google AI Pro, ElevenLabs",
    judgeImpact: "Reactive world; narrative context to events"
  },
  {
    priority: "P2 - Important",
    feature: "Adaptive music (Fuser integration)",
    timeframe: "Week 4",
    aiTools: "Fuser API",
    judgeImpact: "Music matches game tension; not jarring"
  },
  {
    priority: "P2 - Important",
    feature: "Commander personality system",
    timeframe: "Week 3-4",
    aiTools: "Saga AI, Google AI Pro",
    judgeImpact: "Distinct opponent personalities; replayable"
  },
  {
    priority: "P2 - Important",
    feature: "NPC trader interactions",
    timeframe: "Week 4",
    aiTools: "Saga AI for dialogue",
    judgeImpact: "Living world; NPCs respond to player"
  },
  {
    priority: "P3 - Nice-to-Have",
    feature: "Custom voice cloning for commanders",
    timeframe: "Week 5 (optional)",
    aiTools: "ElevenLabs Voice Cloning",
    judgeImpact: "Premium voice production"
  },
  {
    priority: "P3 - Nice-to-Have",
    feature: "Procedural asset generation (OpenArt pipeline)",
    timeframe: "Week 5 (optional)",
    aiTools: "OpenArt, Magnific, Mago Studio",
    judgeImpact: "Cohesive, professional visual aesthetic"
  }
];

const getPriorityColor = (priority: string) => {
  if (priority.includes("P0")) return "bg-red-500/20 text-red-400 border-red-500/50";
  if (priority.includes("P1")) return "bg-orange-500/20 text-orange-400 border-orange-500/50";
  if (priority.includes("P2")) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
  return "bg-blue-500/20 text-blue-400 border-blue-500/50";
};

const getPriorityIcon = (priority: string) => {
  if (priority.includes("P0")) return AlertCircle;
  if (priority.includes("P1")) return AlertCircle;
  if (priority.includes("P2")) return Clock;
  return Sparkles;
};

export default function AIImplementationChecklist() {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const toggleComplete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedItems(newCompleted);
  };

  const completionStats = {
    p0: implementationChecklist.filter((item, idx) => 
      item.priority.includes("P0") && completedItems.has(idx)
    ).length,
    p0Total: implementationChecklist.filter(item => item.priority.includes("P0")).length,
    p1: implementationChecklist.filter((item, idx) => 
      item.priority.includes("P1") && completedItems.has(idx)
    ).length,
    p1Total: implementationChecklist.filter(item => item.priority.includes("P1")).length,
    p2: implementationChecklist.filter((item, idx) => 
      item.priority.includes("P2") && completedItems.has(idx)
    ).length,
    p2Total: implementationChecklist.filter(item => item.priority.includes("P2")).length,
    p3: implementationChecklist.filter((item, idx) => 
      item.priority.includes("P3") && completedItems.has(idx)
    ).length,
    p3Total: implementationChecklist.filter(item => item.priority.includes("P3")).length,
  };

  const totalCompleted = completedItems.size;
  const totalProgress = (totalCompleted / implementationChecklist.length) * 100;

  // Group items by priority with their original indices
  const groupedItems = {
    p0: implementationChecklist.map((item, idx) => ({ item, idx })).filter(({ item }) => item.priority.includes("P0")),
    p1: implementationChecklist.map((item, idx) => ({ item, idx })).filter(({ item }) => item.priority.includes("P1")),
    p2: implementationChecklist.map((item, idx) => ({ item, idx })).filter(({ item }) => item.priority.includes("P2")),
    p3: implementationChecklist.map((item, idx) => ({ item, idx })).filter(({ item }) => item.priority.includes("P3")),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold text-primary">AI Features Implementation Checklist</h2>
          <Sparkles className="w-8 h-8 text-secondary" />
        </div>
        <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
          Prioritized roadmap for implementing AI-powered features in Quaternion. Track progress and see what judges will experience.
        </p>
        
        {/* Overall Progress */}
        <Card className="bg-card/70 border-primary/30 max-w-2xl mx-auto mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-primary mb-1">Overall Progress</h3>
                <p className="text-sm text-muted-foreground">
                  {totalCompleted} of {implementationChecklist.length} features completed
                </p>
              </div>
              <div className="text-3xl font-bold text-primary">
                {Math.round(totalProgress)}%
              </div>
            </div>
            <Progress value={totalProgress} className="h-3 mb-4" />
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <span className="font-semibold text-primary">P0</span>
                </div>
                <p className="text-muted-foreground">
                  {completionStats.p0}/{completionStats.p0Total}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3 h-3 text-orange-400" />
                  <span className="font-semibold text-primary">P1</span>
                </div>
                <p className="text-muted-foreground">
                  {completionStats.p1}/{completionStats.p1Total}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-yellow-400" />
                  <span className="font-semibold text-primary">P2</span>
                </div>
                <p className="text-muted-foreground">
                  {completionStats.p2}/{completionStats.p2Total}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span className="font-semibold text-primary">P3</span>
                </div>
                <p className="text-muted-foreground">
                  {completionStats.p3}/{completionStats.p3Total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Groups */}
      {[
        { key: "p0" as const, title: "P0 - Critical", description: "Must-have features for core gameplay" },
        { key: "p1" as const, title: "P1 - High", description: "Important features for competitive entry" },
        { key: "p2" as const, title: "P2 - Important", description: "Enhanced features for standout experience" },
        { key: "p3" as const, title: "P3 - Nice-to-Have", description: "Optional polish and premium features" },
      ].map((group) => {
        const itemsWithIndices = groupedItems[group.key];
        const groupIndices = itemsWithIndices.map(({ idx }) => idx);
        const groupCompleted = groupIndices.filter(idx => completedItems.has(idx)).length;
        const groupProgress = (groupCompleted / itemsWithIndices.length) * 100;

        return (
          <div key={group.key} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
                  {itemsWithIndices[0] && getPriorityIcon(itemsWithIndices[0].item.priority) && (
                    (() => {
                      const Icon = getPriorityIcon(itemsWithIndices[0].item.priority);
                      return <Icon className="w-6 h-6" />;
                    })()
                  )}
                  {group.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(groupProgress)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {groupCompleted}/{itemsWithIndices.length} completed
                </p>
              </div>
            </div>
            
            <Progress value={groupProgress} className="h-2 mb-4" />
            
            <div className="grid md:grid-cols-1 gap-4">
              {itemsWithIndices.map(({ item, idx: originalIndex }) => {
                const isExpanded = expandedItems.has(originalIndex);
                const isCompleted = completedItems.has(originalIndex);
                const PriorityIcon = getPriorityIcon(item.priority);

                return (
                  <Card
                    key={originalIndex}
                    className={`bg-card/70 border-primary/30 hover:border-primary transition-all cursor-pointer ${
                      isCompleted ? "opacity-75" : ""
                    } ${isExpanded ? "shadow-lg shadow-primary/20" : ""}`}
                    onClick={() => toggleExpand(originalIndex)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Completion Checkbox */}
                        <button
                          onClick={(e) => toggleComplete(originalIndex, e)}
                          className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                            isCompleted
                              ? "bg-primary border-primary"
                              : "border-primary/50 hover:border-primary"
                          }`}
                        >
                          {isCompleted && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                        </button>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <h4 className={`text-lg font-bold mb-2 ${isCompleted ? "line-through text-muted-foreground" : "text-primary"}`}>
                                {item.feature}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge className={getPriorityColor(item.priority)}>
                                  <PriorityIcon className="w-3 h-3 mr-1" />
                                  {item.priority}
                                </Badge>
                                <Badge variant="outline" className="border-primary/30 text-primary">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {item.timeframe}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="space-y-4 mt-4 pt-4 border-t border-primary/20">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Wrench className="w-4 h-4 text-secondary" />
                                  <span className="text-sm font-semibold text-primary">AI Tools Involved:</span>
                                </div>
                                <p className="text-sm text-muted-foreground ml-6">
                                  {item.aiTools}
                                </p>
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Eye className="w-4 h-4 text-secondary" />
                                  <span className="text-sm font-semibold text-primary">What Judges See:</span>
                                </div>
                                <p className="text-sm text-muted-foreground ml-6 italic">
                                  {item.judgeImpact}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Expand Icon */}
                        <div className="flex-shrink-0 text-primary/50">
                          {isExpanded ? (
                            <span className="text-xs">▼</span>
                          ) : (
                            <span className="text-xs">▶</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Export/Summary Section */}
      <Card className="bg-card/70 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Implementation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-primary mb-3">Quick Stats</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Total Features: {implementationChecklist.length}</li>
                <li>• Critical (P0): {completionStats.p0Total} items</li>
                <li>• High Priority (P1): {completionStats.p1Total} items</li>
                <li>• Important (P2): {completionStats.p2Total} items</li>
                <li>• Nice-to-Have (P3): {completionStats.p3Total} items</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-3">Timeline Overview</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Week 1: Web deployment, core gameplay</li>
                <li>• Week 2: Procedural generation</li>
                <li>• Week 3: AI opponent, voice, events</li>
                <li>• Week 4: Music, personalities, NPCs</li>
                <li>• Week 5: Optional premium features</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
