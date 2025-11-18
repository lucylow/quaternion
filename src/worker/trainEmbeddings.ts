// src/worker/trainEmbeddings.ts
/**
 * Background worker to process recent games and store embeddings for replay search.
 */
import { PrismaClient } from '@prisma/client';
import { storeEmbedding } from '../lib/ai/embeddings.js';

const prisma = new PrismaClient();

/**
 * Finds recent game logs or AI decision dumps and stores embeddings to power "similar games" lookup.
 */
async function runOnce() {
  try {
    // 1) select recent completed games/logs (assume table 'game_logs' with 'transcript' column)
    // Note: This assumes you have a game_logs table. If not, you'll need to create it or adapt this.
    const logs: any[] = await prisma.$queryRaw`
      SELECT id, transcript 
      FROM game_logs 
      WHERE indexed IS NULL 
      LIMIT 200
    `.catch(() => {
      // If table doesn't exist, return empty array
      console.warn('game_logs table not found, skipping embedding training');
      return [];
    });

    for (const row of logs) {
      const text = row.transcript;
      if (!text) continue;

      try {
        await storeEmbedding(
          `replay:${row.id}`,
          'replays',
          text,
          { source: 'game_log', replayId: row.id }
        );
        await prisma.$executeRawUnsafe(
          `UPDATE game_logs SET indexed = now() WHERE id = $1`,
          row.id
        );
      } catch (e) {
        console.error('embedding error for row', row.id, e);
      }
    }
    console.log('✅ Worker finished processing embeddings');
  } catch (e) {
    console.error('❌ Worker error:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runOnce().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { runOnce };

