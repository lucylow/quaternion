// src/components/DebugOverlay.tsx

import React, { useEffect, useState } from 'react';

export default function DebugOverlay() {
  const [logs, setLogs] = useState<Array<{ level: string; args: any[]; ts: number }>>([]);
  const [entityCount, setEntityCount] = useState<number | null>(null);
  const [fps, setFps] = useState<number>(0);

  useEffect(() => {
    (window as any).__QUAT_LOGS__ = (window as any).__QUAT_LOGS__ || [];
    const origErr = console.error;
    const origWarn = console.warn;
    
    console.error = function(...args: any[]) {
      try {
        ((window as any).__QUAT_LOGS__ as any[]).push({ level: 'error', args, ts: Date.now() });
        if (((window as any).__QUAT_LOGS__ as any[]).length > 100) {
          ((window as any).__QUAT_LOGS__ as any[]).shift();
        }
      } catch (e) {
        // ignore
      }
      origErr.apply(console, args as any);
    };
    
    console.warn = function(...args: any[]) {
      try {
        ((window as any).__QUAT_LOGS__ as any[]).push({ level: 'warn', args, ts: Date.now() });
        if (((window as any).__QUAT_LOGS__ as any[]).length > 100) {
          ((window as any).__QUAT_LOGS__ as any[]).shift();
        }
      } catch (e) {
        // ignore
      }
      origWarn.apply(console, args as any);
    };
    
    const iv = setInterval(() => {
      const quatLogs = (window as any).__QUAT_LOGS__ || [];
      setLogs(quatLogs.slice(-20));
      
      // Try to get entity count from engine
      try {
        if ((window as any).quaternionEngine && typeof (window as any).quaternionEngine.getEntityCount === 'function') {
          (window as any).quaternionEngine.getEntityCount().then((count: number) => {
            setEntityCount(count);
          }).catch(() => {});
        }
      } catch (e) {
        // ignore
      }
      
      // Try to get FPS from Phaser game
      try {
        const game = (window as any).__QUAT_PHASER_GAME__;
        if (game && game.loop && game.loop.actualFps) {
          setFps(Math.round(game.loop.actualFps));
        }
      } catch (e) {
        // ignore
      }
    }, 500);
    
    return () => {
      clearInterval(iv);
      console.error = origErr;
      console.warn = origWarn;
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      right: 8,
      top: 8,
      width: 420,
      maxHeight: '60vh',
      overflow: 'auto',
      zIndex: 99999,
      fontSize: 12,
      color: '#fff',
      background: 'rgba(0, 0, 0, 0.7)',
      padding: 8,
      borderRadius: 6,
      fontFamily: 'monospace'
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>[QUAT DEBUG] Console</div>
      {entityCount !== null && <div style={{ marginBottom: 4, color: '#6ce2a0' }}>Entities: {entityCount}</div>}
      {fps > 0 && <div style={{ marginBottom: 4, color: '#6ce2a0' }}>FPS: {fps}</div>}
      {logs.map((l, i) => (
        <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ opacity: 0.8, fontSize: 11 }}>
            {new Date(l.ts).toLocaleTimeString()} {l.level}
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 11, maxHeight: 100, overflow: 'auto' }}>
            {String(l.args?.map((a: any) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '))}
          </pre>
        </div>
      ))}
    </div>
  );
}

