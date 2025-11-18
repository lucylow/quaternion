// src/components/AudioStudio.tsx
// Audio Studio - Fuser Mode (Mock-enabled)
// Real-time TTS, Voice Conversion, Music & SFX — powered by Lovable Edge + ElevenLabs

import React, { useState, useEffect } from "react";
import { ttsSpeak, voiceConvertBase64, listVoices } from "../audio/elevenClient";
import AudioManager from "../audio/AudioManager";

// Voice presets (inline for now, can be loaded from JSON if needed)
const voicePresets: Record<string, {
  elevenVoiceId: string;
  personality: Record<string, number>;
  ssmlHints: string;
  exampleLines: string[];
}> = {
  Lian: {
    elevenVoiceId: "lian_prototype",
    personality: { aggression: 0.6, empathy: 0.2, dryHumor: 0.1 },
    ssmlHints: "<prosody rate='0.95' pitch='-1st'>",
    exampleLines: [
      "Hold the chokepoint — buy us time.",
      "We move when I say we move."
    ]
  },
  Mara: {
    elevenVoiceId: "mara_warm",
    personality: { aggression: 0.1, empathy: 0.9, curiosity: 0.6 },
    ssmlHints: "<prosody rate='0.92' pitch='0st'>",
    exampleLines: [
      "Please — listen. It remembers more than we do.",
      "There must be another way."
    ]
  },
  Patch: {
    elevenVoiceId: "patch_drone",
    personality: { aggression: 0.0, empathy: 0.05, dryHumor: 0.9 },
    ssmlHints: "<prosody rate='1.08'>",
    exampleLines: [
      "Alarms: loud. Morale: quieter than you, commander.",
      "Scanning... nothing helpful. Sending passive judgement."
    ]
  }
};

// Mock data for offline demo
const MOCK_VOICES = [
  { voice_id: "mara_warm", name: "Mara", category: "npc", description: "Warm, empathetic advisor" },
  { voice_id: "lian_prototype", name: "Lian", category: "npc", description: "Tactical commander" },
  { voice_id: "patch_drone", name: "Patch", category: "npc", description: "Analytical AI" }
];

// Generate mock OGG audio bytes
function generateMockOggBytes(lengthSec = 2): ArrayBuffer {
  const header = new Uint8Array([
    0x4F, 0x67, 0x67, 0x53, // "OggS"
    0x00, 0x02, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]);
  const size = Math.max(4096, Math.min(65536, lengthSec * 1024));
  const payload = new Uint8Array(size).fill(0);
  return new Uint8Array([...header, ...payload]).buffer;
}

