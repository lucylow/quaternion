/**
 * Emotional Beat System
 * Manages story pacing and emotional arcs
 */

export enum EmotionalState {
  CURIOUS = 'curious',
  TENSE = 'tense',
  EXCITED = 'excited',
  RELIEF = 'relief',
  SAD = 'sad',
  HOPEFUL = 'hopeful',
  NEUTRAL = 'neutral'
}

export enum EmotionalBeatType {
  REVELATION = 'revelation',
  CONFLICT = 'conflict',
  CATHARSIS = 'catharsis',
  CLIMAX = 'climax',
  TENSION = 'tension'
}

export interface EmotionalBeat {
  id: string;
  type: EmotionalBeatType;
  targetEmotion: EmotionalState;
  targetTension: number; // 0-1
  content: string;
  delay?: number; // seconds
}

export class EmotionalBeatSystem {
  public storyBeats: EmotionalBeat[] = [];
  public currentTension: number = 0.5;
  public currentEmotion: EmotionalState = EmotionalState.NEUTRAL;
  private beatTimer: number = 0;
  private timeBetweenBeats: number = 300; // 5 minutes default

  /**
   * Trigger next beat
   */
  triggerNextBeat(): void {
    if (this.storyBeats.length === 0) return;

    const nextBeat = this.storyBeats.shift()!;
    this.executeBeat(nextBeat);

    // Schedule next beat
    if (this.storyBeats.length > 0) {
      this.timeBetweenBeats = this.calculateBeatInterval(this.currentTension);
    }
  }

  /**
   * Execute emotional beat
   */
  private executeBeat(beat: EmotionalBeat): void {
    switch (beat.type) {
      case EmotionalBeatType.REVELATION:
        this.executeRevelationBeat(beat);
        break;
      case EmotionalBeatType.CONFLICT:
        this.executeConflictBeat(beat);
        break;
      case EmotionalBeatType.CATHARSIS:
        this.executeCatharsisBeat(beat);
        break;
      case EmotionalBeatType.CLIMAX:
        this.executeClimaxBeat(beat);
        break;
      case EmotionalBeatType.TENSION:
        this.executeTensionBeat(beat);
        break;
    }

    // Update emotional state
    this.currentEmotion = beat.targetEmotion;
    this.currentTension = beat.targetTension;

    // Update music and visuals (would integrate with audio/visual systems)
    this.updateAudioVisualState();
  }

  /**
   * Execute revelation beat
   */
  private executeRevelationBeat(beat: EmotionalBeat): void {
    // Reveal important information
    console.log(`Revelation: ${beat.content}`);
    
    // Play dramatic audio
    // AudioManager.Instance.PlayRevelationStinger();
    
    // Update player knowledge
    // PlayerManager.Instance.Player.LearnSecret(beat.content);
  }

  /**
   * Execute conflict beat
   */
  private executeConflictBeat(beat: EmotionalBeat): void {
    console.log(`Conflict: ${beat.content}`);
    // Trigger conflict events, spawn enemies, etc.
  }

  /**
   * Execute catharsis beat
   */
  private executeCatharsisBeat(beat: EmotionalBeat): void {
    console.log(`Catharsis: ${beat.content}`);
    // Provide resolution, rewards, emotional payoff
  }

  /**
   * Execute climax beat
   */
  private executeClimaxBeat(beat: EmotionalBeat): void {
    console.log(`Climax: ${beat.content}`);
    // Peak dramatic moment, final confrontation, etc.
  }

  /**
   * Execute tension beat
   */
  private executeTensionBeat(beat: EmotionalBeat): void {
    console.log(`Tension: ${beat.content}`);
    // Build tension, create suspense
  }

  /**
   * Update audio/visual state
   */
  private updateAudioVisualState(): void {
    // This would integrate with audio and visual systems
    // AudioManager.Instance.SetEmotionalState(this.currentEmotion, this.currentTension);
    // VisualManager.Instance.SetEmotionalFilter(this.currentEmotion);
  }

  /**
   * Calculate beat interval based on tension
   */
  private calculateBeatInterval(tension: number): number {
    // Higher tension = faster beats
    const baseInterval = 300; // 5 minutes
    const tensionModifier = 1 - (tension * 0.5); // 0.5x to 1x speed
    return baseInterval * tensionModifier;
  }

  /**
   * Generate beats for story arc
   */
  generateArcsForStory(arc: { 
    openingHook: string; 
    complications: string[]; 
    climax: string; 
    resolution: string;
  }): void {
    const beats: EmotionalBeat[] = [];

    // Opening - curiosity
    beats.push({
      id: `beat_${Date.now()}_0`,
      type: EmotionalBeatType.REVELATION,
      targetEmotion: EmotionalState.CURIOUS,
      targetTension: 0.3,
      content: arc.openingHook
    });

    // Rising action - tension building
    for (let i = 0; i < arc.complications.length; i++) {
      beats.push({
        id: `beat_${Date.now()}_${i + 1}`,
        type: EmotionalBeatType.CONFLICT,
        targetEmotion: EmotionalState.TENSE,
        targetTension: 0.3 + (i * 0.2),
        content: arc.complications[i]
      });
    }

    // Climax - high tension
    beats.push({
      id: `beat_${Date.now()}_climax`,
      type: EmotionalBeatType.CLIMAX,
      targetEmotion: EmotionalState.EXCITED,
      targetTension: 0.9,
      content: arc.climax
    });

    // Resolution - catharsis
    beats.push({
      id: `beat_${Date.now()}_resolution`,
      type: EmotionalBeatType.CATHARSIS,
      targetEmotion: EmotionalState.RELIEF,
      targetTension: 0.2,
      content: arc.resolution
    });

    this.storyBeats.push(...beats);
  }

  /**
   * Trigger tension beat
   */
  triggerTensionBeat(reason: string): void {
    this.storyBeats.push({
      id: `beat_tension_${Date.now()}`,
      type: EmotionalBeatType.TENSION,
      targetEmotion: EmotionalState.TENSE,
      targetTension: Math.min(1, this.currentTension + 0.2),
      content: reason
    });
  }

  /**
   * Get current state
   */
  getCurrentState(): { emotion: EmotionalState; tension: number } {
    return {
      emotion: this.currentEmotion,
      tension: this.currentTension
    };
  }

  /**
   * Update beat timer (call from game loop)
   */
  update(deltaTime: number): void {
    this.beatTimer += deltaTime;

    if (this.beatTimer >= this.timeBetweenBeats && this.storyBeats.length > 0) {
      this.triggerNextBeat();
      this.beatTimer = 0;
    }
  }
}

