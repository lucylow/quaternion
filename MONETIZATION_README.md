# Quaternion Monetization System

A comprehensive monetization system for Quaternion game with Stripe integration, supporting cosmetics, battle passes, seasonal passes, coaching services, and esports tournaments.

## Features

### 1. **Cosmetic Shop**
- Unit skins, base skins, UI elements, victory effects, voice packs
- Price range: $1.99 - $9.99
- Rarity system: Uncommon, Rare, Epic, Legendary

### 2. **Battle Pass System**
- Standard Pass ($9.99) - 50 rewards, 3 months
- Premium Pass ($19.99) - 100 rewards, 3 months
- Yearly Pass ($49.99) - 400 rewards, 12 months
- XP-based progression with level-up rewards

### 3. **Seasonal Ranked Pass**
- $14.99 per season
- NFT badge minting (optional blockchain integration)
- Competitive leaderboards
- Seasonal rankings and ratings

### 4. **Coaching Services**
- Intro Session ($19.99) - 30 minutes
- Advanced Strategy ($49.99) - 60 minutes
- Pro Package ($149.99) - 4 sessions
- Elite Package ($299.99) - 8 sessions + tournament coaching
- Twilio video integration for live sessions

### 5. **Esports Tournaments**
- Weekly Clash ($2.99 entry) - $1,000 prize pool
- Monthly Championship ($9.99 entry) - $5,000 prize pool
- World Finals ($24.99 entry) - $50,000 prize pool
- Automated bracket generation and prize distribution

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `stripe` - Payment processing
- `uuid` - Transaction IDs
- `ethers` - Blockchain/NFT support (optional)
- `twilio` - Video coaching (optional)
- `@stripe/stripe-js` & `@stripe/react-stripe-js` - Frontend Stripe integration

### 2. Environment Variables

Create a `.env` file with:

```env
# Stripe Configuration (Required)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Stripe Price IDs for Subscriptions (Optional)
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_ELITE_YEARLY=price_...

# Supabase (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key

# Blockchain/NFT (Optional)
NFT_CONTRACT_ADDRESS=0x...
BLOCKCHAIN_RPC_URL=https://...
PRIVATE_KEY=0x...

# Twilio (Optional - for coaching)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_API_KEY=SK...
TWILIO_API_SECRET=...
TWILIO_PHONE_NUMBER=+1...

# Base URL
BASE_URL=http://localhost:3000
```

### 3. Database Migration

Run the migration to create all monetization tables:

```bash
# If using Supabase CLI
supabase migration up

# Or manually run the SQL file
psql -h your-db-host -U postgres -d quaternion -f supabase/migrations/20240101000000_monetization_tables.sql
```

### 4. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Set up webhook endpoint: `https://your-domain.com/api/payments/webhook`
4. Configure webhook to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`

## API Endpoints

### Customer Management
- `POST /api/monetization/init-customer` - Initialize Stripe customer

### Cosmetics
- `GET /api/monetization/shop/cosmetics` - Get cosmetics catalog
- `POST /api/monetization/shop/purchase-cosmetic` - Initiate purchase
- `POST /api/monetization/shop/confirm-cosmetic-purchase` - Confirm purchase

### Battle Pass
- `GET /api/monetization/battle-pass` - Get battle pass options
- `POST /api/monetization/battle-pass/purchase` - Purchase battle pass
- `POST /api/monetization/battle-pass/activate` - Activate battle pass

### Seasonal Pass
- `POST /api/monetization/seasonal-pass/purchase` - Purchase seasonal pass
- `POST /api/monetization/seasonal-pass/activate` - Activate and mint NFT

### Coaching
- `GET /api/monetization/coaching` - Get coaching options
- `POST /api/monetization/coaching/book` - Book coaching session
- `POST /api/monetization/coaching/confirm-booking` - Confirm booking

### Tournaments
- `GET /api/monetization/tournaments` - Get tournaments
- `POST /api/monetization/tournaments/enter` - Enter tournament
- `POST /api/monetization/tournaments/confirm-entry` - Confirm entry

### Subscriptions
- `GET /api/monetization/subscription/status/:playerId` - Get subscription status
- `POST /api/monetization/subscription/cancel` - Cancel subscription

### Webhooks
- `POST /api/payments/webhook` - Stripe webhook endpoint

## Frontend Routes

- `/shop` - Cosmetic shop
- `/checkout` - Payment checkout page
- `/battle-pass` - Battle pass shop

## Usage Example

### Purchasing a Cosmetic

```typescript
// 1. Initialize customer (first time only)
await fetch('/api/monetization/init-customer', {
  method: 'POST',
  body: JSON.stringify({
    playerId: 'player_123',
    email: 'player@example.com',
    username: 'PlayerName'
  })
});

// 2. Purchase cosmetic
const response = await fetch('/api/monetization/shop/purchase-cosmetic', {
  method: 'POST',
  body: JSON.stringify({
    playerId: 'player_123',
    cosmeticId: 'cosmic_unit_skin'
  })
});

const { clientSecret } = await response.json();

// 3. Redirect to checkout with clientSecret
window.location.href = `/checkout?clientSecret=${clientSecret}&amount=4.99&type=cosmetic&id=cosmic_unit_skin`;
```

## Architecture

### Backend Structure

```
src/backend/
├── services/
│   └── StripePaymentService.js    # Core payment processing
├── models/
│   ├── PlayerInventory.js          # Cosmetics management
│   ├── BattlePass.js               # Battle pass system
│   ├── SeasonalPass.js             # Seasonal rankings & NFTs
│   ├── CoachingService.js          # Coaching bookings
│   └── EsportsTournament.js         # Tournament management
├── controllers/
│   └── MonetizationController.js   # API endpoints
└── routes/
    └── PaymentWebhook.js            # Stripe webhook handler
```

### Frontend Components

```
src/components/monetization/
├── CosmeticShop.tsx      # Cosmetic shop UI
├── CheckoutPage.tsx      # Stripe checkout
└── BattlePassShop.tsx    # Battle pass UI
```

## Database Schema

Key tables:
- `player_cosmetics` - Player-owned cosmetics
- `battle_passes` - Active battle passes
- `battle_pass_rewards` - Battle pass reward tracking
- `seasonal_rankings` - Competitive rankings
- `seasonal_nft_badges` - NFT badge records
- `coaching_bookings` - Coaching sessions
- `tournament_registrations` - Tournament entries
- `tournament_matches` - Match results
- `prize_distributions` - Prize payouts

## Testing

### Test Mode

Use Stripe test mode keys:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

### Local Testing

1. Start the server: `npm start`
2. Visit `/shop` to browse cosmetics
3. Use test card numbers for payments
4. Check Stripe Dashboard for payment events

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures
2. **Environment Variables**: Never commit API keys
3. **Customer Validation**: Verify player ownership before granting rewards
4. **Payment Confirmation**: Always confirm payments server-side
5. **Rate Limiting**: Implement rate limiting on payment endpoints

## Optional Features

### Blockchain/NFT Integration
- Configure `NFT_CONTRACT_ADDRESS` and `BLOCKCHAIN_RPC_URL`
- NFT badges will be minted on purchase
- Works without blockchain (uses mock NFTs)

### Twilio Video Coaching
- Configure Twilio credentials
- Enables live video coaching sessions
- Works without Twilio (uses mock rooms)

## Support

For issues or questions:
1. Check Stripe Dashboard for payment logs
2. Review server logs for errors
3. Verify environment variables are set
4. Ensure database migrations are applied

## License

Part of the Quaternion game project.

