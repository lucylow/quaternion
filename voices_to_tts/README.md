voices_to_tts — batch TTS asset pack
===================================

Files:

 - ssml.json             (36 SSML entries: character lines + missions + lore)

 - cinematic_intro.ssml  (single cinematic SSML)

 - monster_sfx.json      (6 monster SFX SSML entries)


Usage:

  1. Configure either:

     - a TTS_PROXY_URL (recommended): point to your serverless function that calls ElevenLabs using your secret.

       Example: export TTS_PROXY_URL=http://localhost:3000/generate-tts

     OR

     - ELEVENLABS_API_KEY (direct): export ELEVENLABS_API_KEY=sk-...

       Note: direct mode calls ElevenLabs API directly.



  2. Optional: adjust concurrency:

     export TTS_CONCURRENCY=4



  3. Run:

     node scripts/generate_voices_batch.js



  4. Output will be stored in: public/audio/voices/

     Create a zip: (from repo root)

     zip -r voices_to_deploy.zip public/audio/voices


Caveats:

 - Check API limits & billing before generating many files.

 - For demos, pre-generate assets (offline) to avoid runtime latency & cost.

