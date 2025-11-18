// PATCHED BY CURSOR - lovable integration - src/utils/lovableClient.js
// Browser-side client that calls local edge endpoints added above.
// Keeps a tiny in-memory cache for signed URLs and LLM results.

const CACHE = { signedUrls: {}, llm: {} };

export async function lovablyHealth() {
  try {
    const r = await fetch('/api/lovably/health');
    return r.ok ? await r.json() : { ok:false };
  } catch (e) { console.warn('[QUAT DEBUG] lovablyHealth err', e); return { ok:false }; }
}

export async function lovablyLLM(promptOrMessages, opts = {}) {
  try {
    const body = (typeof promptOrMessages === 'string') ? { prompt: promptOrMessages } : promptOrMessages;
    const r = await fetch('/api/lovably/llm', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...body, ...opts })
    });
    if (!r.ok) {
      const txt = await r.text();
      console.warn('[QUAT DEBUG] lovablyLLM non-ok', r.status, txt);
      throw new Error('lovablyLLM non-ok ' + r.status);
    }
    const json = await r.json();
    // cache small results by hash key
    const k = JSON.stringify(body).slice(0,200);
    CACHE.llm[k] = json;
    return json;
  } catch (err) {
    console.error('[QUAT DEBUG] lovablyLLM error', err);
    return { error: String(err) };
  }
}

export async function lovablySignedAsset(path) {
  try {
    if (CACHE.signedUrls[path]) return CACHE.signedUrls[path];
    const r = await fetch('/api/lovably/assets', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ path })
    });
    const json = await r.json();
    if (r.ok && json && json.url) {
      CACHE.signedUrls[path] = json.url;
      return json.url;
    }
    throw new Error('no signed url');
  } catch (err) {
    console.warn('[QUAT DEBUG] lovablySignedAsset error', err);
    return null;
  }
}

