#!/usr/bin/env bash

set -euo pipefail

OUTDIR="./voices_to_tts"
ZIP="./voices_to_tts.zip"

rm -rf "$OUTDIR" "$ZIP"
mkdir -p "$OUTDIR"

# SSML files
cat > "$OUTDIR/lian_1.ssml" <<'SSML'
<speak>
  <voice name="Lian">
    <prosody rate="0.98">Hold the chokepoint — buy us time.</prosody>
    <break time="180ms"/>
  </voice>
</speak>
SSML

cat > "$OUTDIR/lian_2.ssml" <<'SSML'
<speak>
  <voice name="Lian">
    <prosody rate="0.95"><emphasis level="moderate">We move when I say we move.</emphasis></prosody>
    <break time="150ms"/>
  </voice>
</speak>
SSML

cat > "$OUTDIR/mara_1.ssml" <<'SSML'
<speak>
  <voice name="Mara">
    <prosody rate="0.92">Please — listen. It remembers more than we do.</prosody>
    <break time="250ms"/>
  </voice>
</speak>
SSML

cat > "$OUTDIR/mara_2.ssml" <<'SSML'
<speak>
  <voice name="Mara">
    <prosody rate="0.96"><emphasis level="moderate">There must be another way.</emphasis></prosody>
    <break time="200ms"/>
  </voice>
</speak>
SSML

cat > "$OUTDIR/patch_1.ssml" <<'SSML'
<speak>
  <voice name="Patch">
    <prosody rate="1.05">Alarms: loud. Morale: quieter than you, commander.</prosody>
    <break time="120ms"/>
  </voice>
</speak>
SSML

cat > "$OUTDIR/patch_2.ssml" <<'SSML'
<speak>
  <voice name="Patch">
    <prosody rate="1.08">Scanning... nothing helpful. Sending passive judgement.</prosody>
    <break time="100ms"/>
  </voice>
</speak>
SSML

# Plain text versions (strip tags manually for quick copy)
cat > "$OUTDIR/lian_1.txt" <<'TXT'
Hold the chokepoint — buy us time.
TXT

cat > "$OUTDIR/lian_2.txt" <<'TXT'
We move when I say we move.
TXT

cat > "$OUTDIR/mara_1.txt" <<'TXT'
Please — listen. It remembers more than we do.
TXT

cat > "$OUTDIR/mara_2.txt" <<'TXT'
There must be another way.
TXT

cat > "$OUTDIR/patch_1.txt" <<'TXT'
Alarms: loud. Morale: quieter than you, commander.
TXT

cat > "$OUTDIR/patch_2.txt" <<'TXT'
Scanning... nothing helpful. Sending passive judgement.
TXT

# Mock OGG placeholders (silent-ish files; replace with real TTS audio later)
# Create small placeholder OGG-like binary files (not real audio but works as dummy bytes)
for f in lian_1 lian_2 mara_1 mara_2 patch_1 patch_2; do
  # write a small header + zeros (simple placeholder)
  printf 'OggS' > "$OUTDIR/${f}.ogg"
  dd if=/dev/zero bs=1 count=8192 >> "$OUTDIR/${f}.ogg" 2>/dev/null || python - <<PY
open("$OUTDIR/${f}.ogg","ab").write(b"\x00"*8192)
PY
done

# mapping.json
cat > "$OUTDIR/mapping.json" <<'JSON'
[
  {"character":"Lian","id":"lian_1","ssml_file":"lian_1.ssml","text_file":"lian_1.txt","mock_audio":"lian_1.ogg","recommended_voice":"Lian"},
  {"character":"Lian","id":"lian_2","ssml_file":"lian_2.ssml","text_file":"lian_2.txt","mock_audio":"lian_2.ogg","recommended_voice":"Lian"},
  {"character":"Mara","id":"mara_1","ssml_file":"mara_1.ssml","text_file":"mara_1.txt","mock_audio":"mara_1.ogg","recommended_voice":"Mara"},
  {"character":"Mara","id":"mara_2","ssml_file":"mara_2.ssml","text_file":"mara_2.txt","mock_audio":"mara_2.ogg","recommended_voice":"Mara"},
  {"character":"Patch","id":"patch_1","ssml_file":"patch_1.ssml","text_file":"patch_1.txt","mock_audio":"patch_1.ogg","recommended_voice":"Patch"},
  {"character":"Patch","id":"patch_2","ssml_file":"patch_2.ssml","text_file":"patch_2.txt","mock_audio":"patch_2.ogg","recommended_voice":"Patch"}
]
JSON

# README
cat > "$OUTDIR/README.txt" <<'README'
voices_to_tts package
--------------------
Contents:
- 6 SSML files (.ssml): micro-vignettes for Lian, Mara, Patch
- Plain text files (.txt) for quick copy/paste
- Mock audio files (.ogg) as placeholders (silent/placeholder)
- mapping.json describing each item

How to use:
1. Drop this folder into your project's public/assets directory or serve it from your server.
2. For local demo without real TTS provider, use the .ogg mock files with AudioManager.playTtsArrayBuffer() (they are placeholders).
3. For real TTS: call your Edge function (cloud/edge/tts.js) and store the returned audio blob to replace the mock .ogg files, or play blobs directly in memory.
4. Example client flow to play TTS (frontend):
   const arr = await requestTtsAudio({ text: ssmlString, voice: 'Mara', ssml: true });
   await AudioManager.instance().playTtsArrayBuffer(arr, { duckMusic: true });

Mock mode:
- If your edge function supports mock mode (TTS_MOCK=true), the handler will return placeholder bytes similar to these .ogg placeholders.

Notes:
- Replace placeholders with real TTS outputs for final submission.
README

# Create zip
rm -f "$ZIP"
zip -r "$ZIP" "$(basename "$OUTDIR")"

echo "Created $OUTDIR/ with files:"
ls -la "$OUTDIR"
echo "Zipped to $ZIP"