export default function AudioStudio() {
  const [log, setLog] = useState<string>("Idle");
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("Mara");
  const [ssml, setSsml] = useState<string>("<speak><voice name='Mara'>Please — listen.</voice></speak>");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPlayback, setCurrentPlayback] = useState<{ id: string; stop: () => void } | null>(null);
  const [voiceTrack, setVoiceTrack] = useState<ArrayBuffer | null>(null);
  const [musicTrack, setMusicTrack] = useState<ArrayBuffer | null>(null);
  const [sfxTrack, setSfxTrack] = useState<ArrayBuffer | null>(null);
  const [mockMode, setMockMode] = useState(true); // Default to mock mode

  // Check for mock mode from environment
  useEffect(() => {
    const mock = import.meta.env.VITE_TTS_MOCK === "true" || !import.meta.env.VITE_ELEVENLABS_API_KEY;
    setMockMode(mock);
    if (mock) {
      setLog("Mock mode enabled — using placeholder audio");
    }
  }, []);

  async function previewVoices() {
    try {
      setLog("Fetching voices...");
      if (mockMode) {
        // Return mock voices
        await new Promise(resolve => setTimeout(resolve, 300));
        setVoices(MOCK_VOICES);
        setLog(`Loaded ${MOCK_VOICES.length} voices (mock mode)`);
      } else {
        const result = await listVoices();
        setVoices(result.voices || []);
        setLog(`Loaded ${result.voices?.length || 0} voices`);
      }
    } catch (e) {
      console.error(e);
      // Fallback to mock voices
      setVoices(MOCK_VOICES);
      setLog("Using mock voices (API unavailable)");
    }
  }

  async function generateAndPlay() {
    if (isGenerating) return;
    setIsGenerating(true);
    setLog("Requesting TTS...");

    try {
      let arr: ArrayBuffer;
      
      if (mockMode) {
        // Generate mock audio
        await new Promise(resolve => setTimeout(resolve, 500));
        arr = generateMockOggBytes(2);
        setLog("Generated mock audio (playing...)");
      } else {
        const preset = voicePresets[selectedVoice];
        const voiceId = preset?.elevenVoiceId || selectedVoice;
        arr = await ttsSpeak({ 
          text: ssml, 
          voiceId: voiceId, 
          ssml: true 
        });
        setLog("Generated TTS audio (playing...)");
      }

      setVoiceTrack(arr);
      const handle = await AudioManager.instance().playTtsArrayBuffer(arr, { duckMusic: true });
      setCurrentPlayback(handle);
      setLog("Playing...");

      // Estimate duration (mock: 2s, real: decode to get duration)
      const duration = mockMode ? 2000 : 2000;
      setTimeout(() => {
        setCurrentPlayback(null);
        setLog("Playback complete.");
      }, duration);
    } catch (err) {
      console.error(err);
      setLog("TTS failed, using mock audio.");
      // Fallback: play mock audio
      const mockArr = generateMockOggBytes(2);
      setVoiceTrack(mockArr);
      const handle = await AudioManager.instance().playTtsArrayBuffer(mockArr, { duckMusic: true });
      setCurrentPlayback(handle);
      setTimeout(() => {
        setCurrentPlayback(null);
        setLog("Mock playback complete.");
      }, 2000);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    if (!f) return;

    setLog("Converting uploaded voice to NPC voice...");
    try {
      const arr = await f.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(arr)));
      
      if (mockMode) {
        // Return mock converted audio
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockArr = generateMockOggBytes(2);
        setVoiceTrack(mockArr);
        const handle = await AudioManager.instance().playTtsArrayBuffer(mockArr, { duckMusic: true });
        setCurrentPlayback(handle);
        setLog("Voice conversion complete (mock mode)");
        setTimeout(() => {
          setCurrentPlayback(null);
        }, 2000);
      } else {
        const preset = voicePresets[selectedVoice];
        const voiceId = preset?.elevenVoiceId || selectedVoice;
        const out = await voiceConvertBase64({ audioBase64: b64, targetVoiceId: voiceId });
        setVoiceTrack(out);
        const handle = await AudioManager.instance().playTtsArrayBuffer(out, { duckMusic: true });
        setCurrentPlayback(handle);
        setLog("Voice conversion complete");
        setTimeout(() => {
          setCurrentPlayback(null);
        }, 2000);
      }
    } catch (e) {
      console.error(e);
      setLog("Conversion failed (using mock)");
      const mockArr = generateMockOggBytes(2);
      setVoiceTrack(mockArr);
      const handle = await AudioManager.instance().playTtsArrayBuffer(mockArr, { duckMusic: true });
      setCurrentPlayback(handle);
      setTimeout(() => {
        setCurrentPlayback(null);
      }, 2000);
    }
  }

  async function generateMusic(style: "battle" | "ambient", mood: "tense" | "calm") {
    setLog(`Generating ${style} music (${mood} mood)...`);
    try {
      if (mockMode) {
        await new Promise(resolve => setTimeout(resolve, 600));
        const mockArr = generateMockOggBytes(30);
        setMusicTrack(mockArr);
        setLog("Music generated (mock mode)");
      } else {
        const base = import.meta.env.VITE_EDGE_BASE || import.meta.env.VITE_API_BASE || '/api';
        const res = await fetch(`${base}/ai/musicgen`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ style, mood, lengthSec: 30, mock: false })
        });
        if (!res.ok) throw new Error("Music generation failed");
        const arr = await res.arrayBuffer();
        setMusicTrack(arr);
        setLog("Music generated");
      }
    } catch (e) {
      console.error(e);
      setLog("Music generation failed (using mock)");
      const mockArr = generateMockOggBytes(30);
      setMusicTrack(mockArr);
    }
  }

  async function generateSFX() {
    setLog("Generating SFX...");
    try {
      if (mockMode) {
        await new Promise(resolve => setTimeout(resolve, 400));
        const mockArr = generateMockOggBytes(1);
        setSfxTrack(mockArr);
        setLog("SFX generated (mock mode)");
      } else {
        // Placeholder for SFX generation endpoint
        setLog("SFX generation not yet implemented");
      }
    } catch (e) {
      console.error(e);
      setLog("SFX generation failed");
    }
  }

  function stopPlayback() {
    if (currentPlayback) {
      currentPlayback.stop();
      setCurrentPlayback(null);
    }
    AudioManager.instance().stopAll();
    setLog("Stopped all playback");
  }

  function loadPresetSSML(voice: string, line: number) {
    const preset = voicePresets[voice];
    if (preset && preset.exampleLines[line]) {
      const text = preset.exampleLines[line];
      const ssmlHints = preset.ssmlHints || "";
      setSsml(`<speak>${ssmlHints}<voice name="${voice}">${text}</voice></speak>`);
      setSelectedVoice(voice);
    }
  }

  return (
    <div className="p-6 bg-white text-gray-900 rounded-lg shadow-md" style={{ fontFamily: "Inter" }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold">Audio Studio — Fuser Mode</h2>
        <div className="text-sm text-gray-500">
          {mockMode ? "🔧 Mock Mode" : "🌐 Live Mode"}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left Column: Controls */}
        <div className="w-1/4 space-y-4">
          <div>
            <button 
              onClick={previewVoices} 
              className="mb-3 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Load Voices
            </button>
            {voices.length > 0 && (
              <div className="text-xs text-gray-600 mb-2">
                {voices.length} voice{voices.length !== 1 ? 's' : ''} loaded
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Voice</label>
            <select 
              value={selectedVoice} 
              onChange={e => setSelectedVoice(e.target.value)} 
              className="mt-1 block w-full px-3 py-2 border rounded"
            >
              <option value="Mara">Mara</option>
              <option value="Lian">Lian</option>
              <option value="Patch">Patch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quick Presets</label>
            <div className="space-y-2">
              <button 
                className="px-3 py-1 border rounded text-xs hover:bg-gray-100" 
                onClick={() => loadPresetSSML("Mara", 0)}
              >
                Mara A
              </button>
              <button 
                className="px-3 py-1 border rounded text-xs hover:bg-gray-100" 
                onClick={() => loadPresetSSML("Lian", 0)}
              >
                Lian A
              </button>
              <button 
                className="px-3 py-1 border rounded text-xs hover:bg-gray-100" 
                onClick={() => loadPresetSSML("Patch", 0)}
              >
                Patch A
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload voice (judge)</label>
            <input 
              type="file" 
              onChange={handleFile} 
              accept="audio/*"
              className="mt-1 text-sm"
            />
          </div>

          <div className="space-y-2">
            <button 
              onClick={generateAndPlay} 
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Narration"}
            </button>
            <button 
              onClick={() => generateMusic("battle", "tense")} 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Generate Music (Battle)
            </button>
            <button 
              onClick={() => generateMusic("ambient", "calm")} 
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Generate Music (Ambient)
            </button>
            <button 
              onClick={generateSFX} 
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Generate SFX
            </button>
          </div>

          <div className="rounded bg-gray-100 p-3 text-xs">
            <strong>Log:</strong>
            <div className="mt-1 text-gray-700">{log}</div>
          </div>
        </div>

        {/* Middle Column: Track Mixer */}
        <div className="w-1/2 bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-3">Track Mixer</h3>
          <div className="space-y-4">
            <div className="p-3 bg-white rounded shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">Voice Track</div>
                <div className="flex gap-2">
                  <button className="text-xs px-2 py-1 bg-green-100 rounded">Play</button>
                  <button className="text-xs px-2 py-1 bg-red-100 rounded">Stop</button>
                </div>
              </div>
              <div className="mt-2 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                {voiceTrack ? "Waveform preview" : "No audio"}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs">Gain:</span>
                <input type="range" min="0" max="100" defaultValue="100" className="flex-1" />
                <span className="text-xs">Mute</span>
                <input type="checkbox" />
              </div>
            </div>

            <div className="p-3 bg-white rounded shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">Music Track</div>
                <div className="flex gap-2">
                  <button className="text-xs px-2 py-1 bg-green-100 rounded">Play</button>
                  <button className="text-xs px-2 py-1 bg-blue-100 rounded">Generate</button>
                </div>
              </div>
              <div className="mt-2 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                {musicTrack ? "Loop preview" : "No audio"}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs">Gain:</span>
                <input type="range" min="0" max="100" defaultValue="70" className="flex-1" />
                <span className="text-xs">Mute</span>
                <input type="checkbox" />
              </div>
            </div>

            <div className="p-3 bg-white rounded shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">FX Track</div>
                <div className="flex gap-2">
                  <button className="text-xs px-2 py-1 bg-green-100 rounded">Play</button>
                  <button className="text-xs px-2 py-1 bg-purple-100 rounded">SFX</button>
                </div>
              </div>
              <div className="mt-2 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                {sfxTrack ? "Pad preview" : "No audio"}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs">Gain:</span>
                <input type="range" min="0" max="100" defaultValue="80" className="flex-1" />
                <span className="text-xs">Mute</span>
                <input type="checkbox" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inspector & Live Preview */}
        <div className="w-1/4 bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-3">Inspector</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">SSML / Prompt</label>
              <textarea 
                value={ssml} 
                onChange={e => setSsml(e.target.value)} 
                className="w-full h-40 mt-1 text-sm p-2 border rounded"
                placeholder="<speak>...</speak>"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Model</label>
              <select className="w-full text-sm px-2 py-1 border rounded">
                <option>eleven_multilingual_v2</option>
                <option>eleven_turbo_v2</option>
              </select>
            </div>

            <div className="pt-2 space-y-2">
              <button 
                className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700" 
                onClick={stopPlayback}
              >
                Stop All
              </button>
              <button className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                Export WAV
              </button>
              <button className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                Save to Assets
              </button>
            </div>

            <div className="pt-2 border-t">
              <div className="text-xs text-gray-600">
                <div className="mb-1"><strong>Telemetry:</strong></div>
                <div>promptHash: abc123</div>
                <div>model: eleven_tts_v1</div>
                <div>durationMs: 420</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-gray-500 text-center">
        Powered by Lovable Edge + ElevenLabs • Mock Mode available
      </div>
    </div>
  );
}

