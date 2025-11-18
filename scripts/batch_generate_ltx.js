// scripts/batch_generate_ltx.js
// Node batch script for pre-generating LTX videos (useful for Devpost assets, CI, etc.)
// Reads jobs from scripts/ltx_jobs.json and writes videos to assets/ltx_videos/

const fs = require('fs');
const path = require('path');

const EDGE_BASE = process.env.EDGE_BASE || process.env.VITE_API_BASE || 'http://localhost:3000';
const JOBS_FILE = path.join(__dirname, 'ltx_jobs.json');
const OUT_DIR = path.join(__dirname, '..', 'assets', 'ltx_videos');

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUT_DIR}`);
}

async function runJob(job) {
  const endpoint = job.type === 'image' 
    ? '/api/ai/ltx/image-to-video' 
    : '/api/ai/ltx/text-to-video';
  
  console.log(`\n[${job.name}] Running ${job.type} job...`);
  console.log(`  Prompt: ${job.payload.prompt?.substring(0, 60)}...`);
  
  try {
    const res = await fetch(`${EDGE_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job.payload)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Job failed ${res.status}: ${txt}`);
    }

    // Check if response is JSON (cached URL) or binary
    const contentType = res.headers.get('content-type') || '';
    let buffer;

    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (data.url) {
        console.log(`  Cached URL found, downloading from: ${data.url}`);
        const videoRes = await fetch(data.url);
        buffer = Buffer.from(await videoRes.arrayBuffer());
      } else {
        throw new Error('Unexpected JSON response');
      }
    } else {
      // Binary video response
      const arr = await res.arrayBuffer();
      buffer = Buffer.from(arr);
    }

    const outPath = path.join(OUT_DIR, `${job.name}.mp4`);
    fs.writeFileSync(outPath, buffer);
    
    const sizeKB = (buffer.length / 1024).toFixed(2);
    console.log(`  ✓ Saved ${sizeKB} KB to ${outPath}`);
    
    return { success: true, path: outPath, size: buffer.length };
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  if (!fs.existsSync(JOBS_FILE)) {
    console.error(`Jobs file not found: ${JOBS_FILE}`);
    console.error('Please create scripts/ltx_jobs.json with your video generation jobs.');
    process.exit(1);
  }

  const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
  console.log(`Found ${jobs.length} job(s) to process`);
  console.log(`Edge base URL: ${EDGE_BASE}`);
  console.log(`Output directory: ${OUT_DIR}\n`);

  const results = [];
  for (const job of jobs) {
    const result = await runJob(job);
    results.push({ name: job.name, ...result });
    
    // Small delay between jobs to avoid rate limiting
    if (jobs.indexOf(job) < jobs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n=== Summary ===');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Successful: ${successful}/${jobs.length}`);
  console.log(`Failed: ${failed}/${jobs.length}`);
  
  if (failed > 0) {
    console.log('\nFailed jobs:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }
  
  console.log('\nAll jobs completed successfully!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

