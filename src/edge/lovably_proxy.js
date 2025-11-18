// PATCHED BY CURSOR - lovable integration - src/edge/lovably_proxy.js
// Minimal edge/proxy for Lovable Cloud requests.
// Intended to run as an edge function (or mounted in express backend).
// It reads LOVABLE_API_KEY from environment and proxies safe JSON calls.

const fetch = require('node-fetch');

const LOVABLE_BASE = process.env.LOVABLE_BASE_URL || 'https://api.lovableproject.com'; // replace if needed
const LOVABLE_API_PATH = '/v1'; // adjust if Lovable uses different root

// health endpoint
async function handleHealth(req, res) {
  try {
    // optional: ping a lightweight Lovable endpoint
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return res.status(503).json({ ok:false, reason:'missing_lovably_key' });
    const r = await fetch(`${LOVABLE_BASE}/health`, { headers: { 'Authorization': `Bearer ${key}` }, method: 'GET' });
    const body = await r.text();
    return res.status(r.status).send(body);
  } catch (err) {
    console.error('[QUAT DEBUG] lovably_proxy.health err', err);
    return res.status(500).json({ ok:false, error:String(err) });
  }
}

// POST /api/lovably/llm -> forwards to Lovable LLM endpoint
async function handleLLM(req, res) {
  try {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return res.status(403).json({ ok:false, reason:'missing_lovably_key' });
    const body = req.body || {};
    // Basic validation: require prompt + intent
    if (!body.prompt) return res.status(400).json({ ok:false, reason:'missing_prompt' });

    // Proxy: forward to Lovable LLM (example path)
    const r = await fetch(`${LOVABLE_BASE}${LOVABLE_API_PATH}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: body.model || 'lovable-small',
        messages: body.messages || [{ role:'system', content: body.prompt }],
        max_tokens: body.max_tokens || 256,
        temperature: body.temperature ?? 0.2
      })
    });
    const json = await r.json();
    return res.status(r.status).json(json);
  } catch (err) {
    console.error('[QUAT DEBUG] lovably_proxy.llm err', err);
    return res.status(500).json({ ok:false, error:String(err) });
  }
}

// POST /api/lovably/assets -> request signed URL for asset or stream
async function handleAsset(req, res) {
  try {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return res.status(403).json({ ok:false, reason:'missing_lovably_key' });
    const { path } = req.body || {};
    if (!path) return res.status(400).json({ ok:false, reason:'missing_path' });

    // example: Lovable may provide signed URL endpoint; adapt if needed
    const r = await fetch(`${LOVABLE_BASE}${LOVABLE_API_PATH}/assets/signed-url`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    const json = await r.json();
    return res.status(r.status).json(json);
  } catch (err) {
    console.error('[QUAT DEBUG] lovably_proxy.asset err', err);
    return res.status(500).json({ ok:false, error:String(err) });
  }
}

// Exports to be used as Express middleware or edge function (adapt to your host)
module.exports = {
  handleHealth,
  handleLLM,
  handleAsset
};

