// src/edge/entitlements.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fast endpoint to check and return entitlements for a user.
 * Runs at edge, minimal DB work.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    if (!userId) {
      return new Response(JSON.stringify({ error: 'missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const entitlements = await prisma.entitlement.findMany({
      where: { userId },
      include: { item: true }
    });

    return new Response(JSON.stringify({ entitlements }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    // Prisma on edge: avoid leaving connections open
    await prisma.$disconnect();
  }
}

