/**
 * SFX Manager - Comprehensive Sound Effects System
 * 
 * Handles all 40+ SFX cues from the playbook:
 * - UI & HUD sounds
 * - Terrain ambients and events
 * - Unit & combat sounds
 * - Structures & nodes
 * - Advisor & narrative cues
 * - Big events & cinematics
 * - Micro-feedback sounds
 */

import AudioManager from './AudioManager';

export type SFXCue = {
  key: string;
  description: string;
  category: 'ui' | 'terrain' | 'combat' | 'structure' | 'advisor' | 'cinematic' | 'micro';
  loop: boolean;
  priority: number; // 0-10, higher = more important
  suggestedLength: number; // in seconds
  url?: string; // Asset path
};

export type PlaybackHandle = { id: string; stop: () => void };

/**
 * Complete SFX Cue Registry - 40+ cues from playbook
 */
export const SFX_CUES: SFXCue[] = [
  // UI & HUD (instant feedback)
  { key: 'UI_Click_Soft', description: 'Light metallic click for button press', category: 'ui', loop: false, priority: 8, suggestedLength: 0.03, url: '/assets/sfx/ui_click_soft.ogg' },
  { key: 'UI_Hover_Glow', description: 'Short rising whoosh for hover', category: 'ui', loop: false, priority: 6, suggestedLength: 0.15, url: '/assets/sfx/ui_hover_glow.ogg' },
  { key: 'UI_Error_Beep', description: 'Single low-mid beep, slightly damped', category: 'ui', loop: false, priority: 7, suggestedLength: 0.2, url: '/assets/sfx/ui_error_beep.ogg' },
  { key: 'UI_Confirm_Long', description: 'Pleasant 2-note interval for mission accept', category: 'ui', loop: false, priority: 7, suggestedLength: 0.5, url: '/assets/sfx/ui_confirm_long.ogg' },
  { key: 'HUD_Resource_Tick', description: 'Tiny chime when resource increments', category: 'ui', loop: false, priority: 5, suggestedLength: 0.08, url: '/assets/sfx/hud_resource_tick.ogg' },
  
  // Terrain Ambients (looping beds)
  { key: 'Ambient_NeonPlains', description: 'Slow synth pad + distant mechanical hum', category: 'terrain', loop: true, priority: 2, suggestedLength: 8, url: '/assets/sfx/ambient_neon_plains.ogg' },
  { key: 'Ambient_Biome_Biotech', description: 'Breathing low pad + faint choral tone', category: 'terrain', loop: true, priority: 2, suggestedLength: 6, url: '/assets/sfx/ambient_biome_biotech.ogg' },
  { key: 'Ambient_Crater', description: 'Rumble + sparse metallic twinkles', category: 'terrain', loop: true, priority: 2, suggestedLength: 7, url: '/assets/sfx/ambient_crater.ogg' },
  { key: 'Ambient_LavaField', description: 'Low pulsing rumble + bubbling percussive hits', category: 'terrain', loop: true, priority: 2, suggestedLength: 5, url: '/assets/sfx/ambient_lava_field.ogg' },
  { key: 'Ambient_FogVault', description: 'Airy drone + distant water drips', category: 'terrain', loop: true, priority: 2, suggestedLength: 8, url: '/assets/sfx/ambient_fog_vault.ogg' },
  
  // Terrain Events (one-shots + risers)
  { key: 'LavaVent_Erupt', description: 'Heavy low punch + spit crackles', category: 'terrain', loop: false, priority: 6, suggestedLength: 2.5, url: '/assets/sfx/lava_vent_erupt.ogg' },
  { key: 'LavaVent_Pressure', description: 'Rising mechanical hiss into small explosion', category: 'terrain', loop: false, priority: 5, suggestedLength: 1.8, url: '/assets/sfx/lava_vent_pressure.ogg' },
  { key: 'BioBloom_Grow', description: 'Watery swell + small melodic pluck', category: 'terrain', loop: false, priority: 4, suggestedLength: 1.2, url: '/assets/sfx/bio_bloom_grow.ogg' },
  { key: 'Chroma_Pulse', description: 'Harmonic bell + sub thump synced to meter', category: 'terrain', loop: false, priority: 5, suggestedLength: 0.8, url: '/assets/sfx/chroma_pulse.ogg' },
  { key: 'Tile_Corrupt_Dissolve', description: 'Glitchy digital grain + soft whoosh', category: 'terrain', loop: false, priority: 4, suggestedLength: 1.5, url: '/assets/sfx/tile_corrupt_dissolve.ogg' },
  
  // Unit & Combat
  { key: 'Unit_Move_Step', description: 'Metallic thud or squelch depending on terrain', category: 'combat', loop: false, priority: 4, suggestedLength: 0.15, url: '/assets/sfx/unit_move_step.ogg' },
  { key: 'Unit_Attack_Shot', description: 'Crisp short shot with small high-frequency tail', category: 'combat', loop: false, priority: 7, suggestedLength: 0.3, url: '/assets/sfx/unit_attack_shot.ogg' },
  { key: 'Unit_Hit_Impact', description: 'Mid-heavy hit with crunchy texture', category: 'combat', loop: false, priority: 6, suggestedLength: 0.25, url: '/assets/sfx/unit_hit_impact.ogg' },
  { key: 'Unit_Destroyed_Blast', description: 'Layered boom + scattering debris sounds', category: 'combat', loop: false, priority: 8, suggestedLength: 1.2, url: '/assets/sfx/unit_destroyed_blast.ogg' },
  { key: 'Hero_Ult_Charge', description: 'Rising harmonic cluster + arpeggiated clicks', category: 'combat', loop: false, priority: 9, suggestedLength: 2.0, url: '/assets/sfx/hero_ult_charge.ogg' },
  
  // Structures / Nodes
  { key: 'Node_Capture_Start', description: 'Bright rising arp + click', category: 'structure', loop: false, priority: 6, suggestedLength: 0.8, url: '/assets/sfx/node_capture_start.ogg' },
  { key: 'Node_Capture_Complete', description: 'Triumphant bell chord + breath', category: 'structure', loop: false, priority: 7, suggestedLength: 1.5, url: '/assets/sfx/node_capture_complete.ogg' },
  { key: 'Node_Overheat_Warn', description: 'Warning oscillating tone that grows urgent', category: 'structure', loop: false, priority: 7, suggestedLength: 1.0, url: '/assets/sfx/node_overheat_warn.ogg' },
  { key: 'Refinery_Work', description: 'Looped mechanical conveyor + faint chemical sizzle', category: 'structure', loop: true, priority: 3, suggestedLength: 4, url: '/assets/sfx/refinery_work.ogg' },
  { key: 'Research_Complete', description: 'Single crystalline chime + low riser', category: 'structure', loop: false, priority: 6, suggestedLength: 1.8, url: '/assets/sfx/research_complete.ogg' },
  
  // Advisor / Narrative Cues
  { key: 'Advisor_Ping', description: 'Small unobtrusive ping when advisor talks', category: 'advisor', loop: false, priority: 5, suggestedLength: 0.1, url: '/assets/sfx/advisor_ping.ogg' },
  { key: 'Advisor_Emotion_Flip', description: 'Subtle tonal shift (minor key) when debate flips', category: 'advisor', loop: false, priority: 4, suggestedLength: 0.5, url: '/assets/sfx/advisor_emotion_flip.ogg' },
  { key: 'Core_Voice_Entrance', description: 'Layered background hum that swells when Core speaks', category: 'advisor', loop: false, priority: 5, suggestedLength: 1.2, url: '/assets/sfx/core_voice_entrance.ogg' },
  { key: 'Moral_Verdict_Sting', description: 'Emotional 2-3s orchestral sting for endings', category: 'advisor', loop: false, priority: 9, suggestedLength: 2.5, url: '/assets/sfx/moral_verdict_sting.ogg' },
  { key: 'Dialogue_Impact_FX', description: 'Thin reverb tail + low-pass bump for poignant lines', category: 'advisor', loop: false, priority: 4, suggestedLength: 0.8, url: '/assets/sfx/dialogue_impact_fx.ogg' },
  
  // Big Events & Cinematics
  { key: 'Kaiju_Rise', description: 'Massive low-frequency roar + ground tremor', category: 'cinematic', loop: false, priority: 10, suggestedLength: 4.0, url: '/assets/sfx/kaiju_rise.ogg' },
  { key: 'Kaiju_Stomp', description: 'Very slow sub-drop + cracking debris', category: 'cinematic', loop: false, priority: 9, suggestedLength: 3.0, url: '/assets/sfx/kaiju_stomp.ogg' },
  { key: 'Ultimate_Impact', description: 'Exaggerated transient, reversed whoosh, metallic reverb', category: 'cinematic', loop: false, priority: 10, suggestedLength: 3.5, url: '/assets/sfx/ultimate_impact.ogg' },
  { key: 'Collapse_Fail', description: 'Glitching alarms, stuttering tones, blackout thump', category: 'cinematic', loop: false, priority: 9, suggestedLength: 4.5, url: '/assets/sfx/collapse_fail.ogg' },
  { key: 'Victory_Reveal', description: 'Warm choir swell + harp gliss', category: 'cinematic', loop: false, priority: 10, suggestedLength: 5.0, url: '/assets/sfx/victory_reveal.ogg' },
  
  // Micro-feedback / Flourish
  { key: 'Breadcrumb_Ping', description: 'Tiny bell used for log/loot spawn', category: 'micro', loop: false, priority: 3, suggestedLength: 0.12, url: '/assets/sfx/breadcrumb_ping.ogg' },
  { key: 'Pathing_Confirm', description: 'Soft sliding wash when unit path selected', category: 'micro', loop: false, priority: 4, suggestedLength: 0.25, url: '/assets/sfx/pathing_confirm.ogg' },
  { key: 'Terrain_Interact', description: 'Short tool sound for digging/planting', category: 'micro', loop: false, priority: 4, suggestedLength: 0.3, url: '/assets/sfx/terrain_interact.ogg' },
  { key: 'Stealth_Foot', description: 'Muffled footstep for phased units', category: 'micro', loop: false, priority: 3, suggestedLength: 0.2, url: '/assets/sfx/stealth_foot.ogg' },
  { key: 'Electro_Spark', description: 'Tiny high-energy spark for data interactions', category: 'micro', loop: false, priority: 3, suggestedLength: 0.15, url: '/assets/sfx/electro_spark.ogg' },
];

