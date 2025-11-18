# Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Create .env File

Create a `.env` file in the `server/` directory with:

```env
PORT=4000
DATABASE_URL=postgres://postgres:password@localhost:5432/quaternion
JWT_SECRET=replace_with_a_real_secret
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
BASE_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
```

**Important:** Replace all placeholder values with your actual credentials.

## 3. Setup Database

### Option A: Using psql

```bash
psql $DATABASE_URL -f src/models.sql
```

### Option B: Using a database client

1. Connect to your PostgreSQL database
2. Run the contents of `src/models.sql`

**Note:** If `gen_random_uuid()` doesn't work, run:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 4. Seed Test Data (Optional)

```bash
psql $DATABASE_URL -f src/seed.sql
```

This creates:
- Example items (cosmetics, battle pass, currency)
- Test creators
- Creator codes
- Battle pass reward items

## 5. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## 6. Test the API

```bash
# Test checkout creation (replace USER_ID with actual user ID)
curl -X POST http://localhost:4000/api/shop/create-checkout \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{"itemSku": "cosmetic_skin_001", "creatorCode": "GAMINGPRO"}'
```

## Stripe Webhook Testing (Local)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:4000/webhooks/stripe`
4. Copy the webhook secret (starts with `whsec_`) to your `.env` file

## Frontend Integration

Set the API base URL in your frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

Then use the hooks:

```tsx
import { usePurchases } from '@/hooks/usePurchases';
import ShopButton from '@/components/ShopButton';
```

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database exists: `psql -l`

### Stripe Webhook Errors

- Verify `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe CLI or dashboard
- Ensure webhook endpoint uses raw body (already configured in server.ts)

### TypeScript Errors

- Run `npm install` to ensure all types are installed
- Check `tsconfig.json` is correct

### Port Already in Use

- Change `PORT` in `.env` to a different port
- Or kill the process using port 4000

