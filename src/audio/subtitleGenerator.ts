// src/audio/subtitleGenerator.ts
export type DialogueLine = { start: number, end: number, speaker?: string, text: string };

export function dialogueLinesToWebVTT(lines: DialogueLine[]) {
  const header = 'WEBVTT\n\n';
  const body = lines.map((l, i) => {
    const s = msToVtt(l.start), e = msToVtt(l.end);
    const speaker = l.speaker ? `${l.speaker}: ` : '';
    return `${i+1}\n${s} --> ${e}\n${speaker}${l.text}\n`;
  }).join('\n');
  return header + body;
}

function msToVtt(ms: number) {
  const tot = Math.floor(ms);
  const hh = Math.floor(tot / 3600000);
  const mm = Math.floor((tot % 3600000) / 60000);
  const ss = Math.floor((tot % 60000) / 1000);
  const ms2 = tot % 1000;
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}.${padMs(ms2)}`;
}
function pad(n: number) { return n.toString().padStart(2, '0'); }
function padMs(n: number) { return n.toString().padStart(3, '0'); }

