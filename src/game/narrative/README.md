# 📖 Story & Narrative Systems - Making Worlds Entertaining

This comprehensive narrative system adds depth, entertainment, and player-driven storytelling to Quaternion campaigns.

## 🎭 Core Components

### NarrativeManager
The central orchestrator for all narrative systems. Manages:
- World lore and history
- Active story arcs
- Character relationships
- Player reputation
- World state tension

### LoreGenerator
Dynamically generates:
- **Creation Myths**: Poetic origin stories for the world
- **Historical Events**: Major events with causal relationships
- **Current Conflicts**: Active tensions between factions
- **Faction Relationships**: Complex political dynamics
- **World Secrets**: Mysteries waiting to be discovered

### StoryArc System
Interactive story progression with:
- **Story Nodes**: Dialogue, combat, exploration, choice, discovery
- **Player Choices**: Meaningful decisions with immediate and long-term consequences
- **Arc Progression**: Dynamic story advancement based on player actions
- **Completion Rewards**: Unlock abilities, reputation, items

### Character System
Deep character simulation with:
- **Personality Matrix**: Big Five personality traits (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
- **Relationship Tracking**: Dynamic relationships between characters
- **Memory System**: Characters remember interactions and events
- **Mood System**: Characters react emotionally to events
- **Dialogue Trees**: Context-aware conversations based on relationships

### MysterySystem
Discovery and investigation gameplay:
- **Mystery Generation**: Ancient ruins, missing expeditions, magical anomalies, conspiracies
- **Clue System**: Documents, objects, testimony, locations
- **Archaeological Discovery**: Uncover historical events through evidence
- **Mystery Resolution**: Solve mysteries for unique rewards

### PlayerDrivenNarrative
Player legacy and emergent storytelling:
- **Legacy Events**: Track significant player actions
- **Emergent Story Arcs**: Generate stories based on player choices
- **Reputation System**: Faction relationships, hero/enemy status
- **Consequence System**: Immediate and delayed effects of actions

### EmotionalBeatSystem
Story pacing and emotional arcs:
- **Emotional Beats**: Revelation, conflict, catharsis, climax, tension
- **Dynamic Pacing**: Beat intervals adjust based on tension
- **Emotional States**: Curious, tense, excited, relief, sad, hopeful
- **Story Arc Generation**: Automatically generate beats for campaigns

### WorldStateNarrative
Living, breathing world:
- **Faction Relationships**: Dynamic political relationships
- **War System**: Factions can go to war or form alliances
- **World Events**: Disasters, discoveries, festivals, conflicts
- **Player Intervention**: Players can influence wars and events
- **Global Tension**: World-wide tension tracking

## 🚀 Usage

### Basic Setup

```typescript
import { NarrativeManager } from './narrative/NarrativeManager';
import { EmotionalBeatSystem } from './narrative/EmotionalBeatSystem';
import { CampaignSystem } from './campaigns/CampaignSystem';

// Initialize narrative systems
const narrativeManager = new NarrativeManager({
  provider: 'google',
  apiKey: process.env.GOOGLE_AI_API_KEY
});

const emotionalBeats = new EmotionalBeatSystem();

// Initialize campaign system with narrative integration
const campaignSystem = new CampaignSystem(narrativeManager, emotionalBeats);

// Start a campaign
const state = await campaignSystem.startCampaign('archive', 913027);
```

### Using Narrative Features in Campaigns

```typescript
// Get active story arcs
const activeArcs = narrativeManager.getActiveArcs();

// Get character
const character = narrativeManager.getCharacter('mara');
if (character) {
  // Update relationship
  character.updateRelationship('player', 10, 'Player helped character');
  
  // Get dialogue response
  const response = character.getDialogueResponse('bio_seed', 50, 0.7);
}

// Discover a mystery clue
const clue = {
  clueId: 'clue_1',
  description: 'Ancient inscriptions found',
  type: ClueType.DOCUMENT,
  worldLocation: { x: 100, y: 200 },
  relatedMysteryIds: ['mystery_ancient_ruins'],
  reliability: 85,
  source: 'Ancient Ruins'
};
mysterySystem.onClueDiscovered(clue, 'player');

// Record player action
narrativeManager.recordPlayerChoice({
  id: 'choice_1',
  choiceId: 'harvest_or_preserve',
  option: 'harvest',
  timestamp: Date.now(),
  consequences: ['Bio-seed health decreased']
});

// Update emotional beats
emotionalBeats.update(deltaTime);
const currentState = emotionalBeats.getCurrentState();
```

## 🎮 Integration Points

### With Campaign System
- Campaigns automatically generate emotional beats
- Character personalities are created from campaign characters
- Player choices are tracked in the narrative system
- Reputation updates based on moral choices

### With Game Loop
```typescript
// In game update loop
function update(deltaTime: number) {
  // Update emotional beats
  emotionalBeats.update(deltaTime);
  
  // Update world state narrative
  await worldStateNarrative.updateWorldState(deltaTime);
  
  // Check for story triggers
  const activeArcs = narrativeManager.getActiveArcs();
  for (const arc of activeArcs) {
    // Check if arc should advance
  }
}
```

### With UI
- Display narrative events
- Show character relationships
- Present mystery clues
- Show emotional state
- Display world events

## 📊 Features

### Dynamic Story Generation
- LLM-powered story arcs
- Emergent narratives based on player actions
- Procedural mysteries and discoveries
- Context-aware dialogue

### Character Depth
- Personality-driven behavior
- Relationship dynamics
- Memory system
- Emotional reactions

### Player Agency
- Choices have lasting consequences
- Reputation affects gameplay
- Legacy system tracks player impact
- Emergent stories from player actions

### World Simulation
- Faction relationships evolve
- Wars and alliances form dynamically
- Global tension affects events
- World responds to player actions

## 🔧 Configuration

### LLM Provider
The system supports multiple LLM providers:
- Google AI (Gemini)
- OpenAI
- Saga AI

Configure in `NarrativeManager` constructor:
```typescript
const narrativeManager = new NarrativeManager({
  provider: 'google',
  apiKey: 'your-api-key',
  temperature: 0.7,
  maxTokens: 500
});
```

### Emotional Beat Timing
Adjust beat intervals in `EmotionalBeatSystem`:
```typescript
emotionalBeats.timeBetweenBeats = 300; // 5 minutes
```

### Mystery Difficulty
Configure mystery generation in `MysterySystem`:
```typescript
mysterySystem.mysterySpawnChance = 0.1; // 10% chance
```

## 📝 Examples

### Creating a Custom Story Arc
```typescript
const arc = await StoryArc.generateArc(
  llm,
  'custom_arc_1',
  seed,
  worldLore
);
narrativeManager.activeArcs.push(arc);
arc.startArc();
```

### Generating World Lore
```typescript
const lore = await loreGenerator.generateWorldLore(seed, {
  worldType: 'fantasy',
  dominantBiomes: ['forest', 'mountains'],
  magicLevel: 0.8,
  techLevel: 0.3
});
```

### Solving a Mystery
```typescript
const solved = await mysterySystem.solveMystery('mystery_ancient_ruins', 'player');
if (solved) {
  console.log('Mystery solved!');
}
```

## 🎯 Best Practices

1. **Initialize Early**: Set up narrative systems before starting campaigns
2. **Update Regularly**: Call update methods in game loop
3. **Track Choices**: Record all significant player choices
4. **Balance Tension**: Use emotional beats to maintain engagement
5. **React to Player**: Let world state respond to player actions
6. **Cache LLM Calls**: Use deterministic seeds for reproducible content

## 🔮 Future Enhancements

- Multi-run campaign persistence
- Character relationship visualization
- Advanced dialogue generation
- Procedural quest generation
- Narrative analytics and metrics
- Player story replay system
