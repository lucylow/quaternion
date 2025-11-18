// src/edge/admin/payouts.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Admin endpoint to export creator payout data as CSV
 * Note: Admin auth should be enforced upstream
 */
export async function GET() {
  try {
    // admin auth should be enforced upstream
    const rows: any[] = await prisma.$queryRaw`
      SELECT r.creator_id, c.name as creator_name, SUM(r.creator_cents) as total_creator_cents
      FROM "RevenueRecord" r
      JOIN "Creator" c ON c.id = r.creator_id
      WHERE r.creator_cents > 0
      GROUP BY r.creator_id, c.name
    `;
    // build CSV string
    const csv = ['creator_id,creator_name,amount_cents', ...rows.map(r => `${r.creator_id},${r.creator_name},${r.total_creator_cents}`)].join('\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="payouts.csv"'
      }
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

