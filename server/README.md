# Monetization Server

Complete monetization system for Quaternion game with Stripe integration, revenue sharing, battle pass, and creator codes.

## Quick Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_`)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret from Stripe dashboard
- `JWT_SECRET` - Secret for JWT tokens (in production)
- `FRONTEND_URL` - Your frontend URL (e.g., `http://localhost:3000`)

### 3. Database Setup

Apply the schema to your PostgreSQL database:

```bash
psql $DATABASE_URL -f src/models.sql
```

Or using a database client, run the contents of `src/models.sql`.

**Note:** If `gen_random_uuid()` doesn't work, enable the extension:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 4. Seed Data (Optional)

Create some test items and creators:

```sql
-- Insert a test item
INSERT INTO items (sku, name, price_cents, currency, type) 
VALUES ('cosmetic_001', 'Cool Skin', 999, 'usd', 'cosmetic');

-- Insert a test creator
INSERT INTO creators (name, payment_address) 
VALUES ('Test Creator', 'acct_xxx');

-- Insert a creator code
INSERT INTO creator_codes (code, creator_id, pct_share) 
VALUES ('CREATOR123', (SELECT id FROM creators LIMIT 1), 0.30);
```

### 5. Run the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on port 4000 (or the port specified in `.env`).

## API Endpoints

### Shop

- `POST /api/shop/create-checkout` - Create Stripe checkout session for an item
  - Body: `{ itemSku: string, creatorCode?: string }`
  - Headers: `x-user-id: <userId>`

### Subscriptions

- `POST /api/subscription/create` - Create subscription checkout
  - Body: `{ priceId: string }` (Stripe Price ID)
  - Headers: `x-user-id: <userId>`

### Battle Pass

- `POST /api/battlepass/claim` - Claim battle pass reward
  - Body: `{ level: number }`
  - Headers: `x-user-id: <userId>`

### User Entitlements

- `GET /api/user/entitlements` - Get user's owned items
  - Headers: `x-user-id: <userId>`

### Webhooks

- `POST /webhooks/stripe` - Stripe webhook handler
  - Handles `checkout.session.completed` and `invoice.payment_succeeded`

### Admin

- `GET /admin/payouts/export` - Export creator payouts to CSV
  - **Note:** Add authentication in production!

## Frontend Integration

Use the `usePurchases` hook in your React components:

```tsx
import { usePurchases } from '@/hooks/usePurchases';

function MyComponent() {
  const { createCheckout, loading } = usePurchases();
  
  const handleBuy = async () => {
    await createCheckout('cosmetic_001', 'CREATOR123');
  };
  
  return <button onClick={handleBuy} disabled={loading}>Buy</button>;
}
```

Or use the `ShopButton` component:

```tsx
import ShopButton from '@/components/ShopButton';

<ShopButton sku="cosmetic_001" name="Cool Skin" price={999} />
```

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env`

For local development, use Stripe CLI:

```bash
stripe listen --forward-to localhost:4000/webhooks/stripe
```

This will give you a webhook secret starting with `whsec_`.

## Revenue Sharing

The system automatically splits revenue:
- **With creator code:** 30% creator, 20% platform, 50% studio
- **Without creator code:** 0% creator, 20% platform, 80% studio

Adjust these percentages in `src/revenue.ts`.

## Battle Pass Progression

Award XP to users:

```typescript
import { awardXp } from './battlepass';

await awardXp(userId, 100); // Awards 100 XP, auto-calculates level
```

Levels are calculated as `floor(xp / 100)` by default. Adjust in `src/battlepass.ts`.

## Creator Payouts

Export pending payouts:

```bash
curl http://localhost:4000/admin/payouts/export > payouts.csv
```

This aggregates all creator revenue from `revenue_records` table.

## Production Checklist

- [ ] Replace `x-user-id` header auth with proper JWT/session
- [ ] Add authentication to `/admin/payouts/export`
- [ ] Set up Stripe Connect for automatic creator payouts
- [ ] Add KYC/verification for creators
- [ ] Implement refund handling
- [ ] Add audit logging
- [ ] Set up monitoring and error tracking
- [ ] Configure CORS properly for production
- [ ] Use environment-specific database URLs
- [ ] Enable HTTPS

## Notes

- The current auth uses `x-user-id` header for demo purposes. Replace with proper authentication in production.
- Revenue splits are configurable in `src/revenue.ts`
- Battle pass level formula is in `src/battlepass.ts`
- All timestamps use `TIMESTAMPTZ` for timezone-aware storage

