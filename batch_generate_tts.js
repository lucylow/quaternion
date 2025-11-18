// batch_generate_tts.js
// Batch script to generate TTS audio from SSML files
// Reads assets/ssml/*.ssml, posts to edge TTS endpoint, saves to assets/audio_out/*.ogg

const fs = require("fs");
const path = require("path");

const SSML_DIR = path.join(__dirname, "assets", "ssml");
const OUT_DIR = path.join(__dirname, "assets", "audio_out");
const EDGE_BASE = process.env.EDGE_BASE || process.env.VITE_EDGE_BASE || "http://localhost:8787"; // Set to your dev edge base
const USE_MOCK = process.env.TTS_MOCK === "true" || !process.env.ELEVENLABS_API_KEY;

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

/**
 * Generate TTS audio for one SSML file
 */
async function generateOne(file) {
  const name = path.basename(file, ".ssml");
  const ssml = fs.readFileSync(file, "utf8");

  // Determine voice ID from filename
  let voiceId = "Mara";
  if (name.includes("mara")) {
    voiceId = "Mara";
  } else if (name.includes("lian")) {
    voiceId = "Lian";
  } else if (name.includes("patch")) {
    voiceId = "Patch";
  }

  console.log(`Generating: ${name} (voice: ${voiceId})`);

  try {
    const res = await fetch(`${EDGE_BASE}/api/ai/elevenlabs/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: ssml,
        voiceId: voiceId,
        ssml: true,
        mock: USE_MOCK
      })
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error(`Failed: ${name} (${res.status}) ${txt}`);
      return;
    }

    const arr = await res.arrayBuffer();
    const outPath = path.join(OUT_DIR, name + ".ogg");
    fs.writeFileSync(outPath, Buffer.from(arr));
    console.log(`✓ Saved: ${outPath}`);
  } catch (err) {
    console.error(`Error generating ${name}:`, err.message);
    
    // Generate mock audio as fallback
    if (USE_MOCK) {
      const mockHeader = Buffer.from([
        0x4F, 0x67, 0x67, 0x53,
        0x00, 0x02, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
      ]);
      const mockPayload = Buffer.alloc(2048, 0);
      const mockAudio = Buffer.concat([mockHeader, mockPayload]);
      const outPath = path.join(OUT_DIR, name + ".ogg");
      fs.writeFileSync(outPath, mockAudio);
      console.log(`✓ Saved mock audio: ${outPath}`);
    }
  }
}

/**
 * Main execution
 */
(async () => {
  console.log("Batch TTS Generation");
  console.log(`SSML Directory: ${SSML_DIR}`);
  console.log(`Output Directory: ${OUT_DIR}`);
  console.log(`Edge Base: ${EDGE_BASE}`);
  console.log(`Mock Mode: ${USE_MOCK ? "YES" : "NO"}`);
  console.log("");

  if (!fs.existsSync(SSML_DIR)) {
    console.error(`SSML directory not found: ${SSML_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SSML_DIR).filter(f => f.endsWith(".ssml"));

  if (files.length === 0) {
    console.error("No SSML files found in", SSML_DIR);
    process.exit(1);
  }

  console.log(`Found ${files.length} SSML file(s)\n`);

  for (const f of files) {
    await generateOne(path.join(SSML_DIR, f));
  }

  console.log("\n✓ All done!");
})();

