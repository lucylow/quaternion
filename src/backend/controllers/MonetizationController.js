// src/backend/controllers/MonetizationController.js
const express = require('express');
const { StripePaymentService } = require('../services/StripePaymentService.js');
const { PlayerInventory } = require('../models/PlayerInventory.js');
const { BattlePass } = require('../models/BattlePass.js');
const { SeasonalPass } = require('../models/SeasonalPass.js');
const { CoachingService } = require('../models/CoachingService.js');
const { EsportsTournament } = require('../models/EsportsTournament.js');

const router = express.Router();
const stripeService = new StripePaymentService();

/**
 * Initialize customer account
 */
router.post('/init-customer', async (req, res) => {
  try {
    const { playerId, email, username } = req.body;

    const customer = await stripeService.createCustomer(playerId, {
      email,
      username
    });

    res.json({
      success: true,
      stripeCustomerId: customer.id,
      message: 'Customer account initialized'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get cosmetic items catalog
 */
router.get('/shop/cosmetics', async (req, res) => {
  try {
    const cosmetics = [
      {
        id: 'cosmic_unit_skin',
        name: 'Cosmic Warrior',
        description: 'Ethereal blue unit skin with particle effects',
        price: 4.99,
        category: 'unit_skin',
        rarity: 'rare',
        preview: '/cosmetics/cosmic-warrior.png'
      },
      {
        id: 'inferno_base_skin',
        name: 'Inferno Base',
        description: 'Fiery red base with lava effects',
        price: 7.99,
        category: 'building_skin',
        rarity: 'epic',
        preview: '/cosmetics/inferno-base.png'
      },
      {
        id: 'golden_rank_border',
        name: 'Golden Rank Border',
        description: 'Exclusive golden border for ranked profile',
        price: 2.99,
        category: 'profile_cosmetic',
        rarity: 'rare',
        preview: '/cosmetics/golden-border.png'
      },
      {
        id: 'neon_cursor',
        name: 'Neon Cursor',
        description: 'Glowing neon mouse cursor in-game',
        price: 1.99,
        category: 'ui_cosmetic',
        rarity: 'uncommon',
        preview: '/cosmetics/neon-cursor.png'
      },
      {
        id: 'hologram_victory_effect',
        name: 'Hologram Victory Effect',
        description: 'Holographic victory animation',
        price: 9.99,
        category: 'victory_effect',
        rarity: 'legendary',
        preview: '/cosmetics/hologram-victory.png'
      },
      {
        id: 'ai_commander_voice',
        name: 'AI Commander Voice Pack',
        description: 'Custom AI commander voice with personality',
        price: 5.99,
        category: 'voice_pack',
        rarity: 'epic',
        preview: '/cosmetics/voice-pack.png'
      }
    ];

    res.json({ cosmetics });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Purchase cosmetic item
 */
router.post('/shop/purchase-cosmetic', async (req, res) => {
  try {
    const { playerId, cosmeticId } = req.body;

    // Get cosmetic details
    const cosmeticMap = {
      'cosmic_unit_skin': { name: 'Cosmic Warrior', price: 4.99 },
      'inferno_base_skin': { name: 'Inferno Base', price: 7.99 },
      'golden_rank_border': { name: 'Golden Rank Border', price: 2.99 },
      'neon_cursor': { name: 'Neon Cursor', price: 1.99 },
      'hologram_victory_effect': { name: 'Hologram Victory Effect', price: 9.99 },
      'ai_commander_voice': { name: 'AI Commander Voice Pack', price: 5.99 }
    };

    const cosmetic = cosmeticMap[cosmeticId];
    if (!cosmetic) {
      return res.status(404).json({ error: 'Cosmetic not found' });
    }

    // Create payment intent
    const payment = await stripeService.processOneTimePayment(
      playerId,
      cosmetic.price,
      'cosmetic',
      cosmeticId
    );

    res.json({
      clientSecret: payment.clientSecret,
      paymentIntentId: payment.paymentIntentId,
      amount: payment.amount,
      cosmeticId
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Confirm cosmetic purchase
 */
router.post('/shop/confirm-cosmetic-purchase', async (req, res) => {
  try {
    const { playerId, paymentIntentId } = req.body;

    const confirmation = await stripeService.confirmPayment(paymentIntentId, playerId);

    // Add cosmetic to player inventory
    const inventory = new PlayerInventory(playerId);
    await inventory.addCosmetic(confirmation.productId);

    res.json({
      success: true,
      cosmetic: confirmation.productId,
      message: 'Cosmetic unlocked!',
      transactionId: confirmation.transactionId
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get battle pass tiers and pricing
 */
router.get('/battle-pass', async (req, res) => {
  try {
    const battlePasses = [
      {
        id: 'standard_pass',
        name: 'Standard Battle Pass',
        price: 9.99,
        duration: '3 months',
        rewards: 50,
        description: 'Access to all seasonal rewards',
        benefits: [
          'Unlock 50 unique cosmetics',
          'Earn XP boosters',
          'Exclusive weapon skins',
          'Profile badges'
        ]
      },
      {
        id: 'premium_pass',
        name: 'Premium Battle Pass',
        price: 19.99,
        duration: '3 months',
        rewards: 100,
        description: 'Full seasonal experience with exclusive perks',
        benefits: [
          'Unlock all 100 cosmetics',
          'Exclusive AI personalities',
          'Double XP events',
          'Tournament entry fee waived',
          'Personal coach session'
        ]
      },
      {
        id: 'yearly_pass',
        name: 'Yearly Pass',
        price: 49.99,
        duration: '12 months',
        rewards: 400,
        description: 'Full year of premium content',
        benefits: [
          'All cosmetics year-round',
          'Unlimited AI personality changes',
          '4x monthly XP events',
          'Free tournament entries',
          'Monthly coach sessions',
          'Exclusive yearly cosmetics'
        ]
      }
    ];

    res.json({ battlePasses });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Purchase battle pass
 */
router.post('/battle-pass/purchase', async (req, res) => {
  try {
    const { playerId, passType } = req.body;

    const priceMap = {
      'standard_pass': 9.99,
      'premium_pass': 19.99,
      'yearly_pass': 49.99
    };

    const price = priceMap[passType];
    if (!price) {
      return res.status(404).json({ error: 'Invalid pass type' });
    }

    const payment = await stripeService.processOneTimePayment(
      playerId,
      price,
      'battle_pass',
      passType
    );

    res.json({
      clientSecret: payment.clientSecret,
      paymentIntentId: payment.paymentIntentId,
      amount: payment.amount,
      passType
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Activate battle pass after purchase
 */
router.post('/battle-pass/activate', async (req, res) => {
  try {
    const { playerId, paymentIntentId, passType } = req.body;

    const confirmation = await stripeService.confirmPayment(paymentIntentId, playerId);

    const battlePass = new BattlePass(playerId, passType);
    await battlePass.activate();

    res.json({
      success: true,
      passType,
      activatedAt: new Date(),
      expiresAt: battlePass.getExpirationDate(),
      rewards: battlePass.getTotalRewards(),
      message: 'Battle pass activated!'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Seasonal ranked pass with NFT badges
 */
router.post('/seasonal-pass/purchase', async (req, res) => {
  try {
    const { playerId, season } = req.body;

    const payment = await stripeService.processOneTimePayment(
      playerId,
      14.99,
      'seasonal_pass',
      `season_${season}`
    );

    res.json({
      clientSecret: payment.clientSecret,
      paymentIntentId: payment.paymentIntentId,
      amount: 14.99,
      season
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Confirm seasonal pass and mint NFT badge
 */
router.post('/seasonal-pass/activate', async (req, res) => {
  try {
    const { playerId, paymentIntentId, season } = req.body;

    const confirmation = await stripeService.confirmPayment(paymentIntentId, playerId);

    const seasonalPass = new SeasonalPass(playerId, season);
    const nftBadge = await seasonalPass.mintNFTBadge();

    res.json({
      success: true,
      season,
      nftBadge: {
        contractAddress: nftBadge.contractAddress,
        tokenId: nftBadge.tokenId,
        metadata: nftBadge.metadata
      },
      message: 'Seasonal pass activated with NFT badge!'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get coaching options
 */
router.get('/coaching', async (req, res) => {
  try {
    const coachingOptions = [
      {
        id: 'intro_session',
        name: 'Intro Session',
        duration: 30,
        price: 19.99,
        description: 'First-time coaching introduction',
        includes: [
          '30-minute video call',
          'Game replay analysis',
          'Beginner build orders',
          'Personalized tips'
        ]
      },
      {
        id: 'advanced_session',
        name: 'Advanced Strategy',
        duration: 60,
        price: 49.99,
        description: 'In-depth strategic coaching',
        includes: [
          '60-minute video call',
          'Multiple replay analysis',
          'Advanced tactics',
          'AI counter-strategies',
          'Follow-up email'
        ]
      },
      {
        id: 'pro_package',
        name: 'Pro Package (4 Sessions)',
        duration: 240,
        price: 149.99,
        description: 'Complete pro-level development',
        includes: [
          '4x 60-minute sessions',
          'Tournament preparation',
          'Build order optimization',
          'Team strategy planning',
          'Dedicated coach',
          'Priority scheduling'
        ]
      },
      {
        id: 'elite_package',
        name: 'Elite Package (8 Sessions + Tournament)',
        duration: 480,
        price: 299.99,
        description: 'Path to competitive play',
        includes: [
          '8x 60-minute sessions',
          'Full tournament coaching',
          'Team management',
          'Sponsorship guidance',
          'Career consultation',
          'Exclusive AI coach personality'
        ]
      }
    ];

    res.json({ coachingOptions });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Book coaching session
 */
router.post('/coaching/book', async (req, res) => {
  try {
    const { playerId, coachingPackage, preferredTime } = req.body;

    const priceMap = {
      'intro_session': 19.99,
      'advanced_session': 49.99,
      'pro_package': 149.99,
      'elite_package': 299.99
    };

    const price = priceMap[coachingPackage];
    if (!price) {
      return res.status(404).json({ error: 'Invalid coaching package' });
    }

    const payment = await stripeService.processOneTimePayment(
      playerId,
      price,
      'coaching',
      coachingPackage
    );

    res.json({
      clientSecret: payment.clientSecret,
      paymentIntentId: payment.paymentIntentId,
      amount: price,
      coachingPackage,
      preferredTime
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Confirm coaching booking
 */
router.post('/coaching/confirm-booking', async (req, res) => {
  try {
    const { playerId, paymentIntentId, coachingPackage, preferredTime } = req.body;

    const confirmation = await stripeService.confirmPayment(paymentIntentId, playerId);

    const coaching = new CoachingService(playerId, coachingPackage);
    const booking = await coaching.scheduleSession(preferredTime);

    res.json({
      success: true,
      bookingId: booking.id,
      coachId: booking.coachId,
      scheduledTime: booking.scheduledTime,
      joinUrl: booking.joinUrl,
      message: 'Coaching session booked!'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get esports tournaments
 */
router.get('/tournaments', async (req, res) => {
  try {
    const tournaments = [
      {
        id: 'weekly_clash',
        name: 'Weekly Clash',
        entryFee: 2.99,
        prizePool: 1000,
        participants: 64,
        schedule: 'Every Friday 8PM UTC',
        tier: 'open',
        rewards: [
          { place: 1, prize: 500 },
          { place: 2, prize: 300 },
          { place: 3, prize: 200 }
        ]
      },
      {
        id: 'monthly_championship',
        name: 'Monthly Championship',
        entryFee: 9.99,
        prizePool: 5000,
        participants: 32,
        schedule: 'Last Sunday of month',
        tier: 'competitive',
        rewards: [
          { place: 1, prize: 2500 },
          { place: 2, prize: 1500 },
          { place: 3, prize: 1000 }
        ]
      },
      {
        id: 'world_finals',
        name: 'World Finals',
        entryFee: 24.99,
        prizePool: 50000,
        participants: 16,
        schedule: 'Quarterly invitational',
        tier: 'elite',
        rewards: [
          { place: 1, prize: 25000 },
          { place: 2, prize: 15000 },
          { place: 3, prize: 10000 }
        ]
      }
    ];

    res.json({ tournaments });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Enter tournament
 */
router.post('/tournaments/enter', async (req, res) => {
  try {
    const { playerId, tournamentId } = req.body;

    const tournamentMap = {
      'weekly_clash': 2.99,
      'monthly_championship': 9.99,
      'world_finals': 24.99
    };

    const entryFee = tournamentMap[tournamentId];
    if (!entryFee) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const payment = await stripeService.processOneTimePayment(
      playerId,
      entryFee,
      'tournament_entry',
      tournamentId
    );

    res.json({
      clientSecret: payment.clientSecret,
      paymentIntentId: payment.paymentIntentId,
      amount: entryFee,
      tournamentId
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Confirm tournament entry
 */
router.post('/tournaments/confirm-entry', async (req, res) => {
  try {
    const { playerId, paymentIntentId, tournamentId } = req.body;

    const confirmation = await stripeService.confirmPayment(paymentIntentId, playerId);

    const tournament = new EsportsTournament(tournamentId);
    const entry = await tournament.registerPlayer(playerId);

    res.json({
      success: true,
      tournamentId,
      registrationId: entry.registrationId,
      bracket: entry.bracket,
      startTime: tournament.getStartTime(),
      message: 'Tournament entry confirmed!'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get player subscription status
 */
router.get('/subscription/status/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    const billing = await stripeService.getCustomerBilling(playerId);

    res.json({
      customerId: billing.customerId,
      email: billing.email,
      activeSubscriptions: billing.activeSubscriptions,
      pastInvoices: billing.invoices.slice(0, 10)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Cancel subscription
 */
router.post('/subscription/cancel', async (req, res) => {
  try {
    const { subscriptionId, playerId } = req.body;

    const cancellation = await stripeService.cancelSubscription(subscriptionId, playerId);

    res.json({
      success: true,
      subscriptionId: cancellation.subscriptionId,
      status: cancellation.status,
      cancelledAt: cancellation.cancelledAt
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

