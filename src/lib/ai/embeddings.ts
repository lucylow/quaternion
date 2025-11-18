// src/lib/ai/embeddings.ts
/**
 * Create and query embeddings stored in Postgres ai_embeddings (pgvector).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createEmbedding(text: string): Promise<number[]> {
  // call OpenAI embeddings (or your provider)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: text
    })
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Embedding API error: ${resp.status} ${txt}`);
  }

  const j = await resp.json();
  const vector = j.data[0].embedding;
  return vector;
}

export async function storeEmbedding(key: string, namespace: string, text: string, metadata: any = {}) {
  const vec = await createEmbedding(text);
  // store using Prisma raw (prisma doesn't natively write vector type)
  const vectorStr = `ARRAY[${vec.join(',')}]::vector`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO ai_embeddings (key, namespace, embedding, metadata) VALUES($1, $2, ${vectorStr}, $3)`,
    key,
    namespace,
    JSON.stringify(metadata)
  );
}

export async function findSimilar(text: string, k = 4) {
  const vec = await createEmbedding(text);
  // Postgres nearest neighbors; use raw query
  const vectorStr = `ARRAY[${vec.join(',')}]::vector`;
  const rows = await prisma.$queryRawUnsafe(
    `SELECT key, metadata, created_at FROM ai_embeddings ORDER BY embedding <-> ${vectorStr} LIMIT ${k}`
  );
  return rows;
}

