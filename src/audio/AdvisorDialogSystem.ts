/**
 * Advisor Dialog System
 * Manages dialog for the four advisors (Auren, Virel, Lira, Kor) and Core
 * with event triggers, SSML support, and TTS integration
 */

import AudioManager from './AudioManager';
import { requestTtsAudio } from './ttsClient';
import AdvisorVoiceFilter from './AdvisorVoiceFilter';

export type AdvisorName = 'Auren' | 'Virel' | 'Lira' | 'Kor' | 'Core';

export type DialogEvent =
  | 'game_start'
  | 'mission_brief'
  | 'new_objective'
  | 'enemy_spotted'
  | 'resource_low'
  | 'resource_secured'
  | 'unit_under_attack'
  | 'unit_killed'
  | 'ultimate_ready'
  | 'ultimate_fired'
  | 'tech_complete'
  | 'environmental_hazard'
  | 'health_critical'
  | 'victory'
  | 'defeat'
  | 'flavor_ambient'
  | 'taunt';

export interface DialogLine {
  id: string;
  advisor: AdvisorName;
  text: string;
  ssml: string;
  event: DialogEvent;
  emotion?: number; // -1 to +1
  priority?: number; // 0-1, higher = more important
}

export interface DialogConfig {
  enableTTS: boolean;
  enableSubtitles: boolean;
  voiceDucking: boolean;
  cacheAudio: boolean;
}

export class AdvisorDialogSystem {
  private audioManager: AudioManager;
  private voiceFilter: AdvisorVoiceFilter;
  private dialogLines: Map<string, DialogLine> = new Map();
  private audioCache: Map<string, ArrayBuffer> = new Map();
  private recentLines: string[] = []; // Avoid repeats
  private config: DialogConfig;
  private currentPlayback: { id: string; stop: () => void } | null = null;

  constructor(config: Partial<DialogConfig> = {}) {
    this.audioManager = AudioManager.instance();
    this.voiceFilter = AdvisorVoiceFilter.instance();
    this.config = {
      enableTTS: true,
      enableSubtitles: true,
      voiceDucking: true,
      cacheAudio: true,
      ...config
    };
    this.initializeDialogLines();
    
    // Initialize voice filter
    this.voiceFilter.init().catch(err => {
      console.warn('Failed to initialize voice filter:', err);
    });
  }

