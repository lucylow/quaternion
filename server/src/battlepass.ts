// battlepass.ts - Battle pass progression helpers
import { query } from './db.js';

export async function awardXp(userId: string, xp: number) {
  const r = await query(
    `INSERT INTO battlepass_progress(user_id, xp, level, last_updated) 
     VALUES($1, $2, $3, now()) 
     ON CONFLICT (user_id) 
     DO UPDATE SET 
       xp = battlepass_progress.xp + $2, 
       level = floor((battlepass_progress.xp + $2) / 100), 
       last_updated = now() 
     RETURNING xp, level`,
    [userId, xp, Math.floor(xp / 100)]
  );
  return r.rows[0];
}

export async function getBattlepassProgress(userId: string) {
  const r = await query('SELECT * FROM battlepass_progress WHERE user_id=$1', [userId]);
  return r.rowCount ? r.rows[0] : null;
}

