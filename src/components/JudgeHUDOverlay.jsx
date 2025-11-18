// src/components/JudgeHUDOverlay.jsx
// A compact Judge HUD overlay that integrates with useReplay hook.
// Import and render in your top-level game view, pass seed, mapConfig and commanderId props.
//
// Example: <JudgeHUDOverlay seed={seed} mapConfig={mapConfig} commanderId={commanderId} />

import React, { useMemo, useState } from 'react';
import useReplay from '../hooks/useReplay';

function short(s, n = 140) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export default function JudgeHUDOverlay({ seed, mapConfig, commanderId }) {
  const { state, generateReplay, getReplay, downloadReplay, shareReplay, getCached } = useReplay();
  const [open, setOpen] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [lastError, setLastError] = useState(null);

  const cached = useMemo(() => getCached(), [getCached]);

  const onGenerate = async (mode = 'fast') => {
    setLastError(null);
    const payload = { seed, mapConfig, commanderId, mode };
    const res = await generateReplay(payload);
    if (!res) setLastError('Generation failed or timed out');
  };

  const onDownload = async () => {
    if (!state.metadata) {
      setLastError('No replay metadata available');
      return;
    }
    try {
      await downloadReplay(state.metadata);
    } catch (e) {
      setLastError(e.message || String(e));
    }
  };

  const onShare = async () => {
    if (!state.metadata) {
      setLastError('No replay metadata to share');
      return;
    }
    try {
      await shareReplay(state.metadata);
      // small UI hint
      setLastError('Replay link copied to clipboard');
      setTimeout(() => setLastError(null), 2000);
    } catch (e) {
      setLastError('Copy failed');
    }
  };

  const meta = state.metadata || null;

  return (
    <div style={{
      position: 'absolute',
      top: 12,
      right: 12,
      zIndex: 2000,
      maxWidth: 420,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{
        background: 'rgba(12,12,14,0.9)',
        color: '#fff',
        borderRadius: 8,
        padding: 10,
        boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
        fontSize: 13,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong>Judge HUD</strong>
          <div>
            <button aria-label="collapse expand" onClick={() => setOpen(!open)} style={{ marginLeft: 8 }}>
              {open ? '▾' : '▸'}
            </button>
          </div>
        </div>

        {!open ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12 }}>Seed: {seed}</div>
            <div style={{ fontSize: 12 }}>Commander: {commanderId}</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>
              <button onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>Open HUD</button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
              <div style={{ fontSize: 12 }}>Seed: <code style={{ background:'#111', padding:'2px 6px', borderRadius:4 }}>{seed}</code></div>
              <div style={{ fontSize: 12 }}>Map: {mapConfig?.type || '—'}</div>
            </div>

            <div style={{ marginTop: 8, fontSize: 12 }}>
              <div><strong>Commander:</strong> {commanderId}</div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => onGenerate('fast')} disabled={state.loading} aria-label="Generate replay">
                  {state.loading ? 'Generating…' : 'Generate Replay (fast)'}
                </button>
                <button onClick={() => onGenerate('full')} disabled={state.loading} style={{ marginLeft: 8 }}>
                  Generate Replay (full)
                </button>
                <button onClick={onDownload} disabled={!meta} style={{ marginLeft: 8 }}>
                  Download Replay
                </button>
                <button onClick={onShare} disabled={!meta} style={{ marginLeft: 8 }}>
                  Share Link
                </button>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12 }}>
                <strong>Engine commit:</strong> {meta?.meta?.engineCommit ? <code style={{background:'#111', padding:'1px 6px', borderRadius:4}}>{meta.meta.engineCommit.slice(0,8)}</code> : '—'}
                {meta?.meta?.partial ? <span style={{marginLeft:8, color:'#ffb86b'}}>Partial replay</span> : null}
              </div>
            </div>

            <div style={{ marginTop: 8, fontSize: 13 }}>
              <strong>Judge Summary</strong>
              <div style={{ marginTop: 6, background:'#0b0b0d', padding:8, borderRadius:6, minHeight:48 }}>
                {meta?.summary ? <div>{meta.summary}</div> : <div style={{ opacity: 0.6 }}>No summary yet — click Generate Replay at game end.</div>}
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <strong>Top AI Highlights</strong>
              <ol style={{ marginTop: 6 }}>
                {meta?.aiHighlights?.slice(0,3)?.map((h, idx) => (
                  <li key={`highlight-${h.action || h.actor || ''}-${h.t}-${idx}`} style={{ fontSize: 12 }}>
                    <span style={{ color:'#9bd' }}>{h.t}s</span> — <strong>{h.actor}</strong> — {h.action} — <span title={h.reason}>{short(h.reason)}</span>
                  </li>
                )) || <li style={{ opacity: 0.6 }}>None yet</li>}
              </ol>
            </div>

            <div style={{ marginTop: 8 }}>
              <strong>Recent Actions</strong>
              <ul style={{ maxHeight: 120, overflowY: 'auto', marginTop: 6 }}>
                {meta?.actions?.slice(-8).reverse().map((a, i) => (
                  <li key={`action-${a.type}-${a.t || a.timestamp || i}-${i}`} style={{ fontSize: 12 }}>
                    <span style={{ color:'#9bd' }}>{a.t}s</span> — {a.actor} — {a.type} — <span title={a.reason}>{short(a.reason, 80)}</span>
                  </li>
                )) || <li style={{ opacity: 0.6 }}>No actions</li>}
              </ul>
            </div>

            <div style={{ marginTop: 8 }}>
              <button onClick={() => setShowJson(true)} disabled={!meta}>Replay Details</button>
            </div>

            {lastError && (
              <div style={{ marginTop: 8, color: '#ff8080' }}>{lastError}</div>
            )}
          </div>
        )}

        {showJson && meta && (
          <div style={{
            marginTop: 10,
            background: '#070708',
            padding: 10,
            borderRadius: 6,
            maxHeight: 360,
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Replay JSON</strong>
              <div>
                <button onClick={() => {
                  const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `replay-${meta.replayId}.json`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}>Download JSON</button>
                <button onClick={() => setShowJson(false)} style={{ marginLeft: 8 }}>Close</button>
              </div>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, marginTop: 8 }}>
              {JSON.stringify(meta, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}