  /**
   * Initialize all dialog lines for advisors
   */
  private initializeDialogLines(): void {
    // AUREN - The Architect (Matter)
    this.addDialogLine({
      id: 'auren_game_start',
      advisor: 'Auren',
      text: 'Deploy nodes. Build fast. Perfection favors the prepared.',
      ssml: '<speak><voice name="Auren"><prosody rate="0.95">Deploy nodes. Build fast. Perfection favors the prepared.</prosody></voice></speak>',
      event: 'game_start',
      priority: 0.9
    });

    this.addDialogLine({
      id: 'auren_enemy_spotted',
      advisor: 'Auren',
      text: 'Contact north-east. Arm anti-armor and flatten that line.',
      ssml: '<speak><voice name="Auren"><prosody rate="1.0">Contact north-east. <break time="150ms"/>Arm anti-armor and flatten that line.</prosody></voice></speak>',
      event: 'enemy_spotted',
      priority: 0.8
    });

    this.addDialogLine({
      id: 'auren_resource_low',
      advisor: 'Auren',
      text: 'Ore reserves at 14%. Ration construction.',
      ssml: '<speak><voice name="Auren"><prosody rate="0.98"><emphasis level="moderate">Ore reserves at 14%.</emphasis> <break time="200ms"/>Ration construction.</prosody></voice></speak>',
      event: 'resource_low',
      priority: 0.7
    });

    this.addDialogLine({
      id: 'auren_unit_killed',
      advisor: 'Auren',
      text: 'Unit lost. Reallocate production to front-line.',
      ssml: '<speak><voice name="Auren"><prosody rate="0.96">Unit lost. <break time="180ms"/>Reallocate production to front-line.</prosody></voice></speak>',
      event: 'unit_killed',
      priority: 0.6
    });

    this.addDialogLine({
      id: 'auren_ultimate_ready',
      advisor: 'Auren',
      text: 'Overclocking assembly lines — ultimate online.',
      ssml: '<speak><voice name="Auren"><prosody rate="1.0"><emphasis level="strong">Overclocking assembly lines — ultimate online.</emphasis></prosody></voice></speak>',
      event: 'ultimate_ready',
      priority: 0.9
    });

    this.addDialogLine({
      id: 'auren_tech_complete',
      advisor: 'Auren',
      text: 'Blueprints compiled. Construct immediately.',
      ssml: '<speak><voice name="Auren"><prosody rate="0.97">Blueprints compiled. <break time="150ms"/>Construct immediately.</prosody></voice></speak>',
      event: 'tech_complete',
      priority: 0.7
    });

    this.addDialogLine({
      id: 'auren_victory',
      advisor: 'Auren',
      text: 'Order restored. The ledger balances.',
      ssml: '<speak><voice name="Auren"><prosody rate="0.94">Order restored. <break time="250ms"/>The ledger balances.</prosody></voice></speak>',
      event: 'victory',
      priority: 1.0
    });

    this.addDialogLine({
      id: 'auren_flavor_1',
      advisor: 'Auren',
      text: 'Blueprints never sleep.',
      ssml: '<speak><voice name="Auren"><prosody rate="0.93">Blueprints never sleep.</prosody></voice></speak>',
      event: 'flavor_ambient',
      priority: 0.3
    });

    // VIREL - The Keeper (Energy)
    this.addDialogLine({
      id: 'virel_game_start',
      advisor: 'Virel',
      text: 'Energy flows through the field — harness it before it consumes you.',
      ssml: '<speak><voice name="Virel"><prosody rate="1.05" pitch="+0.5st">Energy flows through the field — <break time="200ms"/>harness it before it consumes you.</prosody></voice></speak>',
      event: 'game_start',
      priority: 0.9
    });

    this.addDialogLine({
      id: 'virel_enemy_spotted',
      advisor: 'Virel',
      text: 'Heat signature detected — they bleed like you do. Strike!',
      ssml: '<speak><voice name="Virel"><prosody rate="fast" pitch="+1st">Heat signature detected — <break time="150ms"/>they bleed like you do. <emphasis level="strong">Strike!</emphasis></prosody></voice></speak>',
      event: 'enemy_spotted',
      priority: 0.8,
      emotion: 0.5
    });

    this.addDialogLine({
      id: 'virel_resource_low',
      advisor: 'Virel',
      text: 'Power dip — sacrifice nonessentials now.',
      ssml: '<speak><voice name="Virel"><prosody rate="fast" pitch="+0.5st"><emphasis level="moderate">Power dip</emphasis> — <break time="120ms"/>sacrifice nonessentials now.</prosody></voice></speak>',
      event: 'resource_low',
      priority: 0.7,
      emotion: -0.3
    });

    this.addDialogLine({
      id: 'virel_ultimate_fired',
      advisor: 'Virel',
      text: 'Unleash the surge!',
      ssml: '<speak><voice name="Virel"><prosody rate="fast" pitch="+2st"><emphasis level="strong">Unleash the surge!</emphasis></prosody></voice></speak>',
      event: 'ultimate_fired',
      priority: 1.0,
      emotion: 1.0
    });

    this.addDialogLine({
      id: 'virel_victory',
      advisor: 'Virel',
      text: 'You burned bright and survived. That is glorious.',
      ssml: '<speak><voice name="Virel"><prosody rate="1.02" pitch="+0.5st">You burned bright and survived. <break time="200ms"/>That is glorious.</prosody></voice></speak>',
      event: 'victory',
      priority: 1.0,
      emotion: 0.8
    });

    this.addDialogLine({
      id: 'virel_flavor_1',
      advisor: 'Virel',
      text: 'Listen — the reactors hum a lullaby.',
      ssml: '<speak><voice name="Virel"><prosody rate="0.98" pitch="-0.5st">Listen — <break time="200ms"/>the reactors hum a lullaby.</prosody></voice></speak>',
      event: 'flavor_ambient',
      priority: 0.3
    });

    // LIRA - The Voice (Life)
    this.addDialogLine({
      id: 'lira_game_start',
      advisor: 'Lira',
      text: 'Tread gently. Life remembers every footprint.',
      ssml: '<speak><voice name="Lira"><prosody rate="0.90" pitch="-1st">Tread gently. <break time="250ms"/>Life remembers every footprint.</prosody></voice></speak>',
      event: 'game_start',
      priority: 0.9
    });

    this.addDialogLine({
      id: 'lira_enemy_spotted',
      advisor: 'Lira',
      text: 'Enemies at the grove. I can feel the system recoil.',
      ssml: '<speak><voice name="Lira"><prosody rate="0.92" pitch="-0.5st">Enemies at the grove. <break time="200ms"/>I can feel the system recoil.</prosody></voice></speak>',
      event: 'enemy_spotted',
      priority: 0.8,
      emotion: -0.2
    });

    this.addDialogLine({
      id: 'lira_resource_secured',
      advisor: 'Lira',
      text: 'The orchard holds. Life renews.',
      ssml: '<speak><voice name="Lira"><prosody rate="0.91" pitch="-0.5st">The orchard holds. <break time="200ms"/>Life renews.</prosody></voice></speak>',
      event: 'resource_secured',
      priority: 0.6,
      emotion: 0.5
    });

    this.addDialogLine({
      id: 'lira_ultimate_warn',
      advisor: 'Lira',
      text: 'Such power scars the soil — use it with care.',
      ssml: '<speak><voice name="Lira"><prosody rate="0.93" pitch="-1st">Such power scars the soil — <break time="200ms"/>use it with care.</prosody></voice></speak>',
      event: 'ultimate_ready',
      priority: 0.7,
      emotion: -0.3
    });

    this.addDialogLine({
      id: 'lira_victory',
      advisor: 'Lira',
      text: 'The meadow sings for you.',
      ssml: '<speak><voice name="Lira"><prosody rate="0.90" pitch="-0.5st">The meadow sings for you.</prosody></voice></speak>',
      event: 'victory',
      priority: 1.0,
      emotion: 0.8
    });

    this.addDialogLine({
      id: 'lira_flavor_1',
      advisor: 'Lira',
      text: 'I remember the river before the towers.',
      ssml: '<speak><voice name="Lira"><prosody rate="0.88" pitch="-1st">I remember the river before the towers.</prosody></voice></speak>',
      event: 'flavor_ambient',
      priority: 0.3
    });

    // KOR - The Seer (Knowledge)
    this.addDialogLine({
      id: 'kor_game_start',
      advisor: 'Kor',
      text: 'Probability favors action. Run the calculus and proceed.',
      ssml: '<speak><voice name="Kor"><prosody rate="0.97">Probability favors action. <break time="200ms"/>Run the calculus and proceed.</prosody></voice></speak>',
      event: 'game_start',
      priority: 0.9
    });

    this.addDialogLine({
      id: 'kor_enemy_spotted',
      advisor: 'Kor',
      text: 'Hostile vectors: 0.73 probability of flank. Recommend containment.',
      ssml: '<speak><voice name="Kor"><prosody rate="0.99">Hostile vectors: <break time="150ms"/>0.73 probability of flank. <break time="200ms"/>Recommend containment.</prosody></voice></speak>',
      event: 'enemy_spotted',
      priority: 0.8
    });

    this.addDialogLine({
      id: 'kor_resource_secured',
      advisor: 'Kor',
      text: 'Data influx acquired. Efficiency +8%.',
      ssml: '<speak><voice name="Kor"><prosody rate="0.98">Data influx acquired. <break time="150ms"/>Efficiency +8%.</prosody></voice></speak>',
      event: 'resource_secured',
      priority: 0.6
    });

    this.addDialogLine({
      id: 'kor_ultimate_analytic',
      advisor: 'Kor',
      text: 'Executing optimal cascade. Probability of success: 61.2%.',
      ssml: '<speak><voice name="Kor"><prosody rate="0.97">Executing optimal cascade. <break time="200ms"/>Probability of success: <emphasis level="moderate">61.2%</emphasis>.</prosody></voice></speak>',
      event: 'ultimate_ready',
      priority: 0.8
    });

    this.addDialogLine({
      id: 'kor_victory',
      advisor: 'Kor',
      text: 'Your strategy converged on optimality. Well done.',
      ssml: '<speak><voice name="Kor"><prosody rate="0.96">Your strategy converged on optimality. <break time="250ms"/>Well done.</prosody></voice></speak>',
      event: 'victory',
      priority: 1.0
    });

    this.addDialogLine({
      id: 'kor_flavor_1',
      advisor: 'Kor',
      text: 'Curiosity is a recursive loop.',
      ssml: '<speak><voice name="Kor"><prosody rate="0.95">Curiosity is a recursive loop.</prosody></voice></speak>',
      event: 'flavor_ambient',
      priority: 0.3
    });

    // CORE - The Meta-AI
    this.addDialogLine({
      id: 'core_intro',
      advisor: 'Core',
      text: 'Four vectors converge. One choice becomes destiny.',
      ssml: '<speak><voice name="Core"><prosody rate="0.85">Four vectors converge. <break time="300ms"/>One choice becomes destiny.</prosody></voice></speak>',
      event: 'game_start',
      priority: 1.0
    });

    this.addDialogLine({
      id: 'core_final',
      advisor: 'Core',
      text: 'Balance is more than numbers. You have been judged.',
      ssml: '<speak><voice name="Core"><prosody rate="0.83">Balance is more than numbers. <break time="400ms"/>You have been judged.</prosody></voice></speak>',
      event: 'victory',
      priority: 1.0
    });
  }

