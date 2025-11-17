// src/backend/services/StripePaymentService.js
const Stripe = require('stripe');
const { v4: uuidv4 } = require('uuid');

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

class StripePaymentService {
  constructor() {
    this.transactions = new Map();
    this.subscriptions = new Map();
    this.customers = new Map();
  }

  /**
   * Create Stripe customer for a player
   */
  async createCustomer(playerId, playerData) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
      }
      const customer = await stripe.customers.create({
        email: playerData.email,
        metadata: {
          playerId,
          username: playerData.username,
          gameId: 'quaternion'
        },
        description: `Quaternion Player: ${playerData.username}`
      });

      this.customers.set(playerId, {
        stripeCustomerId: customer.id,
        email: customer.email,
        created: new Date(),
        metadata: customer.metadata
      });

      return customer;
    } catch (error) {
      console.error('Failed to create Stripe customer:', error);
      throw new Error('Payment initialization failed');
    }
  }

  /**
   * Process one-time payment for cosmetics, battle pass, etc.
   */
  async processOneTimePayment(playerId, amount, productType, productId) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
      }
      const customer = this.customers.get(playerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: customer.stripeCustomerId,
        metadata: {
          playerId,
          productType, // 'cosmetic', 'battle_pass', 'rank_badge', 'coaching'
          productId,
          timestamp: Date.now().toString()
        },
        description: `Quaternion ${productType}: ${productId}`
      });

      this.transactions.set(paymentIntent.id, {
        transactionId: uuidv4(),
        paymentIntentId: paymentIntent.id,
        playerId,
        amount,
        productType,
        productId,
        status: 'pending',
        createdAt: new Date()
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        productType,
        productId
      };
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }

  /**
   * Confirm payment and grant rewards
   */
  async confirmPayment(paymentIntentId, playerId) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
      }
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment not completed');
      }

      const transaction = this.transactions.get(paymentIntentId);
      if (!transaction || transaction.playerId !== playerId) {
        throw new Error('Transaction mismatch');
      }

      transaction.status = 'completed';
      transaction.completedAt = new Date();

      return {
        success: true,
        transactionId: transaction.transactionId,
        productType: transaction.productType,
        productId: transaction.productId,
        amount: transaction.amount
      };
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      throw error;
    }
  }

  /**
   * Create subscription for recurring charges (seasonal pass, premium membership)
   */
  async createSubscription(playerId, planId, billingCycle = 'monthly') {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
      }
      const customer = this.customers.get(playerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const priceMap = {
        'premium_monthly': process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
        'pro_monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
        'elite_yearly': process.env.STRIPE_PRICE_ELITE_YEARLY
      };

      const priceId = priceMap[`${planId}_${billingCycle}`];
      if (!priceId) {
        throw new Error('Invalid price ID');
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.stripeCustomerId,
        items: [{ price: priceId }],
        metadata: {
          playerId,
          planId,
          gameId: 'quaternion'
        },
        billing_cycle_anchor: Math.floor(Date.now() / 1000)
      });

      this.subscriptions.set(subscription.id, {
        subscriptionId: subscription.id,
        playerId,
        planId,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        createdAt: new Date()
      });

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        planId
      };
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, playerId) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
      }
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription || subscription.playerId !== playerId) {
        throw new Error('Subscription not found');
      }

      const cancelled = await stripe.subscriptions.del(subscriptionId);

      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();

      return {
        subscriptionId,
        status: cancelled.status,
        cancelledAt: new Date()
      };
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      throw error;
    }
  }

  /**
   * Retrieve customer balance and transaction history
   */
  async getCustomerBilling(playerId) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
      }
      const customer = this.customers.get(playerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const invoices = await stripe.invoices.list({
        customer: customer.stripeCustomerId,
        limit: 50
      });

      const subscriptions = await stripe.subscriptions.list({
        customer: customer.stripeCustomerId
      });

      return {
        customerId: customer.stripeCustomerId,
        email: customer.email,
        invoices: invoices.data.map(inv => ({
          id: inv.id,
          amount: inv.amount_paid / 100,
          status: inv.status,
          date: new Date(inv.created * 1000),
          description: inv.description
        })),
        activeSubscriptions: subscriptions.data.map(sub => ({
          id: sub.id,
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          plan: sub.items.data[0]?.price?.metadata?.planName || 'unknown'
        }))
      };
    } catch (error) {
      console.error('Failed to retrieve billing info:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentIntentId, amount = null) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
      }
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined
      });

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100
      };
    } catch (error) {
      console.error('Refund processing failed:', error);
      throw error;
    }
  }
}

module.exports = { StripePaymentService };