/**
 * SFX Manager - Extends AudioManager with cue-based playback
 */
export default class SFXManager {
  private static _instance: SFXManager | null = null;
  public static instance(): SFXManager {
    if (!this._instance) this._instance = new SFXManager();
    return this._instance;
  }

  private audioManager: AudioManager;
  private activeLoops: Map<string, PlaybackHandle> = new Map();
  private cueRegistry: Map<string, SFXCue> = new Map();
  private nextId = 1;

  private constructor() {
    this.audioManager = AudioManager.instance();
    // Build cue registry
    SFX_CUES.forEach(cue => {
      this.cueRegistry.set(cue.key, cue);
    });
  }

  /**
   * Initialize SFX Manager
   */
  async init(): Promise<void> {
    await this.audioManager.init();
  }

  /**
   * Preload all SFX cues
   */
  async preloadAll(): Promise<void> {
    const loadList = SFX_CUES
      .filter(cue => cue.url)
      .map(cue => ({ key: cue.key, url: cue.url! }));
    
    await this.audioManager.preload(loadList);
  }

  /**
   * Preload specific cues by category
   */
  async preloadCategory(category: SFXCue['category']): Promise<void> {
    const loadList = SFX_CUES
      .filter(cue => cue.category === category && cue.url)
      .map(cue => ({ key: cue.key, url: cue.url! }));
    
    await this.audioManager.preload(loadList);
  }