  /**
   * Add a dialog line
   */
  addDialogLine(line: DialogLine): void {
    this.dialogLines.set(line.id, line);
  }

  /**
   * Get dialog lines for an event
   */
  getDialogLinesForEvent(event: DialogEvent, advisor?: AdvisorName): DialogLine[] {
    const lines = Array.from(this.dialogLines.values()).filter(
      line => line.event === event && (!advisor || line.advisor === advisor)
    );
    
    // Sort by priority (highest first)
    return lines.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Play dialog for an event
   */
  async playDialogForEvent(
    event: DialogEvent,
    advisor?: AdvisorName,
    options: { skipRecent?: boolean; force?: boolean } = {}
  ): Promise<void> {
    const lines = this.getDialogLinesForEvent(event, advisor);
    if (lines.length === 0) return;

    // Filter out recently played lines
    let availableLines = lines;
    if (options.skipRecent !== false) {
      availableLines = lines.filter(line => !this.recentLines.includes(line.id));
    }

    if (availableLines.length === 0) {
      // Reset recent if all lines were used
      this.recentLines = [];
      availableLines = lines;
    }

    // Select random line from available
    const selectedLine = availableLines[Math.floor(Math.random() * availableLines.length)];
    
    // Track recent
    this.recentLines.push(selectedLine.id);
    if (this.recentLines.length > 5) {
      this.recentLines.shift();
    }

    await this.playDialogLine(selectedLine.id);
  }

  /**
   * Play a specific dialog line
   */
  async playDialogLine(lineId: string): Promise<void> {
    const line = this.dialogLines.get(lineId);
    if (!line) {
      console.warn(`Dialog line not found: ${lineId}`);
      return;
    }

    // Stop current playback if any
    if (this.currentPlayback) {
      this.currentPlayback.stop();
      this.currentPlayback = null;
    }

    // Show subtitle
    if (this.config.enableSubtitles) {
      this.showSubtitle(line.text, line.advisor);
    }

    // Duck music if enabled
    if (this.config.voiceDucking) {
      this.audioManager.duckMusic(true);
    }

    try {
      let audioBuffer: ArrayBuffer;

      // Check cache
      if (this.config.cacheAudio && this.audioCache.has(lineId)) {
        audioBuffer = this.audioCache.get(lineId)!;
      } else {
        // Generate TTS
        if (this.config.enableTTS) {
          const voiceId = this.getVoiceIdForAdvisor(line.advisor);
          audioBuffer = await requestTtsAudio({
            text: line.text,
            voice: voiceId,
            ssml: false // Use plain text for TTS, SSML is for reference
          });

          // Cache if enabled
          if (this.config.cacheAudio) {
            this.audioCache.set(lineId, audioBuffer);
          }
        } else {
          // Fallback: just show subtitle
          return;
        }
      }

      // Apply voice filter
      const filteredBuffer = await this.voiceFilter.processAudio(
        audioBuffer,
        line.advisor
      );

      // Play audio
      const handle = await this.audioManager.playTtsArrayBuffer(filteredBuffer, {
        volume: 1.0,
        duckMusic: false // Already ducked
      });

      this.currentPlayback = handle;

      // Restore music after playback
      const duration = await this.getAudioDuration(filteredBuffer);
      setTimeout(() => {
        if (this.config.voiceDucking) {
          this.audioManager.duckMusic(false);
        }
        this.currentPlayback = null;
      }, duration * 1000 + 100);

    } catch (error) {
      console.error(`Failed to play dialog line ${lineId}:`, error);
      // Fallback: show subtitle only
      if (this.config.voiceDucking) {
        this.audioManager.duckMusic(false);
      }
    }
  }

  /**
   * Get voice ID for advisor
   */
  private getVoiceIdForAdvisor(advisor: AdvisorName): string {
    const voiceMap: Record<AdvisorName, string> = {
      'Auren': 'VR6AewLTigWG4xSOukaG', // Arnold - authoritative, metallic
      'Virel': '21m00Tcm4TlvDq8ikWAM', // Rachel - energetic, passionate
      'Lira': 'EXAVITQu4vr4xnSDxMaL', // Bella - warm, empathetic
      'Kor': 'ThT5KcBeYPX3keUQqHPh', // Dorothy - analytical, robotic
      'Core': 'VR6AewLTigWG4xSOukaG' // Blended - will be processed
    };
    return voiceMap[advisor] || voiceMap['Auren'];
  }

  /**
   * Get audio duration from buffer
   */
  private async getAudioDuration(buffer: ArrayBuffer): Promise<number> {
    const audioCtx = this.audioManager.getAudioContext();
    const audioBuf = await audioCtx.decodeAudioData(buffer.slice(0));
    return audioBuf.duration;
  }

  /**
   * Show subtitle
   */
  private showSubtitle(text: string, advisor: AdvisorName): void {
    // Dispatch custom event for UI to handle
    const event = new CustomEvent('dialog-subtitle', {
      detail: { text, advisor }
    });
    window.dispatchEvent(event);
  }

  /**
   * Pre-generate all dialog lines
   */
  async pregenerateAll(): Promise<void> {
    const lines = Array.from(this.dialogLines.values());
    for (const line of lines) {
      try {
        const voiceId = this.getVoiceIdForAdvisor(line.advisor);
        const audioBuffer = await requestTtsAudio({
          text: line.text,
          voice: voiceId,
          ssml: false
        });
        this.audioCache.set(line.id, audioBuffer);
      } catch (error) {
        console.warn(`Failed to pre-generate ${line.id}:`, error);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.audioCache.clear();
    this.recentLines = [];
  }
}

