// src/edge/create-checkout.ts
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-11-13' });

/**
 * Create a Stripe Checkout session quickly from the edge (only minimal metadata).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, itemSku, creatorCode } = body;
    if (!userId || !itemSku) {
      return new Response(JSON.stringify({ error: 'missing fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const item = await prisma.item.findUnique({ where: { sku: itemSku } });
    if (!item) {
      return new Response(JSON.stringify({ error: 'item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: item.currency,
          product_data: { name: item.name, metadata: { sku: item.sku } },
          unit_amount: item.priceCents
        },
        quantity: 1
      }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/purchase/cancel`,
      metadata: { userId, itemId: item.id, creatorCode: creatorCode || '' }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
}

