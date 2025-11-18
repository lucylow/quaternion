# AI-Driven Narrative System

Complete implementation of AI-driven narrative design for Quaternion Strategy Game, featuring dynamic story generation, character AI, emotional pacing, adaptive branching, and procedural dialogue.

## 🧠 Core Architecture

### Components

1. **AINarrativeDirector** - Main orchestrator for all narrative systems
2. **StoryWeaver** - Dynamic story and plot twist generation
3. **CharacterAI** - Personality-driven character behavior and memory
4. **EmotionalPacingDirector** - Story beat management and emotional pacing
5. **AdaptiveStorytelling** - Dynamic narrative branching based on player actions
6. **AIDialogueSystem** - Procedural, character-voiced dialogue generation
7. **AIQuestGenerator** - Personalized quest generation
8. **NarrativeAnalytics** - Player choice tracking and narrative insights

## 📖 Features

### Dynamic Story Generation

- **Emergent Storylines**: AI generates storylines that connect to player actions
- **Plot Twists**: Surprising but believable twists that change perspective
- **World Model**: Tracks factions, events, tensions, and active characters
- **Player Modeling**: Tracks archetype, playstyle, moral alignment, and emotions

### Character AI

- **Personality Matrix**: OCEAN traits + custom traits (curiosity, ambition, loyalty)
- **Memory System**: Characters remember player interactions and world events
- **Relationship Tracking**: Dynamic relationships that evolve based on actions
- **Emotional States**: Characters react emotionally to events
- **Goal-Driven Behavior**: Characters pursue goals based on personality

### Emotional Pacing

- **Story Beats**: Dynamic emotional moments triggered by conditions
- **Pacing Management**: Automatically adjusts narrative pacing based on world state
- **Character Reactions**: Characters react to emotional beats
- **Atmospheric Transitions**: Smooth emotional transitions throughout story

### Adaptive Branching

- **Condition-Based Branches**: Branches unlock based on player choices and world state
- **Relevance Scoring**: Branches scored by alignment, drama, and coherence
- **Variety Selection**: Weighted random selection prevents repetitive paths
- **Dynamic Generation**: New branches generated based on player actions

### Procedural Dialogue

- **Character Voices**: Unique speech patterns, vocabulary, and formality per character
- **Contextual Dialogue**: Dialogue adapts to situation, relationship, and emotion
- **Player Options**: AI-generated dialogue options that match player archetype
- **Voice Application**: LLM rewrites dialogue to match character voice

### Quest Generation

- **Personalized Quests**: Quests match player archetype, playstyle, and recent actions
- **Quest Variants**: Multiple variants of same quest structure
- **Difficulty Adjustment**: Quests adjust to player skill level
- **Moral Choices**: Meaningful choices with consequences

### Analytics & Learning

- **Choice Tracking**: Records all player choices with context and outcomes
- **Engagement Metrics**: Tracks time spent, choices made, emotional responses
- **Pattern Detection**: Identifies player preference patterns by archetype
- **Narrative Insights**: LLM-generated insights for narrative improvement
- **Choice Prediction**: Predicts likely player choices for narrative preparation

## 🚀 Usage

### Basic Setup

```typescript
import { AINarrativeDirector } from '@/game/narrative';
import { LLMIntegration } from '@/ai/integrations/LLMIntegration';
import { MemoryManager } from '@/ai/memory/MemoryManager';

// Initialize LLM
const llm = new LLMIntegration({
  provider: 'google', // or 'openai', 'saga'
  apiKey: process.env.LLM_API_KEY,
  temperature: 0.8,
  maxTokens: 1000
});

// Initialize memory
const memory = new MemoryManager();

// Create narrative director
const narrative = new AINarrativeDirector(llm, memory);

// Initialize with world seed
await narrative.initializeNarrativeAI(worldSeed);
```

### Recording Player Actions

