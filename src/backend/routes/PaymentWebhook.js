// src/backend/routes/PaymentWebhook.js
const express = require('express');
const Stripe = require('stripe');
const { PlayerInventory } = require('../models/PlayerInventory.js');
const { BattlePass } = require('../models/BattlePass.js');

const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * Stripe webhook endpoint
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return res.sendStatus(400);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`Webhook processing error: ${error.message}`);
    res.sendStatus(500);
  }
});

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent) {
  const { playerId, productType, productId } = paymentIntent.metadata;

  console.log(
    `Payment succeeded for player ${playerId}: ${productType} - ${productId}`
  );

  // Grant reward based on product type
  switch (productType) {
    case 'cosmetic':
      const inventory = new PlayerInventory(playerId);
      await inventory.addCosmetic(productId);
      console.log(`Cosmetic ${productId} granted to ${playerId}`);
      break;

    case 'battle_pass':
      const battlePass = new BattlePass(playerId, productId);
      await battlePass.activate();
      console.log(`Battle pass ${productId} activated for ${playerId}`);
      break;

    case 'seasonal_pass':
      // Handle seasonal pass activation
      console.log(`Seasonal pass activated for ${playerId}`);
      break;

    case 'coaching':
      // Coaching is handled separately with scheduling
      console.log(`Coaching package ${productId} purchased by ${playerId}`);
      break;

    case 'tournament_entry':
      // Tournament entry is handled in tournament registration
      console.log(`Tournament entry ${productId} registered for ${playerId}`);
      break;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
  const { playerId, productType, productId } = paymentIntent.metadata;

  console.error(
    `Payment failed for player ${playerId}: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
  );

  // Send notification to player
  // TODO: Implement player notification system
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdate(subscription) {
  console.log(`Subscription updated: ${subscription.id}`);
  // Handle plan changes, upgrades, downgrades
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(subscription) {
  console.log(`Subscription cancelled: ${subscription.id}`);
  // Revoke benefits, remove access
}

/**
 * Handle refund
 */
async function handleRefund(charge) {
  console.log(`Refund processed: ${charge.id}`);
  // Update player records, adjust inventory
}

module.exports = router;

