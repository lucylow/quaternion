// PATCHED BY CURSOR - lovable integration - src/components/LovableDebug.tsx
import React, { useEffect, useState } from 'react';
import { lovablyHealth } from '../utils/lovableClient';

export default function LovableDebug() {
  const [health, setHealth] = useState<{ ok?: boolean; reason?: string; error?: string } | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const h = await lovablyHealth();
        if (mounted) setHealth(h);
      } catch(e){ if (mounted) setHealth({ ok:false, error:String(e) }); }
    })();
    return () => { mounted = false; };
  }, []);
  return (
    <div style={{position:'fixed', right:8, top:80, zIndex:99999, background:'rgba(0,0,0,0.6)', color:'#fff', padding:8, borderRadius:8, fontSize:12}}>
      <div style={{fontWeight:700}}>Lovable</div>
      <div>Health: {health ? (health.ok ? 'ok' : JSON.stringify(health)) : 'checking...'}</div>
      <div style={{marginTop:6}}>
        <button onClick={async ()=>{ const r=await fetch('/api/lovably/health'); console.log('[QUAT DEBUG] lovably/health', await r.text()); }}>ping</button>
      </div>
    </div>
  );
}

