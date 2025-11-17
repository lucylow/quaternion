# PowerShell script to create voices_to_tts package
# Run with: powershell -ExecutionPolicy Bypass -File make_voices_to_tts.ps1

$OutDir = "voices_to_tts"
$ZipFile = "voices_to_tts.zip"

Remove-Item -Recurse -Force $OutDir -ErrorAction SilentlyContinue
Remove-Item -Force $ZipFile -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $OutDir | Out-Null

# SSML files
@"
<speak>
  <voice name="Lian">
    <prosody rate="0.98">Hold the chokepoint — buy us time.</prosody>
    <break time="180ms"/>
  </voice>
</speak>
"@ | Out-File -FilePath "$OutDir\lian_1.ssml" -Encoding utf8 -NoNewline

@"
<speak>
  <voice name="Lian">
    <prosody rate="0.95"><emphasis level="moderate">We move when I say we move.</emphasis></prosody>
    <break time="150ms"/>
  </voice>
</speak>
"@ | Out-File -FilePath "$OutDir\lian_2.ssml" -Encoding utf8 -NoNewline

@"
<speak>
  <voice name="Mara">
    <prosody rate="0.92">Please — listen. It remembers more than we do.</prosody>
    <break time="250ms"/>
  </voice>
</speak>
"@ | Out-File -FilePath "$OutDir\mara_1.ssml" -Encoding utf8 -NoNewline

@"
<speak>
  <voice name="Mara">
    <prosody rate="0.96"><emphasis level="moderate">There must be another way.</emphasis></prosody>
    <break time="200ms"/>
  </voice>
</speak>
"@ | Out-File -FilePath "$OutDir\mara_2.ssml" -Encoding utf8 -NoNewline

@"
<speak>
  <voice name="Patch">
    <prosody rate="1.05">Alarms: loud. Morale: quieter than you, commander.</prosody>
    <break time="120ms"/>
  </voice>
</speak>
"@ | Out-File -FilePath "$OutDir\patch_1.ssml" -Encoding utf8 -NoNewline

@"
<speak>
  <voice name="Patch">
    <prosody rate="1.08">Scanning... nothing helpful. Sending passive judgement.</prosody>
    <break time="100ms"/>
  </voice>
</speak>
"@ | Out-File -FilePath "$OutDir\patch_2.ssml" -Encoding utf8 -NoNewline

# Plain text files
"Hold the chokepoint — buy us time." | Out-File -FilePath "$OutDir\lian_1.txt" -Encoding utf8 -NoNewline
"We move when I say we move." | Out-File -FilePath "$OutDir\lian_2.txt" -Encoding utf8 -NoNewline
"Please — listen. It remembers more than we do." | Out-File -FilePath "$OutDir\mara_1.txt" -Encoding utf8 -NoNewline
"There must be another way." | Out-File -FilePath "$OutDir\mara_2.txt" -Encoding utf8 -NoNewline
"Alarms: loud. Morale: quieter than you, commander." | Out-File -FilePath "$OutDir\patch_1.txt" -Encoding utf8 -NoNewline
"Scanning... nothing helpful. Sending passive judgement." | Out-File -FilePath "$OutDir\patch_2.txt" -Encoding utf8 -NoNewline

# Mock OGG placeholders
$dummy = [byte[]](0..8191 | ForEach-Object {0})
$header = [System.Text.Encoding]::ASCII.GetBytes("OggS")
$files = @("lian_1", "lian_2", "mara_1", "mara_2", "patch_1", "patch_2")
foreach ($f in $files) {
    $bytes = $header + $dummy
    [System.IO.File]::WriteAllBytes("$OutDir\$f.ogg", $bytes)
}

# mapping.json
@"
[
  {"character":"Lian","id":"lian_1","ssml_file":"lian_1.ssml","text_file":"lian_1.txt","mock_audio":"lian_1.ogg","recommended_voice":"Lian"},
  {"character":"Lian","id":"lian_2","ssml_file":"lian_2.ssml","text_file":"lian_2.txt","mock_audio":"lian_2.ogg","recommended_voice":"Lian"},
  {"character":"Mara","id":"mara_1","ssml_file":"mara_1.ssml","text_file":"mara_1.txt","mock_audio":"mara_1.ogg","recommended_voice":"Mara"},
  {"character":"Mara","id":"mara_2","ssml_file":"mara_2.ssml","text_file":"mara_2.txt","mock_audio":"mara_2.ogg","recommended_voice":"Mara"},
  {"character":"Patch","id":"patch_1","ssml_file":"patch_1.ssml","text_file":"patch_1.txt","mock_audio":"patch_1.ogg","recommended_voice":"Patch"},
  {"character":"Patch","id":"patch_2","ssml_file":"patch_2.ssml","text_file":"patch_2.txt","mock_audio":"patch_2.ogg","recommended_voice":"Patch"}
]
"@ | Out-File -FilePath "$OutDir\mapping.json" -Encoding utf8 -NoNewline

# README
@"
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
"@ | Out-File -FilePath "$OutDir\README.txt" -Encoding utf8 -NoNewline

# Create zip
Compress-Archive -Path $OutDir -DestinationPath $ZipFile -Force

Write-Output "Created $OutDir with files:"
Get-ChildItem $OutDir
Write-Output "Zipped to $ZipFile"

