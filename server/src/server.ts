// server.ts
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { query } from './db.js';
import { computeShares, defaultSplit } from './revenue.js';
import { createObjectCsvWriter } from 'csv-writer';
import cors from 'cors';
import narrativeRouter from './narrative.js';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-11-13' });

const app = express();
app.use(bodyParser.json({ verify: (req: any, res, buf) => { (req as any).rawBody = buf } }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

const PORT = process.env.PORT || 4000;

/**
 * Minimal auth stub: in production replace with real JWT/session
 */
function requireUser(req: any) {
  // Accept header X-User-Id for demo convenience
  const uid = req.header('x-user-id');
  if (!uid) throw new Error('Unauthorized: missing x-user-id header (demo)');
  return uid;
}

/**
 * Create Checkout Session for a single item purchase (cosmetic, etc).
 * Accepts optional `creator_code` to apply revenue share.
 */
app.post('/api/shop/create-checkout', async (req, res) => {
  try {
    const userId = requireUser(req);
    const { itemSku, creatorCode } = req.body;
    // fetch item
    const it = await query('SELECT * FROM items WHERE sku=$1 LIMIT 1', [itemSku]);
    if (it.rowCount === 0) return res.status(404).json({ error: 'item not found' });
    const item = it.rows[0];
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: item.currency,
          product_data: { name: item.name, metadata: { sku: item.sku } },
          unit_amount: item.price_cents
        },
        quantity: 1
      }],
      success_url: `${process.env.FRONTEND_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/purchase/cancel`,
      metadata: { userId, itemId: item.id, creatorCode: creatorCode || '' }
    });
    res.json({ url: session.url });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Create subscription (Stripe Checkout)
 */
app.post('/api/subscription/create', async (req, res) => {
  try {
    const userId = requireUser(req);
    const { priceId } = req.body; // stripe price ID for monthly/annual
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: { userId }
    });
    res.json({ url: session.url });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Endpoint: claim battle pass reward (requires progression checks)
 */
app.post('/api/battlepass/claim', async (req, res) => {
  try {
    const userId = requireUser(req);
    const { level } = req.body;
    const bp = await query('SELECT * FROM battlepass_progress WHERE user_id=$1', [userId]);
    if (bp.rowCount === 0) return res.status(404).json({ error: 'no battlepass progress' });
    const progress = bp.rows[0];
    if (progress.level < level) return res.status(400).json({ error: 'level not reached' });
    // grant entitlement for a reward (mapping level->item id could be stored in items.metadata)
    const rewardItemId = await getRewardItemIdForLevel(level);
    await query('INSERT INTO entitlements(user_id, item_id, source) VALUES($1,$2,$3)', [userId, rewardItemId, 'battlepass']);
    res.json({ ok: true, grantedItemId: rewardItemId });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

async function getRewardItemIdForLevel(level: number) {
  // demo mapping: look up item with metadata->battlepass_level == level
  const r = await query("SELECT id FROM items WHERE metadata ->> 'battlepass_level' = $1 LIMIT 1", [String(level)]);
  return r.rowCount ? r.rows[0].id : null;
}

/**
 * Simple entitlement listing
 */
app.get('/api/user/entitlements', async (req, res) => {
  try {
    const userId = requireUser(req);
    const r = await query('SELECT e.*, i.name, i.sku FROM entitlements e JOIN items i ON e.item_id = i.id WHERE e.user_id=$1', [userId]);
    res.json({ items: r.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Stripe webhook handler
 * - listens for checkout.session.completed to record purchases
 * - invoice.payment_succeeded for subscriptions
 */
app.post('/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), async (req: any, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    console.error('Webhook signature error', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      // metadata contains userId, itemId, creatorCode
      const userId = session.metadata?.userId;
      const itemId = session.metadata?.itemId;
      const creatorCode = session.metadata?.creatorCode || null;
      // record purchase
      const amount = session.amount_total ?? session.display_items?.[0]?.amount ?? 0;
      const currency = (session.currency || 'usd').toLowerCase();

      // compute revenue split
      const hasCreator = !!creatorCode;
      const { creatorPct, platformPct, studioPct } = defaultSplit(hasCreator);
      const splits = computeShares(amount, { creatorPct, platformPct, studioPct });

      // find creator id if code present
      let creatorId = null;
      if (creatorCode) {
        const cr = await query('SELECT * FROM creator_codes WHERE code=$1', [creatorCode]);
        if (cr.rowCount) creatorId = cr.rows[0].creator_id;
      }

      // insert purchases and revenue record
      const purchaseRes = await query(
        `INSERT INTO purchases(user_id, item_id, amount_cents, currency, stripe_session_id, creator_code, creator_share_cents, platform_fee_cents, net_revenue_cents)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
         [userId, itemId, amount, currency, session.id, creatorCode, splits.creator, splits.platform, splits.studio]
      );
      const purchaseId = purchaseRes.rows[0].id;

      if (creatorId) {
        await query(
          `INSERT INTO revenue_records(purchase_id, creator_id, gross_cents, creator_cents, platform_cents, studio_cents)
           VALUES($1,$2,$3,$4,$5,$6)`,
           [purchaseId, creatorId, amount, splits.creator, splits.platform, splits.studio]
        );
      } else {
        await query(
          `INSERT INTO revenue_records(purchase_id, gross_cents, creator_cents, platform_cents, studio_cents)
           VALUES($1,$2,$3,$4,$5)`,
           [purchaseId, amount, splits.creator, splits.platform, splits.studio]
        );
      }

      // grant entitlement to user
      await query(`INSERT INTO entitlements(user_id, item_id, source) VALUES($1,$2,$3)`, [userId, itemId, 'purchase']);
      console.log('Recorded purchase', purchaseId);
    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      // You may grant subscription entitlements or update subscription table
      console.log('Invoice payment succeeded:', invoice.id);
    }
    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler error', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: export pending payouts to CSV (aggregates revenue_records by creator)
 */
app.get('/admin/payouts/export', async (req, res) => {
  try {
    // In production authenticate admin strongly!
    const rows = await query(`
      SELECT r.creator_id, c.name as creator_name, sum(r.creator_cents) as total_creator_cents
      FROM revenue_records r
      JOIN creators c ON c.id = r.creator_id
      WHERE r.creator_cents > 0
      GROUP BY r.creator_id, c.name
    `);
    const records = rows.rows.map((r:any) => ({ creator_id: r.creator_id, creator_name: r.creator_name, amount_cents: r.total_creator_cents }));
    // write CSV temp
    const csvWriter = createObjectCsvWriter({
      path: '/tmp/payouts.csv',
      header: [{id:'creator_id', title:'creator_id'},{id:'creator_name', title:'creator_name'},{id:'amount_cents', title:'amount_cents'}]
    });
    await csvWriter.writeRecords(records);
    res.download('/tmp/payouts.csv', 'payouts.csv');
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Mount narrative routes
app.use('/api/narrative', narrativeRouter);

app.listen(PORT, () => {
  console.log(`Monetization API listening on ${PORT}`);
});