```typescript
// Record player actions
narrative.recordPlayerAction('Built a factory', 'expanded_industry');

// Get narrative state
const state = narrative.getNarrativeState();
console.log(state.activeStorylines);
console.log(state.currentTension);
```

### Generating Storylines

```typescript
// Storylines are generated automatically by the director
// But you can also generate manually:
const storyWeaver = new StoryWeaver(llm, memory);
const storyline = await storyWeaver.generateEmergentStoryline(
  narrative.worldModel,
  narrative.playerProfile
);
```

### Character Interaction

```typescript
import { CharacterAI } from '@/game/narrative';

const characterAI = new CharacterAI(llm, memory);

// Create a character
const character = characterAI.createCharacter('advisor_1', {
  openness: 0.8,
  conscientiousness: 0.7,
  extraversion: 0.6,
  agreeableness: 0.9,
  curiosity: 0.8
});

// Generate dialogue
const dialogue = await characterAI.generateDialogue(
  'advisor_1',
  'resource allocation',
  worldModel,
  playerProfile
);

// Process player interaction
characterAI.processPlayerInteraction('advisor_1', {
  description: 'Player helped the character',
  emotionalImpact: 0.8,
  type: 'helpful'
});
```

### Emotional Pacing

```typescript
import { EmotionalPacingDirector } from '@/game/narrative';

const pacing = new EmotionalPacingDirector(llm, (beat) => {
  // Execute beat: play audio, show UI, etc.
  console.log('Emotional beat:', beat);
});

// Update pacing (call in game loop)
await pacing.updateEmotionalPacing(worldModel, playerProfile);

// Get current state
const state = pacing.getCurrentState();
console.log(state.pacing, state.dominantEmotion);
```

### Adaptive Branching

```typescript
import { AdaptiveStorytelling } from '@/game/narrative';

const storytelling = new AdaptiveStorytelling(llm, (oldBranch, newBranch) => {
  // Handle branch transition
  console.log('Transitioning to:', newBranch.title);
});

// Evaluate next branch (call periodically)
await storytelling.evaluateNextBranch(playerProfile, worldModel);

// Get current branch
const currentBranch = storytelling.getCurrentBranch();
```

### Dialogue System

```typescript
import { AIDialogueSystem } from '@/game/narrative';

const dialogue = new AIDialogueSystem(llm);

// Register character voice
dialogue.registerCharacterVoice({
  characterId: 'advisor_1',
  personalityTraits: ['curious', 'compassionate'],
  speechPatterns: ['direct', 'polite'],
  catchphrases: ['I see.', 'Very interesting.'],
  emotionalTendencies: {},
  formalityLevel: 0.7,
  verbosity: 0.6
});

// Generate dialogue
const response = await dialogue.generateContextualDialogue(
  'advisor_1',
  'recent events',
  worldModel,
  playerProfile,
  characterEmotion
);

// Generate dialogue options for player
const options = await dialogue.generateDialogueOptions(
  playerProfile,
  'advisor_1',
  worldModel,
  ['resources', 'strategy', 'recent events']
);
```

### Quest Generation

```typescript
import { AIQuestGenerator } from '@/game/narrative';

const questGen = new AIQuestGenerator(llm, memory);

// Generate personalized quest
const quest = await questGen.generatePersonalizedQuest(
  playerProfile,
  worldModel,
  availableCharacters
);

// Generate variants
const variants = await questGen.generateQuestVariants(quest, 3);

// Adjust difficulty
const adjusted = await questGen.adjustQuestDifficulty(quest, playerProfile);
```

### Analytics