  /**
   * Play SFX cue by key with enhanced features
   */
  playCue(
    key: string,
    options: {
      volume?: number;
      pitch?: number;
      position?: { x: number; y: number; z?: number }; // For spatial audio
      pan?: number; // -1 (left) to 1 (right)
    } = {}
  ): PlaybackHandle | null {
    const cue = this.cueRegistry.get(key);
    if (!cue) {
      console.warn(`SFX cue not found: ${key}`);
      return null;
    }

    // Stop existing loop if this is a loop
    if (cue.loop && this.activeLoops.has(key)) {
      this.stopCue(key);
    }

    const audioCtx = this.audioManager.getAudioContext();
    const buffer = this.audioManager.getBuffer(key);
    
    if (!buffer) {
      console.warn(`SFX buffer not loaded: ${key}`);
      return null;
    }

    // Create source
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = cue.loop;

    // Apply pitch variation
    const pitch = options.pitch ?? 1.0;
    if (pitch !== 1.0) {
      source.playbackRate.value = pitch;
    }

    // Create gain node
    const gain = audioCtx.createGain();
    gain.gain.value = options.volume ?? 1.0;

    // Spatial audio (if position provided)
    let panner: StereoPannerNode | PannerNode | null = null;
    if (options.position) {
      // Use 3D panner for full spatial audio
      panner = audioCtx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.maxDistance = 100;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;
      panner.coneOuterAngle = 0;
      panner.coneOuterGain = 0;
      
      panner.positionX.value = options.position.x;
      panner.positionY.value = options.position.y;
      panner.positionZ.value = options.position.z ?? 0;
    } else if (options.pan !== undefined) {
      // Use stereo panner for simple left/right panning
      panner = audioCtx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, options.pan));
    }

    // Connect nodes
    source.connect(gain);
    if (panner) {
      gain.connect(panner);
      panner.connect(this.audioManager.getSfxGainNode());
    } else {
      gain.connect(this.audioManager.getSfxGainNode());
    }

    // Start playback
    source.start(0);

    const id = `sfx-${this.nextId++}`;
    const stop = () => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
      source.disconnect();
      gain.disconnect();
      panner?.disconnect();
    };

    source.onended = () => {
      gain.disconnect();
      panner?.disconnect();
      source.disconnect();
    };

    const handle: PlaybackHandle = { id, stop };

    // Track loops
    if (cue.loop) {
      this.activeLoops.set(key, handle);
    }

    return handle;
  }

  /**
   * Stop a playing cue (especially useful for loops)
   */
  stopCue(key: string): void {
    const handle = this.activeLoops.get(key);
    if (handle) {
      handle.stop();
      this.activeLoops.delete(key);
    }
  }

  /**
   * Stop all playing cues
   */
  stopAll(): void {
    this.activeLoops.forEach(handle => handle.stop());
    this.activeLoops.clear();
  }

  /**
   * Get cue information
   */
  getCue(key: string): SFXCue | undefined {
    return this.cueRegistry.get(key);
  }

  /**
   * Get all cues by category
   */
  getCuesByCategory(category: SFXCue['category']): SFXCue[] {
    return SFX_CUES.filter(cue => cue.category === category);
  }

  /**
   * Convenience methods for common actions
   */
  playUIClick() { 
    // Add slight pitch variation for organic feel
    const pitch = 0.95 + Math.random() * 0.1;
    return this.playCue('UI_Click_Soft', { volume: 0.8, pitch }); 
  }
  playUIHover() { 
    const pitch = 0.98 + Math.random() * 0.04;
    return this.playCue('UI_Hover_Glow', { volume: 0.6, pitch }); 
  }
  playUIError() { return this.playCue('UI_Error_Beep', { volume: 0.9 }); }
  playUIConfirm() { return this.playCue('UI_Confirm_Long', { volume: 0.8 }); }
  
  playTerrainAmbient(biome: string): PlaybackHandle | null {
    const key = `Ambient_${biome}`;
    const cue = this.cueRegistry.get(key);
    if (cue) return this.playCue(key, { volume: 0.5 });
    return null;
  }

  playUnitAttack(position?: { x: number; y: number; z?: number }) { 
    const pitch = 0.9 + Math.random() * 0.2; // More variation for combat
    return this.playCue('Unit_Attack_Shot', { volume: 0.9, pitch, position }); 
  }
  playUnitHit(position?: { x: number; y: number; z?: number }) { 
    const pitch = 0.85 + Math.random() * 0.3;
    return this.playCue('Unit_Hit_Impact', { volume: 0.8, pitch, position }); 
  }
  playUnitDestroyed(position?: { x: number; y: number; z?: number }) { 
    return this.playCue('Unit_Destroyed_Blast', { volume: 1.0, position }); 
  }

  playNodeCapture() { return this.playCue('Node_Capture_Complete', { volume: 0.9 }); }
  playNodeCaptureStart() { return this.playCue('Node_Capture_Start', { volume: 0.8 }); }

  playAdvisorPing() { return this.playCue('Advisor_Ping', { volume: 0.6 }); }

  playKaijuRise() { return this.playCue('Kaiju_Rise', { volume: 1.0 }); }
  playVictory() { return this.playCue('Victory_Reveal', { volume: 1.0 }); }
  playCollapse() { return this.playCue('Collapse_Fail', { volume: 1.0 }); }
}

