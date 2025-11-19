// tts.ts
// TTS playback helper for ElevenLabs and other TTS assets

export async function playTTSUrl(url: string): Promise<void> {
  try {
    // url could be local path like '/audio/voices/lian_archive_awaken.ogg' or remote
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed fetching TTS asset: ${resp.status} ${resp.statusText}`);
    }
    
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const audio = new Audio(blobUrl);
    
    // Wait for audio to be ready
    await new Promise<void>((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => resolve(), { once: true });
      audio.addEventListener('error', (e) => reject(e), { once: true });
      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('Audio load timeout')), 10000);
    });
    
    await audio.play();
    
    // Clean up blob URL after playback completes or timeout
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(blobUrl);
    }, { once: true });
    
    // Also revoke after a timeout (30 seconds)
    setTimeout(() => {
      if (!audio.ended) {
        URL.revokeObjectURL(blobUrl);
      }
    }, 30000);
    
  } catch (err) {
    console.error('playTTSUrl error', err);
    throw err;
  }
}

// Helper to play TTS from a local path (assumes file is in public/audio/voices/)
export async function playTTSFile(filename: string): Promise<void> {
  const url = `/audio/voices/${filename}`;
  return playTTSUrl(url);
}

