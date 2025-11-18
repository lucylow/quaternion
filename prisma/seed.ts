// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.creator.createMany({
    data: [
      { id: '00000000-0000-0000-0000-000000000001', name: 'Default Creator', paymentAddr: null },
    ],
    skipDuplicates: true
  });

  await prisma.item.createMany({
    data: [
      { sku: 'cosmetic_alpha', name: 'Alpha Skin', priceCents: 499, currency: 'usd', type: 'cosmetic', metadata: { rarity: 'rare' } },
      { sku: 'battlepass_season_1', name: 'Battle Pass — Season 1', priceCents: 999, currency: 'usd', type: 'battlepass' }
    ],
    skipDuplicates: true
  });

  await prisma.creatorCode.create({
    data: { code: 'CREATOR123', creatorId: '00000000-0000-0000-0000-000000000001', pctShare: 0.30 }
  }).catch(() => {
    // Ignore if already exists
  });

  console.log('✅ Seeded database');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