```typescript
import { NarrativeAnalytics } from '@/game/narrative';

const analytics = new NarrativeAnalytics(llm);

// Record player choice
analytics.recordPlayerChoice({
  choiceId: 'choice_1',
  context: 'Resource allocation decision',
  optionSelected: 'expand_industry',
  optionsAvailable: ['expand_industry', 'preserve_environment', 'balance'],
  decisionTime: 3500,
  playerArchetype: 'strategist',
  playerEmotion: { type: 'neutral', intensity: 0.5, getPacingModifier: () => 0 },
  outcomes: { resources: 50, tension: -10 },
  timestamp: Date.now()
});

// Generate insights
const insights = await analytics.generateNarrativeInsights();

// Predict player choice
const prediction = await analytics.predictPlayerChoice(
  'Resource allocation decision',
  ['expand', 'preserve', 'balance'],
  playerProfile
);
```

## 🔧 Integration with Existing Systems

### With Game State

```typescript
import { NarrativeIntegration } from '@/game/narrative/NarrativeIntegration';

const integration = createNarrativeIntegration(gameState, {
  provider: 'google',
  apiKey: process.env.LLM_API_KEY
});

await integration.initialize(worldSeed);

// Record actions
integration.recordPlayerAction('Built factory', 'expansion');
```

### With Advisor System

The narrative system integrates with the existing `AdvisorTensionSystem`:

```typescript
// Advisors can be converted to AI characters
const advisorCharacter = characterAI.createCharacter('LIRA', {
  openness: 0.7,
  conscientiousness: 0.9,
  extraversion: 0.8,
  agreeableness: 0.5,
  baseAggression: 0.8,
  baseCaution: 0.2
});
```

### With Campaign System

Narrative events can be integrated with the campaign system:

```typescript
// Generate narrative events from storylines
const storyline = narrative.activeStorylines[0];
const narrativeEvent = {
  event: storyline.title,
  trigger: 'active_storyline',
  flavor: storyline.hook,
  effect: { tension: 20 },
  narrativeTag: storyline.emotionalArc
};
```

## 📊 Performance Considerations

- **Caching**: LLM responses are cached where possible (map themes, commander personalities)
- **Batching**: Narrative updates run in intervals, not every frame
- **Fallbacks**: All systems have fallback responses when LLM calls fail
- **Token Limits**: Context compression keeps prompts within token limits
- **Rate Limiting**: Consider rate limiting LLM calls in production

## 🎯 Best Practices

1. **Initialize Early**: Initialize narrative systems during game startup
2. **Update Regularly**: Call update methods from game loop (not every frame)
3. **Handle Errors**: Always handle LLM failures gracefully with fallbacks
4. **Monitor Costs**: Track LLM API usage to control costs
5. **Test Offline**: Use fallbacks for testing without API keys
6. **Cache Wisely**: Cache generated content that won't change
7. **Player Privacy**: Consider what data is sent to LLM APIs

## 🎨 Emotional Impact Features

The system creates emotional impact through:

1. **Player-AI Relationships**: NPCs remember and respond to player actions
2. **Moral Ambiguity**: Choices have meaningful consequences
3. **Poetic Narrative**: AI-generated poetic epilogues and ambient text
4. **Atmospheric Sound & Visuals**: Emotional beats trigger audio/visual effects
5. **Emergent Storytelling**: Unique stories on every playthrough
6. **Tension & Collapse**: Dramatic tension from balance/imbalance mechanics

## 📚 API Reference

See individual file documentation:
- `AINarrativeDirector.ts` - Main director
- `StoryWeaver.ts` - Story generation
- `CharacterAI.ts` - Character system
- `EmotionalPacingDirector.ts` - Emotional pacing
- `AdaptiveStorytelling.ts` - Narrative branching
- `AIDialogueSystem.ts` - Dialogue generation
- `AIQuestGenerator.ts` - Quest generation
- `NarrativeAnalytics.ts` - Analytics and learning

## 🔮 Future Enhancements

- Vector database integration for semantic memory search
- Multi-modal LLM support (images, audio)
- Player personality inference from choices
- Automated playtesting with AI agents
- Narrative quality scoring
- Cross-session memory persistence
- Procedural epilogue generation
- Dynamic music/soundtrack integration

